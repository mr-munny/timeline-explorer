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

// One-time seed: push seed events into Firebase
export async function seedDatabase(seedEvents) {
  for (const event of seedEvents) {
    const newRef = push(eventsRef);
    await set(newRef, event);
  }
}
