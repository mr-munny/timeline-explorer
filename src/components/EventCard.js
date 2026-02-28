import { useState } from "react";
import { getPeriod } from "../data/constants";
import { formatEventDate, formatEventDateRange, MONTHS } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import arrowRightThick from "@iconify-icons/mdi/arrow-right-thick";
import arrowLeftThick from "@iconify-icons/mdi/arrow-left-thick";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import bookOpenPageVariantOutline from "@iconify-icons/mdi/book-open-page-variant-outline";
import fileDocumentOutline from "@iconify-icons/mdi/file-document-outline";
import linkVariant from "@iconify-icons/mdi/link-variant";
import accountOutline from "@iconify-icons/mdi/account-outline";
import mapMarkerOutline from "@iconify-icons/mdi/map-marker-outline";
import schoolOutline from "@iconify-icons/mdi/school-outline";
import { useTheme } from "../contexts/ThemeContext";

export default function EventCard({ event, isExpanded, onToggle, isTeacher, onEdit, onDelete, periods = [], onReturnToTimeline, connections, allEvents = [], onScrollToEvent, onDeleteConnection, connectionMode }) {
  const { theme } = useTheme();
  const [showEditHistory, setShowEditHistory] = useState(false);
  const period = getPeriod(periods, event.period);
  const periodColor = period?.color || "#6B7280";
  const editHistory = event.editHistory || [];
  const periodLabel = period?.label || event.period;

  const FIELD_LABELS = { title: "Title", year: "Year", month: "Month", day: "Day", endYear: "End Year", endMonth: "End Month", endDay: "End Day", period: "Period", tags: "Tags", sourceType: "Source Type", description: "Description", sourceNote: "Source", region: "Region" };
  const TEXT_FIELDS = new Set(["title", "description", "sourceNote"]);

  const computeWordDiff = (oldStr, newStr) => {
    const oldWords = String(oldStr ?? "").split(/(\s+)/);
    const newWords = String(newStr ?? "").split(/(\s+)/);
    const m = oldWords.length, n = newWords.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        result.push({ type: "same", text: oldWords[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.push({ type: "add", text: newWords[j - 1] });
        j--;
      } else {
        result.push({ type: "del", text: oldWords[i - 1] });
        i--;
      }
    }
    return result.reverse();
  };

  const formatFieldVal = (key, val) => {
    if (key === "tags") return (val || []).join(", ");
    if (key === "period") { const p = getPeriod(periods, val); return p?.label || val; }
    if ((key === "month" || key === "endMonth") && val) return MONTHS[val - 1] || String(val);
    return String(val ?? "");
  };

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
            whiteSpace: "nowrap",
          }}
        >
          {formatEventDate(event)}
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
              {editHistory.length > 0 && (
                <>
                  <span style={{ fontSize: 10, color: theme.textDivider }}>&middot;</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: theme.textTertiary,
                      fontFamily: "'Overpass Mono', monospace",
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
            {event.endYear && (
              <div>
                <span style={{ color: theme.textSecondary, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  Date Range
                </span>
                <div style={{ color: theme.textDescription, fontWeight: 600, marginTop: 2 }}>
                  {formatEventDateRange(event)}
                </div>
              </div>
            )}
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
                {editHistory.length > 0 ? "Authors" : "Added By"}
              </span>
              <div style={{ color: theme.textDescription, fontWeight: 600, marginTop: 2 }}>
                {event.addedBy}
              </div>
              {editHistory.length > 0 && (
                <div
                  onClick={(e) => { e.stopPropagation(); setShowEditHistory((v) => !v); }}
                  style={{
                    color: theme.textTertiary,
                    fontSize: 10,
                    marginTop: 3,
                    fontStyle: "italic",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.textDescription; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.textTertiary; }}
                >
                  <Icon icon={pencilOutline} width={9} />
                  edited by {[...new Set(editHistory.map((e) => e.name))].join(", ")}
                  <span style={{ fontSize: 8 }}>{showEditHistory ? "\u25B2" : "\u25BC"}</span>
                </div>
              )}
              {showEditHistory && editHistory.length > 0 && (
                <div style={{
                  marginTop: 6,
                  padding: "8px 10px",
                  background: theme.subtleBg,
                  borderRadius: 5,
                  fontSize: 10,
                  fontFamily: "'Overpass Mono', monospace",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {editHistory.map((entry, i) => (
                    <div key={i}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        color: theme.textDescription,
                        marginBottom: entry.changes && Object.keys(entry.changes).length > 0 ? 4 : 0,
                      }}>
                        <span style={{ fontWeight: 600 }}>{entry.name}</span>
                        <span style={{ color: theme.textTertiary }}>
                          {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {Object.entries(entry.changes).map(([key, { from, to }]) => (
                            <div key={key} style={{
                              padding: "3px 6px",
                              background: theme.warmSubtleBg,
                              borderRadius: 4,
                              borderLeft: `2px solid #D97706`,
                            }}>
                              <div style={{
                                fontSize: 8,
                                fontWeight: 700,
                                color: theme.textTertiary,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 2,
                              }}>
                                {FIELD_LABELS[key] || key}
                              </div>
                              <div style={{
                                fontSize: key === "description" ? 10 : 10,
                                fontFamily: TEXT_FIELDS.has(key) ? "'Newsreader', serif" : "'Overpass Mono', monospace",
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
                                    <span style={{ color: theme.textTertiary, margin: "0 4px" }}>{"\u2192"}</span>
                                    <span style={{ color: theme.successGreen || "#16A34A", fontWeight: 600 }}>{formatFieldVal(key, to)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {i < editHistory.length - 1 && (
                        <div style={{ borderBottom: `1px solid ${theme.inputBorder}`, marginTop: 6 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
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

          {/* Connections section */}
          {connections && (connections.causes.length > 0 || connections.effects.length > 0) && (
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
                  fontFamily: "'Overpass Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Connections
              </div>

              {connections.causes.map((conn) => {
                const target = allEvents.find((e) => e.id === conn.effectEventId);
                if (!target) return null;
                const targetPeriod = getPeriod(periods, target.period);
                return (
                  <div
                    key={conn.id}
                    onClick={(e) => { e.stopPropagation(); if (onScrollToEvent) onScrollToEvent(conn.effectEventId); }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "6px 8px",
                      marginBottom: 4,
                      borderRadius: 5,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon icon={arrowRightThick} width={14} style={{ color: theme.accentGold || "#F59E0B", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600, color: theme.textPrimary }}>
                        Leads to:{" "}
                        <span style={{ color: targetPeriod?.color || theme.textSecondary }}>{formatEventDate(target)}</span>
                        {" "}{target.title}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textSecondary, fontFamily: "'Newsreader', serif", marginTop: 2, lineHeight: 1.4 }}>
                        {conn.description}
                      </div>
                    </div>
                    {isTeacher && onDeleteConnection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this connection?")) onDeleteConnection(conn.id);
                        }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: theme.textMuted, padding: 2, flexShrink: 0,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Icon icon={closeCircleOutline} width={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              {connections.effects.map((conn) => {
                const source = allEvents.find((e) => e.id === conn.causeEventId);
                if (!source) return null;
                const sourcePeriod = getPeriod(periods, source.period);
                return (
                  <div
                    key={conn.id}
                    onClick={(e) => { e.stopPropagation(); if (onScrollToEvent) onScrollToEvent(conn.causeEventId); }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "6px 8px",
                      marginBottom: 4,
                      borderRadius: 5,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon icon={arrowLeftThick} width={14} style={{ color: theme.accentGold || "#F59E0B", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600, color: theme.textPrimary }}>
                        Caused by:{" "}
                        <span style={{ color: sourcePeriod?.color || theme.textSecondary }}>{formatEventDate(source)}</span>
                        {" "}{source.title}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textSecondary, fontFamily: "'Newsreader', serif", marginTop: 2, lineHeight: 1.4 }}>
                        {conn.description}
                      </div>
                    </div>
                    {isTeacher && onDeleteConnection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this connection?")) onDeleteConnection(conn.id);
                        }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: theme.textMuted, padding: 2, flexShrink: 0,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Icon icon={closeCircleOutline} width={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 6 }}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
                style={{
                  padding: "5px 12px",
                  background: "none",
                  border: `1.5px solid ${theme.inputBorder}`,
                  borderRadius: 6,
                  color: theme.textDescription,
                  fontSize: 11,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Icon icon={pencilOutline} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                {isTeacher ? "Edit" : "Suggest Edit"}
              </button>
            )}
            {isTeacher && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
