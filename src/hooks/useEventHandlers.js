import { useCallback } from "react";
import { submitEvent, deleteEvent, updateEvent, resubmitEvent } from "../services/database";
import { saveTimelineRange } from "../services/database";
import { writeToSheet } from "../services/sheets";
import { sendToAutoModerator } from "../services/autoModerator";
import { sendToSimilarityChecker } from "../services/similarityChecker";
import { floorToDecade, ceilToDecade } from "../utils/dateUtils";

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
  autoModeratorEnabled,
  similarityCheckerEnabled,
  periods,
  events,
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
      if (targetSection) {
        saveTimelineRange(targetSection, { start: newStart, end: newEnd });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineStart, timelineEnd, section]);

  const handleAddEvent = useCallback(
    async (formData, options = {}) => {
      const treatAsStudent = isTeacher && options.submitAsPending;
      const eventData = {
        ...formData,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUid: user.uid,
        section: defaultSection,
        ...(isTeacher && !treatAsStudent ? { status: "approved" } : {}),
      };
      const newEventId = await submitEvent(eventData);
      if (isTeacher && !treatAsStudent) {
        writeToSheet(eventData);
        handleEventApproved(eventData);
      } else {
        if (autoModeratorEnabled) {
          sendToAutoModerator(newEventId, eventData, periods);
        }
        if (similarityCheckerEnabled) {
          const sectionEvents = events.filter((e) => e.section === defaultSection);
          sendToSimilarityChecker(newEventId, eventData, sectionEvents);
        }
      }
    },
    [user, isTeacher, userName, defaultSection, handleEventApproved, autoModeratorEnabled, similarityCheckerEnabled, periods, events]
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
      } else if (editingEvent.status === "pending") {
        // Student editing own pending submission: update in-place
        await updateEvent(editingEvent.id, updates);
      } else {
        // Student editing approved event: submit as pending edit proposal
        const editData = {
          ...updates,
          editOf: editingEvent.id,
          addedBy: userName,
          addedByEmail: user.email,
          addedByUid: user.uid,
          section: editingEvent.section || (defaultSection),
        };
        await submitEvent(editData);
      }
    },
    [editingEvent, isTeacher, user, userName, defaultSection, autoModeratorEnabled, similarityCheckerEnabled, periods, events]
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
      if (autoModeratorEnabled) {
        sendToAutoModerator(revisingEvent.id, { ...revisingEvent, ...updates }, periods);
      }
      if (similarityCheckerEnabled) {
        const sectionEvents = events.filter((e) => e.section === revisingEvent.section);
        sendToSimilarityChecker(revisingEvent.id, { ...revisingEvent, ...updates }, sectionEvents);
      }
      setRevisingEvent(null);
    },
    [revisingEvent, setRevisingEvent, autoModeratorEnabled, similarityCheckerEnabled, periods, events]
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
