import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import cancelIcon from "@iconify-icons/mdi/cancel";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import FeedbackBanner from "./FeedbackBanner";
import IconButton from "./IconButton";

export default function AwaitingRevisionSection({
  items, type, periods, periodsBySection = {}, getSectionName, findEvent, processing, onReject, hasPendingItems,
  feedbackId, feedbackText, feedbackMode, onFeedbackChange, onFeedbackSubmit, onFeedbackCancel,
}) {
  const { theme } = useTheme();

  const inputStyle = {
    width: "100%",
    padding: `9px ${SPACING["3"]}`,
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
    resize: "vertical",
    lineHeight: 1.5,
  };

  if (items.length === 0) return null;

  const isEvent = type === "event";

  return (
    <>
      <div style={{
        padding: `${SPACING[2.5]} 0 ${SPACING[1.5]}`,
        marginTop: hasPendingItems ? SPACING[3] : 0,
        borderTop: hasPendingItems ? `1px solid ${theme.inputBorder}` : "none",
        fontSize: FONT_SIZES.tiny,
        fontWeight: 700,
        fontFamily: FONT_MONO,
        color: theme.feedbackAmber,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        Awaiting Student Revision ({items.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
        {items.map((item) => {
          const isProcessing = processing === item.id;

          if (isEvent) {
            const itemPeriods = periodsBySection[item.section] || periods;
            const unit = getPeriod(itemPeriods, item.period);
            return (
              <div
                key={item.id}
                style={{
                  border: `1.5px solid ${theme.feedbackAmber}40`,
                  borderRadius: RADII.xl,
                  padding: `${SPACING[4]} ${SPACING[4]}`,
                  borderLeft: `4px solid ${theme.feedbackAmber}`,
                  opacity: 0.85,
                }}
              >
                <div style={{
                  fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.feedbackAmber, background: theme.feedbackAmberBg,
                  padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm, display: "inline-block",
                  marginBottom: SPACING[1.5], textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Awaiting Revision
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING[2.5], marginBottom: SPACING[2] }}>
                  <div style={{
                    background: unit?.color || theme.textTertiary, color: "#fff",
                    fontSize: FONT_SIZES.micro, fontWeight: 700, padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm,
                    fontFamily: FONT_MONO, flexShrink: 0,
                  }}>
                    {formatEventDate(item)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: FONT_SIZES.base, fontWeight: 700, color: theme.textPrimary,
                      fontFamily: FONT_SERIF,
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: FONT_SIZES.tiny, color: theme.textSecondary,
                      fontFamily: FONT_MONO, marginTop: SPACING["0.5"],
                    }}>
                      by {item.addedBy} &middot; {getSectionName(item.section)}
                    </div>
                  </div>
                </div>
                <FeedbackBanner feedback={item.feedback} title="Your Feedback" compact />
                <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
                  <IconButton
                    icon={cancelIcon}
                    onClick={() => onReject(item.id)}
                    disabled={isProcessing}
                    size={13}
                    color={theme.errorRed}
                    hoverBg={(theme.errorRed || "#DC2626") + "10"}
                    aria-label="Reject event"
                    style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.errorRed}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
                  >
                    Reject
                  </IconButton>
                </div>
                {feedbackId === item.id && feedbackMode === "rejection" && (
                  <div style={{
                    marginTop: SPACING[2.5], padding: `${SPACING[3]} ${SPACING[3]}`,
                    background: (theme.errorRed || "#DC2626") + "08",
                    borderRadius: RADII.lg, border: `1.5px solid ${theme.errorRed}`,
                  }}>
                    <label style={{
                      fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                      color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.05em",
                      marginBottom: SPACING[1.5], display: "block",
                    }}>
                      Reason for Rejection
                    </label>
                    <textarea
                      autoFocus
                      value={feedbackText}
                      onChange={(e) => onFeedbackChange(e.target.value)}
                      placeholder="Why is this submission being rejected?"
                      rows={3}
                      style={{ ...inputStyle, borderColor: theme.errorRed }}
                    />
                    <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end", marginTop: SPACING[2] }}>
                      <button
                        onClick={onFeedbackCancel}
                        style={{
                          padding: `${SPACING[1.5]} ${SPACING[3]}`, background: "none",
                          border: `1.5px solid ${theme.inputBorder}`, borderRadius: RADII.md,
                          fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                          cursor: "pointer", color: theme.textTertiary, transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onFeedbackSubmit("event", item.id)}
                        disabled={!feedbackText.trim() || isProcessing}
                        style={{
                          padding: `${SPACING[1.5]} ${SPACING[3]}`,
                          background: feedbackText.trim() ? theme.errorRed : theme.inputBorder,
                          color: "#fff", border: "none", borderRadius: RADII.md,
                          fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                          fontWeight: 700, cursor: feedbackText.trim() ? "pointer" : "default",
                          transition: "filter 0.15s",
                        }}
                        onMouseEnter={(e) => { if (feedbackText.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                      >
                        Reject Submission
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Connection type
          const connPeriods = periodsBySection[item.section] || periods;
          const causeEvent = findEvent(item.causeEventId);
          const effectEvent = findEvent(item.effectEventId);
          const causeUnit = causeEvent ? getPeriod(connPeriods, causeEvent.period) : null;
          const effectUnit = effectEvent ? getPeriod(connPeriods, effectEvent.period) : null;

          return (
            <div
              key={item.id}
              style={{
                border: `1.5px solid ${theme.feedbackAmber}40`, borderRadius: RADII.xl,
                padding: `${SPACING[4]} ${SPACING[4]}`, borderLeft: `4px solid ${theme.feedbackAmber}`, opacity: 0.85,
              }}
            >
              <div style={{
                fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                color: theme.feedbackAmber, background: theme.feedbackAmberBg,
                padding: `${SPACING["0.5"]} ${SPACING[2]}`, borderRadius: RADII.sm, display: "inline-block",
                marginBottom: SPACING[1.5], textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Awaiting Revision
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
                <Icon icon={arrowRightBold} width={18} style={{ color: theme.feedbackAmber, flexShrink: 0 }} />
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
                margin: `0 0 ${SPACING[2]} 0`, fontFamily: FONT_SERIF,
              }}>
                {item.description}
              </p>
              <FeedbackBanner feedback={item.feedback} title="Your Feedback" compact />
              <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
                <IconButton
                  icon={cancelIcon}
                  onClick={() => onReject(item.id)}
                  disabled={isProcessing}
                  size={13}
                  color={theme.errorRed}
                  hoverBg={(theme.errorRed || "#DC2626") + "10"}
                  aria-label="Reject connection"
                  style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.errorRed}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
                >
                  Reject
                </IconButton>
              </div>
              {feedbackId === item.id && feedbackMode === "rejection" && (
                <div style={{
                  marginTop: SPACING[2.5], padding: `${SPACING[3]} ${SPACING[3]}`,
                  background: (theme.errorRed || "#DC2626") + "08",
                  borderRadius: RADII.lg, border: `1.5px solid ${theme.errorRed}`,
                }}>
                  <label style={{
                    fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                    color: theme.errorRed, textTransform: "uppercase", letterSpacing: "0.05em",
                    marginBottom: SPACING[1.5], display: "block",
                  }}>
                    Reason for Rejection
                  </label>
                  <textarea
                    autoFocus
                    value={feedbackText}
                    onChange={(e) => onFeedbackChange(e.target.value)}
                    placeholder="Why is this submission being rejected?"
                    rows={3}
                    style={{ ...inputStyle, borderColor: theme.errorRed }}
                  />
                  <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end", marginTop: SPACING[2] }}>
                    <button
                      onClick={onFeedbackCancel}
                      style={{
                        padding: `${SPACING[1.5]} ${SPACING[3]}`, background: "none",
                        border: `1.5px solid ${theme.inputBorder}`, borderRadius: RADII.md,
                        fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                        cursor: "pointer", color: theme.textTertiary, transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onFeedbackSubmit("connection", item.id)}
                      disabled={!feedbackText.trim() || isProcessing}
                      style={{
                        padding: `${SPACING[1.5]} ${SPACING[3]}`,
                        background: feedbackText.trim() ? theme.errorRed : theme.inputBorder,
                        color: "#fff", border: "none", borderRadius: RADII.md,
                        fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO,
                        fontWeight: 700, cursor: feedbackText.trim() ? "pointer" : "default",
                        transition: "filter 0.15s",
                      }}
                      onMouseEnter={(e) => { if (feedbackText.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    >
                      Reject Submission
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
