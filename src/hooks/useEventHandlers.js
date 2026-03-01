import { useCallback } from "react";
import { submitEvent, deleteEvent, updateEvent, resubmitEvent } from "../services/database";
import { saveTimelineRange } from "../services/database";
import { writeToSheet } from "../services/sheets";

const floorToDecade = (value) => Math.floor(value / 10) * 10;
const ceilToDecade = (value) => Math.ceil(value / 10) * 10;

export default function useEventHandlers({
  user,
  userName,
  isTeacher,
  defaultSection,
  section,
  timelineStart,
  setTimelineStart,
  timelineEnd,
  setTimelineEnd,
  editingEvent,
  setEditingEvent,
  revisingEvent,
  setRevisingEvent,
}) {
  // Auto-expand timeline range when event outside range is approved
  const handleEventApproved = useCallback((event) => {
    const year = Number(event.year);
    if (isNaN(year)) return;
    const endYear = event.endYear ? Number(event.endYear) : null;
    let newStart = timelineStart;
    let newEnd = timelineEnd;
    let changed = false;
    if (year < timelineStart) {
      newStart = floorToDecade(year);
      changed = true;
    }
    const maxYear = endYear && !isNaN(endYear) ? Math.max(year, endYear) : year;
    if (maxYear > timelineEnd) {
      newEnd = ceilToDecade(maxYear);
      changed = true;
    }
    if (changed) {
      setTimelineStart(newStart);
      setTimelineEnd(newEnd);
      // Persist to the event's section (or current section)
      const targetSection = event.section || section;
      if (targetSection && targetSection !== "all") {
        saveTimelineRange(targetSection, { start: newStart, end: newEnd });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineStart, timelineEnd, section]);

  const handleAddEvent = useCallback(
    async (formData) => {
      const eventData = {
        ...formData,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: defaultSection,
        ...(isTeacher ? { status: "approved" } : {}),
      };
      await submitEvent(eventData);
      if (isTeacher) {
        writeToSheet(eventData);
        handleEventApproved(eventData);
      }
    },
    [user, isTeacher, userName, defaultSection, handleEventApproved]
  );

  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      await deleteEvent(eventId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
  }, [setEditingEvent]);

  const handleSaveEdit = useCallback(
    async (formData) => {
      const updates = {
        ...formData,
        year: parseInt(formData.year),
        month: formData.month ? parseInt(formData.month) : null,
        day: formData.day ? parseInt(formData.day) : null,
        endYear: formData.endYear ? parseInt(formData.endYear) : null,
        endMonth: formData.endMonth ? parseInt(formData.endMonth) : null,
        endDay: formData.endDay ? parseInt(formData.endDay) : null,
      };
      // Compute which fields changed for edit history
      const changeFields = ["title", "year", "month", "day", "endYear", "endMonth", "endDay", "period", "tags", "sourceType", "description", "sourceNote", "sourceUrl", "imageUrl", "region"];
      const changes = {};
      for (const key of changeFields) {
        const oldVal = editingEvent[key];
        const newVal = updates[key] !== undefined ? updates[key] : oldVal;
        const isEqual = key === "tags" ? JSON.stringify(oldVal) === JSON.stringify(newVal) : String(oldVal ?? "") === String(newVal ?? "");
        if (!isEqual) changes[key] = { from: oldVal ?? null, to: newVal ?? null };
      }
      if (isTeacher) {
        // Teacher: apply edit directly, append to edit history
        const existingHistory = editingEvent.editHistory || [];
        await updateEvent(editingEvent.id, {
          ...updates,
          editHistory: [...existingHistory, {
            name: userName,
            email: user.email,
            date: new Date().toISOString(),
            changes,
          }],
        });
      } else {
        // Student: submit as pending edit proposal
        await submitEvent({
          ...updates,
          editOf: editingEvent.id,
          addedBy: userName,
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingEvent.section || (defaultSection),
        });
      }
    },
    [editingEvent, isTeacher, user, userName, defaultSection]
  );

  const handleRevisionResubmit = useCallback(
    async (formData) => {
      if (!revisingEvent) return;
      const updates = {
        ...formData,
        year: parseInt(formData.year),
        month: formData.month ? parseInt(formData.month) : null,
        day: formData.day ? parseInt(formData.day) : null,
        endYear: formData.endYear ? parseInt(formData.endYear) : null,
        endMonth: formData.endMonth ? parseInt(formData.endMonth) : null,
        endDay: formData.endDay ? parseInt(formData.endDay) : null,
      };
      await resubmitEvent(
        revisingEvent.id,
        updates,
        revisingEvent.feedback,
        revisingEvent.feedbackHistory || []
      );
      setRevisingEvent(null);
    },
    [revisingEvent, setRevisingEvent]
  );

  return {
    handleEventApproved,
    handleAddEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveEdit,
    handleRevisionResubmit,
  };
}
