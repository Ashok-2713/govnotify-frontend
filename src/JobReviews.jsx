import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Mask email for privacy: ashok@gov.in → as***@gov.in
function maskEmail(email) {
  if (!email) return "Anonymous";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  // Handle LocalDateTime array from Spring: [2024, 10, 17, 19, 30, 0]
  if (Array.isArray(dateStr)) {
    const [y, m, d] = dateStr;
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return String(dateStr);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StarDisplay({ rating, size = 16 }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          style={{
            fontSize: size,
            color: s <= rating ? "#f59e0b" : "#e2e8f0",
            lineHeight: 1
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: "4px", cursor: "pointer", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 28,
            color: s <= (hovered || value) ? "#f59e0b" : "#cbd5e1",
            transition: "color 0.15s",
            userSelect: "none",
            lineHeight: 1
          }}
          title={`${s} star${s > 1 ? "s" : ""}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function JobReviews({ jobId, jobTitle, userEmail }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReviews = useCallback(() => {
    if (!jobId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/reviews/${jobId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setReviews([]); setLoading(false); });
  }, [jobId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    if (!rating) { setFormError("Please select a star rating."); return; }
    if (!reviewText.trim()) { setFormError("Please write a short review."); return; }

    setSubmitting(true);
    fetch(`${API_BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: jobId,
        userEmail: userEmail || "anonymous@govnotify.in",
        rating: rating,
        reviewText: reviewText.trim()
      })
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(() => {
        setSuccessMsg("✅ Review submitted! Thank you.");
        setRating(0);
        setReviewText("");
        fetchReviews();
      })
      .catch(() => setFormError("❌ Failed to submit. Please try again."))
      .finally(() => setSubmitting(false));
  };

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  return (
    <div style={s.root}>
      <style>{`
        .jr-submit-btn:hover { background: #059669 !important; transform: translateY(-1px); }
        .jr-review-card:hover { border-color: #10b981 !important; box-shadow: 0 2px 12px rgba(16,185,129,0.12) !important; }
        .jr-textarea:focus { border-color: #10b981 !important; outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important; }
      `}</style>

      {/* Section Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.headerIcon}>⭐</span>
          <h4 style={s.headerTitle}>Reviews & Ratings</h4>
        </div>
        {avgRating && (
          <div style={s.avgBadge}>
            <span style={s.avgNumber}>{avgRating}</span>
            <StarDisplay rating={Math.round(Number(avgRating))} size={14} />
            <span style={s.reviewCount}>({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Rating distribution bar */}
      {reviews.length > 0 && (
        <div style={s.distBlock}>
          {dist.map(({ star, count }) => (
            <div key={star} style={s.distRow}>
              <StarDisplay rating={star} size={12} />
              <div style={s.distBarBg}>
                <div
                  style={{
                    ...s.distBarFill,
                    width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%"
                  }}
                />
              </div>
              <span style={s.distCount}>{count}</span>
            </div>
          ))}
        </div>
      )}

      <div style={s.divider} />

      {/* Submit Form */}
      <form onSubmit={handleSubmit} style={s.form}>
        <p style={s.formTitle}>Leave a Review</p>

        <div style={s.starRow}>
          <StarSelector value={rating} onChange={setRating} />
          {rating > 0 && (
            <span style={s.ratingLabel}>
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>

        <textarea
          className="jr-textarea"
          placeholder="Share your experience with this recruitment, process, or organization..."
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          maxLength={2000}
          rows={3}
          style={s.textarea}
        />
        <div style={s.charCount}>{reviewText.length}/2000</div>

        {formError && <p style={s.errorMsg}>{formError}</p>}
        {successMsg && <p style={s.successMsg}>{successMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="jr-submit-btn"
          style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>

      <div style={s.divider} />

      {/* Reviews list */}
      {loading ? (
        <p style={s.muted}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 32 }}>💬</span>
          <p style={s.emptyText}>No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div style={s.reviewList}>
          {reviews.map(r => (
            <div key={r.id} className="jr-review-card" style={s.reviewCard}>
              <div style={s.cardTop}>
                <div style={s.cardLeft}>
                  <div style={s.avatar}>{(r.userEmail || "?")[0].toUpperCase()}</div>
                  <div>
                    <div style={s.reviewerEmail}>{maskEmail(r.userEmail)}</div>
                    <div style={s.reviewDate}>{fmtDate(r.createdAt)}</div>
                  </div>
                </div>
                <StarDisplay rating={r.rating} size={15} />
              </div>
              {r.reviewText && (
                <p style={s.reviewText}>{r.reviewText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  root: {
    marginTop: "20px",
    borderTop: "2px dashed #e2e8f0",
    paddingTop: "18px",
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "8px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  headerIcon: { fontSize: 20 },
  headerTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a"
  },
  avgBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#fef9ec",
    border: "1px solid #fde68a",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "13px"
  },
  avgNumber: {
    fontWeight: 800,
    color: "#92400e",
    fontSize: "14px"
  },
  reviewCount: { color: "#92400e", fontWeight: 600 },
  distBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px"
  },
  distRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  distBarBg: {
    flex: 1,
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden"
  },
  distBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    borderRadius: "3px",
    transition: "width 0.4s ease"
  },
  distCount: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 600,
    minWidth: "16px",
    textAlign: "right"
  },
  divider: {
    height: "1px",
    background: "#f1f5f9",
    margin: "14px 0"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  formTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151"
  },
  starRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  ratingLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#f59e0b"
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    minHeight: "72px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontFamily: "inherit",
    color: "#1e293b",
    background: "#f8fafc",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box"
  },
  charCount: {
    textAlign: "right",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "-4px"
  },
  errorMsg: {
    margin: 0,
    padding: "8px 12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#991b1b",
    fontSize: "13px"
  },
  successMsg: {
    margin: 0,
    padding: "8px 12px",
    background: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: "8px",
    color: "#065f46",
    fontSize: "13px",
    fontWeight: 600
  },
  submitBtn: {
    alignSelf: "flex-start",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
    paddingRight: "2px"
  },
  reviewCard: {
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px 14px",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "6px"
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #2563eb)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    flexShrink: 0
  },
  reviewerEmail: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1e293b"
  },
  reviewDate: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  reviewText: {
    margin: 0,
    fontSize: "13px",
    color: "#374151",
    lineHeight: 1.55
  },
  muted: {
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
    margin: "12px 0"
  },
  emptyState: {
    textAlign: "center",
    padding: "16px 0"
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "6px"
  }
};
