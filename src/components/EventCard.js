import { getPeriod } from "../data/constants";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import bookOpenPageVariantOutline from "@iconify-icons/mdi/book-open-page-variant-outline";
import fileDocumentOutline from "@iconify-icons/mdi/file-document-outline";
import linkVariant from "@iconify-icons/mdi/link-variant";
import accountOutline from "@iconify-icons/mdi/account-outline";
import mapMarkerOutline from "@iconify-icons/mdi/map-marker-outline";
import schoolOutline from "@iconify-icons/mdi/school-outline";
import { useTheme } from "../contexts/ThemeContext";

export default function EventCard({ event, isExpanded, onToggle, isTeacher, onDelete, periods = [], onReturnToTimeline }) {
  const { theme } = useTheme();
  const period = getPeriod(periods, event.period);
  const periodColor = period?.color || "#6B7280";
  const periodLabel = period?.label || event.period;

  return (
    <div
      onClick={onToggle}
      style={{
        background: theme.cardBg,
        border: `1.5px solid ${isExpanded ? periodColor + "60" : theme.cardBorder}`,
        borderRadius: 10,
        padding: isExpanded ? "18px 22px" : "14px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isExpanded ? `0 8px 24px ${periodColor}12` : "none",
        borderLeft: `4px solid ${periodColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Year badge */}
        <div
          style={{
            background: periodColor,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: 5,
            fontFamily: "'Overpass Mono', monospace",
            flexShrink: 0,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            minWidth: 42,
            textAlign: "center",
          }}
        >
          {event.year}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: theme.textPrimary,
              margin: 0,
              fontFamily: "'Newsreader', 'Georgia', serif",
              lineHeight: 1.35,
            }}
          >
            {event.title}
          </h3>

          {!isExpanded && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
              <span
                style={{
                  fontSize: 10,
                  color: periodColor,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {period?.label.slice(0, 12) || event.period}
              </span>
              <span style={{ fontSize: 10, color: theme.textDivider }}>&middot;</span>
              <span
                style={{
                  fontSize: 10,
                  color: theme.textSecondary,
                  fontFamily: "'Overpass Mono', monospace",
                }}
              >
                {(event.tags || []).slice(0, 3).join(", ")}
              </span>
              <span style={{ fontSize: 10, color: theme.textDivider }}>&middot;</span>
              <span
                style={{
                  fontSize: 10,
                  color: theme.textSecondary,
                  fontFamily: "'Overpass Mono', monospace",
                }}
              >
                {event.addedBy}
              </span>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <Icon
          icon={chevronDown}
          width={18}
          style={{
            color: theme.textDivider,
            transition: "transform 0.2s",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            marginTop: 2,
          }}
        />
      </div>

      {isExpanded && (
        <div style={{ marginTop: 14, marginLeft: 54 }}>
          {onReturnToTimeline && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onReturnToTimeline();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onReturnToTimeline(); } }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 4,
                background: theme.subtleBg,
                color: theme.textMuted,
                fontSize: 9,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
            >
              {"\u2191"} Return to timeline
            </div>
          )}
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: theme.textDescription,
              margin: "0 0 14px 0",
              fontFamily: "'Newsreader', 'Georgia', serif",
            }}
          >
            {event.description}
          </p>

          {/* Tags */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {(event.tags || []).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  color: theme.textTertiary,
                  background: theme.subtleBg,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Metadata grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 16px",
              padding: "12px 14px",
              background: theme.warmSubtleBg,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
            }}
          >
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={bookOpenPageVariantOutline} width={11} />
                Time Period
              </span>
              <div style={{ color: periodColor, fontWeight: 700, marginTop: 2 }}>
                {periodLabel}
              </div>
            </div>
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={fileDocumentOutline} width={11} />
                Source Type
              </span>
              <div
                style={{
                  marginTop: 2,
                  display: "inline-block",
                  color: event.sourceType === "Primary" ? "#059669" : "#6366F1",
                  fontWeight: 700,
                }}
              >
                {event.sourceType || "Primary"} Source
              </div>
            </div>
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={linkVariant} width={11} />
                Source
              </span>
              <div style={{ color: theme.textDescription, marginTop: 2 }}>{event.sourceNote}</div>
            </div>
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={accountOutline} width={11} />
                Added By
              </span>
              <div style={{ color: theme.textDescription, fontWeight: 600, marginTop: 2 }}>
                {event.addedBy}
              </div>
            </div>
            {event.region && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon icon={mapMarkerOutline} width={11} />
                  Region
                </span>
                <div style={{ color: theme.textDescription, marginTop: 2 }}>{event.region}</div>
              </div>
            )}
            {event.section && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon icon={schoolOutline} width={11} />
                  Section
                </span>
                <div style={{ color: theme.textDescription, marginTop: 2 }}>{event.section}</div>
              </div>
            )}
          </div>

          {/* Teacher delete button */}
          {isTeacher && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this event? This cannot be undone.")) {
                    onDelete(event.id);
                  }
                }}
                style={{
                  padding: "5px 12px",
                  background: "none",
                  border: `1.5px solid ${theme.errorRed}`,
                  borderRadius: 6,
                  color: theme.errorRed,
                  fontSize: 11,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Icon icon={deleteOutline} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                Delete Event
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
