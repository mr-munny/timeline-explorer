import { useState } from "react";
import { getPeriod, TAGS } from "../data/constants";
import { approveEvent, rejectEvent, updateEvent } from "../services/database";
import { writeToSheet } from "../services/sheets";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import checkIcon from "@iconify-icons/mdi/check";
import pencilIcon from "@iconify-icons/mdi/pencil";
import cancelIcon from "@iconify-icons/mdi/cancel";
import contentSave from "@iconify-icons/mdi/content-save";
import { useTheme } from "../contexts/ThemeContext";

export default function ModerationPanel({ pendingEvents, onClose, periods = [], getSectionName = (id) => id }) {
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [processing, setProcessing] = useState(null);

  const handleApprove = async (event) => {
    setProcessing(event.id);
    try {
      await approveEvent(event.id);
      // Write to Google Sheet bridge
      writeToSheet(event);
    } catch (err) {
      console.error("Approve failed:", err);
    }
    setProcessing(null);
  };

  const handleReject = async (eventId) => {
    if (!window.confirm("Reject this submission? It will be removed.")) return;
    setProcessing(eventId);
    try {
      await rejectEvent(eventId);
    } catch (err) {
      console.error("Reject failed:", err);
    }
    setProcessing(null);
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      year: event.year,
      period: event.period,
      tags: [...(event.tags || [])],
      sourceType: event.sourceType || "Primary",
      description: event.description,
      sourceNote: event.sourceNote,
      region: event.region || "",
    });
  };

  const saveEdit = async (eventId) => {
    setProcessing(eventId);
    try {
      await updateEvent(eventId, editForm);
      setEditingId(null);
    } catch (err) {
      console.error("Edit failed:", err);
    }
    setProcessing(null);
  };

  const toggleEditTag = (tag) => {
    setEditForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'Overpass Mono', monospace",
    background: theme.inputBg,
    color: theme.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

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
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
          padding: "28px",
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: theme.modalShadow,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                fontFamily: "'Newsreader', 'Georgia', serif",
                color: theme.textPrimary,
              }}
            >
              Moderation Queue
            </h2>
            <p
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                margin: "4px 0 0",
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              {pendingEvents.length} pending submission
              {pendingEvents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textSecondary,
              lineHeight: 1,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon icon={closeIcon} width={20} />
          </button>
        </div>

        {pendingEvents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              color: theme.textSecondary,
              fontFamily: "'Overpass Mono', monospace",
              fontSize: 12,
            }}
          >
            No pending submissions. All caught up!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingEvents.map((event) => {
              const unit = getPeriod(periods, event.period);
              const isEditing = editingId === event.id;
              const isProcessing = processing === event.id;

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
                  {isEditing ? (
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
                            setEditForm((f) => ({ ...f, title: e.target.value }))
                          }
                          style={inputStyle}
                          placeholder="Title"
                        />
                        <input
                          value={editForm.year}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              year: parseInt(e.target.value) || "",
                            }))
                          }
                          style={inputStyle}
                          type="number"
                          placeholder="Year"
                        />
                      </div>
                      <select
                        value={editForm.period}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, period: e.target.value }))
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
                            onClick={() => toggleEditTag(tag)}
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
                              fontFamily: "'Overpass Mono', monospace",
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
                          setEditForm((f) => ({
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
                          setEditForm((f) => ({
                            ...f,
                            sourceNote: e.target.value,
                          }))
                        }
                        style={inputStyle}
                        placeholder="Source citation"
                      />
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: "6px 14px",
                            background: "none",
                            border: `1.5px solid ${theme.inputBorder}`,
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            cursor: "pointer",
                            color: theme.textTertiary,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(event.id)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px",
                            background: theme.activeToggleBg,
                            color: theme.activeToggleText,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Icon icon={contentSave} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          Save Edits
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
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
                            fontFamily: "'Overpass Mono', monospace",
                            flexShrink: 0,
                          }}
                        >
                          {event.year}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: theme.textPrimary,
                              fontFamily: "'Newsreader', 'Georgia', serif",
                            }}
                          >
                            {event.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: theme.textSecondary,
                              fontFamily: "'Overpass Mono', monospace",
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
                          fontFamily: "'Newsreader', 'Georgia', serif",
                        }}
                      >
                        {event.description}
                      </p>

                      <div
                        style={{
                          fontSize: 10,
                          color: theme.textTertiary,
                          fontFamily: "'Overpass Mono', monospace",
                          marginBottom: 10,
                        }}
                      >
                        <strong>Source:</strong> {event.sourceNote} &middot;{" "}
                        <strong>Type:</strong> {event.sourceType} &middot;{" "}
                        <strong>Tags:</strong> {(event.tags || []).join(", ")}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleReject(event.id)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px",
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
                          <Icon icon={cancelIcon} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          Reject
                        </button>
                        <button
                          onClick={() => startEdit(event)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px",
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
                          <Icon icon={pencilIcon} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleApprove(event)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px",
                            background: theme.successGreen,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isProcessing ? "..." : <><Icon icon={checkIcon} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Approve</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
