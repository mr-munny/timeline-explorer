import { useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import EventCard from "./EventCard";
import ConnectionLines from "./ConnectionLines";
import ContributorSidebar from "./ContributorSidebar";

export default function EventList({
  filteredEvents,
  connectionMode,
  expandedEvent,
  setExpandedEvent,
  hoveredEvent,
  setHoveredEvent,
  readEvents,
  connectionsByEvent,
  approvedEvents,
  approvedConnections,
  filteredEventIds,
  displayPeriods,
  isTeacher,
  showContributors,
  handleConnectionModeClick,
  handleEditEvent,
  handleDeleteEvent,
  handleScrollToEvent,
  handleDeleteConnection,
  handleEditConnection,
  handleSuggestDeleteConnection,
}) {
  const { theme } = useTheme();
  const eventListRef = useRef(null);

  return (
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
  );
}
