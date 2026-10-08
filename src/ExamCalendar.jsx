import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search,
  ExternalLink, Eye, RefreshCw, Clock, Building2, MapPin, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Sparkles, X, Filter
} from "lucide-react";
import JobLogo from "./JobLogo";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toYMD(d) {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtFullDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function daysDiff(targetDateStr) {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export default function ExamCalendar({ onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Filters State
  const [selectedState, setSelectedState] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Timeline UI State
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Real-time Countdown Timer State (updates every second)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const timelineRef = useRef(null);

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch jobs
  const fetchJobs = (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    fetch(`${API_BASE}/api/jobs/all`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const rawJobs = Array.isArray(data) ? data : [];

        // Deduplicate events by (jobTitle + organization + lastDate)
        const dedupMap = new Map();
        for (const j of rawJobs) {
          if (!j.lastDate) continue; // Only jobs with application/exam deadline
          const titleKey = (j.title || j.postTitle || "").trim().toLowerCase();
          const orgKey = (j.organization || "").trim().toLowerCase();
          const dateKey = (j.lastDate || "").trim().toLowerCase();
          const key = `${titleKey}|${orgKey}|${dateKey}`;

          if (!dedupMap.has(key)) {
            dedupMap.set(key, j);
          }
        }

        setJobs(Array.from(dedupMap.values()));
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error("Error fetching exam calendar jobs:", err);
        setJobs([]);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs by State & Search
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // State filter
    if (selectedState !== "All") {
      result = result.filter(j => {
        if (!j.state) return false;
        if (selectedState === "All India") {
          return j.state.toLowerCase().includes("all-india") ||
                 j.state.toLowerCase().includes("all india") ||
                 j.state.toLowerCase().includes("central");
        }
        return j.state.toLowerCase().includes(selectedState.toLowerCase());
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.organization && j.organization.toLowerCase().includes(q)) ||
        (j.state && j.state.toLowerCase().includes(q))
      );
    }

    return result;
  }, [jobs, selectedState, searchQuery]);

  // Group filtered jobs by YYYY-MM-DD
  const jobsByDate = useMemo(() => {
    const map = new Map();
    for (const job of filteredJobs) {
      const ymd = toYMD(job.lastDate);
      if (!ymd) continue;
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(job);
    }
    return map;
  }, [filteredJobs]);

  // Summary Metrics
  const todayYMD = useMemo(() => toYMD(new Date()), []);

  const summary = useMemo(() => {
    const now = new Date();
    const todayStr = toYMD(now);

    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    for (const job of filteredJobs) {
      const jYMD = toYMD(job.lastDate);
      if (!jYMD) continue;
      const jobTime = new Date(job.lastDate).getTime();

      if (jYMD === todayStr) todayCount++;
      if (jobTime >= now.getTime() && jobTime <= weekFromNow.getTime()) thisWeekCount++;
      if (jobTime >= startOfMonth.getTime() && jobTime <= endOfMonth.getTime()) thisMonthCount++;
    }

    return {
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
      total: filteredJobs.length
    };
  }, [filteredJobs]);

  // Live Nearest Event Countdown
  const nearestEventCountdown = useMemo(() => {
    const nowMs = currentTime.getTime();
    let closestFutureJob = null;
    let minDiff = Infinity;

    for (const job of filteredJobs) {
      if (!job.lastDate) continue;
      const target = new Date(job.lastDate);
      target.setHours(23, 59, 59, 999);
      const diff = target.getTime() - nowMs;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        closestFutureJob = job;
      }
    }

    if (!closestFutureJob) return null;

    const totalSeconds = Math.floor(minDiff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      job: closestFutureJob,
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  }, [filteredJobs, currentTime]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, dayNum);
      const ymd = toYMD(dateObj);
      cells.push({
        dayNum,
        ymd,
        dateObj,
        isCurrentMonth: false,
        dayOfWeek: dateObj.getDay()
      });
    }

    // 2. Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const ymd = toYMD(dateObj);
      cells.push({
        dayNum: day,
        ymd,
        dateObj,
        isCurrentMonth: true,
        dayOfWeek: dateObj.getDay()
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const dateObj = new Date(year, month + 1, day);
      const ymd = toYMD(dateObj);
      cells.push({
        dayNum: day,
        ymd,
        dateObj,
        isCurrentMonth: false,
        dayOfWeek: dateObj.getDay()
      });
    }

    return cells;
  }, [currentMonthDate]);

  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toYMD(today));
  };

  const handleCellClick = (cellYMD) => {
    if (selectedDate === cellYMD) {
      setSelectedDate(null);
    } else {
      setSelectedDate(cellYMD);
    }
  };

  // Timeline categorization
  const { todayList, upcomingList, pastList } = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const todayYMDStr = toYMD(todayMidnight);

    const tList = [];
    const uList = [];
    const pList = [];

    for (const job of filteredJobs) {
      const jobYMD = toYMD(job.lastDate);
      if (!jobYMD) continue;

      const jobMidnight = new Date(job.lastDate);
      jobMidnight.setHours(0, 0, 0, 0);

      if (jobYMD === todayYMDStr) {
        tList.push(job);
      } else if (jobMidnight.getTime() > todayMidnight.getTime()) {
        uList.push(job);
      } else {
        pList.push(job);
      }
    }

    // Sort upcoming ascending (soonest deadline first)
    uList.sort((a, b) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime());
    // Sort past descending (most recent past first)
    pList.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    return { todayList: tList, upcomingList: uList, pastList: pList };
  }, [filteredJobs]);

  // Jobs filtered when a date is clicked
  const selectedDateJobs = useMemo(() => {
    if (!selectedDate) return null;
    return filteredJobs.filter(j => toYMD(j.lastDate) === selectedDate);
  }, [filteredJobs, selectedDate]);

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
            <h1 style={styles.title}>📅 Exam &amp; Deadline Calendar</h1>
            <span style={styles.badgeLive}>
              <Sparkles size={13} style={{ marginRight: 4 }} /> Live Tracker
            </span>
          </div>
          <p style={styles.subtitle}>
            Track exam dates, application deadlines, and results across all states and central government.
          </p>
        </div>

        <div style={styles.headerRight}>
          {nearestEventCountdown && (
            <div style={styles.countdownCard}>
              <div style={styles.countdownTitleRow}>
                <Clock size={14} color="#f97316" />
                <span style={styles.countdownTitle}>Next Deadline In</span>
              </div>
              <strong style={styles.countdownValue}>{nearestEventCountdown.text}</strong>
              <small style={styles.countdownJobName} title={nearestEventCountdown.job.title}>
                {nearestEventCountdown.job.title}
              </small>
            </div>
          )}

          <button
            onClick={() => fetchJobs(true)}
            style={styles.refreshBtn}
            disabled={refreshing}
            title="Refresh latest dates"
          >
            <RefreshCw size={15} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div style={styles.summaryStrip}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>🚨 Deadline Today</span>
          <strong style={{ ...styles.summaryVal, color: "#f97316" }}>{summary.today}</strong>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>⏳ Closing This Week</span>
          <strong style={{ ...styles.summaryVal, color: "#2563eb" }}>{summary.thisWeek}</strong>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>🗓️ This Month</span>
          <strong style={{ ...styles.summaryVal, color: "#10b981" }}>{summary.thisMonth}</strong>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>📋 Total Tracked Events</span>
          <strong style={{ ...styles.summaryVal, color: "#0f172a" }}>{summary.total}</strong>
        </div>
      </div>

      {/* Filter Section */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by job title, department, or exam name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={styles.stateSelectBox}>
          <Filter size={14} color="#64748b" />
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            style={styles.stateSelect}
          >
            <option value="All">All States &amp; Central</option>
            <option value="All India">All India / Central</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Telangana">Telangana</option>
          </select>
        </div>
      </div>

      {/* ── PART 1: COMPACT CALENDAR + INTERACTIVE DATE INSPECTOR ── */}
      <div className="calendar-split-layout" style={styles.calendarSplitLayout}>
        {/* Left Column: Compact Calendar Grid */}
        <div style={styles.calendarCardCompact}>
          {/* Calendar Navigation Bar */}
          <div style={styles.calendarHeaderCompact}>
            <div style={styles.monthControls}>
              <button onClick={prevMonth} style={styles.navArrowBtn} title="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <h2 style={styles.monthTitleCompact}>
                {MONTH_NAMES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} style={styles.navArrowBtn} title="Next Month">
                <ChevronRight size={16} />
              </button>
              <button onClick={goToToday} style={styles.todayBtn}>
                Today
              </button>
            </div>

            {/* Status Legend */}
            <div style={styles.legendRowCompact}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: "#10b981" }} />
                <span>Open</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: "#f97316" }} />
                <span>Upcoming</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: "#94a3b8" }} />
                <span>Closed</span>
              </div>
            </div>
          </div>

          {/* Weekday Header Columns */}
          <div style={styles.weekdaysGridCompact}>
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}  // <--- KEY ADDED HERE
                style={{
                  ...styles.weekdayCellCompact,
                  color: (i === 0 || i === 6) ? "#dc2626" : "#64748b"
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div style={styles.daysGridCompact}>
            {calendarDays.map((cell) => {
              const cellJobs = jobsByDate.get(cell.ymd) || [];
              const isToday = cell.ymd === todayYMD;
              const isSelected = selectedDate === cell.ymd;
              const isWeekend = cell.dayOfWeek === 0 || cell.dayOfWeek === 6;

              let cellBg = "#ffffff";
              if (!cell.isCurrentMonth) cellBg = "#f8fafc";
              else if (isSelected) cellBg = "#ecfdf5";
              else if (isToday) cellBg = "#eff6ff";
              else if (isWeekend) cellBg = "#fbfcfe";

              return (
                <div
                  key={cell.ymd + "-" + cell.dayNum}  // <--- KEY ADDED HERE
                  onClick={() => handleCellClick(cell.ymd)}
                  style={{
                    ...styles.dayCellCompact,
                    background: cellBg,
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    border: isSelected
                      ? "2px solid #10b981"
                      : (isToday ? "2px solid #3b82f6" : "1px solid #e2e8f0"),
                    boxShadow: isSelected ? "0 0 0 2px rgba(16, 185, 129, 0.25)" : "none",
                    cursor: "pointer"
                  }}
                  title={
                    cellJobs.length > 0
                      ? `${cellJobs.length} event(s) on ${cell.ymd}. Click to view details.`
                      : cell.ymd
                  }
                >
                  <div style={styles.cellDayNumRowCompact}>
                    <span
                      style={{
                        ...styles.cellDayNumCompact,
                        fontWeight: (isToday || isSelected) ? 800 : 600,
                        color: isSelected
                          ? "#047857"
                          : (isToday ? "#1d4ed8" : (isWeekend ? "#ef4444" : "#0f172a")),
                        background: isSelected
                          ? "#a7f3d0"
                          : (isToday ? "#dbeafe" : "transparent"),
                        padding: (isSelected || isToday) ? "1px 5px" : "0",
                        borderRadius: "5px"
                      }}
                    >
                      {cell.dayNum}
                    </span>
                    {cellJobs.length > 0 && (
                      <span
                        style={{
                          ...styles.jobCountBadgeCompact,
                          background: isSelected ? "#047857" : "#10b981"
                        }}
                      >
                        {cellJobs.length}
                      </span>
                    )}
                  </div>

                  {/* Dot Indicators */}
                  <div style={styles.dotsRowCompact}>
                    {cellJobs.slice(0, 3).map((cj, idx) => {
                      const st = (cj.status || "OPEN").toUpperCase();
                      const dotColor = (st === "OPEN" || st === "ACTIVE")
                        ? "#10b981"
                        : (st === "UPCOMING" ? "#f97316" : "#94a3b8");

                      return (
                        <span
                          key={cj.id || idx}  // <--- KEY ADDED HERE
                          style={{
                            ...styles.miniDotCompact,
                            background: dotColor
                          }}
                        />
                      );
                    })}
                    {cellJobs.length > 3 && (
                      <span style={styles.moreDotsText}>+</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Date Details & Imagery Inspector */}
        <div style={styles.dateDetailsPanel}>
          {/* Hero Banner with Thematic Image */}
          <div style={styles.panelHeroBanner}>
            <img
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
              alt="Gov Exam & Recruitment Calendar"
              style={styles.panelHeroImg}
            />
            <div style={styles.panelHeroOverlay}>
              <div style={styles.panelHeroTopRow}>
                <span style={styles.panelBadgeGov}>
                  <Sparkles size={11} style={{ marginRight: 4 }} />
                  Exam Desk Inspector
                </span>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    style={styles.panelHeroClearBtn}
                    title="Clear selected date"
                  >
                    Clear Filter <X size={12} />
                  </button>
                )}
              </div>

              <div style={styles.panelHeroBottomRow}>
                <h3 style={styles.panelHeroTitle}>
                  {selectedDate ? fmtFullDate(selectedDate) : "Official Exam Schedule"}
                </h3>
                <p style={styles.panelHeroSubtitle}>
                  {selectedDate
                    ? `${selectedDateJobs ? selectedDateJobs.length : 0} deadline${selectedDateJobs && selectedDateJobs.length !== 1 ? 's' : ''} on this date`
                    : "Click any highlighted date on the calendar to view its deadlines"}
                </p>
              </div>
            </div>
          </div>

          {/* Panel Body: Jobs List for Date or Interactive Quick Glance */}
          <div style={styles.panelBody}>
            {selectedDate ? (
              selectedDateJobs && selectedDateJobs.length > 0 ? (
                <div style={styles.panelJobsList}>
                  {selectedDateJobs.map(job => (
                    <PanelJobCard
                      key={job.id || job.title + job.lastDate}  // <--- KEY ADDED HERE
                      job={job}
                      onView={() => setSelectedJobDetail(job)}
                    />
                  ))}
                </div>
              ) : (
                <div style={styles.panelEmptyState}>
                  <div style={styles.panelEmptyIconWrapper}>
                    <CalendarIcon size={28} color="#94a3b8" />
                  </div>
                  <h4 style={styles.panelEmptyTitle}>No Deadlines on this Date</h4>
                  <p style={styles.panelEmptySubtitle}>
                    There are no application closing dates or exams scheduled on {fmtDate(selectedDate)}.
                  </p>
                  <div style={styles.panelEmptyActions}>
                    <button
                      onClick={goToToday}
                      style={styles.panelEmptyBtnPrimary}
                    >
                      Check Today
                    </button>
                    {nearestEventCountdown && (
                      <button
                        onClick={() => setSelectedDate(toYMD(nearestEventCountdown.job.lastDate))}
                        style={styles.panelEmptyBtnSecondary}
                      >
                        Next Deadline ({fmtDate(nearestEventCountdown.job.lastDate)})
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* Default Overview when no date is clicked */
              <div style={styles.panelDefaultOverview}>
                {/* Nearest Deadline Spotlight Card */}
                {nearestEventCountdown && (
                  <div style={styles.spotlightCard}>
                    <div style={styles.spotlightHeader}>
                      <span style={styles.spotlightTag}>
                        <Clock size={12} style={{ marginRight: 4 }} />
                        Closest Upcoming Deadline
                      </span>
                      <strong style={styles.spotlightTimer}>{nearestEventCountdown.text}</strong>
                    </div>

                    <div style={styles.spotlightJobRow}>
                      <JobLogo
                        url={nearestEventCountdown.job.officialApplyUrl}
                        organization={nearestEventCountdown.job.organization}
                        state={nearestEventCountdown.job.state}
                        title={nearestEventCountdown.job.title}
                        size={36}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={styles.spotlightJobTitle}
                          onClick={() => setSelectedJobDetail(nearestEventCountdown.job)}
                        >
                          {nearestEventCountdown.job.title}
                        </h4>
                        <p style={styles.spotlightJobOrg}>
                          {nearestEventCountdown.job.organization} • {fmtDate(nearestEventCountdown.job.lastDate)}
                        </p>
                      </div>
                    </div>

                    <div style={styles.spotlightFooter}>
                      <button
                        onClick={() => setSelectedDate(toYMD(nearestEventCountdown.job.lastDate))}
                        style={styles.spotlightInspectBtn}
                      >
                        View in Calendar <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Date Filters */}
                <div style={styles.quickDateChipsRow}>
                  <button
                    onClick={goToToday}
                    style={styles.quickDateChip}
                  >
                    📅 Today's Deadlines ({summary.today})
                  </button>
                  <button
                    onClick={() => {
                      if (upcomingList.length > 0) {
                        setSelectedDate(toYMD(upcomingList[0].lastDate));
                      }
                    }}
                    style={styles.quickDateChip}
                  >
                    ⏳ Next Upcoming
                  </button>
                </div>

                {/* Aspirant Guide Tip with Companion Image */}
                <div style={styles.aspirantTipBox}>
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80"
                    alt="Study desk"
                    style={styles.aspirantTipImg}
                  />
                  <div style={{ flex: 1 }}>
                    <h5 style={styles.aspirantTipTitle}>💡 Interactive Calendar Tip</h5>
                    <p style={styles.aspirantTipText}>
                      Click on any date in the calendar containing colored dots to view all exam notifications and direct apply links instantly!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PART 2: TIMELINE LIST ── */}
      <div ref={timelineRef} style={styles.timelineSection}>
        {selectedDate && (
          <div style={styles.filterNoticeBanner}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarIcon size={18} color="#047857" />
              <span>
                Filtering events for date: <strong>{fmtDate(selectedDate)}</strong> ({selectedDateJobs ? selectedDateJobs.length : 0} event{selectedDateJobs && selectedDateJobs.length !== 1 ? 's' : ''})
              </span>
            </div>
            <button onClick={() => setSelectedDate(null)} style={styles.clearFilterBtn}>
              <X size={14} /> Clear Date Filter
            </button>
          </div>
        )}

        {/* If selectedDate is active, only show matching events */}
        {selectedDate ? (
          <div>
            {selectedDateJobs && selectedDateJobs.length > 0 ? (
              <div style={styles.eventsContainer}>
                {selectedDateJobs.map((job) => (
                  <TimelineEventCard
                    key={job.id || job.title + job.lastDate}  // <--- KEY ADDED HERE
                    job={job}
                    onView={() => setSelectedJobDetail(job)}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyCard}>
                <CalendarIcon size={46} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <h3>No events scheduled for {fmtDate(selectedDate)}</h3>
                <p style={{ color: "#64748b", fontSize: 14 }}>Click another date or clear the filter above.</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal 3-Section Timeline: TODAY, UPCOMING, PAST */
          <div style={styles.timelineWrapper}>
            {/* Section 1: TODAY */}
            <div style={styles.timelineGroup}>
              <div style={{ ...styles.stickyGroupHeader, borderLeftColor: "#f97316" }}>
                <div style={styles.groupHeaderContent}>
                  <h3 style={{ color: "#c2410c", margin: 0, fontSize: "16px", fontWeight: 800 }}>
                    📅 TODAY'S DEADLINES ({todayList.length})
                  </h3>
                  <span style={styles.todayPill}>Urgent Action Required</span>
                </div>
              </div>

              {todayList.length === 0 ? (
                <p style={styles.noEventsText}>No application deadlines ending today.</p>
              ) : (
                <div style={styles.eventsContainer}>
                  {todayList.map(job => (
                    <TimelineEventCard
                      key={job.id || job.title + job.lastDate}  // <--- KEY ADDED HERE
                      job={job}
                      accentColor="#f97316"
                      onView={() => setSelectedJobDetail(job)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: UPCOMING */}
            <div style={styles.timelineGroup}>
              <div style={{ ...styles.stickyGroupHeader, borderLeftColor: "#2563eb" }}>
                <div style={styles.groupHeaderContent}>
                  <h3 style={{ color: "#1d4ed8", margin: 0, fontSize: "16px", fontWeight: 800 }}>
                    ⏳ UPCOMING DEADLINES &amp; EXAMS ({upcomingList.length})
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Sorted by earliest deadline first</span>
                </div>
              </div>

              {upcomingList.length === 0 ? (
                <p style={styles.noEventsText}>No upcoming deadlines match your search/state filters.</p>
              ) : (
                <div style={styles.eventsContainer}>
                  {upcomingList.map(job => (
                    <TimelineEventCard
                      key={job.id || job.title + job.lastDate}  // <--- KEY ADDED HERE
                      job={job}
                      accentColor="#2563eb"
                      onView={() => setSelectedJobDetail(job)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: PAST (Collapsed by default) */}
            <div style={styles.timelineGroup}>
              <div
                onClick={() => setShowPastEvents(p => !p)}
                style={{ ...styles.stickyGroupHeader, borderLeftColor: "#94a3b8", cursor: "pointer" }}
              >
                <div style={styles.groupHeaderContent}>
                  <h3 style={{ color: "#475569", margin: 0, fontSize: "16px", fontWeight: 800 }}>
                    ✅ PAST &amp; CLOSED EVENTS ({pastList.length})
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: "13px" }}>
                    <span>{showPastEvents ? "Collapse" : "Click to view closed events"}</span>
                    {showPastEvents ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {showPastEvents && (
                <div style={styles.eventsContainer}>
                  {pastList.length === 0 ? (
                    <p style={styles.noEventsText}>No past events recorded.</p>
                  ) : (
                    pastList.map(job => (
                      <TimelineEventCard
                        key={job.id || job.title + job.lastDate}  // <--- KEY ADDED HERE
                        job={job}
                        accentColor="#94a3b8"
                        isPast
                        onView={() => setSelectedJobDetail(job)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── JOB DETAIL MODAL ── */}
      {selectedJobDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedJobDetail(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button style={styles.modalCloseBtn} onClick={() => setSelectedJobDetail(null)} title="Close">
              <X size={18} />
            </button>

            <div style={styles.modalHeader}>
              <JobLogo
                url={selectedJobDetail.officialApplyUrl}
                organization={selectedJobDetail.organization}
                state={selectedJobDetail.state}
                title={selectedJobDetail.title}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={styles.modalTitle}>{selectedJobDetail.title}</h3>
                <p style={styles.modalOrg}>🏛️ {selectedJobDetail.organization || "Government Department"}</p>
              </div>
            </div>

            <div style={styles.modalDetailsGrid}>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>State / Jurisdiction</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.state || "Central Government"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Department / Organization</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.organization || "Government Organization"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Qualification</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.qualification || "Graduate"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Status</span>
                <strong style={styles.modalDetailVal}>{selectedJobDetail.status || "OPEN"}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Registration Start Date</span>
                <strong style={{ ...styles.modalDetailVal, color: "#2563eb" }}>{fmtDate(selectedJobDetail.registrationStartDate)}</strong>
              </div>
              <div style={styles.modalDetailItem}>
                <span style={styles.modalDetailLabel}>Application Last Date</span>
                <strong style={{ ...styles.modalDetailVal, color: "#ef4444" }}>{fmtDate(selectedJobDetail.lastDate)}</strong>
              </div>
            </div>

            <div style={styles.modalActions}>
              <a
                href={selectedJobDetail.officialApplyUrl || "#"}
                target="_blank"
                rel="noreferrer"
                style={styles.modalApplyBtn}
              >
                Apply on Official Portal <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Animations & Responsive Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 960px) {
          .calendar-split-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Compact Job Card for Date Details Inspector ──
function PanelJobCard({ job, onView }) {
  const diffDays = daysDiff(job.lastDate);

  const getPill = () => {
    if (diffDays === 0) return { text: "Ends Today!", bg: "#fee2e2", color: "#dc2626" };
    if (diffDays > 0) return { text: `${diffDays}d left`, bg: "#dbeafe", color: "#1d4ed8" };
    const ago = Math.abs(diffDays);
    return { text: `${ago}d ago`, bg: "#f1f5f9", color: "#64748b" };
  };

  const pill = getPill();
  const st = (job.status || "OPEN").toUpperCase();

  return (
    <div style={styles.panelJobCard}>
      <div style={styles.panelJobCardTop}>
        <JobLogo
          url={job.officialApplyUrl}
          organization={job.organization}
          state={job.state}
          title={job.title}
          size={36}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <h4
              style={styles.panelJobTitle}
              onClick={onView}
              title={job.title}
            >
              {job.title}
            </h4>
            <span style={{ ...styles.panelUrgencyPill, background: pill.bg, color: pill.color }}>
              {pill.text}
            </span>
          </div>
          <p style={styles.panelJobOrg}>
            {job.organization || "Govt Department"}
          </p>
        </div>
      </div>

      <div style={styles.panelJobMetaRow}>
        <span style={styles.panelMetaTag}>
          <MapPin size={10} style={{ marginRight: 3 }} /> {job.state || "Central"}
        </span>
        {job.qualification && (
          <span style={styles.panelMetaTag}>
            {job.qualification}
          </span>
        )}
        <span style={{
          ...styles.panelMetaTag,
          background: (st === "OPEN" || st === "ACTIVE") ? "#dcfce7" : (st === "UPCOMING" ? "#ffedd5" : "#f1f5f9"),
          color: (st === "OPEN" || st === "ACTIVE") ? "#15803d" : (st === "UPCOMING" ? "#c2410c" : "#64748b"),
          fontWeight: 700
        }}>
          {st}
        </span>
      </div>

      <div style={styles.panelCardActions}>
        <button onClick={onView} style={styles.panelViewBtn}>
          <Eye size={12} /> View Details
        </button>
        <a
          href={job.officialApplyUrl || "#"}
          target="_blank"
          rel="noreferrer"
          style={styles.panelApplyBtn}
        >
          Apply Official <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

// ── Single Timeline Event Card Component ──
function TimelineEventCard({ job, accentColor = "#2563eb", isPast = false, onView }) {
  const diffDays = daysDiff(job.lastDate);

  const getPill = () => {
    if (diffDays === 0) {
      return { text: "Ends Today!", bg: "#fee2e2", color: "#dc2626" };
    }
    if (diffDays > 0) {
      return { text: `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`, bg: "#dbeafe", color: "#1d4ed8" };
    }
    const ago = Math.abs(diffDays);
    return { text: `${ago} day${ago !== 1 ? 's' : ''} ago`, bg: "#f1f5f9", color: "#64748b" };
  };

  const pill = getPill();
  const dateObj = new Date(job.lastDate);
  const dayNum = !isNaN(dateObj.getTime()) ? dateObj.getDate() : "15";
  const monthAbbr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "MAY";

  return (
    <div style={{ ...styles.eventCard, borderLeft: `4px solid ${accentColor}` }}>
      <div style={styles.eventLeft}>
        {/* Date Circle Badge */}
        <div style={{ ...styles.dateBadgeCircle, borderColor: accentColor }}>
          <span style={styles.dateBadgeDay}>{dayNum}</span>
          <span style={styles.dateBadgeMonth}>{monthAbbr}</span>
        </div>

        <JobLogo
          url={job.officialApplyUrl}
          organization={job.organization}
          state={job.state}
          title={job.title}
          size={40}
        />

        <div style={styles.eventDetails}>
          <div style={styles.eventTitleRow}>
            <h4 style={styles.eventTitle} onClick={onView} title={job.title}>
              {job.title}
            </h4>
            <span style={{ ...styles.pillDays, background: pill.bg, color: pill.color }}>
              {pill.text}
            </span>
          </div>

          <p style={styles.eventOrg}>{job.organization || "Government Organization"}</p>

          <div style={styles.eventTagsRow}>
            <span style={styles.eventTag}>
              <MapPin size={11} style={{ marginRight: 3 }} /> {job.state || "Central Government"}
            </span>
            {job.qualification && (
              <span style={styles.eventTag}>
                {job.qualification}
              </span>
            )}
            <span style={{ ...styles.statusTag, background: isPast ? "#f1f5f9" : "#dcfce7", color: isPast ? "#64748b" : "#15803d" }}>
              {job.status || "OPEN"}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.eventActions}>
        <button onClick={onView} style={styles.viewBtn}>
          <Eye size={13} /> View
        </button>
        <a
          href={job.officialApplyUrl || "#"}
          target="_blank"
          rel="noreferrer"
          style={styles.applyBtn}
        >
          Apply <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px"
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
    margin: "6px 0 0 0"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap"
  },
  countdownCard: {
    background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
    border: "1px solid #fed7aa",
    borderRadius: "12px",
    padding: "8px 14px",
    display: "flex",
    flexDirection: "column",
    minWidth: "190px",
    boxShadow: "0 2px 6px rgba(249, 115, 22, 0.1)"
  },
  countdownTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "2px"
  },
  countdownTitle: {
    fontSize: "10.5px",
    fontWeight: "800",
    color: "#c2410c",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  countdownValue: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#9a3412",
    fontFamily: "monospace"
  },
  countdownJobName: {
    fontSize: "10.5px",
    color: "#c2410c",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px"
  },
  refreshBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "9px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    transition: "0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
  },
  summaryStrip: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    flexWrap: "wrap",
    gap: "12px"
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px"
  },
  summaryLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  summaryVal: {
    fontSize: "20px",
    fontWeight: "800",
    lineHeight: "1.2"
  },
  summaryDivider: {
    width: "1px",
    height: "28px",
    backgroundColor: "#e2e8f0"
  },
  filterBar: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "14px",
    marginBottom: "20px"
  },
  searchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    color: "#94a3b8",
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 42px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer"
  },
  stateSelectBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  stateSelect: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#0f172a",
    background: "transparent",
    padding: "10px 0",
    cursor: "pointer"
  },
  calendarSplitLayout: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: "20px",
    marginBottom: "28px",
    alignItems: "stretch"
  },
  calendarCardCompact: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column"
  },
  calendarHeaderCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "wrap",
    gap: "10px"
  },
  monthControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  navArrowBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "#334155",
    transition: "0.2s"
  },
  monthTitleCompact: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 6px",
    minWidth: "150px",
    textAlign: "center"
  },
  todayBtn: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginLeft: "4px"
  },
  legendRowCompact: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "11px",
    color: "#64748b"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%"
  },
  weekdaysGridCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    marginBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "6px"
  },
  weekdayCellCompact: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  },
  daysGridCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px"
  },
  dayCellCompact: {
    minHeight: "44px",
    height: "46px",
    borderRadius: "8px",
    padding: "4px 6px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "all 0.15s ease",
    userSelect: "none"
  },
  cellDayNumRowCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cellDayNumCompact: {
    fontSize: "11.5px"
  },
  jobCountBadgeCompact: {
    background: "#10b981",
    color: "#ffffff",
    fontSize: "9.5px",
    fontWeight: "800",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center"
  },
  dotsRowCompact: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    minHeight: "8px"
  },
  miniDotCompact: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0
  },
  moreDotsText: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "800",
    lineHeight: "1"
  },
  dateDetailsPanel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column"
  },
  panelHeroBanner: {
    position: "relative",
    height: "135px",
    width: "100%",
    overflow: "hidden"
  },
  panelHeroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  panelHeroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.88) 100%)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#ffffff"
  },
  panelHeroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  panelBadgeGov: {
    background: "rgba(16, 185, 129, 0.25)",
    border: "1px solid rgba(16, 185, 129, 0.5)",
    backdropFilter: "blur(4px)",
    color: "#6ee7b7",
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center"
  },
  panelHeroClearBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backdropFilter: "blur(4px)"
  },
  panelHeroBottomRow: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  panelHeroTitle: {
    fontSize: "17px",
    fontWeight: "800",
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.3px"
  },
  panelHeroSubtitle: {
    fontSize: "12px",
    color: "#cbd5e1",
    margin: 0
  },
  panelBody: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "370px",
    overflowY: "auto"
  },
  panelJobsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  panelJobCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "0.15s"
  },
  panelJobCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px"
  },
  panelJobTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    cursor: "pointer",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  panelJobOrg: {
    fontSize: "11.5px",
    color: "#64748b",
    margin: "3px 0 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  panelUrgencyPill: {
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "8px",
    whiteSpace: "nowrap"
  },
  panelJobMetaRow: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  panelMetaTag: {
    fontSize: "10px",
    background: "#f1f5f9",
    color: "#475569",
    padding: "2px 6px",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center"
  },
  panelCardActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    paddingTop: "4px",
    borderTop: "1px solid #f1f5f9"
  },
  panelViewBtn: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#1e293b",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  panelApplyBtn: {
    background: "#10b981",
    color: "#ffffff",
    padding: "5px 12px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  panelEmptyState: {
    padding: "30px 16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  panelEmptyIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "grid",
    placeItems: "center",
    marginBottom: "12px"
  },
  panelEmptyTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 6px 0"
  },
  panelEmptySubtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 16px 0",
    maxWidth: "280px"
  },
  panelEmptyActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center"
  },
  panelEmptyBtnPrimary: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "11.5px",
    fontWeight: "700",
    cursor: "pointer"
  },
  panelEmptyBtnSecondary: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "11.5px",
    fontWeight: "700",
    cursor: "pointer"
  },
  panelDefaultOverview: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  spotlightCard: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
    border: "1px solid #a7f3d0",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  spotlightHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  spotlightTag: {
    fontSize: "10.5px",
    fontWeight: "800",
    color: "#047857",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center"
  },
  spotlightTimer: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#065f46",
    fontFamily: "monospace"
  },
  spotlightJobRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  spotlightJobTitle: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  spotlightJobOrg: {
    fontSize: "11px",
    color: "#047857",
    margin: "2px 0 0 0"
  },
  spotlightFooter: {
    display: "flex",
    justifyContent: "flex-end"
  },
  spotlightInspectBtn: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  quickDateChipsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  quickDateChip: {
    flex: 1,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "11.5px",
    fontWeight: "700",
    color: "#334155",
    cursor: "pointer",
    textAlign: "center",
    transition: "0.15s"
  },
  aspirantTipBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  aspirantTipImg: {
    width: "44px",
    height: "44px",
    borderRadius: "8px",
    objectFit: "cover"
  },
  aspirantTipTitle: {
    fontSize: "11.5px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 2px 0"
  },
  aspirantTipText: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.3"
  },
  timelineSection: {
    marginTop: "10px"
  },
  filterNoticeBanner: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "12px",
    padding: "12px 18px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#065f46",
    fontSize: "13.5px"
  },
  clearFilterBtn: {
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  timelineWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "28px"
  },
  timelineGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  stickyGroupHeader: {
    position: "sticky",
    top: "0",
    zIndex: 10,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderLeftWidth: "5px",
    borderRadius: "10px",
    padding: "12px 18px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
  },
  groupHeaderContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px"
  },
  todayPill: {
    background: "#ffedd5",
    color: "#c2410c",
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 9px",
    borderRadius: "12px"
  },
  eventsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  noEventsText: {
    color: "#94a3b8",
    fontSize: "13px",
    fontStyle: "italic",
    padding: "8px 12px",
    margin: 0
  },
  eventCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    flexWrap: "wrap",
    transition: "0.2s"
  },
  eventLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "300px"
  },
  dateBadgeCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "2px solid #2563eb",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  dateBadgeDay: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1"
  },
  dateBadgeMonth: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: "0.5px"
  },
  eventDetails: {
    flex: 1,
    minWidth: 0
  },
  eventTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "3px"
  },
  eventTitle: {
    fontSize: "14.5px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    cursor: "pointer",
    lineHeight: "1.3"
  },
  pillDays: {
    fontSize: "10.5px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "10px"
  },
  eventOrg: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 6px 0"
  },
  eventTagsRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },
  eventTag: {
    fontSize: "10.5px",
    background: "#f1f5f9",
    color: "#475569",
    padding: "2px 7px",
    borderRadius: "5px",
    display: "inline-flex",
    alignItems: "center"
  },
  statusTag: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "5px",
    textTransform: "uppercase"
  },
  eventActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0
  },
  viewBtn: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#1e293b",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  applyBtn: {
    background: "#2563eb",
    color: "#ffffff",
    padding: "7px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "60px 30px",
    textAlign: "center"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "18px",
    maxWidth: "580px",
    width: "100%",
    padding: "28px",
    position: "relative",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  },
  modalCloseBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "#64748b"
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "20px",
    paddingRight: "28px"
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    lineHeight: "1.3"
  },
  modalOrg: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
    margin: "4px 0 0 0"
  },
  modalDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "22px"
  },
  modalDetailItem: {
    display: "flex",
    flexDirection: "column"
  },
  modalDetailLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "3px"
  },
  modalDetailVal: {
    fontSize: "13px",
    color: "#1e293b",
    fontWeight: "600",
    wordBreak: "break-word"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end"
  },
  modalApplyBtn: {
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "11px 22px",
    fontSize: "13.5px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  }
};