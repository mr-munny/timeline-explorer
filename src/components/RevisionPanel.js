import { useState } from "react";
import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import pencilIcon from "@iconify-icons/mdi/pencil";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import chevronUp from "@iconify-icons/mdi/chevron-up";
import { useTheme } from "../contexts/ThemeContext";

export default function RevisionPanel({
  revisionEvents = [],
  revisionConnections = [],
  allEvents = [],
  periods = [],
  onReviseEvent,
  onReviseConnection,
  onClose,
}) {
  const { theme } = useTheme();
  const [expandedHistory, setExpandedHistory] = useState(null);

  const findEvent = (id) => allEvents.find((e) => e.id === id);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: theme.modalOverlay,
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: theme.modalShadow,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: theme.textSecondary,
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            zIndex: 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; e.currentTarget.style.background = theme.subtleBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.textSecondary; e.currentTarget.style.background = "none"; }}
        >
          <Icon icon={closeIcon} width={20} />
        </button>

        <div style={{ padding: "24px 32px", fontFamily: "'Overpass Mono', monospace" }}>
          <h2 style={{
            fontSize: 20, fontWeight: 700, margin: 0,
            fontFamily: "'Newsreader', 'Georgia', serif",
            color: theme.textPrimary,
          }}>
            Revisions Needed
          </h2>
          <p style={{
            fontSize: 11, color: theme.textSecondary, margin: "4px 0 16px",
            fontFamily: "'Overpass Mono', monospace",
          }}>
            {revisionEvents.length + revisionConnections.length} item
            {(revisionEvents.length + revisionConnections.length) !== 1 ? "s" : ""} need
            {(revisionEvents.length + revisionConnections.length) === 1 ? "s" : ""} your attention
          </p>

          {/* Revision Events */}
          {revisionEvents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {revisionEvents.map((event) => {
                const unit = getPeriod(periods, event.period);
                const hasHistory = event.feedbackHistory && event.feedbackHistory.length > 0;
                const historyExpanded = expandedHistory === event.id;
                return (
                  <div
                    key={event.id}
                    style={{
                      border: `1.5px solid ${theme.inputBorder}`,
                      borderRadius: 10,
                      padding: "16px 18px",
                      borderLeft: `4px solid ${unit?.color || theme.textSecondary}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        background: unit?.color || theme.textTertiary, color: "#fff",
                        fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 4,
                        fontFamily: "'Overpass Mono', monospace", flexShrink: 0,
                      }}>
                        {formatEventDate(event)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: theme.textPrimary,
                          fontFamily: "'Newsreader', 'Georgia', serif",
                        }}>
                          {event.title}
                        </div>
                        <div style={{
                          fontSize: 10, color: theme.textSecondary,
                          fontFamily: "'Overpass Mono', monospace", marginTop: 2,
                        }}>
                          {unit?.label || event.period}
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                      margin: "0 0 10px 0", fontFamily: "'Newsreader', 'Georgia', serif",
                    }}>
                      {event.description?.length > 200 ? event.description.slice(0, 200) + "..." : event.description}
                    </p>

                    {/* Teacher feedback */}
                    {event.feedback && (
                      <div style={{
                        background: theme.warmSubtleBg || "#FEF3C7",
                        border: "1.5px solid #D97706",
                        borderLeft: "4px solid #D97706",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 10,
                      }}>
                        <div style={{
                          fontSize: 9, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                          color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
                        }}>
                          Teacher Feedback
                        </div>
                        <p style={{
                          fontSize: 12, fontFamily: "'Newsreader', serif",
                          color: theme.textDescription, lineHeight: 1.6, margin: 0,
                        }}>
                          {event.feedback.text}
                        </p>
                        <div style={{
                          fontSize: 9, fontFamily: "'Overpass Mono', monospace",
                          color: theme.textTertiary, marginTop: 4,
                        }}>
                          {event.feedback.givenBy} &middot; {new Date(event.feedback.date).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Past feedback history */}
                    {hasHistory && (
                      <button
                        onClick={() => setExpandedHistory(historyExpanded ? null : event.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 10, fontFamily: "'Overpass Mono', monospace",
                          color: theme.textTertiary, padding: "2px 0", marginBottom: 8,
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <Icon icon={historyExpanded ? chevronUp : chevronDown} width={14} />
                        {event.feedbackHistory.length} previous feedback round{event.feedbackHistory.length !== 1 ? "s" : ""}
                      </button>
                    )}
                    {hasHistory && historyExpanded && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        {event.feedbackHistory.map((fb, i) => (
                          <div key={i} style={{
                            padding: "8px 12px", background: theme.subtleBg,
                            borderRadius: 6, borderLeft: `3px solid ${theme.inputBorder}`,
                          }}>
                            <p style={{
                              fontSize: 11, fontFamily: "'Newsreader', serif",
                              color: theme.textSecondary, lineHeight: 1.5, margin: 0,
                            }}>
                              {fb.text}
                            </p>
                            <div style={{
                              fontSize: 9, fontFamily: "'Overpass Mono', monospace",
                              color: theme.textTertiary, marginTop: 3,
                            }}>
                              {fb.givenBy} &middot; {new Date(fb.date).toLocaleDateString()}
                              {fb.resolvedAt && <> &middot; resolved {new Date(fb.resolvedAt).toLocaleDateString()}</>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => onReviseEvent(event)}
                        style={{
                          padding: "8px 18px",
                          background: "#D97706",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: "'Overpass Mono', monospace",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "filter 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                      >
                        <Icon icon={pencilIcon} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        Revise &amp; Resubmit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Revision Connections */}
          {revisionConnections.length > 0 && (
            <>
              {revisionEvents.length > 0 && (
                <div style={{
                  padding: "10px 0 6px", marginTop: 12,
                  borderTop: `1px solid ${theme.inputBorder}`,
                  fontSize: 10, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                  color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Connections
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {revisionConnections.map((conn) => {
                  const causeEvent = findEvent(conn.causeEventId);
                  const effectEvent = findEvent(conn.effectEventId);
                  const causeUnit = causeEvent ? getPeriod(periods, causeEvent.period) : null;
                  const effectUnit = effectEvent ? getPeriod(periods, effectEvent.period) : null;
                  const hasHistory = conn.feedbackHistory && conn.feedbackHistory.length > 0;
                  const historyExpanded = expandedHistory === conn.id;
                  return (
                    <div
                      key={conn.id}
                      style={{
                        border: `1.5px solid ${theme.inputBorder}`,
                        borderRadius: 10,
                        padding: "16px 18px",
                        borderLeft: `4px solid ${theme.accentGold || "#F59E0B"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
                          borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Overpass Mono', monospace", color: causeUnit?.color || theme.textSecondary }}>
                            {causeEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600, color: theme.textPrimary }}>
                            {causeEvent?.title || "Unknown event"}
                          </span>
                        </div>
                        <Icon icon={arrowRightBold} width={18} style={{ color: theme.accentGold || "#F59E0B", flexShrink: 0 }} />
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
                          borderLeft: `3px solid ${effectUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Overpass Mono', monospace", color: effectUnit?.color || theme.textSecondary }}>
                            {effectEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600, color: theme.textPrimary }}>
                            {effectEvent?.title || "Unknown event"}
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                        margin: "0 0 10px 0", fontFamily: "'Newsreader', serif",
                      }}>
                        {conn.description}
                      </p>

                      {conn.feedback && (
                        <div style={{
                          background: theme.warmSubtleBg || "#FEF3C7",
                          border: "1.5px solid #D97706",
                          borderLeft: "4px solid #D97706",
                          borderRadius: 8,
                          padding: "10px 14px",
                          marginBottom: 10,
                        }}>
                          <div style={{
                            fontSize: 9, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                            color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
                          }}>
                            Teacher Feedback
                          </div>
                          <p style={{
                            fontSize: 12, fontFamily: "'Newsreader', serif",
                            color: theme.textDescription, lineHeight: 1.6, margin: 0,
                          }}>
                            {conn.feedback.text}
                          </p>
                          <div style={{
                            fontSize: 9, fontFamily: "'Overpass Mono', monospace",
                            color: theme.textTertiary, marginTop: 4,
                          }}>
                            {conn.feedback.givenBy} &middot; {new Date(conn.feedback.date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {hasHistory && (
                        <button
                          onClick={() => setExpandedHistory(historyExpanded ? null : conn.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 10, fontFamily: "'Overpass Mono', monospace",
                            color: theme.textTertiary, padding: "2px 0", marginBottom: 8,
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <Icon icon={historyExpanded ? chevronUp : chevronDown} width={14} />
                          {conn.feedbackHistory.length} previous feedback round{conn.feedbackHistory.length !== 1 ? "s" : ""}
                        </button>
                      )}
                      {hasHistory && historyExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                          {conn.feedbackHistory.map((fb, i) => (
                            <div key={i} style={{
                              padding: "8px 12px", background: theme.subtleBg,
                              borderRadius: 6, borderLeft: `3px solid ${theme.inputBorder}`,
                            }}>
                              <p style={{
                                fontSize: 11, fontFamily: "'Newsreader', serif",
                                color: theme.textSecondary, lineHeight: 1.5, margin: 0,
                              }}>
                                {fb.text}
                              </p>
                              <div style={{
                                fontSize: 9, fontFamily: "'Overpass Mono', monospace",
                                color: theme.textTertiary, marginTop: 3,
                              }}>
                                {fb.givenBy} &middot; {new Date(fb.date).toLocaleDateString()}
                                {fb.resolvedAt && <> &middot; resolved {new Date(fb.resolvedAt).toLocaleDateString()}</>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onReviseConnection(conn)}
                          style={{
                            padding: "8px 18px",
                            background: "#D97706",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "filter 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                        >
                          <Icon icon={pencilIcon} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Revise &amp; Resubmit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {revisionEvents.length === 0 && revisionConnections.length === 0 && (
            <div style={{
              textAlign: "center", padding: "32px 20px",
              color: theme.textSecondary, fontFamily: "'Overpass Mono', monospace", fontSize: 12,
            }}>
              No revisions needed. You're all set!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
