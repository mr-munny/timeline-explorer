import { useState } from "react";
import { approveEvent, rejectEvent, updateEvent, approveEdit, approveConnection, rejectConnection, updateConnection, approveConnectionEdit, approveConnectionDeletion, requestRevision, saveAutoModeratorVisible, saveAutoModeratorEnabled } from "../services/database";
import { writeToSheet } from "../services/sheets";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import PendingEventCard from "./PendingEventCard";
import PendingConnectionCard from "./PendingConnectionCard";
import AwaitingRevisionSection from "./AwaitingRevisionSection";

export default function ModerationPanel({ pendingEvents, pendingConnections = [], needsRevisionEvents = [], needsRevisionConnections = [], allEvents = [], allConnections = [], periods = [], periodsBySection = {}, getSectionName = (id) => id, onEventApproved, readOnly = false, user, userName, onEditPendingEvent, onEditPendingConnection, onWithdraw, autoModeratorEnabled = false, autoModeratorVisible = false, isSuperAdmin = false, teacherUid }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("events");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [processing, setProcessing] = useState(null);
  const [editingConnId, setEditingConnId] = useState(null);
  const [editConnDesc, setEditConnDesc] = useState("");
  const [feedbackId, setFeedbackId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState(null);

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

  const handleRequestRevision = async (itemType, itemId) => {
    if (!feedbackText.trim()) return;
    setProcessing(itemId);
    try {
      await requestRevision(
        itemType === "event" ? "events" : "connections",
        itemId,
        feedbackText.trim(),
        userName,
        user?.email
      );
      setFeedbackId(null);
      setFeedbackText("");
      setFeedbackType(null);
    } catch (err) {
      console.error("Request revision failed:", err);
    }
    setProcessing(null);
  };

  const findEvent = (id) => allEvents.find((e) => e.id === id);
  const findConnection = (id) => allConnections.find((c) => c.id === id);

  const handleFeedbackOpen = (id, type) => {
    setFeedbackId(id);
    setFeedbackType(type);
    setFeedbackText("");
  };

  const handleFeedbackCancel = () => {
    setFeedbackId(null);
    setFeedbackText("");
    setFeedbackType(null);
  };

  const handleStartConnEdit = (connId, description) => {
    setEditingConnId(connId);
    setEditConnDesc(description);
  };

  return (
      <div
        style={{
          padding: `${SPACING[6]} ${SPACING[8]}`,
          maxWidth: 640,
          fontFamily: FONT_MONO,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: SPACING[5],
          }}
        >
          <div>
            <h2
              style={{
                fontSize: FONT_SIZES.lg,
                fontWeight: 700,
                margin: 0,
                fontFamily: FONT_SERIF,
                color: theme.textPrimary,
              }}
            >
              {readOnly ? "Pending Submissions" : "Moderation Queue"}
            </h2>
            <p
              style={{
                fontSize: FONT_SIZES.micro,
                color: theme.textSecondary,
                margin: `${SPACING[1]} 0 0`,
                fontFamily: FONT_MONO,
              }}
            >
              {pendingEvents.length + pendingConnections.length} pending
              {(needsRevisionEvents.length + needsRevisionConnections.length) > 0
                ? ` · ${needsRevisionEvents.length + needsRevisionConnections.length} awaiting revision`
                : ""}
            </p>
          </div>
          {!readOnly && (isSuperAdmin || autoModeratorVisible) && (
            <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
              <button
                onClick={() => teacherUid && saveAutoModeratorEnabled(teacherUid, !autoModeratorEnabled)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: SPACING[2],
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  borderRadius: RADII.lg,
                  border: `1.5px solid ${autoModeratorEnabled ? theme.accentGold : theme.inputBorder}`,
                  background: autoModeratorEnabled ? theme.accentGold + "15" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                title={autoModeratorEnabled ? "AI auto-moderator is on — click to disable" : "Enable AI auto-moderator for new submissions"}
              >
                <span style={{
                  fontSize: FONT_SIZES.micro,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  color: autoModeratorEnabled ? theme.accentGold : theme.textSecondary,
                  whiteSpace: "nowrap",
                }}>
                  AI Moderator
                </span>
                <span style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: autoModeratorEnabled ? theme.accentGold : theme.inputBorder,
                  position: "relative",
                  display: "inline-block",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}>
                  <span style={{
                    position: "absolute",
                    top: 2,
                    left: autoModeratorEnabled ? 16 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.15s",
                  }} />
                </span>
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => saveAutoModeratorVisible(!autoModeratorVisible)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[1],
                    padding: `${SPACING[1]} ${SPACING[2]}`,
                    borderRadius: RADII.md,
                    border: `1.5px solid ${autoModeratorVisible ? theme.accentGold : theme.inputBorder}`,
                    background: autoModeratorVisible ? theme.accentGold + "15" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    color: autoModeratorVisible ? theme.accentGold : theme.textSecondary,
                  }}
                  title={autoModeratorVisible ? "Hide AI Moderator toggle from other teachers" : "Show AI Moderator toggle to other teachers"}
                >
                  {autoModeratorVisible ? "Visible" : "Hidden"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display: "flex", gap: 0, marginBottom: SPACING[4], borderBottom: `1.5px solid ${theme.inputBorder}` }}>
          {[
            { id: "events", label: `Events (${pendingEvents.length + needsRevisionEvents.length})` },
            { id: "connections", label: `Connections (${pendingConnections.length + needsRevisionConnections.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `${SPACING[2]} ${SPACING[4]}`,
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${theme.textPrimary}` : "2px solid transparent",
                color: activeTab === tab.id ? theme.textPrimary : theme.textSecondary,
                fontSize: FONT_SIZES.tiny,
                fontFamily: FONT_MONO,
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

        {activeTab === "events" && ((pendingEvents.length === 0 && needsRevisionEvents.length === 0) ? (
          <div
            role="tabpanel"
            style={{
              textAlign: "center",
              padding: `${SPACING[8]} ${SPACING[5]}`,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
              fontSize: FONT_SIZES.tiny,
            }}
          >
            {readOnly ? "No pending submissions right now." : "No pending submissions. All caught up!"}
          </div>
        ) : (
          <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
            {pendingEvents.map((event) => (
              <PendingEventCard
                key={event.id}
                event={event}
                periods={periodsBySection[event.section] || periods}
                getSectionName={getSectionName}
                findEvent={findEvent}
                readOnly={readOnly}
                user={user}
                editingId={editingId}
                editForm={editForm}
                processing={processing}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onSetEditForm={setEditForm}
                onToggleEditTag={toggleEditTag}
                onCancelEdit={() => setEditingId(null)}
                onApprove={handleApprove}
                onReject={handleReject}
                onEditPendingEvent={onEditPendingEvent}
                onWithdraw={onWithdraw}
                feedbackId={feedbackId}
                feedbackText={feedbackText}
                feedbackType={feedbackType}
                onFeedbackOpen={handleFeedbackOpen}
                onFeedbackChange={setFeedbackText}
                onFeedbackSubmit={handleRequestRevision}
                onFeedbackCancel={handleFeedbackCancel}
                autoModeratorEnabled={autoModeratorEnabled}
              />
            ))}
          </div>
        ))}

        {/* Awaiting revision events */}
        {activeTab === "events" && !readOnly && (
          <AwaitingRevisionSection
            items={needsRevisionEvents}
            type="event"
            periods={periods}
            periodsBySection={periodsBySection}
            getSectionName={getSectionName}
            findEvent={findEvent}
            processing={processing}
            onReject={handleReject}
            hasPendingItems={pendingEvents.length > 0}
          />
        )}

        {activeTab === "connections" && ((pendingConnections.length === 0 && needsRevisionConnections.length === 0) ? (
          <div
            role="tabpanel"
            style={{
              textAlign: "center",
              padding: `${SPACING[8]} ${SPACING[5]}`,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
              fontSize: FONT_SIZES.tiny,
            }}
          >
            {readOnly ? "No pending connections right now." : "No pending connections. All caught up!"}
          </div>
        ) : (
          <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
            {pendingConnections.map((conn) => (
              <PendingConnectionCard
                key={conn.id}
                conn={conn}
                periods={periodsBySection[conn.section] || periods}
                getSectionName={getSectionName}
                findEvent={findEvent}
                findConnection={findConnection}
                readOnly={readOnly}
                user={user}
                editingConnId={editingConnId}
                editConnDesc={editConnDesc}
                processing={processing}
                onStartConnEdit={handleStartConnEdit}
                onSaveConnEdit={saveConnEdit}
                onSetEditConnDesc={setEditConnDesc}
                onCancelConnEdit={() => setEditingConnId(null)}
                onApprove={handleApproveConnection}
                onReject={handleRejectConnection}
                onEditPendingConnection={onEditPendingConnection}
                onWithdraw={onWithdraw}
                feedbackId={feedbackId}
                feedbackText={feedbackText}
                feedbackType={feedbackType}
                onFeedbackOpen={handleFeedbackOpen}
                onFeedbackChange={setFeedbackText}
                onFeedbackSubmit={handleRequestRevision}
                onFeedbackCancel={handleFeedbackCancel}
              />
            ))}
          </div>
        ))}

        {/* Awaiting revision connections */}
        {activeTab === "connections" && !readOnly && (
          <AwaitingRevisionSection
            items={needsRevisionConnections}
            type="connection"
            periods={periods}
            periodsBySection={periodsBySection}
            getSectionName={getSectionName}
            findEvent={findEvent}
            processing={processing}
            onReject={handleRejectConnection}
            hasPendingItems={pendingConnections.length > 0}
          />
        )}
      </div>
  );
}
