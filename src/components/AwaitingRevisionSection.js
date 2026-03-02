import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import cancelIcon from "@iconify-icons/mdi/cancel";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme, FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
import FeedbackBanner from "./FeedbackBanner";
import IconButton from "./IconButton";

export default function AwaitingRevisionSection({
  items, type, periods, getSectionName, findEvent, processing, onReject, hasPendingItems,
}) {
  const { theme } = useTheme();

  if (items.length === 0) return null;

  const isEvent = type === "event";

  return (
    <>
      <div style={{
        padding: "10px 0 6px",
        marginTop: hasPendingItems ? 12 : 0,
        borderTop: hasPendingItems ? `1px solid ${theme.inputBorder}` : "none",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: FONT_MONO,
        color: theme.feedbackAmber,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        Awaiting Student Revision ({items.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => {
          const isProcessing = processing === item.id;

          if (isEvent) {
            const unit = getPeriod(periods, item.period);
            return (
              <div
                key={item.id}
                style={{
                  border: `1.5px solid ${theme.feedbackAmber}40`,
                  borderRadius: 10,
                  padding: "16px 18px",
                  borderLeft: `4px solid ${theme.feedbackAmber}`,
                  opacity: 0.85,
                }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                  color: theme.feedbackAmber, background: theme.feedbackAmberBg,
                  padding: "3px 8px", borderRadius: 4, display: "inline-block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Awaiting Revision
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    background: unit?.color || theme.textTertiary, color: "#fff",
                    fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 4,
                    fontFamily: FONT_MONO, flexShrink: 0,
                  }}>
                    {formatEventDate(item)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: theme.textPrimary,
                      fontFamily: FONT_SERIF,
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 10, color: theme.textSecondary,
                      fontFamily: FONT_MONO, marginTop: 2,
                    }}>
                      by {item.addedBy} &middot; {getSectionName(item.section)}
                    </div>
                  </div>
                </div>
                <FeedbackBanner feedback={item.feedback} title="Your Feedback" compact />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <IconButton
                    icon={cancelIcon}
                    onClick={() => onReject(item.id)}
                    disabled={isProcessing}
                    size={13}
                    color={theme.errorRed}
                    hoverBg={(theme.errorRed || "#DC2626") + "10"}
                    style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
                  >
                    Reject
                  </IconButton>
                </div>
              </div>
            );
          }

          // Connection type
          const causeEvent = findEvent(item.causeEventId);
          const effectEvent = findEvent(item.effectEventId);
          const causeUnit = causeEvent ? getPeriod(periods, causeEvent.period) : null;
          const effectUnit = effectEvent ? getPeriod(periods, effectEvent.period) : null;

          return (
            <div
              key={item.id}
              style={{
                border: `1.5px solid ${theme.feedbackAmber}40`, borderRadius: 10,
                padding: "16px 18px", borderLeft: `4px solid ${theme.feedbackAmber}`, opacity: 0.85,
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                color: theme.feedbackAmber, background: theme.feedbackAmberBg,
                padding: "3px 8px", borderRadius: 4, display: "inline-block",
                marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Awaiting Revision
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
                  borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: causeUnit?.color || theme.textSecondary }}>
                    {causeEvent?.year || "?"}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                    {causeEvent?.title || "Unknown event"}
                  </span>
                </div>
                <Icon icon={arrowRightBold} width={18} style={{ color: theme.feedbackAmber, flexShrink: 0 }} />
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
                  borderLeft: `3px solid ${effectUnit?.color || theme.textSecondary}`,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: effectUnit?.color || theme.textSecondary }}>
                    {effectEvent?.year || "?"}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: FONT_SERIF, fontWeight: 600, color: theme.textPrimary }}>
                    {effectEvent?.title || "Unknown event"}
                  </span>
                </div>
              </div>
              <p style={{
                fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                margin: "0 0 8px 0", fontFamily: FONT_SERIF,
              }}>
                {item.description}
              </p>
              <FeedbackBanner feedback={item.feedback} title="Your Feedback" compact />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <IconButton
                  icon={cancelIcon}
                  onClick={() => onReject(item.id)}
                  disabled={isProcessing}
                  size={13}
                  color={theme.errorRed}
                  hoverBg={(theme.errorRed || "#DC2626") + "10"}
                  style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
                >
                  Reject
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
