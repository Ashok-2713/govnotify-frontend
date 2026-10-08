import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Mail,
  Bug,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Bookmark,
  Clock,
  Building2,
  Search,
  Bot,
  ExternalLink,
  Calendar,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileText,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import robotImg from "./assets/chatbot-robot.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Project-specific FAQs for GovNotify Government Job Portal
 */
const FAQ_LIST = [
  {
    id: 1,
    question: "How does the Eligibility Checker work?",
    answer:
      "The Eligibility Checker compares your profile (qualification, age, state, category) with the requirements of each job notification in our database. Only jobs where you meet the criteria are shown. Update your profile in Settings for the most accurate results."
  },
  {
    id: 2,
    question: "How often is the job data updated?",
    answer:
      "Our AI agent automatically fetches new job notifications every 6 hours from official government websites. You'll see the latest notifications on your dashboard with a red badge on the bell icon."
  },
  {
    id: 3,
    question: "How do I save a job and receive notifications?",
    answer:
      "Click the bookmark icon on any job card to save it. When new jobs match your interests, the bell icon at the top of the dashboard will show a red badge with the count of new notifications."
  },
  {
    id: 4,
    question: "Can I apply directly through GovNotify?",
    answer:
      "No. GovNotify is an aggregator. When you click \"Apply on Official Portal\", you'll be redirected to the official government website to complete your application. Always verify details on the official notification PDF."
  },
  {
    id: 5,
    question: "What if I don't see jobs from my state?",
    answer:
      "We currently cover Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, Telangana, and Central Government jobs (categorized into Railways, SSC, Banking, India Post, UPSC, and Other Central). If you don't see jobs from your state, we may not cover it yet — check the All Central section for jobs open to all states."
  },
  {
    id: 6,
    question: "How do I reset my password?",
    answer:
      "Click \"Forgot Password?\" on the login page. Enter your registered email, and we'll send you a 6-digit OTP. Enter the OTP to set a new password."
  },
  {
    id: 7,
    question: "How does the AI Assistant answer my questions?",
    answer:
      "The GovNotify AI Assistant uses an advanced language model to answer your questions about specific jobs, eligibility, salaries, application processes, and documents required. It pulls real data from our database to give you accurate answers — it will never make up information."
  }
];

const HelpSupport = ({
  userEmail = "ashok.udhay@govnotify.in",
  onBack,
  onEligibilityClick,
  onBrowseJobs,
  onViewCalendar,
  onSettingsClick,
  onExamCalendarClick,
  onNavigate
}) => {
  // Resolve candidate display name
  const candidateName = useMemo(() => {
    try {
      const stored = localStorage.getItem("candidateName");
      if (stored && stored.trim()) return stored.trim();
      const p = JSON.parse(localStorage.getItem("eligibilityProfile") || "{}");
      if (p.candidateName && p.candidateName.trim()) return p.candidateName.trim();
    } catch {}
    if (userEmail && userEmail.includes("@")) {
      const prefix = userEmail.split("@")[0].replace(/[0-9_.-]/g, " ").trim();
      if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Aspirant";
  }, [userEmail]);

  // Real KPI Stats States
  const [activeJobsCount, setActiveJobsCount] = useState(null);
  const [savedJobsCount, setSavedJobsCount] = useState(null);
  const [eligibleJobsCount, setEligibleJobsCount] = useState(null);
  const [upcomingDeadlinesCount, setUpcomingDeadlinesCount] = useState(null);
  const [loading, setLoading] = useState(true);

  // FAQ States
  const [expandedFaq, setExpandedFaq] = useState(1);
  const [faqSearch, setFaqSearch] = useState("");

  // Toggle FAQ accordion item
  const toggleFaq = (id) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  // Filtered FAQs based on user search query
  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_LIST;
    const q = faqSearch.toLowerCase();
    return FAQ_LIST.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  // ==========================================
  // FETCH REAL DATA FROM BACKEND ENDPOINTS
  // ==========================================
  const fetchRealData = async () => {
    setLoading(true);
    let jobsList = [];

    // 1. Fetch Active Job Notifications from /api/jobs/all
    try {
      const jobsRes = await fetch(`${API_BASE}/api/jobs/all`);
      if (jobsRes.ok) {
        const text = await jobsRes.text();
        const data = text ? JSON.parse(text) : [];
        if (Array.isArray(data)) {
          jobsList = data;
          setActiveJobsCount(data.length);

          // Compute Upcoming Deadlines (closing within next 30 days)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(today.getDate() + 30);
          thirtyDaysLater.setHours(23, 59, 59, 999);

          const deadlinesCount = data.filter((job) => {
            if (!job.lastDate) return false;
            const d = new Date(job.lastDate);
            return !isNaN(d.getTime()) && d >= today && d <= thirtyDaysLater;
          }).length;

          setUpcomingDeadlinesCount(deadlinesCount);
        } else {
          setActiveJobsCount("--");
          setUpcomingDeadlinesCount("--");
        }
      } else {
        setActiveJobsCount("--");
        setUpcomingDeadlinesCount("--");
      }
    } catch (err) {
      console.error("Error fetching jobs in Help & Support:", err);
      setActiveJobsCount("--");
      setUpcomingDeadlinesCount("--");
    }

    // 2. Fetch User's Saved Jobs count
    if (!userEmail) {
      setSavedJobsCount("Login required");
    } else {
      try {
        let count = null;
        const savedRes = await fetch(`${API_BASE}/api/saved-jobs/list/${encodeURIComponent(userEmail)}`);
        if (savedRes.ok) {
          const sData = await savedRes.json();
          if (Array.isArray(sData)) count = sData.length;
        } else {
          // Fallback to query parameter endpoint
          const savedRes2 = await fetch(`${API_BASE}/api/saved-jobs?email=${encodeURIComponent(userEmail)}`);
          if (savedRes2.ok) {
            const sData2 = await savedRes2.json();
            if (Array.isArray(sData2)) count = sData2.length;
          }
        }
        setSavedJobsCount(count !== null ? count : "--");
      } catch (err) {
        console.error("Error fetching saved jobs count:", err);
        setSavedJobsCount("--");
      }
    }

    // 3. Fetch Eligible Jobs count
    if (!userEmail) {
      setEligibleJobsCount("Login required");
    } else {
      try {
        let userProfile = null;
        try {
          const raw = localStorage.getItem("eligibilityProfile") || localStorage.getItem("userProfile");
          if (raw) userProfile = JSON.parse(raw);
        } catch {}

        if (!userProfile || (!userProfile.qualification && !userProfile.education)) {
          try {
            const pRes = await fetch(`${API_BASE}/api/eligibility/get-profile/${encodeURIComponent(userEmail)}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData && (pData.qualification || pData.education)) userProfile = pData;
            }
          } catch {}
        }

        if (userProfile && (userProfile.qualification || userProfile.education)) {
          const qual = userProfile.qualification || userProfile.education || "";
          const state = userProfile.state || "All";
          const category = userProfile.category || "All";
          const age = userProfile.age || "24";

          const eligRes = await fetch(`${API_BASE}/api/eligibility/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              qualification: qual,
              state,
              category,
              age: String(age)
            })
          });

          if (eligRes.ok) {
            const eligData = await eligRes.json();
            setEligibleJobsCount(Array.isArray(eligData) ? eligData.length : 0);
          } else {
            // Fallback: match qualification on active jobs
            const q = qual.toLowerCase();
            const matched = jobsList.filter(
              (j) => j.qualification && j.qualification.toLowerCase().includes(q)
            ).length;
            setEligibleJobsCount(matched);
          }
        } else {
          setEligibleJobsCount("Set up profile");
        }
      } catch (err) {
        console.error("Error calculating eligible jobs:", err);
        setEligibleJobsCount("--");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRealData();
  }, [userEmail]);

  // Navigation Handlers for Quick Actions & Getting Started Guide
  const handleBrowseJobs = () => {
    if (onBrowseJobs) onBrowseJobs();
    else if (onNavigate) onNavigate("notifications");
    else if (onBack) onBack();
  };

  const handleCheckEligibility = () => {
    if (onEligibilityClick) onEligibilityClick();
    else if (onNavigate) onNavigate("eligibility");
    else if (onBack) onBack();
  };

  const handleViewCalendar = () => {
    if (onViewCalendar) onViewCalendar();
    else if (onExamCalendarClick) onExamCalendarClick();
    else if (onNavigate) onNavigate("calendar");
    else if (onBack) onBack();
  };

  const handleSettings = () => {
    if (onSettingsClick) onSettingsClick();
    else if (onNavigate) onNavigate("settings");
    else if (onBack) onBack();
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@govnotify.in?subject=GovNotify%20Support%20Inquiry";
  };

  const handleReportBug = () => {
    window.location.href = "mailto:bugs@govnotify.in?subject=Bug%20Report";
  };

  const scrollToFaqs = () => {
    const el = document.getElementById("browse-faqs-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="gov-support-page">
      <style>{`
        /* ================= Page Root ================= */
        .gov-support-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          padding: 24px 32px 80px;
        }

        /* Top Bar Navigation */
        .support-top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .support-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        .support-back-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateX(-2px);
        }

        .user-tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          color: #065f46;
        }

        /* ================= Hero Support Banner ================= */
        .support-hero-banner {
          background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 55%, #ecfdf5 100%);
          border: 1px solid #bae6fd;
          border-radius: 20px;
          padding: 28px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.06);
        }
        .hero-banner-content {
          max-width: 650px;
          z-index: 2;
        }
        .hero-badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .hero-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .hero-subtitle {
          font-size: 14px;
          color: #475569;
          margin: 0 0 18px;
          line-height: 1.5;
        }
        .hero-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-primary-btn {
          background: #10b981;
          color: #ffffff;
          border: none;
          font-size: 13.5px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
        }
        .hero-primary-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .hero-secondary-btn {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .hero-secondary-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .hero-quote-badge {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 14px 20px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
          text-align: right;
          z-index: 2;
        }
        .hero-quote-text {
          font-size: 14px;
          font-weight: 800;
          color: #065f46;
          margin: 0 0 2px;
        }
        .hero-quote-sub {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        /* ================= 4 KPI STATS CARDS ================= */
        .stats-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 26px;
        }
        .kpi-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
        }
        .kpi-card.blue {
          background: linear-gradient(135deg, #ffffff 60%, #eff6ff 100%);
          border-color: #bfdbfe;
        }
        .kpi-card.green {
          background: linear-gradient(135deg, #ffffff 60%, #ecfdf5 100%);
          border-color: #bbf7d0;
        }
        .kpi-card.purple {
          background: linear-gradient(135deg, #ffffff 60%, #faf5ff 100%);
          border-color: #e9d5ff;
        }
        .kpi-card.orange {
          background: linear-gradient(135deg, #ffffff 60%, #fff7ed 100%);
          border-color: #fed7aa;
        }

        .kpi-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .kpi-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-icon-box.blue { background: #3b82f6; color: #ffffff; }
        .kpi-icon-box.green { background: #10b981; color: #ffffff; }
        .kpi-icon-box.purple { background: #8b5cf6; color: #ffffff; }
        .kpi-icon-box.orange { background: #f97316; color: #ffffff; }

        .kpi-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
        .kpi-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .kpi-value.small-text {
          font-size: 17px;
          color: #475569;
          font-weight: 700;
        }
        .kpi-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          z-index: 2;
        }
        .kpi-badge {
          font-size: 11.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .kpi-badge.blue { color: #2563eb; }
        .kpi-badge.green { color: #16a34a; }
        .kpi-badge.purple { color: #7c3aed; }
        .kpi-badge.orange { color: #ea580c; }

        /* ================= MAIN 2-COLUMN LAYOUT ================= */
        .main-two-column-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Left Column Cards */
        .content-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 24px 28px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
          margin-bottom: 24px;
        }

        .card-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .card-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .card-title-box h3 {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .card-tag {
          font-size: 11.5px;
          font-weight: 700;
          background: #eff6ff;
          color: #2563eb;
          padding: 3px 8px;
          border-radius: 12px;
        }

        /* ================= Getting Started Step-by-Step ================= */
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .step-row-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .step-row-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .step-number-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .step-info-body {
          flex: 1;
        }
        .step-title-line {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .step-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 8px;
          line-height: 1.45;
        }
        .step-action-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: 0.15s;
        }
        .step-action-btn:hover {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        /* ================= FAQ Accordion ================= */
        .faq-accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .faq-search-box {
          position: relative;
          width: 280px;
        }
        .faq-search-input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          background: #ffffff;
          transition: border-color 0.2s;
        }
        .faq-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }

        .faq-item-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 10px;
          overflow: hidden;
          background: #ffffff;
          transition: all 0.2s ease;
        }
        .faq-item-box.active {
          border-color: #10b981;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.08);
        }
        .faq-item-trigger {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 15px 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .faq-item-trigger:hover {
          background: #f8fafc;
        }
        .faq-item-answer {
          padding: 0 18px 16px;
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
          background: #fafcfb;
        }

        /* ================= Sidebar Column ================= */
        .sidebar-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 22px 20px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
          margin-bottom: 20px;
        }
        .sidebar-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quick-action-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }
        .quick-action-link:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateX(2px);
        }
        .action-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .action-label-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px;
        }
        .action-label-sub {
          font-size: 11.5px;
          color: #64748b;
          margin: 0;
        }

        /* AI Assistant Helper Card */
        .ai-assistant-card {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1px solid #a7f3d0;
          border-radius: 16px;
          padding: 20px;
        }
        .ai-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .ai-avatar-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
        }
        .ai-avatar-box img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }
        .ai-chip-item {
          background: #ffffff;
          border: 1px solid #a7f3d0;
          color: #065f46;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-chip-item:hover {
          background: #d1fae5;
          transform: translateX(2px);
        }

        @media (max-width: 1024px) {
          .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .main-two-column-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .gov-support-page { padding: 16px 16px 60px; }
          .stats-grid-4 { grid-template-columns: 1fr; }
          .support-hero-banner { padding: 20px; }
          .hero-quote-badge { display: none; }
        }
      `}</style>

      {/* ================= 1. TOP NAV BAR ================= */}
      <div className="support-top-nav">
        <button className="support-back-btn" onClick={onBack} title="Return to Dashboard">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="user-tag-pill">
            <UserCheck size={14} color="#10b981" />
            <span>Aspirant: <strong>{candidateName}</strong></span>
          </div>
          <button
            className="support-back-btn"
            onClick={fetchRealData}
            title="Refresh Live Data"
            style={{ padding: "8px 12px" }}
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* ================= 2. HERO SUPPORT BANNER ================= */}
      <div className="support-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-badge-tag">
            <Sparkles size={12} /> GovNotify Aspirant Support Hub
          </div>
          <h1 className="hero-title">How can we help your government job journey?</h1>
          <p className="hero-subtitle">
            Access verified recruitment rules, check your post eligibility, review upcoming deadlines, or consult our AI Assistant for official government notifications.
          </p>
          <div className="hero-actions-row">
            <button className="hero-primary-btn" onClick={handleBrowseJobs}>
              <BookOpen size={16} /> Browse Live Jobs
            </button>
            <button className="hero-secondary-btn" onClick={scrollToFaqs}>
              <HelpCircle size={16} /> View Popular FAQs
            </button>
          </div>
        </div>

        <div className="hero-quote-badge">
          <p className="hero-quote-text">“Verified Data. Official Sources.”</p>
          <span className="hero-quote-sub">South India & Central Government Recruitment</span>
        </div>
      </div>

      {/* ================= 3. FOUR REAL KPI STATS CARDS ================= */}
      <div className="stats-grid-4">
        {/* Card 1: Active Job Notifications */}
        <div className="kpi-card blue">
          <div className="kpi-top-row">
            <div>
              <div className="kpi-label">Active Job Notifications</div>
              <div className="kpi-value">
                {loading && activeJobsCount === null ? "..." : activeJobsCount}
              </div>
            </div>
            <div className="kpi-icon-box blue">
              <Building2 size={22} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge blue">
              <TrendingUp size={13} /> Live government vacancies
            </span>
          </div>
        </div>

        {/* Card 2: Your Saved Jobs */}
        <div className="kpi-card green">
          <div className="kpi-top-row">
            <div>
              <div className="kpi-label">Your Saved Jobs</div>
              <div className={`kpi-value ${typeof savedJobsCount === "string" && savedJobsCount.length > 4 ? "small-text" : ""}`}>
                {loading && savedJobsCount === null ? "..." : savedJobsCount}
              </div>
            </div>
            <div className="kpi-icon-box green">
              <Bookmark size={22} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge green">
              <CheckCircle2 size={13} /> {userEmail ? "Bookmarked for deadline alerts" : "Login required"}
            </span>
          </div>
        </div>

        {/* Card 3: Eligible Jobs */}
        <div className="kpi-card purple">
          <div className="kpi-top-row">
            <div>
              <div className="kpi-label">Eligible Jobs</div>
              <div className={`kpi-value ${typeof eligibleJobsCount === "string" && eligibleJobsCount.length > 4 ? "small-text" : ""}`}>
                {loading && eligibleJobsCount === null ? "..." : eligibleJobsCount}
              </div>
            </div>
            <div className="kpi-icon-box purple">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge purple">
              <ShieldCheck size={13} /> Based on your profile criteria
            </span>
          </div>
        </div>

        {/* Card 4: Upcoming Deadlines */}
        <div className="kpi-card orange">
          <div className="kpi-top-row">
            <div>
              <div className="kpi-label">Upcoming Deadlines</div>
              <div className="kpi-value">
                {loading && upcomingDeadlinesCount === null ? "..." : upcomingDeadlinesCount}
              </div>
            </div>
            <div className="kpi-icon-box orange">
              <Clock size={22} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge orange">
              <AlertCircle size={13} /> Closing in the next 30 days
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. MAIN TWO-COLUMN LAYOUT ================= */}
      <div className="main-two-column-grid">
        {/* Left Primary Column: Getting Started Guide + FAQs */}
        <div className="main-left-column">
          {/* Section 4A: Getting Started Guide */}
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-box">
                <Target size={20} color="#10b981" />
                <h3>Getting Started Guide</h3>
              </div>
              <span className="card-tag">5 Quick Steps</span>
            </div>

            <div className="steps-container">
              {/* Step 1 */}
              <div className="step-row-item">
                <div className="step-number-circle">1</div>
                <div className="step-info-body">
                  <div className="step-title-line">
                    <span>Complete your profile in Settings</span>
                    <button className="step-action-btn" onClick={handleSettings}>
                      Settings <ArrowRight size={12} />
                    </button>
                  </div>
                  <p className="step-desc">
                    Enter your education qualification, age, domicile state, and reservation category to receive tailored job alerts.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-row-item">
                <div className="step-number-circle">2</div>
                <div className="step-info-body">
                  <div className="step-title-line">
                    <span>Check your eligibility</span>
                    <button className="step-action-btn" onClick={handleCheckEligibility}>
                      Check Now <ArrowRight size={12} />
                    </button>
                  </div>
                  <p className="step-desc">
                    Instantly filter out jobs where you meet the required age limit, degree stream, and state criteria.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-row-item">
                <div className="step-number-circle">3</div>
                <div className="step-info-body">
                  <div className="step-title-line">
                    <span>Save jobs you're interested in</span>
                    <button className="step-action-btn" onClick={handleBrowseJobs}>
                      Explore Jobs <ArrowRight size={12} />
                    </button>
                  </div>
                  <p className="step-desc">
                    Bookmark openings to track application deadlines, registration start dates, and official syllabus PDFs.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step-row-item">
                <div className="step-number-circle">4</div>
                <div className="step-info-body">
                  <div className="step-title-line">
                    <span>Enable notifications (bell icon)</span>
                  </div>
                  <p className="step-desc">
                    Stay on top of new recruitment notices with the red unread count badge at the top of your dashboard.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="step-row-item">
                <div className="step-number-circle">5</div>
                <div className="step-info-body">
                  <div className="step-title-line">
                    <span>Ask the AI Assistant for help</span>
                  </div>
                  <p className="step-desc">
                    Use our context-aware AI chatbot on the bottom right to query official syllabus details, salary brackets, and application steps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4B: Popular FAQs Accordion */}
          <div className="content-card" id="browse-faqs-section">
            <div className="faq-accordion-header">
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>
                  <HelpCircle size={15} /> KNOWLEDGE BASE
                </div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#0f172a" }}>
                  Popular Frequently Asked Questions
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  Answers to key questions regarding recruitment verification, notifications, and portal features.
                </p>
              </div>

              {/* Search Box */}
              <div className="faq-search-box">
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  className="faq-search-input"
                  placeholder="Search questions or keywords..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  No matching questions found for "{faqSearch}". Try searching "eligibility", "update", or "save".
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div key={faq.id} className={`faq-item-box ${isOpen ? "active" : ""}`}>
                      <button
                        className="faq-item-trigger"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isOpen}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}
                        >
                          <span style={{ color: "#10b981", fontWeight: "800" }}>{faq.id}.</span>
                          {faq.question}
                        </span>
                        <div style={{ color: isOpen ? "#10b981" : "#64748b" }}>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="faq-item-answer">
                          <p style={{ margin: 0 }}>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column: Quick Actions + AI Assistant Card */}
        <div className="main-right-sidebar">
          {/* Quick Actions Card */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <Target size={18} color="#0f172a" /> Quick Actions
            </h3>

            {/* Action 1: Browse Jobs */}
            <div className="quick-action-link" onClick={handleBrowseJobs}>
              <div className="action-icon-circle" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="action-label-title">Browse Jobs</h4>
                <p className="action-label-sub">View all live job notifications</p>
              </div>
            </div>

            {/* Action 2: Check Eligibility */}
            <div className="quick-action-link" onClick={handleCheckEligibility}>
              <div className="action-icon-circle" style={{ background: "#ecfdf5", color: "#10b981" }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h4 className="action-label-title">Check Eligibility</h4>
                <p className="action-label-sub">Find vacancies tailored for you</p>
              </div>
            </div>

            {/* Action 3: View Calendar */}
            <div className="quick-action-link" onClick={handleViewCalendar}>
              <div className="action-icon-circle" style={{ background: "#faf5ff", color: "#8b5cf6" }}>
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="action-label-title">View Calendar</h4>
                <p className="action-label-sub">Upcoming government exam dates</p>
              </div>
            </div>

            {/* Action 4: Contact Support */}
            <div className="quick-action-link" onClick={handleContactSupport}>
              <div className="action-icon-circle" style={{ background: "#fff7ed", color: "#ea580c" }}>
                <Mail size={20} />
              </div>
              <div>
                <h4 className="action-label-title">Contact Support</h4>
                <p className="action-label-sub">support@govnotify.in</p>
              </div>
            </div>

            {/* Action 5: Report a Bug */}
            <div className="quick-action-link" onClick={handleReportBug}>
              <div className="action-icon-circle" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <Bug size={20} />
              </div>
              <div>
                <h4 className="action-label-title">Report a Bug</h4>
                <p className="action-label-sub">Help us improve GovNotify</p>
              </div>
            </div>
          </div>

          {/* AI Assistant Help Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-row">
              <div className="ai-avatar-box">
                <img src={robotImg} alt="GovNotify AI" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#065f46" }}>
                  GovNotify AI Assistant
                </h4>
                <span style={{ fontSize: "11.5px", color: "#047857", fontWeight: "600" }}>
                  Instant answers from database
                </span>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#065f46", lineHeight: 1.5, margin: "0 0 12px" }}>
              Have questions about eligibility, application links, or salaries? Click the floating AI robot button at the bottom right.
            </p>

            <div className="ai-chip-item" onClick={handleCheckEligibility}>
              ⚡ How do I check my eligibility?
            </div>
            <div
              className="ai-chip-item"
              onClick={() => {
                alert("GovNotify indexes only verified government gazettes and official .gov.in/.nic.in recruitment portals.");
              }}
            >
              ⚡ Are all job notifications official?
            </div>
            <div
              className="ai-chip-item"
              onClick={() => {
                alert("Click the bookmark icon on any job card to save it. The dashboard bell badge alerts you when updates arrive!");
              }}
            >
              ⚡ How do I save a job for alerts?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
