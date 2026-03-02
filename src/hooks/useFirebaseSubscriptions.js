import { useState, useMemo, useEffect } from "react";
import {
  subscribeToEvents,
  subscribeToEventsForSections,
  subscribeToConnections,
  subscribeToConnectionsForSections,
  subscribeToSections,
  subscribeToAllStudentSections,
  subscribeToPeriods,
  subscribeToAllSectionPeriods,
  subscribeToCompellingQuestion,
  subscribeToTimelineRange,
  subscribeToAllSectionTimelineRanges,
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
  const [allSectionPeriods, setAllSectionPeriods] = useState({});
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

  // Get section IDs for the effective teacher (used for "all" view subscriptions)
  const teacherSectionIds = useMemo(
    () => activeSections.map((s) => s.id),
    [activeSections]
  );

  // Subscribe to Firebase events in real-time
  useEffect(() => {
    if (!user) return;

    const wantsAll = isTeacher && (section === "all" || showAdminView);

    if (wantsAll) {
      // Teacher "all" view: subscribe to events for each of their sections
      const unsub = subscribeToEventsForSections(teacherSectionIds, setAllEvents);
      return () => unsub();
    } else {
      // Single section view
      const unsub = subscribeToEvents(section, setAllEvents);
      return () => unsub();
    }
  }, [user, section, isTeacher, showAdminView, teacherSectionIds]);

  // Subscribe to Firebase connections in real-time
  useEffect(() => {
    if (!user) return;

    const wantsAll = isTeacher && (section === "all" || showAdminView);

    if (wantsAll) {
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
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionPeriods(teacherSectionIds, (periodsMap) => {
        setAllSectionPeriods(periodsMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToPeriods(effectiveSection, (data) => {
        setPeriods(data || []);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, teacherSectionIds]);

  // Subscribe to section-specific compelling question
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      // CQ not displayed for "all" view — no subscription needed
      return;
    } else {
      const unsub = subscribeToCompellingQuestion(effectiveSection, (data) => {
        setCompellingQuestion(data || { text: "", enabled: false });
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, teacherSectionIds]);

  // Subscribe to section-specific timeline range
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionTimelineRanges(teacherSectionIds, (rangeMap) => {
        let minStart = 1910, maxEnd = 2000;
        let hasAny = false;
        for (const sec of Object.keys(rangeMap)) {
          if (rangeMap[sec]) {
            hasAny = true;
            minStart = Math.min(minStart, rangeMap[sec].start);
            maxEnd = Math.max(maxEnd, rangeMap[sec].end);
          }
        }
        if (hasAny) {
          setTimelineStart(minStart);
          setTimelineEnd(maxEnd);
        }
      });
      return () => unsub();
    } else {
      const unsub = subscribeToTimelineRange(effectiveSection, (data) => {
        if (data) {
          setTimelineStart(data.start);
          setTimelineEnd(data.end);
        }
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, teacherSectionIds]);

  // Subscribe to section-specific field config
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      // Field config not needed for "all" view on timeline
      return;
    } else {
      const unsub = subscribeToFieldConfig(effectiveSection, (data) => {
        setFieldConfig(data);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher]);

  return {
    allEvents,
    allConnections,
    sections,
    setSections,
    activeSections,
    periods,
    allSectionPeriods,
    compellingQuestion,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    fieldConfig,
    allStudentAssignments,
  };
}
