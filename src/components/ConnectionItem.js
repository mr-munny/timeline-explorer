import { useState } from "react";
import { formatEventDate } from "../utils/dateUtils";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import arrowRightThick from "@iconify-icons/mdi/arrow-right-thick";
import arrowLeftThick from "@iconify-icons/mdi/arrow-left-thick";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import { useTheme, FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
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
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "6px 8px",
          marginBottom: connHistory.length > 0 ? 0 : 4,
          borderRadius: 5,
          cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <Icon icon={arrowIcon} width={14} style={{ color: theme.accentGold || "#F59E0B", marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
            {label}{" "}
            <span style={{ color: relatedPeriod?.color || theme.textSecondary }}>{formatEventDate(relatedEvent)}</span>
            {" "}{relatedEvent.title}
          </div>
          <div style={{ fontSize: 11, color: theme.textSecondary, fontFamily: FONT_SERIF, marginTop: 2, lineHeight: 1.4 }}>
            {conn.description}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {onEditConnection && (
            <IconButton icon={pencilOutline} onClick={(e) => { e.stopPropagation(); onEditConnection(conn); }} size={14} color={theme.textMuted} hoverColor={theme.textPrimary} hoverBg={theme.subtleBg} padding={2} borderRadius={3} />
          )}
          {isTeacher && onDeleteConnection && (
            <IconButton icon={closeCircleOutline} onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this connection?")) onDeleteConnection(conn.id); }} size={14} color={theme.textMuted} hoverColor={theme.errorRed || "#DC2626"} hoverBg={(theme.errorRed || "#DC2626") + "10"} padding={2} borderRadius={3} />
          )}
          {!isTeacher && onSuggestDeleteConnection && (
            <IconButton icon={deleteOutline} onClick={(e) => { e.stopPropagation(); onSuggestDeleteConnection(conn); }} size={14} color={theme.textMuted} hoverColor={theme.errorRed || "#DC2626"} hoverBg={(theme.errorRed || "#DC2626") + "10"} padding={2} borderRadius={3} />
          )}
        </div>
      </div>
      {connHistory.length > 0 && (
        <div style={{ paddingLeft: 30, marginBottom: 4 }}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowHistory(prev => !prev);
            }}
            style={{
              color: theme.textTertiary, fontSize: 9,
              fontFamily: FONT_MONO, fontStyle: "italic",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.textDescription; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.textTertiary; }}
          >
            <Icon icon={pencilOutline} width={8} />
            edited by {[...new Set(connHistory.map(e => e.name))].join(", ")}
            <span style={{ fontSize: 7 }}>{showHistory ? "\u25B2" : "\u25BC"}</span>
          </span>
          {showHistory && (
            <div style={{
              marginTop: 4, padding: "6px 8px", background: theme.subtleBg,
              borderRadius: 5, fontSize: 9, fontFamily: FONT_MONO,
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              {connHistory.map((entry, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, color: theme.textDescription }}>
                    <span style={{ fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ color: theme.textTertiary }}>
                      {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 3 }}>
                      {Object.entries(entry.changes).map(([key, { from, to }]) => {
                        const label = key === "causeEventId" ? "Cause Event"
                          : key === "effectEventId" ? "Effect Event"
                          : "Description";
                        const isEventRef = key === "causeEventId" || key === "effectEventId";
                        const isText = key === "description";
                        return (
                          <div key={key} style={{
                            padding: "2px 5px", background: theme.warmSubtleBg,
                            borderRadius: 3, borderLeft: `2px solid ${theme.feedbackAmber}`,
                          }}>
                            <div style={{ fontSize: 7, fontWeight: 700, color: theme.textTertiary, textTransform: "uppercase" }}>
                              {label}
                            </div>
                            <div style={{ fontSize: 9, lineHeight: 1.4 }}>
                              {isEventRef ? (
                                <>
                                  <span style={{ color: theme.errorRed || "#DC2626", textDecoration: "line-through", opacity: 0.7 }}>
                                    {allEvents.find(e => e.id === from)?.title || from || "None"}
                                  </span>
                                  <span style={{ margin: "0 3px", color: theme.textTertiary }}>{"\u2192"}</span>
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
                                  <span style={{ margin: "0 3px", color: theme.textTertiary }}>{"\u2192"}</span>
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
