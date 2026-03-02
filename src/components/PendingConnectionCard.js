import { getPeriod } from "../data/constants";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/mdi/check";
import pencilIcon from "@iconify-icons/mdi/pencil";
import cancelIcon from "@iconify-icons/mdi/cancel";
import contentSave from "@iconify-icons/mdi/content-save";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import commentAlertOutline from "@iconify-icons/mdi/comment-alert-outline";
import { useTheme, FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
import IconButton from "./IconButton";

export default function PendingConnectionCard({
  conn, periods, getSectionName, findEvent, findConnection, readOnly, user,
  editingConnId, editConnDesc, processing,
  onStartConnEdit, onSaveConnEdit, onSetEditConnDesc, onCancelConnEdit,
  onApprove, onReject,
  onEditPendingConnection, onWithdraw,
  feedbackId, feedbackText, feedbackType,
  onFeedbackOpen, onFeedbackChange, onFeedbackSubmit, onFeedbackCancel,
}) {
  const { theme } = useTheme();
  const causeEvent = findEvent(conn.causeEventId);
  const effectEvent = findEvent(conn.effectEventId);
  const causeUnit = causeEvent ? getPeriod(periods, causeEvent.period) : null;
  const effectUnit = effectEvent ? getPeriod(periods, effectEvent.period) : null;
  const isProcessing = processing === conn.id;
  const isEditing = editingConnId === conn.id;

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        border: `1.5px solid ${theme.inputBorder}`,
        borderRadius: 10,
        padding: "16px 18px",
        borderLeft: `4px solid ${theme.accentGold || "#F59E0B"}`,
      }}
    >
      {/* Cause → Effect display */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
          borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
            color: causeUnit?.color || theme.textSecondary,
          }}>
            {causeEvent?.year || "?"}
          </span>
          <span style={{
            fontSize: 12, fontFamily: FONT_SERIF, fontWeight: 600,
            color: theme.textPrimary,
          }}>
            {causeEvent?.title || "Unknown event"}
          </span>
        </div>
        <Icon icon={arrowRightBold} width={18} style={{ color: theme.accentGold || "#F59E0B", flexShrink: 0 }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
          borderLeft: `3px solid ${effectUnit?.color || theme.textSecondary}`,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
            color: effectUnit?.color || theme.textSecondary,
          }}>
            {effectEvent?.year || "?"}
          </span>
          <span style={{
            fontSize: 12, fontFamily: FONT_SERIF, fontWeight: 600,
            color: theme.textPrimary,
          }}>
            {effectEvent?.title || "Unknown event"}
          </span>
        </div>
      </div>

      {!readOnly && isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={editConnDesc}
            onChange={(e) => onSetEditConnDesc(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            rows={3}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={onCancelConnEdit}
              style={{
                padding: "6px 14px", background: "none",
                border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6,
                fontSize: 11, fontFamily: FONT_MONO,
                cursor: "pointer", color: theme.textTertiary,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveConnEdit(conn.id)}
              disabled={isProcessing}
              style={{
                padding: "6px 14px", background: theme.activeToggleBg,
                color: theme.activeToggleText, border: "none", borderRadius: 6,
                fontSize: 11, fontFamily: FONT_MONO,
                fontWeight: 700, cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              <Icon icon={contentSave} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {conn.deleteOf ? (
            <>
              <div style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 4,
                background: "#FEE2E2", color: "#991B1B", fontSize: 10,
                fontFamily: FONT_MONO, fontWeight: 700,
                marginBottom: 8,
              }}>
                Suggested Deletion
              </div>
              <p style={{
                fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                margin: "0 0 8px 0", fontFamily: FONT_SERIF,
              }}>
                {conn.description}
              </p>
              <div style={{
                fontSize: 10, color: theme.textTertiary,
                fontFamily: FONT_MONO, marginBottom: 10,
              }}>
                by {conn.addedBy} &middot; {getSectionName(conn.section)}
                {!findConnection(conn.deleteOf) && <> &middot; <span style={{ color: theme.errorRed }}>Original connection already deleted</span></>}
              </div>
            </>
          ) : conn.editOf ? (() => {
            const originalConn = findConnection(conn.editOf);
            return (
              <>
                <div style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 4,
                  background: theme.feedbackAmberBg, color: theme.feedbackAmberText, fontSize: 10,
                  fontFamily: FONT_MONO, fontWeight: 700,
                  marginBottom: 8,
                }}>
                  Suggested Edit
                </div>
                <div style={{
                  fontSize: 10, color: theme.textTertiary,
                  fontFamily: FONT_MONO, marginBottom: 10,
                }}>
                  by {conn.addedBy} &middot; {getSectionName(conn.section)}
                  {!originalConn && <> &middot; <span style={{ color: theme.errorRed }}>Original connection not found</span></>}
                </div>
                {originalConn && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {String(originalConn.description ?? "") !== String(conn.description ?? "") && (
                      <div style={{
                        padding: "6px 10px", background: theme.warmSubtleBg,
                        borderRadius: 6, borderLeft: `3px solid ${theme.feedbackAmber}`,
                      }}>
                        <div style={{
                          fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                          color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                        }}>
                          Description
                        </div>
                        <div style={{ fontSize: 11, fontFamily: FONT_SERIF, lineHeight: 1.5 }}>
                          {computeWordDiff(originalConn.description, conn.description).map((part, i) => (
                            <span key={i} style={{
                              color: part.type === "del" ? (theme.errorRed || "#DC2626") : part.type === "add" ? "#16A34A" : theme.textDescription,
                              textDecoration: part.type === "del" ? "line-through" : "none",
                              fontWeight: part.type === "add" ? 600 : "normal",
                              opacity: part.type === "del" ? 0.7 : 1,
                              background: part.type === "add" ? "#DCFCE7" : part.type === "del" ? "#FEE2E2" : "transparent",
                              borderRadius: part.type !== "same" ? 2 : 0,
                              padding: part.type !== "same" ? "0 2px" : 0,
                            }}>{part.text}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {originalConn.causeEventId !== conn.causeEventId && (
                      <div style={{
                        padding: "6px 10px", background: theme.warmSubtleBg,
                        borderRadius: 6, borderLeft: `3px solid ${theme.feedbackAmber}`,
                      }}>
                        <div style={{
                          fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                          color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                        }}>
                          Cause Event
                        </div>
                        <div style={{ fontSize: 11, fontFamily: FONT_SERIF }}>
                          <span style={{ color: theme.errorRed || "#DC2626", textDecoration: "line-through", opacity: 0.7 }}>
                            {findEvent(originalConn.causeEventId)?.title || "Unknown"}
                          </span>
                          <span style={{ margin: "0 6px", color: theme.textTertiary }}>{"\u2192"}</span>
                          <span style={{ color: "#16A34A", fontWeight: 600 }}>
                            {findEvent(conn.causeEventId)?.title || "Unknown"}
                          </span>
                        </div>
                      </div>
                    )}
                    {originalConn.effectEventId !== conn.effectEventId && (
                      <div style={{
                        padding: "6px 10px", background: theme.warmSubtleBg,
                        borderRadius: 6, borderLeft: `3px solid ${theme.feedbackAmber}`,
                      }}>
                        <div style={{
                          fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                          color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                        }}>
                          Effect Event
                        </div>
                        <div style={{ fontSize: 11, fontFamily: FONT_SERIF }}>
                          <span style={{ color: theme.errorRed || "#DC2626", textDecoration: "line-through", opacity: 0.7 }}>
                            {findEvent(originalConn.effectEventId)?.title || "Unknown"}
                          </span>
                          <span style={{ margin: "0 6px", color: theme.textTertiary }}>{"\u2192"}</span>
                          <span style={{ color: "#16A34A", fontWeight: 600 }}>
                            {findEvent(conn.effectEventId)?.title || "Unknown"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })() : (
            <>
              <p style={{
                fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                margin: "0 0 8px 0", fontFamily: FONT_SERIF,
              }}>
                {conn.description}
              </p>
              <div style={{
                fontSize: 10, color: theme.textTertiary,
                fontFamily: FONT_MONO, marginBottom: 10,
              }}>
                by {conn.addedBy} &middot; {getSectionName(conn.section)}
              </div>
            </>
          )}
          {/* Student self-service buttons (readOnly mode, own submissions only) */}
          {readOnly && user && conn.addedByUid === user.uid && (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <IconButton
                icon={cancelIcon}
                onClick={() => {
                  if (!window.confirm("Withdraw this connection? It will be removed from the review queue.")) return;
                  onWithdraw("connection", conn.id);
                }}
                size={13}
                color={theme.errorRed}
                hoverBg={(theme.errorRed || "#DC2626") + "10"}
                style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Withdraw
              </IconButton>
              {!conn.deleteOf && (
                <IconButton
                  icon={pencilIcon}
                  onClick={() => onEditPendingConnection(conn)}
                  size={13}
                  color={theme.textDescription}
                  hoverBg={theme.subtleBg}
                  style={{ padding: "6px 14px", border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
                >
                  Edit
                </IconButton>
              )}
            </div>
          )}

          {!readOnly && (
          <>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <IconButton
              icon={cancelIcon}
              onClick={() => onReject(conn.id)}
              disabled={isProcessing}
              size={13}
              color={theme.errorRed}
              hoverBg={(theme.errorRed || "#DC2626") + "10"}
              style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
            >
              Reject
            </IconButton>
            {!conn.deleteOf && (
              <IconButton
                icon={commentAlertOutline}
                onClick={() => onFeedbackOpen(conn.id, "connection")}
                disabled={isProcessing}
                size={13}
                color={theme.feedbackAmber}
                hoverBg={theme.feedbackAmber + "10"}
                style={{ padding: "6px 14px", border: `1.5px solid ${theme.feedbackAmber}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Revise
              </IconButton>
            )}
            {!conn.editOf && !conn.deleteOf && (
              <IconButton
                icon={pencilIcon}
                onClick={() => onStartConnEdit(conn.id, conn.description)}
                disabled={isProcessing}
                size={13}
                color={theme.textDescription}
                hoverBg={theme.subtleBg}
                style={{ padding: "6px 14px", border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Edit
              </IconButton>
            )}
            <button
              onClick={() => onApprove(conn)}
              disabled={isProcessing}
              style={{
                padding: "6px 14px", background: conn.deleteOf ? (theme.errorRed || "#DC2626") : theme.successGreen,
                color: "#fff", border: "none", borderRadius: 6,
                fontSize: 11, fontFamily: FONT_MONO,
                fontWeight: 700, cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              {isProcessing ? "..." : <><Icon icon={checkIcon} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />{conn.deleteOf ? "Delete" : "Approve"}</>}
            </button>
          </div>
          {/* Inline feedback textarea for connections */}
          {feedbackId === conn.id && feedbackType === "connection" && (
            <div style={{
              marginTop: 10, padding: "12px 14px",
              background: theme.feedbackAmberBg,
              borderRadius: 8, border: `1.5px solid ${theme.feedbackAmber}`,
            }}>
              <label style={{
                fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                color: theme.feedbackAmberText, textTransform: "uppercase", letterSpacing: "0.05em",
                marginBottom: 6, display: "block",
              }}>
                Feedback for Student
              </label>
              <textarea
                autoFocus
                value={feedbackText}
                onChange={(e) => onFeedbackChange(e.target.value)}
                placeholder="What should the student fix or improve?"
                rows={3}
                style={{ ...inputStyle, borderColor: theme.feedbackAmber }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={onFeedbackCancel}
                  style={{
                    padding: "6px 14px", background: "none",
                    border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6,
                    fontSize: 11, fontFamily: FONT_MONO,
                    cursor: "pointer", color: theme.textTertiary, transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onFeedbackSubmit("connection", conn.id)}
                  disabled={!feedbackText.trim() || isProcessing}
                  style={{
                    padding: "6px 14px",
                    background: feedbackText.trim() ? theme.feedbackAmber : theme.inputBorder,
                    color: "#fff", border: "none", borderRadius: 6,
                    fontSize: 11, fontFamily: FONT_MONO,
                    fontWeight: 700, cursor: feedbackText.trim() ? "pointer" : "default",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) => { if (feedbackText.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  Send Feedback
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </>
      )}
    </div>
  );
}