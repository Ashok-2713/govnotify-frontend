import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Bell, Search, ExternalLink, Bookmark, Eye, RefreshCw,
  Calendar, Building2, MapPin, GraduationCap, X, Sparkles, Filter, Check
} from "lucide-react";

const API_BASE = "http://localhost:8080";

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / 864e5);
  return diff > 0 ? diff : 0;
}

const StatusBadge = ({ status }) => {
  const s = (status || "OPEN").toUpperCase();
  let bg = "#dcfce7";
  let color = "#15803d";
  let border = "#bbf7d0";

  if (s === "OPEN" || s === "ACTIVE") {
    bg = "#dcfce7";
    color = "#15803d";
    border = "#bbf7d0";
  } else if (s === "UPCOMING") {
    bg = "#dbeafe";
    color = "#1d4ed8";
    border = "#bfdbfe";
  } else if (s === "CLOSING SOON") {
    bg = "#ffedd5";
    color = "#c2410c";
    border = "#fed7aa";
  } else if (s === "CLOSED") {
    bg = "#f1f5f9";
    color = "#64748b";
    border = "#e2e8f0";
  } else if (s === "ARCHIVED") {
    bg = "#e2e8f0";
    color = "#475569";
    border = "#cbd5e1";
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: 700,
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      letterSpacing: "0.025em"
    }}>
      {s}
    </span>
  );
};

import JobLogo from "./JobLogo";

const CENTRAL_CATEGORIES = ["Railways", "SSC", "Banking", "India Post", "UPSC", "Other Central"];

const isCentralCategory = (value) => CENTRAL_CATEGORIES.includes(value);

export default function JobNotifications({ userEmail = "ashok.udhay@govnotify.in", onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newJobsOnly, setNewJobsOnly] = useState(true);
  const [scope, setScope] = useState('active');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("lastDateDesc");
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [savingJobId, setSavingJobId] = useState(null);

  const fetchJobs = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    fetch(`${API_BASE}/api/jobs?scope=${scope}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch /api/jobs");
        return res.json();
      })
      .catch(() => {
        // Fallback to /api/jobs/all?scope=${scope} if /api/jobs endpoint is unavailable
        return fetch(`${API_BASE}/api/jobs/all?scope=${scope}`).then(r => r.ok ? r.json() : []);
      })
      .then(data => {
        const rawJobs = Array.isArray(data) ? data : [];
        if (rawJobs.length === 0) {
          setJobs([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Find max ID across all jobs
        const maxId = rawJobs.reduce((m, j) => Math.max(m, Number(j.id) || 0), 0);

        // Dynamically compute baseline ID of the previous batch using creation dates
        const dates = rawJobs.map(j => (j.createdAt || "").slice(0, 10)).filter(Boolean);
        const latestDate = dates.length > 0 ? [...new Set(dates)].sort().reverse()[0] : null;
        const previousBatchMaxId = rawJobs
          .filter(j => (j.createdAt || "").slice(0, 10) !== latestDate)
          .reduce((max, j) => Math.max(max, Number(j.id) || 0), 0);

        const savedLastSeen = parseInt(localStorage.getItem("lastSeenJobId") || "0", 10);

        // Effective checkpoint: use savedLastSeen if valid historical checkpoint;
        // otherwise fall back to previousBatchMaxId so newly added batch is shown
        const effectiveCheckpoint = (savedLastSeen > 0 && savedLastSeen < maxId)
          ? savedLastSeen
          : previousBatchMaxId;

        const processedJobs = rawJobs.map((j, index) => {
          const jobId = Number(j.id) || (index + 1);
          const isNewJob = effectiveCheckpoint > 0
            ? jobId > effectiveCheckpoint
            : (latestDate ? (j.createdAt || "").slice(0, 10) === latestDate : false);

          return {
            ...j,
            id: jobId,
            isNew: isNewJob
          };
        });

        setJobs(processedJobs);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error("Error fetching jobs:", err);
        setJobs([]);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, [scope]);

  useEffect(() => {
    if (jobs.length === 0) return;
    const timer = setTimeout(() => {
      const highestId = Math.max(...jobs.map(j => Number(j.id) || 0));
      if (highestId > 0) {
        const prevLastSeen = parseInt(localStorage.getItem("lastSeenJobId") || "0", 10);
        if (highestId > prevLastSeen) {
          localStorage.setItem("lastSeenJobId", String(highestId));
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [jobs]);

  const newJobsCount = useMemo(() => {
    return jobs.filter(j => j.isNew).length;
  }, [jobs]);

  const handleSaveJob = (job) => {
    if (!job) return;
    const email = userEmail || "default@example.com";
    const jobTitle = job.title || job.postTitle || "Government Job";
    const organization = job.organization || "Government Department";
    const lastDate = job.lastDate ? String(job.lastDate) : "N/A";
    const officialApplyUrl = job.officialApplyUrl || job.sourceUrl || "";

    // Optimistic UI: Trigger immediate success feedback within 100ms
    const successMsg = "✅ Job saved successfully! Email notification sent.";
    setTimeout(() => {
      try {
        alert(successMsg);
      } catch (e) {
        console.log(successMsg);
      }
    }, 10);

    // Fire-and-forget background API request
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
      .catch(err => {
        console.error("Error saving job in background:", err);
        alert("Failed to save job. Please try again.");
      });
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (newJobsOnly) {
      result = result.filter(j => j.isNew);
    }

    // State or Central Category filter
    if (selectedState !== "All") {
      if (isCentralCategory(selectedState)) {
        // Filter by central_category
        result = result.filter(j =>
          (j.centralCategory && j.centralCategory.toLowerCase() === selectedState.toLowerCase()) ||
          (j.central_category && j.central_category.toLowerCase() === selectedState.toLowerCase())
        );
      } else if (selectedState === "All India") {
        result = result.filter(j => {
          if (!j.state) return false;
          const s = j.state.toLowerCase();
          return s.includes("all-india") || s.includes("all india") || s.includes("central");
        });
      } else {
        // Filter by state (Karnataka, Tamil Nadu, Kerala, etc.)
        result = result.filter(j => {
          if (!j.state) return false;
          return j.state.toLowerCase() === selectedState.toLowerCase();
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.organization && j.organization.toLowerCase().includes(q)) ||
        (j.state && j.state.toLowerCase().includes(q)) ||
        (j.centralCategory && j.centralCategory.toLowerCase().includes(q)) ||
        (j.central_category && j.central_category.toLowerCase().includes(q)) ||
        (j.qualification && j.qualification.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== "All") {
      result = result.filter(j => {
        const s = (j.status || "OPEN").toUpperCase();
        return s === selectedStatus.toUpperCase();
      });
    }

    result.sort((a, b) => {
      if (sortBy === "lastDateDesc") {
        const dateA = a.lastDate ? new Date(a.lastDate).getTime() : 0;
        const dateB = b.lastDate ? new Date(b.lastDate).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "lastDateAsc") {
        const dateA = a.lastDate ? new Date(a.lastDate).getTime() : 0;
        const dateB = b.lastDate ? new Date(b.lastDate).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === "newestId") {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      return 0;
    });

    return result;
  }, [jobs, newJobsOnly, searchQuery, selectedState, selectedStatus, sortBy]);

  const getStatusBadgeStyle = (status) => {
    const s = (status || "OPEN").toUpperCase();
    if (s === "OPEN" || s === "ACTIVE") {
      return { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
    }
    if (s === "UPCOMING") {
      return { background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" };
    }
    return { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" };
  };

  return (
    <div style={styles.page} className="job-notifs-page">
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div style={styles.headerContainer}>
        <div style={styles.headerLeft}>
          <div style={styles.titleWrapper}>
            <h1 style={styles.title}>📋 Job Notifications</h1>
            {newJobsCount > 0 && (
              <span style={styles.newPillHeader}>
                <Sparkles size={14} style={{ marginRight: 4 }} /> {newJobsCount} New
              </span>
            )}
          </div>
          <p style={styles.subtitle}>
            <strong style={{ color: "#10b981" }}>{newJobsCount} new job{newJobsCount !== 1 ? 's' : ''}</strong> since your last visit • Total: <strong>{jobs.length}</strong> jobs
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.toggleWrapper} onClick={() => setNewJobsOnly(p => !p)} role="button" tabIndex={0}>
            <span style={styles.toggleLabel}>🆕 New Jobs Only</span>
            <div style={{ ...styles.toggleSwitch, background: newJobsOnly ? "#10b981" : "#cbd5e1" }}>
              <div style={{ ...styles.toggleKnob, transform: newJobsOnly ? "translateX(22px)" : "translateX(2px)" }}>
                {newJobsOnly && <Check size={12} color="#10b981" strokeWidth={3} />}
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchJobs(true)}
            style={styles.refreshBtn}
            disabled={refreshing}
            title="Refresh latest job data"
          >
            <RefreshCw size={15} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div style={styles.filterCard}>
        <div style={styles.filterGrid} className="job-filter-grid">
          <div style={styles.searchBox}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by job title, department, qualification..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><MapPin size={13} /> State / Central Category</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={styles.selectInput}
            >
              <option value="All">All States &amp; Central</option>

              <optgroup label="South Indian States">
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
              </optgroup>

              <optgroup label="Central Government Jobs">
                <option value="All India">All Central</option>
                <option value="Railways">Railways</option>
                <option value="SSC">SSC</option>
                <option value="Banking">Banking</option>
                <option value="India Post">India Post</option>
                <option value="UPSC">UPSC</option>
                <option value="Other Central">Other Central</option>
              </optgroup>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><Filter size={13} /> Job Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={styles.selectInput}
            >
              <option value="active">Active Jobs</option>
              <option value="closed">Closed Jobs</option>
              <option value="archived">Archived Jobs</option>
              <option value="all">All Jobs</option>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><Filter size={13} /> Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={styles.selectInput}
            >
              <option value="All">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="CLOSING SOON">CLOSING SOON</option>
              <option value="CLOSED">CLOSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><Calendar size={13} /> Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={styles.selectInput}
            >
              <option value="lastDateDesc">Last Date (Newest First)</option>
              <option value="lastDateAsc">Last Date (Closest First)</option>
              <option value="newestId">Newly Added (Highest ID)</option>
            </select>
          </div>
        </div>

        {(newJobsOnly || scope !== "active" || searchQuery || selectedState !== "All" || selectedStatus !== "All") && (
          <div style={styles.activeFiltersRow}>
            <span style={styles.activeFilterText}>Active Filters:</span>
            {newJobsOnly && (
              <span style={styles.filterTag}>
                New Jobs Only
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setNewJobsOnly(false)} />
              </span>
            )}
            {scope !== "active" && (
              <span style={styles.filterTag}>
                Scope: {scope.toUpperCase()}
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setScope("active")} />
              </span>
            )}
            {selectedState !== "All" && (
              <span style={styles.filterTag}>
                {isCentralCategory(selectedState) ? `Central: ${selectedState}` : `State: ${selectedState}`}
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSelectedState("All")} />
              </span>
            )}
            {selectedStatus !== "All" && (
              <span style={styles.filterTag}>
                Status: {selectedStatus}
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSelectedStatus("All")} />
              </span>
            )}
            {searchQuery && (
              <span style={styles.filterTag}>
                Query: "{searchQuery}"
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSearchQuery("")} />
              </span>
            )}
            <button
              onClick={() => {
                setNewJobsOnly(false);
                setScope("active");
                setSelectedState("All");
                setSelectedStatus("All");
                setSearchQuery("");
              }}
              style={styles.clearAllBtn}
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={styles.emptyCard}>
          <RefreshCw size={36} color="#10b981" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
          <h3 style={{ color: "#334155", marginBottom: 6 }}>Loading Job Notifications...</h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Fetching latest verified government vacancies</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={styles.emptyCard}>
          <Bell size={52} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
            {newJobsOnly ? "No New Jobs Since Your Last Visit" : "No Job Notifications Match Your Filters"}
          </h3>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.5 }}>
            {newJobsOnly
              ? "You are up to date! Toggle off 'New Jobs Only' above to browse all existing government job notifications."
              : "Try clearing search queries or selecting different state / status filters."}
          </p>
          {newJobsOnly ? (
            <button onClick={() => setNewJobsOnly(false)} style={styles.viewAllBtn}>
              Show All {jobs.length} Jobs
            </button>
          ) : (
            <button
              onClick={() => {
                setNewJobsOnly(false);
                setSelectedState("All");
                setSelectedStatus("All");
                setSearchQuery("");
              }}
              style={styles.viewAllBtn}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={styles.jobsList}>
          <div style={styles.countSummary}>
            Showing <strong>{filteredJobs.length}</strong> of <strong>{jobs.length}</strong> job notifications
            {newJobsOnly && <span style={{ color: "#10b981", fontWeight: 700, marginLeft: 6 }}>(New Jobs Filter Active)</span>}
          </div>

          {filteredJobs.map((job) => {
            const statusStyle = getStatusBadgeStyle(job.status);
            return (
              <div key={job.id} style={{ ...styles.jobCard, borderColor: job.isNew ? "#a7f3d0" : "#e2e8f0" }}>
                <div style={styles.cardHeader} className="jn-card-header">
                  <div style={styles.cardLeft}>
                    <JobLogo
                      url={job.officialApplyUrl}
                      organization={job.organization}
                      state={job.state}
                      title={job.title}
                    />
                    <div style={styles.cardInfo}>
                      <div style={styles.cardTitleRow}>
                        <h3
                          style={styles.jobTitle}
                          onClick={() => setSelectedJobDetail(job)}
                          title="Click to view details"
                        >
                          {job.title}
                        </h3>
                        {job.isNew && (
                          <span style={styles.newBadgePill}>
                            <Sparkles size={11} style={{ marginRight: 3 }} /> 🆕 NEW
                          </span>
                        )}
                        <StatusBadge status={job.status} />
                      </div>

                      <div style={styles.orgRow}>
                        <Building2 size={14} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={styles.orgText}>{job.organization || "Government Department"}</span>
                      </div>

                      <div style={styles.tagRow}>
                        <span style={{ ...styles.tag, background: "#dbeafe", color: "#1d4ed8" }}>
                          <GraduationCap size={12} style={{ marginRight: 4 }} />
                          {job.qualification || "Graduate"}
                        </span>
                        <span style={{ ...styles.tag, background: "#ecfdf5", color: "#047857" }}>
                          <MapPin size={12} style={{ marginRight: 4 }} />
                          {job.state || "Central Government"}
                        </span>
                        {job.category && (
                          <span style={{ ...styles.tag, background: "#f3e8ff", color: "#7e22ce" }}>
                            {job.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.cardRight} className="jn-card-right">
                    <div style={styles.deadlineBox}>
                      <span style={styles.deadlineLabel}>
                        {job.status === "CLOSED" ? "Application Closed" : "Last Date to Apply"}
                      </span>
                      <strong style={{
                        ...styles.deadlineValue,
                        color: job.status === "CLOSED" ? "#64748b" : (job.status === "CLOSING SOON" ? "#ea580c" : styles.deadlineValue.color)
                      }}>
                        {fmtDate(job.lastDate)}
                      </strong>
                      {job.status === "CLOSING SOON" && (
                        <small style={{ color: "#c2410c", fontSize: "11px", fontWeight: 700, display: "block", marginTop: 2 }}>
                          ⚠️ Only {daysLeft(job.lastDate)} days left!
                        </small>
                      )}
                      {job.status === "CLOSED" && (
                        <small style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600, display: "block", marginTop: 2 }}>
                          Deadline passed on {fmtDate(job.lastDate)}
                        </small>
                      )}
                    </div>

                    <div style={styles.btnRow} className="jn-btn-row">
                      <button
                        onClick={() => handleSaveJob(job)}
                        disabled={savingJobId === job.id}
                        style={styles.saveBtn}
                        title="Save Job to your list"
                      >
                        <Bookmark size={14} />
                        <span>{savingJobId === job.id ? "Saving..." : "Save"}</span>
                      </button>

                      <button
                        onClick={() => setSelectedJobDetail(job)}
                        style={styles.viewBtn}
                        title="View Full Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      {job.status === "CLOSED" ? (
                        <button
                          disabled
                          style={{
                            ...styles.applyBtn,
                            background: "#94a3b8",
                            borderColor: "#94a3b8",
                            cursor: "not-allowed",
                            opacity: 0.85
                          }}
                          title={`Deadline passed on ${fmtDate(job.lastDate)}`}
                        >
                          <span>Closed</span>
                        </button>
                      ) : (
                        <a
                          href={job.officialApplyUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.applyBtn}
                          title="Apply on official government portal"
                        >
                          <span>Apply</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedJobDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedJobDetail(null)}>
          <div style={styles.modalCard} className="jn-modal-card" onClick={e => e.stopPropagation()}>
            <button style={styles.modalCloseBtn} onClick={() => setSelectedJobDetail(null)} title="Close">
              <X size={18} />
            </button>

            <div style={styles.modalHeader}>
              <JobLogo
                url={selectedJobDetail.officialApplyUrl}
                organization={selectedJobDetail.organization}
                state={selectedJobDetail.state}
                title={selectedJobDetail.title}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h3 style={styles.modalTitle}>{selectedJobDetail.title}</h3>
                  {selectedJobDetail.isNew && (
                    <span style={styles.newBadgePill}>🆕 NEW</span>
                  )}
                  <StatusBadge status={selectedJobDetail.status} />
                </div>
                <p style={styles.modalOrg}>🏛️ {selectedJobDetail.organization || "Government Department"}</p>
              </div>
            </div>

            <div style={styles.modalDetailsGrid} className="jn-modal-grid">
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>State / Jurisdiction</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.state || "Central Government"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Department / Organization</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.organization || "Government Organization"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Minimum Qualification</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.qualification || "Graduate / Relevant Degree"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Category / Sector</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.category || "General"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Registration Start Date</span>
                <strong style={styles.modalDetailVal}>{fmtDate(selectedJobDetail.registrationStartDate)}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Application Last Date</span>
                <strong style={{ ...styles.modalDetailVal, color: "#ef4444" }}>{fmtDate(selectedJobDetail.lastDate)}</strong>
              </div>
            </div>

            <div style={styles.modalActions} className="jn-modal-actions">
              <button
                type="button"
                onClick={() => handleSaveJob(selectedJobDetail)}
                style={styles.modalSaveBtn}
              >
                <Bookmark size={15} /> Save Job
              </button>
              {selectedJobDetail.status === "CLOSED" ? (
                <button
                  disabled
                  style={{
                    ...styles.modalApplyBtn,
                    background: "#94a3b8",
                    borderColor: "#94a3b8",
                    cursor: "not-allowed",
                    opacity: 0.85
                  }}
                  title={`Deadline passed on ${fmtDate(selectedJobDetail.lastDate)}`}
                >
                  Closed (Deadline Passed)
                </button>
              ) : (
                <a
                  href={selectedJobDetail.officialApplyUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.modalApplyBtn}
                >
                  Apply on Official Portal <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .job-filter-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .job-notifs-page {
            padding: 16px 12px !important;
          }
          .job-filter-grid {
            grid-template-columns: 1fr !important;
          }
          .jn-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .jn-card-right {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            border-top: 1px dashed #e2e8f0 !important;
            padding-top: 10px !important;
          }
          .jn-btn-row {
            flex-wrap: wrap !important;
          }
          .jn-modal-card {
            width: 95% !important;
            padding: 20px 16px !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          .jn-modal-grid {
            grid-template-columns: 1fr !important;
          }
          .jn-modal-actions {
            flex-direction: column !important;
          }
        }
        @media (max-width: 440px) {
          .jn-card-right {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .jn-btn-row {
            width: 100% !important;
          }
        }
      `}</style>
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
  newPillHeader: {
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
    fontSize: "14.5px",
    marginTop: "6px",
    margin: "6px 0 0 0"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap"
  },
  toggleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    userSelect: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    transition: "0.2s"
  },
  toggleLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1e293b"
  },
  toggleSwitch: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    position: "relative",
    transition: "0.25s ease",
    display: "flex",
    alignItems: "center"
  },
  toggleKnob: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "0.25s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  refreshBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "9px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    transition: "0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  filterCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px 20px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr 1fr 1fr",
    gap: "14px",
    alignItems: "flex-end"
  },
  searchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    color: "#94a3b8",
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 36px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    transition: "0.2s"
  },
  clearSearchBtn: {
    position: "absolute",
    right: 10,
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "grid",
    placeItems: "center"
  },
  selectWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  selectLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  selectInput: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer"
  },
  activeFiltersRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px dashed #e2e8f0",
    flexWrap: "wrap"
  },
  activeFilterText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b"
  },
  filterTag: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    fontSize: "12px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center"
  },
  clearAllBtn: {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginLeft: "auto"
  },
  countSummary: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "12px"
  },
  jobsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  jobCard: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    transition: "0.2s"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap"
  },
  cardLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    flex: 1,
    minWidth: "300px"
  },
  cardInfo: {
    flex: 1,
    minWidth: 0
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "4px"
  },
  jobTitle: {
    fontSize: "15.5px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    cursor: "pointer",
    lineHeight: "1.35",
    transition: "0.15s"
  },
  newBadgePill: {
    background: "#10b981",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(16,185,129,0.3)"
  },
  statusBadge: {
    fontSize: "10.5px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "6px",
    textTransform: "uppercase"
  },
  orgRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px"
  },
  orgText: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  tagRow: {
    display: "flex",
    gap: "6px",
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
    textTransform: "uppercase",
    letterSpacing: "0.3px"
  },
  deadlineValue: {
    fontSize: "13px",
    color: "#ef4444",
    fontWeight: "700"
  },
  btnRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px"
  },
  saveBtn: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    transition: "0.2s"
  },
  viewBtn: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    transition: "0.2s"
  },
  applyBtn: {
    background: "#2563eb",
    color: "#ffffff",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    transition: "0.2s"
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "70px 30px",
    textAlign: "center"
  },
  viewAllBtn: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 22px",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "18px",
    maxWidth: "580px",
    width: "100%",
    padding: "28px",
    position: "relative",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  },
  modalCloseBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "#64748b"
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "20px",
    paddingRight: "28px"
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    lineHeight: "1.3"
  },
  modalOrg: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
    margin: "4px 0 0 0"
  },
  modalDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "22px"
  },
  modalDetailItem: {
    display: "flex",
    flexDirection: "column"
  },
  modalDetailLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "3px"
  },
  modalDetailVal: {
    fontSize: "13px",
    color: "#1e293b",
    fontWeight: "600",
    wordBreak: "break-word"
  },
  modalActions: {
    display: "flex",
    gap: "10px"
  },
  modalSaveBtn: {
    flex: 1,
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  modalApplyBtn: {
    flex: 1.4,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "11px",
    fontSize: "13.5px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  }
};
