import { UNITS, getUnit } from "../data/constants";
import { useTheme } from "../contexts/ThemeContext";

export default function VisualTimeline({ filteredEvents, onEraClick, selectedUnit, timelineStart = 1910, timelineEnd = 2000, currentYear }) {
  const { theme } = useTheme();
  const minYear = timelineStart;
  const maxYear = timelineEnd;
  const totalSpan = maxYear - minYear;
  const showFutureOverlay = currentYear && maxYear > currentYear;

  const getPosition = (year) =>
    Math.max(0, Math.min(100, ((year - minYear) / totalSpan) * 100));

  return (
    <div style={{ padding: "16px 24px 8px", position: "relative" }}>
      {/* Era bands */}
      <div
        style={{
          position: "relative",
          height: 40,
          borderRadius: 6,
          overflow: "hidden",
          background: theme.subtleBg,
        }}
      >
        {UNITS.map((u) => {
          const left = getPosition(u.era[0]);
          const width = getPosition(u.era[1]) - left;
          const isActive = selectedUnit === "all" || selectedUnit === u.id;
          return (
            <div
              key={u.id}
              onClick={() => onEraClick(u.id === selectedUnit ? "all" : u.id)}
              title={u.label}
              style={{
                position: "absolute",
                left: `${left}%`,
                width: `${width}%`,
                top: 0,
                bottom: 0,
                background: isActive ? u.accent + "25" : theme.subtleBg,
                borderLeft: `2px solid ${isActive ? u.color : theme.inputBorder}`,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: isActive ? u.color : theme.textSecondary,
                  fontFamily: "'Overpass Mono', monospace",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  opacity: width > 4 ? 1 : 0,
                  transition: "opacity 0.3s",
                }}
              >
                {u.short}
              </span>
            </div>
          );
        })}
        {/* Future overlay — striped region beyond the current year */}
        {showFutureOverlay && (() => {
          const futureLeft = getPosition(currentYear);
          const futureWidth = 100 - futureLeft;
          return (
            <div
              title={`${currentYear}–${maxYear}: Future`}
              style={{
                position: "absolute",
                left: `${futureLeft}%`,
                width: `${futureWidth}%`,
                top: 0,
                bottom: 0,
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 3px,
                  ${theme.textMuted}18 3px,
                  ${theme.textMuted}18 6px
                )`,
                borderLeft: `1.5px dashed ${theme.textMuted}60`,
                pointerEvents: "none",
                zIndex: 3,
                transition: "all 0.3s ease",
              }}
            />
          );
        })()}
      </div>

      {/* Event markers */}
      <div style={{ position: "relative", height: 28, marginTop: 2 }}>
        {filteredEvents.map((event) => {
          const unit = getUnit(event.unit);
          if (!unit) return null;
          const left = getPosition(event.year);
          return (
            <div
              key={event.id}
              title={`${event.year}: ${event.title}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: 4,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: unit.color,
                border: `2px solid ${theme.cardBg}`,
                boxShadow: `0 0 0 1px ${unit.color}40`,
                transform: "translateX(-50%)",
                transition: "all 0.3s ease",
                zIndex: 2,
              }}
            />
          );
        })}
      </div>

      {/* Year labels */}
      <div style={{ position: "relative", height: 14 }}>
        {Array.from(
          { length: Math.floor((maxYear - minYear) / 10) + 1 },
          (_, i) => minYear + i * 10
        ).filter((y) => y <= maxYear).map((y) => (
          <span
            key={y}
            style={{
              position: "absolute",
              left: `${getPosition(y)}%`,
              transform: "translateX(-50%)",
              fontSize: 9,
              color: theme.textMuted,
              fontFamily: "'Overpass Mono', monospace",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {y}
          </span>
        ))}
      </div>
    </div>
  );
}
