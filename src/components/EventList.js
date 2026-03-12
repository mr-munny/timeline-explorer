import { useRef, useState, useMemo } from "react";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING } from "../contexts/ThemeContext";
import EventCard from "./EventCard";
import ConnectionLines from "./ConnectionLines";
import ContributorSidebar from "./ContributorSidebar";

export default function EventList({
  filteredEvents,
  expandedEvent,
  setExpandedEvent,
  readEvents,
  connectionsByEvent,
  approvedEvents,
  approvedConnections,
  filteredEventIds,
  displayPeriods,
  isTeacher,
  showContributors,
  handleEditEvent,
  handleDeleteEvent,
  handleScrollToEvent,
  handleDeleteConnection,
  handleEditConnection,
  handleSuggestDeleteConnection,
  teacherEmail,
  onLaunchEasterEgg,
  onLinkEasterEgg,
  onUnlinkEasterEgg,
  easterEggDiscoveries,
  user,
  bounties,
}) {
  const { theme } = useTheme();
  const eventListRef = useRef(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const discoveredEventIds = useMemo(() => {
    if (!easterEggDiscoveries || !user) return new Set();
    return new Set(
      easterEggDiscoveries
        .filter(d => d.uid === user.uid)
        .map(d => d.eventId)
    );
  }, [easterEggDiscoveries, user]);

  return (
    <div style={{ display: "flex", gap: SPACING[5], alignItems: "flex-start" }}>
      {/* Event list */}
      <div
        ref={eventListRef}
        role="list"
        aria-label="Timeline events"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: SPACING[2],
          minWidth: 0,
          position: "relative",
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: `${SPACING[10]} ${SPACING[5]}`,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
              fontSize: FONT_SIZES.base,
            }}
          >
            No events match your filters.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              role="listitem"
              data-event-id={event.id}
              onMouseEnter={() => setHoveredEvent(event.id)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <EventCard
                event={event}
                isExpanded={expandedEvent === event.id}
                isRead={readEvents.has(event.id)}
                onToggle={() =>
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
                onLaunchEasterEgg={onLaunchEasterEgg}
                onLinkEasterEgg={onLinkEasterEgg}
                onUnlinkEasterEgg={onUnlinkEasterEgg}
                hasDiscovered={discoveredEventIds.has(event.id)}
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
        <aside style={{ width: 220, flexShrink: 0 }} aria-label="Contributors">
          <ContributorSidebar events={approvedEvents} teacherEmail={teacherEmail} easterEggDiscoveries={easterEggDiscoveries} bounties={bounties} />
        </aside>
      )}
    </div>
  );
}
