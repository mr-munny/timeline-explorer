import { useCallback } from "react";
import { submitConnection, deleteConnection, updateConnection, resubmitConnection } from "../services/database";

export default function useConnectionHandlers({
  user,
  userName,
  isTeacher,
  defaultSection,
  editingConnection,
  setEditingConnection,
  setExpandedEvent,
  revisingConnection,
  setRevisingConnection,
}) {
  const handleAddConnection = useCallback(
    async (formData) => {
      await submitConnection({
        ...formData,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: defaultSection,
        ...(isTeacher ? { status: "approved" } : {}),
      });
    },
    [user, isTeacher, userName, defaultSection]
  );

  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      await deleteConnection(connectionId);
    } catch (err) {
      console.error("Delete connection failed:", err);
    }
  }, []);

  const handleSuggestDeleteConnection = useCallback(async (connection) => {
    if (!window.confirm("Suggest this connection be deleted? A teacher will review your request.")) return;
    try {
      await submitConnection({
        deleteOf: connection.id,
        causeEventId: connection.causeEventId,
        effectEventId: connection.effectEventId,
        description: connection.description,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: connection.section || (defaultSection),
      });
    } catch (err) {
      console.error("Suggest delete connection failed:", err);
    }
  }, [user, userName, defaultSection]);

  const handleEditConnection = useCallback((connection) => {
    setEditingConnection(connection);
  }, [setEditingConnection]);

  const handleSaveConnectionEdit = useCallback(
    async (formData) => {
      const changeFields = ["description", "causeEventId", "effectEventId"];
      const changes = {};
      for (const key of changeFields) {
        const oldVal = editingConnection[key];
        const newVal = formData[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          changes[key] = { from: oldVal ?? null, to: newVal ?? null };
        }
      }
      if (isTeacher) {
        const existingHistory = editingConnection.editHistory || [];
        await updateConnection(editingConnection.id, {
          ...formData,
          editHistory: [...existingHistory, {
            name: userName,
            email: user.email,
            date: new Date().toISOString(),
            changes,
          }],
        });
      } else if (editingConnection.status === "pending") {
        // Student editing own pending submission: update in-place
        await updateConnection(editingConnection.id, formData);
      } else {
        await submitConnection({
          ...formData,
          editOf: editingConnection.id,
          addedBy: userName,
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingConnection.section || (defaultSection),
        });
      }
    },
    [editingConnection, isTeacher, user, userName, defaultSection]
  );

  const handleScrollToEvent = useCallback((eventId) => {
    setExpandedEvent(eventId);
    setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${eventId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [setExpandedEvent]);

  const handleConnectionRevisionResubmit = useCallback(
    async (formData) => {
      if (!revisingConnection) return;
      await resubmitConnection(
        revisingConnection.id,
        formData,
        revisingConnection.feedback,
        revisingConnection.feedbackHistory || []
      );
      setRevisingConnection(null);
    },
    [revisingConnection, setRevisingConnection]
  );

  return {
    handleAddConnection,
    handleDeleteConnection,
    handleSuggestDeleteConnection,
    handleEditConnection,
    handleSaveConnectionEdit,
    handleScrollToEvent,
    handleConnectionRevisionResubmit,
  };
}
