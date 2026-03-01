import { useState } from "react";
import { getPeriod, TAGS } from "../data/constants";
import { formatEventDate, MONTHS } from "../utils/dateUtils";
import { approveEvent, rejectEvent, updateEvent, approveEdit, approveConnection, rejectConnection, updateConnection, approveConnectionEdit, approveConnectionDeletion } from "../services/database";
import { writeToSheet } from "../services/sheets";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import checkIcon from "@iconify-icons/mdi/check";
import pencilIcon from "@iconify-icons/mdi/pencil";
import cancelIcon from "@iconify-icons/mdi/cancel";
import contentSave from "@iconify-icons/mdi/content-save";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme } from "../contexts/ThemeContext";

export default function ModerationPanel({ pendingEvents, pendingConnections = [], allEvents = [], allConnections = [], onClose, periods = [], getSectionName = (id) => id, onEventApproved }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("events");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [processing, setProcessing] = useState(null);
  const [editingConnId, setEditingConnId] = useState(null);
  const [editConnDesc, setEditConnDesc] = useState("");

  const handleApprove = async (event) => {
    setProcessing(event.id);
    try {
      if (event.editOf) {
        // Edit proposal: apply changes to original event, remove proposal
        const original = findEvent(event.editOf);
        const { editOf, addedBy, addedByEmail, addedByUid, status, dateAdded, id, section, ...edits } = event;
        const existingHistory = original?.editHistory || [];
        // Compute which fields changed for edit history
        const changes = {};
        if (original) {
          const changeFields = ["title", "year", "month", "day", "endYear", "endMonth", "endDay", "period", "tags", "sourceType", "description", "sourceNote", "sourceUrl", "imageUrl", "region"];
          for (const key of changeFields) {
            const oldVal = original[key];
            const newVal = event[key];
            const isEqual = key === "tags" ? JSON.stringify(oldVal) === JSON.stringify(newVal) : String(oldVal ?? "") === String(newVal ?? "");
            if (!isEqual) changes[key] = { from: oldVal ?? null, to: newVal ?? null };
          }
        }
        await approveEdit(event.id, event.editOf, {
          ...edits,
          editHistory: [...existingHistory, {
            name: event.addedBy,
            email: event.addedByEmail,
            date: event.dateAdded,
            changes,
          }],
        });
      } else {
        await approveEvent(event.id);
        // Write to Google Sheet bridge
        writeToSheet(event);
        // Notify parent to potentially expand timeline range
        if (onEventApproved) onEventApproved(event);
      }
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
      month: event.month || "",
      day: event.day || "",
      endYear: event.endYear || "",
      endMonth: event.endMonth || "",
      endDay: event.endDay || "",
      period: event.period,
      tags: [...(event.tags || [])],
      sourceType: event.sourceType || "Primary",
      description: event.description,
      sourceNote: event.sourceNote,
      sourceUrl: event.sourceUrl || "",
      imageUrl: event.imageUrl || "",
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

  const handleApproveConnection = async (conn) => {
    setProcessing(conn.id);
    try {
      if (conn.deleteOf) {
        await approveConnectionDeletion(conn.id, conn.deleteOf);
      } else if (conn.editOf) {
        const originalConn = findConnection(conn.editOf);
        const { editOf, addedBy, addedByEmail, addedByUid, status, dateAdded, id, section, editHistory: _, ...edits } = conn;
        const existingHistory = originalConn?.editHistory || [];
        const changes = {};
        if (originalConn) {
          for (const key of ["description", "causeEventId", "effectEventId"]) {
            const oldVal = originalConn[key];
            const newVal = conn[key];
            if (String(oldVal ?? "") !== String(newVal ?? "")) {
              changes[key] = { from: oldVal ?? null, to: newVal ?? null };
            }
          }
        }
        await approveConnectionEdit(conn.id, conn.editOf, {
          ...edits,
          editHistory: [...existingHistory, {
            name: conn.addedBy,
            email: conn.addedByEmail,
            date: conn.dateAdded,
            changes,
          }],
        });
      } else {
        await approveConnection(conn.id);
      }
    } catch (err) {
      console.error("Approve connection failed:", err);
    }
    setProcessing(null);
  };

  const handleRejectConnection = async (connId) => {
    if (!window.confirm("Reject this connection? It will be removed.")) return;
    setProcessing(connId);
    try {
      await rejectConnection(connId);
    } catch (err) {
      console.error("Reject connection failed:", err);
    }
    setProcessing(null);
  };

  const saveConnEdit = async (connId) => {
    setProcessing(connId);
    try {
      await updateConnection(connId, { description: editConnDesc });
      setEditingConnId(null);
    } catch (err) {
      console.error("Edit connection failed:", err);
    }
    setProcessing(null);
  };

  const findEvent = (id) => allEvents.find((e) => e.id === id);
  const findConnection = (id) => allConnections.find((c) => c.id === id);

  // Simple word-level diff using longest common subsequence
  const computeWordDiff = (oldStr, newStr) => {
    const oldWords = String(oldStr ?? "").split(/(\s+)/);
    const newWords = String(newStr ?? "").split(/(\s+)/);
    const m = oldWords.length, n = newWords.length;
    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    // Backtrack to produce diff
    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        result.push({ type: "same", text: oldWords[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.push({ type: "add", text: newWords[j - 1] });
        j--;
      } else {
        result.push({ type: "del", text: oldWords[i - 1] });
        i--;
      }
    }
    return result.reverse();
  };

  const DIFF_FIELDS = [
    { key: "title", label: "Title", inline: true },
    { key: "year", label: "Year" },
    { key: "month", label: "Month", format: (v) => v ? MONTHS[v - 1] : "None" },
    { key: "day", label: "Day" },
    { key: "endYear", label: "End Year" },
    { key: "endMonth", label: "End Month", format: (v) => v ? MONTHS[v - 1] : "None" },
    { key: "endDay", label: "End Day" },
    { key: "period", label: "Period", format: (v) => { const p = getPeriod(periods, v); return p?.label || v; } },
    { key: "tags", label: "Tags", format: (v) => (v || []).join(", "), compare: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
    { key: "sourceType", label: "Source Type" },
    { key: "description", label: "Description", inline: true },
    { key: "sourceNote", label: "Source", inline: true },
    { key: "sourceUrl", label: "Source URL" },
    { key: "imageUrl", label: "Image URL" },
    { key: "region", label: "Region" },
  ];

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
              {pendingEvents.length + pendingConnections.length} pending submission
              {(pendingEvents.length + pendingConnections.length) !== 1 ? "s" : ""}
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
              borderRadius: 4,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; e.currentTarget.style.background = theme.subtleBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.textSecondary; e.currentTarget.style.background = "none"; }}
          >
            <Icon icon={closeIcon} width={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: `1.5px solid ${theme.inputBorder}` }}>
          {[
            { id: "events", label: `Events (${pendingEvents.length})` },
            { id: "connections", label: `Connections (${pendingConnections.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${theme.textPrimary}` : "2px solid transparent",
                color: activeTab === tab.id ? theme.textPrimary : theme.textSecondary,
                fontSize: 12,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = theme.textPrimary; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = theme.textSecondary; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "events" && (pendingEvents.length === 0 ? (
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <select
                            value={editForm.month}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, month: e.target.value ? parseInt(e.target.value) : "" }))
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
                              setEditForm((f) => ({ ...f, day: e.target.value ? parseInt(e.target.value) : "" }))
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
                              setEditForm((f) => ({ ...f, endYear: e.target.value ? parseInt(e.target.value) : "" }))
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
                              setEditForm((f) => ({ ...f, endMonth: e.target.value ? parseInt(e.target.value) : "" }))
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
                              setEditForm((f) => ({ ...f, endDay: e.target.value ? parseInt(e.target.value) : "" }))
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
                      <input
                        value={editForm.sourceUrl}
                        onChange={(e) =>
                          setEditForm((f) => ({
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
                          setEditForm((f) => ({
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
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
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
                                fontFamily: "'Overpass Mono', monospace",
                                color: "#D97706",
                                background: "#FEF3C7",
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
                                fontFamily: "'Overpass Mono', monospace",
                                marginBottom: 10,
                              }}
                            >
                              by {event.addedBy} &middot; {getSectionName(event.section)}
                              {!original && <> &middot; <span style={{ color: theme.errorRed }}>Original event not found</span></>}
                            </div>
                            {original && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                {DIFF_FIELDS.map(({ key, label, format, compare, inline }) => {
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
                                      borderLeft: `3px solid #D97706`,
                                    }}>
                                      <div style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        fontFamily: "'Overpass Mono', monospace",
                                        color: theme.textTertiary,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        marginBottom: 3,
                                      }}>
                                        {label}
                                      </div>
                                      <div style={{
                                        fontSize: key === "description" ? 11 : 12,
                                        fontFamily: (key === "description" || key === "title") ? "'Newsreader', serif" : "'Overpass Mono', monospace",
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
                            fontFamily: "'Overpass Mono', monospace",
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
                          fontFamily: "'Overpass Mono', monospace",
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
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = (theme.errorRed || "#DC2626") + "10"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
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
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
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
                            transition: "filter 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
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
        ))}

        {activeTab === "connections" && (pendingConnections.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              color: theme.textSecondary,
              fontFamily: "'Overpass Mono', monospace",
              fontSize: 12,
            }}
          >
            No pending connections. All caught up!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingConnections.map((conn) => {
              const causeEvent = findEvent(conn.causeEventId);
              const effectEvent = findEvent(conn.effectEventId);
              const causeUnit = causeEvent ? getPeriod(periods, causeEvent.period) : null;
              const effectUnit = effectEvent ? getPeriod(periods, effectEvent.period) : null;
              const isProcessing = processing === conn.id;
              const isEditing = editingConnId === conn.id;

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
                  {/* Cause → Effect display */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 10px", background: theme.warmSubtleBg, borderRadius: 6,
                      borderLeft: `3px solid ${causeUnit?.color || theme.textSecondary}`,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                        color: causeUnit?.color || theme.textSecondary,
                      }}>
                        {causeEvent?.year || "?"}
                      </span>
                      <span style={{
                        fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600,
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
                        fontSize: 10, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                        color: effectUnit?.color || theme.textSecondary,
                      }}>
                        {effectEvent?.year || "?"}
                      </span>
                      <span style={{
                        fontSize: 12, fontFamily: "'Newsreader', serif", fontWeight: 600,
                        color: theme.textPrimary,
                      }}>
                        {effectEvent?.title || "Unknown event"}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        value={editConnDesc}
                        onChange={(e) => setEditConnDesc(e.target.value)}
                        style={{ ...inputStyle, resize: "vertical" }}
                        rows={3}
                      />
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setEditingConnId(null)}
                          style={{
                            padding: "6px 14px", background: "none",
                            border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6,
                            fontSize: 11, fontFamily: "'Overpass Mono', monospace",
                            cursor: "pointer", color: theme.textTertiary,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveConnEdit(conn.id)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px", background: theme.activeToggleBg,
                            color: theme.activeToggleText, border: "none", borderRadius: 6,
                            fontSize: 11, fontFamily: "'Overpass Mono', monospace",
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
                            fontFamily: "'Overpass Mono', monospace", fontWeight: 700,
                            marginBottom: 8,
                          }}>
                            Suggested Deletion
                          </div>
                          <p style={{
                            fontSize: 12, lineHeight: 1.6, color: theme.textDescription,
                            margin: "0 0 8px 0", fontFamily: "'Newsreader', serif",
                          }}>
                            {conn.description}
                          </p>
                          <div style={{
                            fontSize: 10, color: theme.textTertiary,
                            fontFamily: "'Overpass Mono', monospace", marginBottom: 10,
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
                              background: "#FEF3C7", color: "#92400E", fontSize: 10,
                              fontFamily: "'Overpass Mono', monospace", fontWeight: 700,
                              marginBottom: 8,
                            }}>
                              Suggested Edit
                            </div>
                            <div style={{
                              fontSize: 10, color: theme.textTertiary,
                              fontFamily: "'Overpass Mono', monospace", marginBottom: 10,
                            }}>
                              by {conn.addedBy} &middot; {getSectionName(conn.section)}
                              {!originalConn && <> &middot; <span style={{ color: theme.errorRed }}>Original connection not found</span></>}
                            </div>
                            {originalConn && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                {String(originalConn.description ?? "") !== String(conn.description ?? "") && (
                                  <div style={{
                                    padding: "6px 10px", background: theme.warmSubtleBg,
                                    borderRadius: 6, borderLeft: "3px solid #D97706",
                                  }}>
                                    <div style={{
                                      fontSize: 9, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                                      color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                                    }}>
                                      Description
                                    </div>
                                    <div style={{ fontSize: 11, fontFamily: "'Newsreader', serif", lineHeight: 1.5 }}>
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
                                    borderRadius: 6, borderLeft: "3px solid #D97706",
                                  }}>
                                    <div style={{
                                      fontSize: 9, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                                      color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                                    }}>
                                      Cause Event
                                    </div>
                                    <div style={{ fontSize: 11, fontFamily: "'Newsreader', serif" }}>
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
                                    borderRadius: 6, borderLeft: "3px solid #D97706",
                                  }}>
                                    <div style={{
                                      fontSize: 9, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
                                      color: theme.textTertiary, textTransform: "uppercase", marginBottom: 4,
                                    }}>
                                      Effect Event
                                    </div>
                                    <div style={{ fontSize: 11, fontFamily: "'Newsreader', serif" }}>
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
                            margin: "0 0 8px 0", fontFamily: "'Newsreader', serif",
                          }}>
                            {conn.description}
                          </p>
                          <div style={{
                            fontSize: 10, color: theme.textTertiary,
                            fontFamily: "'Overpass Mono', monospace", marginBottom: 10,
                          }}>
                            by {conn.addedBy} &middot; {getSectionName(conn.section)}
                          </div>
                        </>
                      )}
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleRejectConnection(conn.id)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px", background: "none",
                            border: `1.5px solid ${theme.errorRed}`, borderRadius: 6,
                            color: theme.errorRed, fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace", fontWeight: 600, cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = (theme.errorRed || "#DC2626") + "10"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                        >
                          <Icon icon={cancelIcon} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          Reject
                        </button>
                        {!conn.editOf && !conn.deleteOf && (
                          <button
                            onClick={() => { setEditingConnId(conn.id); setEditConnDesc(conn.description); }}
                            disabled={isProcessing}
                            style={{
                              padding: "6px 14px", background: "none",
                              border: `1.5px solid ${theme.inputBorder}`, borderRadius: 6,
                              color: theme.textDescription, fontSize: 11,
                              fontFamily: "'Overpass Mono', monospace", fontWeight: 600, cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            <Icon icon={pencilIcon} width={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleApproveConnection(conn)}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 14px", background: conn.deleteOf ? (theme.errorRed || "#DC2626") : theme.successGreen,
                            color: "#fff", border: "none", borderRadius: 6,
                            fontSize: 11, fontFamily: "'Overpass Mono', monospace",
                            fontWeight: 700, cursor: "pointer",
                            transition: "filter 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                        >
                          {isProcessing ? "..." : <><Icon icon={checkIcon} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />{conn.deleteOf ? "Delete" : "Approve"}</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
