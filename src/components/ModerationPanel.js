import { useState } from "react";
import { approveEvent, rejectEvent, updateEvent, approveEdit, approveConnection, rejectConnection, updateConnection, approveConnectionEdit, approveConnectionDeletion, requestRevision } from "../services/database";
import { writeToSheet } from "../services/sheets";
import { sendToAutoModerator } from "../services/autoModerator";
import { sendToSimilarityChecker } from "../services/similarityChecker";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import PendingEventCard from "./PendingEventCard";
import PendingConnectionCard from "./PendingConnectionCard";
import AwaitingRevisionSection from "./AwaitingRevisionSection";

export default function ModerationPanel({ pendingEvents, pendingConnections = [], needsRevisionEvents = [], needsRevisionConnections = [], allEvents = [], allConnections = [], periods = [], periodsBySection = {}, getSectionName = (id) => id, onEventApproved, readOnly = false, user, userName, onEditPendingEvent, onEditPendingConnection, onWithdraw, autoModeratorEnabled = false, autoModeratorVisible = false, similarityCheckerEnabled = false, isSuperAdmin = false, teacherUid, onBountyApproval, bounties = [] }) {
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
  const [feedbackMode, setFeedbackMode] = useState(null); // "revision" or "rejection"
  const [autoModSending, setAutoModSending] = useState(false);

  const unreviewedEvents = pendingEvents.filter((e) =>
    !e.editOf && ((autoModeratorEnabled && !e.aiReview) || (similarityCheckerEnabled && !e.similarityReport))
  );

  const handleBatchAutoMod = async () => {
    if (unreviewedEvents.length === 0 || autoModSending) return;
    setAutoModSending(true);
    try {
      const promises = [];
      for (const event of unreviewedEvents) {
        if (autoModeratorEnabled && !event.aiReview) {
          const sectionPeriods = periodsBySection[event.section] || periods;
          promises.push(sendToAutoModerator(event.id, event, sectionPeriods));
        }
        if (similarityCheckerEnabled && !event.similarityReport) {
          const sectionEvents = allEvents.filter((e) => e.section === event.section);
          promises.push(sendToSimilarityChecker(event.id, event, sectionEvents));
        }
      }
      await Promise.all(promises);
    } catch (err) {
      console.error("Batch AI review failed:", err);
    }
    setAutoModSending(false);
  };

  const handleApprove = async (event) => {
    setProcessing(event.id);
    try {
      if (event.editOf) {
        // Edit proposal: apply changes to original event, remove proposal
        const original = findEvent(event.editOf);
        const { editOf, addedBy, addedByEmail, addedByUid, status, dateAdded, id, section, editRationale, ...edits } = event;
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
        // Complete bounty if this was a bounty submission
        if (event.bountyId && onBountyApproval) {
          onBountyApproval(event.bountyId, event.addedBy, event.addedByUid);
        }
      }
    } catch (err) {
      console.error("Approve failed:", err);
    }
    setProcessing(null);
  };

  const handleReject = (eventId) => {
    setFeedbackId(eventId);
    setFeedbackType("event");
    setFeedbackMode("rejection");
    setFeedbackText("");
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title || "",
      year: event.year,
      month: event.month || "",
      day: event.day || "",
      endYear: event.endYear || "",
      endMonth: event.endMonth || "",
      endDay: event.endDay || "",
      period: event.period || "",
      tags: [...(event.tags || [])],
      sourceType: event.sourceType || "Primary",
      description: event.description || "",
      sourceNote: event.sourceNote || "",
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
        const { editOf, addedBy, addedByEmail, addedByUid, status, dateAdded, id, section, editHistory: _, editRationale, ...edits } = conn;
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
        // Complete bounty if this was a bounty submission
        if (conn.bountyId && onBountyApproval) {
          onBountyApproval(conn.bountyId, conn.addedBy, conn.addedByUid);
        }
      }
    } catch (err) {
      console.error("Approve connection failed:", err);
    }
    setProcessing(null);
  };

  const handleRejectConnection = (connId) => {
    setFeedbackId(connId);
    setFeedbackType("connection");
    setFeedbackMode("rejection");
    setFeedbackText("");
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

  const handleFeedbackSubmit = async (itemType, itemId) => {
    if (!feedbackText.trim()) return;
    setProcessing(itemId);
    try {
      if (feedbackMode === "rejection") {
        const feedback = {
          text: feedbackText.trim(),
          givenBy: userName,
          givenByEmail: user?.email,
          date: new Date().toISOString(),
        };
        if (itemType === "event") {
          await rejectEvent(itemId, feedback);
        } else {
          await rejectConnection(itemId, feedback);
        }
      } else {
        await requestRevision(
          itemType === "event" ? "events" : "connections",
          itemId,
          feedbackText.trim(),
          userName,
          user?.email
        );
      }
      setFeedbackId(null);
      setFeedbackText("");
      setFeedbackType(null);
      setFeedbackMode(null);
    } catch (err) {
      console.error(feedbackMode === "rejection" ? "Reject failed:" : "Request revision failed:", err);
    }
    setProcessing(null);
  };

  const findEvent = (id) => allEvents.find((e) => e.id === id);
  const findConnection = (id) => allConnections.find((c) => c.id === id);

  const handleFeedbackOpen = (id, type) => {
    setFeedbackId(id);
    setFeedbackType(type);
    setFeedbackMode("revision");
    setFeedbackText("");
  };

  const handleFeedbackCancel = () => {
    setFeedbackId(null);
    setFeedbackText("");
    setFeedbackType(null);
    setFeedbackMode(null);
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
          {!readOnly && (isSuperAdmin || (autoModeratorVisible && (autoModeratorEnabled || similarityCheckerEnabled))) && unreviewedEvents.length > 0 && (
            <button
              onClick={handleBatchAutoMod}
              disabled={autoModSending}
              style={{
                padding: `${SPACING[2]} ${SPACING[4]}`,
                background: autoModSending ? theme.accent + "99" : theme.accent,
                color: "#fff",
                border: "none",
                borderRadius: RADII.sm,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                cursor: autoModSending ? "default" : "pointer",
                opacity: autoModSending ? 0.85 : 1,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {autoModSending
                ? "Sending…"
                : `AI Review ${unreviewedEvents.length} unreviewed`}
            </button>
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
                onFeedbackSubmit={handleFeedbackSubmit}
                onFeedbackCancel={handleFeedbackCancel}
                feedbackMode={feedbackMode}
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
            feedbackId={feedbackId}
            feedbackText={feedbackText}
            feedbackMode={feedbackMode}
            onFeedbackChange={setFeedbackText}
            onFeedbackSubmit={handleFeedbackSubmit}
            onFeedbackCancel={handleFeedbackCancel}
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
                onFeedbackSubmit={handleFeedbackSubmit}
                onFeedbackCancel={handleFeedbackCancel}
                feedbackMode={feedbackMode}
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
            feedbackId={feedbackId}
            feedbackText={feedbackText}
            feedbackMode={feedbackMode}
            onFeedbackChange={setFeedbackText}
            onFeedbackSubmit={handleFeedbackSubmit}
            onFeedbackCancel={handleFeedbackCancel}
          />
        )}
      </div>
  );
}
