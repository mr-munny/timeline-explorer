import { useState, useRef, useEffect, useCallback } from "react";
import { getPeriod } from "../data/constants";
import { formatEventDate, formatEventDateRange, MONTHS } from "../utils/dateUtils";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import bookOpenPageVariantOutline from "@iconify-icons/mdi/book-open-page-variant-outline";
import fileDocumentOutline from "@iconify-icons/mdi/file-document-outline";
import linkVariant from "@iconify-icons/mdi/link-variant";
import imageOutline from "@iconify-icons/mdi/image-outline";
import accountOutline from "@iconify-icons/mdi/account-outline";
import mapMarkerOutline from "@iconify-icons/mdi/map-marker-outline";
import schoolOutline from "@iconify-icons/mdi/school-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII, Z_INDEX } from "../contexts/ThemeContext";
import IconButton from "./IconButton";
import EventConnections from "./EventConnections";

export default function EventCard({ event, isExpanded, isRead, onToggle, isTeacher, onEdit, onDelete, periods = [], onReturnToTimeline, connections, allEvents = [], onScrollToEvent, onDeleteConnection, onEditConnection, onSuggestDeleteConnection }) {
  const { theme } = useTheme();
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useRef(null);
  const period = getPeriod(periods, event.period);
  const periodColor = period?.color || "#6B7280";
  const editHistory = event.editHistory || [];
  const periodLabel = period?.label || event.period;

  const FIELD_LABELS = { title: "Title", year: "Year", month: "Month", day: "Day", endYear: "End Year", endMonth: "End Month", endDay: "End Day", period: "Period", tags: "Tags", sourceType: "Source Type", description: "Description", sourceNote: "Source", sourceUrl: "Source URL", imageUrl: "Image URL", region: "Region" };
  const TEXT_FIELDS = new Set(["title", "description", "sourceNote"]);

  const formatFieldVal = (key, val) => {
    if (key === "tags") return (val || []).join(", ");
    if (key === "period") { const p = getPeriod(periods, val); return p?.label || val; }
    if ((key === "month" || key === "endMonth") && val) return MONTHS[val - 1] || String(val);
    return String(val ?? "");
  };

  // Lightbox: escape to close, focus trap
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox]);

  return (
    <div
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`${event.title}, ${formatEventDate(event)}`}
      style={{
        background: theme.cardBg,
        border: `1.5px solid ${isExpanded ? periodColor + "60" : theme.cardBorder}`,
        borderRadius: RADII.xl,
        padding: isExpanded ? `${SPACING[4]} ${SPACING[5]}` : `${SPACING[3]} ${SPACING[5]}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isExpanded ? `0 8px 24px ${periodColor}12` : "none",
        borderLeft: isRead ? `1.5px solid ${isExpanded ? periodColor + "60" : theme.cardBorder}` : `4px solid ${periodColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING[3] }}>
        {/* Year badge */}
        <div
          style={{
            background: periodColor,
            color: "#fff",
            fontSize: FONT_SIZES.tiny,
            fontWeight: 700,
            padding: `${SPACING[1]} ${SPACING[2]}`,
            borderRadius: RADII.sm,
            fontFamily: FONT_MONO,
            flexShrink: 0,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            minWidth: 42,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {formatEventDate(event)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: FONT_SIZES.md,
              fontWeight: 700,
              color: theme.textPrimary,
              margin: 0,
              fontFamily: FONT_SERIF,
              lineHeight: 1.35,
            }}
          >
            {event.title}
          </h3>

          {!isExpanded && (
            <div style={{ display: "flex", gap: SPACING[1], flexWrap: "wrap", marginTop: SPACING["1.5"] }}>
              <span
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: periodColor,
                  fontFamily: FONT_MONO,
                  fontWeight: 600,
                }}
              >
                {period?.label.slice(0, 12) || event.period}
              </span>
              <span style={{ fontSize: FONT_SIZES.tiny, color: theme.textDivider }}>&middot;</span>
              <span
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: theme.textSecondary,
                  fontFamily: FONT_MONO,
                }}
              >
                {(event.tags || []).slice(0, 3).join(", ")}
              </span>
              <span style={{ fontSize: FONT_SIZES.tiny, color: theme.textDivider }}>&middot;</span>
              <span
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: theme.textSecondary,
                  fontFamily: FONT_MONO,
                }}
              >
                {event.addedBy}
              </span>
              {editHistory.length > 0 && (
                <>
                  <span style={{ fontSize: FONT_SIZES.tiny, color: theme.textDivider }}>&middot;</span>
                  <span
                    style={{
                      fontSize: FONT_SIZES.tiny,
                      color: theme.textTertiary,
                      fontFamily: FONT_MONO,
                      fontStyle: "italic",
                    }}
                  >
                    edited
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <Icon
          icon={chevronDown}
          width={18}
          aria-hidden="true"
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
        <div style={{ marginTop: SPACING[3], marginLeft: 54 }}>
          {onReturnToTimeline && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onReturnToTimeline();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onReturnToTimeline(); } }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: SPACING[1],
                padding: `${SPACING[1]} ${SPACING[2]}`,
                borderRadius: RADII.sm,
                background: theme.subtleBg,
                color: theme.textMuted,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: SPACING["2.5"],
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
          <div style={{ display: "flex", gap: SPACING[3], marginBottom: SPACING[3] }}>
            <p
              style={{
                fontSize: FONT_SIZES.base,
                lineHeight: 1.7,
                color: theme.textDescription,
                margin: 0,
                fontFamily: FONT_SERIF,
                flex: 1,
              }}
            >
              {event.description}
            </p>

            {/* Image */}
            {event.imageUrl && (
              <div style={{ flexShrink: 0, maxWidth: "40%" }}>
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 250,
                    borderRadius: RADII.lg,
                    objectFit: "contain",
                    background: theme.subtleBg,
                    display: "block",
                    cursor: "zoom-in",
                  }}
                  onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: SPACING["1.5"], flexWrap: "wrap", marginBottom: SPACING[3] }}>
            {(event.tags || []).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: theme.textTertiary,
                  background: theme.subtleBg,
                  padding: `${SPACING[1]} ${SPACING[2]}`,
                  borderRadius: RADII.sm,
                  fontFamily: FONT_MONO,
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
              gap: `${SPACING[2]} ${SPACING[4]}`,
              padding: `${SPACING[3]} ${SPACING[3]}`,
              background: theme.warmSubtleBg,
              borderRadius: RADII.lg,
              fontSize: FONT_SIZES.sm,
              fontFamily: FONT_MONO,
            }}
          >
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                <Icon icon={bookOpenPageVariantOutline} width={11} aria-hidden="true" />
                Time Period
              </span>
              <div style={{ color: periodColor, fontWeight: 700, marginTop: SPACING["0.5"] }}>
                {periodLabel}
              </div>
            </div>
            {event.endYear && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  Date Range
                </span>
                <div style={{ color: theme.textDescription, fontWeight: 600, marginTop: SPACING["0.5"] }}>
                  {formatEventDateRange(event)}
                </div>
              </div>
            )}
            {event.sourceType && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  <Icon icon={fileDocumentOutline} width={11} aria-hidden="true" />
                  Source Type
                </span>
                <div
                  style={{
                    marginTop: SPACING["0.5"],
                    display: "block",
                    color: event.sourceType === "Primary" ? "#059669" : "#6366F1",
                    fontWeight: 700,
                  }}
                >
                  {event.sourceType} Source
                </div>
              </div>
            )}
            {(event.sourceNote || event.sourceUrl) && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  <Icon icon={linkVariant} width={11} aria-hidden="true" />
                  Source
                </span>
                {event.sourceNote && (
                  <div style={{ color: theme.textDescription, marginTop: SPACING["0.5"] }}>{event.sourceNote}</div>
                )}
                {event.sourceUrl && (
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: "#2563EB",
                      fontSize: FONT_SIZES.tiny,
                      fontFamily: FONT_MONO,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: SPACING["0.5"],
                      marginTop: SPACING["0.5"],
                      wordBreak: "break-all",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    <Icon icon={linkVariant} width={10} aria-hidden="true" />
                    {(() => { try { return new URL(event.sourceUrl).hostname.replace("www.", ""); } catch { return event.sourceUrl; } })()}
                  </a>
                )}
              </div>
            )}
            {event.imageUrl && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  <Icon icon={imageOutline} width={11} aria-hidden="true" />
                  Image Source
                </span>
                <a
                  href={event.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "#2563EB",
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_MONO,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING["0.5"],
                    marginTop: SPACING["0.5"],
                    wordBreak: "break-all",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  {(() => { try { return new URL(event.imageUrl).hostname.replace("www.", ""); } catch { return event.imageUrl; } })()}
                </a>
              </div>
            )}
            <div>
              <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                <Icon icon={accountOutline} width={11} aria-hidden="true" />
                {editHistory.length > 0 ? "Authors" : "Added By"}
              </span>
              <div style={{ color: theme.textDescription, fontWeight: 600, marginTop: SPACING["0.5"] }}>
                {event.addedBy}
              </div>
              {editHistory.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEditHistory((v) => !v); }}
                  aria-expanded={showEditHistory}
                  aria-label="Toggle edit history"
                  style={{
                    color: theme.textTertiary,
                    fontSize: FONT_SIZES.tiny,
                    marginTop: SPACING["0.5"],
                    fontStyle: "italic",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: SPACING["0.5"],
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: FONT_MONO,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.textDescription; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.textTertiary; }}
                >
                  <Icon icon={pencilOutline} width={10} aria-hidden="true" />
                  edited by {[...new Set(editHistory.map((e) => e.name))].join(", ")}
                  <span style={{ fontSize: FONT_SIZES.micro }} aria-hidden="true">{showEditHistory ? "\u25B2" : "\u25BC"}</span>
                </button>
              )}
              {showEditHistory && editHistory.length > 0 && (
                <div style={{
                  marginTop: SPACING["1.5"],
                  padding: `${SPACING[2]} ${SPACING["2.5"]}`,
                  background: theme.subtleBg,
                  borderRadius: RADII.sm,
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_MONO,
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACING[2],
                }}>
                  {editHistory.map((entry, i) => (
                    <div key={i}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: SPACING[2],
                        color: theme.textDescription,
                        marginBottom: entry.changes && Object.keys(entry.changes).length > 0 ? SPACING[1] : 0,
                      }}>
                        <span style={{ fontWeight: 600 }}>{entry.name}</span>
                        <span style={{ color: theme.textTertiary }}>
                          {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: SPACING["0.5"] }}>
                          {Object.entries(entry.changes).map(([key, { from, to }]) => (
                            <div key={key} style={{
                              padding: `${SPACING[1]} ${SPACING["1.5"]}`,
                              background: theme.warmSubtleBg,
                              borderRadius: RADII.sm,
                              borderLeft: `2px solid ${theme.feedbackAmber}`,
                            }}>
                              <div style={{
                                fontSize: FONT_SIZES.micro,
                                fontWeight: 700,
                                color: theme.textTertiary,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: SPACING["0.5"],
                              }}>
                                {FIELD_LABELS[key] || key}
                              </div>
                              <div style={{
                                fontSize: FONT_SIZES.tiny,
                                fontFamily: TEXT_FIELDS.has(key) ? FONT_SERIF : FONT_MONO,
                                lineHeight: 1.4,
                              }}>
                                {TEXT_FIELDS.has(key) ? (
                                  computeWordDiff(from, to).map((part, pi) =>
                                    part.type === "same" ? (
                                      <span key={pi} style={{ color: theme.textDescription }}>{part.text}</span>
                                    ) : part.type === "del" ? (
                                      <span key={pi} style={{ color: theme.errorRed, textDecoration: "line-through", opacity: 0.7 }}>{part.text}</span>
                                    ) : (
                                      <span key={pi} style={{ color: theme.successGreen || "#16A34A", fontWeight: 600, background: (theme.successGreen || "#16A34A") + "15", borderRadius: 2 }}>{part.text}</span>
                                    )
                                  )
                                ) : (
                                  <>
                                    <span style={{ color: theme.errorRed, textDecoration: "line-through", opacity: 0.7 }}>{formatFieldVal(key, from)}</span>
                                    <span style={{ color: theme.textTertiary, margin: `0 ${SPACING[1]}` }}>{"\u2192"}</span>
                                    <span style={{ color: theme.successGreen || "#16A34A", fontWeight: 600 }}>{formatFieldVal(key, to)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {i < editHistory.length - 1 && (
                        <div style={{ borderBottom: `1px solid ${theme.inputBorder}`, marginTop: SPACING["1.5"] }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {event.region && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  <Icon icon={mapMarkerOutline} width={11} aria-hidden="true" />
                  Region
                </span>
                <div style={{ color: theme.textDescription, marginTop: SPACING["0.5"] }}>{event.region}</div>
              </div>
            )}
            {event.section && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: SPACING["0.5"] }}>
                  <Icon icon={schoolOutline} width={11} aria-hidden="true" />
                  Section
                </span>
                <div style={{ color: theme.textDescription, marginTop: SPACING["0.5"] }}>{event.section}</div>
              </div>
            )}
          </div>

          {/* Connections section */}
          {connections && (connections.causes.length > 0 || connections.effects.length > 0) && (
            <EventConnections
              connections={connections}
              allEvents={allEvents}
              periods={periods}
              isTeacher={isTeacher}
              onScrollToEvent={onScrollToEvent}
              onEditConnection={onEditConnection}
              onDeleteConnection={onDeleteConnection}
              onSuggestDeleteConnection={onSuggestDeleteConnection}
            />
          )}

          {/* Action buttons */}
          <div style={{ marginTop: SPACING["2.5"], display: "flex", justifyContent: "flex-end", gap: SPACING["1.5"] }}>
            {onEdit && (
              <IconButton
                icon={pencilOutline}
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                title={isTeacher ? "Edit event" : "Suggest an edit"}
                size={13}
                color={theme.textDescription}
                hoverBg={theme.subtleBg}
                style={{ padding: `${SPACING["1.5"]} ${SPACING[3]}`, border: `1.5px solid ${theme.inputBorder}`, borderRadius: RADII.md, fontSize: FONT_SIZES.sm, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                {isTeacher ? "Edit" : "Suggest Edit"}
              </IconButton>
            )}
            {isTeacher && (
              <IconButton
                icon={deleteOutline}
                onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this event? This cannot be undone.")) onDelete(event.id); }}
                title="Delete event"
                size={13}
                color={theme.errorRed}
                hoverBg={(theme.errorRed || "#DC2626") + "10"}
                style={{ padding: `${SPACING["1.5"]} ${SPACING[3]}`, border: `1.5px solid ${theme.errorRed}`, borderRadius: RADII.md, fontSize: FONT_SIZES.sm, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Delete Event
              </IconButton>
            )}
          </div>
        </div>
      )}
      {lightboxOpen && event.imageUrl && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Image: ${event.title}`}
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setLightboxOpen(false); } }}
          tabIndex={-1}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: Z_INDEX.lightbox,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: RADII.lg,
            }}
          />
        </div>
      )}
    </div>
  );
}
