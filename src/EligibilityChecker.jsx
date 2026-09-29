import { useState, useMemo } from "react";
import {
  FileText,
  User,
  MapPin,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Heart,
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Calendar,
  RotateCcw
} from "lucide-react";
import JobLogo from "./JobLogo";

/**
 * Strict Qualification Mapping and Hierarchy Level Assignment.
 * Level 1: 10th / SSLC / Matriculation / Secondary School / Entry-level roles
 * Level 2: 12th / HSC / PUC / Intermediate / 10+2 / Clerical & Assistant posts
 * Level 3: Diploma / ITI / Polytechnic / Technical certificates
 * Level 4: Degree / Graduate / Bachelor (B.Com, B.Sc, B.A, BCA, BBA, Officers, Inspectors)
 * Level 5: Engineering / B.E / B.Tech / Technical Officers
 * Level 6: Post Graduate / Masters / MBA / MCA / M.Tech / M.Sc / M.Com / Faculty
 * Level 7: PhD / Doctorate
 */
function getQualificationLevel(text) {
  if (!text) return 0;
  const t = String(text).toLowerCase();

  // Level 7: PhD / Doctorate
  if (t.includes("phd") || t.includes("doctorate") || t.includes("ph.d")) return 7;

  // Level 6: Post Graduate / Masters / MBA / MCA / M.Tech / M.Sc / M.Com
  if (
    t.includes("pg") ||
    t.includes("post graduate") ||
    t.includes("post-graduate") ||
    t.includes("postgraduate") ||
    t.includes("master") ||
    t.includes("m.sc") ||
    t.includes("m.com") ||
    t.includes("m.a") ||
    t.includes("mba") ||
    t.includes("m.tech") ||
    t.includes("mca") ||
    t.includes("professor") ||
    t.includes("faculty")
  ) {
    return 6;
  }

  // Level 5: Engineering / B.E / B.Tech
  if (
    t.includes("b.e") ||
    t.includes("b.tech") ||
    t.includes("btech") ||
    t.includes("engineering") ||
    t.includes("engineer")
  ) {
    return 5;
  }

  // Level 4: Bachelor Degree / Graduate (B.Com, B.Sc, B.A, BCA, BBA, Officers, Inspectors)
  if (
    t.includes("degree") ||
    t.includes("graduate") ||
    t.includes("graduation") ||
    t.includes("bachelor") ||
    t.includes("b.com") ||
    t.includes("bcom") ||
    t.includes("b.sc") ||
    t.includes("bsc") ||
    t.includes("b.a") ||
    t.includes("ba ") ||
    t.includes("bca") ||
    t.includes("bba") ||
    t.includes("officer") ||
    t.includes("inspector") ||
    t.includes("probationer") ||
    t.includes("civil services")
  ) {
    return 4;
  }

  // Level 3: Diploma / ITI / Polytechnic / Technical Certificate
  if (
    t.includes("diploma") ||
    t.includes("iti") ||
    t.includes("polytechnic") ||
    t.includes("technician")
  ) {
    return 3;
  }

  // Level 2: 12th Pass / Higher Secondary / Intermediate / PUC / 10+2 / Clerks
  if (
    t.includes("12th") ||
    t.includes("puc") ||
    t.includes("hsc") ||
    t.includes("intermediate") ||
    t.includes("10+2") ||
    t.includes("+2") ||
    t.includes("clerk") ||
    t.includes("typist") ||
    t.includes("assistant")
  ) {
    return 2;
  }

  // Level 1: 10th Pass / SSLC / Matriculation / Secondary School / Group D / Constable
  if (
    t.includes("10th") ||
    t.includes("sslc") ||
    t.includes("matric") ||
    t.includes("matriculation") ||
    t.includes("high school") ||
    t.includes("constable") ||
    t.includes("group d") ||
    t.includes("driver") ||
    t.includes("mts") ||
    t.includes("multi tasking") ||
    t.includes("attendant") ||
    t.includes("peon")
  ) {
    return 1;
  }

  return 0;
}

/**
 * Safely parses the minimum and maximum age requirements from job data.
 * Checks job.ageLimit (e.g. "18-27", "18–27", "18 to 30", "18+", "Minimum 18 years, Maximum 35 years").
 * In Indian government service, minimum recruitment age is legally 18 years (21 for gazetted/degree posts).
 */
function getJobAgeRange(job, jobQualLevel) {
  let minAge = 18;
  let maxAge = 35;

  if (jobQualLevel >= 4) {
    minAge = 21; // Degree / Officer / Gazetted roles require minimum age of 21
    maxAge = 35;
  }

  const t = (job.title || "").toLowerCase();
  if (t.includes("constable") || t.includes("police")) {
    minAge = 18;
    maxAge = 28;
  } else if (t.includes("sub-inspector")) {
    minAge = 20;
    maxAge = 30;
  } else if (t.includes("forest watcher") || t.includes("group d") || t.includes("mts")) {
    minAge = 18;
    maxAge = 27;
  } else if (t.includes("probationer") || t.includes("civil services")) {
    minAge = 21;
    maxAge = 35;
  } else if (t.includes("professor") || t.includes("faculty")) {
    minAge = 22;
    maxAge = 45;
  }

  // Parse explicit job.ageLimit field if provided
  if (job.ageLimit && typeof job.ageLimit === "string") {
    const s = job.ageLimit.trim();
    const range = s.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})/i);
    if (range) {
      const pMin = parseInt(range[1], 10);
      const pMax = parseInt(range[2], 10);
      if (!isNaN(pMin) && pMin >= 14 && pMin <= 65) minAge = pMin;
      if (!isNaN(pMax) && pMax >= pMin && pMax <= 65) maxAge = pMax;
    } else {
      const minMatch = s.match(/(?:min(?:imum)?|above|\+)\s*(\d{1,2})|(\d{1,2})\s*\+/i);
      if (minMatch) {
        const val = parseInt(minMatch[1] || minMatch[2], 10);
        if (!isNaN(val)) minAge = val;
      }
      const maxMatch = s.match(/(?:max(?:imum)?|upto|up to|below)\s*(\d{1,2})/i);
      if (maxMatch) {
        const val = parseInt(maxMatch[1], 10);
        if (!isNaN(val)) maxAge = val;
      }
    }
  }

  return { minAge, maxAge };
}

/**
 * Strict Multi-Criteria Eligibility Evaluator.
 * Enforces AND condition:
 * Status Valid AND Qualification Valid AND Age Valid AND State Valid AND Category Valid.
 * Never assumes eligibility; disqualifies any candidate failing even one mandatory condition.
 */
function evaluateEligibility(job, { qualification, age, state, category }) {
  // 1. Status & Deadline Check: Do not include Closed or expired jobs
  const status = (job.status || "OPEN").toUpperCase();
  if (status === "CLOSED" || status === "EXPIRED") {
    return { eligible: false, reason: "Application period is closed" };
  }
  if (job.lastDate) {
    const last = new Date(job.lastDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(last.getTime()) && last < today) {
      return { eligible: false, reason: "Application deadline has expired" };
    }
  }

  // 2. Qualification Check (Strict education hierarchy)
  const userLvl = getQualificationLevel(qualification);
  const jobQualText = (job.qualification && String(job.qualification).trim())
    ? String(job.qualification).trim()
    : (job.title || "");
  const jobLvl = getQualificationLevel(jobQualText);

  if (jobLvl === 0) {
    return { eligible: false, reason: "Qualification criteria undefined or unverified" };
  }

  // User qualification must meet or exceed the required level
  if (userLvl < jobLvl) {
    return { eligible: false, reason: `Requires higher qualification (${jobQualText})` };
  }

  // For Degree, do not show 10th-only/12th-only posts unless specified
  if (userLvl >= 4 && jobLvl < 4) {
    return { eligible: false, reason: "Sub-degree entry-level vacancy" };
  }

  // 3. Age Validation (Hard Requirement: userAge >= minAge && userAge <= maxAge)
  const userAgeNum = parseInt(age, 10);
  if (!isNaN(userAgeNum) && userAgeNum > 0) {
    const { minAge, maxAge } = getJobAgeRange(job, jobLvl);
    if (userAgeNum < minAge) {
      return { eligible: false, reason: `Underage: Requires minimum age ${minAge} (User is ${userAgeNum})` };
    }
    if (userAgeNum > maxAge) {
      return { eligible: false, reason: `Overage: Maximum permitted age is ${maxAge} (User is ${userAgeNum})` };
    }
  } else if (age && String(age).trim() !== "") {
    // Malformed age entered
    return { eligible: false, reason: "Invalid age format" };
  }

  // 4. State Validation
  if (state && state !== "All") {
    const jState = (job.state || "").toLowerCase();
    const uState = state.toLowerCase();
    const isNational =
      jState.includes("all india") ||
      jState.includes("all-india") ||
      jState.includes("national") ||
      jState.includes("all states") ||
      jState.includes("central");

    if (!isNational && !jState.includes(uState)) {
      return { eligible: false, reason: `Restricted to ${job.state || "other state"} domicile` };
    }
  }

  // 5. Category Validation
  if (category && category !== "All") {
    const jCat = (job.category || "").toLowerCase();
    const uCat = category.toLowerCase();
    if (
      jCat &&
      !jCat.includes("government") &&
      !jCat.includes("all") &&
      !jCat.includes(uCat)
    ) {
      return { eligible: false, reason: "Reserved for other category quotas" };
    }
  }

  return { eligible: true };
}

/**
 * Filters a list of jobs strictly using complete multi-criteria validation.
 */
function filterJobsStrict(jobsList, criteria) {
  if (!Array.isArray(jobsList)) return [];
  return jobsList.filter((job) => evaluateEligibility(job, criteria).eligible);
}

const EligibilityChecker = ({ userEmail, onBack, onCheck }) => {
  const [qualification, setQualification] = useState(() => {
    try {
      const saved = localStorage.getItem("eligibilityProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.qualification) return p.qualification;
      }
    } catch {}
    return "Degree";
  });
  const [age, setAge] = useState(() => {
    try {
      const saved = localStorage.getItem("eligibilityProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.age !== undefined && p.age !== null) return String(p.age);
      }
    } catch {}
    return "";
  });
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem("eligibilityProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.state) return p.state;
      }
    } catch {}
    return "All";
  });
  const [category, setCategory] = useState(() => {
    try {
      const saved = localStorage.getItem("eligibilityProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.category) return p.category;
      }
    } catch {}
    return "All";
  });
  // Raw dataset received from backend (contains scraped and registered jobs)
  const [rawJobs, setRawJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // Strict client-side filtered array:
  // Dynamically recalculates whenever user selects or types a different qualification, age, state, or category.
  // Instant re-rendering with strict AND condition across all parameters.
  const eligibleJobs = useMemo(() => {
    return filterJobsStrict(rawJobs, { qualification, age, state, category });
  }, [rawJobs, qualification, age, state, category]);

  const handleCheck = () => {
    setLoading(true);
    fetch('http://localhost:8080/api/eligibility/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, qualification, age, state, category })
    })
      .then(res => {
        if (!res.ok) {
          return fetch('http://localhost:8080/api/jobs/all').then(r => r.json());
        }
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setRawJobs(list);
        setChecked(true);
        setLoading(false);
        const filtered = filterJobsStrict(list, { qualification, age, state, category });
        if (onCheck) {
          onCheck({ qualification, age, state, category, jobs: filtered });
        }
      })
      .catch(err => {
        console.error(err);
        fetch('http://localhost:8080/api/jobs/all')
          .then(r => r.json())
          .then(fallbackList => {
            const list = Array.isArray(fallbackList) ? fallbackList : [];
            setRawJobs(list);
            setChecked(true);
            setLoading(false);
            const filtered = filterJobsStrict(list, { qualification, age, state, category });
            if (onCheck) {
              onCheck({ qualification, age, state, category, jobs: filtered });
            }
          })
          .catch(() => setLoading(false));
      });
  };

  const handleClear = () => {
    setQualification("Degree");
    setAge("");
    setState("All");
    setCategory("All");
    setRawJobs([]);
    setChecked(false);
    try {
      localStorage.removeItem("eligibilityProfile");
    } catch (e) {
      console.error("Error removing eligibilityProfile:", e);
    }
  };

  return (
    <div style={styles.pageRoot}>
      <style>{`
        .eligibility-clear-btn {
          background: #ffffff;
          color: #64748b;
          border: 1.5px solid #cbd5e1;
          padding: 15px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .eligibility-clear-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }
        @media (max-width: 1024px) {
          .eligibility-form-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .eligibility-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .parliament-header-right { opacity: 0.95; width: 320px !important; }
        }
        @media (max-width: 768px) {
          .eligibility-header-content { flex-direction: column !important; align-items: stretch !important; gap: 20px !important; }
          .parliament-header-right { width: 100% !important; height: 160px !important; }
        }
        @media (max-width: 640px) {
          .eligibility-form-grid { grid-template-columns: 1fr !important; }
          .eligibility-features-grid { grid-template-columns: 1fr !important; }
          .eligibility-action-row { flex-direction: column !important; }
          .eligibility-action-row button { width: 100% !important; }
        }
      `}</style>

      {/* Top Banner & Header Section */}
      <div style={styles.headerBanner}>
        <div className="eligibility-header-content" style={styles.headerContent}>
          <button
            onClick={() => onBack(checked ? { qualification, age, state, category, jobs: eligibleJobs } : null)}
            style={styles.backBtn}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div style={styles.headerLeft}>
            {/* Pill Badge */}
            <div style={styles.pillBadge}>
              <Sparkles size={14} color="#047857" />
              <span>Find Your Perfect Government Job</span>
            </div>

            {/* Title */}
            <h1 style={styles.title}>
              Eligibility <span style={{ color: '#10b981' }}>Checker</span>
            </h1>

            {/* Subtitle */}
            <p style={styles.subtitle}>
              Enter your details to find jobs you're eligible for. Get personalized results based on your age, qualifications and category.
            </p>
          </div>

          {/* Right Side Themed Government & Career Aspirant Visual Card */}
          <div className="parliament-header-right" style={styles.headerVisualCard}>
            <img
              src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80"
              alt="Government Job Journey"
              style={styles.headerVisualImg}
            />
            <div style={styles.headerVisualOverlay}>
              <div style={styles.headerVisualTopRow}>
                <span style={styles.headerVisualBadge}>
                  <Sparkles size={12} style={{ marginRight: 4 }} />
                  GovNotify Journey
                </span>
                <span style={styles.tricolorFlagBadge}>🇮🇳 Official</span>
              </div>
              <div style={styles.headerVisualQuoteBox}>
                <p style={styles.headerVisualQuote}>
                  “Your Government Job Journey Starts Here”
                </p>
                <span style={styles.headerVisualSub}>
                  UPSC • SSC • Railways • Defence • State PSC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Body */}
      <div style={styles.mainBody}>

        {/* 1. THE MAIN FORM CARD */}
        <div style={styles.formCard}>
          <div className="eligibility-form-grid" style={styles.formGrid}>

            {/* Field 1: Highest Qualification */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelContainer}>
                <div style={{ ...styles.iconCircle, background: '#dbeafe', color: '#2563eb' }}>
                  <FileText size={15} />
                </div>
                <label style={styles.label}>
                  Highest Qualification <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
              <select
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                style={styles.selectInput}
              >
                <option value="10th">10th Pass</option>
                <option value="12th">12th Pass</option>
                <option value="Diploma">Diploma</option>
                <option value="Degree">Degree</option>
                <option value="B.E">B.E / B.Tech</option>
                <option value="MBA">MBA</option>
                <option value="PG">Post Graduate</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            {/* Field 2: Age */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelContainer}>
                <div style={{ ...styles.iconCircle, background: '#dcfce7', color: '#10b981' }}>
                  <User size={15} />
                </div>
                <label style={styles.label}>
                  Age <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g., 22"
                style={styles.textInput}
              />
            </div>

            {/* Field 3: State */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelContainer}>
                <div style={{ ...styles.iconCircle, background: '#f3e8ff', color: '#8b5cf6' }}>
                  <MapPin size={15} />
                </div>
                <label style={styles.label}>
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                style={styles.selectInput}
              >
                <option value="All">All India</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
              </select>
            </div>

            {/* Field 4: Category */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelContainer}>
                <div style={{ ...styles.iconCircle, background: '#ffedd5', color: '#f97316' }}>
                  <Users size={15} />
                </div>
                <label style={styles.label}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={styles.selectInput}
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

          </div>

          {/* Action Buttons: Check Eligibility & Clear Filters */}
          <div className="eligibility-action-row" style={styles.actionBtnRow}>
            <button
              onClick={handleCheck}
              disabled={loading}
              style={{
                ...styles.checkBtn,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <Search size={18} />
              <span>{loading ? "Checking Eligibility..." : "Check Eligibility"}</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="eligibility-clear-btn"
              title="Clear filters and reset saved profile"
            >
              <RotateCcw size={16} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* 2. THE BOTTOM FEATURE STRIP */}
        <div className="eligibility-features-grid" style={styles.featuresCard}>
          
          {/* Feature 1 */}
          <div style={styles.featureItem}>
            <div style={{ ...styles.featureIconBadge, background: '#dcfce7', color: '#10b981' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong style={styles.featureTitle}>Accurate Results</strong>
              <p style={styles.featureText}>Get reliable and up-to-date eligibility information.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={styles.featureItem}>
            <div style={{ ...styles.featureIconBadge, background: '#f3e8ff', color: '#8b5cf6' }}>
              <Zap size={20} />
            </div>
            <div>
              <strong style={styles.featureTitle}>Save Time</strong>
              <p style={styles.featureText}>Quick and easy way to find suitable government jobs.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={styles.featureItem}>
            <div style={{ ...styles.featureIconBadge, background: '#dbeafe', color: '#2563eb' }}>
              <Target size={20} />
            </div>
            <div>
              <strong style={styles.featureTitle}>Multiple Filters</strong>
              <p style={styles.featureText}>Filter by qualification, age, state and category.</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={styles.featureItem}>
            <div style={{ ...styles.featureIconBadge, background: '#ffe4e6', color: '#f43f5e' }}>
              <Heart size={20} />
            </div>
            <div>
              <strong style={styles.featureTitle}>Personalized for You</strong>
              <p style={styles.featureText}>Find opportunities that match your profile.</p>
            </div>
          </div>

        </div>

        {/* 3. ELIGIBLE JOBS RESULTS GRID (ON CHECK) */}
        {checked && (
          <div style={styles.resultsContainer}>
            <div style={{ ...styles.resultsHeader, justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={styles.resultsHeaderIcon}>
                  <CheckCircle2 size={24} color="#10b981" />
                </div>
                <div>
                  <h2 style={styles.resultsTitle}>
                    🎉 You are eligible for {eligibleJobs.length} job{eligibleJobs.length !== 1 ? 's' : ''}
                  </h2>
                  <p style={styles.resultsSub}>Matching qualification "{qualification}", age "{age || 'Any'}", state "{state}" &amp; category "{category}".</p>
                </div>
              </div>
              <button
                onClick={() => onBack({ qualification, age, state, category, jobs: eligibleJobs })}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: '0.2s'
                }}
              >
                <span>View on Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {eligibleJobs.length === 0 ? (
              <div style={styles.emptyBox}>
                <Briefcase size={44} color="#94a3b8" />
                <h3 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 700, margin: '12px 0 6px' }}>
                  No jobs currently match all your eligibility criteria.
                </h3>
                <p style={styles.emptyHint}>
                  {Number(age) && Number(age) < 18
                    ? "Government recruitment rules strictly require candidates to be at least 18 years of age. A 15-year-old applicant cannot be marked eligible for these positions."
                    : "Try adjusting your age, qualification, or state filters and search again."}
                </p>
              </div>
            ) : (
              <div style={styles.jobListGrid}>
                {eligibleJobs.map(job => (
                  <div key={job.id || job.title} style={styles.jobCard}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                      <JobLogo organization={job.organization} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.jobCardHeader}>
                          <span style={styles.statusBadge}>{job.status || "Active Recruitment"}</span>
                          <span style={styles.stateTag}>{job.state || "Central Govt"}</span>
                        </div>
                        <h3 style={styles.jobTitle}>{job.title}</h3>
                        <p style={styles.jobOrg}>🏛️ {job.organization || "Government Department"}</p>
                      </div>
                    </div>

                    <div style={styles.jobMetaRow}>
                      <span>📅 Last Date: <strong style={{ color: '#ef4444' }}>{job.lastDate || "N/A"}</strong></span>
                      {job.qualification && <span>🎓 {job.qualification}</span>}
                    </div>

                    <a
                      href={job.officialApplyUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.applyBtn}
                    >
                      <span>Apply on Official Portal</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  pageRoot: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #ecfdf5 0%, #f8fafc 240px, #f1f5f9 100%)',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0f172a',
    paddingBottom: '60px'
  },
  headerBanner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px 20px',
    position: 'relative'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#059669',
    fontSize: '13px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    transition: '0.2s'
  },
  headerLeft: {
    marginTop: '44px',
    maxWidth: '620px'
  },
  pillBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#ecfdf5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 14px',
    borderRadius: '20px',
    marginBottom: '14px',
    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)'
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
    lineHeight: 1.15
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14.5px',
    lineHeight: 1.5,
    margin: 0
  },
  headerVisualCard: {
    position: 'relative',
    width: '390px',
    height: '165px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
    border: '1px solid #e2e8f0',
    flexShrink: 0
  },
  headerVisualImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  headerVisualOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.45) 55%, rgba(15, 23, 42, 0.2) 100%)',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#ffffff'
  },
  headerVisualTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerVisualBadge: {
    background: 'rgba(16, 185, 129, 0.25)',
    border: '1px solid rgba(16, 185, 129, 0.5)',
    backdropFilter: 'blur(4px)',
    color: '#6ee7b7',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center'
  },
  tricolorFlagBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    padding: '3px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700'
  },
  headerVisualQuoteBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  headerVisualQuote: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.3',
    letterSpacing: '-0.3px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
  },
  headerVisualSub: {
    fontSize: '11px',
    color: '#cbd5e1',
    fontWeight: '600'
  },
  mainBody: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px'
  },
  formCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 12px 35px -10px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e2e8f0',
    borderTop: '4px solid #10b981',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  iconCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0
  },
  label: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  selectInput: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  textInput: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box'
  },
  actionBtnRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    width: '100%'
  },
  checkBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
    color: '#ffffff',
    padding: '15px 28px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.28)',
    cursor: 'pointer',
    transition: '0.2s'
  },
  featuresCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    marginBottom: '28px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  featureIconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0
  },
  featureTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '2px'
  },
  featureText: {
    fontSize: '11.5px',
    color: '#64748b',
    lineHeight: 1.3,
    margin: 0
  },
  resultsContainer: {
    marginTop: '28px'
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#ffffff',
    padding: '18px 24px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  resultsHeaderIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#dcfce7',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 2px'
  },
  resultsSub: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: 0
  },
  emptyBox: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '44px 24px',
    textAlign: 'center',
    color: '#64748b',
    border: '1px solid #e2e8f0'
  },
  emptyHint: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0
  },
  jobListGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  jobCard: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  jobCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  statusBadge: {
    background: '#dcfce7',
    color: '#15803d',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  stateTag: {
    background: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  jobTitle: {
    fontSize: '15.5px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px',
    lineHeight: 1.35
  },
  jobOrg: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '14px'
  },
  jobMetaRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12px',
    color: '#64748b',
    background: '#f8fafc',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  applyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: '#10b981',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700',
    transition: '0.2s'
  }
};

export default EligibilityChecker;