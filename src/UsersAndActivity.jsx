import { useEffect, useState, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  Shield,
  UserCheck,
  Activity,
  Search,
  RefreshCw,
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  X,
  Mail,
  Award,
  Info
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function UsersAndActivity({ adminEmail = "ashokudhay2007@gmail.com" }) {
  const [users, setUsers] = useState([]);
  const [userActivities, setUserActivities] = useState({}); // { [email]: { savedJobs: [], profile: null } }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "ADMIN" | "USER"
  const [sortBy, setSortBy] = useState("nameAsc"); // "nameAsc" | "nameDesc" | "role" | "activity"

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);

  // Load all users and their real recorded activity
  async function loadData(showToast = false) {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Fetch all registered users
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { "X-Admin-Email": adminEmail }
      });
      if (!usersRes.ok) {
        throw new Error(`Server returned HTTP ${usersRes.status}`);
      }
      const usersData = await usersRes.json();
      const userList = Array.isArray(usersData) ? usersData : [];
      setUsers(userList);

      // 2. Fetch real activity (saved jobs & profiles) for all users concurrently
      const activityMap = {};
      await Promise.all(
        userList.map(async (u) => {
          let savedJobs = [];
          let profile = null;
          try {
            const sjRes = await fetch(`${API_URL}/api/saved-jobs/list/${encodeURIComponent(u.email)}`);
            if (sjRes.ok) {
              const sjData = await sjRes.json();
              if (Array.isArray(sjData)) savedJobs = sjData;
            }
          } catch {
            // Ignore individual fetch errors
          }

          try {
            const pRes = await fetch(`${API_URL}/api/eligibility/get-profile/${encodeURIComponent(u.email)}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData && (pData.qualification || pData.preferredState || pData.category)) {
                profile = pData;
              }
            }
          } catch {
            // Ignore profile fetch errors
          }

          activityMap[u.email] = { savedJobs, profile };
        })
      );
      setUserActivities(activityMap);

      if (showToast) {
        setSuccessToast("User data & real database activity refreshed successfully!");
        setTimeout(() => setSuccessToast(""), 4000);
      }
    } catch (err) {
      console.error("Error loading users and activity:", err);
      setErrorMessage("Unable to load users from backend. Please verify your admin session.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [adminEmail]);

  // Compute Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter((u) => (u.role || "").toUpperCase() === "ADMIN").length;
    const candidateCount = users.filter((u) => (u.role || "").toUpperCase() === "USER").length;

    let totalSavedJobs = 0;
    let profilesCompleted = 0;

    Object.values(userActivities).forEach((act) => {
      totalSavedJobs += (act.savedJobs || []).length;
      if (act.profile) profilesCompleted += 1;
    });

    return {
      totalUsers,
      adminCount,
      candidateCount,
      totalSavedJobs,
      profilesCompleted,
      totalActions: totalSavedJobs + profilesCompleted
    };
  }, [users, userActivities]);

  // Unified Chronological Activity Feed from real database entries
  const globalActivityFeed = useMemo(() => {
    const events = [];

    users.forEach((u) => {
      const act = userActivities[u.email];
      if (!act) return;

      // Saved jobs
      (act.savedJobs || []).forEach((sj) => {
        events.push({
          id: `sj-${sj.id}`,
          type: "SAVED_JOB",
          user: u,
          title: sj.jobTitle || "Official Notification",
          org: sj.organization || "Govt Authority",
          date: sj.savedAt || null,
          url: sj.officialApplyUrl
        });
      });

      // Profile updates
      if (act.profile && act.profile.lastUpdated) {
        events.push({
          id: `prof-${u.id || u.email}`,
          type: "PROFILE_UPDATE",
          user: u,
          title: `Updated Eligibility Profile (${act.profile.qualification || "General"}, ${act.profile.category || "General"})`,
          org: act.profile.preferredState ? `Preferred State: ${act.profile.preferredState}` : "Eligibility Criteria",
          date: act.profile.lastUpdated,
          url: null
        });
      }
    });

    // Sort descending by date
    events.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    return events;
  }, [users, userActivities]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let list = [...users];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (roleFilter !== "ALL") {
      list = list.filter((u) => (u.role || "").toUpperCase() === roleFilter.toUpperCase());
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "nameAsc") {
        return (a.fullName || a.email).localeCompare(b.fullName || b.email);
      }
      if (sortBy === "nameDesc") {
        return (b.fullName || b.email).localeCompare(a.fullName || a.email);
      }
      if (sortBy === "role") {
        return (a.role || "").localeCompare(b.role || "");
      }
      if (sortBy === "activity") {
        const countA = (userActivities[a.email]?.savedJobs || []).length;
        const countB = (userActivities[b.email]?.savedJobs || []).length;
        return countB - countA;
      }
      return 0;
    });

    return list;
  }, [users, searchQuery, roleFilter, sortBy, userActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  return (
    <div className="users-activity-module">
      <style>{usersActivityStyles}</style>

      {/* MODULE HEADER ROW */}
      <div className="page-header-row">
        <div className="header-text-group">
          <span className="module-tag">ADMIN MODULE</span>
          <h1 className="page-title">Users &amp; Account Activity</h1>
          <p className="page-subtitle">
            Audit registered user accounts, assigned administrative roles, and real database activity.
          </p>
        </div>

        <div className="header-action-group">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="refresh-btn"
            title="Refresh user data directly from database"
          >
            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST / ERROR BANNER */}
      {successToast && (
        <div className="admin-alert-banner success">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast("")} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="admin-alert-banner error">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* PRIVACY & AUDIT NOTICE BANNER */}
      <div className="audit-notice-banner">
        <div className="notice-icon-box">
          <Info size={18} color="#2563eb" />
        </div>
        <div className="notice-content">
          <strong>Database Audit Integrity:</strong> Displaying real registered users and activity records directly
          from the MySQL database. Password hashes and credentials are strictly protected and never exposed.
          <em>
            {" "}
            Note: GovNotify uses stateless token-based requests; historical login/logout timestamps and continuous
            session heartbeats are not recorded by the existing backend architecture.
          </em>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="stats-grid-row">
        {/* Stat 1: Total Registered Users */}
        <div className="stat-card stat-blue">
          <div className="stat-header">
            <div className="stat-icon-wrap icon-blue">
              <Users size={20} color="#2563eb" />
            </div>
            <div className="stat-label">Total Registered Users</div>
          </div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-subtext text-slate">
            <span>👥</span> Verified in MySQL
          </div>
        </div>

        {/* Stat 2: System Administrators */}
        <div className="stat-card stat-purple">
          <div className="stat-header">
            <div className="stat-icon-wrap icon-purple">
              <ShieldCheck size={20} color="#7c3aed" />
            </div>
            <div className="stat-label">System Administrators</div>
          </div>
          <div className="stat-value">{stats.adminCount}</div>
          <div className="stat-subtext text-purple">
            <span>🛡️</span> Full administrative access
          </div>
        </div>

        {/* Stat 3: Registered Candidates */}
        <div className="stat-card stat-green">
          <div className="stat-header">
            <div className="stat-icon-wrap icon-green">
              <UserCheck size={20} color="#16a34a" />
            </div>
            <div className="stat-label">Registered Candidates</div>
          </div>
          <div className="stat-value">{stats.candidateCount}</div>
          <div className="stat-subtext text-green">
            <span>🎓</span> Job seekers &amp; applicants
          </div>
        </div>

        {/* Stat 4: Tracked Database Actions */}
        <div className="stat-card stat-orange">
          <div className="stat-header">
            <div className="stat-icon-wrap icon-orange">
              <Activity size={20} color="#ea580c" />
            </div>
            <div className="stat-label">Tracked User Actions</div>
          </div>
          <div className="stat-value">{stats.totalActions}</div>
          <div className="stat-subtext text-orange">
            <span>⚡</span> {stats.totalSavedJobs} saved jobs · {stats.profilesCompleted} profile updates
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID: USERS TABLE (LEFT) + REAL AUDIT STREAM & POLICY (RIGHT) */}
      <div className="dashboard-grid-layout">
        {/* LEFT / CENTER: USERS TABLE CARD */}
        <div className="main-column-wrap">
          <div className="pro-card">
            {/* Card Header */}
            <div className="card-top-header">
              <div className="header-info">
                <div className="card-icon-pill icon-blue">
                  <Users size={20} color="#2563eb" />
                </div>
                <div>
                  <h2 className="card-heading">Registered Accounts Directory</h2>
                  <p className="card-desc">
                    Authorized system users and applicants with tracked database activity.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="table-filter-bar">
              {/* Search Box */}
              <div className="filter-search-box">
                <Search size={16} className="filter-search-icon" />
                <input
                  type="text"
                  placeholder="Search user by name or email address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="clear-btn">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div className="filter-select-group">
                <label className="filter-label">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Administrators</option>
                  <option value="USER">Candidates / Users</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div className="filter-select-group">
                <label className="filter-label">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="nameAsc">Name (A to Z)</option>
                  <option value="nameDesc">Name (Z to A)</option>
                  <option value="role">Role (Admins First)</option>
                  <option value="activity">Most Saved Jobs</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || roleFilter !== "ALL") && (
              <div className="active-tags-row">
                <span className="active-tag-prefix">Active filters:</span>
                {searchQuery && (
                  <span className="active-filter-pill">
                    Query: "{searchQuery}"
                    <X size={12} onClick={() => setSearchQuery("")} />
                  </span>
                )}
                {roleFilter !== "ALL" && (
                  <span className="active-filter-pill">
                    Role: {roleFilter === "ADMIN" ? "Administrators" : "Candidates"}
                    <X size={12} onClick={() => setRoleFilter("ALL")} />
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("ALL");
                  }}
                  className="clear-all-text-btn"
                >
                  Reset All
                </button>
              </div>
            )}

            {/* TABLE */}
            {loading ? (
              <div className="table-loading-box">
                <RefreshCw size={28} className="spin-icon" color="#2563eb" />
                <p>Loading registered accounts and recorded database activity...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="table-empty-box">
                <Users size={44} color="#94a3b8" />
                <h3>No registered users match your criteria</h3>
                <p>Try clearing search keywords or resetting the role filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("ALL");
                  }}
                  className="reset-filters-btn"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>User Profile</th>
                      <th style={{ width: "25%" }}>Email Address</th>
                      <th style={{ width: "15%" }}>Role</th>
                      <th style={{ width: "15%" }}>Recorded Activity</th>
                      <th style={{ width: "10%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isAdmin = (u.role || "").toUpperCase() === "ADMIN";
                      const act = userActivities[u.email] || { savedJobs: [], profile: null };
                      const savedCount = (act.savedJobs || []).length;
                      const hasProfile = Boolean(act.profile);
                      const initials = (u.fullName || u.email || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={u.id || u.email}>
                          <td>
                            <div className="user-profile-cell">
                              <div className={`user-table-avatar ${isAdmin ? "avatar-admin" : "avatar-user"}`}>
                                {initials}
                              </div>
                              <div className="user-table-name-wrap">
                                <div className="user-table-name">
                                  {u.fullName || "Registered User"}
                                  {u.email === adminEmail && (
                                    <span className="current-user-tag">You</span>
                                  )}
                                </div>
                                <div className="user-table-sub">
                                  {hasProfile ? `Profile: ${act.profile.qualification || "Active"}` : "Standard Registration"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="user-email-cell">
                              <Mail size={13} className="cell-icon-slate" />
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={isAdmin ? "role-badge-admin" : "role-badge-user"}>
                              {isAdmin ? <Shield size={12} /> : <UserCheck size={12} />}
                              <span>{isAdmin ? "Administrator" : "Candidate"}</span>
                            </span>
                          </td>
                          <td>
                            <div className="activity-cell-wrap">
                              {savedCount > 0 ? (
                                <span className="activity-badge-jobs" title={`${savedCount} saved jobs in database`}>
                                  <Bookmark size={12} />
                                  <span>{savedCount} Saved {savedCount === 1 ? "Job" : "Jobs"}</span>
                                </span>
                              ) : (
                                <span className="activity-badge-none">No saved jobs</span>
                              )}
                              {hasProfile && (
                                <span className="profile-pill-badge" title="Eligibility profile saved">
                                  Profile Saved
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="view-user-btn"
                              onClick={() => setSelectedUser(u)}
                              title="View user details and saved activity"
                            >
                              <Eye size={14} />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Count */}
            <div className="table-pagination-footer">
              <div className="pagination-count-summary">
                Displaying <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered accounts
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT REAL USER ACTIVITY + SECURITY NOTICE */}
        <aside className="right-panels-column">
          {/* CARD 1: RECENT USER ACTIONS (REAL DATABASE EVENTS) */}
          <div className="pro-card side-card">
            <div className="side-card-header">
              <div className="side-card-title-wrap">
                <Activity size={20} color="#2563eb" />
                <h3 className="side-card-title">Recent User Actions</h3>
              </div>
              <span className="active-status-tag">Live DB</span>
            </div>

            <p className="side-card-desc">
              Real chronological activity recorded in the database by registered candidates.
            </p>

            <div className="activity-stream-wrap">
              {globalActivityFeed.length === 0 ? (
                <div className="empty-stream-box">
                  <Clock size={28} color="#94a3b8" />
                  <p>No candidate actions recorded in the database yet.</p>
                </div>
              ) : (
                globalActivityFeed.slice(0, 7).map((ev) => (
                  <div key={ev.id} className="stream-event-item">
                    <div className={`stream-dot-wrap ${ev.type === "SAVED_JOB" ? "dot-blue" : "dot-green"}`}>
                      {ev.type === "SAVED_JOB" ? <Bookmark size={12} /> : <Award size={12} />}
                    </div>
                    <div className="stream-content">
                      <div className="stream-user-row">
                        <span className="stream-user-name">
                          {ev.user.fullName || ev.user.email}
                        </span>
                        <span className="stream-time">{timeAgo(ev.date)}</span>
                      </div>
                      <div className="stream-action-desc">
                        {ev.type === "SAVED_JOB" ? "Saved job notification:" : "Updated eligibility:"}
                      </div>
                      <div className="stream-job-title" title={ev.title}>
                        {ev.title}
                      </div>
                      <div className="stream-org-name">{ev.org}</div>
                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className="stream-link"
                        >
                          Official Portal <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD 2: SECURITY & SESSION TRANSPARENCY */}
          <div className="pro-card side-card">
            <div className="side-card-header">
              <div className="side-card-title-wrap">
                <ShieldCheck size={20} color="#16a34a" />
                <h3 className="side-card-title">Authentication &amp; Security</h3>
              </div>
            </div>

            <p className="side-card-desc">
              GovNotify security and session management architecture details:
            </p>

            <div className="verification-check-list">
              <div className="check-item">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Stateless token authorization</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>BCrypt credential protection</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Password hashes excluded via @JsonIgnore</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Role-based admin header verification</span>
              </div>
            </div>

            <div className="verified-notice-box">
              <ShieldCheck size={18} color="#059669" className="notice-icon" />
              <span>Only authenticated system administrators can access user records.</span>
            </div>
          </div>
        </aside>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="modal-backdrop-blur" onClick={() => setSelectedUser(null)}>
          <div className="user-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="user-modal-header">
              <div className="user-modal-header-left">
                <div
                  className={`modal-user-avatar ${(selectedUser.role || "").toUpperCase() === "ADMIN" ? "avatar-admin" : "avatar-user"}`}
                >
                  {(selectedUser.fullName || selectedUser.email || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="user-modal-title">{selectedUser.fullName || "Registered Account"}</h3>
                  <div className="user-modal-email-row">
                    <Mail size={13} />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="user-modal-body">
              {/* Account Overview Cards */}
              <div className="modal-meta-grid">
                <div className="modal-meta-item">
                  <div className="meta-item-label">Account Role</div>
                  <div className="meta-item-value">
                    <span
                      className={
                        (selectedUser.role || "").toUpperCase() === "ADMIN"
                          ? "role-badge-admin"
                          : "role-badge-user"
                      }
                    >
                      {(selectedUser.role || "").toUpperCase() === "ADMIN" ? (
                        <Shield size={12} />
                      ) : (
                        <UserCheck size={12} />
                      )}
                      <span>
                        {(selectedUser.role || "").toUpperCase() === "ADMIN"
                          ? "System Administrator"
                          : "Registered Candidate"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="modal-meta-item">
                  <div className="meta-item-label">Account Status</div>
                  <div className="meta-item-value">
                    <span className="status-badge-active">
                      <span className="status-dot-pulse" /> Active in Database
                    </span>
                  </div>
                </div>

                <div className="modal-meta-item">
                  <div className="meta-item-label">Saved Job Bookmarks</div>
                  <div className="meta-item-value">
                    <strong>{(userActivities[selectedUser.email]?.savedJobs || []).length}</strong> Notifications
                  </div>
                </div>

                <div className="modal-meta-item">
                  <div className="meta-item-label">Eligibility Profile</div>
                  <div className="meta-item-value">
                    {userActivities[selectedUser.email]?.profile ? (
                      <span className="profile-status-completed">Configured</span>
                    ) : (
                      <span className="profile-status-none">Not Configured</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Eligibility Profile Section */}
              {userActivities[selectedUser.email]?.profile && (
                <div className="modal-section-card">
                  <h4 className="modal-section-title">
                    <Award size={15} color="#2563eb" />
                    <span>Eligibility Profile Details</span>
                  </h4>
                  <div className="profile-details-grid">
                    <div className="profile-detail-cell">
                      <span className="detail-name">Qualification:</span>
                      <strong className="detail-val">
                        {userActivities[selectedUser.email].profile.qualification || "N/A"}
                      </strong>
                    </div>
                    <div className="profile-detail-cell">
                      <span className="detail-name">Preferred State:</span>
                      <strong className="detail-val">
                        {userActivities[selectedUser.email].profile.preferredState || "All India"}
                      </strong>
                    </div>
                    <div className="profile-detail-cell">
                      <span className="detail-name">Category:</span>
                      <strong className="detail-val">
                        {userActivities[selectedUser.email].profile.category || "General"}
                      </strong>
                    </div>
                    <div className="profile-detail-cell">
                      <span className="detail-name">Candidate Age:</span>
                      <strong className="detail-val">
                        {userActivities[selectedUser.email].profile.age
                          ? `${userActivities[selectedUser.email].profile.age} years`
                          : "N/A"}
                      </strong>
                    </div>
                    {userActivities[selectedUser.email].profile.lastUpdated && (
                      <div className="profile-detail-cell full-width">
                        <span className="detail-name">Last Profile Update:</span>
                        <span className="detail-val text-muted">
                          {formatDate(userActivities[selectedUser.email].profile.lastUpdated)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Jobs List */}
              <div className="modal-section-card">
                <h4 className="modal-section-title">
                  <Bookmark size={15} color="#ea580c" />
                  <span>
                    Saved Job Notifications (
                    {(userActivities[selectedUser.email]?.savedJobs || []).length})
                  </span>
                </h4>

                {(userActivities[selectedUser.email]?.savedJobs || []).length === 0 ? (
                  <div className="modal-empty-jobs">
                    <p>No job notifications saved by this user yet.</p>
                  </div>
                ) : (
                  <div className="modal-jobs-list">
                    {(userActivities[selectedUser.email]?.savedJobs || []).map((sj) => (
                      <div key={sj.id} className="modal-job-row">
                        <div className="modal-job-main">
                          <div className="modal-job-title">{sj.jobTitle || "Official Notification"}</div>
                          <div className="modal-job-org">{sj.organization || "Government Authority"}</div>
                          {sj.savedAt && (
                            <div className="modal-job-date">
                              <Calendar size={11} />
                              <span>Saved on {formatDate(sj.savedAt)}</span>
                            </div>
                          )}
                        </div>
                        {sj.officialApplyUrl && (
                          <a
                            href={sj.officialApplyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="modal-job-link"
                          >
                            <span>Official Apply</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="user-modal-footer">
              <button className="modal-dismiss-btn" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Scoped styling matching the reference design system of GovNotify Admin
const usersActivityStyles = `
  .users-activity-module {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  .audit-notice-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 0.85rem;
    color: #1e3a8a;
    line-height: 1.45;
  }

  .audit-notice-banner .notice-icon-box {
    margin-top: 1px;
    flex-shrink: 0;
  }

  .audit-notice-banner em {
    color: #475569;
    font-style: normal;
  }

  .user-profile-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-table-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .avatar-admin {
    background: #ede9fe;
    color: #6d28d9;
    border: 1px solid #ddd6fe;
  }

  .avatar-user {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
  }

  .user-table-name-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-table-name {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .current-user-tag {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .user-table-sub {
    font-size: 0.75rem;
    color: #64748b;
  }

  .user-email-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.83rem;
    color: #334155;
    font-family: monospace;
  }

  .cell-icon-slate {
    color: #94a3b8;
  }

  .role-badge-admin {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    background: #f5f3ff;
    color: #6d28d9;
    border: 1px solid #ddd6fe;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 600;
  }

  .role-badge-user {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 600;
  }

  .activity-cell-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .activity-badge-jobs {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
    border-radius: 5px;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .profile-pill-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 5px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .activity-badge-none {
    font-size: 0.75rem;
    color: #94a3b8;
    font-style: italic;
  }

  .view-user-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .view-user-btn:hover {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
  }

  /* Activity Stream (Right Column) */
  .activity-stream-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 10px;
  }

  .stream-event-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 1px dashed #f1f5f9;
  }

  .stream-event-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .stream-dot-wrap {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .dot-blue {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }

  .dot-green {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }

  .stream-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .stream-user-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .stream-user-name {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stream-time {
    font-size: 0.7rem;
    color: #94a3b8;
    white-space: nowrap;
  }

  .stream-action-desc {
    font-size: 0.72rem;
    color: #64748b;
  }

  .stream-job-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stream-org-name {
    font-size: 0.7rem;
    color: #64748b;
  }

  .stream-link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #2563eb;
    text-decoration: none;
    margin-top: 3px;
  }

  .stream-link:hover {
    text-decoration: underline;
  }

  .empty-stream-box {
    text-align: center;
    padding: 24px 12px;
    color: #94a3b8;
    font-size: 0.82rem;
  }

  /* MODAL STYLES */
  .modal-backdrop-blur {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .user-modal-box {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .user-modal-header {
    padding: 18px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .user-modal-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .modal-user-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
  }

  .user-modal-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
  }

  .user-modal-email-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    color: #64748b;
    margin-top: 2px;
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close-btn:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .user-modal-body {
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .modal-meta-item {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-item-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
  }

  .meta-item-value {
    font-size: 0.85rem;
    color: #0f172a;
  }

  .status-badge-active {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.76rem;
    font-weight: 600;
    color: #16a34a;
  }

  .status-dot-pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #16a34a;
  }

  .profile-status-completed {
    font-size: 0.78rem;
    font-weight: 600;
    color: #2563eb;
  }

  .profile-status-none {
    font-size: 0.78rem;
    color: #94a3b8;
    font-style: italic;
  }

  .modal-section-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modal-section-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .profile-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 14px;
    font-size: 0.8rem;
  }

  .profile-detail-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .profile-detail-cell.full-width {
    grid-column: span 2;
  }

  .detail-name {
    color: #64748b;
    font-size: 0.72rem;
  }

  .detail-val {
    color: #0f172a;
    font-size: 0.82rem;
  }

  .detail-val.text-muted {
    color: #64748b;
  }

  .modal-empty-jobs {
    padding: 14px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .modal-jobs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
  }

  .modal-job-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    padding: 10px 12px;
    border-radius: 6px;
  }

  .modal-job-main {
    flex: 1;
    min-width: 0;
  }

  .modal-job-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .modal-job-org {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 1px;
  }

  .modal-job-date {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.68rem;
    color: #94a3b8;
    margin-top: 3px;
  }

  .modal-job-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.74rem;
    font-weight: 600;
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 4px 8px;
    border-radius: 5px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .modal-job-link:hover {
    background: #2563eb;
    color: #ffffff;
  }

  .user-modal-footer {
    padding: 12px 20px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  .modal-dismiss-btn {
    padding: 7px 18px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .modal-dismiss-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  @media (max-width: 768px) {
    .modal-meta-grid {
      grid-template-columns: 1fr;
    }
    .profile-details-grid {
      grid-template-columns: 1fr;
    }
    .profile-detail-cell.full-width {
      grid-column: span 1;
    }
  }
`;
