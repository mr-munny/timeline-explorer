import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { TAGS, getPeriod, DEFAULT_PERIODS } from "./data/constants";
import { compareEventDates } from "./utils/dateUtils";
import { TEACHER_EMAIL } from "./firebase";
import { subscribeToEvents, submitEvent, deleteEvent, updateEvent, seedDatabase, subscribeToPeriods, subscribeToAllSectionPeriods, savePeriods, subscribeToSections, saveSections, subscribeToCompellingQuestion, saveCompellingQuestion, subscribeToTimelineRange, subscribeToAllSectionTimelineRanges, saveTimelineRange, subscribeToFieldConfig, saveFieldConfig, assignStudentSection, subscribeToAllStudentSections, reassignStudentSection, removeStudentSection, subscribeToConnections, submitConnection, deleteConnection, updateConnection } from "./services/database";
import { writeToSheet } from "./services/sheets";
import SEED_EVENTS from "./data/seedEvents";
import VisualTimeline from "./components/VisualTimeline";
import EventCard from "./components/EventCard";
import AddEventPanel from "./components/AddEventPanel";
import AddConnectionPanel from "./components/AddConnectionPanel";
import ConnectionLines from "./components/ConnectionLines";
import ContributorSidebar from "./components/ContributorSidebar";
import AdminView from "./components/AdminView";
import ModerationPanel from "./components/ModerationPanel";
import LoginScreen from "./components/LoginScreen";
import SectionPicker from "./components/SectionPicker";
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
import vectorLink from "@iconify-icons/mdi/vector-link";
import cogOutline from "@iconify-icons/mdi/cog-outline";
import arrowLeft from "@iconify-icons/mdi/arrow-left";

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher, userSection, sectionLoading } = useAuth();
  const { theme, mode, toggleTheme, getThemedPeriodBg } = useTheme();
  const userName = user ? (user.displayName || user.email.split("@")[0]) : "";
  const [allEvents, setAllEvents] = useState([]);
  const [section, setSection] = useState(getInitialSection);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("chrono");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showContributors, setShowContributors] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [timelineStart, setTimelineStart] = useState(1910);
  const [timelineEnd, setTimelineEnd] = useState(2000);
  const [periods, setPeriods] = useState([]);
  const [allSectionPeriods, setAllSectionPeriods] = useState({});
  const [sections, setSections] = useState(null);
  const [compellingQuestion, setCompellingQuestion] = useState({ text: "", enabled: false });
  const [fieldConfig, setFieldConfig] = useState(null);
  const [allStudentAssignments, setAllStudentAssignments] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [showAddConnectionPanel, setShowAddConnectionPanel] = useState(false);
  const [connectionMode, setConnectionMode] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const eventListRef = useRef(null);
  const [readEvents, setReadEvents] = useState(() => {
    if (!user) return new Set();
    try {
      const stored = localStorage.getItem(`readEvents_${user.uid}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const activeSections = useMemo(() => sections || [], [sections]);
  const defaultSection = section === "all" ? (activeSections[0]?.id || "Period1") : section;

  const getSectionName = useCallback(
    (id) => activeSections.find((s) => s.id === id)?.name || id,
    [activeSections]
  );

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

  // Re-initialize readEvents when user changes
  useEffect(() => {
    if (!user) { setReadEvents(new Set()); return; }
    try {
      const stored = localStorage.getItem(`readEvents_${user.uid}`);
      setReadEvents(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setReadEvents(new Set()); }
  }, [user]);

  // Mark event as read when expanded
  useEffect(() => {
    if (!expandedEvent || !user) return;
    setReadEvents((prev) => {
      if (prev.has(expandedEvent)) return prev;
      const next = new Set(prev);
      next.add(expandedEvent);
      try { localStorage.setItem(`readEvents_${user.uid}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [expandedEvent, user]);

  // Subscribe to Firebase events in real-time
  useEffect(() => {
    if (!user) return;

    // Teacher with ?section=all or admin view open sees everything; students see their section
    const listenSection = isTeacher && (section === "all" || showAdminView) ? "all" : section;

    const unsubscribe = subscribeToEvents(listenSection, (events) => {
      setAllEvents(events);
    });

    return () => unsubscribe();
  }, [user, section, isTeacher, showAdminView]);

  // Subscribe to Firebase connections in real-time
  useEffect(() => {
    if (!user) return;
    const listenSection = isTeacher && (section === "all" || showAdminView) ? "all" : section;
    const unsubscribe = subscribeToConnections(listenSection, (connections) => {
      setAllConnections(connections);
    });
    return () => unsubscribe();
  }, [user, section, isTeacher, showAdminView]);

  // Subscribe to sections from Firebase
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSections((data) => {
      setSections(data || []);
    });
    return () => unsub();
  }, [user]);

  // Lock student to their assigned section (overrides URL param)
  useEffect(() => {
    if (!isTeacher && userSection) {
      // If the assigned section still exists, lock to it
      if (activeSections.length === 0 || activeSections.some((s) => s.id === userSection)) {
        setSection(userSection);
        const url = new URL(window.location);
        url.searchParams.set("section", userSection);
        window.history.replaceState({}, "", url);
      }
      // If the section was deleted, userSection won't match — treated as unassigned in render gate
    }
  }, [isTeacher, userSection, activeSections]);

  // Subscribe to all student assignments (teacher roster)
  useEffect(() => {
    if (!user || !isTeacher) return;
    const unsub = subscribeToAllStudentSections((assignments) => {
      setAllStudentAssignments(assignments);
    });
    return () => unsub();
  }, [user, isTeacher]);

  // Section mutation handlers
  const handleAddSection = useCallback((name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = activeSections.some((s) => s.id === slug) ? `${slug}-${Date.now()}` : slug;
    const updated = [...activeSections, { id, name }];
    setSections(updated);
    saveSections(updated);
    // Initialize new section with sensible defaults
    savePeriods(id, DEFAULT_PERIODS);
    saveCompellingQuestion(id, { text: "", enabled: false });
    saveTimelineRange(id, { start: 1900, end: 2000 });
    saveFieldConfig(id, {
      title: "mandatory", year: "mandatory", month: "hidden", day: "hidden",
      endDate: "hidden", period: "mandatory", tags: "mandatory", sourceType: "mandatory",
      description: "mandatory", sourceNote: "optional", sourceUrl: "optional",
      imageUrl: "optional", region: "optional",
    });
  }, [activeSections]);

  const handleDeleteSection = useCallback((id) => {
    const updated = activeSections.filter((s) => s.id !== id);
    setSections(updated);
    saveSections(updated);
    if (section === id) {
      switchSection(updated.length > 0 ? updated[0].id : "all");
    }
  }, [activeSections, section]);

  const handleRenameSection = useCallback((id, newName) => {
    const updated = activeSections.map((s) => s.id === id ? { ...s, name: newName } : s);
    setSections(updated);
    saveSections(updated);
  }, [activeSections]);

  // Subscribe to section-specific periods
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionPeriods(activeSections.map((s) => s.id), (periodsMap) => {
        setAllSectionPeriods(periodsMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToPeriods(effectiveSection, (data) => {
        setPeriods(data || []);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections]);

  // Subscribe to section-specific compelling question
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      // CQ not displayed for "all" view — no subscription needed
      return;
    } else {
      const unsub = subscribeToCompellingQuestion(effectiveSection, (data) => {
        setCompellingQuestion(data || { text: "", enabled: false });
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections]);

  // Default field config — defines which fields are mandatory/optional/hidden
  const DEFAULT_FIELD_CONFIG = useMemo(() => ({
    title: "mandatory",
    year: "mandatory",
    month: "hidden",
    day: "hidden",
    endDate: "hidden",
    period: "mandatory",
    tags: "mandatory",
    sourceType: "mandatory",
    description: "mandatory",
    sourceNote: "mandatory",
    sourceUrl: "optional",
    imageUrl: "optional",
    region: "optional",
  }), []);

  // Active field config (merged with defaults)
  const activeFieldConfig = useMemo(() => ({
    ...DEFAULT_FIELD_CONFIG,
    ...(fieldConfig || {}),
  }), [fieldConfig, DEFAULT_FIELD_CONFIG]);

  // Subscribe to section-specific timeline range
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionTimelineRanges(activeSections.map((s) => s.id), (rangeMap) => {
        let minStart = 1910, maxEnd = 2000;
        let hasAny = false;
        for (const sec of Object.keys(rangeMap)) {
          if (rangeMap[sec]) {
            hasAny = true;
            minStart = Math.min(minStart, rangeMap[sec].start);
            maxEnd = Math.max(maxEnd, rangeMap[sec].end);
          }
        }
        if (hasAny) {
          setTimelineStart(minStart);
          setTimelineEnd(maxEnd);
        }
      });
      return () => unsub();
    } else {
      const unsub = subscribeToTimelineRange(effectiveSection, (data) => {
        if (data) {
          setTimelineStart(data.start);
          setTimelineEnd(data.end);
        }
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections]);

  // Subscribe to section-specific field config
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      // Field config not needed for "all" view on timeline
      return;
    } else {
      const unsub = subscribeToFieldConfig(effectiveSection, (data) => {
        setFieldConfig(data);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher]);

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

  const approvedConnections = useMemo(
    () => allConnections.filter((c) => c.status === "approved"),
    [allConnections]
  );

  const pendingConnections = useMemo(
    () => allConnections.filter((c) => c.status === "pending"),
    [allConnections]
  );

  // Lookup: eventId -> { causes: [connections where event is cause], effects: [connections where event is effect] }
  const connectionsByEvent = useMemo(() => {
    const map = {};
    for (const conn of approvedConnections) {
      if (!map[conn.causeEventId]) map[conn.causeEventId] = { causes: [], effects: [] };
      map[conn.causeEventId].causes.push(conn);
      if (!map[conn.effectEventId]) map[conn.effectEventId] = { causes: [], effects: [] };
      map[conn.effectEventId].effects.push(conn);
    }
    return map;
  }, [approvedConnections]);

  // Filtered + sorted events for display
  const filteredEvents = useMemo(() => {
    let evts = [...approvedEvents];
    if (selectedPeriod !== "all") evts = evts.filter((e) => e.period === selectedPeriod);
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
    evts.sort((a, b) => {
      const cmp = compareEventDates(a, b);
      return sortOrder === "chrono" ? cmp : -cmp;
    });
    return evts;
  }, [approvedEvents, selectedPeriod, selectedTag, searchTerm, sortOrder, isTeacher, sectionFilter]);

  const filteredEventIds = useMemo(
    () => new Set(filteredEvents.map((e) => e.id)),
    [filteredEvents]
  );

  // Merge periods from all sections for "all" view
  const mergedPeriods = useMemo(() => {
    if (section !== "all" || Object.keys(allSectionPeriods).length === 0) return periods;
    const seen = new Set();
    const result = [];
    for (const sec of activeSections) {
      for (const p of (allSectionPeriods[sec.id] || [])) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          result.push(p);
        }
      }
    }
    return result;
  }, [section, allSectionPeriods, periods, activeSections]);

  const displayPeriods = section === "all" ? mergedPeriods : periods;
  const findPeriod = (id) => getPeriod(displayPeriods, id);
  const displayCQ = section === "all" ? null : compellingQuestion;

  // Auto-expand timeline range when event outside range is approved
  const handleEventApproved = useCallback((event) => {
    const year = Number(event.year);
    if (isNaN(year)) return;
    const endYear = event.endYear ? Number(event.endYear) : null;
    let newStart = timelineStart;
    let newEnd = timelineEnd;
    let changed = false;
    if (year < timelineStart) {
      newStart = floorToDecade(year);
      changed = true;
    }
    const maxYear = endYear && !isNaN(endYear) ? Math.max(year, endYear) : year;
    if (maxYear > timelineEnd) {
      newEnd = ceilToDecade(maxYear);
      changed = true;
    }
    if (changed) {
      setTimelineStart(newStart);
      setTimelineEnd(newEnd);
      // Persist to the event's section (or current section)
      const targetSection = event.section || section;
      if (targetSection && targetSection !== "all") {
        saveTimelineRange(targetSection, { start: newStart, end: newEnd });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineStart, timelineEnd, section]);

  const handleAddEvent = useCallback(
    async (formData) => {
      const eventData = {
        ...formData,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: defaultSection,
        ...(isTeacher ? { status: "approved" } : {}),
      };
      await submitEvent(eventData);
      if (isTeacher) {
        writeToSheet(eventData);
        handleEventApproved(eventData);
      }
    },
    [user, isTeacher, userName, defaultSection, handleEventApproved]
  );

  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      await deleteEvent(eventId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
  }, []);

  const handleSaveEdit = useCallback(
    async (formData) => {
      const updates = {
        ...formData,
        year: parseInt(formData.year),
        month: formData.month ? parseInt(formData.month) : null,
        day: formData.day ? parseInt(formData.day) : null,
        endYear: formData.endYear ? parseInt(formData.endYear) : null,
        endMonth: formData.endMonth ? parseInt(formData.endMonth) : null,
        endDay: formData.endDay ? parseInt(formData.endDay) : null,
      };
      // Compute which fields changed for edit history
      const changeFields = ["title", "year", "month", "day", "endYear", "endMonth", "endDay", "period", "tags", "sourceType", "description", "sourceNote", "sourceUrl", "imageUrl", "region"];
      const changes = {};
      for (const key of changeFields) {
        const oldVal = editingEvent[key];
        const newVal = updates[key] !== undefined ? updates[key] : oldVal;
        const isEqual = key === "tags" ? JSON.stringify(oldVal) === JSON.stringify(newVal) : String(oldVal ?? "") === String(newVal ?? "");
        if (!isEqual) changes[key] = { from: oldVal ?? null, to: newVal ?? null };
      }
      if (isTeacher) {
        // Teacher: apply edit directly, append to edit history
        const existingHistory = editingEvent.editHistory || [];
        await updateEvent(editingEvent.id, {
          ...updates,
          editHistory: [...existingHistory, {
            name: userName,
            email: user.email,
            date: new Date().toISOString(),
            changes,
          }],
        });
      } else {
        // Student: submit as pending edit proposal
        await submitEvent({
          ...updates,
          editOf: editingEvent.id,
          addedBy: userName,
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingEvent.section || (defaultSection),
        });
      }
    },
    [editingEvent, isTeacher, user, userName, defaultSection]
  );

  const handleAddConnection = useCallback(
    async (formData) => {
      await submitConnection({
        ...formData,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: defaultSection,
        ...(isTeacher ? { status: "approved" } : {}),
      });
    },
    [user, isTeacher, userName, defaultSection]
  );

  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      await deleteConnection(connectionId);
    } catch (err) {
      console.error("Delete connection failed:", err);
    }
  }, []);

  const handleSuggestDeleteConnection = useCallback(async (connection) => {
    if (!window.confirm("Suggest this connection be deleted? A teacher will review your request.")) return;
    try {
      await submitConnection({
        deleteOf: connection.id,
        causeEventId: connection.causeEventId,
        effectEventId: connection.effectEventId,
        description: connection.description,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: connection.section || (defaultSection),
      });
    } catch (err) {
      console.error("Suggest delete connection failed:", err);
    }
  }, [user, userName, defaultSection]);

  const handleEditConnection = useCallback((connection) => {
    setEditingConnection(connection);
  }, []);

  const handleSaveConnectionEdit = useCallback(
    async (formData) => {
      const changeFields = ["description", "causeEventId", "effectEventId"];
      const changes = {};
      for (const key of changeFields) {
        const oldVal = editingConnection[key];
        const newVal = formData[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          changes[key] = { from: oldVal ?? null, to: newVal ?? null };
        }
      }
      if (isTeacher) {
        const existingHistory = editingConnection.editHistory || [];
        await updateConnection(editingConnection.id, {
          ...formData,
          editHistory: [...existingHistory, {
            name: userName,
            email: user.email,
            date: new Date().toISOString(),
            changes,
          }],
        });
      } else {
        await submitConnection({
          ...formData,
          editOf: editingConnection.id,
          addedBy: userName,
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingConnection.section || (defaultSection),
        });
      }
    },
    [editingConnection, isTeacher, user, userName, defaultSection]
  );

  const handleConnectionModeClick = useCallback((eventId) => {
    if (!connectionMode) return;
    if (connectionMode.step === "selectCause") {
      setConnectionMode({ step: "selectEffect", causeEventId: eventId });
    } else if (connectionMode.step === "selectEffect") {
      if (eventId === connectionMode.causeEventId) return;
      setConnectionMode({ ...connectionMode, step: "describe", effectEventId: eventId });
    }
  }, [connectionMode]);

  const handleScrollToEvent = useCallback((eventId) => {
    setExpandedEvent(eventId);
    setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${eventId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  // Escape key exits connection mode
  useEffect(() => {
    if (!connectionMode) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setConnectionMode(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [connectionMode]);


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
  if (loading || (!user ? false : !isTeacher && sectionLoading)) {
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

  const sectionStillExists = activeSections.some((s) => s.id === userSection);
  if (!isTeacher && (!userSection || (activeSections.length > 0 && !sectionStillExists))) {
    return (
      <SectionPicker
        sections={activeSections}
        onSelect={async (sectionId) => {
          await assignStudentSection(user.uid, sectionId, user.email, userName);
        }}
        userName={userName}
      />
    );
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
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 2,
                }}
              >
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
                {isTeacher && !showAdminView && (
                  <button
                    onClick={() => setShowAdminView(true)}
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
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.teacherGreen + "35"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = theme.teacherGreenSubtle; }}
                  >
                    <Icon icon={cogOutline} width={12} />
                    Admin
                    {(pendingEvents.length + pendingConnections.length) > 0 && (
                      <span style={{
                        background: theme.errorRed,
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 8,
                        marginLeft: 2,
                      }}>
                        {pendingEvents.length + pendingConnections.length}
                      </span>
                    )}
                  </button>
                )}
                {showAdminView && (
                  <button
                    onClick={() => setShowAdminView(false)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: theme.headerSubtext,
                      fontFamily: "'Overpass Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: theme.headerButtonBg,
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.headerBorder + "60"; e.currentTarget.style.color = theme.headerText; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = theme.headerButtonBg; e.currentTarget.style.color = theme.headerSubtext; }}
                  >
                    <Icon icon={arrowLeft} width={12} />
                    Back to Timeline
                  </button>
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
              {!showAdminView && (
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
                  {[...new Set(approvedEvents.map((e) => e.period))].length} time periods
                </p>
              )}
              {showAdminView && (
                <p
                  style={{
                    fontSize: 11,
                    color: theme.headerSubtext,
                    margin: "6px 0 0 0",
                    fontFamily: "'Overpass Mono', monospace",
                  }}
                >
                  Administration
                </p>
              )}
              {/* View switcher (teacher only, hidden in admin) */}
              {isTeacher && !showAdminView && (
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  {[{ id: "all", name: "All Sections" }, ...activeSections].map((s) => {
                    const isActive = section === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => switchSection(s.id)}
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
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.headerBorder + "60"; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = theme.headerButtonBg; }}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", position: "absolute", top: 0, right: 0 }}>
              {!showAdminView && (
                <>
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
                        transition: "filter 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!seeding) e.currentTarget.style.filter = "brightness(1.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    >
                      <Icon icon={databasePlusOutline} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      {seeding ? "Seeding..." : "Seed Database"}
                    </button>
                  )}
                  {isTeacher && (pendingEvents.length + pendingConnections.length) > 0 && (
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
                        transition: "filter 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    >
                      <Icon icon={inboxArrowDown} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      Review ({pendingEvents.length + pendingConnections.length})
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
                      transition: "filter 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                  >
                    <Icon icon={plusIcon} width={14} style={{ verticalAlign: "middle", marginRight: 2 }} />
                    Add Event
                  </button>
                  <button
                    onClick={() => setShowAddConnectionPanel(true)}
                    style={{
                      padding: "10px 18px",
                      background: "transparent",
                      color: theme.accentGold,
                      border: `1.5px solid ${theme.accentGold}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "'Overpass Mono', monospace",
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.accentGold + "15"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon icon={vectorLink} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Add Connection
                  </button>
                  <button
                    onClick={() => setConnectionMode(connectionMode ? null : { step: "selectCause" })}
                    style={{
                      padding: "10px 14px",
                      background: connectionMode ? theme.accentGold : "transparent",
                      color: connectionMode ? theme.headerBg : theme.headerSubtext,
                      border: `1px solid ${connectionMode ? theme.accentGold : theme.headerBorder}`,
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "'Overpass Mono', monospace",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!connectionMode) e.currentTarget.style.background = theme.headerBorder + "40"; }}
                    onMouseLeave={(e) => { if (!connectionMode) e.currentTarget.style.background = "transparent"; }}
                    title="Click two events to connect them"
                  >
                    <Icon icon={vectorLink} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {connectionMode ? "Exit Connect Mode" : "Connect Events"}
                  </button>
                </>
              )}
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
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.headerBorder + "40"; e.currentTarget.style.color = theme.headerText; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.headerSubtext; }}
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
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.headerBorder + "40"; e.currentTarget.style.color = theme.headerText; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.headerSubtext; }}
              >
                <Icon icon={logoutIcon} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Sign Out
              </button>
            </div>
        </div>
      </div>

      {/* Admin View (full page, replaces timeline content) */}
      {showAdminView && isTeacher && (
        <AdminView
          sections={activeSections}
          pendingEvents={pendingEvents}
          pendingConnections={pendingConnections}
          allEvents={approvedEvents}
          allConnections={allConnections}
          allStudentAssignments={allStudentAssignments}
          getSectionName={getSectionName}
          onClose={() => setShowAdminView(false)}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onRenameSection={handleRenameSection}
          onEventApproved={handleEventApproved}
          displayPeriods={displayPeriods}
          reassignStudentSection={reassignStudentSection}
          removeStudentSection={removeStudentSection}
        />
      )}

      {/* Timeline Content (hidden when admin view is open) */}
      {!showAdminView && (
        <>
      {/* Compelling Question Hero */}
      {displayCQ && displayCQ.enabled && displayCQ.text.trim() && (
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
          <div style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "24px 28px 20px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: theme.textMuted,
              fontFamily: "'Overpass Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              Compelling Question
            </div>
            <p style={{
              fontSize: 20,
              fontWeight: 600,
              fontFamily: "'Newsreader', 'Georgia', serif",
              color: theme.textPrimary,
              lineHeight: 1.4,
              margin: 0,
              fontStyle: "italic",
              maxWidth: 680,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              {displayCQ.text}
            </p>
          </div>
        </div>
      )}

      {/* Visual Timeline */}
      <div data-timeline-section style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <VisualTimeline
            filteredEvents={filteredEvents}
            onEraClick={setSelectedPeriod}
            onEventSelect={(id) => {
              setExpandedEvent(id);
              setTimeout(() => {
                const el = document.querySelector(`[data-event-id="${id}"]`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }}
            selectedPeriod={selectedPeriod}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            currentYear={new Date().getFullYear()}
            periods={displayPeriods}
            expandedEventId={expandedEvent}
            connectionsByEvent={connectionsByEvent}
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
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              cursor: "pointer",
              color:
                selectedPeriod === "all"
                  ? theme.textSecondary
                  : findPeriod(selectedPeriod)?.color,
              fontWeight: selectedPeriod === "all" ? 500 : 700,
            }}
          >
            <option value="all">All Time Periods</option>
            {displayPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
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
              {activeSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; }}
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
            onMouseEnter={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; } }}
            onMouseLeave={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; } }}
          >
            <Icon icon={accountGroup} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Contributors
          </button>
        </div>

        {/* Active filters */}
        {(selectedPeriod !== "all" ||
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
            {selectedPeriod !== "all" && (
              <span
                style={{
                  fontSize: 10,
                  background: getThemedPeriodBg(findPeriod(selectedPeriod)) || findPeriod(selectedPeriod)?.bg,
                  color: findPeriod(selectedPeriod)?.color,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                }}
              >
                {findPeriod(selectedPeriod)?.label}
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
                {getSectionName(sectionFilter)}
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
                setSelectedPeriod("all");
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
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
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

        {/* Connection mode banner */}
        {connectionMode && (
          <div
            style={{
              background: theme.accentGold + "18",
              border: `1.5px solid ${theme.accentGold}`,
              borderRadius: 8,
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
                color: theme.textDescription,
              }}
            >
              {connectionMode.step === "selectCause" && "Step 1: Click the CAUSE event below"}
              {connectionMode.step === "selectEffect" && "Step 2: Now click the EFFECT event"}
            </span>
            <button
              onClick={() => setConnectionMode(null)}
              style={{
                padding: "4px 12px",
                background: "transparent",
                border: `1px solid ${theme.textSecondary}`,
                borderRadius: 5,
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
                color: theme.textSecondary,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Content area */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Event list */}
          <div
            ref={eventListRef}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
              position: "relative",
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
                <div
                  key={event.id}
                  data-event-id={event.id}
                  onClick={connectionMode ? (e) => {
                    e.stopPropagation();
                    handleConnectionModeClick(event.id);
                  } : undefined}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  style={connectionMode ? {
                    cursor: "crosshair",
                    borderRadius: 10,
                    outline: connectionMode.causeEventId === event.id
                      ? `2px solid ${theme.successGreen || "#22C55E"}`
                      : `2px solid transparent`,
                    transition: "outline 0.15s",
                  } : undefined}
                >
                  <EventCard
                    event={event}
                    isExpanded={connectionMode ? false : expandedEvent === event.id}
                    isRead={readEvents.has(event.id)}
                    onToggle={connectionMode ? () => {} : () =>
                      setExpandedEvent(
                        expandedEvent === event.id ? null : event.id
                      )
                    }
                    isTeacher={isTeacher}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    periods={displayPeriods}
                    onReturnToTimeline={() => {
                      const el = document.querySelector("[data-timeline-section]");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    connections={connectionsByEvent[event.id]}
                    allEvents={approvedEvents}
                    onScrollToEvent={handleScrollToEvent}
                    onDeleteConnection={handleDeleteConnection}
                    onEditConnection={handleEditConnection}
                    onSuggestDeleteConnection={!isTeacher ? handleSuggestDeleteConnection : undefined}
                    connectionMode={connectionMode}
                  />
                </div>
              ))
            )}
            <ConnectionLines
              connections={approvedConnections}
              containerRef={eventListRef}
              expandedEvent={expandedEvent}
              hoveredEvent={hoveredEvent}
              filteredEventIds={filteredEventIds}
            />
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
        </>
      )}

      {/* Add Event Modal */}
      {showAddPanel && (
        <AddEventPanel
          onAdd={handleAddEvent}
          onClose={() => setShowAddPanel(false)}
          userName={userName}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          periods={displayPeriods}
          fieldConfig={activeFieldConfig}
          isTeacher={isTeacher}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <AddEventPanel
          onAdd={handleSaveEdit}
          onClose={() => setEditingEvent(null)}
          userName={userName}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          periods={displayPeriods}
          fieldConfig={activeFieldConfig}
          editingEvent={editingEvent}
          isTeacher={isTeacher}
        />
      )}

      {/* Add Connection Modal */}
      {showAddConnectionPanel && (
        <AddConnectionPanel
          onAdd={handleAddConnection}
          onClose={() => setShowAddConnectionPanel(false)}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={displayPeriods}
          isTeacher={isTeacher}
        />
      )}

      {/* Connection mode description modal */}
      {connectionMode && connectionMode.step === "describe" && (
        <AddConnectionPanel
          onAdd={handleAddConnection}
          onClose={() => setConnectionMode(null)}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={displayPeriods}
          prefilledCause={connectionMode.causeEventId}
          prefilledEffect={connectionMode.effectEventId}
          isTeacher={isTeacher}
        />
      )}

      {/* Edit Connection Modal */}
      {editingConnection && (
        <AddConnectionPanel
          onAdd={handleSaveConnectionEdit}
          onClose={() => setEditingConnection(null)}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={displayPeriods}
          editingConnection={editingConnection}
          isTeacher={isTeacher}
        />
      )}

      {/* Moderation Modal (teacher only) */}
      {showModeration && isTeacher && (
        <ModerationPanel
          pendingEvents={pendingEvents}
          pendingConnections={pendingConnections}
          allEvents={approvedEvents}
          allConnections={allConnections}
          onClose={() => setShowModeration(false)}
          periods={displayPeriods}
          getSectionName={getSectionName}
          onEventApproved={handleEventApproved}
        />
      )}
    </div>
  );
}
