import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { PERIOD_COLORS, TAGS, getPeriod } from "./data/constants";
import { compareEventDates } from "./utils/dateUtils";
import { TEACHER_EMAIL } from "./firebase";
import { subscribeToEvents, submitEvent, deleteEvent, updateEvent, seedDatabase, subscribeToPeriods, subscribeToAllSectionPeriods, savePeriods, subscribeToSections, saveSections, subscribeToDefaultPeriods, saveDefaultPeriods, subscribeToCompellingQuestion, subscribeToAllSectionCompellingQuestions, saveCompellingQuestion, subscribeToDefaultCompellingQuestion, saveDefaultCompellingQuestion, subscribeToTimelineRange, subscribeToAllSectionTimelineRanges, saveTimelineRange, subscribeToDefaultTimelineRange, saveDefaultTimelineRange, subscribeToFieldConfig, subscribeToAllSectionFieldConfigs, saveFieldConfig, subscribeToDefaultFieldConfig, saveDefaultFieldConfig, assignStudentSection, subscribeToAllStudentSections, reassignStudentSection, removeStudentSection, subscribeToConnections, submitConnection, deleteConnection } from "./services/database";
import { writeToSheet } from "./services/sheets";
import SEED_EVENTS from "./data/seedEvents";
import VisualTimeline from "./components/VisualTimeline";
import EventCard from "./components/EventCard";
import AddEventPanel from "./components/AddEventPanel";
import AddConnectionPanel from "./components/AddConnectionPanel";
import ConnectionLines from "./components/ConnectionLines";
import ContributorSidebar from "./components/ContributorSidebar";
import ModerationPanel from "./components/ModerationPanel";
import LoginScreen from "./components/LoginScreen";
import SectionPicker from "./components/SectionPicker";
import StudentRoster from "./components/StudentRoster";
import SectionConfiguration from "./components/SectionConfiguration";
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
import vectorLink from "@iconify-icons/mdi/vector-link";
import lockOutline from "@iconify-icons/mdi/lock-outline";
import lockOpenVariantOutline from "@iconify-icons/mdi/lock-open-variant-outline";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import eyeOffOutline from "@iconify-icons/mdi/eye-off-outline";
import formatQuoteOpenOutline from "@iconify-icons/mdi/format-quote-open-outline";
import checkIcon from "@iconify-icons/mdi/check";
import formTextboxIcon from "@iconify-icons/mdi/form-textbox";

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher, userSection, sectionLoading } = useAuth();
  const { theme, mode, toggleTheme, getThemedPeriodBg } = useTheme();
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
  const [periods, setPeriods] = useState([]);
  const [periodsLocked, setPeriodsLocked] = useState(true);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [draftEraStart, setDraftEraStart] = useState("");
  const [draftEraEnd, setDraftEraEnd] = useState("");
  const [allSectionPeriods, setAllSectionPeriods] = useState({});
  const isEditingPeriodsRef = useRef(false);
  const [defaultPeriods, setDefaultPeriods] = useState([]);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [sections, setSections] = useState(null);
  const [sectionsLocked, setSectionsLocked] = useState(true);
  const [compellingQuestion, setCompellingQuestion] = useState({ text: "", enabled: false });
  const [draftCQText, setDraftCQText] = useState("");
  const [draftCQEnabled, setDraftCQEnabled] = useState(false);
  const [cqLocked, setCqLocked] = useState(true);
  const [cqEditingDefaults, setCqEditingDefaults] = useState(false);
  const [defaultCompellingQuestion, setDefaultCompellingQuestion] = useState({ text: "", enabled: false });
  const [allSectionCQs, setAllSectionCQs] = useState({});
  const isEditingCQRef = useRef(false);
  const [timelineRangeEditingDefaults, setTimelineRangeEditingDefaults] = useState(false);
  const [defaultTimelineRange, setDefaultTimelineRange] = useState(null);
  const isEditingTimelineRangeRef = useRef(false);
  const [fieldConfig, setFieldConfig] = useState(null);
  const [fieldConfigLocked, setFieldConfigLocked] = useState(true);
  const [fieldConfigEditingDefaults, setFieldConfigEditingDefaults] = useState(false);
  const [defaultFieldConfig, setDefaultFieldConfig] = useState(null);
  const isEditingFieldConfigRef = useRef(false);
  const [allSectionFieldConfigs, setAllSectionFieldConfigs] = useState({});
  const [allStudentAssignments, setAllStudentAssignments] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [showAddConnectionPanel, setShowAddConnectionPanel] = useState(false);
  const [connectionMode, setConnectionMode] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const eventListRef = useRef(null);

  const activeSections = useMemo(() => sections || [], [sections]);

  const getSectionName = useCallback(
    (id) => activeSections.find((s) => s.id === id)?.name || id,
    [activeSections]
  );

  const openPeriodEdit = (period) => {
    setEditingPeriodId(period.id);
    setDraftEraStart(String(period.era[0]));
    setDraftEraEnd(String(period.era[1]));
  };

  const commitEra = (periodId) => {
    const s = Number(draftEraStart) || 0;
    const e = Number(draftEraEnd) || 0;
    const newPeriods = periods.map((x) => x.id === periodId ? { ...x, era: [s, Math.max(s + 1, e)] } : x);
    setPeriods(newPeriods);
    persistPeriods(newPeriods);
  };

  const currentYear = new Date().getFullYear();
  const floorToDecade = (value) => Math.floor(value / 10) * 10;
  const ceilToDecade = (value) => Math.ceil(value / 10) * 10;

  const switchSection = (newSection) => {
    setSection(newSection);
    setExpandedEvent(null);
    setPeriodsLocked(true);
    isEditingPeriodsRef.current = false;
    setEditingPeriodId(null);
    setEditingDefaults(false);
    setCqLocked(true);
    isEditingCQRef.current = false;
    setCqEditingDefaults(false);
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

  // Subscribe to Firebase connections in real-time
  useEffect(() => {
    if (!user) return;
    const listenSection = isTeacher && section === "all" ? "all" : section;
    const unsubscribe = subscribeToConnections(listenSection, (connections) => {
      setAllConnections(connections);
    });
    return () => unsubscribe();
  }, [user, section, isTeacher]);

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
    if (defaultPeriods.length > 0) {
      savePeriods(id, defaultPeriods);
    }
    if (defaultCompellingQuestion.text) {
      saveCompellingQuestion(id, defaultCompellingQuestion);
    }
    if (defaultTimelineRange) {
      saveTimelineRange(id, defaultTimelineRange);
    }
    if (defaultFieldConfig) {
      saveFieldConfig(id, defaultFieldConfig);
    }
  }, [activeSections, defaultPeriods, defaultCompellingQuestion, defaultTimelineRange, defaultFieldConfig]);

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

  // Subscribe to default periods template
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDefaultPeriods((data) => {
      setDefaultPeriods(data || []);
    });
    return () => unsub();
  }, [user]);

  // Sync default periods into periods state when editing defaults
  useEffect(() => {
    if (editingDefaults && !isEditingPeriodsRef.current) {
      setPeriods(defaultPeriods);
    }
  }, [editingDefaults, defaultPeriods]);

  // Subscribe to section-specific periods (when not editing defaults)
  useEffect(() => {
    if (!user || editingDefaults) return;

    const effectiveSection = isTeacher && section === "all" ? "all" : section;

    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionPeriods(activeSections.map((s) => s.id), (periodsMap) => {
        if (isEditingPeriodsRef.current) return;
        setAllSectionPeriods(periodsMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToPeriods(effectiveSection, (data) => {
        if (isEditingPeriodsRef.current) return;
        setPeriods(data || []);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections, editingDefaults]);

  // Save periods to the right target (section or defaults + all sections)
  const persistPeriods = useCallback((newPeriods) => {
    if (editingDefaults) {
      saveDefaultPeriods(newPeriods);
      for (const s of activeSections) {
        savePeriods(s.id, newPeriods);
      }
    } else if (section !== "all") {
      savePeriods(section, newPeriods);
    }
  }, [editingDefaults, section, activeSections]);

  // Subscribe to default compelling question template
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDefaultCompellingQuestion((data) => {
      setDefaultCompellingQuestion(data || { text: "", enabled: false });
    });
    return () => unsub();
  }, [user]);

  // Sync default CQ into state when editing defaults
  useEffect(() => {
    if (cqEditingDefaults && !isEditingCQRef.current) {
      const cq = defaultCompellingQuestion || { text: "", enabled: false };
      setCompellingQuestion(cq);
      setDraftCQText(cq.text);
      setDraftCQEnabled(cq.enabled);
    }
  }, [cqEditingDefaults, defaultCompellingQuestion]);

  // Subscribe to section-specific compelling question (when not editing defaults)
  useEffect(() => {
    if (!user || cqEditingDefaults) return;

    const effectiveSection = isTeacher && section === "all" ? "all" : section;

    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionCompellingQuestions(activeSections.map((s) => s.id), (cqMap) => {
        if (isEditingCQRef.current) return;
        setAllSectionCQs(cqMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToCompellingQuestion(effectiveSection, (data) => {
        if (isEditingCQRef.current) return;
        const cq = data || { text: "", enabled: false };
        setCompellingQuestion(cq);
        setDraftCQText(cq.text);
        setDraftCQEnabled(cq.enabled);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections, cqEditingDefaults]);

  // Save compelling question to the right target
  const persistCompellingQuestion = useCallback((newCQ) => {
    if (cqEditingDefaults) {
      saveDefaultCompellingQuestion(newCQ);
      for (const s of activeSections) {
        saveCompellingQuestion(s.id, newCQ);
      }
    } else if (section !== "all") {
      saveCompellingQuestion(section, newCQ);
    }
  }, [cqEditingDefaults, section, activeSections]);

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
    region: "optional",
  }), []);

  // Active field config (merged with defaults)
  const activeFieldConfig = useMemo(() => ({
    ...DEFAULT_FIELD_CONFIG,
    ...(fieldConfig || {}),
  }), [fieldConfig, DEFAULT_FIELD_CONFIG]);

  // Subscribe to default timeline range
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDefaultTimelineRange((data) => {
      setDefaultTimelineRange(data);
    });
    return () => unsub();
  }, [user]);

  // Sync default timeline range into state when editing defaults
  useEffect(() => {
    if (timelineRangeEditingDefaults && !isEditingTimelineRangeRef.current && defaultTimelineRange) {
      setTimelineStart(defaultTimelineRange.start);
      setTimelineEnd(defaultTimelineRange.end);
      setDraftStart(String(defaultTimelineRange.start));
      setDraftEnd(String(defaultTimelineRange.end));
    }
  }, [timelineRangeEditingDefaults, defaultTimelineRange]);

  // Subscribe to section-specific timeline range (when not editing defaults)
  useEffect(() => {
    if (!user || timelineRangeEditingDefaults) return;

    const effectiveSection = isTeacher && section === "all" ? "all" : section;

    if (effectiveSection === "all") {
      // For teacher "all" view, use widest range across all sections
      const unsub = subscribeToAllSectionTimelineRanges(activeSections.map((s) => s.id), (rangeMap) => {
        if (isEditingTimelineRangeRef.current) return;
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
          setDraftStart(String(minStart));
          setDraftEnd(String(maxEnd));
        }
      });
      return () => unsub();
    } else {
      const unsub = subscribeToTimelineRange(effectiveSection, (data) => {
        if (isEditingTimelineRangeRef.current) return;
        if (data) {
          setTimelineStart(data.start);
          setTimelineEnd(data.end);
          setDraftStart(String(data.start));
          setDraftEnd(String(data.end));
        }
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections, timelineRangeEditingDefaults]);

  // Save timeline range to the right target
  const persistTimelineRange = useCallback((start, end) => {
    const range = { start, end };
    if (timelineRangeEditingDefaults) {
      saveDefaultTimelineRange(range);
      for (const s of activeSections) {
        saveTimelineRange(s.id, range);
      }
    } else if (section !== "all") {
      saveTimelineRange(section, range);
    }
  }, [timelineRangeEditingDefaults, section, activeSections]);

  // Subscribe to default field config
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDefaultFieldConfig((data) => {
      setDefaultFieldConfig(data);
    });
    return () => unsub();
  }, [user]);

  // Sync default field config into state when editing defaults
  useEffect(() => {
    if (fieldConfigEditingDefaults && !isEditingFieldConfigRef.current) {
      setFieldConfig(defaultFieldConfig);
    }
  }, [fieldConfigEditingDefaults, defaultFieldConfig]);

  // Subscribe to section-specific field config (when not editing defaults)
  useEffect(() => {
    if (!user || fieldConfigEditingDefaults) return;

    const effectiveSection = isTeacher && section === "all" ? "all" : section;

    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionFieldConfigs(activeSections.map((s) => s.id), (configMap) => {
        if (isEditingFieldConfigRef.current) return;
        setAllSectionFieldConfigs(configMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToFieldConfig(effectiveSection, (data) => {
        if (isEditingFieldConfigRef.current) return;
        setFieldConfig(data);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections, fieldConfigEditingDefaults]);

  // Save field config to the right target
  const persistFieldConfig = useCallback((newConfig) => {
    if (fieldConfigEditingDefaults) {
      saveDefaultFieldConfig(newConfig);
      for (const s of activeSections) {
        saveFieldConfig(s.id, newConfig);
      }
    } else if (section !== "all") {
      saveFieldConfig(section, newConfig);
    }
  }, [fieldConfigEditingDefaults, section, activeSections]);

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
      setDraftStart(String(newStart));
      setDraftEnd(String(newEnd));
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
        addedBy: user.displayName || user.email.split("@")[0],
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: section === "all" ? (activeSections[0]?.id || "Period1") : section,
        ...(isTeacher ? { status: "approved" } : {}),
      };
      await submitEvent(eventData);
      if (isTeacher) {
        writeToSheet(eventData);
        handleEventApproved(eventData);
      }
    },
    [user, section, activeSections, isTeacher, handleEventApproved]
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
      const changeFields = ["title", "year", "month", "day", "endYear", "endMonth", "endDay", "period", "tags", "sourceType", "description", "sourceNote", "region"];
      const changes = {};
      for (const key of changeFields) {
        const oldVal = editingEvent[key];
        const newVal = updates[key] !== undefined ? updates[key] : oldVal;
        const isEqual = key === "tags" ? JSON.stringify(oldVal) === JSON.stringify(newVal) : String(oldVal ?? "") === String(newVal ?? "");
        if (!isEqual) changes[key] = { from: oldVal, to: newVal };
      }
      if (isTeacher) {
        // Teacher: apply edit directly, append to edit history
        const existingHistory = editingEvent.editHistory || [];
        await updateEvent(editingEvent.id, {
          ...updates,
          editHistory: [...existingHistory, {
            name: user.displayName || user.email.split("@")[0],
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
          addedBy: user.displayName || user.email.split("@")[0],
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingEvent.section || (section === "all" ? (activeSections[0]?.id || "Period1") : section),
        });
      }
    },
    [editingEvent, isTeacher, user, section, activeSections]
  );

  const handleAddConnection = useCallback(
    async (formData) => {
      await submitConnection({
        ...formData,
        addedBy: user.displayName || user.email.split("@")[0],
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: section === "all" ? (activeSections[0]?.id || "Period1") : section,
      });
    },
    [user, section, activeSections]
  );

  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      await deleteConnection(connectionId);
    } catch (err) {
      console.error("Delete connection failed:", err);
    }
  }, []);

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

  // Student section loading
  if (!isTeacher && sectionLoading) {
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

  // Student needs to pick a section
  const sectionStillExists = activeSections.some((s) => s.id === userSection);
  if (!isTeacher && (!userSection || (activeSections.length > 0 && !sectionStillExists))) {
    return (
      <SectionPicker
        sections={activeSections}
        onSelect={async (sectionId) => {
          await assignStudentSection(user.uid, sectionId, user.email, user.displayName || user.email.split("@")[0]);
        }}
        userName={user.displayName || user.email.split("@")[0]}
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
                          minWidth: 280,
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
                          Timeline Range{timelineRangeEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => {
                              setTimelineRangeEditingDefaults((v) => !v);
                              setTimelineRangeLocked(true);
                              isEditingTimelineRangeRef.current = false;
                            }}
                            title={timelineRangeEditingDefaults ? "Switch to section range" : "Edit default range (applies to all sections)"}
                            style={{
                              fontSize: 8,
                              fontWeight: 600,
                              fontFamily: "'Overpass Mono', monospace",
                              padding: "1px 5px",
                              borderRadius: 3,
                              border: `1px solid ${timelineRangeEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                              background: timelineRangeEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                              color: timelineRangeEditingDefaults ? theme.teacherGreen : theme.textMuted,
                              cursor: "pointer",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              transition: "all 0.15s",
                            }}
                          >
                            Default
                          </button>
                          <button
                            onClick={() => {
                              setTimelineRangeLocked((v) => {
                                isEditingTimelineRangeRef.current = v;
                                return !v;
                              });
                            }}
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
                        </div>

                        {timelineRangeEditingDefaults && (
                          <div style={{
                            fontSize: 9,
                            color: theme.textMuted,
                            fontStyle: "italic",
                            marginBottom: 6,
                            letterSpacing: "0.03em",
                          }}>
                            Edits apply to all sections &amp; future sections
                          </div>
                        )}

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
                                isEditingTimelineRangeRef.current = true;
                                persistTimelineRange(v, timelineEnd);
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
                                isEditingTimelineRangeRef.current = true;
                                persistTimelineRange(timelineStart, v);
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

                        {/* Divider */}
                        <div style={{
                          height: 1,
                          background: theme.inputBorder,
                          margin: "10px 0",
                        }} />

                        {/* Periods section */}
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: theme.mutedText,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                          <span>
                            Time Periods{editingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={() => {
                                setEditingDefaults((v) => !v);
                                setPeriodsLocked(true);
                                isEditingPeriodsRef.current = false;
                                setEditingPeriodId(null);
                              }}
                              title={editingDefaults ? "Switch to section time periods" : "Edit default time periods (applies to all sections)"}
                              style={{
                                fontSize: 8,
                                fontWeight: 600,
                                fontFamily: "'Overpass Mono', monospace",
                                padding: "1px 5px",
                                borderRadius: 3,
                                border: `1px solid ${editingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                                background: editingDefaults ? theme.teacherGreen + "20" : "transparent",
                                color: editingDefaults ? theme.teacherGreen : theme.textMuted,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                transition: "all 0.15s",
                              }}
                            >
                              Default
                            </button>
                            <button
                              onClick={() => {
                                setPeriodsLocked((v) => {
                                  isEditingPeriodsRef.current = v;
                                  return !v;
                                });
                              }}
                              title={periodsLocked ? "Unlock to edit" : "Lock time periods"}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 2,
                                cursor: "pointer",
                                color: periodsLocked ? theme.textMuted : theme.teacherGreen,
                                display: "inline-flex",
                                transition: "color 0.15s",
                              }}
                            >
                              <Icon icon={periodsLocked ? lockOutline : lockOpenVariantOutline} width={12} />
                            </button>
                          </div>
                        </div>

                        {editingDefaults && (
                          <div style={{
                            fontSize: 9,
                            color: theme.textMuted,
                            fontStyle: "italic",
                            marginBottom: 6,
                            letterSpacing: "0.03em",
                          }}>
                            Edits apply to all sections &amp; future sections
                          </div>
                        )}

                        {/* Period list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {periods.length === 0 && (
                            <div style={{
                              fontSize: 10,
                              color: theme.textMuted,
                              fontStyle: "italic",
                              padding: "4px 6px",
                            }}>
                              No time periods configured
                            </div>
                          )}
                          {periods.map((p) => {
                            const isEditing = editingPeriodId === p.id && !periodsLocked;
                            return (
                              <div key={p.id}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 6px",
                                    borderRadius: 4,
                                    background: isEditing ? theme.subtleBg : "transparent",
                                    transition: "background 0.15s",
                                  }}
                                >
                                  <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: p.accent,
                                    flexShrink: 0,
                                  }} />
                                  <span style={{
                                    fontSize: 10,
                                    color: theme.textPrimary,
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {p.label}
                                  </span>
                                  <span style={{
                                    fontSize: 9,
                                    color: theme.textMuted,
                                    flexShrink: 0,
                                  }}>
                                    {p.era[0]}–{p.era[1]}
                                  </span>
                                  {!periodsLocked && (
                                    <>
                                      <button
                                        onClick={() => isEditing ? setEditingPeriodId(null) : openPeriodEdit(p)}
                                        title="Edit time period"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: 0,
                                          cursor: "pointer",
                                          color: isEditing ? theme.teacherGreen : theme.textMuted,
                                          display: "inline-flex",
                                          transition: "color 0.15s",
                                        }}
                                      >
                                        <Icon icon={pencilOutline} width={11} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!window.confirm(`Delete "${p.label}"? Events assigned to this time period will lose their time period.`)) return;
                                          const newPeriods = periods.filter((x) => x.id !== p.id);
                                          setPeriods(newPeriods);
                                          persistPeriods(newPeriods);
                                          if (selectedPeriod === p.id) setSelectedPeriod("all");
                                          if (editingPeriodId === p.id) setEditingPeriodId(null);
                                        }}
                                        title="Delete time period"
                                        onMouseEnter={(e) => e.currentTarget.style.color = theme.errorRed}
                                        onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: 0,
                                          cursor: "pointer",
                                          color: theme.textMuted,
                                          display: "inline-flex",
                                          transition: "color 0.15s",
                                        }}
                                      >
                                        <Icon icon={closeCircleOutline} width={11} />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Inline edit form */}
                                {isEditing && (
                                  <div style={{
                                    padding: "8px 6px 6px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                  }}>
                                    <input
                                      type="text"
                                      value={p.label}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.trim() || val === "") {
                                          setPeriods((prev) =>
                                            prev.map((x) => x.id === p.id ? { ...x, label: val } : x)
                                          );
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const finalLabel = e.target.value.trim() || "Untitled Time Period";
                                        const newPeriods = periods.map((x) => x.id === p.id ? { ...x, label: finalLabel } : x);
                                        setPeriods(newPeriods);
                                        persistPeriods(newPeriods);
                                      }}
                                      placeholder="Time period label"
                                      style={{
                                        padding: "5px 8px",
                                        border: `1.5px solid ${theme.inputBorder}`,
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontFamily: "'Overpass Mono', monospace",
                                        background: theme.inputBg,
                                        color: theme.textPrimary,
                                        outline: "none",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <input
                                        type="number"
                                        value={draftEraStart}
                                        onChange={(e) => setDraftEraStart(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                                        onBlur={() => commitEra(p.id)}
                                        style={{
                                          width: "100%",
                                          padding: "5px 6px",
                                          border: `1.5px solid ${theme.inputBorder}`,
                                          borderRadius: 4,
                                          fontSize: 11,
                                          fontFamily: "'Overpass Mono', monospace",
                                          background: theme.inputBg,
                                          color: theme.textPrimary,
                                          outline: "none",
                                          boxSizing: "border-box",
                                          textAlign: "center",
                                        }}
                                      />
                                      <span style={{ fontSize: 10, color: theme.textMuted }}>–</span>
                                      <input
                                        type="number"
                                        value={draftEraEnd}
                                        onChange={(e) => setDraftEraEnd(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                                        onBlur={() => commitEra(p.id)}
                                        style={{
                                          width: "100%",
                                          padding: "5px 6px",
                                          border: `1.5px solid ${theme.inputBorder}`,
                                          borderRadius: 4,
                                          fontSize: 11,
                                          fontFamily: "'Overpass Mono', monospace",
                                          background: theme.inputBg,
                                          color: theme.textPrimary,
                                          outline: "none",
                                          boxSizing: "border-box",
                                          textAlign: "center",
                                        }}
                                      />
                                    </div>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                      {PERIOD_COLORS.map((c, i) => (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            const newPeriods = periods.map((x) => x.id === p.id ? { ...x, color: c.color, bg: c.bg, accent: c.accent } : x);
                                            setPeriods(newPeriods);
                                            persistPeriods(newPeriods);
                                          }}
                                          title={`Color ${i + 1}`}
                                          style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: "50%",
                                            background: c.accent,
                                            border: p.color === c.color ? `2px solid ${theme.textPrimary}` : `2px solid transparent`,
                                            cursor: "pointer",
                                            padding: 0,
                                            transition: "border-color 0.15s",
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add period button */}
                        {!periodsLocked && (
                          <button
                            onClick={() => {
                              const newId = "period-" + Date.now();
                              const colorIdx = periods.length % PERIOD_COLORS.length;
                              const c = PERIOD_COLORS[colorIdx];
                              const newPeriod = {
                                id: newId,
                                label: "New Time Period",
                                color: c.color,
                                bg: c.bg,
                                accent: c.accent,
                                era: [timelineStart, timelineEnd],
                              };
                              const newPeriods = [...periods, newPeriod];
                              setPeriods(newPeriods);
                              persistPeriods(newPeriods);
                              openPeriodEdit(newPeriod);
                            }}
                            style={{
                              width: "100%",
                              marginTop: 6,
                              padding: "5px 0",
                              border: `1.5px dashed ${theme.inputBorder}`,
                              borderRadius: 4,
                              background: "transparent",
                              color: theme.textSecondary,
                              fontSize: 10,
                              fontFamily: "'Overpass Mono', monospace",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              transition: "all 0.15s",
                            }}
                          >
                            <Icon icon={plusIcon} width={12} />
                            Add Time Period
                          </button>
                        )}

                        {/* Divider */}
                        <div style={{
                          height: 1,
                          background: theme.inputBorder,
                          margin: "10px 0",
                        }} />

                        {/* Compelling Question section */}
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: theme.mutedText,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon icon={formatQuoteOpenOutline} width={12} />
                            Question{cqEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={() => {
                                setCqEditingDefaults((v) => !v);
                                setCqLocked(true);
                                isEditingCQRef.current = false;
                              }}
                              title={cqEditingDefaults ? "Switch to section question" : "Edit default question (applies to all sections)"}
                              style={{
                                fontSize: 8,
                                fontWeight: 600,
                                fontFamily: "'Overpass Mono', monospace",
                                padding: "1px 5px",
                                borderRadius: 3,
                                border: `1px solid ${cqEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                                background: cqEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                                color: cqEditingDefaults ? theme.teacherGreen : theme.textMuted,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                transition: "all 0.15s",
                              }}
                            >
                              Default
                            </button>
                            <button
                              onClick={() => {
                                setCqLocked((v) => {
                                  isEditingCQRef.current = v;
                                  return !v;
                                });
                              }}
                              title={cqLocked ? "Unlock to edit" : "Lock question"}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 2,
                                cursor: "pointer",
                                color: cqLocked ? theme.textMuted : theme.teacherGreen,
                                display: "inline-flex",
                                transition: "color 0.15s",
                              }}
                            >
                              <Icon icon={cqLocked ? lockOutline : lockOpenVariantOutline} width={12} />
                            </button>
                          </div>
                        </div>

                        {cqEditingDefaults && (
                          <div style={{
                            fontSize: 9,
                            color: theme.textMuted,
                            fontStyle: "italic",
                            marginBottom: 6,
                            letterSpacing: "0.03em",
                          }}>
                            Edits apply to all sections &amp; future sections
                          </div>
                        )}

                        {/* Enable/disable toggle */}
                        <button
                          onClick={() => {
                            if (cqLocked) return;
                            setDraftCQEnabled((v) => !v);
                            isEditingCQRef.current = true;
                          }}
                          disabled={cqLocked}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            border: "none",
                            background: "transparent",
                            cursor: cqLocked ? "not-allowed" : "pointer",
                            opacity: cqLocked ? 0.5 : 1,
                            fontSize: 10,
                            fontFamily: "'Overpass Mono', monospace",
                            color: draftCQEnabled ? theme.teacherGreen : theme.textMuted,
                            fontWeight: 600,
                            transition: "all 0.15s",
                            marginBottom: 6,
                          }}
                        >
                          <Icon icon={draftCQEnabled ? eyeOutline : eyeOffOutline} width={13} />
                          {draftCQEnabled ? "Visible to students" : "Hidden from students"}
                        </button>

                        {/* Question text field */}
                        <textarea
                          value={draftCQText}
                          disabled={cqLocked}
                          onChange={(e) => {
                            setDraftCQText(e.target.value);
                            isEditingCQRef.current = true;
                          }}
                          placeholder="e.g., How did global conflicts reshape the American identity?"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1.5px solid ${theme.inputBorder}`,
                            borderRadius: 6,
                            fontSize: 12,
                            fontFamily: "'Newsreader', 'Georgia', serif",
                            background: theme.inputBg,
                            color: theme.textPrimary,
                            outline: "none",
                            boxSizing: "border-box",
                            resize: "vertical",
                            minHeight: 60,
                            opacity: cqLocked ? 0.5 : 1,
                            cursor: cqLocked ? "not-allowed" : "text",
                            transition: "opacity 0.15s",
                          }}
                        />

                        {/* Update button — appears when draft differs from saved */}
                        {!cqLocked && (draftCQText !== compellingQuestion.text || draftCQEnabled !== compellingQuestion.enabled) && (
                          <button
                            onClick={() => {
                              const updated = { text: draftCQText, enabled: draftCQEnabled };
                              setCompellingQuestion(updated);
                              persistCompellingQuestion(updated);
                              isEditingCQRef.current = false;
                            }}
                            style={{
                              width: "100%",
                              marginTop: 6,
                              padding: "6px 0",
                              border: "none",
                              borderRadius: 4,
                              background: theme.teacherGreen,
                              color: "#fff",
                              fontSize: 10,
                              fontFamily: "'Overpass Mono', monospace",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              transition: "all 0.15s",
                            }}
                          >
                            <Icon icon={checkIcon} width={13} />
                            Update
                          </button>
                        )}

                        {/* Divider */}
                        <div style={{
                          height: 1,
                          background: theme.inputBorder,
                          margin: "10px 0",
                        }} />

                        {/* Entry Fields Config section */}
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: theme.mutedText,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon icon={formTextboxIcon} width={12} />
                            Entry Fields{fieldConfigEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={() => {
                                setFieldConfigEditingDefaults((v) => !v);
                                setFieldConfigLocked(true);
                                isEditingFieldConfigRef.current = false;
                              }}
                              title={fieldConfigEditingDefaults ? "Switch to section fields" : "Edit default fields (applies to all sections)"}
                              style={{
                                fontSize: 8,
                                fontWeight: 600,
                                fontFamily: "'Overpass Mono', monospace",
                                padding: "1px 5px",
                                borderRadius: 3,
                                border: `1px solid ${fieldConfigEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                                background: fieldConfigEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                                color: fieldConfigEditingDefaults ? theme.teacherGreen : theme.textMuted,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                transition: "all 0.15s",
                              }}
                            >
                              Default
                            </button>
                            <button
                              onClick={() => {
                                setFieldConfigLocked((v) => {
                                  isEditingFieldConfigRef.current = v;
                                  return !v;
                                });
                              }}
                              title={fieldConfigLocked ? "Unlock to edit" : "Lock fields"}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 2,
                                cursor: "pointer",
                                color: fieldConfigLocked ? theme.textMuted : theme.teacherGreen,
                                display: "inline-flex",
                                transition: "color 0.15s",
                              }}
                            >
                              <Icon icon={fieldConfigLocked ? lockOutline : lockOpenVariantOutline} width={12} />
                            </button>
                          </div>
                        </div>

                        {fieldConfigEditingDefaults && (
                          <div style={{
                            fontSize: 9,
                            color: theme.textMuted,
                            fontStyle: "italic",
                            marginBottom: 6,
                            letterSpacing: "0.03em",
                          }}>
                            Edits apply to all sections &amp; future sections
                          </div>
                        )}

                        {/* Field list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {[
                            { key: "title", label: "Event Title" },
                            { key: "year", label: "Year" },
                            { key: "month", label: "Month" },
                            { key: "day", label: "Day" },
                            { key: "endDate", label: "End Date" },
                            { key: "period", label: "Time Period" },
                            { key: "tags", label: "Tags" },
                            { key: "sourceType", label: "Source Type" },
                            { key: "description", label: "Description" },
                            { key: "sourceNote", label: "Source Citation" },
                            { key: "region", label: "Region" },
                          ].map(({ key, label }) => {
                            const mode = activeFieldConfig[key] || "mandatory";
                            const allowedModes = key === "endDate"
                              ? ["optional", "hidden"]
                              : key === "year"
                              ? ["mandatory"]
                              : ["mandatory", "optional", "hidden"];
                            return (
                              <div
                                key={key}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "3px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                <span style={{
                                  fontSize: 10,
                                  color: mode === "hidden" ? theme.textMuted : theme.textPrimary,
                                  flex: 1,
                                  textDecoration: mode === "hidden" ? "line-through" : "none",
                                  opacity: mode === "hidden" ? 0.5 : 1,
                                }}>
                                  {label}
                                </span>
                                {!fieldConfigLocked ? (
                                  <div style={{ display: "flex", gap: 2 }}>
                                    {allowedModes.map((m) => (
                                      <button
                                        key={m}
                                        onClick={() => {
                                          const updated = { ...activeFieldConfig, [key]: m };
                                          setFieldConfig(updated);
                                          persistFieldConfig(updated);
                                          isEditingFieldConfigRef.current = true;
                                        }}
                                        style={{
                                          fontSize: 8,
                                          fontWeight: mode === m ? 700 : 500,
                                          fontFamily: "'Overpass Mono', monospace",
                                          padding: "2px 5px",
                                          borderRadius: 3,
                                          border: `1px solid ${mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? "#D97706" : theme.errorRed) : theme.inputBorder}`,
                                          background: mode === m ? (m === "mandatory" ? theme.teacherGreen + "20" : m === "optional" ? "#D9770620" : theme.errorRed + "20") : "transparent",
                                          color: mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? "#D97706" : theme.errorRed) : theme.textMuted,
                                          cursor: "pointer",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.03em",
                                          transition: "all 0.15s",
                                        }}
                                      >
                                        {m === "mandatory" ? "Req" : m === "optional" ? "Opt" : "Hide"}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{
                                    fontSize: 8,
                                    fontWeight: 600,
                                    fontFamily: "'Overpass Mono', monospace",
                                    color: mode === "mandatory" ? theme.teacherGreen : mode === "optional" ? "#D97706" : theme.textMuted,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                  }}>
                                    {mode === "mandatory" ? "Required" : mode === "optional" ? "Optional" : "Hidden"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Divider */}
                        <div style={{
                          height: 1,
                          background: theme.inputBorder,
                          margin: "10px 0",
                        }} />

                        {/* Sections config */}
                        <SectionConfiguration
                          sections={activeSections}
                          locked={sectionsLocked}
                          onToggleLock={() => setSectionsLocked((v) => !v)}
                          onAdd={handleAddSection}
                          onDelete={handleDeleteSection}
                          onRename={handleRenameSection}
                          theme={theme}
                        />

                        <StudentRoster
                          students={allStudentAssignments}
                          sections={activeSections}
                          onReassign={reassignStudentSection}
                          onRemove={removeStudentSection}
                          theme={theme}
                        />
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
                {[...new Set(approvedEvents.map((e) => e.period))].length} time periods
              </p>
              {/* View switcher (teacher only) */}
              {isTeacher && (
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
                      >
                        {s.name}
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
                  }}
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
                }}
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
                }}
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
                title="Click two events to connect them"
              >
                <Icon icon={vectorLink} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {connectionMode ? "Exit Connect Mode" : "Connect Events"}
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
            currentYear={currentYear}
            periods={displayPeriods}
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

      {/* Add Event Modal */}
      {showAddPanel && (
        <AddEventPanel
          onAdd={handleAddEvent}
          onClose={() => setShowAddPanel(false)}
          userName={user.displayName || user.email.split("@")[0]}
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
          userName={user.displayName || user.email.split("@")[0]}
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
          userName={user.displayName || user.email.split("@")[0]}
          approvedEvents={approvedEvents}
          periods={displayPeriods}
        />
      )}

      {/* Connection mode description modal */}
      {connectionMode && connectionMode.step === "describe" && (
        <AddConnectionPanel
          onAdd={handleAddConnection}
          onClose={() => setConnectionMode(null)}
          userName={user.displayName || user.email.split("@")[0]}
          approvedEvents={approvedEvents}
          periods={displayPeriods}
          prefilledCause={connectionMode.causeEventId}
          prefilledEffect={connectionMode.effectEventId}
        />
      )}

      {/* Moderation Modal (teacher only) */}
      {showModeration && isTeacher && (
        <ModerationPanel
          pendingEvents={pendingEvents}
          pendingConnections={pendingConnections}
          allEvents={approvedEvents}
          onClose={() => setShowModeration(false)}
          periods={displayPeriods}
          getSectionName={getSectionName}
          onEventApproved={handleEventApproved}
        />
      )}
    </div>
  );
}
