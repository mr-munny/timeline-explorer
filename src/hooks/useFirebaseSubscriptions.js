import { useState, useMemo, useEffect } from "react";
import {
  subscribeToEvents,
  subscribeToEventsForSections,
  subscribeToConnections,
  subscribeToConnectionsForSections,
  subscribeToSections,
  subscribeToAllStudentSections,
  subscribeToPeriods,
  subscribeToCompellingQuestion,
  subscribeToTimelineRange,
  subscribeToFieldConfig,
} from "../services/database";

export default function useFirebaseSubscriptions({
  user,
  isTeacher,
  section,
  showAdminView,
  effectiveTeacherUid,
}) {
  const [allEvents, setAllEvents] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [sections, setSections] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [compellingQuestion, setCompellingQuestion] = useState({ text: "", enabled: false });
  const [timelineStart, setTimelineStart] = useState(1910);
  const [timelineEnd, setTimelineEnd] = useState(2000);
  const [fieldConfig, setFieldConfig] = useState(null);
  const [allStudentAssignments, setAllStudentAssignments] = useState([]);

  // Filter sections by teacher ownership (client-side)
  const activeSections = useMemo(() => {
    const all = sections || [];
    if (!effectiveTeacherUid) return all;
    // Show only sections owned by the effective teacher
    // Sections without teacherUid are legacy (pre-migration) — show them for the super admin bootstrap
    return all.filter((s) => s.teacherUid === effectiveTeacherUid || !s.teacherUid);
  }, [sections, effectiveTeacherUid]);

  // Get section IDs for the effective teacher (used for admin view subscriptions)
  const teacherSectionIds = useMemo(
    () => activeSections.map((s) => s.id),
    [activeSections]
  );

  // Subscribe to Firebase events in real-time
  useEffect(() => {
    if (!user) return;

    if (isTeacher && showAdminView) {
      // Admin view: subscribe to events for each of their sections
      const unsub = subscribeToEventsForSections(teacherSectionIds, setAllEvents);
      return () => unsub();
    } else {
      const unsub = subscribeToEvents(section, setAllEvents);
      return () => unsub();
    }
  }, [user, section, isTeacher, showAdminView, teacherSectionIds]);

  // Subscribe to Firebase connections in real-time
  useEffect(() => {
    if (!user) return;

    if (isTeacher && showAdminView) {
      const unsub = subscribeToConnectionsForSections(teacherSectionIds, setAllConnections);
      return () => unsub();
    } else {
      const unsub = subscribeToConnections(section, setAllConnections);
      return () => unsub();
    }
  }, [user, section, isTeacher, showAdminView, teacherSectionIds]);

  // Subscribe to sections from Firebase
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSections((data) => {
      setSections(data || []);
    });
    return () => unsub();
  }, [user]);

  // Subscribe to all student assignments (teacher roster) — filtered to teacher's students
  useEffect(() => {
    if (!user || !isTeacher) return;
    const unsub = subscribeToAllStudentSections((assignments) => {
      // Filter to only students belonging to this teacher
      if (effectiveTeacherUid) {
        setAllStudentAssignments(
          assignments.filter((a) => a.teacherUid === effectiveTeacherUid || !a.teacherUid)
        );
      } else {
        setAllStudentAssignments(assignments);
      }
    });
    return () => unsub();
  }, [user, isTeacher, effectiveTeacherUid]);

  // Subscribe to section-specific periods
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToPeriods(section, (data) => {
      setPeriods(data || []);
    });
    return () => unsub();
  }, [user, section]);

  // Subscribe to section-specific compelling question
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCompellingQuestion(section, (data) => {
      setCompellingQuestion(data || { text: "", enabled: false });
    });
    return () => unsub();
  }, [user, section]);

  // Subscribe to section-specific timeline range
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTimelineRange(section, (data) => {
      if (data) {
        setTimelineStart(data.start);
        setTimelineEnd(data.end);
      }
    });
    return () => unsub();
  }, [user, section]);

  // Subscribe to section-specific field config
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFieldConfig(section, (data) => {
      setFieldConfig(data);
    });
    return () => unsub();
  }, [user, section]);

  return {
    allEvents,
    allConnections,
    sections,
    setSections,
    activeSections,
    periods,
    compellingQuestion,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    fieldConfig,
    allStudentAssignments,
  };
}
