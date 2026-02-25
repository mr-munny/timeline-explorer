import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
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

function getInitialSection() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "Period1";
}

export default function App() {
  const { user, loading, authError, login, logout, isTeacher } = useAuth();
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
          color: "#9CA3AF",
          fontSize: 13,
          background: "#F7F7F5",
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
        background: "#F7F7F5",
        minHeight: "100vh",
        color: "#1a1a1a",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ background: "#18181B", color: "#fff", padding: "24px 28px 16px" }}>
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
                    color: "#F59E0B",
                    fontFamily: "'Overpass Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: "#F59E0B18",
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
                      color: "#34D399",
                      fontFamily: "'Overpass Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "#34D39918",
                      padding: "3px 8px",
                      borderRadius: 4,
                    }}
                  >
                    Teacher View
                  </span>
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
                }}
              >
                Timeline Explorer
              </h1>
              <p
                style={{
                  fontSize: 11,
                  color: "#71717A",
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
                          background: isActive ? "#F59E0B" : "#ffffff18",
                          color: isActive ? "#18181B" : "#71717A",
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
                    background: "#6366F1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: 700,
                    cursor: seeding ? "default" : "pointer",
                  }}
                >
                  {seeding ? "Seeding..." : "Seed Database"}
                </button>
              )}
              {isTeacher && pendingEvents.length > 0 && (
                <button
                  onClick={() => setShowModeration(true)}
                  style={{
                    padding: "10px 18px",
                    background: "#EF4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: 700,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  Review ({pendingEvents.length})
                </button>
              )}
              <button
                onClick={() => setShowAddPanel(true)}
                style={{
                  padding: "10px 18px",
                  background: "#F59E0B",
                  color: "#18181B",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                + Add Event
              </button>
              <button
                onClick={logout}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  color: "#71717A",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEBEB" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <VisualTimeline
            filteredEvents={filteredEvents}
            onEraClick={setSelectedUnit}
            selectedUnit={selectedUnit}
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
          <input
            type="text"
            placeholder="Search events, people, regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: "1 1 200px",
              padding: "9px 14px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'Overpass Mono', monospace",
              background: "#fff",
              outline: "none",
              minWidth: 160,
            }}
          />
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{
              padding: "9px 12px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: "#fff",
              cursor: "pointer",
              color:
                selectedUnit === "all"
                  ? "#9CA3AF"
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
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: "#fff",
              cursor: "pointer",
              color: selectedTag === "all" ? "#9CA3AF" : "#1a1a1a",
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
                border: "1.5px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                background: "#fff",
                cursor: "pointer",
                color: sectionFilter === "all" ? "#9CA3AF" : "#1a1a1a",
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
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: "#fff",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            {sortOrder === "chrono" ? "\u2191 Oldest" : "\u2193 Newest"}
          </button>
          <button
            onClick={() => setShowContributors((s) => !s)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${showContributors ? "#1a1a1a" : "#E5E7EB"}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: showContributors ? "#1a1a1a" : "#fff",
              color: showContributors ? "#fff" : "#6B7280",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
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
                color: "#B0B0B0",
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              Showing:
            </span>
            {selectedUnit !== "all" && (
              <span
                style={{
                  fontSize: 10,
                  background: getUnit(selectedUnit)?.bg,
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
                  background: "#F3F4F6",
                  color: "#374151",
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
                  background: "#F3F4F6",
                  color: "#374151",
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
                  background: "#F3F4F6",
                  color: "#374151",
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
                color: "#EF4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
              }}
            >
              Clear
            </button>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#9CA3AF",
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
                  color: "#9CA3AF",
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
            borderTop: "1px solid #EBEBEB",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "#B0B0B0",
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
