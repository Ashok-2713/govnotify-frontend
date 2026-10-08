import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, CheckCircle2, ListChecks, ExternalLink, Trash2, Search,
  Calendar, Building2, MapPin, Link2, Clock, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import JobLogo from "./JobLogo";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function fmtDateTime(dateStr) {
  if (!dateStr) return "N/A";
  if (Array.isArray(dateStr)) {
    const [y, m, d, hr = 0, min = 0] = dateStr;
    const dateObj = new Date(y, m - 1, d, hr, min);
    return dateObj.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getQualificationLevel(text) {
  if (!text) return 0;
  const t = text.toLowerCase();
  if (t.includes("phd") || t.includes("doctorate")) return 7;
  if (t.includes("pg") || t.includes("post graduate") || t.includes("master")
      || t.includes("m.sc") || t.includes("m.com") || t.includes("m.a")
      || t.includes("mba") || t.includes("m.tech")) return 6;
  if (t.includes("b.e") || t.includes("b.tech") || t.includes("engineering")
      || t.includes("btech")) return 5;
  if (t.includes("degree") || t.includes("graduate") || t.includes("bachelor")
      || t.includes("b.sc") || t.includes("b.com") || t.includes("b.a")) return 4;
  if (t.includes("diploma") || t.includes("iti") || t.includes("polytechnic")) return 3;
  if (t.includes("12th") || t.includes("puc") || t.includes("hsc")
      || t.includes("intermediate") || t.includes("10+2")) return 2;
  if (t.includes("10th") || t.includes("sslc") || t.includes("matriculation")) return 1;
  return 0;
}

export default function AppliedJobs({
  userEmail = "ashok.udhay@govnotify.in",
  onBack,
  onEligibilityClick
}) {
  const [activeTab, setActiveTab] = useState("applied"); // "applied" | "canApply"
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(true);

  // Tab 2 State
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [markingJobTitle, setMarkingJobTitle] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Load Applied Jobs
  const loadAppliedJobs = () => {
    if (!userEmail) {
      setAppliedJobs([]);
      setLoadingApplied(false);
      return;
    }
    setLoadingApplied(true);
    fetch(`${API_BASE}/api/applied-jobs/list/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setAppliedJobs(Array.isArray(data) ? data : []);
        setLoadingApplied(false);
      })
      .catch(() => {
        setAppliedJobs([]);
        setLoadingApplied(false);
      });
  };

  // Load Profile and All Jobs for Tab 2
  const loadProfileAndEligibleJobs = () => {
    if (!userEmail) return;
    setLoadingEligible(true);

    // 1. Fetch user profile
    fetch(`${API_BASE}/api/eligibility/get-profile/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : null)
      .then(profile => {
        let activeProf = profile && (profile.qualification || profile.age || profile.state) ? profile : null;

        // Fallback to localStorage if backend profile is empty
        if (!activeProf) {
          try {
            const raw = localStorage.getItem("eligibilityProfile");
            if (raw) activeProf = JSON.parse(raw);
          } catch (e) {}
        }

        setUserProfile(activeProf);
        setProfileLoaded(true);

        // 2. Fetch all jobs
        return fetch(`${API_BASE}/api/jobs/all`);
      })
      .then(res => res && res.ok ? res.json() : [])
      .then(jobs => {
        setAllJobs(Array.isArray(jobs) ? jobs : []);
        setLoadingEligible(false);
      })
      .catch(err => {
        console.error("Error loading eligible jobs:", err);
        setLoadingEligible(false);
      });
  };

  useEffect(() => {
    loadAppliedJobs();
    loadProfileAndEligibleJobs();
  }, [userEmail]);

  // Remove applied job
  const handleUnmarkJob = (id) => {
    if (!window.confirm("Remove this job from your applied list?")) return;
    fetch(`${API_BASE}/api/applied-jobs/unmark/${id}`, { method: "DELETE" })
      .then(res => res.text())
      .then(() => loadAppliedJobs())
      .catch(err => console.error("Error unmarking job:", err));
  };

  // Mark job as applied
  const handleMarkAsApplied = (job) => {
    if (!job) return;
    const email = userEmail || "default@example.com";
    setMarkingJobTitle(job.title);

    fetch(`${API_BASE}/api/applied-jobs/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        jobTitle: job.title || job.postTitle || "Government Job",
        organization: job.organization || "Government Department",
        lastDate: job.lastDate ? String(job.lastDate) : "N/A",
        officialApplyUrl: job.officialApplyUrl || job.sourceUrl || ""
      })
    })
      .then(res => res.text())
      .then(msg => {
        alert(msg);
        setMarkingJobTitle(null);
        loadAppliedJobs();
      })
      .catch(err => {
        console.error("Error marking job as applied:", err);
        alert("Failed to mark job. Please try again.");
        setMarkingJobTitle(null);
      });
  };

  // Check if a job is already in appliedJobs list
  const isJobApplied = (jobTitle) => {
    if (!jobTitle) return false;
    return appliedJobs.some(aj =>
      aj.jobTitle && aj.jobTitle.trim().toLowerCase() === jobTitle.trim().toLowerCase()
    );
  };

  // Tab 1: Filtered Applied Jobs
  const filteredAppliedJobs = useMemo(() => {
    if (!searchQuery.trim()) return appliedJobs;
    const q = searchQuery.toLowerCase().trim();
    return appliedJobs.filter(j =>
      (j.jobTitle && j.jobTitle.toLowerCase().includes(q)) ||
      (j.organization && j.organization.toLowerCase().includes(q))
    );
  }, [appliedJobs, searchQuery]);

  // Tab 2: Calculate Jobs User CAN Apply To
  const eligibleJobs = useMemo(() => {
    if (!userProfile) return [];

    const userQualLevel = getQualificationLevel(userProfile.qualification);
    const userState = (userProfile.state || "All").toLowerCase();
    const userCat = (userProfile.category || "All").toLowerCase();
    const userAge = Number(userProfile.age) || 0;

    const matched = allJobs.filter(job => {
      // Exclude CLOSED jobs
      if (job.status && job.status.toUpperCase() === "CLOSED") return false;

      // 1. Qualification hierarchy (10th < 12th < Diploma < Degree < B.E < PG < PhD)
      const jobQualText = `${job.qualification || ""} ${job.title || ""}`;
      const jobQualLevel = getQualificationLevel(jobQualText);
      if (userQualLevel > 0 && jobQualLevel > 0 && jobQualLevel > userQualLevel) {
        return false;
      }

      // 2. State filtering (e.g. Kerala user sees Kerala + All India + Central)
      if (userState !== "all") {
        const jobState = (job.state || "").toLowerCase();
        const stateOk = jobState.includes(userState) ||
                        jobState.includes("all india") ||
                        jobState.includes("all-india") ||
                        jobState.includes("central") ||
                        jobState === "";
        if (!stateOk) return false;
      }

      // 3. Category filtering (General, OBC, SC, ST)
      if (userCat !== "all") {
        const jobCat = (job.category || "").toLowerCase();
        if (jobCat && !jobCat.includes("government") && !jobCat.includes(userCat)) {
          return false;
        }
      }

      // 4. Age limit filtering
      if (userAge > 0 && job.ageLimit) {
        const ageStr = job.ageLimit.toLowerCase();
        if (ageStr.includes("-")) {
          try {
            const parts = ageStr.replace(/[^0-9\-]/g, "").split("-");
            const minAge = parseInt(parts[0], 10);
            const maxAge = parseInt(parts[1], 10);
            if (!isNaN(minAge) && !isNaN(maxAge)) {
              if (userAge < minAge || userAge > maxAge) return false;
            }
          } catch (e) {}
        }
      }

      return true;
    });

    // 5. DEDUPLICATION by (title + organization + state)
    const dedupMap = new Map();
    for (const job of matched) {
      const titleKey = (job.title || job.postTitle || "").trim().toLowerCase();
      const orgKey = (job.organization || "").trim().toLowerCase();
      const stateKey = (job.state || "").trim().toLowerCase();
      const uniqueKey = `${titleKey}|${orgKey}|${stateKey}`;

      if (!dedupMap.has(uniqueKey)) {
        dedupMap.set(uniqueKey, job);
      } else {
        const existing = dedupMap.get(uniqueKey);
        const existingTime = existing.lastDate ? new Date(existing.lastDate).getTime() : 0;
        const newTime = job.lastDate ? new Date(job.lastDate).getTime() : 0;
        if (newTime > existingTime) {
          dedupMap.set(uniqueKey, job);
        }
      }
    }

    let results = Array.from(dedupMap.values());

    // Search query filter for Tab 2
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.organization && j.organization.toLowerCase().includes(q)) ||
        (j.state && j.state.toLowerCase().includes(q))
      );
    }

    return results;
  }, [allJobs, userProfile, searchQuery]);

  return (
    <div style={styles.page} className="applied-jobs-page">
      <style>{`
        @media (max-width: 640px) {
          .applied-jobs-page {
            padding: 16px 12px !important;
          }
          .app-tab-switcher {
            width: 100% !important;
            flex-direction: column !important;
          }
          .app-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .app-card-right {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            border-top: 1px dashed #e2e8f0 !important;
            padding-top: 10px !important;
          }
          .app-action-row {
            flex-wrap: wrap !important;
          }
          .app-details-grid {
            grid-template-columns: 1fr !important;
            margin-left: 0 !important;
          }
        }
        @media (max-width: 440px) {
          .app-card-right {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
        }
      `}</style>
      {/* Top Bar with Back Button */}
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      {/* Header Container */}
      <div style={styles.headerContainer}>
        <div style={styles.headerLeft}>
          <div style={styles.titleWrapper}>
            <h1 style={styles.title}>📌 Applied Jobs Tracker</h1>
            <span style={styles.appliedCountPill}>
              <CheckCircle2 size={14} style={{ marginRight: 4 }} /> {appliedJobs.length} Applied
            </span>
          </div>
          <p style={styles.subtitle}>
            Track all jobs you have applied for and discover matching vacancies based on your profile
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabSwitcher} className="app-tab-switcher">
          <button
            onClick={() => { setActiveTab("applied"); setSearchQuery(""); }}
            style={{
              ...styles.tabBtn,
              background: activeTab === "applied" ? "#10b981" : "transparent",
              color: activeTab === "applied" ? "#ffffff" : "#64748b"
            }}
          >
            <CheckCircle2 size={16} />
            <span>✅ Applied Jobs ({appliedJobs.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("canApply"); setSearchQuery(""); }}
            style={{
              ...styles.tabBtn,
              background: activeTab === "canApply" ? "#2563eb" : "transparent",
              color: activeTab === "canApply" ? "#ffffff" : "#64748b"
            }}
          >
            <ListChecks size={16} />
            <span>📋 Jobs You Can Apply ({profileLoaded && userProfile ? eligibleJobs.length : "!"})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchCard}>
        <div style={styles.searchWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={
              activeTab === "applied"
                ? "Search among your applied jobs..."
                : "Search eligible government vacancies..."
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: APPLIED JOBS ── */}
      {activeTab === "applied" && (
        <div>
          {loadingApplied ? (
            <div style={styles.emptyCard}>
              <Clock size={36} color="#10b981" style={{ marginBottom: 14 }} />
              <h3>Loading your applied jobs...</h3>
            </div>
          ) : filteredAppliedJobs.length === 0 ? (
            <div style={styles.emptyCard}>
              <CheckCircle2 size={54} color="#cbd5e1" style={{ marginBottom: 16 }} />
              <h3 style={{ color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
                {appliedJobs.length === 0
                  ? "You haven't applied to any jobs yet."
                  : "No applied jobs match your search."}
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.5 }}>
                {appliedJobs.length === 0
                  ? "Click 'Mark as Applied' on any job in the 'Jobs You Can Apply' tab or in your dashboard to track it here."
                  : "Try clearing your search term to see all applied jobs."}
              </p>
              {appliedJobs.length === 0 && (
                <button onClick={() => setActiveTab("canApply")} style={styles.primaryBtn}>
                  Find Jobs You Can Apply For <ArrowRight size={15} />
                </button>
              )}
            </div>
          ) : (
            <div style={styles.jobsList}>
              <div style={styles.countSummary}>
                You have applied to <strong>{appliedJobs.length}</strong> job{appliedJobs.length !== 1 ? 's' : ''}
              </div>

              {filteredAppliedJobs.map((job, idx) => (
                <div key={job.id} style={styles.appliedCard}>
                  <div style={styles.cardHeader} className="app-card-header">
                    <div style={styles.cardTitleRow}>
                      <div style={styles.numberBadge}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={styles.jobTitle}>{job.jobTitle}</h3>
                        <p style={styles.orgSubtitle}>{job.organization || "Government Department"}</p>
                      </div>
                    </div>

                    <div style={styles.actionRow} className="app-action-row">
                      <a
                        href={job.officialApplyUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.portalBtn}
                      >
                        View on Portal <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => handleUnmarkJob(job.id)}
                        style={styles.removeBtn}
                        title="Remove from applied list"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>

                  <div style={styles.detailsGrid} className="app-details-grid">
                    <div style={styles.detailItem}>
                      <Building2 size={16} color="#64748b" />
                      <div>
                        <span style={styles.detailLabel}>Organization</span>
                        <p style={styles.detailValue}>{job.organization || "Government Department"}</p>
                      </div>
                    </div>

                    <div style={styles.detailItem}>
                      <Calendar size={16} color="#ef4444" />
                      <div>
                        <span style={styles.detailLabel}>Last Date</span>
                        <p style={{ ...styles.detailValue, color: "#ef4444", fontWeight: 700 }}>
                          {job.lastDate || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div style={styles.detailItem}>
                      <Clock size={16} color="#10b981" />
                      <div>
                        <span style={styles.detailLabel}>Applied On</span>
                        <p style={{ ...styles.detailValue, color: "#047857", fontWeight: 700 }}>
                          {fmtDateTime(job.appliedAt)}
                        </p>
                      </div>
                    </div>

                    <div style={styles.detailItem}>
                      <Link2 size={16} color="#2563eb" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={styles.detailLabel}>Official Link</span>
                        <a
                          href={job.officialApplyUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.linkValue}
                        >
                          {job.officialApplyUrl || "N/A"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: JOBS YOU CAN APPLY ── */}
      {activeTab === "canApply" && (
        <div>
          {loadingEligible ? (
            <div style={styles.emptyCard}>
              <Clock size={36} color="#2563eb" style={{ marginBottom: 14 }} />
              <h3>Checking your eligibility and matching jobs...</h3>
            </div>
          ) : !userProfile ? (
            <div style={styles.emptyCard}>
              <AlertCircle size={52} color="#f59e0b" style={{ marginBottom: 16 }} />
              <h3 style={{ color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
                No Eligibility Profile Found
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.5 }}>
                Please complete your Eligibility Checker first to see government vacancies tailored specifically to your qualification, age, state, and category.
              </p>
              <button
                onClick={onEligibilityClick}
                style={styles.primaryBtn}
              >
                Go to Eligibility Checker <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div>
              {/* Profile Criteria Banner */}
              <div style={styles.profileBanner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={20} color="#2563eb" />
                  <div>
                    <strong>Matched to your profile:</strong>
                    <span style={{ marginLeft: 8, color: "#475569" }}>
                      🎓 {userProfile.qualification || "Any"} • 🎂 {userProfile.age ? userProfile.age + " yrs" : "Any"} • 📍 {userProfile.state || "All India"} • 🏷️ {userProfile.category || "All"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onEligibilityClick}
                  style={styles.updateProfileBtn}
                >
                  Edit Profile
                </button>
              </div>

              {eligibleJobs.length === 0 ? (
                <div style={styles.emptyCard}>
                  <AlertCircle size={50} color="#94a3b8" style={{ marginBottom: 16 }} />
                  <h3 style={{ color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
                    No Matching Jobs Found
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    Try updating your qualification or state preferences in the Eligibility Checker.
                  </p>
                </div>
              ) : (
                <div style={styles.jobsList}>
                  <div style={styles.countSummary}>
                    Found <strong>{eligibleJobs.length}</strong> matching vacancies you are eligible to apply for
                  </div>

                  {eligibleJobs.map((job) => {
                    const applied = isJobApplied(job.title);
                    return (
                      <div key={job.id} style={styles.canApplyCard}>
                        <div style={styles.cardHeader} className="app-card-header">
                          <div style={styles.cardLeft}>
                            <JobLogo
                              url={job.officialApplyUrl}
                              organization={job.organization}
                              state={job.state}
                              title={job.title}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={styles.jobTitle}>{job.title}</h3>
                              <p style={styles.orgSubtitle}>{job.organization || "Government Department"}</p>
                              <div style={styles.tagRow}>
                                <span style={{ ...styles.tag, background: "#ecfdf5", color: "#047857" }}>
                                  <MapPin size={12} style={{ marginRight: 4 }} />
                                  {job.state || "Central Government"}
                                </span>
                                {job.qualification && (
                                  <span style={{ ...styles.tag, background: "#dbeafe", color: "#1d4ed8" }}>
                                    {job.qualification}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={styles.cardRight} className="app-card-right">
                            <div style={styles.deadlineBox}>
                              <span style={styles.deadlineLabel}>Last Date</span>
                              <strong style={styles.deadlineValue}>{fmtDate(job.lastDate)}</strong>
                            </div>

                            <div style={styles.actionRow} className="app-action-row">
                              <a
                                href={job.officialApplyUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.portalBtn}
                              >
                                Apply on Portal <ExternalLink size={13} />
                              </a>

                              {applied ? (
                                <span style={styles.appliedBadge}>
                                  <CheckCircle2 size={13} /> Applied
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkAsApplied(job)}
                                  disabled={markingJobTitle === job.title}
                                  style={styles.markAppliedBtn}
                                  title="Mark this job as applied to track your progress"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>{markingJobTitle === job.title ? "Marking..." : "Mark as Applied"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  topBar: {
    marginBottom: "20px"
  },
  backBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "9px 18px",
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px"
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column"
  },
  titleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  appliedCountPill: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #86efac",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "6px",
    margin: "6px 0 0 0"
  },
  tabSwitcher: {
    display: "flex",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "4px",
    gap: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  tabBtn: {
    border: "none",
    padding: "9px 16px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    transition: "0.2s"
  },
  searchCard: {
    marginBottom: "20px"
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    color: "#94a3b8",
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    padding: "11px 40px 11px 42px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "13.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  clearSearchBtn: {
    position: "absolute",
    right: 14,
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px"
  },
  profileBanner: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "12px 18px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "#1e40af",
    flexWrap: "wrap",
    gap: "10px"
  },
  updateProfileBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  countSummary: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "12px"
  },
  jobsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  appliedCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  canApplyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: 1,
    minWidth: "300px"
  },
  cardLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    flex: 1,
    minWidth: "300px"
  },
  numberBadge: {
    background: "#10b981",
    color: "#ffffff",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "grid",
    placeItems: "center",
    fontSize: "13.5px",
    fontWeight: "800",
    flexShrink: 0
  },
  jobTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 3px 0",
    lineHeight: "1.4"
  },
  orgSubtitle: {
    fontSize: "12.5px",
    color: "#64748b",
    margin: 0
  },
  tagRow: {
    display: "flex",
    gap: "6px",
    marginTop: "6px",
    flexWrap: "wrap"
  },
  tag: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 9px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center"
  },
  cardRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexShrink: 0,
    flexWrap: "wrap"
  },
  deadlineBox: {
    textAlign: "right"
  },
  deadlineLabel: {
    display: "block",
    fontSize: "10.5px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  deadlineValue: {
    fontSize: "13px",
    color: "#ef4444",
    fontWeight: "700"
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0
  },
  portalBtn: {
    background: "#2563eb",
    color: "#ffffff",
    padding: "8px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px"
  },
  removeBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px"
  },
  markAppliedBtn: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px"
  },
  appliedBadge: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #86efac",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginLeft: "44px",
    paddingTop: "14px",
    marginTop: "14px",
    borderTop: "1px dashed #e2e8f0"
  },
  detailItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    minWidth: 0
  },
  detailLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "3px"
  },
  detailValue: {
    fontSize: "13.5px",
    color: "#334155",
    fontWeight: "600",
    margin: 0,
    wordBreak: "break-word"
  },
  linkValue: {
    fontSize: "12.5px",
    color: "#2563eb",
    textDecoration: "none",
    wordBreak: "break-all",
    display: "block",
    fontWeight: "500"
  },
  emptyCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "70px 30px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  },
  primaryBtn: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 22px",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
  }
};
