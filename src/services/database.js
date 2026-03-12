import {
  ref,
  push,
  set,
  remove,
  update,
  onValue,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "../firebase";

const eventsRef = ref(db, "events");
const connectionsRef = ref(db, "connections");

// ── Teachers ────────────────────────────────────────────────

// Listen to a single teacher record
export function subscribeToTeacherRecord(uid, callback) {
  const teacherRef = ref(db, `teachers/${uid}`);
  return onValue(teacherRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Create a teacher record
export async function createTeacherRecord(uid, data) {
  const teacherRef = ref(db, `teachers/${uid}`);
  await set(teacherRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

// Remove a teacher record (demote)
export async function removeTeacherRecord(uid) {
  const teacherRef = ref(db, `teachers/${uid}`);
  await remove(teacherRef);
}

// Listen to all teacher records (for super admin)
export function subscribeToAllTeachers(callback) {
  const teachersRef = ref(db, "teachers");
  return onValue(teachersRef, (snapshot) => {
    const result = [];
    snapshot.forEach((child) => {
      result.push({ uid: child.key, ...child.val() });
    });
    callback(result);
  });
}

// Update a teacher's join code
export async function updateTeacherJoinCode(uid, joinCode) {
  const teacherRef = ref(db, `teachers/${uid}`);
  await update(teacherRef, { joinCode });
}

// Generate a unique 6-char alphanumeric join code
export function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Look up a teacher by join code (returns teacher data + uid or null)
export async function lookupTeacherByJoinCode(code) {
  const teachersRef = ref(db, "teachers");
  const snapshot = await get(teachersRef);
  if (!snapshot.exists()) return null;
  let found = null;
  snapshot.forEach((child) => {
    if (child.val().joinCode === code.toUpperCase()) {
      found = { uid: child.key, ...child.val() };
    }
  });
  return found;
}

// ── Teacher Invites ─────────────────────────────────────────

// Sanitize email for use as Firebase key (dots → commas)
function sanitizeEmailKey(email) {
  return email.toLowerCase().replace(/\./g, ",");
}

// Create a teacher invite (super admin pre-authorizes an email)
export async function createTeacherInvite(email, invitedBy) {
  const key = sanitizeEmailKey(email);
  const inviteRef = ref(db, `teacherInvites/${key}`);
  await set(inviteRef, {
    email: email.toLowerCase(),
    invitedBy,
    invitedAt: new Date().toISOString(),
  });
}

// Check if an email has a pending teacher invite
export async function checkTeacherInvite(email) {
  const key = sanitizeEmailKey(email);
  const inviteRef = ref(db, `teacherInvites/${key}`);
  const snapshot = await get(inviteRef);
  return snapshot.exists() ? snapshot.val() : null;
}

// Remove a teacher invite (after it's been claimed)
export async function removeTeacherInvite(email) {
  const key = sanitizeEmailKey(email);
  const inviteRef = ref(db, `teacherInvites/${key}`);
  await remove(inviteRef);
}

// Subscribe to all teacher invites (for super admin UI)
export function subscribeToTeacherInvites(callback) {
  const invitesRef = ref(db, "teacherInvites");
  return onValue(invitesRef, (snapshot) => {
    const result = [];
    snapshot.forEach((child) => {
      result.push({ key: child.key, ...child.val() });
    });
    callback(result);
  });
}

// ── Events/Connections for multiple sections ────────────────

// Subscribe to events across multiple specific sections (teacher "all" view)
export function subscribeToEventsForSections(sectionIds, callback) {
  const eventsMap = {};
  const unsubscribes = [];
  for (const secId of sectionIds) {
    const q = query(eventsRef, orderByChild("section"), equalTo(secId));
    const unsub = onValue(q, (snapshot) => {
      const events = [];
      snapshot.forEach((child) => {
        events.push({ id: child.key, ...child.val() });
      });
      eventsMap[secId] = events;
      // Merge all sections into a flat array
      const merged = Object.values(eventsMap).flat();
      callback(merged);
    });
    unsubscribes.push(unsub);
  }
  // If no sections, immediately callback with empty
  if (sectionIds.length === 0) callback([]);
  return () => unsubscribes.forEach((fn) => fn());
}

// Subscribe to connections across multiple specific sections
export function subscribeToConnectionsForSections(sectionIds, callback) {
  const connectionsMap = {};
  const unsubscribes = [];
  for (const secId of sectionIds) {
    const q = query(connectionsRef, orderByChild("section"), equalTo(secId));
    const unsub = onValue(q, (snapshot) => {
      const connections = [];
      snapshot.forEach((child) => {
        connections.push({ id: child.key, ...child.val() });
      });
      connectionsMap[secId] = connections;
      const merged = Object.values(connectionsMap).flat();
      callback(merged);
    });
    unsubscribes.push(unsub);
  }
  if (sectionIds.length === 0) callback([]);
  return () => unsubscribes.forEach((fn) => fn());
}

// Listen to events in real-time, filtered by section
export function subscribeToEvents(section, callback) {
  const q = query(eventsRef, orderByChild("section"), equalTo(section));

  return onValue(q, (snapshot) => {
    const events = [];
    snapshot.forEach((child) => {
      events.push({ id: child.key, ...child.val() });
    });
    callback(events);
  });
}

// Submit a new event (pending by default, can override status)
export async function submitEvent(eventData) {
  const newRef = push(eventsRef);
  await set(newRef, {
    status: "pending",
    ...eventData,
    dateAdded: new Date().toISOString(),
  });
  return newRef.key;
}

// Teacher: approve an event
export async function approveEvent(eventId) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, { status: "approved" });
}

// Teacher: reject an event with feedback
export async function rejectEvent(eventId, feedback) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, {
    status: "rejected",
    rejectionFeedback: feedback,
  });
}

// Student: dismiss a rejected event (removes it)
export async function dismissRejectedEvent(eventId) {
  const eventRef = ref(db, `events/${eventId}`);
  await remove(eventRef);
}

// Teacher: delete any event
export async function deleteEvent(eventId) {
  const eventRef = ref(db, `events/${eventId}`);
  await remove(eventRef);
}

// Teacher: edit event metadata
export async function updateEvent(eventId, updates) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, updates);
}

// Approve an edit proposal: apply changes to original event, remove proposal
export async function approveEdit(editProposalId, originalEventId, updates) {
  const originalRef = ref(db, `events/${originalEventId}`);
  await update(originalRef, updates);
  const proposalRef = ref(db, `events/${editProposalId}`);
  await remove(proposalRef);
}

// ── Connections ─────────────────────────────────────────────

// Listen to connections in real-time, filtered by section
export function subscribeToConnections(section, callback) {
  const q = query(connectionsRef, orderByChild("section"), equalTo(section));

  return onValue(q, (snapshot) => {
    const connections = [];
    snapshot.forEach((child) => {
      connections.push({ id: child.key, ...child.val() });
    });
    callback(connections);
  });
}

// Submit a new connection (pending by default, can override status)
export async function submitConnection(connectionData) {
  const newRef = push(connectionsRef);
  await set(newRef, {
    status: "pending",
    ...connectionData,
    dateAdded: new Date().toISOString(),
  });
  return newRef.key;
}

// Teacher: approve a connection
export async function approveConnection(connectionId) {
  const connRef = ref(db, `connections/${connectionId}`);
  await update(connRef, { status: "approved" });
}

// Teacher: reject a connection with feedback
export async function rejectConnection(connectionId, feedback) {
  const connRef = ref(db, `connections/${connectionId}`);
  await update(connRef, {
    status: "rejected",
    rejectionFeedback: feedback,
  });
}

// Student: dismiss a rejected connection (removes it)
export async function dismissRejectedConnection(connectionId) {
  const connRef = ref(db, `connections/${connectionId}`);
  await remove(connRef);
}

// Teacher: delete any connection
export async function deleteConnection(connectionId) {
  const connRef = ref(db, `connections/${connectionId}`);
  await remove(connRef);
}

// Teacher: edit connection fields
export async function updateConnection(connectionId, updates) {
  const connRef = ref(db, `connections/${connectionId}`);
  await update(connRef, updates);
}

// Approve a connection edit proposal: apply changes to original, remove proposal
export async function approveConnectionEdit(editProposalId, originalConnectionId, updates) {
  const originalRef = ref(db, `connections/${originalConnectionId}`);
  await update(originalRef, updates);
  const proposalRef = ref(db, `connections/${editProposalId}`);
  await remove(proposalRef);
}

// Approve a connection deletion proposal: delete original connection, remove proposal
export async function approveConnectionDeletion(proposalId, originalConnectionId) {
  const originalRef = ref(db, `connections/${originalConnectionId}`);
  await remove(originalRef);
  const proposalRef = ref(db, `connections/${proposalId}`);
  await remove(proposalRef);
}

// ── Revision Feedback ───────────────────────────────────────

// Teacher: request revision on a pending event or connection
export async function requestRevision(itemType, itemId, feedbackText, teacherName, teacherEmail) {
  const itemRef = ref(db, `${itemType}/${itemId}`);
  await update(itemRef, {
    status: "needs_revision",
    feedback: {
      text: feedbackText,
      givenBy: teacherName,
      givenByEmail: teacherEmail,
      date: new Date().toISOString(),
    },
  });
}

// Student: resubmit a revised event (moves feedback to history, sets status back to pending)
export async function resubmitEvent(eventId, updates, currentFeedback, existingHistory) {
  const eventRef = ref(db, `events/${eventId}`);
  const newHistory = [
    ...(existingHistory || []),
    { ...currentFeedback, resolvedAt: new Date().toISOString() },
  ];
  await update(eventRef, {
    ...updates,
    status: "pending",
    feedback: null,
    feedbackHistory: newHistory,
    dateAdded: new Date().toISOString(),
  });
}

// Student: resubmit a revised connection
export async function resubmitConnection(connId, updates, currentFeedback, existingHistory) {
  const connRef = ref(db, `connections/${connId}`);
  const newHistory = [
    ...(existingHistory || []),
    { ...currentFeedback, resolvedAt: new Date().toISOString() },
  ];
  await update(connRef, {
    ...updates,
    status: "pending",
    feedback: null,
    feedbackHistory: newHistory,
    dateAdded: new Date().toISOString(),
  });
}

// ── Auto-Moderator Setting ──────────────────────────────────

// Listen to auto-moderator settings (global visibility + per-teacher enabled)
export function subscribeToAutoModerator(callback) {
  const autoModRef = ref(db, "settings/autoModerator");
  return onValue(autoModRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

// Save global visibility toggle (super admin only)
export async function saveAutoModeratorVisible(visible) {
  const visibleRef = ref(db, "settings/autoModerator/visible");
  await set(visibleRef, visible);
}

// Save per-teacher enabled toggle
export async function saveAutoModeratorEnabled(teacherUid, enabled) {
  const teacherRef = ref(db, `settings/autoModerator/teachers/${teacherUid}`);
  await set(teacherRef, enabled);
}

// Save per-teacher similarity checker enabled toggle
export async function saveSimilarityCheckerEnabled(teacherUid, enabled) {
  const teacherRef = ref(db, `settings/autoModerator/similarityCheckers/${teacherUid}`);
  await set(teacherRef, enabled);
}

// ── Color Palette ───────────────────────────────────────────

// Listen to a section's selected color palette ID
export function subscribeToPaletteId(section, callback) {
  const paletteRef = ref(db, `sectionSettings/${section}/paletteId`);
  return onValue(paletteRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Save palette ID for a section
export async function savePaletteId(section, paletteId) {
  const paletteRef = ref(db, `sectionSettings/${section}/paletteId`);
  await set(paletteRef, paletteId);
}

// ── Periods ─────────────────────────────────────────────────

// Listen to a section's custom periods in real-time
export function subscribeToPeriods(section, callback) {
  const periodsRef = ref(db, `sectionSettings/${section}/periods`);
  return onValue(periodsRef, (snapshot) => {
    const data = snapshot.val();
    callback(Array.isArray(data) ? data.filter(Boolean) : null);
  });
}

// Write full periods array for a section
export async function savePeriods(section, periods) {
  const periodsRef = ref(db, `sectionSettings/${section}/periods`);
  await set(periodsRef, periods);
}

// Listen to default periods template in real-time
export function subscribeToDefaultPeriods(callback) {
  const defaultPeriodsRef = ref(db, "defaultPeriods");
  return onValue(defaultPeriodsRef, (snapshot) => {
    const data = snapshot.val();
    callback(Array.isArray(data) ? data.filter(Boolean) : null);
  });
}

// Write default periods template
export async function saveDefaultPeriods(periods) {
  const defaultPeriodsRef = ref(db, "defaultPeriods");
  await set(defaultPeriodsRef, periods);
}

// Listen to a section's compelling question in real-time
export function subscribeToCompellingQuestion(section, callback) {
  const cqRef = ref(db, `sectionSettings/${section}/compellingQuestion`);
  return onValue(cqRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write compelling question for a section
export async function saveCompellingQuestion(section, data) {
  const cqRef = ref(db, `sectionSettings/${section}/compellingQuestion`);
  await set(cqRef, data);
}

// Listen to default compelling question template in real-time
export function subscribeToDefaultCompellingQuestion(callback) {
  const defaultCQRef = ref(db, "defaultCompellingQuestion");
  return onValue(defaultCQRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write default compelling question template
export async function saveDefaultCompellingQuestion(data) {
  const defaultCQRef = ref(db, "defaultCompellingQuestion");
  await set(defaultCQRef, data);
}

// One-time read of sections
export async function getSections() {
  const snapshot = await get(ref(db, "sections"));
  const data = snapshot.val();
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

// Listen to sections in real-time
export function subscribeToSections(callback) {
  const sectionsRef = ref(db, "sections");
  return onValue(sectionsRef, (snapshot) => {
    const data = snapshot.val();
    callback(Array.isArray(data) ? data.filter(Boolean) : []);
  }, (error) => {
    console.error("Error reading sections:", error);
    callback([]);
  });
}

// Write full sections array
export async function saveSections(sections) {
  const sectionsRef = ref(db, "sections");
  await set(sectionsRef, sections);
}

// Listen to a section's timeline range in real-time
export function subscribeToTimelineRange(section, callback) {
  const rangeRef = ref(db, `sectionSettings/${section}/timelineRange`);
  return onValue(rangeRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write timeline range for a section
export async function saveTimelineRange(section, range) {
  const rangeRef = ref(db, `sectionSettings/${section}/timelineRange`);
  await set(rangeRef, range);
}

// Listen to default timeline range template in real-time
export function subscribeToDefaultTimelineRange(callback) {
  const defaultRangeRef = ref(db, "defaultTimelineRange");
  return onValue(defaultRangeRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write default timeline range template
export async function saveDefaultTimelineRange(range) {
  const defaultRangeRef = ref(db, "defaultTimelineRange");
  await set(defaultRangeRef, range);
}

// Listen to a section's field config in real-time
export function subscribeToFieldConfig(section, callback) {
  const configRef = ref(db, `sectionSettings/${section}/fieldConfig`);
  return onValue(configRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write field config for a section
export async function saveFieldConfig(section, config) {
  const configRef = ref(db, `sectionSettings/${section}/fieldConfig`);
  await set(configRef, config);
}

// Listen to default field config template in real-time
export function subscribeToDefaultFieldConfig(callback) {
  const defaultConfigRef = ref(db, "defaultFieldConfig");
  return onValue(defaultConfigRef, (snapshot) => {
    callback(snapshot.val() || null);
  });
}

// Write default field config template
export async function saveDefaultFieldConfig(config) {
  const defaultConfigRef = ref(db, "defaultFieldConfig");
  await set(defaultConfigRef, config);
}

// ── Migration ───────────────────────────────────────────────

// One-time migration: stamp existing sections and student assignments with teacherUid
export async function migrateDataToTeacher(teacherUid) {
  // Stamp sections
  const sectionsRef = ref(db, "sections");
  const sectionsSnap = await get(sectionsRef);
  if (sectionsSnap.exists()) {
    const sections = sectionsSnap.val();
    if (Array.isArray(sections)) {
      const updated = sections.filter(Boolean).map((s) =>
        s.teacherUid ? s : { ...s, teacherUid: teacherUid }
      );
      await set(sectionsRef, updated);
    }
  }

  // Stamp student assignments
  const studentsRef = ref(db, "studentSections");
  const studentsSnap = await get(studentsRef);
  if (studentsSnap.exists()) {
    const updates = {};
    studentsSnap.forEach((child) => {
      const data = child.val();
      if (!data.teacherUid) {
        updates[`${child.key}/teacherUid`] = teacherUid;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(studentsRef, updates);
    }
  }
}

// One-time seed: push seed events into Firebase
export async function seedDatabase(seedEvents) {
  for (const event of seedEvents) {
    const newRef = push(eventsRef);
    await set(newRef, event);
  }
}

// Seed a section with full demo data (events, connections, and settings).
// Returns { events: number, connections: number } counts.
export async function seedDemoData(section) {
  const {
    DEMO_EVENTS,
    DEMO_CONNECTIONS,
    DEMO_PERIODS,
    DEMO_COMPELLING_QUESTION,
    DEMO_TIMELINE_RANGE,
  } = await import("../data/seedEvents");
  const { DEFAULT_FIELD_CONFIG } = await import("../data/constants");

  const now = new Date().toISOString();
  const localIdToFirebaseId = {};

  // 1. Push events (strip _localId, inject section + dateAdded)
  for (const event of DEMO_EVENTS) {
    const { _localId, ...eventData } = event;
    const newRef = push(eventsRef);
    await set(newRef, { ...eventData, section, dateAdded: now });
    if (_localId) localIdToFirebaseId[_localId] = newRef.key;
  }

  // 2. Push connections (resolve local IDs → Firebase IDs)
  let connCount = 0;
  for (const conn of DEMO_CONNECTIONS) {
    const { _causeLocalId, _effectLocalId, ...connData } = conn;
    const causeEventId = localIdToFirebaseId[_causeLocalId];
    const effectEventId = localIdToFirebaseId[_effectLocalId];
    if (causeEventId && effectEventId) {
      const newRef = push(connectionsRef);
      await set(newRef, {
        ...connData,
        causeEventId,
        effectEventId,
        section,
        dateAdded: now,
      });
      connCount++;
    }
  }

  // 3. Save section settings (periods, compelling question, timeline range, field config)
  await Promise.all([
    set(ref(db, `sectionSettings/${section}/periods`), DEMO_PERIODS),
    set(ref(db, `sectionSettings/${section}/compellingQuestion`), DEMO_COMPELLING_QUESTION),
    set(ref(db, `sectionSettings/${section}/timelineRange`), DEMO_TIMELINE_RANGE),
    set(ref(db, `sectionSettings/${section}/fieldConfig`), DEFAULT_FIELD_CONFIG),
  ]);

  return { events: DEMO_EVENTS.length, connections: connCount };
}

// Wipe all events and connections for a given section.
// Returns { events: number, connections: number } counts.
export async function wipeSectionData(section) {
  // Query and delete events
  const eventsQuery = query(eventsRef, orderByChild("section"), equalTo(section));
  const eventsSnap = await get(eventsQuery);
  let eventCount = 0;
  const eventDeletes = [];
  eventsSnap.forEach((child) => {
    eventDeletes.push(remove(ref(db, `events/${child.key}`)));
    eventCount++;
  });
  await Promise.all(eventDeletes);

  // Query and delete connections
  const connsQuery = query(connectionsRef, orderByChild("section"), equalTo(section));
  const connsSnap = await get(connsQuery);
  let connCount = 0;
  const connDeletes = [];
  connsSnap.forEach((child) => {
    connDeletes.push(remove(ref(db, `connections/${child.key}`)));
    connCount++;
  });
  await Promise.all(connDeletes);

  return { events: eventCount, connections: connCount };
}

// Listen to a student's section assignment in real-time
export function subscribeToStudentSection(uid, callback) {
  const studentRef = ref(db, `studentSections/${uid}`);
  return onValue(studentRef, (snapshot) => {
    callback(snapshot.val() || null);
  }, (error) => {
    console.error("Error reading student section:", error);
    callback(null);
  });
}

// Student self-selects their section on first login
export async function assignStudentSection(uid, sectionId, teacherUid, email, displayName) {
  const studentRef = ref(db, `studentSections/${uid}`);
  await set(studentRef, {
    section: sectionId,
    teacherUid: teacherUid || null,
    email,
    displayName,
    assignedAt: new Date().toISOString(),
    assignedBy: "self",
  });
}

// Teacher reassigns a student to a different section
export async function reassignStudentSection(uid, newSectionId) {
  const studentRef = ref(db, `studentSections/${uid}`);
  await update(studentRef, {
    section: newSectionId,
    assignedAt: new Date().toISOString(),
    assignedBy: "teacher",
  });
}

// Teacher removes a student's section assignment
export async function removeStudentSection(uid) {
  const studentRef = ref(db, `studentSections/${uid}`);
  await remove(studentRef);
}

// Listen to all student section assignments (teacher roster view)
export function subscribeToAllStudentSections(callback) {
  const allRef = ref(db, "studentSections");
  return onValue(allRef, (snapshot) => {
    const result = [];
    snapshot.forEach((child) => {
      result.push({ uid: child.key, ...child.val() });
    });
    callback(result);
  }, (error) => {
    console.error("Error reading student sections:", error);
    callback([]);
  });
}

// ── Bounties ────────────────────────────────────────────────

const bountiesRef = ref(db, "bounties");

// Listen to bounties for a single section
export function subscribeToBounties(section, callback) {
  const q = query(bountiesRef, orderByChild("section"), equalTo(section));
  return onValue(q, (snapshot) => {
    const bounties = [];
    snapshot.forEach((child) => {
      bounties.push({ id: child.key, ...child.val() });
    });
    callback(bounties);
  });
}

// Listen to bounties across multiple sections (admin view)
export function subscribeToBountiesForSections(sectionIds, callback) {
  const bountiesMap = {};
  const unsubscribes = [];
  for (const secId of sectionIds) {
    const q = query(bountiesRef, orderByChild("section"), equalTo(secId));
    const unsub = onValue(q, (snapshot) => {
      const bounties = [];
      snapshot.forEach((child) => {
        bounties.push({ id: child.key, ...child.val() });
      });
      bountiesMap[secId] = bounties;
      const merged = Object.values(bountiesMap).flat();
      callback(merged);
    });
    unsubscribes.push(unsub);
  }
  if (sectionIds.length === 0) callback([]);
  return () => unsubscribes.forEach((fn) => fn());
}

// Create a new bounty
export async function createBounty(bountyData) {
  const newRef = push(bountiesRef);
  await set(newRef, {
    ...bountyData,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  return newRef.key;
}

// Update a bounty
export async function updateBounty(bountyId, updates) {
  const bountyRef = ref(db, `bounties/${bountyId}`);
  await update(bountyRef, updates);
}

// Delete a bounty
export async function deleteBounty(bountyId) {
  const bountyRef = ref(db, `bounties/${bountyId}`);
  await remove(bountyRef);
}

// Mark a bounty as completed (called when teacher approves a bounty submission)
export async function completeBounty(bountyId, studentName, studentUid) {
  const bountyRef = ref(db, `bounties/${bountyId}`);
  await update(bountyRef, {
    status: "completed",
    completedBy: studentName,
    completedByUid: studentUid,
    completedAt: new Date().toISOString(),
  });
}

// ── Easter Egg Discoveries ──────────────────────────────────

export async function linkEasterEgg(eventId, eggId, visibility, teacherName) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, {
    easterEgg: {
      eggId,
      visibility,
      linkedBy: teacherName,
      linkedAt: new Date().toISOString(),
    },
  });
}

export async function unlinkEasterEgg(eventId) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, { easterEgg: null });
}

export async function recordEasterEggDiscovery(eventId, eggId, uid, displayName, email, section) {
  const discoveryRef = ref(db, `easterEggDiscoveries/${eventId}/${uid}`);
  await set(discoveryRef, {
    eggId,
    discoveredBy: displayName,
    discoveredByEmail: email,
    discoveredAt: new Date().toISOString(),
    section,
  });
}

export function subscribeToEasterEggDiscoveries(section, callback) {
  const discoveriesRef = ref(db, "easterEggDiscoveries");
  return onValue(discoveriesRef, (snapshot) => {
    const discoveries = [];
    snapshot.forEach((eventChild) => {
      eventChild.forEach((userChild) => {
        const data = userChild.val();
        if (data.section === section) {
          discoveries.push({
            eventId: eventChild.key,
            uid: userChild.key,
            ...data,
          });
        }
      });
    });
    callback(discoveries);
  });
}

export async function hasDiscoveredEasterEgg(eventId, uid) {
  const discoveryRef = ref(db, `easterEggDiscoveries/${eventId}/${uid}`);
  const snapshot = await get(discoveryRef);
  return snapshot.exists();
}
