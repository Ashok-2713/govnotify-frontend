import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, ExternalLink, Trash2, Search, Calendar, Building2, Link2, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function fmtDateTime(dateStr) {
  if (!dateStr) return "N/A";
  if (Array.isArray(dateStr)) {
    const [y, m, d, hr = 0, min = 0] = dateStr;
    const dateObj = new Date(y, m - 1, d, hr, min);
    return dateObj.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SavedJobs({ userEmail = "ashok.udhay@govnotify.in", onBack }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSavedJobs = () => {
    if (!userEmail) {
      setSavedJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/saved-jobs/list/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setSavedJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setSavedJobs([]); setLoading(false); });
  };

  useEffect(() => {
    if (userEmail) loadSavedJobs();
  }, [userEmail]);

  const deleteSavedJob = (id) => {
    if (!window.confirm("Remove this job from your saved list?")) return;
    fetch(`${API_BASE}/api/saved-jobs/delete/${id}`, { method: 'DELETE' })
      .then(res => res.text())
      .then(() => loadSavedJobs());
  };

  const filteredJobs = savedJobs.filter(sj => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (sj.jobTitle && sj.jobTitle.toLowerCase().includes(q)) ||
      (sj.organization && sj.organization.toLowerCase().includes(q))
    );
  });

  return (
    <div style={styles.page} className="saved-jobs-page">
      <style>{`
        @media (max-width: 640px) {
          .saved-jobs-page {
            padding: 16px 12px !important;
          }
          .saved-jobs-search-wrap {
            min-width: 0 !important;
            width: 100% !important;
          }
          .saved-jobs-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .saved-jobs-title-row {
            min-width: 0 !important;
          }
          .saved-jobs-action-row {
            width: 100% !important;
            justify-content: flex-start !important;
            margin-top: 8px !important;
          }
          .saved-jobs-grid {
            grid-template-columns: 1fr !important;
            margin-left: 0 !important;
          }
        }
      `}</style>
      {/* Header Bar */}
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      {/* Title Section */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>
            <Bookmark size={28} color="#f97316" style={{ verticalAlign: 'middle', marginRight: 10 }} />
            Your Saved Jobs
          </h1>
          <p style={styles.subtitle}>
            You have <strong>{savedJobs.length}</strong> saved job{savedJobs.length !== 1 ? 's' : ''} in your list.
          </p>
        </div>

        <div style={styles.searchWrapper} className="saved-jobs-search-wrap">
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search saved jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.emptyState}>
          <p>Loading saved jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={styles.emptyState}>
          <Bookmark size={56} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#475569', marginBottom: 8 }}>
            {savedJobs.length === 0 ? "No saved jobs yet" : "No matches found"}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            {savedJobs.length === 0
              ? "Click the bookmark icon on any job in the dashboard to save it here."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div style={styles.listWrapper}>
          {filteredJobs.map((sj, idx) => (
            <div key={sj.id} style={styles.card}>
              {/* Header row: number + title + buttons */}
              <div style={styles.cardHeader} className="saved-jobs-card-header">
                <div style={styles.cardTitleRow} className="saved-jobs-title-row">
                  <div style={styles.numberBadge}>{idx + 1}</div>
                  <h3 style={styles.jobTitle}>{sj.jobTitle}</h3>
                </div>
                <div style={styles.actionRow} className="saved-jobs-action-row">
                  <a href={sj.officialApplyUrl} target="_blank" rel="noreferrer" style={styles.applyBtn}>
                    Apply <ExternalLink size={12} />
                  </a>
                  <button onClick={() => deleteSavedJob(sj.id)} style={styles.removeBtn}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div style={styles.detailsGrid} className="saved-jobs-grid">
                <div style={styles.detailItem}>
                  <Building2 size={16} color="#64748b" />
                  <div>
                    <span style={styles.detailLabel}>Organization</span>
                    <p style={styles.detailValue}>{sj.organization || 'Government Department'}</p>
                  </div>
                </div>

                <div style={styles.detailItem}>
                  <Calendar size={16} color="#ef4444" />
                  <div>
                    <span style={styles.detailLabel}>Last Date to Apply</span>
                    <p style={{ ...styles.detailValue, color: '#ef4444', fontWeight: 700 }}>
                      {sj.lastDate || 'N/A'}
                    </p>
                  </div>
                </div>

                <div style={styles.detailItem}>
                  <Clock size={16} color="#64748b" />
                  <div>
                    <span style={styles.detailLabel}>Saved On</span>
                    <p style={styles.detailValue}>{fmtDateTime(sj.savedAt)}</p>
                  </div>
                </div>

                <div style={styles.detailItem}>
                  <Link2 size={16} color="#2563eb" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={styles.detailLabel}>Official Apply Link</span>
                    <a
                      href={sj.officialApplyUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.linkValue}
                    >
                      {sj.officialApplyUrl || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '32px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  topBar: {
    marginBottom: '24px'
  },
  backBtn: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '10px 18px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: '0.2s'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '28px',
    gap: '20px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    color: '#64748b',
    marginTop: '6px',
    fontSize: '14px'
  },
  searchWrapper: {
    position: 'relative',
    minWidth: '300px'
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8'
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    outline: 'none',
    background: '#ffffff',
    color: '#0f172a'
  },
  emptyState: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '80px 40px',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  },
  listWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: '300px'
  },
  numberBadge: {
    background: '#2563eb',
    color: '#fff',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    fontWeight: '800',
    flexShrink: 0
  },
  jobTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.4'
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0
  },
  applyBtn: {
    background: '#2563eb',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px'
  },
  removeBtn: {
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginLeft: '42px',
    paddingTop: '14px',
    borderTop: '1px dashed #e2e8f0'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    minWidth: 0
  },
  detailLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '3px'
  },
  detailValue: {
    fontSize: '13.5px',
    color: '#334155',
    fontWeight: '600',
    margin: 0,
    wordBreak: 'break-word'
  },
  linkValue: {
    fontSize: '12.5px',
    color: '#2563eb',
    textDecoration: 'none',
    wordBreak: 'break-all',
    display: 'block',
    fontWeight: '500'
  }
};