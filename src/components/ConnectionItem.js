import { useState } from "react";
import { formatEventDate } from "../utils/dateUtils";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import arrowRightThick from "@iconify-icons/mdi/arrow-right-thick";
import arrowLeftThick from "@iconify-icons/mdi/arrow-left-thick";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import IconButton from "./IconButton";

export default function ConnectionItem({ conn, relatedEvent, relatedPeriod, direction, isTeacher, allEvents = [], onScrollToEvent, onEditConnection, onDeleteConnection, onSuggestDeleteConnection }) {
  const { theme } = useTheme();
  const [showHistory, setShowHistory] = useState(false);

  if (!relatedEvent) return null;

  const isCause = direction === "cause";
  const arrowIcon = isCause ? arrowRightThick : arrowLeftThick;
  const label = isCause ? "Leads to:" : "Caused by:";
  const scrollTargetId = isCause ? conn.effectEventId : conn.causeEventId;
  const connHistory = conn.editHistory || [];

  return (
    <div>
      <div
        onClick={(e) => { e.stopPropagation(); if (onScrollToEvent) onScrollToEvent(scrollTargetId); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onScrollToEvent) { e.preventDefault(); e.stopPropagation(); onScrollToEvent(scrollTargetId); } }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: SPACING[2],
          padding: `${SPACING["1.5"]} ${SPACING[2]}`,
          marginBottom: connHistory.length > 0 ? 0 : SPACING[1],
          borderRadius: RADII.sm,
          cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <Icon icon={arrowIcon} width={14} style={{ color: theme.accentGold || "#F59E0B", marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FONT_SIZES.base, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
            {label}{" "}
            <span style={{ color: relatedPeriod?.color || theme.textSecondary }}>{formatEventDate(relatedEvent)}</span>
            {" "}{relatedEvent.title}
          </div>
          <div style={{ fontSize: FONT_SIZES.sm, color: theme.textSecondary, fontFamily: FONT_SERIF, marginTop: SPACING["0.5"], lineHeight: 1.4 }}>
            {conn.description}
          </div>
        </div>
        <div style={{ display: "flex", gap: SPACING["0.5"], flexShrink: 0 }}>
          {onEditConnection && (
            <IconButton icon={pencilOutline} onClick={(e) => { e.stopPropagation(); onEditConnection(conn); }} title="Edit connection" size={14} color={theme.textMuted} hoverColor={theme.textPrimary} hoverBg={theme.subtleBg} padding={2} borderRadius={3} />
          )}
          {isTeacher && onDeleteConnection && (
            <IconButton icon={closeCircleOutline} onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this connection?")) onDeleteConnection(conn.id); }} title="Delete connection" size={14} color={theme.textMuted} hoverColor={theme.errorRed || "#DC2626"} hoverBg={(theme.errorRed || "#DC2626") + "10"} padding={2} borderRadius={3} />
          )}
          {!isTeacher && onSuggestDeleteConnection && (
            <IconButton icon={deleteOutline} onClick={(e) => { e.stopPropagation(); onSuggestDeleteConnection(conn); }} title="Suggest deletion" size={14} color={theme.textMuted} hoverColor={theme.errorRed || "#DC2626"} hoverBg={(theme.errorRed || "#DC2626") + "10"} padding={2} borderRadius={3} />
          )}
        </div>
      </div>
      {connHistory.length > 0 && (
        <div style={{ paddingLeft: 30, marginBottom: SPACING[1] }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHistory(prev => !prev);
            }}
            aria-expanded={showHistory}
            aria-label="Toggle edit history"
            style={{
              color: theme.textTertiary, fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO, fontStyle: "italic",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: SPACING["0.5"],
              transition: "color 0.15s",
              background: "none", border: "none", padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.textDescription; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.textTertiary; }}
          >
            <Icon icon={pencilOutline} width={10} aria-hidden="true" />
            edited by {[...new Set(connHistory.map(e => e.name))].join(", ")}
            <span style={{ fontSize: FONT_SIZES.micro }} aria-hidden="true">{showHistory ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showHistory && (
            <div style={{
              marginTop: SPACING[1], padding: `${SPACING["1.5"]} ${SPACING[2]}`, background: theme.subtleBg,
              borderRadius: RADII.sm, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
              display: "flex", flexDirection: "column", gap: SPACING["1.5"],
            }}>
              {connHistory.map((entry, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: SPACING["1.5"], color: theme.textDescription }}>
                    <span style={{ fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ color: theme.textTertiary }}>
                      {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: SPACING["0.5"], marginTop: SPACING["0.5"] }}>
                      {Object.entries(entry.changes).map(([key, { from, to }]) => {
                        const changeLabel = key === "causeEventId" ? "Cause Event"
                          : key === "effectEventId" ? "Effect Event"
                          : "Description";
                        const isEventRef = key === "causeEventId" || key === "effectEventId";
                        const isText = key === "description";
                        return (
                          <div key={key} style={{
                            padding: `${SPACING["0.5"]} ${SPACING["1.5"]}`, background: theme.warmSubtleBg,
                            borderRadius: 3, borderLeft: `2px solid ${theme.feedbackAmber}`,
                          }}>
                            <div style={{ fontSize: FONT_SIZES.micro, fontWeight: 700, color: theme.textTertiary, textTransform: "uppercase" }}>
                              {changeLabel}
                            </div>
                            <div style={{ fontSize: FONT_SIZES.micro, lineHeight: 1.4 }}>
                              {isEventRef ? (
                                <>
                                  <span style={{ color: theme.errorRed || "#DC2626", textDecoration: "line-through", opacity: 0.7 }}>
                                    {allEvents.find(e => e.id === from)?.title || from || "None"}
                                  </span>
                                  <span style={{ margin: `0 ${SPACING["0.5"]}`, color: theme.textTertiary }}>{"\u2192"}</span>
                                  <span style={{ color: "#16A34A", fontWeight: 600 }}>
                                    {allEvents.find(e => e.id === to)?.title || to || "None"}
                                  </span>
                                </>
                              ) : isText ? (
                                computeWordDiff(from, to).map((part, pi) => (
                                  <span key={pi} style={{
                                    color: part.type === "del" ? (theme.errorRed || "#DC2626") : part.type === "add" ? "#16A34A" : theme.textDescription,
                                    textDecoration: part.type === "del" ? "line-through" : "none",
                                    fontWeight: part.type === "add" ? 600 : "normal",
                                    opacity: part.type === "del" ? 0.7 : 1,
                                    background: part.type === "add" ? "#DCFCE7" : part.type === "del" ? "#FEE2E2" : "transparent",
                                    borderRadius: part.type !== "same" ? 2 : 0,
                                    padding: part.type !== "same" ? "0 1px" : 0,
                                  }}>{part.text}</span>
                                ))
                              ) : (
                                <>
                                  <span style={{ color: theme.errorRed || "#DC2626", textDecoration: "line-through", opacity: 0.7 }}>{String(from ?? "")}</span>
                                  <span style={{ margin: `0 ${SPACING["0.5"]}`, color: theme.textTertiary }}>{"\u2192"}</span>
                                  <span style={{ color: "#16A34A", fontWeight: 600 }}>{String(to ?? "")}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
