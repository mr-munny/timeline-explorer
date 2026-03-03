import { getPeriod } from "../data/constants";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import ConnectionItem from "./ConnectionItem";

export default function EventConnections({ connections, allEvents = [], periods = [], isTeacher, onScrollToEvent, onEditConnection, onDeleteConnection, onSuggestDeleteConnection }) {
  const { theme } = useTheme();

  return (
    <div
      aria-label="Event connections"
      style={{
        marginTop: SPACING[3],
        padding: `${SPACING[3]} ${SPACING[3]}`,
        background: theme.warmSubtleBg,
        borderRadius: RADII.lg,
        borderLeft: `3px solid ${theme.accentGold || "#F59E0B"}`,
      }}
    >
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          fontWeight: 700,
          color: theme.textTertiary,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: SPACING[2],
        }}
      >
        Connections
      </div>

      {connections.causes.map((conn) => {
        const target = allEvents.find((e) => e.id === conn.effectEventId);
        const targetPeriod = target ? getPeriod(periods, target.period) : null;
        return (
          <ConnectionItem
            key={conn.id}
            conn={conn}
            relatedEvent={target}
            relatedPeriod={targetPeriod}
            direction="cause"
            isTeacher={isTeacher}
            allEvents={allEvents}
            onScrollToEvent={onScrollToEvent}
            onEditConnection={onEditConnection}
            onDeleteConnection={onDeleteConnection}
            onSuggestDeleteConnection={onSuggestDeleteConnection}
          />
        );
      })}

      {connections.effects.map((conn) => {
        const source = allEvents.find((e) => e.id === conn.causeEventId);
        const sourcePeriod = source ? getPeriod(periods, source.period) : null;
        return (
          <ConnectionItem
            key={conn.id}
            conn={conn}
            relatedEvent={source}
            relatedPeriod={sourcePeriod}
            direction="effect"
            isTeacher={isTeacher}
            allEvents={allEvents}
            onScrollToEvent={onScrollToEvent}
            onEditConnection={onEditConnection}
            onDeleteConnection={onDeleteConnection}
            onSuggestDeleteConnection={onSuggestDeleteConnection}
          />
        );
      })}
    </div>
  );
}
