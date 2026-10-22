import { useState, useEffect, useCallback } from "react";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// ── Helpers ──────────────────────────────────────────────────────────────────
function maskEmail(email) {
  if (!email) return "Anonymous";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  if (Array.isArray(dateStr)) {
    const [y, m, d] = dateStr;
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return String(dateStr);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Read-only Stars ──────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 15 }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, lineHeight: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? "#f59e0b" : "#e2e8f0", lineHeight: 1 }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ── Interactive Stars ────────────────────────────────────────────────────────
function StarSelector({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-flex", gap: 6, lineHeight: 1 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <button
            type="button"
            key={s}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHov(s)}
            onMouseLeave={() => setHov(0)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 28,
              color: s <= (hov || value) ? "#f59e0b" : "#cbd5e1",
              cursor: "pointer",
              transition: "transform 0.12s ease, color 0.12s ease",
              userSelect: "none",
              lineHeight: 1,
              transform: s <= (hov || value) ? "scale(1.18)" : "scale(1)",
            }}
            aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: (hov || value) ? "#d97706" : "#94a3b8", marginLeft: 4 }}>
        {(hov || value) ? `${hov || value} / 5 Stars` : "Select a rating"}
      </span>
    </div>
  );
}

// ── 3D Gold Star SVG ─────────────────────────────────────────────────────────
function Star3D({ size = 76 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, filter: "drop-shadow(0 8px 18px rgba(180,83,9,0.45))" }}>
      <defs>
        <radialGradient id="starGradJR" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <polygon points="50,6 61,36 93,36 68,55 78,85 50,66 22,85 32,55 7,36 39,36" fill="url(#starGradJR)" />
      <ellipse cx="38" cy="26" rx="11" ry="5" fill="rgba(255,255,255,0.6)" transform="rotate(-18,38,26)" />
      <ellipse cx="60" cy="16" rx="5" ry="3" fill="rgba(255,255,255,0.35)" transform="rotate(10,60,16)" />
    </svg>
  );
}

// ── Banner Building Watermark ─────────────────────────────────────────────────
function BannerBuilding() {
  return (
    <svg width="120" height="105" viewBox="0 0 120 105" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.12, position: "absolute", right: 0, bottom: 0, pointerEvents: "none" }}>
      <rect x="5" y="42" width="110" height="60" rx="2" fill="white" />
      <rect x="0" y="37" width="120" height="8" rx="2" fill="white" />
      <rect x="18" y="22" width="84" height="18" rx="2" fill="white" />
      <rect x="36" y="7" width="48" height="17" rx="2" fill="white" />
      {[12, 28, 44, 60, 76, 92].map(x => (
        <g key={x}>
          <rect x={x} y="50" width="10" height="11" rx="1" fill="#1e3a8a" />
          <rect x={x} y="67" width="10" height="11" rx="1" fill="#1e3a8a" />
          <rect x={x} y="84" width="10" height="18" rx="1" fill="#1e3a8a" />
        </g>
      ))}
      <rect x="48" y="72" width="24" height="30" rx="1" fill="#1e3a8a" />
      <ellipse cx="60" cy="7" rx="24" ry="8" fill="white" opacity="0.6" />
    </svg>
  );
}

// ── Left Panel Person Illustration ───────────────────────────────────────────
function PersonIllustration() {
  return (
    <svg width="144" height="172" viewBox="0 0 140 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="125" rx="9" ry="18" fill="#34d399" transform="rotate(-20,14,125)" />
      <ellipse cx="24" cy="112" rx="8" ry="14" fill="#10b981" transform="rotate(12,24,112)" />
      <ellipse cx="8" cy="110" rx="7" ry="12" fill="#6ee7b7" transform="rotate(-30,8,110)" />
      <line x1="16" y1="135" x2="16" y2="150" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="126" cy="125" rx="9" ry="18" fill="#34d399" transform="rotate(20,126,125)" />
      <ellipse cx="116" cy="112" rx="8" ry="14" fill="#10b981" transform="rotate(-12,116,112)" />
      <ellipse cx="132" cy="110" rx="7" ry="12" fill="#6ee7b7" transform="rotate(30,132,110)" />
      <line x1="124" y1="135" x2="124" y2="150" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <rect x="34" y="108" width="72" height="7" rx="3" fill="#475569" />
      <rect x="37" y="75" width="66" height="35" rx="4" fill="#1e293b" />
      <rect x="39" y="77" width="62" height="31" rx="3" fill="#dbeafe" />
      <rect x="43" y="80" width="28" height="3" rx="1.5" fill="#93c5fd" />
      <rect x="43" y="86" width="46" height="2" rx="1" fill="#bfdbfe" />
      <rect x="43" y="91" width="38" height="2" rx="1" fill="#bfdbfe" />
      <rect x="43" y="96" width="42" height="2" rx="1" fill="#bfdbfe" />
      <text x="43" y="106" fontSize="9" fill="#f59e0b">★★★</text>
      <rect x="52" y="62" width="36" height="30" rx="6" fill="#f97316" />
      <path d="M65 62 L70 70 L75 62" fill="#ea580c" />
      <path d="M52 68 Q38 78 37 105" stroke="#f97316" strokeWidth="9" strokeLinecap="round" fill="none" />
      <ellipse cx="37" cy="107" rx="6" ry="5" fill="#fbbf24" />
      <path d="M88 68 Q102 78 103 105" stroke="#f97316" strokeWidth="9" strokeLinecap="round" fill="none" />
      <ellipse cx="103" cy="107" rx="6" ry="5" fill="#fbbf24" />
      <path d="M52 90 Q38 95 34 112 Q46 116 58 112 L70 108 L82 112 Q94 116 106 112 Q102 95 88 90" fill="#3b82f6" />
      <ellipse cx="34" cy="114" rx="9" ry="5" fill="#fbbf24" />
      <ellipse cx="106" cy="114" rx="9" ry="5" fill="#fbbf24" />
      <circle cx="70" cy="45" r="18" fill="#fbbf24" />
      <ellipse cx="70" cy="30" rx="18" ry="9" fill="#1c1917" />
      <rect x="52" y="30" width="36" height="8" fill="#1c1917" />
      <circle cx="64" cy="45" r="2.5" fill="#1c1917" />
      <circle cx="76" cy="45" r="2.5" fill="#1c1917" />
      <path d="M64 53 Q70 57 76 53" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="52" cy="45" rx="4" ry="5" fill="#fbbf24" />
      <ellipse cx="88" cy="45" rx="4" ry="5" fill="#fbbf24" />
      <text x="22" y="58" fontSize="16" fill="#fbbf24">★</text>
      <text x="106" y="52" fontSize="12" fill="#fbbf24">★</text>
      <text x="112" y="68" fontSize="9" fill="#fde68a">★</text>
      <text x="20" y="75" fontSize="9" fill="#fde68a">★</text>
      <rect x="96" y="26" width="34" height="26" rx="8" fill="#2563eb" />
      <path d="M110 52 L112 60" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
      <text x="103" y="44" fontSize="15">👍</text>
    </svg>
  );
}

// ── Empty State Illustration ──────────────────────────────────────────────────
function EmptyIllustration() {
  return (
    <svg width="190" height="150" viewBox="0 0 190 155" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22" cy="108" rx="13" ry="22" fill="#34d399" transform="rotate(-22,22,108)" />
      <ellipse cx="34" cy="92" rx="11" ry="17" fill="#10b981" transform="rotate(14,34,92)" />
      <ellipse cx="12" cy="95" rx="9" ry="14" fill="#6ee7b7" transform="rotate(-32,12,95)" />
      <ellipse cx="168" cy="108" rx="13" ry="22" fill="#34d399" transform="rotate(22,168,108)" />
      <ellipse cx="156" cy="92" rx="11" ry="17" fill="#10b981" transform="rotate(-14,156,92)" />
      <ellipse cx="178" cy="95" rx="9" ry="14" fill="#6ee7b7" transform="rotate(32,178,95)" />
      <rect x="42" y="14" width="100" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="54" y="26" width="76" height="3" rx="1.5" fill="#cbd5e1" />
      <text x="54" y="44" fontSize="10" fill="#f59e0b">★★★☆☆</text>
      <rect x="54" y="50" width="62" height="2.5" rx="1.2" fill="#e2e8f0" />
      <rect x="54" y="57" width="74" height="2.5" rx="1.2" fill="#e2e8f0" />
      <rect x="54" y="70" width="46" height="2.5" rx="1.2" fill="#e2e8f0" />
      <text x="54" y="86" fontSize="10" fill="#fbbf24">★★★★★</text>
      <rect x="54" y="92" width="68" height="2.5" rx="1.2" fill="#e2e8f0" />
      <rect x="54" y="99" width="55" height="2.5" rx="1.2" fill="#e2e8f0" />
      <rect x="54" y="110" width="72" height="2.5" rx="1.2" fill="#e2e8f0" />
      <rect x="54" y="117" width="50" height="2.5" rx="1.2" fill="#e2e8f0" />
      <circle cx="118" cy="96" r="32" fill="rgba(219,234,254,0.75)" stroke="#94a3b8" strokeWidth="5.5" />
      <line x1="141" y1="119" x2="162" y2="140" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
      <rect x="102" y="32" width="40" height="30" rx="10" fill="#3b82f6" />
      <path d="M118 62 L120 70" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
      <text x="113" y="52" fontSize="17">❤</text>
      <text x="38" y="24" fontSize="15" fill="#fbbf24">★</text>
      <text x="142" y="36" fontSize="11" fill="#fde68a">★</text>
    </svg>
  );
}

// ── Left Panel Footer Building ────────────────────────────────────────────────
function SmallBuilding() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="14" width="32" height="20" rx="1" fill="#93c5fd" />
      <rect x="0" y="12" width="36" height="4" rx="1" fill="#60a5fa" />
      <rect x="6" y="6" width="24" height="8" rx="1" fill="#93c5fd" />
      <rect x="12" y="2" width="12" height="6" rx="1" fill="#93c5fd" />
      <rect x="5" y="18" width="5" height="4" rx="0.5" fill="#fff" />
      <rect x="13" y="18" width="5" height="4" rx="0.5" fill="#fff" />
      <rect x="21" y="18" width="5" height="4" rx="0.5" fill="#fff" />
      <rect x="29" y="18" width="4" height="4" rx="0.5" fill="#fff" />
      <rect x="14" y="25" width="8" height="9" rx="0.5" fill="#1d4ed8" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function JobReviews({ jobId, jobTitle, userEmail, onBack }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const hasJob = Boolean(jobId);

  const fetchReviews = useCallback(() => {
    if (!hasJob) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/reviews/${jobId}`)
      .then(async (r) => {
        if (!r.ok) {
          console.warn("Failed to retrieve reviews:", r.status, r.statusText);
          return [];
        }
        return r.json();
      })
      .then(d => { setReviews(Array.isArray(d) ? d : []); setLoading(false); })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setReviews([]);
        setLoading(false);
      });
  }, [jobId, hasJob]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0
  }));

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      const da = Array.isArray(a.createdAt) ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2]) : new Date(a.createdAt);
      const db = Array.isArray(b.createdAt) ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2]) : new Date(b.createdAt);
      return db - da;
    }
    if (sortBy === "oldest") {
      const da = Array.isArray(a.createdAt) ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2]) : new Date(a.createdAt);
      const db = Array.isArray(b.createdAt) ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2]) : new Date(b.createdAt);
      return da - db;
    }
    if (sortBy === "highest") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "lowest") return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

  const latestReview = reviews.length > 0
    ? [...reviews].sort((a, b) => {
        const da = Array.isArray(a.createdAt) ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2]) : new Date(a.createdAt);
        const db = Array.isArray(b.createdAt) ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2]) : new Date(b.createdAt);
        return db - da;
      })[0]
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!hasJob) {
      setFormError("Open a specific job from the dashboard to write a review.");
      return;
    }
    if (!rating) {
      setFormError("Please select a star rating.");
      return;
    }
    if (!reviewText.trim()) {
      setFormError("Please write a short review before submitting.");
      return;
    }

    setSubmitting(true);
    const submitUrl = `${API_BASE}/api/reviews`;

    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobId,
          userEmail: userEmail || "user@govnotify.in",
          rating,
          reviewText: reviewText.trim()
        })
      });

      if (!response.ok) {
        let errMessage = "";
        try {
          const errorJson = await response.json();
          errMessage = errorJson.message || JSON.stringify(errorJson);
        } catch {
          errMessage = await response.text();
        }

        console.error("Submit failed:", response.status, response.statusText, errMessage);

        if (response.status === 404) {
          setFormError("Endpoint not found (404). Please verify backend deployment.");
        } else if (response.status === 500) {
          setFormError("Server error (500). Please check backend database logs.");
        } else {
          setFormError(`Failed to submit (${response.status}): ${errMessage || response.statusText || "Please try again."}`);
        }
        return;
      }

      setSuccessMsg("✅ Review submitted! Thank you for helping others.");
      setRating(0);
      setReviewText("");
      fetchReviews();
    } catch (networkErr) {
      console.error("Submit error:", networkErr);
      console.error("Network error during review submission to", submitUrl, ":", networkErr);
      setFormError("Network error: Backend might be starting up (Render free tier wakes up after ~50s). Please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f8fc", fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .jr-back:hover {
          background: #ffffff !important;
          color: #1d4ed8 !important;
          box-shadow: 0 3px 10px rgba(37,99,235,.15) !important;
          transform: translateX(-2px);
        }
        .jr-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16,185,129,.35) !important;
        }
        .jr-rcard {
          transition: border-color .2s, box-shadow .2s, transform .16s;
        }
        .jr-rcard:hover {
          border-color: #bfdbfe !important;
          box-shadow: 0 4px 16px rgba(37,99,235,.1) !important;
          transform: translateY(-1px);
        }
        .jr-sort {
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 28px 6px 10px;
          font-size: 12px;
          font-family: inherit;
          font-weight: 600;
          color: #334155;
          background: #ffffff;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .jr-sort:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.15);
        }
        .jr-sort-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .jr-sort-wrap::after {
          content: "▾";
          position: absolute;
          right: 10px;
          font-size: 11px;
          color: #64748b;
          pointer-events: none;
        }
        .jr-textarea:focus {
          border-color: #10b981 !important;
          outline: none;
          background: #ffffff !important;
          box-shadow: 0 0 0 3.5px rgba(16,185,129,.14) !important;
        }
        @keyframes jr-spin {
          to { transform: rotate(360deg); }
        }
        .jr-spinner {
          animation: jr-spin .75s linear infinite;
        }
        .jr-bar-fill {
          transition: width .65s cubic-bezier(.4, 0, .2, 1);
        }
        .jr-dash-btn {
          transition: background .18s, transform .15s, box-shadow .18s;
        }
        .jr-dash-btn:hover {
          background: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37,99,235,.35) !important;
        }
        @media (max-width: 960px) {
          .jr-left { display: none !important; }
          .jr-grid { grid-template-columns: 1fr !important; }
          .jr-banner-deco { display: none !important; }
        }
        @media (max-width: 600px) {
          .jr-main { padding: 12px !important; }
          .jr-banner { padding: 16px !important; flex-wrap: wrap; }
          .jr-banner-score { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      {/* ══ LEFT DECORATIVE PANEL (Desktop only) ══ */}
      <aside className="jr-left" style={{ width: 154, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 10px", background: "transparent" }}>
        <button
          onClick={onBack}
          className="jr-back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: 20,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "#334155",
            cursor: "pointer",
            transition: "all .15s ease",
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </button>

        <div style={{ fontStyle: "italic", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#2563eb", fontSize: 13, lineHeight: 1.6, textAlign: "center", fontWeight: 700, marginBottom: 12 }}>
          Your Feedback<br />Builds a Better<br />GovNotify
        </div>

        <PersonIllustration />

        <div style={{ flex: 1 }} />

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <SmallBuilding />
          <div style={{ fontStyle: "italic", fontFamily: "'Georgia', serif", color: "#2563eb", fontSize: 10.5, lineHeight: 1.5, marginTop: 4, fontWeight: 700 }}>
            Real People,<br />Real Feedback
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT AREA ══ */}
      <main className="jr-main" style={{ flex: 1, padding: "16px 20px 36px 6px", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

        {/* ── TOP HERO BANNER ── */}
        <div
          className="jr-banner"
          style={{
            background: "linear-gradient(110deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)",
            borderRadius: 16,
            padding: "20px 26px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 6px 28px rgba(30,58,138,0.28)"
          }}
        >
          <div style={{ flexShrink: 0, zIndex: 1 }}>
            <Star3D size={76} />
          </div>

          <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Reviews &amp; Ratings
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#93c5fd", lineHeight: 1.5 }}>
              Real feedback from verified aspirants and candidates across government recruitments.
            </p>
            {hasJob && jobTitle && (
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.14)", borderRadius: 20, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: 12 }}>💼</span>
                <span style={{ fontSize: 12, color: "#ffffff", fontWeight: 600 }}>{jobTitle}</span>
              </div>
            )}
          </div>

          {/* Overall score card */}
          <div
            className="jr-banner-score"
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: "14px 22px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
              flexShrink: 0,
              minWidth: 115,
              zIndex: 2
            }}
          >
            <span style={{ fontSize: 34, fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>
              {hasJob && avg > 0 ? avg.toFixed(1) : "—"}
            </span>
            <StarDisplay rating={Math.round(avg)} size={16} />
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginTop: 2 }}>
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="jr-banner-deco" style={{ position: "relative", flexShrink: 0, minWidth: 125, paddingRight: 6, zIndex: 2 }}>
            <p style={{ margin: 0, fontStyle: "italic", fontFamily: "'Georgia', serif", color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.7, textAlign: "right", fontWeight: 600 }}>
              Your Feedback<br />Builds a Better<br />GovNotify.
            </p>
          </div>

          <BannerBuilding />
        </div>

        {/* ── TWO-COLUMN DASHBOARD GRID ── */}
        <div className="jr-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* ════ LEFT COLUMN ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Card 1: Rating Breakdown */}
            <div style={C.card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={C.greenIconBox}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div>
                    <div style={C.cardTitle}>Rating Breakdown</div>
                    <div style={C.cardSub}>Detailed distribution of user evaluations</div>
                  </div>
                </div>

                {hasJob && avg > 0 && (
                  <div style={C.avgBadge}>
                    <span style={{ fontSize: 13 }}>⭐</span>
                    <span style={{ fontWeight: 800, color: "#92400e", fontSize: 13.5 }}>{avg.toFixed(1)}</span>
                    <span style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>Average</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
                {dist.map(({ star, count, pct }) => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 32, flexShrink: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>{star}</span>
                      <span style={{ fontSize: 12, color: "#f59e0b", lineHeight: 1 }}>★</span>
                    </div>
                    <div style={{ flex: 1, height: 9, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                      <div
                        className="jr-bar-fill"
                        style={{
                          height: "100%",
                          borderRadius: 6,
                          width: `${pct}%`,
                          background: pct > 0 ? "linear-gradient(90deg, #f59e0b 0%, #fbbf24 60%, #fde68a 100%)" : "transparent"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, minWidth: 22, textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Write a Review */}
            <div style={{ ...C.card, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: 12, top: 12, opacity: 0.08, pointerEvents: "none" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={C.purpleIconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <div style={C.cardTitle}>Write a Review</div>
                  <div style={C.cardSub}>Share your experience with this recruitment, application, or process.</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                    Your Overall Rating
                  </label>
                  <StarSelector value={rating} onChange={setRating} />
                </div>

                <div style={{ position: "relative" }}>
                  <label htmlFor="jr-review-input" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                    Your Review
                  </label>
                  <textarea
                    id="jr-review-input"
                    className="jr-textarea"
                    placeholder="Describe your experience with the notification clarity, application portal, interview stages, or overall process..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      minHeight: 96,
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 12px 24px",
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: "#1e293b",
                      background: "#f8fafc",
                      transition: "all .18s ease",
                      boxSizing: "border-box",
                      lineHeight: 1.55
                    }}
                  />
                  <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 11, color: "#94a3b8", userSelect: "none", fontWeight: 600 }}>
                    {reviewText.length} / 2000
                  </span>
                </div>

                {formError && (
                  <div style={{ padding: "9px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={{ padding: "9px 12px", background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 8, color: "#065f46", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(16,185,129,0.12)" }}>
                    <span>🎉</span>
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="jr-submit"
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.75 : 1,
                    transition: "all .18s ease",
                    boxShadow: "0 3px 12px rgba(16,185,129,0.3)"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: All Reviews ════ */}
          <div style={{ ...C.card, display: "flex", flexDirection: "column", minHeight: 380 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={C.purpleIconBox}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span style={C.cardTitle}>All Reviews</span>
              {reviews.length > 0 && (
                <span style={{ background: "#2563eb", color: "#ffffff", fontSize: 11, fontWeight: 800, borderRadius: 20, padding: "2px 8px", minWidth: 20, textAlign: "center" }}>
                  {reviews.length}
                </span>
              )}

              {reviews.length > 0 && (
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>Sort by:</span>
                  <div className="jr-sort-wrap">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="jr-sort"
                      aria-label="Sort reviews by"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {!hasJob ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 14px", textAlign: "center" }}>
                <EmptyIllustration />
                <p style={{ margin: "16px 0 6px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                  No job selected
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6, maxWidth: 240 }}>
                  Open any job notification from your dashboard and click &ldquo;View Reviews&rdquo; to read experiences or leave feedback.
                </p>
                <button
                  onClick={onBack}
                  className="jr-dash-btn"
                  style={{
                    marginTop: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 3px 14px rgba(37,99,235,.28)"
                  }}
                >
                  Go to Dashboard →
                </button>
              </div>
            ) : loading ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", gap: 12 }}>
                <div className="jr-spinner" style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #10b981", borderRadius: "50%" }} />
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Loading reviews…</span>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 16px", textAlign: "center", gap: 8 }}>
                <span style={{ fontSize: 44 }}>💬</span>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#334155" }}>No reviews yet</p>
                <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8", maxWidth: 260 }}>
                  Be the first candidate to share feedback on this recruitment using the form on the left!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 460, overflowY: "auto", paddingRight: 4 }}>
                {sortedReviews.map(r => (
                  <div key={r.id} className="jr-rcard" style={{ background: "#f8fafc", border: "1.5px solid #e8edf5", borderRadius: 12, padding: "13px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 6px rgba(16,185,129,0.25)" }}>
                          {(r.userEmail || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                            {maskEmail(r.userEmail)}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>📅</span>
                            <span>{fmtDate(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <StarDisplay rating={r.rating} size={14} />
                    </div>
                    {r.reviewText && (
                      <p style={{ margin: 0, fontSize: 12.5, color: "#334155", lineHeight: 1.6, wordBreak: "break-word" }}>
                        {r.reviewText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM FULL-WIDTH RECENT REVIEWS BAR ── */}
        {latestReview && (
          <div
            style={{
              background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdf8 100%)",
              border: "1.5px solid #a7f3d0",
              borderRadius: 14,
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              boxShadow: "0 2px 10px rgba(16,185,129,0.08)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#065f46" }}>Recent Reviews</span>
              <span style={{ background: "#10b981", color: "#ffffff", fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: "2px 8px" }}>
                {reviews.length}
              </span>
            </div>

            <div style={{ width: 1, height: 32, background: "#6ee7b7", flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>
                {(latestReview.userEmail || "?")[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{maskEmail(latestReview.userEmail)}</div>
                <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                  <span>📅</span>
                  <span>{fmtDate(latestReview.createdAt)}</span>
                </div>
              </div>
              <p style={{ margin: "0 0 0 8px", fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                &ldquo;{latestReview.reviewText}&rdquo;
              </p>
            </div>

            <StarDisplay rating={latestReview.rating} size={15} />
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────
const C = {
  card: {
    background: "#ffffff",
    borderRadius: 14,
    border: "1.5px solid #e8f0fe",
    padding: "18px 20px",
    boxShadow: "0 2px 10px rgba(30,58,138,0.05)"
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3
  },
  cardSub: {
    fontSize: 11.5,
    color: "#94a3b8",
    marginTop: 2,
    lineHeight: 1.4
  },
  greenIconBox: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
    boxShadow: "0 2px 6px rgba(16,185,129,0.15)"
  },
  purpleIconBox: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
    boxShadow: "0 2px 6px rgba(124,58,237,0.15)"
  },
  avgBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "linear-gradient(135deg, #fef9ec, #fef3c7)",
    border: "1.5px solid #fde68a",
    borderRadius: 20,
    padding: "4px 10px",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(245,158,11,0.12)"
  }
};
