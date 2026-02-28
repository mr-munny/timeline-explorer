import {
  ref,
  push,
  set,
  remove,
  update,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "../firebase";

const eventsRef = ref(db, "events");
const connectionsRef = ref(db, "connections");

// Listen to events in real-time, filtered by section
export function subscribeToEvents(section, callback) {
  // If section is "all" (teacher view), listen to all events
  const q =
    section === "all"
      ? eventsRef
      : query(eventsRef, orderByChild("section"), equalTo(section));

  return onValue(q, (snapshot) => {
    const events = [];
    snapshot.forEach((child) => {
      events.push({ id: child.key, ...child.val() });
    });
    callback(events);
  });
}

// Submit a new event (always pending)
export async function submitEvent(eventData) {
  const newRef = push(eventsRef);
  await set(newRef, {
    ...eventData,
    status: "pending",
    dateAdded: new Date().toISOString(),
  });
  return newRef.key;
}

// Teacher: approve an event
export async function approveEvent(eventId) {
  const eventRef = ref(db, `events/${eventId}`);
  await update(eventRef, { status: "approved" });
}

// Teacher: reject an event (remove it)
export async function rejectEvent(eventId) {
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
  const q =
    section === "all"
      ? connectionsRef
      : query(connectionsRef, orderByChild("section"), equalTo(section));

  return onValue(q, (snapshot) => {
    const connections = [];
    snapshot.forEach((child) => {
      connections.push({ id: child.key, ...child.val() });
    });
    callback(connections);
  });
}

// Submit a new connection (always pending)
export async function submitConnection(connectionData) {
  const newRef = push(connectionsRef);
  await set(newRef, {
    ...connectionData,
    status: "pending",
    dateAdded: new Date().toISOString(),
  });
  return newRef.key;
}

// Teacher: approve a connection
export async function approveConnection(connectionId) {
  const connRef = ref(db, `connections/${connectionId}`);
  await update(connRef, { status: "approved" });
}

// Teacher: reject a connection (remove it)
export async function rejectConnection(connectionId) {
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

// ── Periods ─────────────────────────────────────────────────

// Listen to a section's custom periods in real-time
export function subscribeToPeriods(section, callback) {
  const periodsRef = ref(db, `sectionSettings/${section}/periods`);
  return onValue(periodsRef, (snapshot) => {
    const data = snapshot.val();
    callback(Array.isArray(data) ? data.filter(Boolean) : null);
  });
}

// Listen to ALL sections' periods (teacher "all" view)
export function subscribeToAllSectionPeriods(sections, callback) {
  const periodsMap = {};
  const unsubscribes = [];
  for (const sec of sections) {
    const periodsRef = ref(db, `sectionSettings/${sec}/periods`);
    const unsub = onValue(periodsRef, (snapshot) => {
      const data = snapshot.val();
      periodsMap[sec] = Array.isArray(data) ? data.filter(Boolean) : null;
      callback({ ...periodsMap });
    });
    unsubscribes.push(unsub);
  }
  return () => unsubscribes.forEach((fn) => fn());
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

// Listen to ALL sections' compelling questions (teacher "all" view)
export function subscribeToAllSectionCompellingQuestions(sections, callback) {
  const cqMap = {};
  const unsubscribes = [];
  for (const sec of sections) {
    const cqRef = ref(db, `sectionSettings/${sec}/compellingQuestion`);
    const unsub = onValue(cqRef, (snapshot) => {
      cqMap[sec] = snapshot.val() || null;
      callback({ ...cqMap });
    });
    unsubscribes.push(unsub);
  }
  return () => unsubscribes.forEach((fn) => fn());
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

// Listen to ALL sections' timeline ranges (teacher "all" view)
export function subscribeToAllSectionTimelineRanges(sections, callback) {
  const rangeMap = {};
  const unsubscribes = [];
  for (const sec of sections) {
    const rangeRef = ref(db, `sectionSettings/${sec}/timelineRange`);
    const unsub = onValue(rangeRef, (snapshot) => {
      rangeMap[sec] = snapshot.val() || null;
      callback({ ...rangeMap });
    });
    unsubscribes.push(unsub);
  }
  return () => unsubscribes.forEach((fn) => fn());
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

// Listen to ALL sections' field configs (teacher "all" view)
export function subscribeToAllSectionFieldConfigs(sections, callback) {
  const configMap = {};
  const unsubscribes = [];
  for (const sec of sections) {
    const configRef = ref(db, `sectionSettings/${sec}/fieldConfig`);
    const unsub = onValue(configRef, (snapshot) => {
      configMap[sec] = snapshot.val() || null;
      callback({ ...configMap });
    });
    unsubscribes.push(unsub);
  }
  return () => unsubscribes.forEach((fn) => fn());
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

// One-time seed: push seed events into Firebase
export async function seedDatabase(seedEvents) {
  for (const event of seedEvents) {
    const newRef = push(eventsRef);
    await set(newRef, event);
  }
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
export async function assignStudentSection(uid, sectionId, email, displayName) {
  const studentRef = ref(db, `studentSections/${uid}`);
  await set(studentRef, {
    section: sectionId,
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
