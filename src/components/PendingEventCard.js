import { getPeriod, TAGS } from "../data/constants";
import { formatEventDate, MONTHS } from "../utils/dateUtils";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/mdi/check";
import pencilIcon from "@iconify-icons/mdi/pencil";
import cancelIcon from "@iconify-icons/mdi/cancel";
import contentSave from "@iconify-icons/mdi/content-save";
import commentAlertOutline from "@iconify-icons/mdi/comment-alert-outline";
import { useTheme, FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
import IconButton from "./IconButton";

const DIFF_FIELDS = [
  { key: "title", label: "Title", inline: true },
  { key: "year", label: "Year" },
  { key: "month", label: "Month", format: (v) => v ? MONTHS[v - 1] : "None" },
  { key: "day", label: "Day" },
  { key: "endYear", label: "End Year" },
  { key: "endMonth", label: "End Month", format: (v) => v ? MONTHS[v - 1] : "None" },
  { key: "endDay", label: "End Day" },
  // period format is set dynamically in the component since it needs `periods` prop
  { key: "tags", label: "Tags", format: (v) => (v || []).join(", "), compare: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  { key: "sourceType", label: "Source Type" },
  { key: "description", label: "Description", inline: true },
  { key: "sourceNote", label: "Source", inline: true },
  { key: "sourceUrl", label: "Source URL" },
  { key: "imageUrl", label: "Image URL" },
  { key: "region", label: "Region" },
];

export default function PendingEventCard({
  event, periods, getSectionName, findEvent, readOnly, user,
  editingId, editForm, processing,
  onStartEdit, onSaveEdit, onSetEditForm, onToggleEditTag, onCancelEdit,
  onApprove, onReject,
  onEditPendingEvent, onWithdraw,
  feedbackId, feedbackText, feedbackType,
  onFeedbackOpen, onFeedbackChange, onFeedbackSubmit, onFeedbackCancel,
}) {
  const { theme } = useTheme();
  const unit = getPeriod(periods, event.period);
  const isEditing = editingId === event.id;
  const isProcessing = processing === event.id;

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

  // Build diff fields with dynamic period formatter
  const diffFields = DIFF_FIELDS.map((f) =>
    f.key === "period"
      ? { ...f, label: "Period", format: (v) => { const p = getPeriod(periods, v); return p?.label || v; } }
      : f
  );

  return (
    <div
      style={{
        border: `1.5px solid ${theme.inputBorder}`,
        borderRadius: 10,
        padding: "16px 18px",
        borderLeft: `4px solid ${unit?.color || theme.textSecondary}`,
      }}
    >
      {!readOnly && isEditing ? (
        /* Edit mode */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px",
              gap: 8,
            }}
          >
            <input
              value={editForm.title}
              onChange={(e) =>
                onSetEditForm((f) => ({ ...f, title: e.target.value }))
              }
              style={inputStyle}
              placeholder="Title"
            />
            <input
              value={editForm.year}
              onChange={(e) =>
                onSetEditForm((f) => ({
                  ...f,
                  year: parseInt(e.target.value) || "",
                }))
              }
              style={inputStyle}
              type="number"
              placeholder="Year"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <select
                value={editForm.month}
                onChange={(e) =>
                  onSetEditForm((f) => ({ ...f, month: e.target.value ? parseInt(e.target.value) : "" }))
                }
                style={inputStyle}
              >
                <option value="">Month —</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 70 }}>
              <input
                value={editForm.day}
                onChange={(e) =>
                  onSetEditForm((f) => ({ ...f, day: e.target.value ? parseInt(e.target.value) : "" }))
                }
                style={inputStyle}
                type="number"
                placeholder="Day"
                min={1}
                max={31}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 80 }}>
              <input
                value={editForm.endYear}
                onChange={(e) =>
                  onSetEditForm((f) => ({ ...f, endYear: e.target.value ? parseInt(e.target.value) : "" }))
                }
                style={inputStyle}
                type="number"
                placeholder="End yr"
              />
            </div>
            <div style={{ flex: 1 }}>
              <select
                value={editForm.endMonth}
                onChange={(e) =>
                  onSetEditForm((f) => ({ ...f, endMonth: e.target.value ? parseInt(e.target.value) : "" }))
                }
                style={inputStyle}
              >
                <option value="">End mo —</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 70 }}>
              <input
                value={editForm.endDay}
                onChange={(e) =>
                  onSetEditForm((f) => ({ ...f, endDay: e.target.value ? parseInt(e.target.value) : "" }))
                }
                style={inputStyle}
                type="number"
                placeholder="End day"
                min={1}
                max={31}
              />
            </div>
          </div>
          <select
            value={editForm.period}
            onChange={(e) =>
              onSetEditForm((f) => ({ ...f, period: e.target.value }))
            }
            style={inputStyle}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleEditTag(tag)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: `1px solid ${
                    editForm.tags.includes(tag) ? theme.activeToggleBg : theme.inputBorder
                  }`,
                  background: editForm.tags.includes(tag)
                    ? theme.activeToggleBg
                    : theme.inputBg,
                  color: editForm.tags.includes(tag) ? theme.activeToggleText : theme.textSecondary,
                  fontSize: 10,
                  fontFamily: FONT_MONO,
                  cursor: "pointer",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            value={editForm.description}
            onChange={(e) =>
              onSetEditForm((f) => ({
                ...f,
                description: e.target.value,
              }))
            }
            style={{ ...inputStyle, resize: "vertical" }}
            rows={3}
          />
          <input
            value={editForm.sourceNote}
            onChange={(e) =>
              onSetEditForm((f) => ({
                ...f,
                sourceNote: e.target.value,
              }))
            }
            style={inputStyle}
            placeholder="Source citation"
          />
          <input
            value={editForm.sourceUrl}
            onChange={(e) =>
              onSetEditForm((f) => ({
                ...f,
                sourceUrl: e.target.value,
              }))
            }
            style={inputStyle}
            placeholder="Source URL (optional)"
            type="url"
          />
          <input
            value={editForm.imageUrl}
            onChange={(e) =>
              onSetEditForm((f) => ({
                ...f,
                imageUrl: e.target.value,
              }))
            }
            style={inputStyle}
            placeholder="Image URL (optional)"
            type="url"
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={onCancelEdit}
              style={{
                padding: "6px 14px",
                background: "none",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: 6,
                fontSize: 11,
                fontFamily: FONT_MONO,
                cursor: "pointer",
                color: theme.textTertiary,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(event.id)}
              disabled={isProcessing}
              style={{
                padding: "6px 14px",
                background: theme.activeToggleBg,
                color: theme.activeToggleText,
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              <Icon icon={contentSave} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
              Save Edits
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          {event.editOf ? (() => {
            const original = findEvent(event.editOf);
            return (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    color: theme.feedbackAmber,
                    background: theme.feedbackAmberBg,
                    padding: "3px 8px",
                    borderRadius: 4,
                    display: "inline-block",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Suggested Edit
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: theme.textSecondary,
                    fontFamily: FONT_MONO,
                    marginBottom: 10,
                  }}
                >
                  by {event.addedBy} &middot; {getSectionName(event.section)}
                  {!original && <> &middot; <span style={{ color: theme.errorRed }}>Original event not found</span></>}
                </div>
                {original && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {diffFields.map(({ key, label, format, compare, inline }) => {
                      const oldVal = original[key];
                      const newVal = event[key];
                      const isEqual = compare ? compare(oldVal, newVal) : String(oldVal ?? "") === String(newVal ?? "");
                      if (isEqual) return null;
                      const fmt = format || ((v) => String(v ?? ""));
                      const isTextField = inline && !format;
                      return (
                        <div key={key} style={{
                          padding: "6px 10px",
                          background: theme.warmSubtleBg,
                          borderRadius: 6,
                          borderLeft: `3px solid ${theme.feedbackAmber}`,
                        }}>
                          <div style={{
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: FONT_MONO,
                            color: theme.textTertiary,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 3,
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontSize: key === "description" ? 11 : 12,
                            fontFamily: (key === "description" || key === "title") ? FONT_SERIF : FONT_MONO,
                            lineHeight: 1.5,
                          }}>
                            {isTextField ? (
                              computeWordDiff(oldVal, newVal).map((part, i) =>
                                part.type === "same" ? (
                                  <span key={i} style={{ color: theme.textDescription }}>{part.text}</span>
                                ) : part.type === "del" ? (
                                  <span key={i} style={{
                                    color: theme.errorRed,
                                    textDecoration: "line-through",
                                    opacity: 0.7,
                                  }}>{part.text}</span>
                                ) : (
                                  <span key={i} style={{
                                    color: theme.successGreen || "#16A34A",
                                    fontWeight: 600,
                                    background: (theme.successGreen || "#16A34A") + "15",
                                    borderRadius: 2,
                                  }}>{part.text}</span>
                                )
                              )
                            ) : (
                              <>
                                <span style={{
                                  color: theme.errorRed,
                                  textDecoration: "line-through",
                                  opacity: 0.7,
                                }}>
                                  {fmt(oldVal)}
                                </span>
                                <span style={{ color: theme.textTertiary, margin: "0 6px" }}>{"\u2192"}</span>
                                <span style={{
                                  color: theme.successGreen || "#16A34A",
                                  fontWeight: 600,
                                }}>
                                  {fmt(newVal)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })() : (
          <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                background: unit?.color || theme.textTertiary,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 7px",
                borderRadius: 4,
                fontFamily: FONT_MONO,
                flexShrink: 0,
              }}
            >
              {formatEventDate(event)}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontFamily: FONT_SERIF,
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: theme.textSecondary,
                  fontFamily: FONT_MONO,
                  marginTop: 2,
                }}
              >
                by {event.addedBy} &middot; {getSectionName(event.section)} &middot;{" "}
                {unit?.label?.slice(0, 12) || event.period}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: theme.textDescription,
              margin: "0 0 8px 0",
              fontFamily: FONT_SERIF,
            }}
          >
            {event.description}
          </p>

          {event.imageUrl && (
            <div style={{ marginBottom: 8 }}>
              <img
                src={event.imageUrl}
                alt={event.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: 6,
                  objectFit: "contain",
                  background: theme.subtleBg,
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          <div
            style={{
              fontSize: 10,
              color: theme.textTertiary,
              fontFamily: FONT_MONO,
              marginBottom: 10,
            }}
          >
            <strong>Source:</strong> {event.sourceNote}
            {event.sourceUrl && (
              <>
                {" "}&middot;{" "}
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>Link</a>
              </>
            )}
            {" "}&middot;{" "}
            <strong>Type:</strong> {event.sourceType} &middot;{" "}
            <strong>Tags:</strong> {(event.tags || []).join(", ")}
            {event.imageUrl && (
              <>
                {" "}&middot;{" "}
                <a href={event.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>Image</a>
              </>
            )}
          </div>
          </>
          )}

          {/* Student self-service buttons (readOnly mode, own submissions only) */}
          {readOnly && user && event.addedByUid === user.uid && (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <IconButton
                icon={cancelIcon}
                onClick={() => {
                  if (!window.confirm("Withdraw this submission? It will be removed from the review queue.")) return;
                  onWithdraw("event", event.id);
                }}
                size={13}
                color={theme.errorRed}
                hoverBg={(theme.errorRed || "#DC2626") + "10"}
                style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Withdraw
              </IconButton>
              <IconButton
                icon={pencilIcon}
                onClick={() => onEditPendingEvent(event)}
                size={13}
                color={theme.textDescription}
                hoverBg={theme.subtleBg}
                style={{ padding: "6px 14px", border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Edit
              </IconButton>
            </div>
          )}

          {/* Teacher action buttons */}
          {!readOnly && (
          <>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <IconButton
              icon={cancelIcon}
              onClick={() => onReject(event.id)}
              disabled={isProcessing}
              size={13}
              color={theme.errorRed}
              hoverBg={(theme.errorRed || "#DC2626") + "10"}
              style={{ padding: "6px 14px", border: `1.5px solid ${theme.errorRed}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
            >
              Reject
            </IconButton>
            <IconButton
              icon={commentAlertOutline}
              onClick={() => onFeedbackOpen(event.id, "event")}
              disabled={isProcessing}
              size={13}
              color={theme.feedbackAmber}
              hoverBg={theme.feedbackAmber + "10"}
              style={{ padding: "6px 14px", border: `1.5px solid ${theme.feedbackAmber}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
            >
              Revise
            </IconButton>
            <IconButton
              icon={pencilIcon}
              onClick={() => onStartEdit(event)}
              disabled={isProcessing}
              size={13}
              color={theme.textDescription}
              hoverBg={theme.subtleBg}
              style={{ padding: "6px 14px", border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600 }}
            >
              Edit
            </IconButton>
            <button
              onClick={() => onApprove(event)}
              disabled={isProcessing}
              style={{
                padding: "6px 14px",
                background: theme.successGreen,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              {isProcessing ? "..." : <><Icon icon={checkIcon} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Approve</>}
            </button>
          </div>
          {/* Inline feedback textarea */}
          {feedbackId === event.id && feedbackType === "event" && (
            <div style={{
              marginTop: 10,
              padding: "12px 14px",
              background: theme.feedbackAmberBg,
              borderRadius: 8,
              border: `1.5px solid ${theme.feedbackAmber}`,
            }}>
              <label style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: FONT_MONO,
                color: theme.feedbackAmberText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
                display: "block",
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
                    padding: "6px 14px",
                    background: "none",
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: FONT_MONO,
                    cursor: "pointer",
                    color: theme.textTertiary,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onFeedbackSubmit("event", event.id)}
                  disabled={!feedbackText.trim() || isProcessing}
                  style={{
                    padding: "6px 14px",
                    background: feedbackText.trim() ? theme.feedbackAmber : theme.inputBorder,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: feedbackText.trim() ? "pointer" : "default",
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