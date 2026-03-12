import { getPeriod, TAGS } from "../data/constants";
import { formatEventDate, MONTHS } from "../utils/dateUtils";
import { computeWordDiff } from "../utils/diffUtils";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/mdi/check";
import pencilIcon from "@iconify-icons/mdi/pencil";
import cancelIcon from "@iconify-icons/mdi/cancel";
import contentSave from "@iconify-icons/mdi/content-save";
import commentAlertOutline from "@iconify-icons/mdi/comment-alert-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
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
  feedbackId, feedbackText, feedbackType, feedbackMode,
  onFeedbackOpen, onFeedbackChange, onFeedbackSubmit, onFeedbackCancel,
  autoModeratorEnabled,
}) {
  const { theme } = useTheme();
  const unit = getPeriod(periods, event.period);
  const isEditing = editingId === event.id;
  const isProcessing = processing === event.id;

  const inputStyle = {
    width: "100%",
    padding: `${SPACING[1.5] || "0.4375rem"} ${SPACING[2.5]}`,
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
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
        borderRadius: RADII.xl,
        padding: `${SPACING[4]} ${SPACING[4]}`,
        borderLeft: `4px solid ${unit?.color || theme.textSecondary}`,
      }}
    >
      {!readOnly && isEditing ? (
        /* Edit mode */
        <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2.5] }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px",
              gap: SPACING[2],
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
          <div style={{ display: "flex", gap: SPACING[2] }}>
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
          <div style={{ display: "flex", gap: SPACING[2] }}>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING[1] }}>
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleEditTag(tag)}
                style={{
                  padding: `${SPACING[0.5] || "0.1875rem"} ${SPACING[2]}`,
                  borderRadius: RADII.sm,
                  border: `1px solid ${
                    editForm.tags.includes(tag) ? theme.activeToggleBg : theme.inputBorder
                  }`,
                  background: editForm.tags.includes(tag)
                    ? theme.activeToggleBg
                    : theme.inputBg,
                  color: editForm.tags.includes(tag) ? theme.activeToggleText : theme.textSecondary,
                  fontSize: FONT_SIZES.tiny,
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
          <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
            <button
              onClick={onCancelEdit}
              aria-label="Cancel editing"
              style={{
                padding: `${SPACING[1.5]} ${SPACING[3]}`,
                background: "none",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: RADII.md,
                fontSize: FONT_SIZES.micro,
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
              aria-label="Save edits"
              style={{
                padding: `${SPACING[1.5]} ${SPACING[3]}`,
                background: theme.activeToggleBg,
                color: theme.activeToggleText,
                border: "none",
                borderRadius: RADII.md,
                fontSize: FONT_SIZES.micro,
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
                    fontSize: FONT_SIZES.tiny,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    color: theme.feedbackAmber,
                    background: theme.feedbackAmberBg,
                    padding: `${SPACING[0.5] || "0.1875rem"} ${SPACING[2]}`,
                    borderRadius: RADII.sm,
                    display: "inline-block",
                    marginBottom: SPACING[1.5],
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Suggested Edit
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    color: theme.textSecondary,
                    fontFamily: FONT_MONO,
                    marginBottom: SPACING[2.5],
                  }}
                >
                  by {event.addedBy} &middot; {getSectionName(event.section)}
                  {!original && <> &middot; <span style={{ color: theme.errorRed }}>Original event not found</span></>}
                </div>
                {original && (
                  <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5], marginBottom: SPACING[2.5] }}>
                    {diffFields.map(({ key, label, format, compare, inline }) => {
                      const oldVal = original[key];
                      const newVal = event[key];
                      const isEqual = compare ? compare(oldVal, newVal) : String(oldVal ?? "") === String(newVal ?? "");
                      if (isEqual) return null;
                      const fmt = format || ((v) => String(v ?? ""));
                      const isTextField = inline && !format;
                      return (
                        <div key={key} style={{
                          padding: `${SPACING[1.5]} ${SPACING[2.5]}`,
                          background: theme.warmSubtleBg,
                          borderRadius: RADII.md,
                          borderLeft: `3px solid ${theme.feedbackAmber}`,
                        }}>
                          <div style={{
                            fontSize: FONT_SIZES.micro,
                            fontWeight: 700,
                            fontFamily: FONT_MONO,
                            color: theme.textTertiary,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: SPACING[0.5] || "0.1875rem",
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontSize: key === "description" ? FONT_SIZES.micro : FONT_SIZES.tiny,
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
                                <span style={{ color: theme.textTertiary, margin: `0 ${SPACING[1.5]}` }}>{"\u2192"}</span>
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
                {event.editRationale && (
                  <div style={{
                    padding: `${SPACING[2]} ${SPACING[2.5]}`,
                    background: theme.subtleBg,
                    borderRadius: RADII.md,
                    borderLeft: `3px solid ${theme.textTertiary}`,
                    marginBottom: SPACING[1],
                  }}>
                    <div style={{
                      fontSize: FONT_SIZES.micro,
                      fontWeight: 700,
                      fontFamily: FONT_MONO,
                      color: theme.textTertiary,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: SPACING[1],
                    }}>
                      Student's Rationale
                    </div>
                    <div style={{
                      fontSize: FONT_SIZES.tiny,
                      fontFamily: FONT_SERIF,
                      color: theme.textDescription,
                      lineHeight: 1.5,
                    }}>
                      {event.editRationale}
                    </div>
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
              gap: SPACING[2.5],
              marginBottom: SPACING[2],
            }}
          >
            <div
              style={{
                background: unit?.color || theme.textTertiary,
                color: "#fff",
                fontSize: FONT_SIZES.micro,
                fontWeight: 700,
                padding: `${SPACING[0.5] || "0.1875rem"} ${SPACING[2]}`,
                borderRadius: RADII.sm,
                fontFamily: FONT_MONO,
                flexShrink: 0,
              }}
            >
              {formatEventDate(event)}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: FONT_SIZES.base,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontFamily: FONT_SERIF,
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: theme.textSecondary,
                  fontFamily: FONT_MONO,
                  marginTop: SPACING["0.5"],
                }}
              >
                by {event.addedBy} &middot; {getSectionName(event.section)} &middot;{" "}
                {unit?.label?.slice(0, 12) || event.period}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: FONT_SIZES.tiny,
              lineHeight: 1.6,
              color: theme.textDescription,
              margin: `0 0 ${SPACING[2]} 0`,
              fontFamily: FONT_SERIF,
            }}
          >
            {event.description}
          </p>

          {event.imageUrl && (
            <div style={{ marginBottom: SPACING[2] }}>
              <img
                src={event.imageUrl}
                alt={event.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: RADII.md,
                  objectFit: "contain",
                  background: theme.subtleBg,
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          <div
            style={{
              fontSize: FONT_SIZES.tiny,
              color: theme.textTertiary,
              fontFamily: FONT_MONO,
              marginBottom: SPACING[2.5],
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

          {/* AI Auto-Moderator Review */}
          {!readOnly && event.aiReview && (() => {
            const review = event.aiReview;
            const rec = review.recommendation;
            const colorMap = {
              approve: { border: theme.successGreen || "#16A34A", bg: (theme.successGreen || "#16A34A") + "12", text: theme.successGreen || "#16A34A", label: "AI: Approve" },
              flag: { border: theme.feedbackAmber, bg: theme.feedbackAmberBg, text: theme.feedbackAmber, label: "AI: Flag for Review" },
              reject: { border: theme.errorRed, bg: (theme.errorRed || "#DC2626") + "12", text: theme.errorRed, label: "AI: Reject" },
            };
            const style = colorMap[rec] || colorMap.flag;
            return (
              <div style={{
                padding: `${SPACING[2.5]} ${SPACING[3]}`,
                background: style.bg,
                border: `1.5px solid ${style.border}`,
                borderRadius: RADII.lg,
                marginBottom: SPACING[2.5],
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING[1] }}>
                  <span style={{
                    fontSize: FONT_SIZES.tiny,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    color: style.text,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {style.label}
                  </span>
                  <span style={{
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    color: theme.textSecondary,
                  }}>
                    Confidence: {review.confidence}/10
                  </span>
                </div>
                <p style={{
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_SERIF,
                  color: theme.textDescription,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {review.reasoning}
                </p>
                {(rec === "approve" || rec === "reject") && (
                  <button
                    onClick={() => rec === "approve" ? onApprove(event) : onReject(event.id)}
                    disabled={isProcessing}
                    style={{
                      marginTop: SPACING[2],
                      padding: `${SPACING[1.5]} ${SPACING[3]}`,
                      background: style.text,
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
                    {isProcessing ? "..." : `Accept: ${rec === "approve" ? "Approve" : "Reject"}`}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Pending AI review indicator */}
          {!readOnly && !event.aiReview && autoModeratorEnabled && !event.editOf && (
            <div style={{
              padding: `${SPACING[2]} ${SPACING[3]}`,
              background: theme.subtleBg,
              border: `1.5px dashed ${theme.inputBorder}`,
              borderRadius: RADII.lg,
              marginBottom: SPACING[2.5],
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
            }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `2px solid ${theme.textMuted}`,
                borderTopColor: "transparent",
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }} />
              <span style={{
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                color: theme.textMuted,
              }}>
                Awaiting AI review...
              </span>
            </div>
          )}

          {/* Student self-service buttons (readOnly mode, own submissions only) */}
          {readOnly && user && event.addedByUid === user.uid && (
            <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
              <IconButton
                icon={cancelIcon}
                onClick={() => {
                  if (!window.confirm("Withdraw this submission? It will be removed from the review queue.")) return;
                  onWithdraw("event", event.id);
                }}
                size={13}
                color={theme.errorRed}
                hoverBg={(theme.errorRed || "#DC2626") + "10"}
                aria-label="Withdraw submission"
                style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.errorRed}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Withdraw
              </IconButton>
              <IconButton
                icon={pencilIcon}
                onClick={() => onEditPendingEvent(event)}
                size={13}
                color={theme.textDescription}
                hoverBg={theme.subtleBg}
                aria-label="Edit submission"
                style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.inputBorder}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
              >
                Edit
              </IconButton>
            </div>
          )}

          {/* Teacher action buttons */}
          {!readOnly && (
          <>
          <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
            <IconButton
              icon={cancelIcon}
              onClick={() => onReject(event.id)}
              disabled={isProcessing}
              size={13}
              color={theme.errorRed}
              hoverBg={(theme.errorRed || "#DC2626") + "10"}
              aria-label="Reject event"
              style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.errorRed}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
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
              aria-label="Request revision"
              style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.feedbackAmber}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
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
              aria-label="Edit event"
              style={{ padding: `${SPACING[1.5]} ${SPACING[3]}`, border: `1.5px solid ${theme.inputBorder}`, borderRadius: RADII.md, fontSize: FONT_SIZES.micro, fontFamily: FONT_MONO, fontWeight: 600 }}
            >
              Edit
            </IconButton>
            <button
              onClick={() => onApprove(event)}
              disabled={isProcessing}
              aria-label="Approve event"
              style={{
                padding: `${SPACING[1.5]} ${SPACING[3]}`,
                background: theme.successGreen,
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
              {isProcessing ? "..." : <><Icon icon={checkIcon} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Approve</>}
            </button>
          </div>
          {/* Inline feedback textarea (revision or rejection) */}
          {feedbackId === event.id && feedbackType === "event" && (() => {
            const isRejection = feedbackMode === "rejection";
            const accentColor = isRejection ? theme.errorRed : theme.feedbackAmber;
            const accentBg = isRejection ? (theme.errorRed || "#DC2626") + "08" : theme.feedbackAmberBg;
            const accentText = isRejection ? theme.errorRed : theme.feedbackAmberText;
            return (
            <div style={{
              marginTop: SPACING[2.5],
              padding: `${SPACING[3]} ${SPACING[3]}`,
              background: accentBg,
              borderRadius: RADII.lg,
              border: `1.5px solid ${accentColor}`,
            }}>
              <label style={{
                fontSize: FONT_SIZES.tiny,
                fontWeight: 700,
                fontFamily: FONT_MONO,
                color: accentText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: SPACING[1.5],
                display: "block",
              }}>
                {isRejection ? "Reason for Rejection" : "Feedback for Student"}
              </label>
              <textarea
                autoFocus
                value={feedbackText}
                onChange={(e) => onFeedbackChange(e.target.value)}
                placeholder={isRejection ? "Why is this submission being rejected?" : "What should the student fix or improve?"}
                rows={3}
                style={{ ...inputStyle, borderColor: accentColor }}
              />
              <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end", marginTop: SPACING[2] }}>
                <button
                  onClick={onFeedbackCancel}
                  aria-label="Cancel feedback"
                  style={{
                    padding: `${SPACING[1.5]} ${SPACING[3]}`,
                    background: "none",
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: RADII.md,
                    fontSize: FONT_SIZES.micro,
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
                  aria-label={isRejection ? "Reject submission" : "Send feedback"}
                  style={{
                    padding: `${SPACING[1.5]} ${SPACING[3]}`,
                    background: feedbackText.trim() ? accentColor : theme.inputBorder,
                    color: "#fff",
                    border: "none",
                    borderRadius: RADII.md,
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: feedbackText.trim() ? "pointer" : "default",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) => { if (feedbackText.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  {isRejection ? "Reject Submission" : "Send Feedback"}
                </button>
              </div>
            </div>
            );
          })()}
          </>
          )}
        </>
      )}
    </div>
  );
}
