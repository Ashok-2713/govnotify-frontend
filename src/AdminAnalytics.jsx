import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  Bookmark,
  RefreshCw,
  TrendingUp,
  Activity,
  PieChart,
  ArrowLeft,
  Clock,
  Award
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

  const fetchAnalyticsData = useCallback((silent = false) => {
    if (!silent) setIsRefreshing(true);
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
          setError("Unable to connect to analytics services. Please ensure the backend is running.");
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics data:", err);
        setError("Error fetching analytics data from server.");
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  // Initial fetch and auto-refresh every 60 seconds
  useEffect(() => {
    fetchAnalyticsData(false);
    const timer = setInterval(() => {
      fetchAnalyticsData(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchAnalyticsData]);

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

  // Donut chart status segments computation
  const { donutSegments, totalStatusCount } = useMemo(() => {
    const entries = Object.entries(jobsByStatus || {});
    const total = entries.reduce((acc, [, val]) => acc + (Number(val) || 0), 0);

    const statusColorMap = {
      OPEN: "#10b981", // green
      ACTIVE: "#10b981",
      APPROVED: "#10b981",
      CLOSED: "#ef4444", // red
      EXPIRED: "#ef4444",
      UPCOMING: "#f97316", // orange
      ARCHIVED: "#94a3b8", // gray
      PENDING: "#8b5cf6" // purple
    };

    const radius = 68;
    const circumference = 2 * Math.PI * radius; // ~427.2566
    let accumulatedOffset = 0;

    const segments = entries.map(([statusKey, countVal]) => {
      const count = Number(countVal) || 0;
      const normalizedKey = statusKey.toUpperCase();
      let color = "#2563eb"; // fallback blue
      for (const [k, c] of Object.entries(statusColorMap)) {
        if (normalizedKey.includes(k)) {
          color = c;
          break;
        }
      }

      const fraction = total > 0 ? count / total : 0;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += fraction * circumference;
      const percent = total > 0 ? Math.round(fraction * 100) : 0;

      return {
        key: statusKey,
        count,
        percent,
        color,
        strokeDasharray,
        strokeDashoffset
      };
    });

    return { donutSegments: segments, totalStatusCount: total };
  }, [jobsByStatus]);

  return (
    <div className="analytics-module-root">
      <style>{ANALYTICS_STYLES}</style>

      {/* ── 1. PAGE HEADER ── */}
      <div className="analytics-header-card">
        <div className="header-meta">
          <div className="header-top-row">
            <span className="admin-chip">ADMIN ANALYTICS</span>
            {onBack && (
              <button onClick={onBack} className="back-link-btn" title="Back to Dashboard">
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            )}
          </div>
          <h1 className="header-title">Analytics Dashboard</h1>
          <p className="header-subtitle">
            Real-time platform metrics, distribution insights, and candidate activity across India.
          </p>
        </div>

        <div className="header-controls">
          {lastUpdated && (
            <div className="timestamp-badge">
              <Clock size={13} color="#64748b" />
              <span>
                Updated: <strong>{lastUpdated}</strong>
              </span>
            </div>
          )}
          <button
            onClick={() => fetchAnalyticsData(false)}
            disabled={isRefreshing}
            className="refresh-action-btn"
            title="Refresh analytics data"
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none"
              }}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Alert banner if error occurs */}
      {error && (
        <div className="analytics-error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. ROW OF 4 KPI STAT CARDS ── */}
      <section className="analytics-kpi-row">
        {/* KPI 1: Total Jobs */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-blue">
              <Briefcase size={20} color="#2563eb" />
            </div>
            <span className="kpi-tag blue-tag">Total</span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="kpi-skeleton" /> : (overview.totalJobs || 0).toLocaleString()}
          </div>
          <div className="kpi-label">Total Jobs</div>
          <div className="kpi-sub">Across all regions & sectors</div>
        </div>

        {/* KPI 2: Total Users */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-green">
              <Users size={20} color="#10b981" />
            </div>
            <span className="kpi-tag green-tag">Registered</span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="kpi-skeleton" /> : (overview.totalUsers || 0).toLocaleString()}
          </div>
          <div className="kpi-label">Total Users</div>
          <div className="kpi-sub">Active candidate accounts</div>
        </div>

        {/* KPI 3: Saved Jobs */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-purple">
              <Bookmark size={20} color="#7c3aed" />
            </div>
            <span className="kpi-tag purple-tag">Bookmarks</span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="kpi-skeleton" /> : (overview.totalSavedJobs || 0).toLocaleString()}
          </div>
          <div className="kpi-label">Saved Jobs</div>
          <div className="kpi-sub">Candidate saved notifications</div>
        </div>

        {/* KPI 4: Active Jobs */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-orange">
              <TrendingUp size={20} color="#ea580c" />
            </div>
            <span className="kpi-tag orange-tag">Open Now</span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="kpi-skeleton" /> : (overview.activeJobs || 0).toLocaleString()}
          </div>
          <div className="kpi-label">Active Jobs</div>
          <div className="kpi-sub">Currently accepting applications</div>
        </div>
      </section>

      {/* ── 3. TWO-COLUMN GRID: JOBS BY STATE & JOBS BY CATEGORY ── */}
      <section className="analytics-charts-grid">
        {/* Left: Jobs by State */}
        <div className="pro-chart-card">
          <div className="chart-header">
            <div className="chart-header-left">
              <div className="chart-badge-icon blue-badge">
                <BarChart3 size={17} color="#2563eb" />
              </div>
              <div>
                <h3 className="chart-title">Jobs by State</h3>
                <p className="chart-desc">Regional distribution of government opportunities</p>
              </div>
            </div>
            <span className="count-pill">{sortedStates.length} Regions</span>
          </div>

          <div className="chart-body">
            {loading ? (
              <div className="chart-loading-state">
                <RefreshCw size={22} className="spin-icon" color="#2563eb" />
                <span>Loading state breakdown...</span>
              </div>
            ) : sortedStates.length === 0 ? (
              <div className="chart-empty-state">No state-level data recorded.</div>
            ) : (
              <div className="bar-chart-list">
                {sortedStates.map(([stateName, count]) => {
                  const pct = Math.round((count / maxStateCount) * 100);
                  return (
                    <div className="bar-row-wrap" key={stateName}>
                      <div className="bar-label-col">
                        <span className="bar-label-text" title={stateName}>
                          {stateName}
                        </span>
                      </div>
                      <div className="bar-track-col">
                        <div
                          className="bar-fill-bar bar-blue-gradient"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <div className="bar-count-col">
                        <span className="bar-count-value">{count.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Jobs by Category */}
        <div className="pro-chart-card">
          <div className="chart-header">
            <div className="chart-header-left">
              <div className="chart-badge-icon green-badge">
                <PieChart size={17} color="#10b981" />
              </div>
              <div>
                <h3 className="chart-title">Jobs by Category</h3>
                <p className="chart-desc">Sectors & occupational departments</p>
              </div>
            </div>
            <span className="count-pill">{sortedCategories.length} Categories</span>
          </div>

          <div className="chart-body">
            {loading ? (
              <div className="chart-loading-state">
                <RefreshCw size={22} className="spin-icon" color="#10b981" />
                <span>Loading category metrics...</span>
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="chart-empty-state">No category data recorded.</div>
            ) : (
              <div className="bar-chart-list">
                {sortedCategories.map(([catName, count]) => {
                  const pct = Math.round((count / maxCategoryCount) * 100);
                  return (
                    <div className="bar-row-wrap" key={catName}>
                      <div className="bar-label-col">
                        <span className="bar-label-text" title={catName}>
                          {catName}
                        </span>
                      </div>
                      <div className="bar-track-col">
                        <div
                          className="bar-fill-bar bar-green-gradient"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <div className="bar-count-col">
                        <span className="bar-count-value">{count.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. FULL-WIDTH ROW: JOBS BY STATUS (DONUT CHART) ── */}
      <section className="pro-chart-card">
        <div className="chart-header">
          <div className="chart-header-left">
            <div className="chart-badge-icon orange-badge">
              <Activity size={17} color="#ea580c" />
            </div>
            <div>
              <h3 className="chart-title">Jobs by Status</h3>
              <p className="chart-desc">Current lifecycle stages of all recorded vacancies</p>
            </div>
          </div>
          <span className="count-pill">{donutSegments.length} Status Types</span>
        </div>

        <div className="chart-body">
          {loading ? (
            <div className="chart-loading-state">
              <RefreshCw size={22} className="spin-icon" color="#ea580c" />
              <span>Analyzing job statuses...</span>
            </div>
          ) : donutSegments.length === 0 ? (
            <div className="chart-empty-state">No status distribution available.</div>
          ) : (
            <div className="donut-chart-layout">
              {/* SVG Donut */}
              <div className="donut-visual-box">
                <svg viewBox="0 0 200 200" className="donut-svg">
                  {/* Background Track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="68"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="24"
                  />
                  {/* Segments */}
                  <g transform="rotate(-90 100 100)">
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.key}
                        cx="100"
                        cy="100"
                        r="68"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="24"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="round"
                        className="donut-circle-slice"
                      />
                    ))}
                  </g>
                  {/* Center Text */}
                  <text
                    x="100"
                    y="94"
                    textAnchor="middle"
                    className="donut-center-val"
                  >
                    {totalStatusCount.toLocaleString()}
                  </text>
                  <text
                    x="100"
                    y="114"
                    textAnchor="middle"
                    className="donut-center-sub"
                  >
                    TOTAL JOBS
                  </text>
                </svg>
              </div>

              {/* Status Legend & Metrics */}
              <div className="donut-legend-list">
                {donutSegments.map((seg) => (
                  <div className="donut-legend-item" key={seg.key}>
                    <div className="legend-label-group">
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="legend-title">{seg.key}</span>
                    </div>
                    <div className="legend-val-group">
                      <span className="legend-count">{seg.count.toLocaleString()}</span>
                      <span
                        className="legend-pct-pill"
                        style={{
                          backgroundColor: `${seg.color}18`,
                          color: seg.color
                        }}
                      >
                        {seg.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. FULL-WIDTH TABLE: TOP 10 MOST-SAVED JOBS ── */}
      <section className="pro-chart-card">
        <div className="chart-header">
          <div className="chart-header-left">
            <div className="chart-badge-icon purple-badge">
              <Award size={17} color="#7c3aed" />
            </div>
            <div>
              <h3 className="chart-title">Top 10 Most-Saved Jobs</h3>
              <p className="chart-desc">Candidate interest and highest engagement notifications</p>
            </div>
          </div>
          <span className="count-pill">Ranked by Saves</span>
        </div>

        <div className="chart-body" style={{ padding: "0" }}>
          {loading ? (
            <div className="chart-loading-state" style={{ padding: "40px" }}>
              <RefreshCw size={22} className="spin-icon" color="#7c3aed" />
              <span>Loading saved bookmark rankings...</span>
            </div>
          ) : topSavedJobs.length === 0 ? (
            <div className="chart-empty-state">No saved jobs bookmarks recorded yet.</div>
          ) : (
            <div className="table-responsive-container">
              <table className="admin-analytics-table">
                <thead>
                  <tr>
                    <th style={{ width: "90px" }}>Rank</th>
                    <th>Notification Title</th>
                    <th style={{ width: "160px", textAlign: "right" }}>Total Saves</th>
                  </tr>
                </thead>
                <tbody>
                  {topSavedJobs.map((job, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={job.jobId || idx} className="table-row-hover">
                        <td>
                          <span
                            className={`rank-pill ${
                              rank === 1
                                ? "rank-1"
                                : rank === 2
                                ? "rank-2"
                                : rank === 3
                                ? "rank-3"
                                : "rank-n"
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>
                        <td>
                          <div className="job-title-stack">
                            <span className="job-main-title">
                              {job.jobTitle || "Government Job Notification"}
                            </span>
                            {job.jobId && (
                              <span className="job-id-tag">ID: {job.jobId}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="saved-metric-pill">
                            <Bookmark size={13} color="#7c3aed" />
                            <strong>{(job.savedCount || 0).toLocaleString()}</strong>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const ANALYTICS_STYLES = `
  /* CSS Reset for Module */
  .analytics-module-root {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  /* ---------------- HEADER CARD ---------------- */
  .analytics-header-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 24px 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .header-top-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .admin-chip {
    font-size: 11px;
    font-weight: 800;
    color: #2563eb;
    letter-spacing: 0.8px;
  }

  .back-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .back-link-btn:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .header-title {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    margin-bottom: 4px;
  }

  .header-subtitle {
    font-size: 13.5px;
    color: #64748b;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .timestamp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 7px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #64748b;
  }

  .timestamp-badge strong {
    color: #0f172a;
  }

  .refresh-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  .refresh-action-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .refresh-action-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .analytics-error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 500;
  }

  /* ---------------- KPI ROW ---------------- */
  .analytics-kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }

  .analytics-kpi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 20px 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .analytics-kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .kpi-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-blue { background: #eff6ff; border: 1px solid #dbeafe; }
  .icon-green { background: #f0fdf4; border: 1px solid #dcfce7; }
  .icon-purple { background: #f5f3ff; border: 1px solid #ede9fe; }
  .icon-orange { background: #fff7ed; border: 1px solid #ffedd5; }

  .kpi-tag {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .blue-tag { background: #eff6ff; color: #2563eb; }
  .green-tag { background: #f0fdf4; color: #16a34a; }
  .purple-tag { background: #f5f3ff; color: #7c3aed; }
  .orange-tag { background: #fff7ed; color: #ea580c; }

  .kpi-num {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    margin-bottom: 4px;
  }

  .kpi-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .kpi-sub {
    font-size: 11.5px;
    color: #94a3b8;
    margin-top: 4px;
  }

  .kpi-skeleton {
    display: inline-block;
    width: 65px;
    height: 28px;
    background: #e2e8f0;
    border-radius: 6px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  /* ---------------- PRO CHART CARD ---------------- */
  .pro-chart-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .pro-chart-card:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid #f1f5f9;
    flex-wrap: wrap;
    gap: 12px;
  }

  .chart-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chart-badge-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blue-badge { background: #eff6ff; }
  .green-badge { background: #f0fdf4; }
  .orange-badge { background: #fff7ed; }
  .purple-badge { background: #f5f3ff; }

  .chart-title {
    font-size: 15.5px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }

  .chart-desc {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }

  .count-pill {
    font-size: 11.5px;
    font-weight: 700;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .chart-body {
    padding: 24px;
  }

  .chart-loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 36px 16px;
    color: #64748b;
    font-size: 13px;
  }

  .chart-empty-state {
    text-align: center;
    color: #94a3b8;
    padding: 36px 16px;
    font-size: 13px;
  }

  /* ---------------- TWO-COLUMN BAR CHARTS ---------------- */
  .analytics-charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .bar-chart-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bar-row-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 28px;
  }

  .bar-label-col {
    width: 130px;
    flex-shrink: 0;
  }

  .bar-label-text {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track-col {
    flex: 1;
    height: 28px;
    background: #f1f5f9;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .bar-fill-bar {
    height: 100%;
    border-radius: 8px;
    transition: width 0.6s ease;
  }

  .bar-blue-gradient {
    background: linear-gradient(90deg, #2563eb, #38bdf8);
  }

  .bar-green-gradient {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  .bar-count-col {
    width: 60px;
    text-align: right;
    flex-shrink: 0;
  }

  .bar-count-value {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  /* ---------------- DONUT CHART (JOBS BY STATUS) ---------------- */
  .donut-chart-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    align-items: center;
    gap: 32px;
  }

  .donut-visual-box {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .donut-svg {
    width: 190px;
    height: 190px;
  }

  .donut-circle-slice {
    transition: stroke-dasharray 0.6s ease, stroke 0.3s ease;
  }

  .donut-center-val {
    font-size: 24px;
    font-weight: 800;
    fill: #0f172a;
  }

  .donut-center-sub {
    font-size: 10px;
    font-weight: 700;
    fill: #94a3b8;
    letter-spacing: 0.8px;
  }

  .donut-legend-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }

  .donut-legend-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .legend-label-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-title {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .legend-val-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .legend-count {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }

  .legend-pct-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 9999px;
  }

  /* ---------------- TOP 10 SAVED JOBS TABLE ---------------- */
  .table-responsive-container {
    width: 100%;
    overflow-x: auto;
  }

  .admin-analytics-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
    text-align: left;
  }

  .admin-analytics-table th {
    padding: 12px 24px;
    background: #f8fafc;
    color: #64748b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
  }

  .admin-analytics-table td {
    padding: 14px 24px;
    border-bottom: 1px solid #f1f5f9;
    color: #0f172a;
    vertical-align: middle;
  }

  .table-row-hover:hover {
    background-color: #f8fafc;
  }

  .rank-pill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11.5px;
    text-align: center;
  }

  .rank-1 { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .rank-2 { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  .rank-3 { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
  .rank-n { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

  .job-title-stack {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .job-main-title {
    font-weight: 600;
    color: #0f172a;
  }

  .job-id-tag {
    font-size: 10.5px;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .saved-metric-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f5f3ff;
    color: #7c3aed;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12.5px;
  }

  .saved-metric-pill strong {
    font-weight: 800;
  }

  /* ---------------- ANIMATIONS ---------------- */
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

  /* ---------------- RESPONSIVE BREAKPOINTS ---------------- */
  @media (max-width: 1024px) {
    .analytics-kpi-row {
      grid-template-columns: repeat(2, 1fr);
    }
    .analytics-charts-grid {
      grid-template-columns: 1fr;
    }
    .donut-chart-layout {
      grid-template-columns: 1fr;
      justify-items: center;
    }
  }

  @media (max-width: 640px) {
    .analytics-kpi-row {
      grid-template-columns: 1fr;
    }
    .analytics-header-card {
      padding: 16px;
      flex-direction: column;
      align-items: stretch;
    }
    .header-controls {
      justify-content: space-between;
    }
    .bar-row-wrap {
      gap: 8px;
    }
    .bar-label-col {
      width: 100px;
    }
    .admin-analytics-table th,
    .admin-analytics-table td {
      padding: 10px 14px;
    }
  }
`;
