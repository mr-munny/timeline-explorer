import { getUnit } from "../data/constants";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import bookOpenPageVariantOutline from "@iconify-icons/mdi/book-open-page-variant-outline";
import fileDocumentOutline from "@iconify-icons/mdi/file-document-outline";
import linkVariant from "@iconify-icons/mdi/link-variant";
import accountOutline from "@iconify-icons/mdi/account-outline";
import mapMarkerOutline from "@iconify-icons/mdi/map-marker-outline";
import schoolOutline from "@iconify-icons/mdi/school-outline";

export default function EventCard({ event, isExpanded, onToggle, isTeacher, onDelete }) {
  const unit = getUnit(event.unit);
  const unitColor = unit?.color || "#6B7280";
  const unitLabel = unit?.label || event.unit;

  return (
    <div
      onClick={onToggle}
      style={{
        background: "#fff",
        border: `1.5px solid ${isExpanded ? unitColor + "60" : "#EBEBEB"}`,
        borderRadius: 10,
        padding: isExpanded ? "18px 22px" : "14px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isExpanded ? `0 8px 24px ${unitColor}12` : "none",
        borderLeft: `4px solid ${unitColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Year badge */}
        <div
          style={{
            background: unitColor,
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
              color: "#1a1a1a",
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
                  color: unitColor,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {unit?.short || event.unit}
              </span>
              <span style={{ fontSize: 10, color: "#D1D5DB" }}>&middot;</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#9CA3AF",
                  fontFamily: "'Overpass Mono', monospace",
                }}
              >
                {(event.tags || []).slice(0, 3).join(", ")}
              </span>
              <span style={{ fontSize: 10, color: "#D1D5DB" }}>&middot;</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#9CA3AF",
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
            color: "#D1D5DB",
            transition: "transform 0.2s",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            marginTop: 2,
          }}
        />
      </div>

      {isExpanded && (
        <div style={{ marginTop: 14, marginLeft: 54 }}>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#374151",
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
                  color: "#6B7280",
                  background: "#F3F4F6",
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
              background: "#FAFAF8",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
            }}
          >
            <div>
              <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={bookOpenPageVariantOutline} width={11} />
                Unit
              </span>
              <div style={{ color: unitColor, fontWeight: 700, marginTop: 2 }}>
                {unitLabel}
              </div>
            </div>
            <div>
              <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
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
              <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={linkVariant} width={11} />
                Source
              </span>
              <div style={{ color: "#374151", marginTop: 2 }}>{event.sourceNote}</div>
            </div>
            <div>
              <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon icon={accountOutline} width={11} />
                Added By
              </span>
              <div style={{ color: "#374151", fontWeight: 600, marginTop: 2 }}>
                {event.addedBy}
              </div>
            </div>
            {event.region && (
              <div>
                <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon icon={mapMarkerOutline} width={11} />
                  Region
                </span>
                <div style={{ color: "#374151", marginTop: 2 }}>{event.region}</div>
              </div>
            )}
            {event.section && (
              <div>
                <span style={{ color: "#9CA3AF", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon icon={schoolOutline} width={11} />
                  Section
                </span>
                <div style={{ color: "#374151", marginTop: 2 }}>{event.section}</div>
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
                  border: "1.5px solid #EF4444",
                  borderRadius: 6,
                  color: "#EF4444",
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
