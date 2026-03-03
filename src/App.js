import { useState, useReducer, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING } from "./contexts/ThemeContext";
import { getPeriod, DEFAULT_PERIODS, DEFAULT_FIELD_CONFIG } from "./data/constants";
import { compareEventDates } from "./utils/dateUtils";
import { savePeriods, saveSections, saveCompellingQuestion, saveTimelineRange, saveFieldConfig, assignStudentSection, reassignStudentSection, removeStudentSection } from "./services/database";
import useFirebaseSubscriptions from "./hooks/useFirebaseSubscriptions";
import useEventHandlers from "./hooks/useEventHandlers";
import useConnectionHandlers from "./hooks/useConnectionHandlers";
import useReadEvents from "./hooks/useReadEvents";
import VisualTimeline from "./components/VisualTimeline";
import AddEventPanel from "./components/AddEventPanel";
import AddConnectionPanel from "./components/AddConnectionPanel";
import ModerationPanel from "./components/ModerationPanel";
import AdminView from "./components/AdminView";
import ModalShell, { ModalCloseButton } from "./components/ModalShell";
import LoginScreen from "./components/LoginScreen";
import SectionPicker from "./components/SectionPicker";
import TimelineHeader from "./components/TimelineHeader";
import FilterBar from "./components/FilterBar";
import CompellingQuestionHero from "./components/CompellingQuestionHero";
import EventList from "./components/EventList";
import RevisionPanel from "./components/RevisionPanel";

function modalReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { type: action.modalType, payload: action.payload || null };
    case 'CLOSE':
      return { type: null, payload: null };
    default:
      return state;
  }
}

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher, isSuperAdmin, teacherData, effectiveTeacherUid, impersonatingTeacher, setImpersonating, userSection, sectionLoading } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const userName = user ? (user.displayName || user.email.split("@")[0]) : "";
  const [section, setSection] = useState(getInitialSection);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagMatchMode, setTagMatchMode] = useState("or");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("chrono");
  const [modal, dispatchModal] = useReducer(modalReducer, { type: null, payload: null });
  const [showContributors, setShowContributors] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);


  // Derived modal state (backward-compatible with child components)
  const showAddPanel = modal.type === 'addEvent';
  const editingEvent = modal.type === 'editEvent' ? modal.payload : null;
  const showAddConnectionPanel = modal.type === 'addConnection';
  const editingConnection = modal.type === 'editConnection' ? modal.payload : null;
  const showPendingQueue = modal.type === 'pendingQueue';
  const showRevisionPanel = modal.type === 'revisionPanel';
  const revisingEvent = modal.type === 'reviseEvent' ? modal.payload : null;
  const revisingConnection = modal.type === 'reviseConnection' ? modal.payload : null;

  // Stable modal dispatch helpers (passed to hooks and child components)
  const closeModal = useCallback(() => dispatchModal({ type: 'CLOSE' }), []);
  const setEditingEvent = useCallback((event) => {
    if (event) dispatchModal({ type: 'OPEN', modalType: 'editEvent', payload: event });
    else dispatchModal({ type: 'CLOSE' });
  }, []);
  const setEditingConnection = useCallback((conn) => {
    if (conn) dispatchModal({ type: 'OPEN', modalType: 'editConnection', payload: conn });
    else dispatchModal({ type: 'CLOSE' });
  }, []);
  const setRevisingEvent = useCallback((event) => {
    if (event) dispatchModal({ type: 'OPEN', modalType: 'reviseEvent', payload: event });
    else dispatchModal({ type: 'CLOSE' });
  }, []);
  const setRevisingConnection = useCallback((conn) => {
    if (conn) dispatchModal({ type: 'OPEN', modalType: 'reviseConnection', payload: conn });
    else dispatchModal({ type: 'CLOSE' });
  }, []);
  const readEvents = useReadEvents(user, expandedEvent);

  const {
    allEvents,
    allConnections,
    sections: allSectionsRaw,
    setSections,
    activeSections,
    periods,
    compellingQuestion,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    fieldConfig,
    allStudentAssignments,
  } = useFirebaseSubscriptions({ user, isTeacher, section, showAdminView, effectiveTeacherUid });
  const defaultSection = section;

  const getSectionName = useCallback(
    (id) => activeSections.find((s) => s.id === id)?.name || id,
    [activeSections]
  );

  const switchSection = useCallback((newSection) => {
    setSection(newSection);
    setExpandedEvent(null);
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set("section", newSection);
    window.history.replaceState({}, "", url);
  }, []);

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
    const prefix = effectiveTeacherUid ? effectiveTeacherUid.slice(0, 6) + "_" : "";
    const prefixedSlug = prefix + slug;
    const allSections = allSectionsRaw || [];
    const id = allSections.some((s) => s.id === prefixedSlug) ? `${prefixedSlug}-${Date.now()}` : prefixedSlug;
    const updated = [...allSections, { id, name, teacherUid: effectiveTeacherUid || null }];
    setSections(updated);
    saveSections(updated);
    // Initialize new section with sensible defaults
    savePeriods(id, DEFAULT_PERIODS);
    saveCompellingQuestion(id, { text: "", enabled: false });
    saveTimelineRange(id, { start: 1900, end: 2000 });
    saveFieldConfig(id, DEFAULT_FIELD_CONFIG);
  }, [allSectionsRaw, effectiveTeacherUid, setSections]);

  const handleDeleteSection = useCallback((id) => {
    const updated = (allSectionsRaw || []).filter((s) => s.id !== id);
    setSections(updated);
    saveSections(updated);
    if (section === id) {
      const remaining = activeSections.filter((s) => s.id !== id);
      switchSection(remaining.length > 0 ? remaining[0].id : "Period1");
    }
  }, [allSectionsRaw, activeSections, section, setSections, switchSection]);

  const handleRenameSection = useCallback((id, newName) => {
    const updated = (allSectionsRaw || []).map((s) => s.id === id ? { ...s, name: newName } : s);
    setSections(updated);
    saveSections(updated);
  }, [allSectionsRaw, setSections]);

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

  // Items needing revision
  const needsRevisionEvents = useMemo(
    () => allEvents.filter((e) => e.status === "needs_revision"),
    [allEvents]
  );

  const needsRevisionConnections = useMemo(
    () => allConnections.filter((c) => c.status === "needs_revision"),
    [allConnections]
  );

  // Current student's items needing revision (for notification bell)
  const myRevisionEvents = useMemo(
    () => needsRevisionEvents.filter((e) => e.addedByUid === user?.uid),
    [needsRevisionEvents, user]
  );

  const myRevisionConnections = useMemo(
    () => needsRevisionConnections.filter((c) => c.addedByUid === user?.uid),
    [needsRevisionConnections, user]
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

  const togglePeriod = useCallback((periodId) => {
    setSelectedPeriods((prev) =>
      prev.includes(periodId) ? prev.filter((id) => id !== periodId) : [...prev, periodId]
    );
  }, []);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedPeriods([]);
    setSelectedTags([]);
    setTagMatchMode("or");
    setSearchTerm("");
  }, []);

  // Filtered + sorted events for display
  const filteredEvents = useMemo(() => {
    let evts = [...approvedEvents];
    if (selectedPeriods.length > 0) {
      const periodSet = new Set(selectedPeriods);
      evts = evts.filter((e) => periodSet.has(e.period));
    }
    if (selectedTags.length > 0) {
      if (tagMatchMode === "and") {
        evts = evts.filter((e) => {
          const eventTags = e.tags || [];
          return selectedTags.every((tag) => eventTags.includes(tag));
        });
      } else {
        evts = evts.filter((e) => {
          const eventTags = e.tags || [];
          return selectedTags.some((tag) => eventTags.includes(tag));
        });
      }
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
  }, [approvedEvents, selectedPeriods, selectedTags, tagMatchMode, searchTerm, sortOrder]);

  const filteredEventIds = useMemo(
    () => new Set(filteredEvents.map((e) => e.id)),
    [filteredEvents]
  );

  // Compute union of selected period era ranges for auto-zoom
  const selectedEraRange = useMemo(() => {
    if (selectedPeriods.length === 0) return null;
    const selected = selectedPeriods.map((id) => periods.find((p) => p.id === id)).filter(Boolean);
    if (selected.length === 0) return null;
    return { start: Math.min(...selected.map((p) => p.era[0])), end: Math.max(...selected.map((p) => p.era[1])) };
  }, [selectedPeriods, periods]);
  const findPeriod = useCallback((id) => getPeriod(periods, id), [periods]);

  const {
    handleEventApproved,
    handleAddEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveEdit,
    handleRevisionResubmit,
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
    revisingEvent,
    setRevisingEvent,
  });

  const {
    handleAddConnection,
    handleDeleteConnection,
    handleSuggestDeleteConnection,
    handleEditConnection,
    handleSaveConnectionEdit,
    handleScrollToEvent,
    handleConnectionRevisionResubmit,
  } = useConnectionHandlers({
    user,
    userName,
    isTeacher,
    defaultSection,
    editingConnection,
    setEditingConnection,
    setExpandedEvent,
    revisingConnection,
    setRevisingConnection,
  });

  // Count unique student contributors (exclude any teacher-created events)
  const teacherEmail = teacherData?.email || user?.email;
  const studentCount = useMemo(() => [
    ...new Set(
      approvedEvents.filter((e) => e.addedByEmail !== teacherEmail).map((e) => e.addedBy)
    ),
  ].length, [approvedEvents, teacherEmail]);

  // Loading state
  if (loading || (!user ? false : !isTeacher && sectionLoading)) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: FONT_MONO,
          color: theme.textSecondary,
          fontSize: FONT_SIZES.sm,
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
        onSelect={async (sectionId, teacherUid) => {
          await assignStudentSection(user.uid, sectionId, teacherUid, user.email, userName);
        }}
        userName={userName}
      />
    );
  }

  return (
    <div
      style={{
        fontFamily: FONT_SERIF,
        background: theme.pageBg,
        minHeight: "100vh",
        color: theme.pageText,
        colorScheme: mode,
      }}
      data-theme={mode}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        * { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        :root { --focus-ring: #2563EB; }
        [data-theme="dark"] { --focus-ring: #60A5FA; }
        :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
        :focus:not(:focus-visible) { outline: none; }
      `}</style>

      {/* Skip navigation link */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          zIndex: 10001,
          padding: SPACING[3],
          background: theme.activeToggleBg,
          color: theme.activeToggleText,
          fontFamily: FONT_MONO,
          fontSize: FONT_SIZES.base,
          fontWeight: 700,
          textDecoration: "none",
          borderRadius: 4,
        }}
        onFocus={(e) => { e.currentTarget.style.left = "8px"; e.currentTarget.style.top = "8px"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; e.currentTarget.style.top = "0"; }}
      >
        Skip to main content
      </a>

      {/* Impersonation Banner */}
      {impersonatingTeacher && (
        <div style={{
          background: "#7C3AED",
          color: "#fff",
          padding: `${SPACING[2]} ${SPACING[4]}`,
          fontSize: FONT_SIZES.tiny,
          fontFamily: FONT_MONO,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING[3],
        }}>
          <span>Viewing as {impersonatingTeacher.displayName || impersonatingTeacher.email}</span>
          <button
            onClick={() => setImpersonating(null)}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: `${SPACING[1]} ${SPACING["2.5"]}`,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        </div>
      )}

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
        setShowAddPanel={() => dispatchModal({ type: 'OPEN', modalType: 'addEvent' })}
        setShowAddConnectionPanel={() => dispatchModal({ type: 'OPEN', modalType: 'addConnection' })}
        logout={logout}
        showPendingQueue={showPendingQueue}
        setShowPendingQueue={() => dispatchModal({ type: 'OPEN', modalType: 'pendingQueue' })}
        myRevisionEvents={myRevisionEvents}
        myRevisionConnections={myRevisionConnections}
        setShowRevisionPanel={() => dispatchModal({ type: 'OPEN', modalType: 'revisionPanel' })}
      />

      {/* Admin View (full page, replaces timeline content) */}
      {showAdminView && isTeacher && (
        <AdminView
          sections={activeSections}
          pendingEvents={pendingEvents}
          pendingConnections={pendingConnections}
          needsRevisionEvents={needsRevisionEvents}
          needsRevisionConnections={needsRevisionConnections}
          allEvents={allEvents}
          allConnections={allConnections}
          allStudentAssignments={allStudentAssignments}
          getSectionName={getSectionName}
          onClose={() => setShowAdminView(false)}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onRenameSection={handleRenameSection}
          onEventApproved={handleEventApproved}
          displayPeriods={periods}
          reassignStudentSection={reassignStudentSection}
          removeStudentSection={removeStudentSection}
          user={user}
          userName={userName}
          isSuperAdmin={isSuperAdmin}
          teacherData={teacherData}
          onImpersonate={setImpersonating}
        />
      )}

      {/* Timeline Content (hidden when admin view is open) */}
      {!showAdminView && (
        <main id="main-content">
      <CompellingQuestionHero compellingQuestion={compellingQuestion} />

      {/* Visual Timeline */}
      <div data-timeline-section style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <VisualTimeline
            filteredEvents={filteredEvents}
            onEraClick={togglePeriod}
            onEventSelect={handleScrollToEvent}
            selectedPeriods={selectedPeriods}
            selectedEraRange={selectedEraRange}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            currentYear={new Date().getFullYear()}
            periods={periods}
            expandedEventId={expandedEvent}
            connectionsByEvent={connectionsByEvent}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: `${SPACING[5]} ${SPACING[8]}` }}>
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPeriods={selectedPeriods}
          togglePeriod={togglePeriod}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          tagMatchMode={tagMatchMode}
          setTagMatchMode={setTagMatchMode}
          clearAllFilters={clearAllFilters}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          showContributors={showContributors}
          setShowContributors={setShowContributors}
          displayPeriods={periods}
          findPeriod={findPeriod}
          filteredCount={filteredEvents.length}
          totalCount={approvedEvents.length}
        />

        <EventList
          filteredEvents={filteredEvents}
          expandedEvent={expandedEvent}
          setExpandedEvent={setExpandedEvent}
          readEvents={readEvents}
          connectionsByEvent={connectionsByEvent}
          approvedEvents={approvedEvents}
          approvedConnections={approvedConnections}
          filteredEventIds={filteredEventIds}
          displayPeriods={periods}
          isTeacher={isTeacher}
          showContributors={showContributors}
          handleEditEvent={handleEditEvent}
          handleDeleteEvent={handleDeleteEvent}
          handleScrollToEvent={handleScrollToEvent}
          handleDeleteConnection={handleDeleteConnection}
          handleEditConnection={handleEditConnection}
          handleSuggestDeleteConnection={handleSuggestDeleteConnection}
          teacherEmail={teacherEmail}
        />

        {/* Footer */}
        <footer
          style={{
            marginTop: SPACING[8],
            padding: `${SPACING[4]} 0`,
            borderTop: `1px solid ${theme.cardBorder}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: FONT_SIZES.micro,
              color: theme.textMuted,
              fontFamily: FONT_MONO,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Historian's Workshop Timeline Explorer &middot; {section}
            <br />
            Signed in as {user.displayName || user.email}
          </p>
        </footer>
      </div>
        </main>
      )}

      {/* Add Event Modal */}
      {showAddPanel && (
        <AddEventPanel
          onAdd={handleAddEvent}
          onClose={closeModal}
          userName={userName}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          periods={periods}
          fieldConfig={activeFieldConfig}
          isTeacher={isTeacher}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <AddEventPanel
          onAdd={handleSaveEdit}
          onClose={closeModal}
          userName={userName}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          periods={periods}
          fieldConfig={activeFieldConfig}
          editingEvent={editingEvent}
          isTeacher={isTeacher}
        />
      )}

      {/* Add Connection Modal */}
      {showAddConnectionPanel && (
        <AddConnectionPanel
          onAdd={handleAddConnection}
          onClose={closeModal}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={periods}
          isTeacher={isTeacher}
        />
      )}

      {/* Pending Queue Modal (students) */}
      {showPendingQueue && (
        <ModalShell onClose={closeModal} maxWidth={640}>
          <ModalCloseButton onClose={closeModal} />
            <ModerationPanel
              readOnly
              user={user}
              pendingEvents={pendingEvents}
              pendingConnections={pendingConnections}
              allEvents={allEvents}
              allConnections={allConnections}
              periods={periods}
              getSectionName={getSectionName}
              onEditPendingEvent={setEditingEvent}
              onEditPendingConnection={setEditingConnection}
              onWithdraw={(type, id) => {
                if (type === "event") handleDeleteEvent(id);
                else handleDeleteConnection(id);
              }}
            />
        </ModalShell>
      )}

      {/* Edit Connection Modal */}
      {editingConnection && (
        <AddConnectionPanel
          onAdd={handleSaveConnectionEdit}
          onClose={closeModal}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={periods}
          editingConnection={editingConnection}
          isTeacher={isTeacher}
        />
      )}

      {/* Revision Panel Modal (student notification view) */}
      {showRevisionPanel && (
        <RevisionPanel
          revisionEvents={myRevisionEvents}
          revisionConnections={myRevisionConnections}
          allEvents={allEvents}
          periods={periods}
          onReviseEvent={setRevisingEvent}
          onReviseConnection={setRevisingConnection}
          onClose={closeModal}
        />
      )}

      {/* Revision-mode Event Edit Modal */}
      {revisingEvent && (
        <AddEventPanel
          onAdd={handleRevisionResubmit}
          onClose={closeModal}
          userName={userName}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          periods={periods}
          fieldConfig={activeFieldConfig}
          editingEvent={revisingEvent}
          isTeacher={isTeacher}
          revisionMode
          feedback={revisingEvent.feedback}
        />
      )}

      {/* Revision-mode Connection Edit Modal */}
      {revisingConnection && (
        <AddConnectionPanel
          onAdd={handleConnectionRevisionResubmit}
          onClose={closeModal}
          userName={userName}
          approvedEvents={approvedEvents}
          periods={periods}
          editingConnection={revisingConnection}
          isTeacher={isTeacher}
          revisionMode
          feedback={revisingConnection.feedback}
        />
      )}

    </div>
  );
}
