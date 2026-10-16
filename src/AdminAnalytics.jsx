import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  Bookmark,
  RefreshCw,
  TrendingUp,
  Activity,
  PieChart
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function AdminAnalytics({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState({
    totalJobs: 0,
    totalUsers: 0,
    totalSavedJobs: 0,
    activeJobs: 0
  });

  const [jobsByState, setJobsByState] = useState({});
  const [jobsByCategory, setJobsByCategory] = useState({});
  const [jobsByStatus, setJobsByStatus] = useState({});
  const [topSavedJobs, setTopSavedJobs] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalyticsData = () => {
    setIsRefreshing(true);
    setError(null);

    Promise.allSettled([
      fetch(`${API_BASE}/api/admin/analytics/overview`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText)
      ),
      fetch(`${API_BASE}/api/admin/analytics/jobs-by-state`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText)
      ),
      fetch(`${API_BASE}/api/admin/analytics/jobs-by-category`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText)
      ),
      fetch(`${API_BASE}/api/admin/analytics/jobs-by-status`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText)
      ),
      fetch(`${API_BASE}/api/admin/analytics/top-saved-jobs`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText)
      )
    ])
      .then(([ovRes, stRes, catRes, statRes, topRes]) => {
        let hasData = false;

        if (ovRes.status === "fulfilled" && ovRes.value) {
          setOverview(ovRes.value);
          hasData = true;
        }
        if (stRes.status === "fulfilled" && stRes.value) {
          setJobsByState(stRes.value);
          hasData = true;
        }
        if (catRes.status === "fulfilled" && catRes.value) {
          setJobsByCategory(catRes.value);
          hasData = true;
        }
        if (statRes.status === "fulfilled" && statRes.value) {
          setJobsByStatus(statRes.value);
          hasData = true;
        }
        if (topRes.status === "fulfilled" && Array.isArray(topRes.value)) {
          setTopSavedJobs(topRes.value.slice(0, 10));
          hasData = true;
        }

        const now = new Date();
        setLastUpdated(
          now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })
        );

        if (!hasData) {
          setError("Could not connect to backend server. Make sure the Spring Boot API is running.");
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics data:", err);
        setError("Error fetching analytics data from the server.");
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Sorted list for State
  const sortedStates = useMemo(() => {
    return Object.entries(jobsByState || {}).sort((a, b) => b[1] - a[1]);
  }, [jobsByState]);

  const maxStateCount = useMemo(() => {
    if (sortedStates.length === 0) return 1;
    return Math.max(...sortedStates.map(([, count]) => count), 1);
  }, [sortedStates]);

  // Sorted list for Category
  const sortedCategories = useMemo(() => {
    return Object.entries(jobsByCategory || {}).sort((a, b) => b[1] - a[1]);
  }, [jobsByCategory]);

  const maxCategoryCount = useMemo(() => {
    if (sortedCategories.length === 0) return 1;
    return Math.max(...sortedCategories.map(([, count]) => count), 1);
  }, [sortedCategories]);

  // Badge style resolver for status
  const getStatusBadgeStyle = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("OPEN") || s.includes("ACTIVE")) {
      return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" };
    }
    if (s.includes("CLOSE") || s.includes("EXPIRED")) {
      return { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" };
    }
    if (s.includes("UPCOMING")) {
      return { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" };
    }
    if (s.includes("ARCHIV")) {
      return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    }
    return { bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe" };
  };

  return (
    <div className="pro-analytics-root">
      <style>{ANALYTICS_CSS}</style>

      <div className="analytics-container">
        {/* ── 1. PAGE HEADER ── */}
        <header className="analytics-header">
          <div className="header-titles">
            <div className="header-badge">
              <Activity size={14} color="#2563eb" />
              <span>Platform Intelligence</span>
            </div>
            <h1>Admin Analytics Dashboard</h1>
            <p>Real-time overview of platform activity, job distributions, and user engagement</p>
          </div>

          <div className="header-actions">
            {lastUpdated && (
              <span className="last-updated-text">
                Last updated at <strong>{lastUpdated}</strong>
              </span>
            )}
            <button
              onClick={fetchAnalyticsData}
              disabled={isRefreshing}
              className="refresh-btn"
              title="Refresh analytics data"
            >
              <RefreshCw
                size={16}
                style={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none"
                }}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
            </button>
            {onBack && (
              <button onClick={onBack} className="back-btn">
                Back
              </button>
            )}
          </div>
        </header>

        {/* Error notification banner if any */}
        {error && (
          <div className="analytics-alert-banner">
            <span>{error}</span>
          </div>
        )}

        {/* ── 2. ROW OF 4 KPI CARDS (Matching UserDashboard style) ── */}
        <section className="pro-kpi-grid">
          {/* Card 1: Total Jobs */}
          <div className="pro-kpi-card blue">
            <div className="kpi-header">
              <div className="kpi-ico-box blue">
                <Briefcase size={22} color="#2563eb" />
              </div>
              <TrendingUp size={18} className="trend-ico blue" />
            </div>
            <div className="kpi-content">
              {loading ? (
                <span className="kpi-skeleton" />
              ) : (
                <h2>{(overview.totalJobs || 0).toLocaleString()}</h2>
              )}
              <span className="kpi-title">Total Jobs</span>
              <small className="kpi-sub">Across all regions & sectors</small>
            </div>
          </div>

          {/* Card 2: Total Users */}
          <div className="pro-kpi-card green">
            <div className="kpi-header">
              <div className="kpi-ico-box green">
                <Users size={22} color="#10b981" />
              </div>
              <TrendingUp size={18} className="trend-ico green" />
            </div>
            <div className="kpi-content">
              {loading ? (
                <span className="kpi-skeleton" />
              ) : (
                <h2>{(overview.totalUsers || 0).toLocaleString()}</h2>
              )}
              <span className="kpi-title">Total Users</span>
              <small className="kpi-sub">Registered candidate profiles</small>
            </div>
          </div>

          {/* Card 3: Saved Jobs */}
          <div className="pro-kpi-card purple">
            <div className="kpi-header">
              <div className="kpi-ico-box purple">
                <Bookmark size={22} color="#8b5cf6" />
              </div>
              <TrendingUp size={18} className="trend-ico purple" />
            </div>
            <div className="kpi-content">
              {loading ? (
                <span className="kpi-skeleton" />
              ) : (
                <h2>{(overview.totalSavedJobs || 0).toLocaleString()}</h2>
              )}
              <span className="kpi-title">Saved Jobs</span>
              <small className="kpi-sub">Bookmarked notifications</small>
            </div>
          </div>

          {/* Card 4: Active Jobs */}
          <div className="pro-kpi-card orange">
            <div className="kpi-header">
              <div className="kpi-ico-box orange">
                <TrendingUp size={22} color="#f97316" />
              </div>
              <Activity size={18} className="trend-ico orange" />
            </div>
            <div className="kpi-content">
              {loading ? (
                <span className="kpi-skeleton" />
              ) : (
                <h2>{(overview.activeJobs || 0).toLocaleString()}</h2>
              )}
              <span className="kpi-title">Active Jobs</span>
              <small className="kpi-sub">Currently open for application</small>
            </div>
          </div>
        </section>

        {/* ── 3. TWO-COLUMN GRID: JOBS BY STATE & CATEGORY ── */}
        <section className="analytics-two-col">
          {/* Left Column: Jobs by State */}
          <div className="pro-card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <BarChart3 size={18} color="#2563eb" />
                <h3>Jobs by State</h3>
              </div>
              <span className="panel-badge">{sortedStates.length} Regions</span>
            </div>

            {loading ? (
              <div className="panel-loading-state">
                <RefreshCw size={24} className="spin-icon" color="#2563eb" />
                <p>Loading regional job metrics...</p>
              </div>
            ) : sortedStates.length === 0 ? (
              <div className="panel-empty-state">
                <p>No regional job statistics available.</p>
              </div>
            ) : (
              <div className="bar-list">
                {sortedStates.map(([stateName, count]) => {
                  const pct = Math.round((count / maxStateCount) * 100);
                  return (
                    <div key={stateName} className="bar-row">
                      <div className="bar-label-group">
                        <span className="bar-name">{stateName}</span>
                        <span className="bar-val">
                          {count} {count === 1 ? "job" : "jobs"}
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill blue-fill"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Jobs by Category */}
          <div className="pro-card-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <PieChart size={18} color="#10b981" />
                <h3>Jobs by Category</h3>
              </div>
              <span className="panel-badge">{sortedCategories.length} Categories</span>
            </div>

            {loading ? (
              <div className="panel-loading-state">
                <RefreshCw size={24} className="spin-icon" color="#10b981" />
                <p>Loading category statistics...</p>
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="panel-empty-state">
                <p>No category statistics available.</p>
              </div>
            ) : (
              <div className="bar-list">
                {sortedCategories.map(([categoryName, count]) => {
                  const pct = Math.round((count / maxCategoryCount) * 100);
                  return (
                    <div key={categoryName} className="bar-row">
                      <div className="bar-label-group">
                        <span className="bar-name">{categoryName}</span>
                        <span className="bar-val">
                          {count} {count === 1 ? "job" : "jobs"}
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill green-fill"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── 4. FULL-WIDTH: JOBS BY STATUS ── */}
        <section className="pro-card-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Activity size={18} color="#f97316" />
              <h3>Jobs by Status</h3>
            </div>
            <span className="panel-badge">
              {Object.keys(jobsByStatus || {}).length} Status Types
            </span>
          </div>

          {loading ? (
            <div className="panel-loading-state">
              <RefreshCw size={24} className="spin-icon" color="#f97316" />
              <p>Analyzing job statuses...</p>
            </div>
          ) : Object.keys(jobsByStatus || {}).length === 0 ? (
            <div className="panel-empty-state">
              <p>No job status data recorded.</p>
            </div>
          ) : (
            <div className="status-grid">
              {Object.entries(jobsByStatus).map(([statusName, count]) => {
                const badgeStyle = getStatusBadgeStyle(statusName);
                return (
                  <div
                    key={statusName}
                    className="status-card"
                    style={{ borderColor: badgeStyle.border }}
                  >
                    <div
                      className="status-pill"
                      style={{
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`
                      }}
                    >
                      <span
                        className="status-dot"
                        style={{ backgroundColor: badgeStyle.color }}
                      />
                      {statusName}
                    </div>
                    <div className="status-count">{count}</div>
                    <div className="status-label">Total Notifications</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 5. FULL-WIDTH TABLE: TOP 10 SAVED JOBS ── */}
        <section className="pro-card-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Bookmark size={18} color="#8b5cf6" />
              <h3>Top 10 Most-Saved Jobs</h3>
            </div>
            <span className="panel-badge">Popular Among Candidates</span>
          </div>

          {loading ? (
            <div className="panel-loading-state">
              <RefreshCw size={24} className="spin-icon" color="#8b5cf6" />
              <p>Loading candidate bookmark rankings...</p>
            </div>
          ) : topSavedJobs.length === 0 ? (
            <div className="panel-empty-state">
              <p>No saved job bookmarks found in the database yet.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th style={{ width: "90px" }}>Rank</th>
                    <th>Job Title</th>
                    <th style={{ width: "160px", textAlign: "right" }}>Saved Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topSavedJobs.map((job, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={job.jobId || idx} className="table-row">
                        <td>
                          <span
                            className={`rank-badge ${
                              rank === 1
                                ? "rank-gold"
                                : rank === 2
                                ? "rank-silver"
                                : rank === 3
                                ? "rank-bronze"
                                : "rank-default"
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>
                        <td>
                          <div className="job-title-cell">
                            <span className="job-title-text">
                              {job.jobTitle || "Government Job Notification"}
                            </span>
                            {job.jobId && (
                              <span className="job-id-pill">ID: {job.jobId}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="saved-count-pill">
                            <Bookmark size={12} color="#8b5cf6" />
                            <strong>{job.savedCount}</strong> saves
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const ANALYTICS_CSS = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .pro-analytics-root {
    width: 100%;
    min-height: 100vh;
    background-color: #f8fafc;
    color: #0f172a;
    padding: 32px 24px;
    display: flex;
    justify-content: center;
  }

  .analytics-container {
    width: 100%;
    max-width: 1240px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Header */
  .analytics-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .header-titles h1 {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }

  .header-titles p {
    font-size: 13.5px;
    color: #64748b;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .last-updated-text {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .last-updated-text strong {
    color: #0f172a;
  }

  .refresh-btn {
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s, transform 0.1s;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  .refresh-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .refresh-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .back-btn {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
  }

  .back-btn:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .analytics-alert-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
  }

  /* KPI Grid */
  .pro-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }

  .pro-kpi-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .pro-kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
  }

  .kpi-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .kpi-ico-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
  }

  .kpi-ico-box.blue { background: #dbeafe; }
  .kpi-ico-box.green { background: #dcfce7; }
  .kpi-ico-box.purple { background: #f3e8ff; }
  .kpi-ico-box.orange { background: #ffedd5; }

  .trend-ico.blue { color: #2563eb; }
  .trend-ico.green { color: #10b981; }
  .trend-ico.purple { color: #8b5cf6; }
  .trend-ico.orange { color: #f97316; }

  .kpi-content h2 {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 2px;
    line-height: 1;
  }

  .kpi-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-right: 6px;
  }

  .kpi-sub {
    font-size: 11px;
    color: #64748b;
  }

  .kpi-skeleton {
    display: inline-block;
    width: 60px;
    height: 28px;
    background: #e2e8f0;
    border-radius: 6px;
    animation: pulse 1.5s ease-in-out infinite;
    margin-bottom: 2px;
  }

  /* Two-column layout */
  .analytics-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* Pro Card Panel */
  .pro-card-panel {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .panel-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .panel-title-group h3 {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  .panel-badge {
    font-size: 11.5px;
    font-weight: 700;
    background: #f1f5f9;
    color: #475569;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .panel-loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 16px;
    color: #64748b;
    font-size: 13px;
  }

  .panel-empty-state {
    padding: 36px 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }

  /* Horizontal Bar Lists */
  .bar-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bar-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bar-label-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
  }

  .bar-name {
    font-weight: 600;
    color: #0f172a;
  }

  .bar-val {
    font-weight: 700;
    color: #64748b;
    font-size: 12px;
  }

  .bar-track {
    width: 100%;
    height: 8px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease-out;
  }

  .blue-fill { background: #2563eb; }
  .green-fill { background: #10b981; }

  /* Status Grid */
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .status-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    width: fit-content;
    letter-spacing: 0.4px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .status-count {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }

  .status-label {
    font-size: 11px;
    color: #64748b;
  }

  /* Table styling */
  .table-responsive-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .analytics-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
    text-align: left;
  }

  .analytics-table th {
    padding: 12px 16px;
    background: #f8fafc;
    color: #64748b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
  }

  .analytics-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #0f172a;
    vertical-align: middle;
  }

  .table-row:hover {
    background-color: #f8fafc;
  }

  .rank-badge {
    display: inline-block;
    padding: 4px 9px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11.5px;
    text-align: center;
  }

  .rank-gold { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .rank-silver { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  .rank-bronze { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
  .rank-default { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

  .job-title-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .job-title-text {
    font-weight: 600;
    color: #0f172a;
  }

  .job-id-pill {
    font-size: 10.5px;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .saved-count-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f3e8ff;
    color: #7c3aed;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12.5px;
  }

  .saved-count-pill strong {
    font-weight: 800;
  }

  /* Keyframe animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spin-icon {
    animation: spin 1s linear infinite;
  }

  /* Responsive breakpoints */
  @media (max-width: 1024px) {
    .pro-kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .analytics-two-col {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .pro-analytics-root {
      padding: 16px 12px;
    }
    .pro-kpi-grid {
      grid-template-columns: 1fr;
    }
    .analytics-header {
      padding: 16px;
      flex-direction: column;
      align-items: stretch;
    }
    .header-actions {
      justify-content: space-between;
    }
  }
`;
