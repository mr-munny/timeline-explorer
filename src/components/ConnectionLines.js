import { useState, useLayoutEffect, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ConnectionLines({ connections, containerRef, expandedEvent, hoveredEvent, filteredEventIds }) {
  const { theme } = useTheme();
  const [lines, setLines] = useState([]);
  const accentColor = theme.accentGold || "#F59E0B";

  const recalculate = useCallback(() => {
    if (!containerRef.current) { setLines([]); return; }
    const activeId = expandedEvent || hoveredEvent;
    if (!activeId) { setLines([]); return; }

    const relevantConns = connections.filter(
      (c) =>
        (c.causeEventId === activeId || c.effectEventId === activeId) &&
        filteredEventIds.has(c.causeEventId) &&
        filteredEventIds.has(c.effectEventId)
    );

    if (relevantConns.length === 0) { setLines([]); return; }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerScrollTop = containerRef.current.scrollTop || 0;

    const newLines = relevantConns.map((conn) => {
      const causeEl = containerRef.current.querySelector(`[data-event-id="${conn.causeEventId}"]`);
      const effectEl = containerRef.current.querySelector(`[data-event-id="${conn.effectEventId}"]`);
      if (!causeEl || !effectEl) return null;

      const causeRect = causeEl.getBoundingClientRect();
      const effectRect = effectEl.getBoundingClientRect();
      const isCause = conn.causeEventId === activeId;

      // isCause = active event leads to something → arrow exits RIGHT of cause, enters RIGHT of effect
      // !isCause = something caused active event → arrow exits LEFT of cause, enters LEFT of effect
      const causeY = causeRect.top + causeRect.height / 2 - containerRect.top + containerScrollTop;
      const effectY = effectRect.top + effectRect.height / 2 - containerRect.top + containerScrollTop;
      const vertDist = Math.abs(effectY - causeY);
      const offset = Math.min(80, vertDist * 0.25) + 30;

      let d;
      if (isCause) {
        // Curves out to the right: cause RIGHT → effect RIGHT
        const sx = causeRect.right - containerRect.left;
        const ex = effectRect.right - containerRect.left;
        d = `M ${sx},${causeY} C ${sx + offset},${causeY} ${ex + offset},${effectY} ${ex},${effectY}`;
      } else {
        // Curves out to the left: cause LEFT → effect LEFT
        const sx = causeRect.left - containerRect.left;
        const ex = effectRect.left - containerRect.left;
        d = `M ${sx},${causeY} C ${sx - offset},${causeY} ${ex - offset},${effectY} ${ex},${effectY}`;
      }

      return { id: conn.id, d, isCause };
    }).filter(Boolean);

    setLines(newLines);
  }, [connections, containerRef, expandedEvent, hoveredEvent, filteredEventIds]);

  useLayoutEffect(() => {
    recalculate();
  }, [recalculate]);

  // Recalculate on resize
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => recalculate());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, recalculate]);

  // Recalculate on scroll
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const parent = container.closest("[style*='overflow']") || window;
    const handleScroll = () => recalculate();
    parent.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      parent.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, recalculate]);

  if (lines.length === 0) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 10,
      }}
    >
      <defs>
        <marker
          id="conn-arrow"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={accentColor} fillOpacity="0.7" />
        </marker>
        <style>{`
          @keyframes conn-fly {
            from { stroke-dashoffset: 18; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>
      {lines.map((line) => (
        <path
          key={line.id}
          d={line.d}
          stroke={accentColor}
          strokeOpacity={0.45}
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 3"
          markerEnd="url(#conn-arrow)"
          style={{ animation: "conn-fly 0.6s linear infinite" }}
        />
      ))}
    </svg>
  );
}
