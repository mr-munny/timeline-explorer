import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { UNITS, TAGS, getUnit } from "./data/constants";
import { SECTIONS, TEACHER_EMAIL } from "./firebase";
import { subscribeToEvents, submitEvent, deleteEvent, seedDatabase } from "./services/database";
import SEED_EVENTS from "./data/seedEvents";
import VisualTimeline from "./components/VisualTimeline";
import EventCard from "./components/EventCard";
import AddEventPanel from "./components/AddEventPanel";
import ContributorSidebar from "./components/ContributorSidebar";
import ModerationPanel from "./components/ModerationPanel";
import LoginScreen from "./components/LoginScreen";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import plusIcon from "@iconify-icons/mdi/plus";
import logoutIcon from "@iconify-icons/mdi/logout";
import inboxArrowDown from "@iconify-icons/mdi/inbox-arrow-down";
import databasePlusOutline from "@iconify-icons/mdi/database-plus-outline";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import sortAscending from "@iconify-icons/mdi/sort-ascending";
import sortDescending from "@iconify-icons/mdi/sort-descending";
import accountGroup from "@iconify-icons/mdi/account-group";
import filterRemoveOutline from "@iconify-icons/mdi/filter-remove-outline";
import shieldAccountOutline from "@iconify-icons/mdi/shield-account-outline";
import cogOutline from "@iconify-icons/mdi/cog-outline";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import lockOutline from "@iconify-icons/mdi/lock-outline";
import lockOpenVariantOutline from "@iconify-icons/mdi/lock-open-variant-outline";

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher } = useAuth();
  const { theme, mode, toggleTheme, getThemedUnitBg } = useTheme();
  const [allEvents, setAllEvents] = useState([]);
  const [section, setSection] = useState(getInitialSection);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("chrono");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const adminPanelRef = useRef(null);
  const [timelineStart, setTimelineStart] = useState(1910);
  const [timelineEnd, setTimelineEnd] = useState(2000);
  const [draftStart, setDraftStart] = useState("1910");
  const [draftEnd, setDraftEnd] = useState("2000");
  const [timelineRangeLocked, setTimelineRangeLocked] = useState(true);

  const currentYear = new Date().getFullYear();
  const floorToDecade = (value) => Math.floor(value / 10) * 10;
  const ceilToDecade = (value) => Math.ceil(value / 10) * 10;

  const switchSection = (newSection) => {
    setSection(newSection);
    setExpandedEvent(null);
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set("section", newSection);
    window.history.replaceState({}, "", url);
  };

  // Subscribe to Firebase events in real-time
  useEffect(() => {
    if (!user) return;

    // Teacher with ?section=all sees everything; students see their section
    const listenSection = isTeacher && section === "all" ? "all" : section;

    const unsubscribe = subscribeToEvents(listenSection, (events) => {
      setAllEvents(events);
    });

    return () => unsubscribe();
  }, [user, section, isTeacher]);

  // Close admin panel on outside click
  useEffect(() => {
    if (!showAdminPanel) return;
    const handleClick = (e) => {
      if (adminPanelRef.current && !adminPanelRef.current.contains(e.target)) {
        setShowAdminPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAdminPanel]);

  // Approved events for the main timeline
  const approvedEvents = useMemo(
    () => allEvents.filter((e) => e.status === "approved"),
    [allEvents]
  );

  // Pending events for the moderation panel
  const pendingEvents = useMemo(
    () => allEvents.filter((e) => e.status === "pending"),
    [allEvents]
  );

  // Filtered + sorted events for display
  const filteredEvents = useMemo(() => {
    let evts = [...approvedEvents];
    if (selectedUnit !== "all") evts = evts.filter((e) => e.unit === selectedUnit);
    if (selectedTag !== "all") evts = evts.filter((e) => (e.tags || []).includes(selectedTag));
    if (isTeacher && sectionFilter !== "all") {
      evts = evts.filter((e) => e.section === sectionFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      evts = evts.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.addedBy.toLowerCase().includes(term) ||
          (e.region && e.region.toLowerCase().includes(term))
      );
    }
    evts.sort((a, b) =>
      sortOrder === "chrono" ? a.year - b.year : b.year - a.year
    );
    return evts;
  }, [approvedEvents, selectedUnit, selectedTag, searchTerm, sortOrder, isTeacher, sectionFilter]);

  const handleAddEvent = useCallback(
    async (formData) => {
      await submitEvent({
        ...formData,
        addedBy: user.displayName || user.email.split("@")[0],
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: section === "all" ? "Period1" : section,
      });
    },
    [user, section]
  );

  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      await deleteEvent(eventId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  const handleSeed = async () => {
    if (!window.confirm("Seed the database with 25 sample events? Only do this once.")) return;
    setSeeding(true);
    try {
      await seedDatabase(SEED_EVENTS);
      setSeeded(true);
    } catch (err) {
      console.error("Seed failed:", err);
    }
    setSeeding(false);
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'Overpass Mono', monospace",
          color: theme.textSecondary,
          fontSize: 13,
          background: theme.pageBg,
        }}
      >
        Loading...
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginScreen onLogin={login} error={authError} />;
  }

  const studentCount = [
    ...new Set(
      approvedEvents.filter((e) => e.addedByEmail !== TEACHER_EMAIL).map((e) => e.addedBy)
    ),
  ].length;

  return (
    <div
      style={{
        fontFamily: "'Newsreader', 'Georgia', serif",
        background: theme.pageBg,
        minHeight: "100vh",
        color: theme.pageText,
        colorScheme: mode,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`* { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }`}</style>

      {/* Header */}
      <div style={{ background: theme.headerBg, color: theme.headerText, padding: "24px 28px 16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.accentGold,
                    fontFamily: "'Overpass Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: theme.accentGoldSubtle,
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  Historian's Workshop
                </span>
                {isTeacher && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: theme.teacherGreen,
                      fontFamily: "'Overpass Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: theme.teacherGreenSubtle,
                      padding: "3px 8px",
                      borderRadius: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon icon={shieldAccountOutline} width={12} />
                    Teacher View
                  </span>
                )}
                {isTeacher && (
                  <div ref={adminPanelRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowAdminPanel((prev) => !prev)}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: showAdminPanel ? theme.bg : theme.teacherGreen,
                        fontFamily: "'Overpass Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: showAdminPanel ? theme.teacherGreen : theme.teacherGreenSubtle,
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon icon={cogOutline} width={12} />
                      Admin
                      <Icon icon={chevronDown} width={12} style={{
                        transform: showAdminPanel ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s",
                      }} />
                    </button>
                    {showAdminPanel && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          left: 0,
                          background: theme.cardBg,
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: 8,
                          padding: 12,
                          minWidth: 220,
                          zIndex: 999,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                          fontFamily: "'Overpass Mono', monospace",
                        }}
                      >
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: theme.mutedText,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                          Timeline Range
                          <button
                            onClick={() => setTimelineRangeLocked((v) => !v)}
                            title={timelineRangeLocked ? "Unlock to edit" : "Lock value"}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 2,
                              cursor: "pointer",
                              color: timelineRangeLocked ? theme.textMuted : theme.teacherGreen,
                              display: "inline-flex",
                              transition: "color 0.15s",
                            }}
                          >
                            <Icon icon={timelineRangeLocked ? lockOutline : lockOpenVariantOutline} width={12} />
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{
                              fontSize: 9,
                              color: theme.textSecondary,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 600,
                              marginBottom: 3,
                              display: "block",
                            }}>Start</label>
                            <input
                              type="number"
                              value={draftStart}
                              step={10}
                              disabled={timelineRangeLocked}
                              onChange={(e) => setDraftStart(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                              onBlur={() => {
                                const v = floorToDecade(Math.max(0, Math.min(Number(draftStart), timelineEnd - 10)));
                                setTimelineStart(v);
                                setDraftStart(String(v));
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                border: `1.5px solid ${theme.inputBorder}`,
                                borderRadius: 6,
                                fontSize: 12,
                                fontFamily: "'Overpass Mono', monospace",
                                fontWeight: 700,
                                background: theme.inputBg,
                                color: theme.textPrimary,
                                outline: "none",
                                boxSizing: "border-box",
                                textAlign: "center",
                                opacity: timelineRangeLocked ? 0.5 : 1,
                                cursor: timelineRangeLocked ? "not-allowed" : "text",
                                transition: "opacity 0.15s",
                              }}
                            />
                          </div>
                          <span style={{
                            fontSize: 12,
                            color: theme.textMuted,
                            marginTop: 14,
                          }}>–</span>
                          <div style={{ flex: 1 }}>
                            <label style={{
                              fontSize: 9,
                              color: theme.textSecondary,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 600,
                              marginBottom: 3,
                              display: "block",
                            }}>End</label>
                            <input
                              type="number"
                              value={draftEnd}
                              step={10}
                              disabled={timelineRangeLocked}
                              onChange={(e) => setDraftEnd(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                              onBlur={() => {
                                const maxEnd = ceilToDecade(currentYear);
                                const v = ceilToDecade(Math.max(timelineStart + 10, Math.min(Number(draftEnd), maxEnd)));
                                setTimelineEnd(v);
                                setDraftEnd(String(v));
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                border: `1.5px solid ${theme.inputBorder}`,
                                borderRadius: 6,
                                fontSize: 12,
                                fontFamily: "'Overpass Mono', monospace",
                                fontWeight: 700,
                                background: theme.inputBg,
                                color: theme.textPrimary,
                                outline: "none",
                                boxSizing: "border-box",
                                textAlign: "center",
                                opacity: timelineRangeLocked ? 0.5 : 1,
                                cursor: timelineRangeLocked ? "not-allowed" : "text",
                                transition: "opacity 0.15s",
                              }}
                            />
                          </div>
                        </div>
                        <div style={{
                          fontSize: 9,
                          color: theme.textMuted,
                          marginTop: 6,
                          textAlign: "center",
                          letterSpacing: "0.05em",
                        }}>
                          {timelineEnd - timelineStart} year span · snaps to decade
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  margin: "6px 0 0 0",
                  fontFamily: "'Newsreader', 'Georgia', serif",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon icon={chartTimelineVariantShimmer} width={26} style={{ color: "#F59E0B" }} />
                Timeline Explorer
              </h1>
              <p
                style={{
                  fontSize: 11,
                  color: theme.headerSubtext,
                  margin: "6px 0 0 0",
                  fontFamily: "'Overpass Mono', monospace",
                }}
              >
                {approvedEvents.length} events &middot; {studentCount} student
                historians &middot;{" "}
                {[...new Set(approvedEvents.map((e) => e.unit))].length} units
              </p>
              {/* View switcher (teacher only) */}
              {isTeacher && (
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  {["all", ...SECTIONS].map((s) => {
                    const isActive = section === s;
                    const label = s === "all" ? "All Sections" : s;
                    return (
                      <button
                        key={s}
                        onClick={() => switchSection(s)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "none",
                          background: isActive ? theme.accentGold : theme.headerButtonBg,
                          color: isActive ? theme.headerBg : theme.headerSubtext,
                          fontSize: 11,
                          fontFamily: "'Overpass Mono', monospace",
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* TEMPORARY: Remove after seeding */}
              {isTeacher && !seeded && approvedEvents.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  style={{
                    padding: "10px 18px",
                    background: theme.seedPurple,
                    color: theme.headerText,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: 700,
                    cursor: seeding ? "default" : "pointer",
                  }}
                >
                  <Icon icon={databasePlusOutline} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {seeding ? "Seeding..." : "Seed Database"}
                </button>
              )}
              {isTeacher && pendingEvents.length > 0 && (
                <button
                  onClick={() => setShowModeration(true)}
                  style={{
                    padding: "10px 18px",
                    background: theme.errorRed,
                    color: theme.headerText,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: 700,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <Icon icon={inboxArrowDown} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Review ({pendingEvents.length})
                </button>
              )}
              <button
                onClick={() => setShowAddPanel(true)}
                style={{
                  padding: "10px 18px",
                  background: theme.accentGold,
                  color: theme.headerBg,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                <Icon icon={plusIcon} width={14} style={{ verticalAlign: "middle", marginRight: 2 }} />
                Add Event
              </button>
              <button
                onClick={toggleTheme}
                title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  color: theme.headerSubtext,
                  border: `1px solid ${theme.headerBorder}`,
                  borderRadius: 8,
                  fontSize: 16,
                  fontFamily: "'Overpass Mono', monospace",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {mode === "dark" ? "\u2600" : "\u263E"}
              </button>
              <button
                onClick={logout}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  color: theme.headerSubtext,
                  border: `1px solid ${theme.headerBorder}`,
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Icon icon={logoutIcon} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <VisualTimeline
            filteredEvents={filteredEvents}
            onEraClick={setSelectedUnit}
            selectedUnit={selectedUnit}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            currentYear={currentYear}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 28px" }}>
        {/* Filters row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 200px", position: "relative", minWidth: 160 }}>
            <Icon
              icon={magnifyIcon}
              width={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: theme.textSecondary,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search events, people, regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 30px",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "'Overpass Mono', monospace",
                background: theme.inputBg,
                color: theme.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              cursor: "pointer",
              color:
                selectedUnit === "all"
                  ? theme.textSecondary
                  : getUnit(selectedUnit)?.color,
              fontWeight: selectedUnit === "all" ? 500 : 700,
            }}
          >
            <option value="all">All Units</option>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              cursor: "pointer",
              color: selectedTag === "all" ? theme.textSecondary : theme.textPrimary,
            }}
          >
            <option value="all">All Tags</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {isTeacher && section === "all" && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                background: theme.inputBg,
                cursor: "pointer",
                color: sectionFilter === "all" ? theme.textSecondary : theme.textPrimary,
              }}
            >
              <option value="all">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setSortOrder((s) => (s === "chrono" ? "reverse" : "chrono"))}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              cursor: "pointer",
              color: theme.textTertiary,
            }}
          >
            <Icon icon={sortOrder === "chrono" ? sortAscending : sortDescending} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />
            {sortOrder === "chrono" ? "Oldest" : "Newest"}
          </button>
          <button
            onClick={() => setShowContributors((s) => !s)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${showContributors ? theme.activeToggleBg : theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: showContributors ? theme.activeToggleBg : theme.inputBg,
              color: showContributors ? theme.activeToggleText : theme.textTertiary,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <Icon icon={accountGroup} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Contributors
          </button>
        </div>

        {/* Active filters */}
        {(selectedUnit !== "all" ||
          selectedTag !== "all" ||
          searchTerm ||
          sectionFilter !== "all") && (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: theme.textMuted,
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              Showing:
            </span>
            {selectedUnit !== "all" && (
              <span
                style={{
                  fontSize: 10,
                  background: getThemedUnitBg(selectedUnit) || getUnit(selectedUnit)?.bg,
                  color: getUnit(selectedUnit)?.color,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                }}
              >
                {getUnit(selectedUnit)?.label}
              </span>
            )}
            {selectedTag !== "all" && (
              <span
                style={{
                  fontSize: 10,
                  background: theme.subtleBg,
                  color: theme.textDescription,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {selectedTag}
              </span>
            )}
            {sectionFilter !== "all" && (
              <span
                style={{
                  fontSize: 10,
                  background: theme.subtleBg,
                  color: theme.textDescription,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {sectionFilter}
              </span>
            )}
            {searchTerm && (
              <span
                style={{
                  fontSize: 10,
                  background: theme.subtleBg,
                  color: theme.textDescription,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                }}
              >
                "{searchTerm}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedUnit("all");
                setSelectedTag("all");
                setSearchTerm("");
                setSectionFilter("all");
              }}
              style={{
                fontSize: 10,
                color: theme.errorRed,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
              }}
            >
              <Icon icon={filterRemoveOutline} width={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
              Clear
            </button>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: theme.textSecondary,
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              {filteredEvents.length} of {approvedEvents.length} events
            </span>
          </div>
        )}

        {/* Content area */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Event list */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  color: theme.textSecondary,
                  fontFamily: "'Overpass Mono', monospace",
                  fontSize: 12,
                }}
              >
                No events match your filters.
              </div>
            ) : (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEvent === event.id}
                  onToggle={() =>
                    setExpandedEvent(
                      expandedEvent === event.id ? null : event.id
                    )
                  }
                  isTeacher={isTeacher}
                  onDelete={handleDeleteEvent}
                />
              ))
            )}
          </div>

          {/* Contributors sidebar */}
          {showContributors && (
            <div style={{ width: 220, flexShrink: 0 }}>
              <ContributorSidebar events={approvedEvents} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            padding: "16px 0",
            borderTop: `1px solid ${theme.cardBorder}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: theme.textMuted,
              fontFamily: "'Overpass Mono', monospace",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Historian's Workshop Timeline Explorer &middot; {section !== "all" ? section : "All Sections"}
            <br />
            Signed in as {user.displayName || user.email}
          </p>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddPanel && (
        <AddEventPanel
          onAdd={handleAddEvent}
          onClose={() => setShowAddPanel(false)}
          userName={user.displayName || user.email.split("@")[0]}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      )}

      {/* Moderation Modal (teacher only) */}
      {showModeration && isTeacher && (
        <ModerationPanel
          pendingEvents={pendingEvents}
          onClose={() => setShowModeration(false)}
        />
      )}
    </div>
  );
}
