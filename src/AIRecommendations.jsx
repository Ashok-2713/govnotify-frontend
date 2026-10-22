import { useState, useEffect, useMemo } from "react";
import JobLogo from "./components/JobLogo";
import {
  Sparkles,
  Flame,
  Bookmark,
  Calendar,
  Building2,
  GraduationCap,
  MapPin,
  ExternalLink,
  ChevronRight,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  RefreshCw,
  Landmark
} from "lucide-react";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return { text: "Open", urgent: false };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { text: String(dateStr), urgent: false };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  const urgent = diffDays >= 0 && diffDays <= 15;

  const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return { text: formatted, urgent };
}

// ── Banner Robot Mascot SVG ──────────────────────────────────────────────────
function RobotMascot() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Outer floating stars */}
      <path d="M12 28 L14 34 L20 36 L14 38 L12 44 L10 38 L4 36 L10 34 Z" fill="#fde047" />
      <path d="M88 18 L89.5 22 L94 23.5 L89.5 25 L88 29 L86.5 25 L82 23.5 L86.5 22 Z" fill="#fde047" />
      <path d="M82 68 L83.5 72 L88 73.5 L83.5 75 L82 79 L80.5 75 L76 73.5 L80.5 72 Z" fill="#fde047" opacity="0.8" />

      {/* Head Outer Shadow & Body Glow */}
      <ellipse cx="50" cy="54" rx="36" ry="32" fill="#e0f2fe" filter="drop-shadow(0 6px 12px rgba(15,23,42,0.2))" />

      {/* Head Capsule Base (Glossy White) */}
      <rect x="18" y="24" width="64" height="56" rx="28" fill="#ffffff" stroke="#bae6fd" strokeWidth="2.5" />

      {/* Ears / Side Audio Cups */}
      <rect x="12" y="42" width="7" height="20" rx="3.5" fill="#38bdf8" />
      <circle cx="15.5" cy="52" r="2" fill="#0284c7" />
      <rect x="81" y="42" width="7" height="20" rx="3.5" fill="#38bdf8" />
      <circle cx="84.5" cy="52" r="2" fill="#0284c7" />

      {/* Visor / Face Screen (Deep Navy with Glow) */}
      <rect x="25" y="32" width="50" height="38" rx="19" fill="#0f172a" />
      <rect x="27" y="34" width="46" height="34" rx="17" fill="#0369a1" opacity="0.3" />

      {/* Cute Glowing Eyes */}
      <ellipse cx="40" cy="48" rx="5" ry="6.5" fill="#38bdf8" />
      <circle cx="41.5" cy="46" r="2" fill="#ffffff" />
      <ellipse cx="60" cy="48" rx="5" ry="6.5" fill="#38bdf8" />
      <circle cx="61.5" cy="46" r="2" fill="#ffffff" />

      {/* Sweet Smiling Mouth */}
      <path d="M44 57 Q50 62 56 57" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Cute Cheeks */}
      <ellipse cx="33" cy="55" rx="3" ry="1.5" fill="#38bdf8" opacity="0.6" />
      <ellipse cx="67" cy="55" rx="3" ry="1.5" fill="#38bdf8" opacity="0.6" />

      {/* Antenna */}
      <rect x="48.5" y="14" width="3" height="11" rx="1.5" fill="#bae6fd" />
      <circle cx="50" cy="13" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

      {/* Forehead Gloss Highlight */}
      <path d="M34 27 Q50 23 66 27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ── Banner Document & Magnifier Illustration ─────────────────────────────────
function BannerDocIllustration() {
  return (
    <svg width="115" height="85" viewBox="0 0 115 85" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Botanical foliage branch on left */}
      <path d="M22 65 C26 50, 32 38, 42 28" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <ellipse cx="32" cy="42" rx="4" ry="7" fill="#60a5fa" opacity="0.6" transform="rotate(-30 32 42)" />
      <ellipse cx="25" cy="54" rx="4" ry="7" fill="#60a5fa" opacity="0.6" transform="rotate(-45 25 54)" />
      <ellipse cx="39" cy="32" rx="4" ry="6" fill="#60a5fa" opacity="0.6" transform="rotate(-15 39 32)" />

      {/* Resume Card (White with soft shadow) */}
      <g filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))">
        <rect x="34" y="10" width="56" height="66" rx="6" fill="#ffffff" />
        {/* User avatar on document */}
        <circle cx="46" cy="24" r="5.5" fill="#bfdbfe" />
        {/* Document text lines */}
        <rect x="56" y="20" width="26" height="3" rx="1.5" fill="#93c5fd" />
        <rect x="56" y="26" width="18" height="2.5" rx="1.2" fill="#cbd5e1" />
        <rect x="42" y="36" width="40" height="2.5" rx="1.2" fill="#e2e8f0" />
        <rect x="42" y="42" width="36" height="2.5" rx="1.2" fill="#e2e8f0" />
        <rect x="42" y="48" width="42" height="2.5" rx="1.2" fill="#e2e8f0" />
        <rect x="42" y="54" width="28" height="2.5" rx="1.2" fill="#e2e8f0" />
        <rect x="42" y="62" width="20" height="4" rx="2" fill="#3b82f6" opacity="0.8" />
      </g>

      {/* Magnifying Glass Searching Job */}
      <g filter="drop-shadow(0 4px 8px rgba(30,58,138,0.3))">
        <circle cx="78" cy="45" r="14" stroke="#2563eb" strokeWidth="4" fill="rgba(219,234,254,0.3)" />
        <line x1="88" y1="55" x2="102" y2="70" stroke="#1d4ed8" strokeWidth="5.5" strokeLinecap="round" />
        {/* Lens glare */}
        <path d="M72 38 Q78 35 84 40" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>

      {/* Floating Sparkle */}
      <path d="M102 18 L103 21 L106 22 L103 23 L102 26 L101 23 L98 22 L101 21 Z" fill="#fde047" />
    </svg>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
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

  const handleSave = async (job) => {
    if (!job) return;
    const email = userEmail || "user@govnotify.in";
    const jobTitle = job.title || "Government Job";
    const titleKey = jobTitle.toLowerCase().trim();

    if (savedJobTitles.has(titleKey)) {
      showToast("Job is already saved in your list.", "info");
      return;
    }

    setSavedJobTitles((prev) => new Set(prev).add(titleKey));
    showToast("✅ Job saved successfully! Email alert scheduled.", "success");

    try {
      await fetch(`${API_BASE}/api/saved-jobs/save`, {
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
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const renderJobCard = (job, badgeType = "match") => {
    const isSaved = savedJobTitles.has((job.title || "").toLowerCase().trim());
    const dateInfo = fmtDate(job.lastDate);

    return (
      <div className="air-card" key={job.id || Math.random()}>
        {/* Top Badges & Bookmark */}
        <div className="air-card-header">
          <div className="air-badges-wrap">
            {badgeType === "match" ? (
              <span className="air-pill ai-match">
                <Sparkles size={11} /> AI MATCH
              </span>
            ) : (
              <span className="air-pill new-arrival">
                <Flame size={11} /> NEW ARRIVAL
              </span>
            )}
            <span className="air-pill govt-job">GOVERNMENT JOB</span>
          </div>

          <button
            onClick={() => handleSave(job)}
            className={`air-btn-bookmark ${isSaved ? "saved" : ""}`}
            title={isSaved ? "Saved in your list" : "Save Job"}
            aria-label="Save Job"
          >
            <Bookmark size={15} fill={isSaved ? "#3b82f6" : "none"} color="#3b82f6" />
          </button>
        </div>

        {/* Job Title */}
        <h3
          className="air-job-title"
          onClick={() => setSelectedJob(job)}
          title={job.title}
        >
          {job.title}
        </h3>

        {/* Organization */}
        <div className="air-job-org">
          <Landmark size={13} className="air-org-ico" />
          <span>{job.organization || "Government Department"}</span>
        </div>

        {/* Middle Two-Column (Meta Details on Left, Circular Seal on Right) */}
        <div className="air-card-mid">
          <div className="air-meta-list">
            <div className="air-meta-row">
              <MapPin size={13} color="#94a3b8" />
              <span>{job.state || "Karnataka"}</span>
            </div>
            <div className="air-meta-row">
              <GraduationCap size={13} color="#94a3b8" />
              <span>{job.qualification || "Any Graduate"}</span>
            </div>
            <div className="air-meta-row">
              <Calendar size={13} color="#94a3b8" />
              <span>
                Last Date:{" "}
                <strong className={dateInfo.urgent ? "date-urgent" : "date-open"}>
                  {dateInfo.text}
                </strong>
              </span>
            </div>
          </div>

          <div className="air-logo-container">
            <JobLogo url={job.officialApplyUrl} organization={job.organization} state={job.state} title={job.title} size={42} />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="air-card-actions">
          <button
            className="air-btn-view"
            onClick={() => setSelectedJob(job)}
          >
            View Details →
          </button>
          <a
            href={job.officialApplyUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="air-btn-apply-solid"
            onClick={(e) => {
              if (!job.officialApplyUrl) {
                e.preventDefault();
                setSelectedJob(job);
              }
            }}
          >
            Apply Official ↗
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="air-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital@1&display=swap');

        .air-root {
          min-height: 100vh;
          background: #f4f8fc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          padding: 20px 28px 48px;
          box-sizing: border-box;
          position: relative;
        }

        /* ── HERO BANNER ── */
        .air-hero-banner {
          background: linear-gradient(110deg, #1d4ed8 0%, #2563eb 40%, #3b82f6 75%, #60a5fa 100%);
          border-radius: 16px;
          padding: 22px 28px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.22);
          position: relative;
          overflow: hidden;
          margin-bottom: 28px;
        }

        .air-banner-left {
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 1;
          flex: 1;
          min-width: 0;
        }

        .air-banner-heading {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 5px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .air-banner-sub {
          margin: 0;
          font-size: 13px;
          color: #dbeafe;
          line-height: 1.5;
          max-width: 600px;
        }

        .air-banner-right {
          display: flex;
          align-items: center;
          gap: 18px;
          z-index: 1;
          flex-shrink: 0;
        }

        .air-cursive-quote {
          font-family: 'Playfair Display', 'Georgia', cursive, serif;
          font-style: italic;
          color: #ffffff;
          font-size: 14.5px;
          line-height: 1.4;
          text-align: right;
          opacity: 0.95;
          max-width: 140px;
        }

        .air-btn-dashboard {
          background: #ffffff;
          color: #2563eb;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          white-space: nowrap;
        }

        .air-btn-dashboard:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          background: #f8fafc;
        }

        /* ── SECTION HEADINGS ── */
        .air-section {
          margin-bottom: 36px;
        }

        .air-sec-title-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .air-sec-title-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .air-sec-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .air-sec-icon-circle.target-bg {
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          color: #7c3aed;
        }

        .air-sec-icon-circle.fire-bg {
          background: linear-gradient(135deg, #ffedd5, #fed7aa);
          color: #ea580c;
        }

        .air-sec-heading {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .air-sec-sub {
          font-size: 12.5px;
          color: #64748b;
          margin: 3px 0 0 0;
        }

        .air-link-viewall {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s ease;
        }

        .air-link-viewall:hover {
          background: #eff6ff;
        }

        /* ── 5-COLUMN RESPONSIVE GRID ── */
        .air-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        @media (max-width: 1380px) {
          .air-cards-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 1100px) {
          .air-cards-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 780px) {
          .air-cards-grid { grid-template-columns: repeat(2, 1fr); }
          .air-hero-banner { flex-direction: column; align-items: flex-start; padding: 18px; }
          .air-banner-right { width: 100%; justify-content: space-between; }
        }

        @media (max-width: 520px) {
          .air-cards-grid { grid-template-columns: 1fr; }
          .air-root { padding: 12px; }
        }

        /* ── CARD DESIGN ── */
        .air-card {
          background: #ffffff;
          border: 1px solid #e8edf5;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          position: relative;
        }

        .air-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.1);
          border-color: #bfdbfe;
        }

        .air-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .air-badges-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .air-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 12px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .air-pill.ai-match {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .air-pill.new-arrival {
          background: #ffedd5;
          color: #ea580c;
        }

        .air-pill.govt-job {
          background: #eff6ff;
          color: #2563eb;
        }

        .air-btn-bookmark {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          flex-shrink: 0;
        }

        .air-btn-bookmark:hover {
          background: #eff6ff;
          transform: scale(1.08);
        }

        .air-btn-bookmark.saved {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .air-job-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .air-job-title:hover {
          color: #2563eb;
        }

        .air-job-org {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .air-org-ico {
          flex-shrink: 0;
          color: #94a3b8;
        }

        /* ── CARD MIDDLE (META + LOGO) ── */
        .air-card-mid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 14px;
        }

        .air-meta-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }

        .air-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .air-meta-row strong.date-open {
          color: #16a34a;
          font-weight: 700;
        }

        .air-meta-row strong.date-urgent {
          color: #dc2626;
          font-weight: 700;
        }

        .air-logo-container {
          flex-shrink: 0;
        }

        .air-logo-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 2px;
        }

        /* ── ACTION BUTTONS ── */
        .air-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
        }

        .air-btn-view {
          flex: 1;
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .air-btn-view:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .air-btn-apply-solid {
          flex: 1;
          background: #1d4ed8;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 11.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }

        .air-btn-apply-solid:hover {
          background: #1e40af;
        }

        /* ── FLOATING AI BOT SHORTCUT ── */
        .air-floating-bot {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #38bdf8;
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .air-floating-bot:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4);
        }

        .air-bot-online-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 11px;
          height: 11px;
          background: #10b981;
          border: 2px solid #ffffff;
          border-radius: 50%;
        }

        /* ── MODAL ── */
        .air-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 11000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .air-modal-box {
          background: #ffffff;
          border-radius: 16px;
          max-width: 580px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        }

        .air-modal-head {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .air-modal-content {
          padding: 20px 24px;
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

        .air-modal-foot {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        /* ── TOAST ── */
        .air-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: #ffffff;
          padding: 11px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
          z-index: 12000;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className="air-toast"
          style={{
            background:
              toast.type === "error"
                ? "#ef4444"
                : toast.type === "info"
                ? "#2563eb"
                : "#10b981"
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* ══ TOP BANNER ══ */}
      <div className="air-hero-banner">
        <div className="air-banner-left">
          <RobotMascot />
          <div>
            <h1 className="air-banner-heading">
              AI Recommendations <Sparkles size={20} color="#fde047" fill="#fde047" />
            </h1>
            <p className="air-banner-sub">
              Personalized job matches based on your profile and latest arrivals across Central and State recruitments.
            </p>
          </div>
        </div>

        <div className="air-banner-right">
          <div className="air-cursive-quote">
            Your Dream Job is Closer Than You Think
          </div>
          <BannerDocIllustration />
          <button className="air-btn-dashboard" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* ══ SECTION 1: RECOMMENDED FOR YOU ══ */}
      <section className="air-section">
        <div className="air-sec-title-wrap">
          <div className="air-sec-title-left">
            <div className="air-sec-icon-circle target-bg">
              <Target size={18} />
            </div>
            <div>
              <h2 className="air-sec-heading">Recommended for You</h2>
              <p className="air-sec-sub">
                Filtered to match your state and qualification preferences.
              </p>
            </div>
          </div>
        </div>

        {loadingRecs ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={26} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13.5px" }}>Curating personalized recommendations…</p>
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1.5px dashed #cbd5e1",
              borderRadius: "14px",
              padding: "36px 20px",
              textAlign: "center"
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", margin: "0 0 6px 0" }}>
              Complete your profile to get personalized recommendations!
            </p>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Save your state, education, and preferences to see matched job notifications.
            </p>
            <button
              onClick={() => {
                if (onProfileClick) onProfileClick();
                else if (onBack) onBack();
              }}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Complete Profile →
            </button>
          </div>
        ) : (
          <div className="air-cards-grid">
            {recommendedJobs.map((job) => renderJobCard(job, "match"))}
          </div>
        )}
      </section>

      {/* ══ SECTION 2: NEW ARRIVALS ══ */}
      <section className="air-section">
        <div className="air-sec-title-wrap">
          <div className="air-sec-title-left">
            <div className="air-sec-icon-circle fire-bg">
              <Flame size={18} />
            </div>
            <div>
              <h2 className="air-sec-heading">New Arrivals</h2>
              <p className="air-sec-sub">
                The freshest notifications published across official government portals.
              </p>
            </div>
          </div>

          <button className="air-link-viewall" onClick={onBack}>
            View All →
          </button>
        </div>

        {loadingArrivals ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={26} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13.5px" }}>Loading latest arrivals…</p>
          </div>
        ) : newArrivals.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
            No new arrivals found.
          </div>
        ) : (
          <div className="air-cards-grid">
            {newArrivals.map((job) => renderJobCard(job, "new"))}
          </div>
        )}
      </section>

      {/* ══ FLOATING ROBOT BOT SHORTCUT ══ */}
      <div
        className="air-floating-bot"
        onClick={() => {
          if (onBack) onBack();
        }}
        title="GovNotify AI Assistant"
      >
        <span className="air-bot-online-dot" />
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="54" rx="36" ry="32" fill="#e0f2fe" />
          <rect x="18" y="24" width="64" height="56" rx="28" fill="#ffffff" stroke="#38bdf8" strokeWidth="3" />
          <rect x="25" y="32" width="50" height="38" rx="19" fill="#0f172a" />
          <ellipse cx="40" cy="48" rx="5" ry="6.5" fill="#38bdf8" />
          <circle cx="41.5" cy="46" r="2" fill="#ffffff" />
          <ellipse cx="60" cy="48" rx="5" ry="6.5" fill="#38bdf8" />
          <circle cx="61.5" cy="46" r="2" fill="#ffffff" />
          <path d="M44 57 Q50 62 56 57" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* ══ DETAILS MODAL ══ */}
      {selectedJob && (
        <div className="air-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="air-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="air-modal-head">
              <div>
                <span className="air-pill ai-match" style={{ marginBottom: "6px" }}>
                  {selectedJob.category || "Government Job"}
                </span>
                <h2 style={{ margin: "4px 0 0", fontSize: "17px", fontWeight: "800", color: "#0f172a", lineHeight: 1.35 }}>
                  {selectedJob.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: "12.5px", marginTop: "4px" }}>
                  <Landmark size={13} />
                  <span>{selectedJob.organization || "Department"}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center"
                }}
                aria-label="Close"
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div className="air-modal-content">
              <div className="air-modal-grid">
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    State / Region
                  </small>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>
                    {selectedJob.state || "All-India"}
                  </p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Qualification
                  </small>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>
                    {selectedJob.qualification || "Any Graduate"}
                  </p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Last Date
                  </small>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>
                    {fmtDate(selectedJob.lastDate).text}
                  </p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Vacancies
                  </small>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>
                    {selectedJob.vacancies ? `${selectedJob.vacancies} Posts` : "Refer Notification"}
                  </p>
                </div>
              </div>

              {selectedJob.description && (
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                    Description &amp; Overview
                  </h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.6 }}>
                    {selectedJob.description}
                  </p>
                </div>
              )}
            </div>

            <div className="air-modal-foot">
              <button
                onClick={() => handleSave(selectedJob)}
                className="air-btn-view"
                style={{ flex: "initial", padding: "8px 16px" }}
              >
                <Bookmark size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Save Job
              </button>
              {selectedJob.officialApplyUrl && (
                <a
                  href={selectedJob.officialApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="air-btn-apply-solid"
                  style={{ flex: "initial", padding: "8px 18px" }}
                >
                  Apply Official Portal <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
