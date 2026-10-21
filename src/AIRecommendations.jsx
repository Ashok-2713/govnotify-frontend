import { useState, useEffect } from "react";
import {
  Sparkles,
  Flame,
  ArrowLeft,
  Bookmark,
  Calendar,
  Building2,
  GraduationCap,
  MapPin,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Briefcase,
  X,
  User,
  RefreshCw
} from "lucide-react";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function fmtDate(dateStr) {
  if (!dateStr) return "Open";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AIRecommendations({ userEmail, onBack, onProfileClick }) {
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [savedJobTitles, setSavedJobTitles] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch saved jobs to know which jobs are already saved
  const fetchSavedJobs = () => {
    if (!userEmail) return;
    fetch(`${API_BASE}/api/saved-jobs/list/${encodeURIComponent(userEmail)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const titles = new Set(data.map((j) => (j.jobTitle || "").toLowerCase().trim()));
          setSavedJobTitles(titles);
        }
      })
      .catch((err) => console.error("Error fetching saved jobs:", err));
  };

  // Fetch Recommended Jobs
  const fetchRecommendations = () => {
    setLoadingRecs(true);
    const emailParam = userEmail ? encodeURIComponent(userEmail) : "default";
    fetch(`${API_BASE}/api/recommendations/${emailParam}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRecommendedJobs(Array.isArray(data) ? data : []);
        setLoadingRecs(false);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setRecommendedJobs([]);
        setLoadingRecs(false);
      });
  };

  // Fetch New Arrivals
  const fetchNewArrivals = () => {
    setLoadingArrivals(true);
    fetch(`${API_BASE}/api/recommendations/new-arrivals`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setNewArrivals(Array.isArray(data) ? data : []);
        setLoadingArrivals(false);
      })
      .catch((err) => {
        console.error("Error fetching new arrivals:", err);
        setNewArrivals([]);
        setLoadingArrivals(false);
      });
  };

  useEffect(() => {
    fetchSavedJobs();
    fetchRecommendations();
    fetchNewArrivals();
  }, [userEmail]);

  // Handle Save
  const handleSave = async (job) => {
    if (!job) return;
    const email = userEmail || "user@govnotify.in";
    const jobTitle = job.title || "Government Job";
    const titleKey = jobTitle.toLowerCase().trim();

    if (savedJobTitles.has(titleKey)) {
      showToast("Job is already saved in your list.", "info");
      return;
    }

    // Optimistic update
    setSavedJobTitles((prev) => new Set(prev).add(titleKey));
    showToast("✅ Job saved successfully! Email alert scheduled.", "success");

    try {
      const res = await fetch(`${API_BASE}/api/saved-jobs/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          jobTitle: jobTitle,
          organization: job.organization || "Government Department",
          lastDate: job.lastDate ? String(job.lastDate) : "N/A",
          officialApplyUrl: job.officialApplyUrl || job.sourceUrl || ""
        })
      });

      if (!res.ok) {
        console.warn("Save job response status:", res.status);
      }
    } catch (err) {
      console.error("Failed to save job:", err);
      // Revert optimistic update
      setSavedJobTitles((prev) => {
        const next = new Set(prev);
        next.delete(titleKey);
        return next;
      });
      showToast("❌ Could not save job. Please try again.", "error");
    }
  };

  const renderJobCard = (job, badgeType = "match") => {
    const isSaved = savedJobTitles.has((job.title || "").toLowerCase().trim());

    return (
      <div className="air-card" key={job.id || Math.random()}>
        <div className="air-card-top">
          <div className="air-card-badges">
            {badgeType === "match" ? (
              <span className="air-badge match">
                <Sparkles size={12} /> AI Match
              </span>
            ) : (
              <span className="air-badge new">
                <Flame size={12} /> New Arrival
              </span>
            )}
            {job.category && <span className="air-badge cat">{job.category}</span>}
          </div>

          <button
            onClick={() => handleSave(job)}
            className={`air-btn-save ${isSaved ? "saved" : ""}`}
            title={isSaved ? "Saved" : "Save Job"}
            aria-label="Save Job"
          >
            <Bookmark size={16} fill={isSaved ? "#10b981" : "none"} color={isSaved ? "#10b981" : "#64748b"} />
          </button>
        </div>

        <h3 className="air-card-title" onClick={() => setSelectedJobDetail(job)} title={job.title}>
          {job.title}
        </h3>

        <div className="air-card-org">
          <Building2 size={14} />
          <span>{job.organization || "Government Department"}</span>
        </div>

        <div className="air-card-meta">
          <div className="air-meta-item">
            <MapPin size={13} />
            <span>{job.state || "All-India"}</span>
          </div>
          <div className="air-meta-item">
            <GraduationCap size={13} />
            <span>{job.qualification || "Any Graduate"}</span>
          </div>
          <div className="air-meta-item">
            <Calendar size={13} />
            <span>Last Date: <strong>{fmtDate(job.lastDate)}</strong></span>
          </div>
        </div>

        <div className="air-card-footer">
          <button className="air-btn-details" onClick={() => setSelectedJob(job)}>
            View Details <ChevronRight size={15} />
          </button>
          {job.officialApplyUrl && (
            <a
              href={job.officialApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="air-btn-apply"
              onClick={(e) => e.stopPropagation()}
            >
              Apply Official <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="air-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .air-container {
          min-height: 100vh;
          background: #f4f8fc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1e293b;
          padding: 24px;
          box-sizing: border-box;
        }

        .air-banner {
          background: linear-gradient(110deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
          border-radius: 16px;
          padding: 28px 32px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 10px 25px rgba(30, 58, 138, 0.25);
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
        }

        .air-banner-content {
          z-index: 1;
        }

        .air-banner-title {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.02em;
        }

        .air-banner-sub {
          margin: 0;
          font-size: 14px;
          color: #bfdbfe;
          max-width: 650px;
          line-height: 1.5;
        }

        .air-back-btn {
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .air-back-btn:hover {
          background: #ffffff;
          color: #1e3a8a;
          transform: translateX(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .air-section {
          margin-bottom: 40px;
        }

        .air-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .air-section-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .air-section-sub {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .air-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .air-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .air-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
          border-color: #bfdbfe;
        }

        .air-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .air-card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .air-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .air-badge.match {
          background: #ede9fe;
          color: #7c3aed;
        }

        .air-badge.new {
          background: #fee2e2;
          color: #dc2626;
        }

        .air-badge.cat {
          background: #f1f5f9;
          color: #475569;
        }

        .air-btn-save {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .air-btn-save:hover {
          background: #ecfdf5;
          border-color: #a7f3d0;
          transform: scale(1.08);
        }

        .air-btn-save.saved {
          background: #ecfdf5;
          border-color: #6ee7b7;
        }

        .air-card-title {
          font-size: 15.5px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          line-height: 1.4;
          cursor: pointer;
          transition: color 0.15s ease;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .air-card-title:hover {
          color: #2563eb;
        }

        .air-card-org {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
        }

        .air-card-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px dashed #e2e8f0;
        }

        .air-meta-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #64748b;
        }

        .air-meta-item strong {
          color: #dc2626;
        }

        .air-card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
        }

        .air-btn-details {
          flex: 1;
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .air-btn-details:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .air-btn-apply {
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: background 0.15s ease;
        }

        .air-btn-apply:hover {
          background: #1d4ed8;
        }

        .air-empty-card {
          background: #ffffff;
          border: 1.5px dashed #cbd5e1;
          border-radius: 14px;
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .air-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ede9fe;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .air-empty-title {
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .air-empty-text {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
          max-width: 380px;
          line-height: 1.5;
        }

        .air-btn-profile {
          margin-top: 6px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .air-btn-profile:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(124, 58, 237, 0.38);
        }

        /* Modal Styles */
        .air-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .air-modal {
          background: #ffffff;
          border-radius: 16px;
          max-width: 580px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
          animation: airFadeIn 0.2s ease-out;
        }

        @keyframes airFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .air-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .air-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .air-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #f8fafc;
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .air-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Toast notification */
        .air-toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
          z-index: 11000;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .air-container { padding: 14px; }
          .air-banner { flex-direction: column; align-items: flex-start; padding: 20px; }
          .air-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Toast Alert */}
      {toast && (
        <div
          className="air-toast"
          style={{ background: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#2563eb" : "#10b981" }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── HEADER BANNER ── */}
      <div className="air-banner">
        <div className="air-banner-content">
          <h1 className="air-banner-title">
            <Sparkles size={28} color="#fde047" /> AI Recommendations
          </h1>
          <p className="air-banner-sub">
            Personalized job matches based on your profile and latest arrivals across Central and State recruitments.
          </p>
        </div>

        <button className="air-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* ── SECTION 1: RECOMMENDED FOR YOU ── */}
      <section className="air-section">
        <div className="air-section-header">
          <div>
            <h2 className="air-section-title">
              <Sparkles size={20} color="#7c3aed" /> Recommended for You
            </h2>
            <p className="air-section-sub">
              Filtered to match your state and qualification preferences.
            </p>
          </div>
        </div>

        {loadingRecs ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={26} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Analyzing your profile for recommendations...</p>
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div className="air-empty-card">
            <div className="air-empty-icon">
              <User size={28} />
            </div>
            <h3 className="air-empty-title">Complete your profile to get personalized recommendations!</h3>
            <p className="air-empty-text">
              Tell us your state, education, and preferred categories so our recommendation engine can curate jobs specifically for you.
            </p>
            <button
              className="air-btn-profile"
              onClick={() => {
                if (onProfileClick) {
                  onProfileClick();
                } else if (onBack) {
                  onBack();
                }
              }}
            >
              <User size={15} /> Complete Profile
            </button>
          </div>
        ) : (
          <div className="air-grid">
            {recommendedJobs.map((job) => renderJobCard(job, "match"))}
          </div>
        )}
      </section>

      {/* ── SECTION 2: NEW ARRIVALS ── */}
      <section className="air-section">
        <div className="air-section-header">
          <div>
            <h2 className="air-section-title">
              <Flame size={20} color="#ea580c" /> New Arrivals
            </h2>
            <p className="air-section-sub">
              The freshest notifications published across official government portals.
            </p>
          </div>
        </div>

        {loadingArrivals ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={26} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Loading newest job arrivals...</p>
          </div>
        ) : newArrivals.length === 0 ? (
          <div className="air-empty-card">
            <p className="air-empty-text">No active new arrivals found at this moment.</p>
          </div>
        ) : (
          <div className="air-grid">
            {newArrivals.map((job) => renderJobCard(job, "new"))}
          </div>
        )}
      </section>

      {/* ── JOB DETAILS MODAL ── */}
      {selectedJob && (
        <div className="air-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="air-modal" onClick={(e) => e.stopPropagation()}>
            <div className="air-modal-header">
              <div>
                <span className="air-badge match" style={{ marginBottom: "6px" }}>
                  {selectedJob.category || "Government Recruitment"}
                </span>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", lineHeight: 1.35 }}>
                  {selectedJob.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                  <Building2 size={14} />
                  <span>{selectedJob.organization || "Department"}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "grid", placeItems: "center" }}
                aria-label="Close"
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="air-modal-body">
              <div className="air-modal-grid">
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>State / Scope</small>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13.5px", fontWeight: 600 }}>{selectedJob.state || "All-India"}</p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Qualification</small>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13.5px", fontWeight: 600 }}>{selectedJob.qualification || "Any Graduate"}</p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Last Date</small>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13.5px", fontWeight: 700, color: "#dc2626" }}>{fmtDate(selectedJob.lastDate)}</p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Vacancies</small>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13.5px", fontWeight: 600 }}>{selectedJob.vacancies ? `${selectedJob.vacancies} Posts` : "Refer Notification"}</p>
                </div>
              </div>

              {selectedJob.description && (
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: 700, color: "#334155" }}>Description &amp; Highlights</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>{selectedJob.description}</p>
                </div>
              )}
            </div>

            <div className="air-modal-footer">
              <button
                onClick={() => {
                  handleSave(selectedJob);
                }}
                className="air-btn-details"
                style={{ width: "auto" }}
              >
                <Bookmark size={15} /> Save Job
              </button>
              {selectedJob.officialApplyUrl && (
                <a
                  href={selectedJob.officialApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="air-btn-apply"
                >
                  Apply on Official Portal <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
