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
    callback(Array.isArray(data) ? data.filter(Boolean) : null);
  });
}

// Write full sections array
export async function saveSections(sections) {
  const sectionsRef = ref(db, "sections");
  await set(sectionsRef, sections);
}

// One-time seed: push seed events into Firebase
export async function seedDatabase(seedEvents) {
  for (const event of seedEvents) {
    const newRef = push(eventsRef);
    await set(newRef, event);
  }
}
