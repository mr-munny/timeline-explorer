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
  subscribeToAutoModerator,
  subscribeToEasterEggDiscoveries,
  subscribeToBounties,
  subscribeToBountiesForSections,
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
  const [periodsBySection, setPeriodsBySection] = useState({});
  const [compellingQuestion, setCompellingQuestion] = useState({ text: "", enabled: false });
  const [timelineStart, setTimelineStart] = useState(1910);
  const [timelineEnd, setTimelineEnd] = useState(2000);
  const [fieldConfig, setFieldConfig] = useState(null);
  const [allStudentAssignments, setAllStudentAssignments] = useState([]);
  const [autoModeratorEnabled, setAutoModeratorEnabled] = useState(false);
  const [autoModeratorVisible, setAutoModeratorVisible] = useState(false);
  const [similarityCheckerEnabled, setSimilarityCheckerEnabled] = useState(false);
  const [easterEggDiscoveries, setEasterEggDiscoveries] = useState([]);
  const [bounties, setBounties] = useState([]);

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

  // Subscribe to periods for ALL teacher sections (admin view moderation)
  useEffect(() => {
    if (!user || !isTeacher || !showAdminView || teacherSectionIds.length === 0) {
      setPeriodsBySection({});
      return;
    }
    const unsubs = teacherSectionIds.map((sId) =>
      subscribeToPeriods(sId, (data) => {
        setPeriodsBySection((prev) => ({ ...prev, [sId]: data || [] }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [user, isTeacher, showAdminView, teacherSectionIds]);

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

  // Resolve the relevant teacher UID for auto-moderator:
  // - Teachers: their own UID (or impersonated teacher's UID)
  // - Students: the teacherUid from their assigned section
  const autoModTeacherUid = useMemo(() => {
    if (effectiveTeacherUid) return effectiveTeacherUid;
    const sec = (sections || []).find((s) => s.id === section);
    return sec?.teacherUid || null;
  }, [effectiveTeacherUid, sections, section]);

  // Subscribe to auto-moderator settings (global visibility + per-teacher enabled)
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAutoModerator((data) => {
      setAutoModeratorVisible(data?.visible || false);
      setAutoModeratorEnabled(
        autoModTeacherUid ? !!(data?.teachers?.[autoModTeacherUid]) : false
      );
      setSimilarityCheckerEnabled(
        autoModTeacherUid ? !!(data?.similarityCheckers?.[autoModTeacherUid]) : false
      );
    });
    return () => unsub();
  }, [user, autoModTeacherUid]);

  // Subscribe to Easter egg discoveries for current section
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEasterEggDiscoveries(section, setEasterEggDiscoveries);
    return () => unsub();
  }, [user, section]);

  // Subscribe to bounties (per-section for students, multi-section for admin)
  useEffect(() => {
    if (!user) return;
    if (isTeacher && showAdminView) {
      const unsub = subscribeToBountiesForSections(teacherSectionIds, setBounties);
      return () => unsub();
    } else {
      const unsub = subscribeToBounties(section, setBounties);
      return () => unsub();
    }
  }, [user, section, isTeacher, showAdminView, teacherSectionIds]);

  return {
    allEvents,
    allConnections,
    sections,
    setSections,
    activeSections,
    periods,
    periodsBySection,
    compellingQuestion,
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    fieldConfig,
    allStudentAssignments,
    autoModeratorEnabled,
    autoModeratorVisible,
    similarityCheckerEnabled,
    easterEggDiscoveries,
    bounties,
  };
}
