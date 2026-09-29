import { useState } from "react";
import { X, Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:8080/api/auth";

export default function ForgotPasswordModal({ onClose, onBackToLogin }) {
  // Step 1: Email, Step 2: OTP, Step 3: New Password, Step 4: Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Step 1: Send OTP to user's email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP.");
      }

      setSuccessMessage(data.message || "A 6-digit OTP has been sent to your email.");
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the entered OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanOtp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired OTP.");
      }

      setSuccessMessage("OTP verified successfully!");
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler for Step 2
  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_URL}/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMessage("A fresh 6-digit OTP has been resent to your email.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password with OTP & New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_URL}/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccessMessage(data.message || "Password reset successfully!");
      setStep(4);
    } catch (err) {
      setErrorMessage(err.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container-forgot"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          padding: "36px 32px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "modalFadeIn 0.25s ease-out"
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#64748b"
          }}
          title="Close"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Step Indicator Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #047857)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(16, 185, 129, 0.3)",
              marginBottom: "14px"
            }}
          >
            {step === 1 && <Mail size={26} color="#ffffff" />}
            {step === 2 && <KeyRound size={26} color="#ffffff" />}
            {step === 3 && <Lock size={26} color="#ffffff" />}
            {step === 4 && <CheckCircle2 size={26} color="#ffffff" />}
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Enter Verification OTP"}
            {step === 3 && "Set New Password"}
            {step === 4 && "Password Reset Successful!"}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {step === 1 && "Enter your email to receive a secure 6-digit OTP code."}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && "Create a strong new password for your GovNotify account."}
            {step === 4 && "Your password has been securely updated."}
          </p>

          {/* Stepper Dots */}
          {step < 4 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    width: s === step ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: s === step ? "#10b981" : s < step ? "#059669" : "#e2e8f0",
                    transition: "all 0.3s ease"
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "12.5px",
              marginBottom: "18px"
            }}
          >
            <AlertCircle size={16} flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && step !== 4 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "#ecfdf5",
              border: "1px solid #d1fae5",
              borderRadius: "8px",
              color: "#059669",
              fontSize: "12.5px",
              marginBottom: "18px"
            }}
          >
            <CheckCircle2 size={16} flexShrink={0} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Registered Email Address
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#f8fafc",
                    color: "#0f172a"
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #1d4ed8 0%, #10b981 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px", textAlign: "center" }}>
                Enter 6-Digit One-Time Password
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="• • • • • •"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px",
                  textAlign: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "12px",
                  border: "2px solid #10b981",
                  borderRadius: "10px",
                  outline: "none",
                  background: "#f0fdf4",
                  color: "#065f46"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Valid for 10 minutes</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #1d4ed8 0%, #10b981 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                opacity: loading || otp.length !== 6 ? 0.6 : 1
              }}
            >
              {loading ? "Verifying..." : "Verify Code & Proceed"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 3: Enter New Password & Confirm Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 38px 12px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#f8fafc",
                    color: "#0f172a"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  {showPassword ? <EyeOff size={18} style={{ color: "#10b981" }} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  minLength={8}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 38px 12px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#f8fafc",
                    color: "#0f172a"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  {showConfirmPassword ? <EyeOff size={18} style={{ color: "#10b981" }} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Updating Password..." : "Save New Password"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 4: Success View */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                padding: "14px",
                background: "#ecfdf5",
                borderRadius: "10px",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "13.5px",
                lineHeight: "1.5",
                marginBottom: "24px"
              }}
            >
              Your password has been successfully updated. You can now use your new password to sign into your account.
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #1d4ed8 0%, #10b981 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
              }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Back to Login link */}
        {step < 4 && (
          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12.5px", color: "#64748b" }}>
            Remembered your password?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
