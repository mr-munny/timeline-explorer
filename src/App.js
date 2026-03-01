import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { getPeriod, DEFAULT_PERIODS, DEFAULT_FIELD_CONFIG } from "./data/constants";
import { compareEventDates } from "./utils/dateUtils";
import { TEACHER_EMAIL } from "./firebase";
import { savePeriods, saveSections, saveCompellingQuestion, saveTimelineRange, saveFieldConfig, assignStudentSection, reassignStudentSection, removeStudentSection } from "./services/database";
import useFirebaseSubscriptions from "./hooks/useFirebaseSubscriptions";
import useEventHandlers from "./hooks/useEventHandlers";
import useConnectionHandlers from "./hooks/useConnectionHandlers";
import useConnectionMode from "./hooks/useConnectionMode";
import useReadEvents from "./hooks/useReadEvents";
import VisualTimeline from "./components/VisualTimeline";
import AddEventPanel from "./components/AddEventPanel";
import AddConnectionPanel from "./components/AddConnectionPanel";
import AdminView from "./components/AdminView";
import ModerationPanel from "./components/ModerationPanel";
import LoginScreen from "./components/LoginScreen";
import SectionPicker from "./components/SectionPicker";
import TimelineHeader from "./components/TimelineHeader";
import FilterBar from "./components/FilterBar";
import CompellingQuestionHero from "./components/CompellingQuestionHero";
import EventList from "./components/EventList";

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher, userSection, sectionLoading } = useAuth();
  const { theme, mode, toggleTheme, getThemedPeriodBg } = useTheme();
  const userName = user ? (user.displayName || user.email.split("@")[0]) : "";
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
  const [showAddConnectionPanel, setShowAddConnectionPanel] = useState(false);
  const { connectionMode, setConnectionMode, handleConnectionModeClick } = useConnectionMode();
  const [editingConnection, setEditingConnection] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const readEvents = useReadEvents(user, expandedEvent);

  const {
    allEvents,
    allConnections,
    setSections,
    activeSections,
    periods,
    allSectionPeriods,
    compellingQuestion,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    fieldConfig,
    allStudentAssignments,
  } = useFirebaseSubscriptions({ user, isTeacher, section, showAdminView });
  const defaultSection = section === "all" ? (activeSections[0]?.id || "Period1") : section;

  const getSectionName = useCallback(
    (id) => activeSections.find((s) => s.id === id)?.name || id,
    [activeSections]
  );

  const switchSection = (newSection) => {
    setSection(newSection);
    setExpandedEvent(null);
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set("section", newSection);
    window.history.replaceState({}, "", url);
  };

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

  // Active field config (merged with defaults)
  const activeFieldConfig = useMemo(() => ({
    ...DEFAULT_FIELD_CONFIG,
    ...(fieldConfig || {}),
  }), [fieldConfig]);

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

  const {
    handleEventApproved,
    handleAddEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveEdit,
  } = useEventHandlers({
    user,
    userName,
    isTeacher,
    defaultSection,
    section,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    editingEvent,
    setEditingEvent,
  });

  const {
    handleAddConnection,
    handleDeleteConnection,
    handleSuggestDeleteConnection,
    handleEditConnection,
    handleSaveConnectionEdit,
    handleScrollToEvent,
  } = useConnectionHandlers({
    user,
    userName,
    isTeacher,
    defaultSection,
    editingConnection,
    setEditingConnection,
    setExpandedEvent,
  });

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
      <TimelineHeader
        theme={theme}
        mode={mode}
        toggleTheme={toggleTheme}
        isTeacher={isTeacher}
        showAdminView={showAdminView}
        setShowAdminView={setShowAdminView}
        pendingEvents={pendingEvents}
        pendingConnections={pendingConnections}
        approvedEvents={approvedEvents}
        studentCount={studentCount}
        section={section}
        activeSections={activeSections}
        switchSection={switchSection}
        setShowModeration={setShowModeration}
        setShowAddPanel={setShowAddPanel}
        setShowAddConnectionPanel={setShowAddConnectionPanel}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        logout={logout}
      />

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
      <CompellingQuestionHero compellingQuestion={displayCQ} />

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
        <FilterBar
          theme={theme}
          getThemedPeriodBg={getThemedPeriodBg}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          sectionFilter={sectionFilter}
          setSectionFilter={setSectionFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          showContributors={showContributors}
          setShowContributors={setShowContributors}
          isTeacher={isTeacher}
          section={section}
          displayPeriods={displayPeriods}
          activeSections={activeSections}
          findPeriod={findPeriod}
          getSectionName={getSectionName}
          filteredCount={filteredEvents.length}
          totalCount={approvedEvents.length}
        />

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

        <EventList
          filteredEvents={filteredEvents}
          connectionMode={connectionMode}
          expandedEvent={expandedEvent}
          setExpandedEvent={setExpandedEvent}
          hoveredEvent={hoveredEvent}
          setHoveredEvent={setHoveredEvent}
          readEvents={readEvents}
          connectionsByEvent={connectionsByEvent}
          approvedEvents={approvedEvents}
          approvedConnections={approvedConnections}
          filteredEventIds={filteredEventIds}
          displayPeriods={displayPeriods}
          isTeacher={isTeacher}
          showContributors={showContributors}
          handleConnectionModeClick={handleConnectionModeClick}
          handleEditEvent={handleEditEvent}
          handleDeleteEvent={handleDeleteEvent}
          handleScrollToEvent={handleScrollToEvent}
          handleDeleteConnection={handleDeleteConnection}
          handleEditConnection={handleEditConnection}
          handleSuggestDeleteConnection={handleSuggestDeleteConnection}
        />

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
