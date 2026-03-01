import { useState, useMemo, useEffect } from "react";
import {
  subscribeToEvents,
  subscribeToConnections,
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

  const activeSections = useMemo(() => sections || [], [sections]);

  // Subscribe to Firebase events in real-time
  useEffect(() => {
    if (!user) return;

    // Teacher with ?section=all or admin view open sees everything; students see their section
    const listenSection = isTeacher && (section === "all" || showAdminView) ? "all" : section;

    const unsubscribe = subscribeToEvents(listenSection, (events) => {
      setAllEvents(events);
    });

    return () => unsubscribe();
  }, [user, section, isTeacher, showAdminView]);

  // Subscribe to Firebase connections in real-time
  useEffect(() => {
    if (!user) return;
    const listenSection = isTeacher && (section === "all" || showAdminView) ? "all" : section;
    const unsubscribe = subscribeToConnections(listenSection, (connections) => {
      setAllConnections(connections);
    });
    return () => unsubscribe();
  }, [user, section, isTeacher, showAdminView]);

  // Subscribe to sections from Firebase
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSections((data) => {
      setSections(data || []);
    });
    return () => unsub();
  }, [user]);

  // Subscribe to all student assignments (teacher roster)
  useEffect(() => {
    if (!user || !isTeacher) return;
    const unsub = subscribeToAllStudentSections((assignments) => {
      setAllStudentAssignments(assignments);
    });
    return () => unsub();
  }, [user, isTeacher]);

  // Subscribe to section-specific periods
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionPeriods(activeSections.map((s) => s.id), (periodsMap) => {
        setAllSectionPeriods(periodsMap);
      });
      return () => unsub();
    } else {
      const unsub = subscribeToPeriods(effectiveSection, (data) => {
        setPeriods(data || []);
      });
      return () => unsub();
    }
  }, [user, section, isTeacher, activeSections]);

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
  }, [user, section, isTeacher, activeSections]);

  // Subscribe to section-specific timeline range
  useEffect(() => {
    if (!user) return;
    const effectiveSection = isTeacher && section === "all" ? "all" : section;
    if (effectiveSection === "all") {
      const unsub = subscribeToAllSectionTimelineRanges(activeSections.map((s) => s.id), (rangeMap) => {
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
  }, [user, section, isTeacher, activeSections]);

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
