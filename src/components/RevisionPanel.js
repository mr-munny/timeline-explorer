import { useState } from "react";
import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import pencilIcon from "@iconify-icons/mdi/pencil";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import chevronUp from "@iconify-icons/mdi/chevron-up";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import FeedbackBanner from "./FeedbackBanner";
import ModalShell, { ModalCloseButton } from "./ModalShell";

export default function RevisionPanel({
  revisionEvents = [],
  revisionConnections = [],
  rejectedEvents = [],
  rejectedConnections = [],
  allEvents = [],
  periods = [],
  onReviseEvent,
  onReviseConnection,
  onDismissEvent,
  onDismissConnection,
  onClose,
}) {
  const { theme } = useTheme();
  const [expandedHistory, setExpandedHistory] = useState(null);

  const findEvent = (id) => allEvents.find((e) => e.id === id);

  return (
    <ModalShell onClose={onClose} maxWidth={640}>
      <ModalCloseButton onClose={onClose} />

        <div style={{ padding: `${SPACING[6]} ${SPACING[8]}`, fontFamily: FONT_MONO }}>
          <h2 style={{
            fontSize: FONT_SIZES.lg, fontWeight: 700, margin: 0,
            fontFamily: FONT_SERIF,
            color: theme.textPrimary,
          }}>
            Revisions Needed
          </h2>
          <p style={{
            fontSize: FONT_SIZES.micro, color: theme.textSecondary, margin: `${SPACING[1]} 0 ${SPACING[4]}`,
            fontFamily: FONT_MONO,
          }}>
            {revisionEvents.length + revisionConnections.length + rejectedEvents.length + rejectedConnections.length} item
            {(revisionEvents.length + revisionConnections.length + rejectedEvents.length + rejectedConnections.length) !== 1 ? "s" : ""} need
            {(revisionEvents.length + revisionConnections.length + rejectedEvents.length + rejectedConnections.length) === 1 ? "s" : ""} your attention
          </p>

          {/* Revision Events */}
          {revisionEvents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
              {revisionEvents.map((event) => {
                const unit = getPeriod(periods, event.period);
                const hasHistory = event.feedbackHistory && event.feedbackHistory.length > 0;
                const historyExpanded = expandedHistory === event.id;
                return (
                  <div
                    key={event.id}
                    style={{
                      border: `1.5px solid ${theme.inputBorder}`,
                      borderRadius: RADII.xl,
                      padding: `${SPACING[4]} ${SPACING[4]}`,
                      borderLeft: `4px solid ${unit?.color || theme.textSecondary}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING[2.5], marginBottom: SPACING[2] }}>
                      <div style={{
                        background: unit?.color || theme.textTertiary, color: "#fff",
                        fontSize: FONT_SIZES.micro, fontWeight: 700, padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm,
                        fontFamily: FONT_MONO, flexShrink: 0,
                      }}>
                        {formatEventDate(event)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: FONT_SIZES.base, fontWeight: 700, color: theme.textPrimary,
                          fontFamily: FONT_SERIF,
                        }}>
                          {event.title}
                        </div>
                        <div style={{
                          fontSize: FONT_SIZES.tiny, color: theme.textSecondary,
                          fontFamily: FONT_MONO, marginTop: SPACING["0.5"],
                        }}>
                          {unit?.label || event.period}
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: FONT_SIZES.tiny, lineHeight: 1.6, color: theme.textDescription,
                      margin: `0 0 ${SPACING[2.5]} 0`, fontFamily: FONT_SERIF,
                    }}>
                      {event.description?.length > 200 ? event.description.slice(0, 200) + "..." : event.description}
                    </p>

                    <FeedbackBanner feedback={event.feedback} compact />

                    {/* Past feedback history */}
                    {hasHistory && (
                      <button
                        onClick={() => setExpandedHistory(historyExpanded ? null : event.id)}
                        aria-expanded={historyExpanded}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: FONT_SIZES.tiny, fontFamily: FONT_MONO,
                          color: theme.textTertiary, padding: `${SPACING["0.5"]} 0`, marginBottom: SPACING[2],
                          display: "flex", alignItems: "center", gap: SPACING[1],
                        }}
                      >
                        <Icon icon={historyExpanded ? chevronUp : chevronDown} width={14} />
                        {event.feedbackHistory.length} previous feedback round{event.feedbackHistory.length !== 1 ? "s" : ""}
                      </button>
                    )}
                    {hasHistory && historyExpanded && (
                      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5], marginBottom: SPACING[2.5] }}>
                        {event.feedbackHistory.map((fb, i) => (
                          <div key={i} style={{
                            padding: `${SPACING[2]} ${SPACING[3]}`, background: theme.subtleBg,
                            borderRadius: RADII.md, borderLeft: `3px solid ${theme.inputBorder}`,
                          }}>
                            <p style={{
                              fontSize: FONT_SIZES.micro, fontFamily: FONT_SERIF,
                              color: theme.textSecondary, lineHeight: 1.5, margin: 0,
                            }}>
                              {fb.text}
                            </p>
                            <div style={{
                              fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                              color: theme.textTertiary, marginTop: SPACING["0.5"],
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
                        aria-label="Revise and resubmit event"
                        style={{
                          padding: `${SPACING[2]} ${SPACING[4]}`,
                          background: theme.feedbackAmber,
                          color: "#fff",
                          border: "none",
                          borderRadius: RADII.md,
                          fontSize: FONT_SIZES.micro,
                          fontFamily: FONT_MONO,
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
                  padding: `${SPACING[2.5]} 0 ${SPACING[1.5]}`, marginTop: SPACING[3],
                  borderTop: `1px solid ${theme.inputBorder}`,
                  fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Connections
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
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
                        borderRadius: RADII.xl,
                        padding: `${SPACING[4]} ${SPACING[4]}`,
                        borderLeft: `4px solid ${theme.accentGold || "#F59E0B"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: SPACING[2], marginBottom: SPACING[2.5], flexWrap: "wrap" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: SPACING[1.5],
                          padding: `${SPACING[1]} ${SPACING[2.5]}`, background: theme.warmSubtleBg, borderRadius: RADII.md,
                          borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO, color: causeUnit?.color || theme.textSecondary }}>
                            {causeEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                            {causeEvent?.title || "Unknown event"}
                          </span>
                        </div>
                        <Icon icon={arrowRightBold} width={18} style={{ color: theme.accentGold || "#F59E0B", flexShrink: 0 }} />
                        <div style={{
                          display: "flex", alignItems: "center", gap: SPACING[1.5],
                          padding: `${SPACING[1]} ${SPACING[2.5]}`, background: theme.warmSubtleBg, borderRadius: RADII.md,
                          borderLeft: `3px solid ${effectUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO, color: effectUnit?.color || theme.textSecondary }}>
                            {effectEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                            {effectEvent?.title || "Unknown event"}
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: FONT_SIZES.tiny, lineHeight: 1.6, color: theme.textDescription,
                        margin: `0 0 ${SPACING[2.5]} 0`, fontFamily: FONT_SERIF,
                      }}>
                        {conn.description}
                      </p>

                      <FeedbackBanner feedback={conn.feedback} compact />

                      {hasHistory && (
                        <button
                          onClick={() => setExpandedHistory(historyExpanded ? null : conn.id)}
                          aria-expanded={historyExpanded}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: FONT_SIZES.tiny, fontFamily: FONT_MONO,
                            color: theme.textTertiary, padding: `${SPACING["0.5"]} 0`, marginBottom: SPACING[2],
                            display: "flex", alignItems: "center", gap: SPACING[1],
                          }}
                        >
                          <Icon icon={historyExpanded ? chevronUp : chevronDown} width={14} />
                          {conn.feedbackHistory.length} previous feedback round{conn.feedbackHistory.length !== 1 ? "s" : ""}
                        </button>
                      )}
                      {hasHistory && historyExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5], marginBottom: SPACING[2.5] }}>
                          {conn.feedbackHistory.map((fb, i) => (
                            <div key={i} style={{
                              padding: `${SPACING[2]} ${SPACING[3]}`, background: theme.subtleBg,
                              borderRadius: RADII.md, borderLeft: `3px solid ${theme.inputBorder}`,
                            }}>
                              <p style={{
                                fontSize: FONT_SIZES.micro, fontFamily: FONT_SERIF,
                                color: theme.textSecondary, lineHeight: 1.5, margin: 0,
                              }}>
                                {fb.text}
                              </p>
                              <div style={{
                                fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                                color: theme.textTertiary, marginTop: SPACING["0.5"],
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
                          aria-label="Revise and resubmit connection"
                          style={{
                            padding: `${SPACING[2]} ${SPACING[4]}`,
                            background: theme.feedbackAmber,
                            color: "#fff",
                            border: "none",
                            borderRadius: RADII.md,
                            fontSize: FONT_SIZES.micro,
                            fontFamily: FONT_MONO,
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

          {/* Rejected Events */}
          {rejectedEvents.length > 0 && (
            <>
              {(revisionEvents.length > 0 || revisionConnections.length > 0) && (
                <div style={{
                  padding: `${SPACING[2.5]} 0 ${SPACING[1.5]}`, marginTop: SPACING[3],
                  borderTop: `1px solid ${theme.inputBorder}`,
                  fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Rejected
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
                {rejectedEvents.map((event) => {
                  const unit = getPeriod(periods, event.period);
                  return (
                    <div
                      key={event.id}
                      style={{
                        border: `1.5px solid ${theme.errorRed}40`,
                        borderRadius: RADII.xl,
                        padding: `${SPACING[4]} ${SPACING[4]}`,
                        borderLeft: `4px solid ${theme.errorRed}`,
                      }}
                    >
                      <div style={{
                        fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                        color: theme.errorRed, background: (theme.errorRed || "#DC2626") + "12",
                        padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm, display: "inline-block",
                        marginBottom: SPACING[1.5], textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        Rejected
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING[2.5], marginBottom: SPACING[2] }}>
                        <div style={{
                          background: unit?.color || theme.textTertiary, color: "#fff",
                          fontSize: FONT_SIZES.micro, fontWeight: 700, padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm,
                          fontFamily: FONT_MONO, flexShrink: 0,
                        }}>
                          {formatEventDate(event)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: FONT_SIZES.base, fontWeight: 700, color: theme.textPrimary,
                            fontFamily: FONT_SERIF,
                          }}>
                            {event.title}
                          </div>
                          <div style={{
                            fontSize: FONT_SIZES.tiny, color: theme.textSecondary,
                            fontFamily: FONT_MONO, marginTop: SPACING["0.5"],
                          }}>
                            {unit?.label || event.period}
                          </div>
                        </div>
                      </div>

                      <p style={{
                        fontSize: FONT_SIZES.tiny, lineHeight: 1.6, color: theme.textDescription,
                        margin: `0 0 ${SPACING[2.5]} 0`, fontFamily: FONT_SERIF,
                      }}>
                        {event.description?.length > 200 ? event.description.slice(0, 200) + "..." : event.description}
                      </p>

                      {event.rejectionFeedback && (
                        <div style={{
                          padding: `${SPACING[2.5]} ${SPACING[3]}`,
                          background: (theme.errorRed || "#DC2626") + "08",
                          border: `1px solid ${theme.errorRed}40`,
                          borderRadius: RADII.lg,
                          marginBottom: SPACING[2.5],
                        }}>
                          <div style={{
                            fontSize: FONT_SIZES.micro, fontWeight: 700, fontFamily: FONT_MONO,
                            color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.05em",
                            marginBottom: SPACING[1],
                          }}>
                            Reason for Rejection
                          </div>
                          <p style={{
                            fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF,
                            color: theme.textDescription, lineHeight: 1.5, margin: 0,
                          }}>
                            {event.rejectionFeedback.text}
                          </p>
                          <div style={{
                            fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                            color: theme.textTertiary, marginTop: SPACING["0.5"],
                          }}>
                            {event.rejectionFeedback.givenBy} &middot; {new Date(event.rejectionFeedback.date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onDismissEvent(event.id)}
                          aria-label="Dismiss rejected event"
                          style={{
                            padding: `${SPACING[2]} ${SPACING[4]}`,
                            background: theme.textSecondary,
                            color: "#fff",
                            border: "none",
                            borderRadius: RADII.md,
                            fontSize: FONT_SIZES.micro,
                            fontFamily: FONT_MONO,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "filter 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                        >
                          <Icon icon={closeCircleOutline} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Rejected Connections */}
          {rejectedConnections.length > 0 && (
            <>
              {(revisionEvents.length > 0 || revisionConnections.length > 0 || rejectedEvents.length > 0) && rejectedEvents.length === 0 && (
                <div style={{
                  padding: `${SPACING[2.5]} 0 ${SPACING[1.5]}`, marginTop: SPACING[3],
                  borderTop: `1px solid ${theme.inputBorder}`,
                  fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Rejected
                </div>
              )}
              {rejectedEvents.length > 0 && (
                <div style={{
                  padding: `${SPACING[2.5]} 0 ${SPACING[1.5]}`, marginTop: SPACING[3],
                  fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Rejected Connections
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
                {rejectedConnections.map((conn) => {
                  const causeEvent = findEvent(conn.causeEventId);
                  const effectEvent = findEvent(conn.effectEventId);
                  const causeUnit = causeEvent ? getPeriod(periods, causeEvent.period) : null;
                  const effectUnit = effectEvent ? getPeriod(periods, effectEvent.period) : null;
                  return (
                    <div
                      key={conn.id}
                      style={{
                        border: `1.5px solid ${theme.errorRed}40`,
                        borderRadius: RADII.xl,
                        padding: `${SPACING[4]} ${SPACING[4]}`,
                        borderLeft: `4px solid ${theme.errorRed}`,
                      }}
                    >
                      <div style={{
                        fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                        color: theme.errorRed, background: (theme.errorRed || "#DC2626") + "12",
                        padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm, display: "inline-block",
                        marginBottom: SPACING[1.5], textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        Rejected
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: SPACING[2], marginBottom: SPACING[2.5], flexWrap: "wrap" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: SPACING[1.5],
                          padding: `${SPACING[1]} ${SPACING[2.5]}`, background: theme.warmSubtleBg, borderRadius: RADII.md,
                          borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO, color: causeUnit?.color || theme.textSecondary }}>
                            {causeEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                            {causeEvent?.title || "Unknown event"}
                          </span>
                        </div>
                        <Icon icon={arrowRightBold} width={18} style={{ color: theme.errorRed, flexShrink: 0 }} />
                        <div style={{
                          display: "flex", alignItems: "center", gap: SPACING[1.5],
                          padding: `${SPACING[1]} ${SPACING[2.5]}`, background: theme.warmSubtleBg, borderRadius: RADII.md,
                          borderLeft: `3px solid ${effectUnit?.color || theme.textSecondary}`,
                        }}>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO, color: effectUnit?.color || theme.textSecondary }}>
                            {effectEvent?.year || "?"}
                          </span>
                          <span style={{ fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                            {effectEvent?.title || "Unknown event"}
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: FONT_SIZES.tiny, lineHeight: 1.6, color: theme.textDescription,
                        margin: `0 0 ${SPACING[2.5]} 0`, fontFamily: FONT_SERIF,
                      }}>
                        {conn.description}
                      </p>

                      {conn.rejectionFeedback && (
                        <div style={{
                          padding: `${SPACING[2.5]} ${SPACING[3]}`,
                          background: (theme.errorRed || "#DC2626") + "08",
                          border: `1px solid ${theme.errorRed}40`,
                          borderRadius: RADII.lg,
                          marginBottom: SPACING[2.5],
                        }}>
                          <div style={{
                            fontSize: FONT_SIZES.micro, fontWeight: 700, fontFamily: FONT_MONO,
                            color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.05em",
                            marginBottom: SPACING[1],
                          }}>
                            Reason for Rejection
                          </div>
                          <p style={{
                            fontSize: FONT_SIZES.tiny, fontFamily: FONT_SERIF,
                            color: theme.textDescription, lineHeight: 1.5, margin: 0,
                          }}>
                            {conn.rejectionFeedback.text}
                          </p>
                          <div style={{
                            fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                            color: theme.textTertiary, marginTop: SPACING["0.5"],
                          }}>
                            {conn.rejectionFeedback.givenBy} &middot; {new Date(conn.rejectionFeedback.date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onDismissConnection(conn.id)}
                          aria-label="Dismiss rejected connection"
                          style={{
                            padding: `${SPACING[2]} ${SPACING[4]}`,
                            background: theme.textSecondary,
                            color: "#fff",
                            border: "none",
                            borderRadius: RADII.md,
                            fontSize: FONT_SIZES.micro,
                            fontFamily: FONT_MONO,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "filter 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                        >
                          <Icon icon={closeCircleOutline} width={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {revisionEvents.length === 0 && revisionConnections.length === 0 && rejectedEvents.length === 0 && rejectedConnections.length === 0 && (
            <div style={{
              textAlign: "center", padding: `${SPACING[8]} ${SPACING[5]}`,
              color: theme.textSecondary, fontFamily: FONT_MONO, fontSize: FONT_SIZES.tiny,
            }}>
              No revisions needed. You're all set!
            </div>
          )}
        </div>
    </ModalShell>
  );
}
