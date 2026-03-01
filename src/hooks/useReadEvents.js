import { useState, useEffect } from "react";

export default function useReadEvents(user, expandedEvent) {
  const [readEvents, setReadEvents] = useState(() => {
    if (!user) return new Set();
    try {
      const stored = localStorage.getItem(`readEvents_${user.uid}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Re-initialize readEvents when user changes
  useEffect(() => {
    if (!user) { setReadEvents(new Set()); return; }
    try {
      const stored = localStorage.getItem(`readEvents_${user.uid}`);
      setReadEvents(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setReadEvents(new Set()); }
  }, [user]);

  // Mark event as read when expanded
  useEffect(() => {
    if (!expandedEvent || !user) return;
    setReadEvents((prev) => {
      if (prev.has(expandedEvent)) return prev;
      const next = new Set(prev);
      next.add(expandedEvent);
      try { localStorage.setItem(`readEvents_${user.uid}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [expandedEvent, user]);

  return readEvents;
}
