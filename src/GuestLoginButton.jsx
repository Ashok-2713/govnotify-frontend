import { useState } from "react";
import { User } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");

export default function GuestLoginButton({ onGuestLoginSuccess, setModal }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    const guestEmail = `guest_${Date.now()}@govnotify.in`;

    try {
      await fetch(`${API_BASE}/api/guest/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ guestId: guestEmail })
      });
    } catch (err) {
      console.warn("Guest session recording error (continuing locally):", err);
    }

    try {
      localStorage.setItem("userEmail", guestEmail);
    } catch (storageErr) {
      console.warn("Could not write to localStorage:", storageErr);
    }

    if (onGuestLoginSuccess) {
      onGuestLoginSuccess(guestEmail);
    } else if (setModal) {
      setModal(null);
    }

    setLoading(false);
  };

  return (
    <div style={{ margin: "12px 0 16px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 12px" }}>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: 600 }}>
          or explore without account
        </span>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1.5px dashed #cbd5e1",
          background: "#f8fafc",
          color: "#334155",
          fontSize: "13px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.15s ease",
          boxSizing: "border-box"
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#10b981";
            e.currentTarget.style.color = "#059669";
            e.currentTarget.style.background = "#ecfdf5";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.color = "#334155";
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
      >
        <User size={15} />
        <span>{loading ? "Initializing Guest..." : "Continue as Guest"}</span>
      </button>
    </div>
  );
}
