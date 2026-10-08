import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  LogOut,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Type,
  Sparkles,
  Sliders,
  Save,
  RefreshCw,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Camera,
  Globe,
  HelpCircle,
  KeyRound,
  ChevronRight,
  Shield,
  Info,
  X,
  Phone,
  MapPin,
  Settings as SettingsIcon,
  Headphones
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Indian States and sample popular districts for quick selection
const STATES_DISTRICTS = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "East Delhi", "Central Delhi"],
  "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Noida", "Prayagraj", "Agra", "Ghaziabad", "Meerut"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Rangareddy"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"]
};

const Settings = ({ userEmail = "ashok.udhay@govnotify.in", onBack, onEligibilityClick }) => {
  // Resolve default name from localStorage or email
  const initialName = useMemo(() => {
    try {
      const stored = localStorage.getItem("candidateName");
      if (stored && stored.trim()) return stored.trim();
      const p = JSON.parse(localStorage.getItem("eligibilityProfile") || localStorage.getItem("userProfile") || "{}");
      if (p.candidateName && p.candidateName.trim()) return p.candidateName.trim();
      if (p.fullName && p.fullName.trim()) return p.fullName.trim();
    } catch {}
    if (userEmail && userEmail.includes("@")) {
      const prefix = userEmail.split("@")[0].replace(/[0-9_.-]/g, " ").trim();
      if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "GovNotify Candidate";
  }, [userEmail]);

  // Form State (Account Settings)
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(() => localStorage.getItem("userPhone") || "+91 98765 43210");
  const [selectedState, setSelectedState] = useState(() => localStorage.getItem("userState") || "Tamil Nadu");
  const [selectedDistrict, setSelectedDistrict] = useState(() => localStorage.getItem("userDistrict") || "Chennai");

  // Notification Preferences State (5 toggles)
  const [notifState, setNotifState] = useState({
    newJobAlerts: true,
    upcomingJobAlerts: true,
    applicationUpdates: true,
    newsAnnouncements: false,
    emailNotifications: true
  });

  // Appearance State
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("govnotify_theme_mode") || "light");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("govnotify_font_size") || "medium");
  const [language, setLanguage] = useState(() => localStorage.getItem("govnotify_language") || "en");

  // Security Toggles
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Connected Devices List from Backend
  const [devicesList, setDevicesList] = useState([]);

  // Modals & Feedback
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Toast Helper
  const showToast = (msg, duration = 3200) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  // Sync available districts when state changes
  useEffect(() => {
    const list = STATES_DISTRICTS[selectedState] || [];
    if (list.length > 0 && !list.includes(selectedDistrict)) {
      setSelectedDistrict(list[0]);
    }
  }, [selectedState]);

  // FETCH INITIAL DATA FROM SPRING BOOT BACKEND
  useEffect(() => {
    if (!userEmail) return;

    // 1. Fetch user settings from MySQL
    fetch(`${API_BASE}/api/user/settings?email=${encodeURIComponent(userEmail)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.fullName) setFullName(data.fullName);
          if (data.phone) setPhone(data.phone);
          if (data.state) setSelectedState(data.state);
          if (data.district) setSelectedDistrict(data.district);
          if (data.twoFactorEnabled !== undefined) setTwoFactorAuth(Boolean(data.twoFactorEnabled));
          if (data.themeMode) setThemeMode(data.themeMode);
          if (data.fontSize) setFontSize(data.fontSize);
          if (data.language) setLanguage(data.language);

          setNotifState({
            newJobAlerts: data.newJobAlerts !== undefined ? data.newJobAlerts : true,
            upcomingJobAlerts: data.upcomingJobAlerts !== undefined ? data.upcomingJobAlerts : true,
            applicationUpdates: data.applicationUpdates !== undefined ? data.applicationUpdates : true,
            newsAnnouncements: data.newsAnnouncements !== undefined ? data.newsAnnouncements : false,
            emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true
          });

          // Sync to localStorage for fast portal hydration
          localStorage.setItem("candidateName", data.fullName || "");
          localStorage.setItem("userPhone", data.phone || "");
          localStorage.setItem("userState", data.state || "");
          localStorage.setItem("userDistrict", data.district || "");
        }
      })
      .catch((err) => console.warn("Notice: Backend settings sync using local cache", err));

    // 2. Fetch connected devices from MySQL
    fetch(`${API_BASE}/api/user/devices?email=${encodeURIComponent(userEmail)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((devices) => {
        if (Array.isArray(devices) && devices.length > 0) {
          setDevicesList(devices);
        }
      })
      .catch((err) => console.warn("Notice: Devices sync", err));
  }, [userEmail]);

  // PART 1: Handle Save Account Settings to Backend
  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Send update to Spring Boot backend
      const res = await fetch(`${API_BASE}/api/user/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          fullName: fullName.trim(),
          phone: phone.trim(),
          state: selectedState,
          district: selectedDistrict
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 2. Also persist locally
        localStorage.setItem("candidateName", fullName);
        localStorage.setItem("userPhone", phone);
        localStorage.setItem("userState", selectedState);
        localStorage.setItem("userDistrict", selectedDistrict);

        const storedProfile = JSON.parse(localStorage.getItem("eligibilityProfile") || "{}");
        storedProfile.candidateName = fullName;
        storedProfile.phone = phone;
        storedProfile.state = selectedState;
        storedProfile.district = selectedDistrict;
        localStorage.setItem("eligibilityProfile", JSON.stringify(storedProfile));

        showToast("Account details saved to database successfully!");
      } else {
        showToast(data.message || "Failed to update profile.", 4000);
      }
    } catch (err) {
      console.error(err);
      showToast("Profile saved locally (Offline mode).");
    } finally {
      setIsSaving(false);
    }
  };

  // PART 2: Handle Notification Preference Toggles to Backend
  const handleToggleNotif = async (key) => {
    const updated = { ...notifState, [key]: !notifState[key] };
    // Optimistic UI update
    setNotifState(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));

    try {
      const res = await fetch(`${API_BASE}/api/user/update-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          newJobAlerts: updated.newJobAlerts,
          upcomingJobAlerts: updated.upcomingJobAlerts,
          applicationUpdates: updated.applicationUpdates,
          newsAnnouncements: updated.newsAnnouncements,
          emailNotifications: updated.emailNotifications
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Notification preferences saved to database.");
      } else {
        showToast(data.message || "Preference saved locally.");
      }
    } catch (err) {
      console.error("Backend preference save failed:", err);
      showToast("Preference saved locally.");
    }
  };

  // Appearance handlers with Backend Sync
  const handleThemeChange = async (mode) => {
    setThemeMode(mode);
    localStorage.setItem("govnotify_theme_mode", mode);
    showToast(`Theme switched to ${mode.toUpperCase()}`);

    try {
      await fetch(`${API_BASE}/api/user/update-appearance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, themeMode: mode, fontSize, language })
      });
    } catch (err) {
      console.warn("Theme save warning:", err);
    }
  };

  const handleFontSizeChange = async (val) => {
    setFontSize(val);
    localStorage.setItem("govnotify_font_size", val);
    showToast(`Font size set to ${val}`);

    try {
      await fetch(`${API_BASE}/api/user/update-appearance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, themeMode, fontSize: val, language })
      });
    } catch (err) {
      console.warn("Font save warning:", err);
    }
  };

  const handleLanguageChange = async (val) => {
    setLanguage(val);
    localStorage.setItem("govnotify_language", val);
    showToast(`Display language updated`);

    try {
      await fetch(`${API_BASE}/api/user/update-appearance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, themeMode, fontSize, language: val })
      });
    } catch (err) {
      console.warn("Language save warning:", err);
    }
  };

  // PART 3: Two Factor Auth Toggle with Backend Sync
  const handleToggle2FA = async () => {
    const nextVal = !twoFactorAuth;
    setTwoFactorAuth(nextVal);
    localStorage.setItem("govnotify_2fa", String(nextVal));

    try {
      const res = await fetch(`${API_BASE}/api/user/toggle-2fa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, enabled: nextVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(nextVal ? "Two-Factor Authentication Enabled in Database" : "Two-Factor Authentication Disabled");
      } else {
        showToast(nextVal ? "2FA Enabled" : "2FA Disabled");
      }
    } catch (err) {
      showToast(nextVal ? "2FA Enabled" : "2FA Disabled");
    }
  };

  // PART 3: Password Change Form Submit to Backend
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordSuccess("Password updated successfully in database!");
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordSuccess("");
          showToast("Password changed successfully!");
        }, 1200);
      } else {
        setPasswordError(data.message || "Failed to update password. Please check your current password.");
      }
    } catch (err) {
      setPasswordError("Connection error while connecting to backend.");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // PART 3: Delete Account Handler to Backend
  const handleDeleteAccountConfirm = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/delete-account?email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE"
      });

      const data = await res.json();

      localStorage.removeItem("candidateName");
      localStorage.removeItem("userPhone");
      localStorage.removeItem("userState");
      localStorage.removeItem("userDistrict");
      localStorage.removeItem("notificationPreferences");
      localStorage.removeItem("eligibilityProfile");

      setIsDeleteModalOpen(false);
      showToast("Account and records deleted successfully from database.");

      setTimeout(() => {
        if (onBack) onBack();
      }, 1000);
    } catch (err) {
      console.error(err);
      localStorage.clear();
      setIsDeleteModalOpen(false);
      showToast("Account deleted locally.");
      setTimeout(() => {
        if (onBack) onBack();
      }, 800);
    }
  };

  // PART 4: Revoke Device Session from Backend
  const handleRevokeDevice = async (deviceId) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/devices/${deviceId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevicesList((prev) => prev.filter((d) => d.id !== deviceId));
        showToast("Device session revoked successfully from database.");
      } else {
        showToast(data.message || "Device removed.");
      }
    } catch (err) {
      setDevicesList((prev) => prev.filter((d) => d.id !== deviceId));
      showToast("Device session revoked.");
    }
  };

  // Active notifications count
  const activeAlertsCount = Object.values(notifState).filter(Boolean).length;

  return (
    <div className="gov-settings-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gov-toast">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER / HERO BANNER */}
      <div className="gov-settings-hero">
        <div className="gov-hero-container">
          <div className="gov-hero-content">
            <div className="gov-hero-badge">
              <Sparkles size={14} />
              <span>GovNotify Account • Your Goals, Our Support</span>
            </div>
            <div className="gov-hero-title-row">
              <div className="gov-hero-icon-box">
                <SettingsIcon size={28} />
              </div>
              <div>
                <h1 className="gov-hero-title">Settings & Preferences</h1>
                <p className="gov-hero-sub">
                  Manage your account, notification rules, security, and appearance to get the best experience with GovNotify.
                </p>
              </div>
            </div>
          </div>

          {onBack && (
            <button className="gov-back-btn" onClick={onBack}>
              <ArrowLeft size={16} />
              <span>Back to Portal</span>
            </button>
          )}
        </div>
      </div>

      <div className="gov-settings-body">
        {/* TOP KPI CARDS (4 CARDS) */}
        <div className="gov-kpi-grid">
          {/* KPI 1: Account Status */}
          <div className="gov-kpi-card">
            <div className="gov-kpi-icon-wrap kpi-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="gov-kpi-info">
              <span className="gov-kpi-label">Account Status</span>
              <div className="gov-kpi-val-row">
                <span className="gov-kpi-value">Active</span>
                <span className="gov-badge-verified">Verified</span>
              </div>
              <span className="gov-kpi-hint">GovNotify Registered User</span>
            </div>
          </div>

          {/* KPI 2: Notifications */}
          <div className="gov-kpi-card">
            <div className="gov-kpi-icon-wrap kpi-blue">
              <Bell size={24} />
            </div>
            <div className="gov-kpi-info">
              <span className="gov-kpi-label">Notifications</span>
              <div className="gov-kpi-val-row">
                <span className="gov-kpi-value">{activeAlertsCount}/5 Enabled</span>
              </div>
              <span className="gov-kpi-hint">Real-time alerts & emails</span>
            </div>
          </div>

          {/* KPI 3: Security */}
          <div className="gov-kpi-card">
            <div className="gov-kpi-icon-wrap kpi-emerald">
              <ShieldCheck size={24} />
            </div>
            <div className="gov-kpi-info">
              <span className="gov-kpi-label">Security</span>
              <div className="gov-kpi-val-row">
                <span className="gov-kpi-value">{twoFactorAuth ? "Maximum" : "High"}</span>
                <span className="gov-badge-shield">{twoFactorAuth ? "2FA Active" : "Protected"}</span>
              </div>
              <span className="gov-kpi-hint">Encrypted credentials</span>
            </div>
          </div>

          {/* KPI 4: Theme */}
          <div className="gov-kpi-card">
            <div className="gov-kpi-icon-wrap kpi-purple">
              {themeMode === "dark" ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div className="gov-kpi-info">
              <span className="gov-kpi-label">Theme Mode</span>
              <div className="gov-kpi-val-row">
                <span className="gov-kpi-value">
                  {themeMode === "light" ? "Light Mode" : themeMode === "dark" ? "Dark Mode" : "System Mode"}
                </span>
              </div>
              <span className="gov-kpi-hint">Visual appearance</span>
            </div>
          </div>
        </div>

        {/* MAIN 3-COLUMN DASHBOARD GRID */}
        <div className="gov-dashboard-columns">
          {/* ===================== COLUMN 1: LEFT ===================== */}
          <div className="gov-column">
            {/* Account Settings Card */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-icon user-icon">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="gov-card-title">Account Settings</h2>
                  <p className="gov-card-subtitle">Personal details and residential location</p>
                </div>
              </div>

              {/* Avatar row */}
              <div className="gov-avatar-section">
                <div className="gov-avatar-circle">
                  <span>{fullName ? fullName.charAt(0).toUpperCase() : "U"}</span>
                  <button
                    type="button"
                    className="gov-avatar-camera"
                    title="Change Photo"
                    onClick={() => showToast("Avatar photo upload ready (local mode)")}
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div className="gov-avatar-meta">
                  <h4 className="gov-avatar-name">{fullName || "Candidate"}</h4>
                  <p className="gov-avatar-email">{userEmail}</p>
                  <span className="gov-avatar-role">Aspirant Profile</span>
                </div>
              </div>

              <form onSubmit={handleSaveAccount} className="gov-form">
                <div className="gov-form-group">
                  <label className="gov-label">Full Name</label>
                  <div className="gov-input-wrapper">
                    <User size={16} className="gov-input-icon" />
                    <input
                      type="text"
                      className="gov-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ashok Kumar"
                      required
                    />
                  </div>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Email Address</label>
                  <div className="gov-input-wrapper">
                    <Mail size={16} className="gov-input-icon" />
                    <input
                      type="email"
                      className="gov-input gov-input-readonly"
                      value={userEmail}
                      readOnly
                      disabled
                    />
                    <span className="gov-verified-pill">Verified</span>
                  </div>
                  <span className="gov-field-note">Email is associated with your login credentials.</span>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">Phone Number</label>
                  <div className="gov-input-wrapper">
                    <Phone size={16} className="gov-input-icon" />
                    <input
                      type="tel"
                      className="gov-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="gov-form-row">
                  <div className="gov-form-group">
                    <label className="gov-label">State / UT</label>
                    <select
                      className="gov-select"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                    >
                      {Object.keys(STATES_DISTRICTS).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-label">District</label>
                    <select
                      className="gov-select"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                    >
                      {(STATES_DISTRICTS[selectedState] || ["Default"]).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="gov-save-btn" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Appearance Settings Card */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-icon appearance-icon">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="gov-card-title">Appearance Settings</h2>
                  <p className="gov-card-subtitle">Interface styling and readability</p>
                </div>
              </div>

              <div className="gov-appearance-body">
                <div className="gov-appearance-field">
                  <label className="gov-label">Theme Mode</label>
                  <div className="gov-theme-tiles">
                    <button
                      type="button"
                      className={`gov-theme-tile ${themeMode === "light" ? "active" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <div className="theme-preview-box light-preview">
                        <Sun size={20} />
                      </div>
                      <div className="theme-tile-text">
                        <span className="theme-tile-title">Light</span>
                        <span className="theme-tile-sub">Default clean</span>
                      </div>
                      {themeMode === "light" && <Check size={16} className="theme-check" />}
                    </button>

                    <button
                      type="button"
                      className={`gov-theme-tile ${themeMode === "dark" ? "active" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <div className="theme-preview-box dark-preview">
                        <Moon size={20} />
                      </div>
                      <div className="theme-tile-text">
                        <span className="theme-tile-title">Dark</span>
                        <span className="theme-tile-sub">Eye comfort</span>
                      </div>
                      {themeMode === "dark" && <Check size={16} className="theme-check" />}
                    </button>

                    <button
                      type="button"
                      className={`gov-theme-tile ${themeMode === "system" ? "active" : ""}`}
                      onClick={() => handleThemeChange("system")}
                    >
                      <div className="theme-preview-box system-preview">
                        <Monitor size={20} />
                      </div>
                      <div className="theme-tile-text">
                        <span className="theme-tile-title">System</span>
                        <span className="theme-tile-sub">Auto sync</span>
                      </div>
                      {themeMode === "system" && <Check size={16} className="theme-check" />}
                    </button>
                  </div>
                </div>

                <div className="gov-form-row" style={{ marginTop: "16px" }}>
                  <div className="gov-form-group">
                    <label className="gov-label">Font Size</label>
                    <div className="gov-input-wrapper">
                      <Type size={16} className="gov-input-icon" />
                      <select
                        className="gov-select"
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                      >
                        <option value="small">Small (13px)</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="large">Large (16px)</option>
                      </select>
                    </div>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-label">Language</label>
                    <div className="gov-input-wrapper">
                      <Globe size={16} className="gov-input-icon" />
                      <select
                        className="gov-select"
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== COLUMN 2: MIDDLE ===================== */}
          <div className="gov-column">
            {/* Notification Preferences Card */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-icon notif-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="gov-card-title">Notification Preferences</h2>
                  <p className="gov-card-subtitle">Control how and when you receive job updates</p>
                </div>
              </div>

              <div className="gov-toggles-list">
                {/* 1. New Job Notifications */}
                <div className="gov-toggle-item">
                  <div className="gov-toggle-text">
                    <h4 className="gov-toggle-title">New Job Notifications</h4>
                    <p className="gov-toggle-desc">
                      Receive alerts when new government jobs matching your qualification are published.
                    </p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifState.newJobAlerts}
                      onChange={() => handleToggleNotif("newJobAlerts")}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>

                {/* 2. Upcoming Job Alerts */}
                <div className="gov-toggle-item">
                  <div className="gov-toggle-text">
                    <h4 className="gov-toggle-title">Upcoming Job Alerts</h4>
                    <p className="gov-toggle-desc">
                      Advance notice for expected recruitment exams, notifications, and vacancy releases.
                    </p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifState.upcomingJobAlerts}
                      onChange={() => handleToggleNotif("upcomingJobAlerts")}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>

                {/* 3. Application Updates */}
                <div className="gov-toggle-item">
                  <div className="gov-toggle-text">
                    <h4 className="gov-toggle-title">Application Updates</h4>
                    <p className="gov-toggle-desc">
                      Important updates regarding last dates to apply, fee payments, and form corrections.
                    </p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifState.applicationUpdates}
                      onChange={() => handleToggleNotif("applicationUpdates")}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>

                {/* 4. News & Announcements */}
                <div className="gov-toggle-item">
                  <div className="gov-toggle-text">
                    <h4 className="gov-toggle-title">News & Announcements</h4>
                    <p className="gov-toggle-desc">
                      Official circulars, exam schedule revisions, syllabus alterations, and answer keys.
                    </p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifState.newsAnnouncements}
                      onChange={() => handleToggleNotif("newsAnnouncements")}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>

                {/* 5. Email Notifications */}
                <div className="gov-toggle-item">
                  <div className="gov-toggle-text">
                    <div className="gov-flex-row">
                      <h4 className="gov-toggle-title">Email Notifications</h4>
                      <span className="gov-badge-recommended">Recommended</span>
                    </div>
                    <p className="gov-toggle-desc">
                      Instant or consolidated email alerts sent to {userEmail} when high-priority jobs match.
                    </p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifState.emailNotifications}
                      onChange={() => handleToggleNotif("emailNotifications")}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>
              </div>
            </div>

            {/* Connected Devices Card */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-icon device-icon">
                  <Laptop size={20} />
                </div>
                <div>
                  <h2 className="gov-card-title">Connected Devices</h2>
                  <p className="gov-card-subtitle">Active sessions signed in with your account</p>
                </div>
              </div>

              <div className="gov-devices-list">
                {devicesList.length > 0 ? (
                  devicesList.slice(0, 2).map((dev) => (
                    <div className="gov-device-item" key={dev.id}>
                      <div
                        className={`gov-device-icon-box ${
                          dev.currentSession ? "active-device" : "inactive-device"
                        }`}
                      >
                        {dev.deviceType === "mobile" ? <Smartphone size={20} /> : <Laptop size={20} />}
                      </div>
                      <div className="gov-device-details">
                        <div className="gov-device-title-row">
                          <span className="gov-device-name">{dev.deviceName}</span>
                          {dev.currentSession && (
                            <span className="gov-device-badge-active">Active Now</span>
                          )}
                        </div>
                        <span className="gov-device-loc">
                          {dev.location || "India"} • {dev.currentSession ? "Current Session" : dev.lastActive}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="gov-device-item">
                    <div className="gov-device-icon-box active-device">
                      <Laptop size={20} />
                    </div>
                    <div className="gov-device-details">
                      <div className="gov-device-title-row">
                        <span className="gov-device-name">Windows PC • Chrome</span>
                        <span className="gov-device-badge-active">Active Now</span>
                      </div>
                      <span className="gov-device-loc">New Delhi, India • Current Session</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="gov-device-footer">
                <button
                  type="button"
                  className="gov-link-btn"
                  onClick={() => setIsDevicesModalOpen(true)}
                >
                  <span>View All Active Devices</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ===================== COLUMN 3: RIGHT SIDEBAR ===================== */}
          <div className="gov-column">
            {/* Quick Settings / Security & Privacy */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-icon security-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="gov-card-title">Quick Settings</h2>
                  <p className="gov-card-subtitle">Security controls & privacy</p>
                </div>
              </div>

              <div className="gov-quick-list">
                {/* Change Password */}
                <div className="gov-quick-item">
                  <div className="gov-quick-item-left">
                    <div className="gov-item-mini-icon">
                      <KeyRound size={16} />
                    </div>
                    <div>
                      <h4 className="gov-quick-title">Change Password</h4>
                      <p className="gov-quick-desc">Update your login security credentials</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="gov-action-btn"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Update
                  </button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="gov-quick-item">
                  <div className="gov-quick-item-left">
                    <div className="gov-item-mini-icon">
                      <Shield size={16} />
                    </div>
                    <div>
                      <h4 className="gov-quick-title">Two-Factor Auth</h4>
                      <p className="gov-quick-desc">Extra security layer for signing in</p>
                    </div>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={twoFactorAuth}
                      onChange={handleToggle2FA}
                    />
                    <span className="gov-slider" />
                  </label>
                </div>

                {/* Eligibility Profile Shortcut */}
                {onEligibilityClick && (
                  <div className="gov-quick-item">
                    <div className="gov-quick-item-left">
                      <div className="gov-item-mini-icon">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <h4 className="gov-quick-title">Eligibility Profile</h4>
                        <p className="gov-quick-desc">Degree, category & job match criteria</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gov-action-btn"
                      onClick={onEligibilityClick}
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Delete Account */}
                <div className="gov-quick-item danger-item">
                  <div className="gov-quick-item-left">
                    <div className="gov-item-mini-icon danger-icon">
                      <Trash2 size={16} />
                    </div>
                    <div>
                      <h4 className="gov-quick-title danger-title">Delete Account</h4>
                      <p className="gov-quick-desc">Permanently remove saved preferences</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="gov-danger-btn"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Need Help? Card */}
            <div className="gov-card gov-support-card">
              <div className="gov-support-header">
                <div className="gov-support-robot">
                  <div className="gov-bot-badge">
                    <Sparkles size={16} />
                  </div>
                </div>
                <h3 className="gov-support-title">Need Assistance?</h3>
                <p className="gov-support-desc">
                  Have questions about notification delivery, job recommendations, or exam eligibility? Our GovNotify support team and AI assistant are ready to assist you.
                </p>
              </div>

              <div className="gov-support-actions">
                <button
                  type="button"
                  className="gov-support-btn primary"
                  onClick={() => {
                    const event = new CustomEvent("open-govnotify-support");
                    window.dispatchEvent(event);
                    showToast("Opening GovNotify Help & Support...");
                  }}
                >
                  <Headphones size={16} />
                  <span>Contact Support</span>
                </button>
                <button
                  type="button"
                  className="gov-support-btn secondary"
                  onClick={() => {
                    window.location.hash = "#faqs";
                    showToast("Viewing frequently asked questions");
                  }}
                >
                  <HelpCircle size={16} />
                  <span>Read FAQs</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="gov-settings-footer">
          <p>© 2026 GovNotify • Government Job Notification Portal. All rights reserved.</p>
          <div className="gov-footer-links">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast("GovNotify Privacy Policy"); }}>Privacy Policy</a>
            <span>•</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); showToast("GovNotify Terms of Service"); }}>Terms of Service</a>
            <span>•</span>
            <a href="#support" onClick={(e) => { e.preventDefault(); showToast("Support Desk: support@govnotify.in"); }}>Help Center</a>
          </div>
        </div>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="gov-modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="gov-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <div className="gov-modal-title-wrap">
                <KeyRound size={20} className="modal-title-icon" />
                <h3>Change Password</h3>
              </div>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="gov-modal-form">
              {passwordError && (
                <div className="gov-modal-error">
                  <AlertTriangle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="gov-modal-success">
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="gov-form-group">
                <label className="gov-label">Current Password</label>
                <div className="gov-input-wrapper">
                  <Lock size={16} className="gov-input-icon" />
                  <input
                    type={showOldPass ? "text" : "password"}
                    className="gov-input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="gov-eye-btn"
                    onClick={() => setShowOldPass(!showOldPass)}
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">New Password</label>
                <div className="gov-input-wrapper">
                  <Lock size={16} className="gov-input-icon" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    className="gov-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="gov-eye-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">Confirm New Password</label>
                <div className="gov-input-wrapper">
                  <Lock size={16} className="gov-input-icon" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    className="gov-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="gov-eye-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="gov-modal-actions">
                <button
                  type="button"
                  className="gov-btn-cancel"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="gov-btn-confirm" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connected Devices Modal */}
      {isDevicesModalOpen && (
        <div className="gov-modal-backdrop" onClick={() => setIsDevicesModalOpen(false)}>
          <div className="gov-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <div className="gov-modal-title-wrap">
                <Laptop size={20} className="modal-title-icon" />
                <h3>All Active Sessions</h3>
              </div>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setIsDevicesModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gov-modal-body">
              <p className="gov-modal-desc">
                These are the devices currently authenticated to your GovNotify account in the database. You can revoke any unrecognized session.
              </p>

              <div className="gov-devices-modal-list">
                {devicesList.map((dev) => (
                  <div className="gov-session-card" key={dev.id}>
                    <div className="gov-session-left">
                      {dev.deviceType === "mobile" ? (
                        <Smartphone size={22} className="gov-sess-icon" />
                      ) : (
                        <Laptop size={22} className="gov-sess-icon" />
                      )}
                      <div>
                        <div className="gov-sess-head">
                          <span className="gov-sess-title">{dev.deviceName}</span>
                          {dev.currentSession && (
                            <span className="gov-sess-tag-current">This Device</span>
                          )}
                        </div>
                        <span className="gov-sess-info">
                          {dev.location || "India"} • IP: {dev.ipAddress || "103.21.244.18"}
                        </span>
                      </div>
                    </div>
                    {dev.currentSession ? (
                      <span className="gov-sess-status">Online Now</span>
                    ) : (
                      <button
                        type="button"
                        className="gov-revoke-btn"
                        onClick={() => handleRevokeDevice(dev.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="gov-modal-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="gov-btn-cancel"
                  onClick={() => setIsDevicesModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="gov-modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="gov-modal-container danger-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <div className="gov-modal-title-wrap">
                <AlertTriangle size={20} className="danger-modal-icon" />
                <h3>Delete Account</h3>
              </div>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gov-modal-body">
              <p className="gov-danger-desc">
                Are you sure you want to permanently delete your GovNotify account? This action will erase your user record, saved jobs, applied jobs, eligibility preferences, and session data from the MySQL database.
              </p>

              <div className="gov-modal-actions">
                <button
                  type="button"
                  className="gov-btn-cancel"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gov-btn-delete"
                  onClick={handleDeleteAccountConfirm}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMBEDDED DASHBOARD STYLES */}
      <style>{`
        .gov-settings-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          position: relative;
        }

        /* Toast */
        .gov-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #0f172a;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gov-toast .toast-icon {
          color: #10b981;
        }
        @keyframes toastSlideIn {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Hero Banner */
        .gov-settings-hero {
          background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
          color: #ffffff;
          padding: 36px 32px 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .gov-hero-container {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .gov-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
          margin-bottom: 12px;
          color: #a7f3d0;
        }
        .gov-hero-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .gov-hero-icon-box {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          color: #ffffff;
          flex-shrink: 0;
        }
        .gov-hero-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0;
          color: #ffffff;
        }
        .gov-hero-sub {
          font-size: 14px;
          color: #d1fae5;
          margin: 4px 0 0;
          max-width: 680px;
          line-height: 1.5;
        }
        .gov-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gov-back-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateX(-2px);
        }

        /* Body Container */
        .gov-settings-body {
          max-width: 1440px;
          margin: -24px auto 60px;
          padding: 0 32px;
        }

        /* 4 KPI Cards Grid */
        .gov-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 28px;
        }
        .gov-kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .gov-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.08);
        }
        .gov-kpi-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-green { background: #dcfce7; color: #15803d; }
        .kpi-blue { background: #e0f2fe; color: #0284c7; }
        .kpi-emerald { background: #d1fae5; color: #059669; }
        .kpi-purple { background: #f3e8ff; color: #9333ea; }

        .gov-kpi-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .gov-kpi-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gov-kpi-val-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gov-kpi-value {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
        }
        .gov-badge-verified {
          background: #dcfce7;
          color: #166534;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .gov-badge-shield {
          background: #d1fae5;
          color: #065f46;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .gov-kpi-hint {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 3-Column Layout */
        .gov-dashboard-columns {
          display: grid;
          grid-template-columns: 1fr 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        .gov-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Common Card Style */
        .gov-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.04);
        }
        .gov-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .gov-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .user-icon { background: #dbeafe; color: #1d4ed8; }
        .appearance-icon { background: #fef3c7; color: #b45309; }
        .notif-icon { background: #e0e7ff; color: #4338ca; }
        .device-icon { background: #f1f5f9; color: #475569; }
        .security-icon { background: #dcfce7; color: #15803d; }

        .gov-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .gov-card-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0;
        }

        /* Avatar Section */
        .gov-avatar-section {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          margin-bottom: 22px;
        }
        .gov-avatar-circle {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);
          flex-shrink: 0;
        }
        .gov-avatar-camera {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gov-avatar-camera:hover {
          background: #059669;
          color: #ffffff;
          border-color: #059669;
        }
        .gov-avatar-meta {
          min-width: 0;
        }
        .gov-avatar-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #0f172a;
        }
        .gov-avatar-email {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0;
          word-break: break-all;
        }
        .gov-avatar-role {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #047857;
          background: #d1fae5;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 4px;
        }

        /* Forms */
        .gov-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gov-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .gov-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .gov-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .gov-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .gov-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }
        .gov-input {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 42px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .gov-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }
        .gov-input-readonly {
          background: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
          padding-right: 80px;
          cursor: not-allowed;
        }
        .gov-verified-pill {
          position: absolute;
          right: 12px;
          background: #dcfce7;
          color: #166534;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .gov-field-note {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .gov-select {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .gov-select:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }
        .gov-input-wrapper .gov-select {
          padding-left: 42px;
        }
        .gov-eye-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        .gov-eye-btn:hover {
          color: #0f172a;
        }

        .gov-save-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.2s, transform 0.1s;
        }
        .gov-save-btn:hover:not(:disabled) {
          background: #047857;
        }
        .gov-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Appearance Tiles */
        .gov-appearance-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gov-theme-tiles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .gov-theme-tile {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .gov-theme-tile:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .gov-theme-tile.active {
          border-color: #059669;
          background: #f0fdf4;
        }
        .theme-preview-box {
          width: 44px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .light-preview { background: #f1f5f9; color: #0284c7; }
        .dark-preview { background: #1e293b; color: #f59e0b; }
        .system-preview { background: #e2e8f0; color: #64748b; }
        .theme-tile-text {
          display: flex;
          flex-direction: column;
        }
        .theme-tile-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .theme-tile-sub {
          font-size: 11px;
          color: #64748b;
        }
        .theme-check {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #059669;
        }

        /* Notification Toggles List */
        .gov-toggles-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gov-toggle-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .gov-toggle-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .gov-toggle-text {
          flex: 1;
        }
        .gov-toggle-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px;
        }
        .gov-toggle-desc {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }
        .gov-flex-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 3px;
        }
        .gov-badge-recommended {
          background: #fef3c7;
          color: #92400e;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* Switch Toggle Component */
        .gov-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .gov-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .gov-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: 0.25s;
          border-radius: 24px;
        }
        .gov-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.25s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .gov-switch input:checked + .gov-slider {
          background-color: #059669;
        }
        .gov-switch input:checked + .gov-slider:before {
          transform: translateX(20px);
        }

        /* Connected Devices */
        .gov-devices-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .gov-device-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .gov-device-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .active-device { background: #dcfce7; color: #166534; }
        .inactive-device { background: #e2e8f0; color: #475569; }
        .gov-device-details {
          flex: 1;
          min-width: 0;
        }
        .gov-device-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gov-device-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .gov-device-badge-active {
          background: #dcfce7;
          color: #15803d;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .gov-device-loc {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        .gov-device-footer {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
        }
        .gov-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #059669;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 0;
        }
        .gov-link-btn:hover {
          color: #047857;
          text-decoration: underline;
        }

        /* Quick Settings Column 3 */
        .gov-quick-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .gov-quick-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          gap: 12px;
        }
        .gov-quick-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .gov-item-mini-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .gov-quick-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .gov-quick-desc {
          font-size: 11.5px;
          color: #64748b;
          margin: 1px 0 0;
        }
        .gov-action-btn {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0f172a;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .gov-action-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .danger-item {
          background: #fff1f2;
          border-color: #fecdd3;
        }
        .danger-icon {
          background: #ffe4e6;
          border-color: #fda4af;
          color: #e11d48;
        }
        .danger-title {
          color: #be123c;
        }
        .gov-danger-btn {
          background: #ffffff;
          border: 1.5px solid #fda4af;
          color: #e11d48;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .gov-danger-btn:hover {
          background: #e11d48;
          color: #ffffff;
        }

        /* Support Card */
        .gov-support-card {
          background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
          border: 1.5px solid #bbf7d0;
          text-align: center;
        }
        .gov-support-header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gov-support-robot {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981, #047857);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .gov-support-title {
          font-size: 16px;
          font-weight: 800;
          color: #065f46;
          margin: 0 0 6px;
        }
        .gov-support-desc {
          font-size: 12.5px;
          color: #475569;
          margin: 0 0 16px;
          line-height: 1.45;
        }
        .gov-support-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gov-support-btn {
          width: 100%;
          height: 40px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gov-support-btn.primary {
          background: #059669;
          color: #ffffff;
          border: none;
        }
        .gov-support-btn.primary:hover {
          background: #047857;
        }
        .gov-support-btn.secondary {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0f172a;
        }
        .gov-support-btn.secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* Footer */
        .gov-settings-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 13px;
          color: #64748b;
        }
        .gov-footer-links {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gov-footer-links a {
          color: #059669;
          text-decoration: none;
          font-weight: 600;
        }
        .gov-footer-links a:hover {
          text-decoration: underline;
        }

        /* Modals */
        .gov-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 10000;
        }
        .gov-modal-container {
          background: #ffffff;
          border-radius: 18px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .gov-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .gov-modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gov-modal-title-wrap h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
        }
        .modal-title-icon { color: #059669; }
        .danger-modal-icon { color: #e11d48; }
        .gov-modal-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
        }
        .gov-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .gov-modal-form, .gov-modal-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .gov-modal-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gov-modal-success {
          background: #dcfce7;
          color: #166534;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gov-modal-desc {
          font-size: 13.5px;
          color: #64748b;
          margin: 0 0 10px;
          line-height: 1.5;
        }
        .gov-danger-desc {
          font-size: 14px;
          color: #334155;
          margin: 0 0 16px;
          line-height: 1.5;
        }
        .gov-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        .gov-btn-cancel {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0f172a;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .gov-btn-confirm {
          background: #059669;
          border: none;
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .gov-btn-delete {
          background: #e11d48;
          border: none;
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Sessions inside modal */
        .gov-devices-modal-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .gov-session-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }
        .gov-session-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gov-sess-icon {
          color: #059669;
        }
        .gov-sess-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gov-sess-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .gov-sess-tag-current {
          background: #dcfce7;
          color: #166534;
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .gov-sess-info {
          font-size: 11.5px;
          color: #64748b;
        }
        .gov-sess-status {
          font-size: 12px;
          font-weight: 600;
          color: #059669;
        }
        .gov-revoke-btn {
          background: #fee2e2;
          border: 1px solid #fecdd3;
          color: #b91c1c;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 1200px) {
          .gov-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .gov-dashboard-columns {
            grid-template-columns: 1fr 1fr;
          }
          .gov-dashboard-columns > .gov-column:last-child {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .gov-settings-hero {
            padding: 24px 16px 36px;
          }
          .gov-settings-body {
            padding: 0 16px;
            margin-top: -18px;
          }
          .gov-hero-title {
            font-size: 22px;
          }
          .gov-kpi-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .gov-dashboard-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .gov-dashboard-columns > .gov-column:last-child {
            grid-column: span 1;
          }
          .gov-form-row {
            grid-template-columns: 1fr;
          }
          .gov-theme-tiles {
            grid-template-columns: 1fr;
          }
          .gov-settings-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
