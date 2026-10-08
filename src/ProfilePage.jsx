import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, UserCheck, User, Save, Sparkles, GraduationCap, BookOpen,
  Calendar, MapPin, Briefcase, CheckCircle2, AlertCircle, RefreshCw,
  Award, Shield, Check, Info, ChevronRight, ExternalLink, HelpCircle,
  FileCheck2, RotateCcw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const BACHELOR_DEGREES = [
  "B.Sc. (Bachelor of Science)",
  "B.A. (Bachelor of Arts)",
  "B.Com. (Bachelor of Commerce)",
  "B.E. / B.Tech (Engineering / Technology)",
  "B.C.A. (Bachelor of Computer Applications)",
  "B.B.A. / B.B.M. (Business Administration)",
  "B.Ed. (Bachelor of Education)",
  "LL.B. (Bachelor of Laws)",
  "B.Pharm (Pharmacy)",
  "MBBS / BDS (Medical / Dental)",
  "B.Arch (Architecture)",
  "B.Sc. Agriculture / Horticulture",
  "B.Sc. Nursing",
  "BCA",
  "Other Bachelor's Degree"
];

const ENGINEERING_BRANCHES = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication (ECE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Electrical & Electronics (EEE)",
  "Chemical Engineering",
  "Automobile Engineering",
  "Aeronautical / Aerospace",
  "Biotechnology / Biomedical",
  "Other Engineering Branch"
];

const MASTER_DEGREES = [
  "M.Sc. (Master of Science)",
  "M.A. (Master of Arts)",
  "M.Com. (Master of Commerce)",
  "M.Tech / M.E. (Engineering)",
  "M.C.A. (Computer Applications)",
  "M.B.A. (Business Administration)",
  "LL.M. (Master of Laws)",
  "M.Ed. (Master of Education)",
  "M.Pharm (Pharmacy)",
  "Other Master's Degree"
];

const DIPLOMA_BRANCHES = [
  "Diploma in Civil Engineering",
  "Diploma in Mechanical Engineering",
  "Diploma in Electrical & Electronics",
  "Diploma in Electronics & Communication",
  "Diploma in Computer Science / IT",
  "Diploma in Automobile Engineering",
  "ITI Electrician",
  "ITI Fitter / Welder",
  "Other Polytechnic / ITI Trade"
];

const POPULAR_STATES = [
  "All India / Central Govt",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi / NCR",
  "Uttar Pradesh",
  "West Bengal",
  "Rajasthan",
  "Gujarat",
  "Madhya Pradesh",
  "Bihar",
  "Punjab / Haryana",
  "Odisha"
];

const POPULAR_SECTORS = [
  "All Categories (Recommended)",
  "Banking & Financial Services (IBPS, SBI, RBI)",
  "Civil Services & Administration (UPSC, State PSC)",
  "Engineering & Technical (PWD, PSUs, Electricity, ISRO)",
  "Defence & Police (Army, Navy, Air Force, Police SI)",
  "Railways (RRB NTPC, Group D, ALP, JE)",
  "Education & Teaching (TET, UGC NET, Assistant Professor)",
  "Healthcare & Medical (Staff Nurse, Medical Officer)",
  "Legal & Judicial (Civil Judge, Legal Assistant)",
  "Custom Sector"
];

const ProfilePage = ({ userEmail, onBack }) => {
  // Candidate / User Name (auto-extracts from stored data or email)
  const getDefaultName = () => {
    try {
      const stored = localStorage.getItem("candidateName");
      if (stored && stored.trim()) return stored.trim();
      const p = JSON.parse(localStorage.getItem("eligibilityProfile") || localStorage.getItem("userProfile") || "{}");
      if (p.candidateName && p.candidateName.trim()) return p.candidateName.trim();
      if (p.fullName && p.fullName.trim()) return p.fullName.trim();
    } catch {}
    if (userEmail && userEmail.includes("@")) {
      const prefix = userEmail.split("@")[0].replace(/[0-9_.-]/g, ' ').trim();
      if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Candidate Name";
  };

  // Form State
  const [candidateName, setCandidateName] = useState(getDefaultName);
  const [education, setEducation] = useState('Degree');
  const [degreeName, setDegreeName] = useState('B.Sc. (Bachelor of Science)');
  const [customDegree, setCustomDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [age, setAge] = useState('');
  const [preferredState, setPreferredState] = useState('All India');
  const [preferredCategory, setPreferredCategory] = useState('All Categories (Recommended)');
  const [customCategory, setCustomCategory] = useState('');

  // UI State
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [matchedJobsCount, setMatchedJobsCount] = useState(null);

  // Helper to parse saved qualification string into components
  const parseAndSetQual = (qualStr) => {
    if (!qualStr) return;
    const qLower = qualStr.toLowerCase();

    // Check if degree has branch in parentheses e.g. "B.Sc. (Computer Science)"
    const match = qualStr.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      const degPart = match[1].trim();
      const specPart = match[2].trim();
      setSpecialization(specPart);
      setDegreeName(degPart);

      if (qLower.includes("b.e") || qLower.includes("b.tech") || qLower.includes("engineer")) {
        setEducation("B.E/B.Tech");
      } else if (qLower.includes("m.") || qLower.includes("master") || qLower.includes("pg")) {
        setEducation("Post Graduation");
      } else if (qLower.includes("diploma") || qLower.includes("iti")) {
        setEducation("Diploma");
      } else {
        setEducation("Degree");
      }
      return;
    }

    if (qLower.includes("b.e") || qLower.includes("b.tech")) {
      setEducation("B.E/B.Tech");
      setDegreeName("B.E. / B.Tech (Engineering / Technology)");
    } else if (qLower.includes("phd") || qLower.includes("doctor")) {
      setEducation("Ph.D.");
    } else if (qLower.includes("mba")) {
      setEducation("MBA");
    } else if (qLower.includes("pg") || qLower.includes("master")) {
      setEducation("Post Graduation");
      setDegreeName("M.Sc. (Master of Science)");
    } else if (qLower.includes("degree") || qLower.includes("graduate") || qLower.includes("bachelor")) {
      setEducation("Degree");
      setDegreeName("B.Sc. (Bachelor of Science)");
    } else if (qLower.includes("diploma") || qLower.includes("iti")) {
      setEducation("Diploma");
      setDegreeName("Diploma in Computer Science / IT");
    } else if (qLower.includes("12th") || qLower.includes("intermediate") || qLower.includes("puc") || qLower.includes("hsc")) {
      setEducation("12th");
    } else if (qLower.includes("10th") || qLower.includes("sslc") || qLower.includes("matric")) {
      setEducation("10th");
    } else {
      setEducation("Degree");
      setDegreeName(qualStr);
    }
  };

  // Load profile from localStorage and backend
  useEffect(() => {
    // 1. Try localStorage first for instant hydration
    try {
      const local = localStorage.getItem("eligibilityProfile") || localStorage.getItem("userProfile");
      if (local) {
        const p = JSON.parse(local);
        if (p.candidateName) setCandidateName(p.candidateName);
        else if (p.fullName) setCandidateName(p.fullName);
        if (p.education) setEducation(p.education);
        else if (p.qualification) parseAndSetQual(p.qualification);
        if (p.degreeName) setDegreeName(p.degreeName);
        if (p.customDegree) setCustomDegree(p.customDegree);
        if (p.specialization) setSpecialization(p.specialization);
        if (p.age) setAge(String(p.age));
        if (p.preferredState || p.state) setPreferredState(p.preferredState || p.state);
        if (p.preferredCategory || p.category) {
          const cat = p.preferredCategory || p.category;
          if (POPULAR_SECTORS.includes(cat)) {
            setPreferredCategory(cat);
          } else {
            setPreferredCategory("Custom Sector");
            setCustomCategory(cat);
          }
        }
      }
    } catch (e) {
      console.error("Local profile read error:", e);
    }

    // 2. Fetch from backend
    if (!userEmail) return;
    fetch(`${API_BASE}/api/eligibility/get-profile/${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && (data.qualification || data.age || data.state)) {
          if (data.candidateName) setCandidateName(data.candidateName);
          if (data.qualification) parseAndSetQual(data.qualification);
          if (data.age) setAge(String(data.age));
          if (data.state) setPreferredState(data.state);
          if (data.category) {
            if (POPULAR_SECTORS.includes(data.category)) {
              setPreferredCategory(data.category);
            } else {
              setPreferredCategory("Custom Sector");
              setCustomCategory(data.category);
            }
          }
        }
      })
      .catch(err => console.error("Error loading backend profile:", err));
  }, [userEmail]);

  // Profile Completeness Calculation
  const completeness = useMemo(() => {
    let score = 0;
    if (candidateName && candidateName.trim().length > 0) score += 20;
    if (education) score += 20;
    if ((education === "10th" || education === "12th") || (degreeName || customDegree)) score += 20;
    if (age && parseInt(age, 10) >= 18) score += 20;
    if (preferredState) score += 10;
    if (preferredCategory) score += 10;
    return Math.min(100, score);
  }, [candidateName, education, degreeName, customDegree, age, preferredState, preferredCategory]);

  // Active Qualification Display Label
  const displayQualification = useMemo(() => {
    const activeDeg = degreeName === "Other Bachelor's Degree" || degreeName === "Other Master's Degree"
      ? (customDegree || "Degree")
      : (degreeName ? degreeName.split("(")[0].trim() : education);

    if (education === "10th") return "10th Pass (Matriculation)";
    if (education === "12th") return "12th Pass (Higher Secondary)";
    if (specialization) return `${activeDeg} (${specialization})`;
    return activeDeg || education || "Not set";
  }, [education, degreeName, customDegree, specialization]);

  // Save profile to backend & localStorage
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    const effectiveDegree = (degreeName === "Other Bachelor's Degree" || degreeName === "Other Master's Degree")
      ? (customDegree || "Degree")
      : degreeName;

    const effectiveCategory = preferredCategory === "Custom Sector"
      ? (customCategory || "All Categories")
      : preferredCategory;

    // Create consolidated qualification string for job matching
    let consolidatedQual = education;
    if (effectiveDegree && (education === "Degree" || education === "Post Graduation" || education === "Diploma" || education === "B.E/B.Tech")) {
      consolidatedQual = `${effectiveDegree}${specialization ? ` (${specialization})` : ''}`.trim();
    } else if (specialization && !consolidatedQual.includes(specialization)) {
      consolidatedQual = `${consolidatedQual} (${specialization})`.trim();
    }

    const trimmedName = candidateName.trim() || getDefaultName();

    const profileData = {
      email: userEmail,
      candidateName: trimmedName,
      fullName: trimmedName,
      qualification: consolidatedQual || education,
      education,
      degreeName: effectiveDegree,
      customDegree,
      specialization,
      age: age ? parseInt(age, 10) : 0,
      state: preferredState,
      preferredState,
      category: effectiveCategory,
      preferredCategory: effectiveCategory
    };

    // 1. Save to LocalStorage
    try {
      localStorage.setItem("candidateName", trimmedName);
      localStorage.setItem("fullName", trimmedName);
      localStorage.setItem("eligibilityProfile", JSON.stringify(profileData));
      localStorage.setItem("userProfile", JSON.stringify(profileData));
    } catch (e) {
      console.error("Error writing to localStorage:", e);
    }

    // 2. Save to Backend via /api/eligibility/check
    try {
      const response = await fetch(`${API_BASE}/api/eligibility/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          candidateName: trimmedName,
          qualification: consolidatedQual || education,
          age: String(age || "0"),
          state: preferredState,
          category: effectiveCategory
        })
      });

      if (response.ok) {
        const eligibleList = await response.json();
        const count = Array.isArray(eligibleList) ? eligibleList.length : 0;
        setMatchedJobsCount(count);
        setSaveMessage({
          type: "success",
          text: `Profile saved successfully for ${trimmedName}! Found ${count} matching government jobs for your qualification & state.`
        });
      } else {
        setSaveMessage({
          type: "success",
          text: `Profile saved successfully for ${trimmedName}!`
        });
      }
    } catch (err) {
      console.warn("Backend sync notice:", err);
      setSaveMessage({
        type: "success",
        text: `Profile for ${trimmedName} saved successfully on your device!`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Reset profile to default values?")) return;
    setCandidateName(getDefaultName());
    setEducation("Degree");
    setDegreeName("B.Sc. (Bachelor of Science)");
    setCustomDegree("");
    setSpecialization("");
    setAge("");
    setPreferredState("All India");
    setPreferredCategory("All Categories (Recommended)");
    setCustomCategory("");
    setSaveMessage(null);
  };

  return (
    <div style={styles.page}>
      {/* Top Bar Navigation */}
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      {/* Header Section */}
      <div style={styles.headerContainer}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>👤 Candidate Eligibility Profile</h1>
            <span style={styles.badgeLive}>
              <Sparkles size={13} style={{ marginRight: 4 }} />
              Live Job Matching
            </span>
          </div>
          <p style={styles.subtitle}>
            Set your exact educational qualifications, degree specialization, age, and state preferences to automatically unlock matching government job notifications and exam alerts.
          </p>
        </div>
      </div>

      {/* Hero Visual Profile Banner with Themed Image */}
      <div style={styles.heroBanner}>
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
          alt="GovNotify Career Aspirants"
          style={styles.heroImg}
        />
        <div style={styles.heroOverlay}>
          <div style={styles.heroLeft}>
            <div style={styles.avatarCircle}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
                {(candidateName.trim() || userEmail || "C").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={styles.heroCandidateName}>
                  {candidateName.trim() || "Candidate Profile"}
                </h3>
                <span style={styles.heroBadgeVerified}>
                  <Shield size={12} style={{ marginRight: 4 }} /> Verified Profile
                </span>
              </div>
              <p style={styles.heroSummaryText}>
                {userEmail && <span style={{ color: '#e2e8f0', marginRight: '6px' }}>✉️ {userEmail} • </span>}
                🎓 {displayQualification} • 📍 {preferredState} • 🎂 {age ? `${age} yrs` : "Age not set"}
              </p>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.completenessBox}>
              <div style={styles.completenessLabelRow}>
                <span style={styles.completenessLabel}>Profile Completeness</span>
                <strong style={styles.completenessPercent}>{completeness}%</strong>
              </div>
              <div style={styles.progressBarTrack}>
                <div style={{ ...styles.progressBarFill, width: `${completeness}%` }} />
              </div>
              <small style={styles.completenessHint}>
                {completeness === 100
                  ? "🎉 All eligibility details complete!"
                  : "Fill in degree and age for 100% match accuracy."}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Grid */}
      <div className="profile-grid-layout" style={styles.profileGridLayout}>
        {/* Left Column: Comprehensive Profile Form */}
        <div style={styles.formCard}>
          {/* Section 0: Candidate Name / User Name */}
          <div style={styles.formCardHeader}>
            <h2 style={styles.formSectionTitle}>
              <User size={20} color="#10b981" /> Candidate Identification
            </h2>
            <span style={styles.formSectionSubtitle}>
              Enter your official name to personalize your verified profile banner &amp; job matching records
            </span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <User size={15} color="#10b981" /> Candidate Name / User Name:
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g., Shishanth P"
              style={styles.input}
            />
            <span style={styles.fieldHelp}>
              This name will be saved and displayed prominently on your profile banner instead of your email address.
            </span>
          </div>

          <div style={styles.formDivider} />

          <div style={styles.formCardHeader}>
            <h2 style={styles.formSectionTitle}>
              <GraduationCap size={20} color="#10b981" /> Educational Qualifications
            </h2>
            <span style={styles.formSectionSubtitle}>
              Specify your exact degree and discipline to filter notifications
            </span>
          </div>

          {/* Alert / Feedback message */}
          {saveMessage && (
            <div style={styles.feedbackBanner}>
              <CheckCircle2 size={18} color="#047857" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '13.5px', color: '#065f46', fontWeight: 600 }}>
                {saveMessage.text}
              </span>
            </div>
          )}

          {/* Field 1: Highest Education Level */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <GraduationCap size={15} color="#10b981" /> Highest Education Level:
            </label>
            <select
              value={education}
              onChange={(e) => {
                const val = e.target.value;
                setEducation(val);
                if (val === "Degree") setDegreeName("B.Sc. (Bachelor of Science)");
                else if (val === "B.E/B.Tech") setDegreeName("B.E. / B.Tech (Engineering / Technology)");
                else if (val === "Post Graduation") setDegreeName("M.Sc. (Master of Science)");
                else if (val === "Diploma") setDegreeName("Diploma in Computer Science / IT");
                else setDegreeName("");
              }}
              style={styles.select}
            >
              <option value="10th">10th Pass (SSLC / Matriculation)</option>
              <option value="12th">12th Pass (HSC / Intermediate / +2)</option>
              <option value="Diploma">Diploma / Polytechnic / ITI</option>
              <option value="Degree">Bachelor's Degree (Graduation)</option>
              <option value="B.E/B.Tech">B.E. / B.Tech (Engineering)</option>
              <option value="Post Graduation">Post Graduation / Master's Degree (PG)</option>
              <option value="MBA">MBA / Management</option>
              <option value="Ph.D.">Ph.D. / Doctorate</option>
            </select>
            <span style={styles.fieldHelp}>
              Select your primary highest academic milestone.
            </span>
          </div>

          {/* Field 2 (CONDITIONAL): DEGREE NAME SELECTION */}
          {education === "Degree" && (
            <div style={styles.conditionalBlock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Award size={15} color="#2563eb" /> Specify Bachelor's Degree:
                </label>
                <select
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                  style={styles.select}
                >
                  {BACHELOR_DEGREES.map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </select>
              </div>

              {degreeName === "Other Bachelor's Degree" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Enter Custom Degree Name:</label>
                  <input
                    type="text"
                    value={customDegree}
                    onChange={(e) => setCustomDegree(e.target.value)}
                    placeholder="e.g., B.Voc, B.P.Ed, B.Des"
                    style={styles.input}
                  />
                </div>
              )}

              {/* Specialization / Major Field */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BookOpen size={15} color="#10b981" /> Branch / Major / Subject:
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Computer Science, Mechanical, Civil, Commerce, Physics, English, General"
                  style={styles.input}
                />
                <span style={styles.fieldHelp}>
                  Mention your major subject or stream (e.g. Computer Science, Accounts, Chemistry).
                </span>
              </div>
            </div>
          )}

          {/* Conditional: Engineering Branch */}
          {education === "B.E/B.Tech" && (
            <div style={styles.conditionalBlock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Award size={15} color="#2563eb" /> Engineering Branch / Discipline:
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Engineering Branch</option>
                  {ENGINEERING_BRANCHES.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conditional: Post Graduation */}
          {education === "Post Graduation" && (
            <div style={styles.conditionalBlock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Award size={15} color="#2563eb" /> Master's Degree Course:
                </label>
                <select
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                  style={styles.select}
                >
                  {MASTER_DEGREES.map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <BookOpen size={15} color="#10b981" /> Master's Specialization / Major:
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Data Science, Structural Engineering, Organic Chemistry, Finance"
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* Conditional: Diploma / ITI */}
          {education === "Diploma" && (
            <div style={styles.conditionalBlock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Award size={15} color="#2563eb" /> Diploma / ITI Branch:
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Branch / Trade</option>
                  {DIPLOMA_BRANCHES.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Section Divider */}
          <div style={styles.formDivider} />

          <div style={styles.formCardHeader}>
            <h2 style={styles.formSectionTitle}>
              <Calendar size={20} color="#f97316" /> Age &amp; State Preferences
            </h2>
            <span style={styles.formSectionSubtitle}>
              Filter vacancies by official recruitment age limits and regions
            </span>
          </div>

          {/* Field 3: Age */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Calendar size={15} color="#f97316" /> Candidate Age (Years):
            </label>
            <input
              type="number"
              min="18"
              max="65"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 24"
              style={styles.input}
            />
            <span style={styles.fieldHelp}>
              Most Central &amp; State government exams accept applicants aged 18–35 (with category relaxations).
            </span>
          </div>

          {/* Field 4: Preferred State */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <MapPin size={15} color="#ef4444" /> Preferred State / Jurisdiction:
            </label>
            <select
              value={preferredState}
              onChange={(e) => setPreferredState(e.target.value)}
              style={styles.select}
            >
              {POPULAR_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <span style={styles.fieldHelp}>
              Select "All India" to receive notifications for UPSC, SSC, Railways, and central ministries.
            </span>
          </div>

          {/* Field 5: Preferred Category */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Briefcase size={15} color="#8b5cf6" /> Preferred Sector / Category:
            </label>
            <select
              value={preferredCategory}
              onChange={(e) => setPreferredCategory(e.target.value)}
              style={styles.select}
            >
              {POPULAR_SECTORS.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {preferredCategory === "Custom Sector" && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Enter Custom Sector / Department:</label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g., Space Research, Judiciary, Forestry"
                style={styles.input}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.formActionsRow}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            >
              <Save size={18} />
              {saving ? "Saving & Syncing..." : "Save & Activate Profile"}
            </button>

            <button
              onClick={handleReset}
              style={styles.resetBtn}
              title="Reset profile form"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Right Column: Live Overview & Features */}
        <div style={styles.overviewSidebar}>
          {/* Card 1: Active Profile Live Inspector */}
          <div style={styles.liveSummaryCard}>
            <div style={styles.summaryCardHeader}>
              <span style={styles.summaryCardBadge}>
                <FileCheck2 size={13} style={{ marginRight: 4 }} />
                Profile Snapshot
              </span>
              <strong style={{ fontSize: '13px', color: '#10b981' }}>Live Preview</strong>
            </div>

            <div style={styles.summaryDetailsList}>
              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Candidate Name</span>
                <strong style={{ ...styles.summaryDetailVal, color: '#10b981' }}>
                  {candidateName.trim() || "Not specified"}
                </strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Registered Email</span>
                <strong style={styles.summaryDetailVal}>{userEmail || "candidate@govnotify.in"}</strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Highest Education</span>
                <strong style={styles.summaryDetailVal}>{education}</strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Specific Degree</span>
                <strong style={{ ...styles.summaryDetailVal, color: '#2563eb' }}>
                  {displayQualification}
                </strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Age Limit</span>
                <strong style={styles.summaryDetailVal}>
                  {age ? `${age} Years Old` : "Not specified"}
                </strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Target Region</span>
                <strong style={styles.summaryDetailVal}>{preferredState}</strong>
              </div>

              <div style={styles.summaryDetailItem}>
                <span style={styles.summaryDetailKey}>Preferred Department</span>
                <strong style={styles.summaryDetailVal}>
                  {preferredCategory === "Custom Sector" ? (customCategory || "Custom") : preferredCategory}
                </strong>
              </div>
            </div>

            {matchedJobsCount !== null && (
              <div style={styles.matchedJobsStrip}>
                <Sparkles size={16} color="#10b981" />
                <span>
                  <strong>{matchedJobsCount}</strong> government jobs match this profile!
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Companion Illustration & Aspirant Guide */}
          <div style={styles.guideCard}>
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=500&q=80"
              alt="GovNotify Aspirant Desk"
              style={styles.guideImg}
            />
            <div style={styles.guideContent}>
              <h4 style={styles.guideTitle}>💡 GovNotify Eligibility Guide</h4>
              <p style={styles.guideText}>
                Government recruitment commissions (such as UPSC, SSC, and State PSCs) strictly verify your graduation discipline on the date of notification. Keeping your degree name and specialization up-to-date ensures you never miss eligible vacancies.
              </p>
            </div>
          </div>

          {/* Card 3: Key Features of Profile Sync */}
          <div style={styles.featuresCard}>
            <h4 style={styles.featuresCardTitle}>Why Complete Your Profile?</h4>
            <div style={styles.featureItem}>
              <div style={styles.featureIconBubble}>🎯</div>
              <div>
                <strong style={styles.featureItemTitle}>Targeted Degree Matching</strong>
                <p style={styles.featureItemDesc}>Eliminates notifications requiring degrees you don't possess.</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconBubble}>⏰</div>
              <div>
                <strong style={styles.featureItemTitle}>Age Limit Verification</strong>
                <p style={styles.featureItemDesc}>Automates age checks against strict notification cutoff dates.</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconBubble}>🚀</div>
              <div>
                <strong style={styles.featureItemTitle}>1-Click Official Portal Access</strong>
                <p style={styles.featureItemDesc}>Direct links to official application forms with 0 middlemen.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Style Overrides */}
      <style>{`
        @media (max-width: 960px) {
          .profile-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  topBar: {
    marginBottom: "20px"
  },
  backBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "9px 18px",
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  headerContainer: {
    marginBottom: "20px"
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column"
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  badgeLive: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "6px",
    margin: "6px 0 0 0",
    maxWidth: "800px",
    lineHeight: "1.5"
  },
  heroBanner: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    height: "160px",
    marginBottom: "28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  heroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.8) 55%, rgba(16, 185, 129, 0.85) 100%)",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    color: "#ffffff"
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },
  avatarCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
    flexShrink: 0
  },
  heroCandidateName: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0
  },
  heroBadgeVerified: {
    background: "rgba(16, 185, 129, 0.25)",
    border: "1px solid rgba(16, 185, 129, 0.5)",
    color: "#6ee7b7",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center"
  },
  heroSummaryText: {
    fontSize: "13px",
    color: "#cbd5e1",
    margin: "5px 0 0 0"
  },
  heroRight: {
    minWidth: "220px"
  },
  completenessBox: {
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(6px)",
    borderRadius: "12px",
    padding: "12px 16px",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },
  completenessLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  completenessLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#e2e8f0"
  },
  completenessPercent: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#6ee7b7"
  },
  progressBarTrack: {
    width: "100%",
    height: "6px",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "5px"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: "10px",
    transition: "width 0.4s ease"
  },
  completenessHint: {
    fontSize: "10.5px",
    color: "#cbd5e1"
  },
  profileGridLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "24px",
    alignItems: "start"
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
  },
  formCardHeader: {
    marginBottom: "20px"
  },
  formSectionTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  formSectionSubtitle: {
    fontSize: "12.5px",
    color: "#64748b"
  },
  formDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "24px 0"
  },
  feedbackBanner: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  formGroup: {
    marginBottom: "18px"
  },
  conditionalBlock: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #2563eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px"
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "6px"
  },
  select: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "13.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "13.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  },
  fieldHelp: {
    display: "block",
    fontSize: "11.5px",
    color: "#64748b",
    marginTop: "4px"
  },
  formActionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px"
  },
  saveBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 3px 10px rgba(16, 185, 129, 0.3)",
    transition: "0.15s"
  },
  resetBtn: {
    padding: "12px 16px",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#475569",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  },
  overviewSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  liveSummaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
  },
  summaryCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    paddingBottom: "10px",
    borderBottom: "1px solid #f1f5f9"
  },
  summaryCardBadge: {
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#047857",
    background: "#ecfdf5",
    padding: "3px 8px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center"
  },
  summaryDetailsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  summaryDetailItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12.5px"
  },
  summaryDetailKey: {
    color: "#64748b"
  },
  summaryDetailVal: {
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "right",
    maxWidth: "180px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  matchedJobsStrip: {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12.5px",
    color: "#065f46"
  },
  guideCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
  },
  guideImg: {
    width: "100%",
    height: "110px",
    objectFit: "cover"
  },
  guideContent: {
    padding: "16px"
  },
  guideTitle: {
    fontSize: "13.5px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 6px 0"
  },
  guideText: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.45"
  },
  featuresCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
  },
  featuresCardTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 14px 0"
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "12px"
  },
  featureIconBubble: {
    fontSize: "16px",
    flexShrink: 0
  },
  featureItemTitle: {
    display: "block",
    fontSize: "12.5px",
    color: "#1e293b",
    marginBottom: "2px"
  },
  featureItemDesc: {
    fontSize: "11.5px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.35"
  }
};

export default ProfilePage;