import { getPeriod } from "../data/constants";
import { useTheme, FONT_MONO } from "../contexts/ThemeContext";
import ConnectionItem from "./ConnectionItem";

export default function EventConnections({ connections, allEvents = [], periods = [], isTeacher, onScrollToEvent, onEditConnection, onDeleteConnection, onSuggestDeleteConnection }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        background: theme.warmSubtleBg,
        borderRadius: 8,
        borderLeft: `3px solid ${theme.accentGold || "#F59E0B"}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: theme.textTertiary,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
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
