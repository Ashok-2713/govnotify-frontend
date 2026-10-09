import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Bell, Calendar, Bookmark, FileText, User, CheckCircle2, Settings,
  HelpCircle, Search, ChevronRight, Briefcase, Send, TrendingUp, Clock, ArrowRight,
  Award, ExternalLink, X, Menu, ChevronDown, ShieldCheck, Building2,
  Globe, Landmark, Building, BarChart3, LogOut, Sparkles, RefreshCw,
  ClipboardCheck, Bot
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function daysLeft(dateStr) {
  if (!dateStr) return 30;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / 864e5);
  return diff > 0 ? diff : 0;
}

// Helper: A job is considered "active" if its deadline has not yet passed.
// If lastDate is missing, treat the job as active (assume it's still open).
const isActiveJob = (job) => {
  if (!job || !job.lastDate) return true;
  const lastDate = new Date(job.lastDate);
  if (isNaN(lastDate.getTime())) return true; // Invalid date → treat as active
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastDate);
  last.setHours(0, 0, 0, 0);
  return last >= today;
};

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Helper: Format date into month abbreviation and day number
const formatDateBadge = (dateStr) => {
  if (!dateStr) return { month: "TBD", day: "—", valid: false };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { month: "TBD", day: "—", valid: false };
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    valid: true
  };
};

// Helper: Compute days until a given date
const daysUntil = (dateStr) => {
  if (!dateStr) return "TBD";
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return "TBD";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
};

function getMonthAbbr(dateStr) {
  return formatDateBadge(dateStr).month;
}

function getDayNum(dateStr) {
  return String(formatDateBadge(dateStr).day);
}

function getOrgLogo(stateName, organization, title) {
  const str = `${stateName || ''} ${organization || ''} ${title || ''}`.toLowerCase();
  if (str.includes("railway") || str.includes("rrb") || str.includes("ntpc")) return "/logos/railway.png";
  if (str.includes("ssc") || str.includes("staff selection")) return "/logos/ssc.png";
  if (str.includes("upsc") || str.includes("union public service")) return "/logos/upsc.png";
  if (str.includes("post") || str.includes("dak")) return "/logos/post.png";
  if (str.includes("tamil nadu") || str.includes("tnpsc")) return "/logos/tamilnadu.png";
  if (str.includes("karnataka") || str.includes("kpsc") || str.includes("kea")) return "/logos/karnataka.png";
  if (str.includes("kerala")) return "/logos/kerala.png";
  if (str.includes("andhra") || str.includes("appsc")) return "/logos/andhra.png";
  if (str.includes("telangana") || str.includes("tspsc")) return "/logos/telangana.png";
  if (str.includes("central") || str.includes("india") || str.includes("govt")) return "/logos/central.png";
  return null;
}

const JobLogo = ({ url, organization, state, title }) => {
  const orgLogo = getOrgLogo(state, organization, title);
  const getDomain = (u) => {
    if (!u) return null;
    try { return new URL(u).hostname; } catch { return null; }
  };
  const domain = getDomain(url);
  const sources = useMemo(() => [
    orgLogo,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    domain ? `https://logo.clearbit.com/${domain}` : null,
    null
  ].filter(Boolean), [orgLogo, domain]);

  const [stage, setStage] = useState(0);
  const currentSrc = sources[stage] || null;
  const handleError = () => { if (stage < sources.length - 1) setStage(prev => prev + 1); };

  if (!currentSrc) {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #2563eb)',
        color: '#ffffff', display: 'grid', placeItems: 'center',
        fontWeight: 800, fontSize: 16, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {organization?.charAt(0) || state?.charAt(0) || '?'}
      </div>
    );
  }

  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: '#ffffff', border: '1.5px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 3, flexShrink: 0, overflow: 'hidden'
    }}>
      <img src={currentSrc} alt={organization || state || "Seal"} onError={handleError}
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%', imageRendering: '-webkit-optimize-contrast' }} />
    </div>
  );
};


export default function UserDashboard({
  userEmail = "ashok.udhay@govnotify.in",
  onLogout,
  onProfileClick,
  onEligibilityClick,
  onSavedJobsClick,
  onJobNotificationsClick,
  onUpcomingJobsClick,
  onAppliedJobsClick,
  onExamCalendarClick,
  onSettingsClick,
  onHelpClick,
  appliedEligibilityFilter = null,
  onClearEligibilityFilter
}) {
  const [jobs, setJobs] = useState([]);
  const [eligibilityFilter, setEligibilityFilter] = useState(appliedEligibilityFilter || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState("All");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedEduFilter, setSelectedEduFilter] = useState("All");
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const toastTimerRef = useRef(null);

  const showNotification = (message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastNotification({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 4000);

    // Also trigger instant browser popup dialog asynchronously so DOM renders first
    setTimeout(() => {
      try {
        alert(message);
      } catch (e) {
        console.log(message);
      }
    }, 10);
  };

  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! I'm GovNotify AI Assistant 🤖. Ask me about jobs, deadlines, eligibility, notifications, or any government job info. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fetchAllJobs = () => {
    fetch(`${API_BASE}/api/jobs?scope=active`)
      .then(res => res.ok ? res.text() : "")
      .then(text => text ? JSON.parse(text) : [])
      .then(data => { if (Array.isArray(data)) setJobs(data); })
      .catch(err => console.error("API Error:", err));
  };

  const loadSavedJobs = () => {
    if (!userEmail) return;
    fetch(`${API_BASE}/api/saved-jobs/list/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setSavedJobs(data);
          setSavedCount(data.length);
        }
      })
      .catch(err => console.error("Error loading saved jobs:", err));
  };

  const loadAppliedJobs = () => {
    if (!userEmail) return;
    fetch(`${API_BASE}/api/applied-jobs/list/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setAppliedCount(data.length);
        }
      })
      .catch(err => console.error("Error loading applied jobs count:", err));
  };

  const loadJobsAndProfile = () => {
    // ALWAYS fetch from /api/jobs/all and show all jobs by default
    // Does NOT automatically read localStorage.getItem("eligibilityProfile") or auto-filter
    fetchAllJobs();
  };

  useEffect(() => {
    if (appliedEligibilityFilter) {
      setEligibilityFilter(appliedEligibilityFilter);
      if (appliedEligibilityFilter.jobs && Array.isArray(appliedEligibilityFilter.jobs)) {
        setJobs(appliedEligibilityFilter.jobs);
      } else {
        fetch(`${API_BASE}/api/eligibility/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, ...appliedEligibilityFilter })
        })
          .then(res => res.ok ? res.json() : [])
          .then(data => { if (Array.isArray(data)) setJobs(data); else fetchAllJobs(); })
          .catch(() => fetchAllJobs());
      }
    } else {
      setEligibilityFilter(null);
      fetchAllJobs();
    }
  }, [appliedEligibilityFilter, userEmail]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const emailQuery = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const res = await fetch(`${API_BASE}/api/notifications/unread-count${emailQuery}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          ...(userEmail ? { "X-User-Email": userEmail } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(typeof data.count === "number" ? data.count : 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const handleBellClick = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${API_BASE}/api/notifications/mark-as-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          ...(userEmail ? { "X-User-Email": userEmail } : {})
        },
        body: JSON.stringify({ email: userEmail })
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    } finally {
      setUnreadCount(0);
      if (onJobNotificationsClick) {
        onJobNotificationsClick();
      }
    }
  };

  useEffect(() => {
    loadJobsAndProfile();
    loadSavedJobs();
    loadAppliedJobs();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleClearFilter = () => {
    setEligibilityFilter(null);
    if (onClearEligibilityFilter) {
      onClearEligibilityFilter();
    }
    fetchAllJobs();
  };

  const activeCurrentJobs = useMemo(() => {
    return jobs.filter(j => {
      if (j.status && (j.status === 'CLOSED' || j.status === 'ARCHIVED')) return false;
      return isActiveJob(j);
    });
  }, [jobs]);

  const newJobsCount = useMemo(() => {
    return jobs.filter(job => (job.isNew !== undefined ? job.isNew : true) && isActiveJob(job)).length;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return activeCurrentJobs.filter(j => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.organization && j.organization.toLowerCase().includes(q)) ||
        (j.state && j.state.toLowerCase().includes(q));
      const matchState = selectedStateFilter === "All" || j.state === selectedStateFilter;
      const matchCat = selectedCategoryFilter === "All" || j.category === selectedCategoryFilter || j.organization === selectedCategoryFilter;
      const matchEdu = selectedEduFilter === "All" || (j.qualification && j.qualification.toLowerCase().includes(selectedEduFilter.toLowerCase()));
      return matchSearch && matchState && matchCat && matchEdu;
    });
  }, [activeCurrentJobs, searchQuery, selectedStateFilter, selectedCategoryFilter, selectedEduFilter]);

  const displayJobs = useMemo(() => {
    return showAllJobs ? filteredJobs : filteredJobs.slice(0, 4);
  }, [filteredJobs, showAllJobs]);

  const upcomingExams = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return jobs
      .filter(job => {
        if (job.status === 'CLOSED' || job.status === 'ARCHIVED') return false;
        const d = job.examDate || job.lastDate;
        if (!d) {
          return job.status === 'UPCOMING';
        }
        const target = new Date(d);
        if (isNaN(target.getTime())) return false;
        target.setHours(0, 0, 0, 0);
        return target >= today;
      })
      .sort((a, b) => {
        const dateA = a.examDate || a.lastDate;
        const dateB = b.examDate || b.lastDate;
        if (dateA && dateB) return new Date(dateA) - new Date(dateB);
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      })
      .slice(0, 4);
  }, [jobs]);

  const handleSendMessage = (textToSend) => {
    const msgText = (textToSend || chatInput).trim();
    if (!msgText) return;
    const userMsgObj = { id: Date.now(), sender: "user", text: msgText };
    setChatMessages(prev => [...prev, userMsgObj]);
    if (!textToSend) setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      const q = msgText.toLowerCase();
      let matchedJobs = [];
      let botResponseText = "";
      if (q.includes("tnpsc") || q.includes("tamil nadu")) {
        matchedJobs = activeCurrentJobs.filter(j => (j.state === "Tamil Nadu" || j.title.includes("TNPSC")));
        botResponseText = "Here are the latest active TNPSC & Tamil Nadu government jobs:";
      } else if (q.includes("karnataka") || q.includes("kpsc") || q.includes("kea")) {
        matchedJobs = activeCurrentJobs.filter(j => (j.state === "Karnataka" || j.title.includes("KEA")));
        botResponseText = "Here are the latest Karnataka government job notifications:";
      } else if (q.includes("kerala") || q.includes("psc")) {
        matchedJobs = activeCurrentJobs.filter(j => (j.state === "Kerala"));
        botResponseText = "Here are the active Kerala PSC job recruitments:";
      } else if (q.includes("closing") || q.includes("soon") || q.includes("deadline")) {
        matchedJobs = activeCurrentJobs.filter(j => daysLeft(j.lastDate) <= 7);
        botResponseText = "Here are the government jobs closing soon this week:";
      } else {
        matchedJobs = activeCurrentJobs.filter(j => j.title.toLowerCase().includes(q) || j.organization?.toLowerCase().includes(q) || j.state?.toLowerCase().includes(q));
        botResponseText = matchedJobs.length > 0
          ? `I found ${matchedJobs.length} active job notification(s) matching "${msgText}":`
          : `I couldn't find any active jobs matching "${msgText}". Try searching for TNPSC, KEA, Police, Kerala PSC, or jobs closing soon.`;
      }
      const botMsgObj = { id: Date.now() + 1, sender: "bot", text: botResponseText, jobs: matchedJobs.slice(0, 3) };
      setChatMessages(prev => [...prev, botMsgObj]);
      setIsTyping(false);
    }, 600);
  };

  // PART 1: Optimistic UI implementation for saving jobs
  const handleSave = (job) => {
    if (!job) return;
    const email = userEmail || "default@example.com";
    const jobTitle = job.title || job.postTitle || "Government Job";
    const organization = job.organization || "Government Department";
    const lastDate = job.lastDate ? String(job.lastDate) : "N/A";
    const officialApplyUrl = job.officialApplyUrl || job.sourceUrl || "";

    // Check if job is already saved
    const isAlreadySaved = savedJobs.some(
      sj => (sj.jobTitle && sj.jobTitle.toLowerCase() === jobTitle.toLowerCase()) ||
            (sj.id && job.id && String(sj.id) === String(job.id))
    );

    if (isAlreadySaved) {
      showNotification("Job is already saved in your list.", "info");
      return;
    }

    // 1. Snapshot previous state for rollback on error
    const previousSavedJobs = [...savedJobs];
    const previousSavedCount = savedCount;

    // 2. Optimistically update local state immediately (within 100ms)
    const optimisticJob = {
      id: `temp-${Date.now()}`,
      userEmail: email,
      jobTitle: jobTitle,
      organization: organization,
      lastDate: lastDate,
      officialApplyUrl: officialApplyUrl,
      savedAt: new Date().toISOString()
    };

    setSavedJobs(prev => [...prev, optimisticJob]);
    setSavedCount(prev => prev + 1);

    // 3. Immediately trigger success notification popup (within 100ms)
    const successMsg = "✅ Job saved successfully! Email notification sent.";
    showNotification(successMsg, "success");

    // 4. Send API request to backend in background (fire and forget)
    fetch(`${API_BASE}/api/saved-jobs/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        jobTitle: jobTitle,
        organization: organization,
        lastDate: lastDate,
        officialApplyUrl: officialApplyUrl
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const msg = await res.text();
      if (msg.includes("already saved")) {
        // Rollback optimistic state if backend indicates already saved
        setSavedJobs(previousSavedJobs);
        setSavedCount(previousSavedCount);
      } else {
        // Background sync to update temporary ID with real database ID
        loadSavedJobs();
      }
    })
    .catch((err) => {
      // 5. Error handling: Revert UI change and show error notification
      console.error("Background save job failed, reverting UI:", err);
      setSavedJobs(previousSavedJobs);
      setSavedCount(previousSavedCount);
      showNotification("❌ Failed to save job. Reverted changes.", "error");
    });
  };

  const saveJob = handleSave;

  // Helper to extract user full name from localStorage or sessionStorage
  const resolveStoredName = () => {
    try {
      // 1. Check user object in localStorage or sessionStorage (e.g. { fullName, name, userName })
      const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.fullName && u.fullName.trim()) return u.fullName.trim();
        if (u.name && u.name.trim()) return u.name.trim();
        if (u.userName && u.userName.trim()) return u.userName.trim();
      }

      // 2. Check candidateName, fullName, or userName directly stored in localStorage
      const directCandidateName = localStorage.getItem("candidateName");
      if (directCandidateName && directCandidateName.trim()) return directCandidateName.trim();

      const directFullName = localStorage.getItem("fullName");
      if (directFullName && directFullName.trim()) return directFullName.trim();

      const directName = localStorage.getItem("name") || localStorage.getItem("userName");
      if (directName && directName.trim()) return directName.trim();

      // 3. Check profile objects
      const rawProf = localStorage.getItem("userProfile") || localStorage.getItem("eligibilityProfile");
      if (rawProf) {
        const p = JSON.parse(rawProf);
        if (p.fullName && p.fullName.trim()) return p.fullName.trim();
        if (p.candidateName && p.candidateName.trim()) return p.candidateName.trim();
        if (p.name && p.name.trim()) return p.name.trim();
      }
    } catch (e) {
      console.warn("Could not read user name from storage:", e);
    }
    return "";
  };

  const [displayName, setDisplayName] = useState(() => resolveStoredName());

  // Fetch full name from backend profile/settings if not already in storage
  useEffect(() => {
    const stored = resolveStoredName();
    if (stored) {
      setDisplayName(stored);
      return;
    }

    if (userEmail) {
      fetch(`${API_BASE}/api/user/settings?email=${encodeURIComponent(userEmail)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.fullName && data.fullName.trim()) {
            setDisplayName(data.fullName.trim());
            try {
              localStorage.setItem("candidateName", data.fullName.trim());
            } catch (err) {}
          }
        })
        .catch(err => console.log("Profile name fetch err:", err));
    }
  }, [userEmail]);

  const userName = useMemo(() => {
    if (displayName && displayName.trim()) return displayName.trim();
    // Graceful fallback to user's email
    return userEmail || "User";
  }, [displayName, userEmail]);

  const currentDateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  }, []);

  return (
    <div className="pro-dash-root light">
      <style>{DASHBOARD_CSS}</style>

      {/* ── OPTIMISTIC TOAST NOTIFICATION ── */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toastNotification.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'modalPop 0.2s ease-out'
        }}>
          <span>{toastNotification.message}</span>
          <button
            onClick={() => setToastNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: '2px'
            }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── BACKDROP FOR MOBILE MENU ── */}
      {mobileMenuOpen && (
        <div
          className="pro-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`pro-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="pro-sidebar-brand">
          <div className="brand-logo-text">
            <div className="pro-brand-logo"><Landmark size={22} color="#ffffff" /></div>
            <div><h2>GOVNOTIFY</h2><span>Government Job Portal</span></div>
          </div>
          <button className="pro-sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="pro-nav-menu">
          <button className={`pro-nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "notifications" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onJobNotificationsClick && onJobNotificationsClick(); }}>
            <Bell size={18} /><span>Job Notifications</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "upcoming" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onUpcomingJobsClick && onUpcomingJobsClick(); }}>
            <Calendar size={18} /><span>Upcoming Jobs</span>
          </button>
          {/* ⭐ SAVED JOBS — Navigates to dedicated page */}
          <button className={`pro-nav-link ${activeTab === "saved" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onSavedJobsClick && onSavedJobsClick(); }}>
            <Bookmark size={18} /><span>Saved Jobs</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "applied" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onAppliedJobsClick && onAppliedJobsClick(); }}>
            <Send size={18} /><span>Applied Jobs</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "calendar" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onExamCalendarClick && onExamCalendarClick(); }}>
            <Calendar size={18} /><span>Exam Calendar</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "profile" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onProfileClick && onProfileClick(); }}>
            <User size={18} /><span>Profile</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "eligibility" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onEligibilityClick && onEligibilityClick(); }}>
            <CheckCircle2 size={18} /><span>Eligibility Checker</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "settings" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onSettingsClick && onSettingsClick(); }}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className={`pro-nav-link ${activeTab === "help" ? "active" : ""}`} onClick={() => { setMobileMenuOpen(false); onHelpClick && onHelpClick(); }}>
            <HelpCircle size={18} /><span>Help &amp; Support</span>
          </button>
        </nav>

        <div className="pro-sidebar-cta">
          <h4>Never Miss an Update!</h4>
          <p>Enable push notifications and get instant alerts for new jobs.</p>
          <button className="pro-enable-btn" onClick={() => alert("Push Notifications Enabled!")}>
            <Bell size={14} /> Enable Notifications
          </button>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ── */}
      <div className="pro-main-wrapper">
        <header className="pro-top-header">
          <div className="header-left">
            <button className="icon-btn menu-toggle" onClick={() => setMobileMenuOpen(p => !p)} aria-label="Toggle navigation">
              <Menu size={20} />
            </button>
            <div className="mobile-header-brand">
              <Landmark size={20} color="#10b981" />
              <span>GOVNOTIFY</span>
            </div>
            <div className="header-search">
              <Search size={16} className="search-ico" />
              <input type="text" placeholder="Search for jobs, departments, exams..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <div className="header-right">
            <button
              className="icon-btn notif-btn"
              onClick={handleBellClick}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: "50%",
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <div className="user-profile-menu" onClick={onProfileClick}>
              <div className="avatar-circle"><User size={18} color="#ffffff" /></div>
              <div className="user-info"><strong>{userName}</strong><small>View Profile</small></div>
              <ChevronDown size={14} className="dropdown-ico" />
            </div>
            <button className="icon-btn logout-header-btn" onClick={onLogout} title="Logout" aria-label="Logout">
              <LogOut size={18} color="#ef4444" />
            </button>
          </div>
        </header>

        <main className="pro-dash-body">
          <section className="pro-welcome-banner">
            <div className="welcome-text">
              <h1>Welcome back, {userName}! 👋</h1>
              <p>Find the best government job opportunities across India</p>
            </div>
            <div className="date-widget-card">
              <div className="cal-ico-box"><Calendar size={20} color="#10b981" /></div>
              <div>
                <strong>Today is {currentDateFormatted}</strong>
                <small>Stay updated and achieve your dreams! 🚀</small>
              </div>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="pro-kpi-grid">
            <div className="pro-kpi-card blue">
              <div className="kpi-header">
                <div className="kpi-ico-box blue"><Briefcase size={22} color="#2563eb" /></div>
                <TrendingUp size={18} className="trend-ico blue" />
              </div>
              <div className="kpi-content">
                <h2>{newJobsCount}</h2>
                <span className="kpi-title">New Jobs</span>
                <small className="kpi-sub">This Week</small>
              </div>
            </div>

            <div className="pro-kpi-card green" onClick={onSavedJobsClick} style={{ cursor: 'pointer' }} title="View Saved Jobs">
              <div className="kpi-header">
                <div className="kpi-ico-box green"><Bookmark size={22} color="#10b981" /></div>
                <TrendingUp size={18} className="trend-ico green" />
              </div>
              <div className="kpi-content">
                <h2>{savedCount}</h2>
                <span className="kpi-title">Saved Jobs</span>
                <small className="kpi-sub">Total Saved</small>
              </div>
            </div>

            <div className="pro-kpi-card purple" onClick={onAppliedJobsClick} style={{ cursor: 'pointer' }} title="View Applied Jobs">
              <div className="kpi-header">
                <div className="kpi-ico-box purple"><Send size={22} color="#8b5cf6" /></div>
                <TrendingUp size={18} className="trend-ico purple" />
              </div>
              <div className="kpi-content">
                <h2>{appliedCount}</h2>
                <span className="kpi-title">Applied Jobs</span>
                <small className="kpi-sub">Total Applied</small>
              </div>
            </div>

            <div className="pro-kpi-card orange" onClick={onUpcomingJobsClick} style={{ cursor: 'pointer' }} title="View Upcoming Jobs">
              <div className="kpi-header">
                <div className="kpi-ico-box orange"><Calendar size={22} color="#f97316" /></div>
                <TrendingUp size={18} className="trend-ico orange" />
              </div>
              <div className="kpi-content">
                <h2>{upcomingExams.length}</h2>
                <span className="kpi-title">Upcoming Exams</span>
                <small className="kpi-sub">This Month</small>
              </div>
            </div>
          </section>

          {/* Main Grid */}
          <div className="pro-main-grid">
            <section className="pro-card-panel jobs-panel">
              {eligibilityFilter && (
                <>
                  <div style={{
                    background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 16px",
                    borderRadius: "10px", fontSize: "12.5px", color: "#1e40af", marginBottom: "16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px"
                  }}>
                    <span>🎯 Showing jobs matching your profile: {eligibilityFilter.qualification || 'Any'}, {eligibilityFilter.age ? eligibilityFilter.age + ' yrs' : 'Any age'}, {eligibilityFilter.state || 'All'}, {eligibilityFilter.category || 'All'}</span>
                    <button onClick={handleClearFilter} style={{
                      background: "#fee2e2", color: "#b91c1c", fontSize: "11px", fontWeight: "700",
                      padding: "5px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                      marginLeft: "12px", whiteSpace: "nowrap"
                    }}>Clear Filter</button>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px", fontStyle: "italic" }}>
                    ⚠️ Eligibility based on available data. Please verify the official notification before applying.
                  </div>
                </>
              )}

              <div className="panel-header">
                <h3>Latest Job Notifications</h3>
                <button className="link-btn" onClick={() => setShowAllJobs(prev => !prev)}>
                  {showAllJobs ? "Show Less ↑" : "View All →"}
                </button>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={36} color="#94a3b8" />
                  <p>No job notifications match your search.</p>
                </div>
              ) : (
                <div className="job-cards-list">
                  {displayJobs.map((job, idx) => {
                    const itemKey = job.id ? `job-${job.id}` : `job-${idx}-${job.title || 'untitled'}`;
                    return (
                      <div className="job-notification-card" key={itemKey}>
                        <div className="job-card-left">
                          <JobLogo url={job.officialApplyUrl} organization={job.organization} state={job.state} title={job.title} />
                          <div className="job-card-details">
                            <h4 onClick={() => setSelectedJobDetail(job)} title={job.title}>{job.title}</h4>
                            <p className="job-org-sub">{job.organization || "Government Department"}</p>
                            <div className="job-card-tags">
                              <span className="tag blue">{job.qualification || "Graduate"}</span>
                              <span className="tag green">{job.state || "Central Government"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="job-card-right">
                          <div className="date-badge-box">
                            <small>Last Date</small>
                            <strong className="red-date">{fmtDate(job.lastDate)}</strong>
                          </div>
                          <span className="badge-new-pill">New</span>
                          <div className="job-actions">
                            <button className="btn-save-sm" onClick={() => saveJob(job)} title="Save Job">
                              <Bookmark size={14} />
                            </button>
                            <button className="btn-view-sm" onClick={() => setSelectedJobDetail(job)} title="View Job Details">
                              View <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="pro-card-panel exams-panel">
              <div className="panel-header">
                <h3>Upcoming Exams</h3>
                <button className="link-btn" onClick={onExamCalendarClick || (() => setActiveTab("calendar"))}>View Calendar</button>
              </div>
              {upcomingExams.length === 0 ? (
                <div className="empty-exams-state">
                  <Calendar size={32} color="#94a3b8" />
                  <p>No upcoming exams at the moment.</p>
                </div>
              ) : (
                <div className="exams-list">
                  {upcomingExams.map((exam, idx) => {
                    const examKey = exam.id ? `exam-${exam.id}` : `exam-${idx}`;
                    const displayDate = exam.examDate || exam.lastDate || null;
                    const badge = formatDateBadge(displayDate);
                    const daysLabel = daysUntil(displayDate);
                    return (
                      <div className="exam-item-card" key={examKey}>
                        <div className="exam-date-box">
                          <span className="exam-month">{badge.month}</span>
                          <strong className="exam-day">{badge.day}</strong>
                        </div>
                        <div className="exam-details">
                          <h4>{exam.title}</h4>
                          <p>{exam.organization || "Government Organization"}</p>
                        </div>
                        <div className="exam-countdown-badge">
                          <span style={daysLabel === "TBD" ? { background: "#f1f5f9", color: "#64748b" } : (daysLabel === "Today" ? { background: "#fee2e2", color: "#b91c1c" } : (daysLabel === "Tomorrow" ? { background: "#ffedd5", color: "#c2410c" } : {}))}>
                            {daysLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {upcomingExams.length > 0 && (
                <div className="panel-footer-link">
                  <button className="view-all-exams-btn" onClick={onUpcomingJobsClick || (() => setActiveTab("calendar"))}>
                    View All Exams <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Bottom Cards Grid */}
          <section className="pro-bottom-cards-grid">
            <div className="pro-action-card">
              <div className="action-card-header">
                <div className="action-card-text">
                  <h3>Eligibility Checker</h3>
                  <p>Check your eligibility for various jobs</p>
                </div>
                <div className="action-card-illus green"><ClipboardCheck size={22} color="#10b981" /></div>
              </div>
              <button className="action-btn green-btn" onClick={onEligibilityClick}>Check Now</button>
            </div>

            {/* ⭐ SAVED JOBS CARD — Navigates to dedicated page */}
            <div className="pro-action-card">
              <div className="action-card-header">
                <div className="action-card-text">
                  <h3>Saved Jobs</h3>
                  <p>View and manage your saved job list</p>
                </div>
                <div className="action-card-illus orange"><Bookmark size={22} color="#f97316" /></div>
              </div>
              <button className="action-btn purple-btn" onClick={onSavedJobsClick}>View Saved Jobs</button>
            </div>

            <div className="pro-action-card profile-comp-card">
              <div className="action-card-header">
                <div className="action-card-text">
                  <h3>Profile Completion</h3>
                  <p>Complete your profile to get better job recommendations</p>
                </div>
                <div className="circular-progress-wrapper">
                  <svg className="progress-ring" width="56" height="56">
                    <circle className="progress-ring-bg" stroke="#e2e8f0" strokeWidth="5" fill="transparent" r="22" cx="28" cy="28" />
                    <circle className="progress-ring-fill" stroke="#10b981" strokeWidth="5" strokeDasharray="138.23" strokeDashoffset="27.64" strokeLinecap="round" fill="transparent" r="22" cx="28" cy="28" />
                  </svg>
                  <span className="progress-text">80%</span>
                </div>
              </div>
              <button className="action-btn green-btn" onClick={onProfileClick}>Complete Now</button>
            </div>
          </section>

          <section className="pro-bottom-strip">
            <div className="strip-left">
              <div className="bell-glow-icon"><Bell size={20} color="#10b981" /></div>
              <div>
                <strong>Stay Updated!</strong>
                <p>Turn on notifications to receive instant alerts for new job notifications, exam dates and results.</p>
              </div>
            </div>
            <button className="manage-notif-btn" onClick={() => alert("Notification preferences saved.")}>
              <Settings size={15} /> Manage Notifications
            </button>
          </section>
        </main>
      </div>

      {/* ── JOB DETAIL MODAL ── */}
      {selectedJobDetail && (
        <div className="gn-modal-overlay" onClick={() => setSelectedJobDetail(null)}>
          <div className="gn-modal-card" onClick={e => e.stopPropagation()}>
            <button className="gn-modal-close" onClick={() => setSelectedJobDetail(null)} title="Close Modal">
              <X size={20} />
            </button>
            <div className="modal-header-icon">
              <JobLogo url={selectedJobDetail.officialApplyUrl} organization={selectedJobDetail.organization} state={selectedJobDetail.state} title={selectedJobDetail.title} />
            </div>
            <h3>{selectedJobDetail.title}</h3>
            <p className="gn-modal-org">🏛️ {selectedJobDetail.organization || "Government Department"} (Official Portal)</p>

            <div className="gn-modal-details">
              <div className="detail-row"><span>State / Jurisdiction</span><strong>{selectedJobDetail.state || "Central Government"}</strong></div>
              <div className="detail-row"><span>Department / Organization</span><strong>{selectedJobDetail.organization || "Govt Dept"}</strong></div>
              <div className="detail-row"><span>Registration Start Date</span><strong>{fmtDate(selectedJobDetail.registrationStartDate)}</strong></div>
              <div className="detail-row"><span>Application Last Date</span><strong className="red-text">{fmtDate(selectedJobDetail.lastDate)}</strong></div>
            </div>

            <div className="gn-modal-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => saveJob(selectedJobDetail)}
                className="gn-modal-btn"
                style={{ background: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Bookmark size={16} /> Save Job
              </button>
              <a href={selectedJobDetail.officialApplyUrl || "#"} target="_blank" rel="noreferrer" className="gn-modal-btn">
                Apply on Official Portal <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const DASHBOARD_CSS = `
  :root {
    --sidebar-bg: #0b192c;
    --main-bg: #f8fafc;
    --card-bg: #ffffff;
    --text-dark: #0f172a;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    --emerald-primary: #10b981;
    --emerald-hover: #059669;
    --blue-accent: #2563eb;
    --purple-accent: #8b5cf6;
    --orange-accent: #f97316;
  }

  .pro-dash-root.dark {
    --sidebar-bg: #070e17;
    --main-bg: #0b1329;
    --card-bg: #111c38;
    --text-dark: #f8fafc;
    --text-muted: #94a3b8;
    --border-color: #1e293b;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

  .pro-dash-root { display: flex; min-height: 100vh; width: 100%; background-color: var(--main-bg); color: var(--text-dark); }

  .pro-sidebar { width: 250px; background-color: var(--sidebar-bg); color: #ffffff; display: flex; flex-direction: column; padding: 24px 16px; flex-shrink: 0; position: fixed; top: 0; bottom: 0; left: 0; z-index: 1000; overflow-y: auto; transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
  .pro-sidebar-brand { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 28px; padding: 0 8px; }
  .brand-logo-text { display: flex; align-items: center; gap: 12px; }
  .pro-sidebar-close { display: none; background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 6px; border-radius: 8px; transition: 0.2s; }
  .pro-sidebar-close:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }
  .pro-sidebar-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); z-index: 998; animation: fadeInBackdrop 0.2s ease; }
  @keyframes fadeInBackdrop { from { opacity: 0; } to { opacity: 1; } }
  .mobile-header-brand { display: none; align-items: center; gap: 8px; font-weight: 800; font-size: 16px; color: var(--text-dark); letter-spacing: 0.5px; }
  .menu-toggle { display: none; }
  .pro-brand-logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #047857); display: grid; place-items: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); flex-shrink: 0; }
  .pro-sidebar-brand h2 { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; margin: 0; color: #ffffff; line-height: 1; }
  .pro-sidebar-brand span { font-size: 10px; color: #94a3b8; display: block; margin-top: 2px; }

  .pro-nav-menu { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .pro-nav-link { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; background: transparent; border: none; color: #94a3b8; font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; transition: 0.2s ease; }
  .pro-nav-link:hover { color: #ffffff; background: rgba(255, 255, 255, 0.06); }
  .pro-nav-link.active { background: #2563eb; color: #ffffff; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }

  .pro-sidebar-cta { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 16px; margin-top: 20px; }
  .pro-sidebar-cta h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #ffffff; }
  .pro-sidebar-cta p { font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 12px; }
  .pro-enable-btn { width: 100%; background: #10b981; color: #0f172a; border: none; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; }
  .pro-enable-btn:hover { background: #059669; color: #ffffff; }

  .pro-main-wrapper { flex: 1; margin-left: 250px; display: flex; flex-direction: column; min-width: 0; }

  .pro-top-header { height: 68px; background-color: var(--card-bg); border-bottom: 1px solid var(--border-color); padding: 0 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; }
  .header-left { display: flex; align-items: center; gap: 16px; flex: 1; max-width: 500px; }
  .icon-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; border-radius: 8px; display: grid; place-items: center; position: relative; transition: 0.2s; }
  .icon-btn:hover { background: var(--main-bg); color: var(--text-dark); }

  .header-search { display: flex; align-items: center; background: var(--main-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 6px 16px; width: 100%; }
  .header-search .search-ico { color: var(--text-muted); margin-right: 10px; }
  .header-search input { border: none; outline: none; background: transparent; font-size: 13px; color: var(--text-dark); width: 100%; }

  .header-right { display: flex; align-items: center; gap: 16px; }
  .notif-badge { position: absolute; top: 4px; right: 4px; background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; }
  .theme-btn { background: transparent; border: none; cursor: pointer; padding: 6px; }
  .user-profile-menu { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 10px; transition: 0.2s; }
  .user-profile-menu:hover { background: var(--main-bg); }
  .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); display: grid; place-items: center; }
  .user-info strong { display: block; font-size: 13px; font-weight: 700; color: var(--text-dark); line-height: 1.1; }
  .user-info small { font-size: 10.5px; color: var(--text-muted); }
  .dropdown-ico { color: var(--text-muted); }

  .pro-dash-body { padding: 28px; display: flex; flex-direction: column; gap: 24px; }

  .pro-welcome-banner { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .welcome-text h1 { font-size: 24px; font-weight: 800; color: var(--text-dark); margin-bottom: 4px; }
  .welcome-text p { font-size: 13.5px; color: var(--text-muted); }
  .date-widget-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 12px 18px; display: flex; align-items: center; gap: 12px; }
  .cal-ico-box { width: 38px; height: 38px; border-radius: 10px; background: #ffffff; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15); }
  .date-widget-card strong { display: block; font-size: 12.5px; font-weight: 700; color: #065f46; }
  .date-widget-card small { font-size: 11px; color: #047857; }

  .pro-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .pro-kpi-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); transition: 0.2s ease; }
  .pro-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); }
  .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .kpi-ico-box { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; }
  .kpi-ico-box.blue { background: #dbeafe; }
  .kpi-ico-box.green { background: #dcfce7; }
  .kpi-ico-box.purple { background: #f3e8ff; }
  .kpi-ico-box.orange { background: #ffedd5; }
  .trend-ico.blue { color: #2563eb; }
  .trend-ico.green { color: #10b981; }
  .trend-ico.purple { color: #8b5cf6; }
  .trend-ico.orange { color: #f97316; }
  .kpi-content h2 { font-size: 28px; font-weight: 800; color: var(--text-dark); margin: 0 0 2px; line-height: 1; }
  .kpi-title { font-size: 13px; font-weight: 700; color: var(--text-dark); margin-right: 6px; }
  .kpi-sub { font-size: 11px; color: var(--text-muted); }

  .pro-main-grid { display: grid; grid-template-columns: 1.75fr 1fr; gap: 20px; align-items: start; }
  .pro-card-panel { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
  .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .panel-header h3 { font-size: 16px; font-weight: 800; color: var(--text-dark); }
  .link-btn { background: transparent; border: none; color: #2563eb; font-weight: 700; font-size: 12.5px; cursor: pointer; transition: 0.2s; }
  .link-btn:hover { text-decoration: underline; color: #1d4ed8; }

  .job-cards-list { display: flex; flex-direction: column; gap: 10px; }
  .job-notification-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); gap: 12px; transition: 0.2s; }
  .job-notification-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .job-card-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .job-card-details { flex: 1; min-width: 0; }
  .job-card-details h4 { font-size: 14px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .job-card-details h4:hover { color: #2563eb; }
  .job-org-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .job-card-tags { display: flex; gap: 6px; }
  .tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  .tag.blue { background: #dbeafe; color: #1d4ed8; }
  .tag.green { background: #dcfce7; color: #15803d; }
  .job-card-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; min-width: max-content; }
  .date-badge-box { text-align: right; }
  .date-badge-box small { display: block; font-size: 10px; color: var(--text-muted); }
  .red-date { font-size: 12px; color: #ef4444; font-weight: 700; }
  .badge-new-pill { background: #dbeafe; color: #2563eb; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
  .job-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .btn-save-sm { background: #f1f5f9; border: 1px solid var(--border-color); color: #475569; padding: 6px 9px; border-radius: 8px; cursor: pointer; display: grid; place-items: center; transition: 0.2s; }
  .btn-save-sm:hover { background: #10b981; color: #ffffff; border-color: #10b981; }
  .btn-view-sm { background: #2563eb; border: none; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0; transition: 0.2s; }
  .btn-view-sm:hover { background: #1d4ed8; }

  .exams-panel { display: flex; flex-direction: column; }
  .exams-list { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .exam-item-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); gap: 10px; }
  .exam-date-box { width: 44px; height: 46px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .exam-month { font-size: 9.5px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; }
  .exam-day { font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1; }
  .exam-details { flex: 1; min-width: 0; }
  .exam-details h4 { font-size: 13px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .exam-details p { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .exam-countdown-badge span { background: #dcfce7; color: #15803d; font-size: 10.5px; font-weight: 700; padding: 4px 8px; border-radius: 12px; white-space: nowrap; }
  .panel-footer-link { margin-top: 14px; text-align: right; }
  .view-all-exams-btn { background: none; border: none; color: #2563eb; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
  .view-all-exams-btn:hover { text-decoration: underline; }

  .pro-bottom-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; width: 100%; margin-top: 24px; margin-bottom: 20px; }
  .pro-action-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); min-height: 150px; }
  .action-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
  .action-card-text { flex: 1; min-width: 0; }
  .action-card-text h3 { font-size: 14px; font-weight: 700; color: var(--text-dark); margin-bottom: 4px; }
  .action-card-text p { font-size: 12px; color: var(--text-muted); line-height: 1.35; }
  .action-btn { align-self: flex-start; padding: 7px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
  .action-btn.green-btn { background: transparent; border: 1px solid #10b981; color: #10b981; }
  .action-btn.green-btn:hover { background: #10b981; color: #ffffff; }
  .action-btn.blue-btn { background: #2563eb; border: none; color: #ffffff; }
  .action-btn.blue-btn:hover { background: #1d4ed8; }
  .action-btn.purple-btn { background: transparent; border: 1px solid #8b5cf6; color: #8b5cf6; }
  .action-btn.purple-btn:hover { background: #8b5cf6; color: #ffffff; }
  .action-card-illus { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; }
  .action-card-illus.green { background: #dcfce7; }
  .action-card-illus.blue { background: #dbeafe; }
  .action-card-illus.orange { background: #ffedd5; }

  .circular-progress-wrapper { position: relative; width: 56px; height: 56px; display: grid; place-items: center; flex-shrink: 0; }
  .progress-ring { transform: rotate(-90deg); }
  .progress-text { position: absolute; font-size: 11px; font-weight: 800; color: var(--text-dark); }

  .pro-bottom-strip { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .strip-left { display: flex; align-items: center; gap: 14px; }
  .bell-glow-icon { width: 40px; height: 40px; border-radius: 10px; background: #dcfce7; display: grid; place-items: center; flex-shrink: 0; }
  .strip-left strong { display: block; font-size: 14px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; }
  .strip-left p { font-size: 12px; color: var(--text-muted); }
  .manage-notif-btn { background: transparent; border: 1px solid #10b981; color: #10b981; padding: 9px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
  .manage-notif-btn:hover { background: #10b981; color: #ffffff; }

  .gn-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 10000; }
  .gn-modal-card { position: relative; max-width: 550px; width: 90%; background: #ffffff; color: #0f172a; border-radius: 18px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); z-index: 10001; animation: modalPop 0.22s ease-out; }
  @keyframes modalPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
  .gn-modal-close { position: absolute; top: 16px; right: 16px; border: none; background: #f1f5f9; color: #64748b; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; transition: 0.2s; }
  .gn-modal-close:hover { background: #e2e8f0; color: #0f172a; }
  .modal-header-icon { margin-bottom: 16px; }
  .gn-modal-card h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1.3; }
  .gn-modal-org { color: #64748b; font-size: 13px; margin-bottom: 20px; }
  .gn-modal-details { display: flex; flex-direction: column; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .detail-row span { color: #64748b; font-weight: 500; }
  .detail-row strong { color: #0f172a; font-weight: 700; }
  .detail-row strong.red-text { color: #ef4444; }
  .gn-modal-actions { width: 100%; }
  .gn-modal-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-weight: 700; font-size: 14.5px; padding: 14px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); transition: 0.2s; }
  .gn-modal-btn:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4); }
  .empty-exams-state { text-align: center; padding: 30px 16px; color: var(--text-muted); font-size: 13px; }

  @media (min-width: 1025px) {
    .menu-toggle { display: none !important; }
    .pro-sidebar { transform: none !important; position: fixed !important; }
    .pro-sidebar-close { display: none !important; }
    .pro-sidebar-backdrop { display: none !important; }
    .mobile-header-brand { display: none !important; }
    .pro-main-wrapper { margin-left: 250px; }
  }

  @media (max-width: 1200px) {
    .pro-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 1024px) {
    .menu-toggle { display: grid; }
    .pro-sidebar { transform: translateX(-100%); width: 280px; max-width: 85vw; box-shadow: none; }
    .pro-sidebar.open { transform: translateX(0); box-shadow: 10px 0 35px rgba(0, 0, 0, 0.5); }
    .pro-sidebar-close { display: grid; place-items: center; }
    .pro-main-wrapper { margin-left: 0; width: 100%; max-width: 100vw; min-width: 0; }
    .pro-main-grid { grid-template-columns: 1fr; gap: 20px; }
    .pro-bottom-cards-grid { grid-template-columns: repeat(2, 1fr); }
    .pro-top-header { padding: 0 18px; }
    .pro-dash-body { padding: 20px 16px; }
  }

  @media (max-width: 768px) {
    .pro-top-header { height: auto; min-height: 60px; padding: 10px 14px; flex-wrap: wrap; gap: 10px; }
    .header-left { width: 100%; max-width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .menu-toggle { order: 1; }
    .mobile-header-brand { display: flex; order: 2; margin-right: auto; }
    .header-right { order: 3; margin-left: auto; gap: 6px; }
    .header-search { order: 4; width: 100%; max-width: 100%; margin-top: 2px; }
    .user-info { display: none; }
    .dropdown-ico { display: none; }
    .pro-dash-body { padding: 16px 12px; gap: 16px; }
    .pro-welcome-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
    .welcome-text h1 { font-size: 20px; }
    .welcome-text p { font-size: 12.5px; }
    .date-widget-card { width: 100%; }
    .pro-bottom-cards-grid { grid-template-columns: 1fr; gap: 12px; }
    .pro-bottom-strip { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px; }
    .manage-notif-btn { justify-content: center; width: 100%; }
  }

  @media (max-width: 580px) {
    .job-notification-card { flex-direction: column; align-items: stretch; gap: 10px; padding: 12px; }
    .job-card-left { width: 100%; }
    .job-card-details h4 { white-space: normal; word-break: break-word; font-size: 13.5px; line-height: 1.35; }
    .job-org-sub { white-space: normal; word-break: break-word; }
    .job-card-tags { flex-wrap: wrap; }
    .job-card-right { width: 100%; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 2px; min-width: 0; }
    .date-badge-box { text-align: left; }
    .job-actions { flex: 1; justify-content: flex-end; }
    .gn-modal-card { width: 95%; max-width: 95%; padding: 20px 16px; max-height: 85vh; overflow-y: auto; }
    .gn-modal-card h3 { font-size: 17px; }
    .gn-modal-details { padding: 12px; gap: 10px; }
    .detail-row { font-size: 12px; }
  }

  @media (max-width: 440px) {
    .pro-kpi-grid { grid-template-columns: 1fr; }
    .exam-item-card { flex-wrap: wrap; gap: 8px; }
    .exam-countdown-badge { width: 100%; text-align: right; }
  }
`;