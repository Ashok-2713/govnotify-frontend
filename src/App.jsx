import { useState, useRef, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import ProfilePage from "./ProfilePage";
import EligibilityChecker from "./EligibilityChecker";
import SavedJobs from "./SavedJobs";
import JobNotifications from "./JobNotifications";
import UpcomingJobs from "./UpcomingJobs";
import AppliedJobs from "./AppliedJobs";
import ExamCalendar from "./ExamCalendar";
import Settings from "./Settings";
import HelpSupport from "./HelpSupport";
import AIAssistant from "./AIAssistant";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { GoogleLogin } from "@react-oauth/google";
import {
  Shield, Search, Bell, CheckCircle2, Heart, FileText, Calendar, User, Lock, Eye, EyeOff,
  ArrowRight, Briefcase, Users, Building2, ShieldCheck, Target, X,
  ChevronRight, Landmark, Sparkles
} from "lucide-react";

const API_URL = "http://localhost:8080/api/auth";

const features = [
  [Search, "Smart Job Search", "Search jobs by qualification, department, state, category, and deadline."],
  [Bell, "Instant Alerts", "Get alerts for new notifications, examination dates, and deadlines."],
  [CheckCircle2, "Eligibility Check", "Check eligibility based on your qualification, age, and category."],
  [Heart, "Save Jobs", "Save job notifications and review them whenever you are ready."],
  [FileText, "Official Links", "Access official notification PDFs and application links easily."],
  [Calendar, "Exam Calendar", "Track application dates, admit cards, exams, and result notifications."]
];

const steps = [
  ["1", "Create Your Account", "Register with your basic details and preferred job categories."],
  ["2", "Find Suitable Jobs", "Search Central, State, Railway, Banking, Defence, and Teaching jobs."],
  ["3", "Track and Apply", "Save jobs, download notifications, and apply before the deadline."]
];

function App() {
  const [modal, setModal] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [isUser, setIsUser] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showEligibility, setShowEligibility] = useState(false);
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [showJobNotifications, setShowJobNotifications] = useState(false);
  const [showUpcomingJobs, setShowUpcomingJobs] = useState(false);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const [showExamCalendar, setShowExamCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [eligibilityFilter, setEligibilityFilter] = useState(null);
  // State variable to track password visibility in the Login modal
  const [showPassword, setShowPassword] = useState(false);
  // Ref and state for Google Identity Services button container & instant skeleton placeholder
  const googleBtnContainerRef = useRef(null);
  const [isGoogleBtnRendered, setIsGoogleBtnRendered] = useState(false);

  useEffect(() => {
    if (modal !== "login") {
      setIsGoogleBtnRendered(false);
      return;
    }

    const container = googleBtnContainerRef.current;
    if (!container) return;

    // Check if Google button iframe or DOM node has already been created
    const hasGoogleElement = () =>
      !!container.querySelector("iframe, div[role='button'], div[id^='g_id_signin']");

    if (hasGoogleElement()) {
      setIsGoogleBtnRendered(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (hasGoogleElement()) {
        setIsGoogleBtnRendered(true);
        observer.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    // Fallback timer to ensure placeholder smoothly transitions if script was cached
    const fallbackTimer = setTimeout(() => {
      if (hasGoogleElement()) {
        setIsGoogleBtnRendered(true);
      }
    }, 350);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [modal]);

  const openModal = (type) => {
    setModal(type);
    setLoginMessage("");
    setRegisterMessage("");
    setShowPassword(false);
    setIsGoogleBtnRendered(false);
  };

  async function handleLogin(event) {
    event.preventDefault();
    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.role === "ADMIN") {
        setAdminEmail(data.email || email);
        setIsAdmin(true);
        return;
      }

      if (response.ok && (data.role === "USER" || response.ok)) {
        setUserEmail(data.email || email);
        setIsUser(true);
        setCurrentPage("dashboard");
        return;
      }

      setLoginMessage(data.message || "Login failed. Please check your credentials.");
    } catch {
      setLoginMessage("Backend is not running. Start Spring Boot first.");
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse?.credential) {
      setLoginMessage("Google login did not return a valid credential token.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await response.json();
      if (response.ok && data.email) {
        setUserEmail(data.email);
        if (data.name) {
          localStorage.setItem("candidateName", data.name);
        }
        setIsUser(true);
        setCurrentPage("dashboard");
        setModal(null);
        setLoginMessage("");
        return;
      }

      setLoginMessage(data.message || "Google authentication failed.");
    } catch {
      setLoginMessage("Backend is not running. Start Spring Boot first.");
    }
  }

  function handleGoogleError() {
    setLoginMessage("Google login was cancelled or encountered an error.");
  }

  async function handleRegister(event) {
    event.preventDefault();
    const fullName = event.target.fullName.value.trim();
    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await response.json();
      setRegisterMessage(data.message || "Registration completed.");
      if (response.ok) event.target.reset();
    } catch {
      setRegisterMessage("Backend is not running. Start Spring Boot first.");
    }
  }

  if (isAdmin) {
    return <AdminDashboard adminEmail={adminEmail} onLogout={() => setIsAdmin(false)} />;
  }

  if (isUser) {
    let userView = null;

    // Show Settings Page
    if (showSettings) {
      userView = (
        <Settings
          userEmail={userEmail}
          onBack={() => setShowSettings(false)}
          onEligibilityClick={() => {
            setShowSettings(false);
            setShowEligibility(true);
          }}
        />
      );
    } else if (showHelp) {
      userView = (
        <HelpSupport
          userEmail={userEmail}
          onBack={() => setShowHelp(false)}
          onEligibilityClick={() => {
            setShowHelp(false);
            setShowEligibility(true);
          }}
        />
      );
    } else if (showExamCalendar) {
      userView = (
        <ExamCalendar
          onBack={() => setShowExamCalendar(false)}
        />
      );
    } else if (showAppliedJobs) {
      userView = (
        <AppliedJobs
          userEmail={userEmail}
          onBack={() => setShowAppliedJobs(false)}
          onEligibilityClick={() => {
            setShowAppliedJobs(false);
            setShowEligibility(true);
          }}
        />
      );
    } else if (showUpcomingJobs) {
      userView = (
        <UpcomingJobs
          userEmail={userEmail}
          onBack={() => setShowUpcomingJobs(false)}
        />
      );
    } else if (showJobNotifications) {
      userView = (
        <JobNotifications
          userEmail={userEmail}
          onBack={() => setShowJobNotifications(false)}
        />
      );
    } else if (showSavedJobs) {
      userView = (
        <SavedJobs
          userEmail={userEmail}
          onBack={() => setShowSavedJobs(false)}
        />
      );
    } else if (showEligibility) {
      userView = (
        <EligibilityChecker
          userEmail={userEmail}
          onBack={(criteria) => {
            setEligibilityFilter(criteria || null);
            setShowEligibility(false);
          }}
          onCheck={(criteria) => {
            setEligibilityFilter(criteria);
          }}
        />
      );
    } else if (currentPage === "profile") {
      userView = (
        <ProfilePage
          userEmail={userEmail}
          onBack={() => {
            setEligibilityFilter(null);
            setCurrentPage("dashboard");
          }}
        />
      );
    } else {
      userView = (
        <UserDashboard
          userEmail={userEmail}
          appliedEligibilityFilter={eligibilityFilter}
          onClearEligibilityFilter={() => setEligibilityFilter(null)}
          onLogout={() => {
            setIsUser(false);
            setEligibilityFilter(null);
            setShowSavedJobs(false);
            setShowEligibility(false);
            setShowJobNotifications(false);
            setShowUpcomingJobs(false);
            setShowAppliedJobs(false);
            setShowExamCalendar(false);
            setShowSettings(false);
            setShowHelp(false);
          }}
          onProfileClick={() => {
            setEligibilityFilter(null);
            setCurrentPage("profile");
          }}
          onEligibilityClick={() => setShowEligibility(true)}
          onSavedJobsClick={() => setShowSavedJobs(true)}
          onJobNotificationsClick={() => setShowJobNotifications(true)}
          onUpcomingJobsClick={() => setShowUpcomingJobs(true)}
          onAppliedJobsClick={() => setShowAppliedJobs(true)}
          onExamCalendarClick={() => setShowExamCalendar(true)}
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowHelp(true)}
        />
      );
    }

    return (
      <>
        {userView}
        <AIAssistant userEmail={userEmail} />
      </>
    );
  }

  return (
    <div className="landing-root">
      <style>{styles}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon-box">
            <Landmark size={22} className="brand-svg" />
          </div>
          <span className="brand-title">
            GOV<span className="brand-accent">NOTIFY</span>
          </span>
        </div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <button className="login-nav-btn" onClick={() => openModal("login")}>
            <User size={16} /> Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="hero-text">
          <div className="hero-tag">
            <Sparkles size={14} /> Official Job Notification Portal
          </div>
          <h1>
            Your Gateway to <br />
            <span className="text-emerald">Government Jobs</span> <br />
            Across India
          </h1>
          <p>
            Get instant updates on the latest Central &amp; State Government job
            notifications, exam dates, results, and official application portals in one place.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => openModal("register")}>
              Create Free Account <ArrowRight size={18} />
            </button>
            <a className="secondary-btn" href="#features">Explore Features</a>
          </div>
          <div className="hero-stats-row">
            <div className="stat-item">
              <div className="stat-ico green"><Briefcase size={18} /></div>
              <div><strong>50K+</strong><small>Job Notifications</small></div>
            </div>
            <div className="stat-item">
              <div className="stat-ico blue"><Users size={18} /></div>
              <div><strong>10L+</strong><small>Registered Users</small></div>
            </div>
            <div className="stat-item">
              <div className="stat-ico purple"><Building2 size={18} /></div>
              <div><strong>100+</strong><small>Departments</small></div>
            </div>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
              alt="Students preparing for Government Exams"
              className="floating-hero-img"
            />
            <div className="hero-badge">
              <Bell size={18} className="bell-glow" />
              <div>
                <strong>Daily Verified Job Updates</strong>
                <small>100% Authentic Government Sources</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <div className="highlights-strip">
        <div className="highlight-card">
          <div className="hl-icon green"><ShieldCheck size={22} /></div>
          <div><h4>100% Official</h4><p>Trusted source for government job updates</p></div>
        </div>
        <div className="highlight-card">
          <div className="hl-icon blue"><Lock size={22} /></div>
          <div><h4>Secure &amp; Safe</h4><p>Your data is encrypted and always protected</p></div>
        </div>
        <div className="highlight-card">
          <div className="hl-icon purple"><Bell size={22} /></div>
          <div><h4>Instant Alerts</h4><p>Get real-time notifications on new job updates</p></div>
        </div>
        <div className="highlight-card">
          <div className="hl-icon orange"><Target size={22} /></div>
          <div><h4>Find Your Dream Job</h4><p>Opportunities across Central &amp; State Government</p></div>
        </div>
      </div>

      {/* Features */}
      <section className="section" id="features">
        <h2 className="section-title">Why Choose <span className="text-emerald">GovNotify?</span></h2>
        <p className="section-description">A single, streamlined portal to search, save, track, and apply for suitable government job opportunities.</p>
        <div className="features-grid">
          {features.map(([IconComponent, title, text]) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon-box"><IconComponent size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works" id="how-it-works">
        <h2 className="section-title">How It <span className="text-emerald">Works</span></h2>
        <p className="section-description">Start finding relevant government job opportunities in three simple steps.</p>
        <div className="steps">
          {steps.map(([number, title, text]) => (
            <div className="step" key={number}>
              <div className="step-number">{number}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="section about" id="about">
        <div className="about-img-container">
          <img src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=85" alt="Student preparing for exam" />
        </div>
        <div className="about-text">
          <h2>Your Career Journey <span className="text-emerald">Starts Here.</span></h2>
          <p>GovNotify is a Government Job Notification Portal created to make searching and tracking government job opportunities seamless and fast for aspirants.</p>
          <ul className="about-points">
            <li><CheckCircle2 size={16} className="text-emerald inline-ico" /> Central and State government job information</li>
            <li><CheckCircle2 size={16} className="text-emerald inline-ico" /> Easy qualification-based job filters</li>
            <li><CheckCircle2 size={16} className="text-emerald inline-ico" /> Saved jobs and application tracking</li>
            <li><CheckCircle2 size={16} className="text-emerald inline-ico" /> Exam and deadline notifications</li>
          </ul>
          <button className="primary-btn" onClick={() => openModal("register")}>
            Start Exploring Jobs <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Find Your Government Job?</h2>
        <p>Create your free GovNotify account and never miss an official notification.</p>
        <button onClick={() => openModal("register")}>Create Account Now</button>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-brand">
          <Landmark size={20} className="text-emerald" />
          <strong>GOVNOTIFY</strong> — Government Job Notification Portal
        </div>
        <div>© 2026 GovNotify. Academic Project. All rights reserved.</div>
      </footer>

      {/* LOGIN MODAL */}
      {modal === "login" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-container-2col" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModal(null)}><X size={20} /></button>

            <div className="modal-left-hero">
              <div className="modal-hero-bg" />
              <div className="modal-hero-top">
                <div className="modal-hero-brand">
                  <div className="modal-hero-logo"><Landmark size={24} color="#ffffff" /></div>
                  <div>
                    <h3>GOVNOTIFY</h3>
                    <span>Government Job Notification Portal</span>
                  </div>
                </div>
                <div className="modal-hero-heading">
                  <h2>Your Gateway to <br /><span className="accent-green">Government Jobs</span> <br />Across India</h2>
                  <div className="green-accent-bar" />
                  <p>Get instant updates on the latest Central &amp; State Government job notifications, exam dates, results and more.</p>
                </div>
              </div>
              <div className="modal-hero-stats">
                <div className="m-stat"><div className="m-stat-ico green"><Briefcase size={16} /></div><div><strong>50K+</strong><small>Job Notifications</small></div></div>
                <div className="m-stat"><div className="m-stat-ico blue"><Users size={16} /></div><div><strong>10L+</strong><small>Registered Users</small></div></div>
                <div className="m-stat"><div className="m-stat-ico purple"><FileText size={16} /></div><div><strong>100+</strong><small>Departments</small></div></div>
                <div className="m-stat"><div className="m-stat-ico orange"><Bell size={16} /></div><div><strong>24/7</strong><small>Instant Updates</small></div></div>
              </div>
            </div>

            <div className="modal-right-form">
              <div className="goi-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="goi-emblem" />
                <div className="goi-text"><span>भारत सरकार</span><small>GOVERNMENT OF INDIA</small></div>
              </div>
              <div className="form-head">
                <h2>Welcome Back!</h2>
                <div className="form-accent-line" />
                <p>Login to access your account</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label>Email / Mobile Number</label>
                  <div className="input-field-wrapper">
                    <User size={18} className="field-icon" />
                    <input name="email" type="email" placeholder="Enter your email or mobile number" required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrapper">
                    <Lock size={18} className="field-icon" />
                    {/* Dynamic password input type: switches between text and password */}
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                    />
                    {/* Functional password visibility toggle with visual feedback */}
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        className="field-icon-right"
                        style={{ color: "#10b981", cursor: "pointer" }}
                        onClick={() => setShowPassword(!showPassword)}
                        title="Hide password"
                        aria-label="Hide password"
                      />
                    ) : (
                      <Eye
                        size={18}
                        className="field-icon-right"
                        style={{ color: "#94a3b8", cursor: "pointer" }}
                        onClick={() => setShowPassword(!showPassword)}
                        title="Show password"
                        aria-label="Show password"
                      />
                    )}
                  </div>
                </div>
                <div className="forgot-pass-row">
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); openModal("forgot-password"); }}>Forgot Password?</a>
                </div>
                <button type="submit" className="login-submit-btn"><ArrowRight size={18} /> Login</button>
                {loginMessage && <p className="form-message-box">{loginMessage}</p>}
              </form>
              {/* "or continue with" divider displayed above the Google button placeholder */}
              <div className="divider-row"><span>or continue with</span></div>

              {/* Fixed height container (min-height: 40px) to prevent layout jumping */}
              <div
                ref={googleBtnContainerRef}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "44px",
                  height: "44px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px"
                }}
              >
                {/* Instant grey rounded loading skeleton placeholder */}
                {!isGoogleBtnRendered && (
                  <div
                    className="google-skeleton-placeholder"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "44px",
                      borderRadius: "6px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      color: "#64748b",
                      fontSize: "14px",
                      fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      pointerEvents: "none",
                      zIndex: 1,
                      animation: "pulseSkeleton 1.5s ease-in-out infinite"
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </div>
                )}

                {/* Google OAuth Login component */}
                <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>
              <div className="modal-footer-link">
                New to GovNotify? <button type="button" onClick={() => openModal("register")}>Create an Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {modal === "register" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-container-2col" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModal(null)}><X size={20} /></button>
            <div className="modal-left-hero">
              <div className="modal-hero-bg" />
              <div className="modal-hero-top">
                <div className="modal-hero-brand">
                  <div className="modal-hero-logo"><Landmark size={24} color="#ffffff" /></div>
                  <div>
                    <h3>GOVNOTIFY</h3>
                    <span>Government Job Notification Portal</span>
                  </div>
                </div>
                <div className="modal-hero-heading">
                  <h2>Create Your Account &amp; <br /><span className="accent-green">Never Miss Jobs</span></h2>
                  <div className="green-accent-bar" />
                  <p>Register now to receive real-time notifications, save job posts, and track exam calendars across Central &amp; State Governments.</p>
                </div>
              </div>
              <div className="modal-hero-stats">
                <div className="m-stat"><div className="m-stat-ico green"><Briefcase size={16} /></div><div><strong>50K+</strong><small>Job Notifications</small></div></div>
                <div className="m-stat"><div className="m-stat-ico blue"><Users size={16} /></div><div><strong>10L+</strong><small>Registered Users</small></div></div>
                <div className="m-stat"><div className="m-stat-ico purple"><FileText size={16} /></div><div><strong>100+</strong><small>Departments</small></div></div>
                <div className="m-stat"><div className="m-stat-ico orange"><Bell size={16} /></div><div><strong>24/7</strong><small>Instant Updates</small></div></div>
              </div>
            </div>
            <div className="modal-right-form">
              <div className="goi-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="goi-emblem" />
                <div className="goi-text"><span>भारत सरकार</span><small>GOVERNMENT OF INDIA</small></div>
              </div>
              <div className="form-head">
                <h2>Create Account</h2>
                <div className="form-accent-line" />
                <p>Register to receive job updates and alerts</p>
              </div>
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-field-wrapper">
                    <User size={18} className="field-icon" />
                    <input name="fullName" type="text" placeholder="Enter your full name" required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-field-wrapper">
                    <User size={18} className="field-icon" />
                    <input name="email" type="email" placeholder="Enter your email address" required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrapper">
                    <Lock size={18} className="field-icon" />
                    <input name="password" type="password" placeholder="Minimum 8 characters" minLength="8" required />
                  </div>
                </div>
                <button type="submit" className="login-submit-btn">Create Account <ArrowRight size={18} /></button>
                {registerMessage && <p className="form-message-box">{registerMessage}</p>}
              </form>
              <div className="modal-footer-link">
                Already have an account? <button type="button" onClick={() => openModal("login")}>Login Here</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL (MULTI-STEP OTP FLOW) */}
      {modal === "forgot-password" && (
        <ForgotPasswordModal
          onClose={() => setModal(null)}
          onBackToLogin={() => openModal("login")}
        />
      )}
    </div>
  );
}

const styles = `
  :root {
    --primary-emerald: #10b981;
    --primary-emerald-hover: #059669;
    --deep-slate: #0f172a;
    --card-slate: #1e293b;
    --border-slate: #334155;
    --text-slate-50: #f8fafc;
    --text-slate-400: #94a3b8;
  }
  * { box-sizing: border-box; scroll-behavior: smooth; font-family: 'Inter', system-ui, sans-serif; }
  .landing-root { background-color: var(--deep-slate); color: var(--text-slate-50); min-height: 100vh; width: 100%; }
  .text-emerald { color: var(--primary-emerald); }

  .navbar { height: 76px; padding: 0 6%; display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 100; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-icon-box { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #047857); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
  .brand-svg { color: #ffffff; }
  .brand-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
  .brand-accent { color: var(--primary-emerald); }
  .nav-links { display: flex; align-items: center; gap: 28px; }
  .nav-links a { color: var(--text-slate-400); text-decoration: none; font-size: 14px; font-weight: 500; transition: 0.2s; }
  .nav-links a:hover { color: var(--primary-emerald); }
  .login-nav-btn { background: var(--primary-emerald); color: #0f172a; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25); transition: 0.2s ease; }
  .login-nav-btn:hover { background: var(--primary-emerald-hover); color: #ffffff; transform: translateY(-1px); }

  .hero { min-height: 580px; padding: 70px 6%; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; background: radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.12) 0%, transparent 40%); }
  .hero-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); color: var(--primary-emerald); border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  .hero-text h1 { margin: 0 0 20px; font-size: clamp(36px, 4vw, 56px); line-height: 1.15; font-weight: 800; letter-spacing: -1px; }
  .hero-text p { max-width: 540px; color: var(--text-slate-400); font-size: 16px; line-height: 1.7; margin-bottom: 30px; }
  .hero-buttons { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; flex-wrap: wrap; }
  .primary-btn { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 10px; padding: 14px 26px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); transition: 0.2s; }
  .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); }
  .secondary-btn { padding: 14px 24px; border: 1px solid var(--border-slate); border-radius: 10px; background: rgba(30, 41, 59, 0.6); color: var(--text-slate-50); text-decoration: none; font-weight: 600; font-size: 15px; transition: 0.2s; }
  .secondary-btn:hover { border-color: var(--primary-emerald); color: var(--primary-emerald); background: rgba(16, 185, 129, 0.05); }
  .hero-stats-row { display: flex; gap: 24px; padding-top: 20px; border-top: 1px solid var(--border-slate); }
  .stat-item { display: flex; align-items: center; gap: 10px; }
  .stat-ico { width: 36px; height: 36px; border-radius: 8px; display: grid; place-items: center; }
  .stat-ico.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .stat-ico.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .stat-ico.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
  .stat-item strong { display: block; font-size: 15px; font-weight: 800; }
  .stat-item small { font-size: 11px; color: var(--text-slate-400); }

  .hero-image-wrapper { position: relative; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
  .floating-hero-img { animation: float 5s ease-in-out infinite; width: 100%; height: 400px; object-fit: cover; border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid var(--border-slate); }
  .hero-image-card { position: relative; }
  .hero-badge { position: absolute; bottom: -15px; left: -15px; background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--border-slate); border-left: 4px solid var(--primary-emerald); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
  .bell-glow { color: var(--primary-emerald); }
  .hero-badge strong { display: block; font-size: 13px; color: #fff; }
  .hero-badge small { font-size: 11px; color: var(--text-slate-400); }

  .highlights-strip { background: #f8fafc; color: #0f172a; padding: 24px 6%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
  .highlight-card { display: flex; align-items: center; gap: 14px; }
  .hl-icon { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
  .hl-icon.green { background: #dcfce7; color: #16a34a; }
  .hl-icon.blue { background: #dbeafe; color: #2563eb; }
  .hl-icon.purple { background: #f3e8ff; color: #9333ea; }
  .hl-icon.orange { background: #ffedd5; color: #ea580c; }
  .highlight-card h4 { margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #0f172a; }
  .highlight-card p { margin: 0; font-size: 11.5px; color: #64748b; line-height: 1.3; }

  .section { padding: 80px 6%; }
  .section-title { text-align: center; font-size: 34px; font-weight: 800; margin: 0 0 10px; }
  .section-description { text-align: center; color: var(--text-slate-400); max-width: 600px; margin: 0 auto 50px; font-size: 15px; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .feature-card { background: var(--card-slate); border: 1px solid var(--border-slate); border-radius: 16px; padding: 28px; transition: 0.25s; }
  .feature-card:hover { transform: translateY(-5px); border-color: var(--primary-emerald); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1); }
  .feature-icon-box { width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: var(--primary-emerald); display: grid; place-items: center; margin-bottom: 18px; }
  .feature-card h3 { margin: 0 0 10px; font-size: 18px; font-weight: 700; }
  .feature-card p { margin: 0; color: var(--text-slate-400); font-size: 13.5px; line-height: 1.6; }

  .how-it-works { background: rgba(15, 23, 42, 0.5); border-top: 1px solid var(--border-slate); border-bottom: 1px solid var(--border-slate); }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1000px; margin: auto; }
  .step { text-align: center; background: var(--card-slate); border: 1px solid var(--border-slate); border-radius: 16px; padding: 30px 20px; }
  .step-number { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #047857); color: #ffffff; font-weight: 800; font-size: 18px; display: grid; place-items: center; margin: 0 auto 18px; }
  .step h3 { margin: 0 0 8px; font-size: 16px; }
  .step p { margin: 0; color: var(--text-slate-400); font-size: 13px; line-height: 1.6; }

  .about { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
  .about-img-container img { width: 100%; height: 380px; object-fit: cover; border-radius: 20px; border: 1px solid var(--border-slate); }
  .about-text h2 { font-size: 34px; font-weight: 800; margin: 0 0 16px; }
  .about-text p { color: var(--text-slate-400); line-height: 1.7; margin-bottom: 20px; font-size: 15px; }
  .about-points { list-style: none; padding: 0; margin: 0 0 30px; display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: var(--text-slate-50); }
  .inline-ico { margin-right: 8px; vertical-align: middle; }

  .cta { padding: 70px 6%; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%); border-top: 1px solid var(--border-slate); }
  .cta h2 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
  .cta p { color: var(--text-slate-400); margin-bottom: 24px; }
  .cta button { background: var(--primary-emerald); color: #0f172a; border: none; border-radius: 10px; padding: 14px 30px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); transition: 0.2s; }
  .cta button:hover { background: var(--primary-emerald-hover); color: #fff; }

  footer { padding: 30px 6%; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-slate); color: var(--text-slate-400); font-size: 13px; background: #090d16; }
  .footer-brand { display: flex; align-items: center; gap: 8px; color: #fff; }

  .modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-container-2col { position: relative; width: 100%; max-width: 960px; background: #ffffff; border-radius: 20px; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7); color: #0f172a; }
  .modal-close-btn { position: absolute; top: 14px; right: 14px; z-index: 10; width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; display: grid; place-items: center; cursor: pointer; transition: 0.2s; }
  .modal-close-btn:hover { background: #e2e8f0; color: #0f172a; }

  .modal-left-hero { position: relative; background: linear-gradient(135deg, #071e3d 0%, #1e3c72 60%, #082042 100%); color: #ffffff; padding: 36px 30px; display: flex; flex-direction: column; justify-content: space-between; }
  .modal-hero-bg { position: absolute; inset: 0; background-image: url('https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80'); background-size: cover; background-position: center; opacity: 0.15; mix-blend-mode: overlay; pointer-events: none; }
  .modal-hero-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; position: relative; z-index: 2; }
  .modal-hero-logo { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); display: grid; place-items: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
  .modal-hero-brand h3 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
  .modal-hero-brand span { font-size: 10.5px; opacity: 0.8; display: block; }
  .modal-hero-heading { position: relative; z-index: 2; }
  .modal-hero-heading h2 { font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.25; margin-bottom: 12px; }
  .modal-hero-heading .accent-green { color: #10b981; }
  .green-accent-bar { width: 40px; height: 4px; background: #10b981; border-radius: 2px; margin-bottom: 16px; }
  .modal-hero-heading p { font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0; }

  .modal-hero-stats { position: relative; z-index: 2; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 30px; }
  .m-stat { display: flex; align-items: center; gap: 8px; }
  .m-stat-ico { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
  .m-stat-ico.green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .m-stat-ico.blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
  .m-stat-ico.purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
  .m-stat-ico.orange { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .m-stat strong { display: block; font-size: 13px; font-weight: 800; color: #fff; }
  .m-stat small { font-size: 10px; color: #94a3b8; }

  .modal-right-form { padding: 36px 32px; display: flex; flex-direction: column; justify-content: center; background: #ffffff; }
  .goi-header { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 20px; }
  .goi-emblem { height: 28px; width: auto; }
  .goi-text { text-align: left; }
  .goi-text span { display: block; font-size: 10px; font-weight: 700; color: #1e293b; line-height: 1; }
  .goi-text small { font-size: 8px; color: #64748b; letter-spacing: 0.5px; }

  .form-head h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
  .form-accent-line { width: 32px; height: 3px; background: #10b981; border-radius: 2px; margin-bottom: 8px; }
  .form-head p { font-size: 12.5px; color: #64748b; margin: 0 0 20px; }
  .input-group { margin-bottom: 16px; }
  .input-group label { display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 6px; }
  .input-field-wrapper { position: relative; display: flex; align-items: center; }
  .field-icon { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
  .field-icon-right { position: absolute; right: 12px; color: #94a3b8; cursor: pointer; }
  .input-field-wrapper input { width: 100%; padding: 11px 36px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; color: #0f172a; transition: 0.2s; }
  .input-field-wrapper input:focus { border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
  .forgot-pass-row { text-align: right; margin-bottom: 18px; margin-top: -4px; }
  .forgot-pass-row a { font-size: 11.5px; color: #2563eb; text-decoration: none; font-weight: 600; }
  .forgot-pass-row a:hover { text-decoration: underline; }
  .login-submit-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; background: linear-gradient(135deg, #1d4ed8 0%, #10b981 100%); color: #ffffff; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); transition: 0.2s; }
  .login-submit-btn:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35); }
  .form-message-box { margin-top: 12px; padding: 8px 12px; border-radius: 6px; background: #fef2f2; color: #dc2626; font-size: 12px; text-align: center; }

  .divider-row { position: relative; text-align: center; margin: 20px 0; }
  .divider-row::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e2e8f0; }
  .divider-row span { position: relative; background: #ffffff; padding: 0 12px; font-size: 11px; color: #94a3b8; }
  .social-login-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .social-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer; transition: 0.2s; }
  .social-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .modal-footer-link { text-align: center; font-size: 12px; color: #64748b; }
  .modal-footer-link button { background: none; border: none; color: #2563eb; font-weight: 700; cursor: pointer; padding: 0; margin-left: 4px; }
  .modal-footer-link button:hover { text-decoration: underline; }
  @keyframes pulseSkeleton { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }

  @media (max-width: 850px) {
    .hero { grid-template-columns: 1fr; padding-top: 40px; }
    .hero-stats-row { flex-wrap: wrap; }
    .features-grid, .steps, .highlights-strip { grid-template-columns: 1fr; }
    .about { grid-template-columns: 1fr; }
    .nav-links a { display: none; }
    .modal-container-2col { grid-template-columns: 1fr; max-height: 90vh; overflow-y: auto; }
    .modal-left-hero { display: none; }
  }
`;

export default App;