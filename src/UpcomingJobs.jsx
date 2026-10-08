import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Calendar, Search, ExternalLink, Bookmark, Eye, RefreshCw,
  Building2, MapPin, GraduationCap, X, Clock, Filter, AlertCircle
} from "lucide-react";
import JobLogo from "./JobLogo";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UpcomingJobs({ userEmail = "ashok.udhay@govnotify.in", onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [sortBy, setSortBy] = useState("regDateAsc"); // regDateAsc, lastDateAsc, newestId
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [savingJobId, setSavingJobId] = useState(null);

  // Fetch and filter upcoming jobs with deduplication
  const fetchJobs = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    fetch(`${API_BASE}/api/jobs/all`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const rawJobs = Array.isArray(data) ? data : [];

        // 1. Filter ONLY where job.status is UPCOMING (case-insensitive)
        const upcomingOnly = rawJobs.filter(j => {
          const status = (j.status || "").trim().toUpperCase();
          return status === "UPCOMING";
        });

        // 2. DEDUPLICATION (Critical requirement)
        // Unique key: job.title + "|" + job.organization + "|" + job.state
        // If duplicates exist, keep the first one or the one with the latest lastDate
        const dedupMap = new Map();
        for (const job of upcomingOnly) {
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

        const deduplicatedJobs = Array.from(dedupMap.values());
        setJobs(deduplicatedJobs);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error("Error fetching upcoming jobs:", err);
        setJobs([]);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Save Job to backend (Optimistic UI)
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // Filter & Sort
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.organization && j.organization.toLowerCase().includes(q)) ||
        (j.state && j.state.toLowerCase().includes(q)) ||
        (j.qualification && j.qualification.toLowerCase().includes(q))
      );
    }

    // State filter
    if (selectedState !== "All") {
      result = result.filter(j => {
        if (!j.state) return false;
        if (selectedState === "All India") {
          return j.state.toLowerCase().includes("all-india") ||
                 j.state.toLowerCase().includes("all india") ||
                 j.state.toLowerCase().includes("central");
        }
        return j.state.toLowerCase().includes(selectedState.toLowerCase());
      });
    }

    // Sort by Registration Start Date (soonest first)
    result.sort((a, b) => {
      if (sortBy === "regDateAsc") {
        const dateA = a.registrationStartDate ? new Date(a.registrationStartDate).getTime() : 9999999999999;
        const dateB = b.registrationStartDate ? new Date(b.registrationStartDate).getTime() : 9999999999999;
        return dateA - dateB;
      }
      if (sortBy === "lastDateAsc") {
        const dateA = a.lastDate ? new Date(a.lastDate).getTime() : 9999999999999;
        const dateB = b.lastDate ? new Date(b.lastDate).getTime() : 9999999999999;
        return dateA - dateB;
      }
      if (sortBy === "newestId") {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      return 0;
    });

    return result;
  }, [jobs, searchQuery, selectedState, sortBy]);

  return (
    <div style={styles.page} className="uj-page">
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
            <h1 style={styles.title}>🕐 Upcoming Jobs</h1>
            <span style={styles.upcomingCountPill}>
              <Clock size={14} style={{ marginRight: 4 }} /> {jobs.length} Upcoming
            </span>
          </div>
          <p style={styles.subtitle}>
            Showing <strong>{jobs.length}</strong> upcoming jobs across all states and central government
          </p>
        </div>

        <div style={styles.headerRight}>
          <button
            onClick={() => fetchJobs(true)}
            style={styles.refreshBtn}
            disabled={refreshing}
            title="Refresh latest upcoming job data"
          >
            <RefreshCw size={15} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div style={styles.filterCard}>
        <div style={styles.filterGrid} className="uj-filter-grid">
          {/* Search Bar */}
          <div style={styles.searchBox}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by job title, department, state..."
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

          {/* State Filter */}
          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><MapPin size={13} /> State</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              style={styles.selectInput}
            >
              <option value="All">All States</option>
              <option value="All India">All India / Central</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Kerala">Kerala</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={styles.selectWrapper}>
            <label style={styles.selectLabel}><Calendar size={13} /> Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={styles.selectInput}
            >
              <option value="regDateAsc">Start Date (Soonest First)</option>
              <option value="lastDateAsc">Last Date (Closest First)</option>
              <option value="newestId">Newly Announced (Highest ID)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedState !== "All") && (
          <div style={styles.activeFiltersRow}>
            <span style={styles.activeFilterText}>Active Filters:</span>
            {selectedState !== "All" && (
              <span style={styles.filterTag}>
                State: {selectedState}
                <X size={12} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSelectedState("All")} />
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
                setSelectedState("All");
                setSearchQuery("");
              }}
              style={styles.clearAllBtn}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={styles.emptyCard}>
          <RefreshCw size={36} color="#f59e0b" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
          <h3 style={{ color: "#334155", marginBottom: 6 }}>Loading Upcoming Jobs...</h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Fetching confirmed upcoming recruitment announcements</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={styles.emptyCard}>
          <AlertCircle size={52} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
            No upcoming jobs at the moment. Check back later.
          </h3>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.5 }}>
            {searchQuery || selectedState !== "All"
              ? "No upcoming recruitments match your selected state or search criteria."
              : "All active notifications are currently open for application. Upcoming recruitment notifications will appear here as soon as they are announced."}
          </p>
          {(searchQuery || selectedState !== "All") && (
            <button
              onClick={() => {
                setSelectedState("All");
                setSearchQuery("");
              }}
              style={styles.clearFiltersBtn}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={styles.jobsList}>
          <div style={styles.countSummary}>
            Showing <strong>{filteredJobs.length}</strong> deduplicated upcoming recruitment notifications
          </div>

          {filteredJobs.map((job) => (
            <div key={job.id} style={styles.jobCard}>
              <div style={styles.cardHeader} className="uj-card-header">
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
                      <span style={styles.upcomingBadge}>
                        <Clock size={11} style={{ marginRight: 4 }} /> UPCOMING
                      </span>
                    </div>

                    <div style={styles.orgRow}>
                      <Building2 size={14} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={styles.orgText}>{job.organization || "Government Department"}</span>
                    </div>

                    <div style={styles.tagRow}>
                      <span style={{ ...styles.tag, background: "#ecfdf5", color: "#047857" }}>
                        <MapPin size={12} style={{ marginRight: 4 }} />
                        {job.state || "Central Government"}
                      </span>
                      {job.qualification && (
                        <span style={{ ...styles.tag, background: "#dbeafe", color: "#1d4ed8" }}>
                          <GraduationCap size={12} style={{ marginRight: 4 }} />
                          {job.qualification}
                        </span>
                      )}
                      {job.category && (
                        <span style={{ ...styles.tag, background: "#f3e8ff", color: "#7e22ce" }}>
                          {job.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Right: Dates and Action Buttons */}
                <div style={styles.cardRight} className="uj-card-right">
                  <div style={styles.datesContainer}>
                    <div style={styles.dateBlock}>
                      <span style={styles.dateLabel}>Registration Start Date</span>
                      <strong style={styles.startDateValue}>{fmtDate(job.registrationStartDate)}</strong>
                    </div>

                    {job.lastDate && (
                      <div style={styles.dateBlock}>
                        <span style={styles.dateLabel}>Expected Last Date</span>
                        <strong style={styles.lastDateValue}>{fmtDate(job.lastDate)}</strong>
                      </div>
                    )}
                  </div>

                  <div style={styles.btnRow} className="uj-btn-row">
                    <button
                      onClick={() => handleSaveJob(job)}
                      disabled={savingJobId === job.id}
                      style={styles.saveBtn}
                      title="Save Job"
                    >
                      <Bookmark size={14} />
                      <span>{savingJobId === job.id ? "Saving..." : "Save"}</span>
                    </button>

                    <button
                      onClick={() => setSelectedJobDetail(job)}
                      style={styles.viewBtn}
                      title="View Details"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    <a
                      href={job.officialApplyUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.applyBtn}
                      title="Apply on Official Portal"
                    >
                      <span>Apply</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── JOB DETAIL MODAL ── */}
      {selectedJobDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedJobDetail(null)}>
          <div style={styles.modalCard} className="uj-modal-card" onClick={e => e.stopPropagation()}>
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
                  <span style={styles.upcomingBadge}>
                    <Clock size={11} style={{ marginRight: 3 }} /> UPCOMING
                  </span>
                </div>
                <p style={styles.modalOrg}>🏛️ {selectedJobDetail.organization || "Government Department"}</p>
              </div>
            </div>

            <div style={styles.modalDetailsGrid} className="uj-modal-grid">
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
                <strong style={styles.modalDetailVal}>{selectedJobDetail.qualification || "Graduate / Relevant Qualification"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Category / Sector</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.category || "General"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Registration Start Date</span>
                <strong style={{ ...styles.modalDetailVal, color: "#2563eb" }}>{fmtDate(selectedJobDetail.registrationStartDate)}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Expected Last Date</span>
                <strong style={{ ...styles.modalDetailVal, color: "#ef4444" }}>{fmtDate(selectedJobDetail.lastDate)}</strong>
              </div>
            </div>

            <div style={styles.modalActions} className="uj-modal-actions">
              <button
                type="button"
                onClick={() => handleSaveJob(selectedJobDetail)}
                style={styles.modalSaveBtn}
              >
                <Bookmark size={15} /> Save Job
              </button>
              <a
                href={selectedJobDetail.officialApplyUrl || "#"}
                target="_blank"
                rel="noreferrer"
                style={styles.modalApplyBtn}
              >
                Apply on Official Portal <ExternalLink size={15} />
              </a>
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
          .uj-filter-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .uj-page {
            padding: 16px 12px !important;
          }
          .uj-filter-grid {
            grid-template-columns: 1fr !important;
          }
          .uj-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .uj-card-right {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            border-top: 1px dashed #e2e8f0 !important;
            padding-top: 10px !important;
          }
          .uj-btn-row {
            flex-wrap: wrap !important;
          }
          .uj-modal-card {
            width: 95% !important;
            padding: 20px 16px !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          .uj-modal-grid {
            grid-template-columns: 1fr !important;
          }
          .uj-modal-actions {
            flex-direction: column !important;
          }
        }
        @media (max-width: 440px) {
          .uj-card-right {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .uj-btn-row {
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
  upcomingCountPill: {
    background: "#fef3c7",
    color: "#b45309",
    border: "1px solid #fde68a",
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
    gap: "14px"
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
    gridTemplateColumns: "2fr 1fr 1fr",
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
    border: "1.5px solid #fde68a",
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
  upcomingBadge: {
    background: "#fef3c7",
    color: "#b45309",
    border: "1px solid #fde68a",
    fontSize: "10.5px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center"
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
    gap: "18px",
    flexShrink: 0,
    flexWrap: "wrap"
  },
  datesContainer: {
    display: "flex",
    gap: "16px",
    textAlign: "right"
  },
  dateBlock: {
    display: "flex",
    flexDirection: "column"
  },
  dateLabel: {
    fontSize: "10.5px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    marginBottom: "2px"
  },
  startDateValue: {
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "700"
  },
  lastDateValue: {
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
  clearFiltersBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 22px",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer"
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
