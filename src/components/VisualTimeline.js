import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getPeriod } from "../data/constants";
import { useTheme } from "../contexts/ThemeContext";
import { eventStartFraction, eventEndFraction, formatEventDate } from "../utils/dateUtils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 50;
const ZOOM_STEP = 0.5;
const ZOOM_WHEEL_FACTOR = 0.003;
const CLUSTER_PX_THRESHOLD = 14;

/** Format a year label for the timeline axis.
 *  When hasBCE is true (range includes negative years), shows "500 BCE" / "1500 CE".
 *  When hasBCE is false (CE-only range), shows plain numbers. */
function formatYearLabel(year, hasBCE) {
  if (year === 0) return null; // year 0 doesn't exist
  if (!hasBCE) return String(year);
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

function getDominantPeriod(items) {
  const counts = {};
  items.forEach(({ period }) => {
    counts[period.id] = (counts[period.id] || 0) + 1;
  });
  let maxId = null, maxCount = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) { maxId = id; maxCount = count; }
  }
  return items.find(i => i.period.id === maxId)?.period;
}

export default function VisualTimeline({
  filteredEvents,
  onEraClick,
  onEventSelect,
  selectedPeriod,
  timelineStart = 1910,
  timelineEnd = 2000,
  currentYear,
  periods = [],
  expandedEventId,
  connectionsByEvent,
}) {
  const { theme } = useTheme();
  const minYear = timelineStart;
  const maxYear = timelineEnd;
  const totalSpan = maxYear - minYear || 1;
  const showFutureOverlay = currentYear && maxYear > currentYear;

  // Zoom & layout state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [openClusterId, setOpenClusterId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs
  const wrapperRef = useRef(null);
  const viewportRef = useRef(null);
  const panStartRef = useRef({ x: 0, scrollLeft: 0 });
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;
  const animationRef = useRef(null);

  const canvasWidth = viewportWidth * zoomLevel;

  const getPosition = (year) =>
    Math.max(0, Math.min(100, ((year - minYear) / totalSpan) * 100));

  // Measure viewport width
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, []);

  // Close dropdown on zoom change
  useEffect(() => {
    setOpenClusterId(null);
  }, [zoomLevel]);

  // Animated zoom — lerps from current to target with ease-out curve
  const animateToZoom = useCallback((targetZoom, getScrollLeft) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const vp = viewportRef.current;
    if (!vp) { setZoomLevel(targetZoom); return; }

    const startZoom = zoomRef.current;
    const startTime = performance.now();
    const duration = 250;

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const z = startZoom + (targetZoom - startZoom) * ease;
      setZoomLevel(Math.round(z * 100) / 100);
      vp.scrollLeft = getScrollLeft(z);
      if (t < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setZoomLevel(targetZoom);
        vp.scrollLeft = getScrollLeft(targetZoom);
        animationRef.current = null;
      }
    };
    animationRef.current = requestAnimationFrame(step);
  }, []);

  // Zoom handler — preserves focal point, optionally animated
  const handleZoom = useCallback((newZoom, focalFraction, animated) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoom * 100) / 100));
    if (clamped === zoomRef.current) return;

    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }

    const vp = viewportRef.current;
    if (!vp) { setZoomLevel(clamped); return; }

    if (focalFraction === undefined) {
      focalFraction = (vp.scrollLeft + vp.clientWidth / 2) / (viewportWidth * zoomRef.current);
    }
    const viewportOffsetX = focalFraction * viewportWidth * zoomRef.current - vp.scrollLeft;

    if (animated) {
      animateToZoom(clamped, (z) => Math.max(0, focalFraction * viewportWidth * z - viewportOffsetX));
    } else {
      setZoomLevel(clamped);
      requestAnimationFrame(() => {
        vp.scrollLeft = Math.max(0, focalFraction * viewportWidth * clamped - viewportOffsetX);
      });
    }
  }, [viewportWidth, animateToZoom]);

  // Auto-zoom to fit a specific era in the viewport
  const zoomToEra = useCallback((period) => {
    const eraSpan = period.era[1] - period.era[0];
    const eraFrac = eraSpan / totalSpan;
    const targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, 0.8 / eraFrac));
    const eraCenterFrac = ((period.era[0] + period.era[1]) / 2 - minYear) / totalSpan;
    const vpWidth = viewportRef.current?.clientWidth || 0;

    animateToZoom(targetZoom, (z) =>
      Math.max(0, eraCenterFrac * viewportWidth * z - vpWidth / 2)
    );
  }, [viewportWidth, totalSpan, minYear, animateToZoom]);

  // Wheel handler: Ctrl+wheel = zoom, plain wheel = horizontal scroll
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * ZOOM_WHEEL_FACTOR;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current + delta * zoomRef.current));
        const rect = vp.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const focalFraction = (vp.scrollLeft + cursorX) / (viewportWidth * zoomRef.current);
        handleZoom(newZoom, focalFraction);
      } else if (zoomRef.current > 1) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
          e.preventDefault();
          vp.scrollLeft += e.deltaY;
        }
      }
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [viewportWidth, handleZoom]);

  // Drag-to-pan (attached to canvas, not viewport, so native scrollbar is unaffected)
  const handlePointerDown = useCallback((e) => {
    if (zoomRef.current <= 1) return;
    if (e.target.closest("[data-cluster]") || e.target.closest("button") || e.target.closest("[data-era]")) return;
    setIsPanning(true);
    const vp = viewportRef.current;
    panStartRef.current = { x: e.clientX, scrollLeft: vp.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    viewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
  }, [isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Close dropdown on scroll
  const handleViewportScroll = useCallback(() => {
    setOpenClusterId(null);
  }, []);

  // Event clustering — duration events are kept separate from singular events
  const { durationMarkers, clusteredMarkers, durationLaneCount } = useMemo(() => {
    if (!viewportWidth || filteredEvents.length === 0) return { durationMarkers: [], clusteredMarkers: [] };
    const cw = viewportWidth * zoomLevel;

    const positioned = filteredEvents
      .map((event) => {
        const period = getPeriod(periods, event.period);
        if (!period) return null;
        const startFrac = eventStartFraction(event);
        const endFrac = eventEndFraction(event);
        const pct = ((startFrac - minYear) / totalSpan) * 100;
        const px = (pct / 100) * cw;
        const isDuration = endFrac !== null;
        let endPct = null, endPx = null;
        if (isDuration) {
          endPct = ((endFrac - minYear) / totalSpan) * 100;
          endPx = (endPct / 100) * cw;
        }
        return { event, period, px, isDuration, pct, endPct, endPx };
      })
      .filter(Boolean);

    // Separate duration events from singular events
    const durations = positioned.filter((p) => p.isDuration);
    const singles = positioned.filter((p) => !p.isDuration).sort((a, b) => a.px - b.px);

    // Assign duration events to Gantt-style lanes (lowest available lane with no time overlap)
    const lanes = []; // each lane is an array of { minPx, maxPx }
    const durMarkers = durations
      .sort((a, b) => Math.min(a.px, a.endPx) - Math.min(b.px, b.endPx))
      .map((item, idx) => {
        const barMinPx = Math.min(item.px, item.endPx);
        const barMaxPx = Math.max(item.px, item.endPx);
        let assignedLane = 0;
        for (let l = 0; l < lanes.length; l++) {
          const fits = lanes[l].every((seg) => barMinPx > seg.maxPx + CLUSTER_PX_THRESHOLD || barMaxPx < seg.minPx - CLUSTER_PX_THRESHOLD);
          if (fits) { assignedLane = l; break; }
          assignedLane = l + 1;
        }
        if (!lanes[assignedLane]) lanes[assignedLane] = [];
        lanes[assignedLane].push({ minPx: barMinPx, maxPx: barMaxPx });
        return {
          id: `dur-${idx}`,
          items: [item],
          isSingle: true,
          isDurationCluster: true,
          centerPct: item.pct,
          count: 1,
          period: item.period,
          lane: assignedLane,
        };
      });
    const durationLaneCount = lanes.length;

    // Cluster only singular events
    if (singles.length === 0) return { durationMarkers: durMarkers, clusteredMarkers: [] };

    const clusters = [];
    let cur = { items: [singles[0]], minPx: singles[0].px, maxPx: singles[0].px };

    for (let i = 1; i < singles.length; i++) {
      const item = singles[i];
      if (item.px - cur.maxPx <= CLUSTER_PX_THRESHOLD) {
        cur.items.push(item);
        cur.maxPx = item.px;
      } else {
        clusters.push(cur);
        cur = { items: [item], minPx: item.px, maxPx: item.px };
      }
    }
    clusters.push(cur);

    // Check if a singular cluster overlaps any duration bar — if so, bump it down
    const singularClusters = clusters.map((c, idx) => {
      const centerPx = (c.minPx + c.maxPx) / 2;
      const centerPct = (centerPx / cw) * 100;
      const isSingle = c.items.length === 1;
      const bumped = durations.some((d) => {
        const barMinPx = Math.min(d.px, d.endPx);
        const barMaxPx = Math.max(d.px, d.endPx);
        return centerPx >= barMinPx - CLUSTER_PX_THRESHOLD && centerPx <= barMaxPx + CLUSTER_PX_THRESHOLD;
      });
      const uniquePeriods = new Set(c.items.map((i) => i.period.id));
      const isMixed = uniquePeriods.size > 1;
      return {
        id: `cluster-${idx}`,
        centerPct,
        count: c.items.length,
        isSingle,
        isMixed,
        items: c.items,
        period: isSingle ? c.items[0].period : getDominantPeriod(c.items),
        bumped,
      };
    });

    return { durationMarkers: durMarkers, clusteredMarkers: singularClusters, durationLaneCount };
  }, [filteredEvents, zoomLevel, viewportWidth, periods, minYear, totalSpan]);

  // Connection arcs for the expanded event
  const connectionArcs = useMemo(() => {
    if (!expandedEventId || !connectionsByEvent || !canvasWidth) return [];
    const conns = connectionsByEvent[expandedEventId];
    if (!conns) return [];

    // Build position lookup from filtered events
    const eventX = {};
    filteredEvents.forEach((ev) => {
      const frac = eventStartFraction(ev);
      if (frac !== null) eventX[ev.id] = ((frac - minYear) / totalSpan) * canvasWidth;
    });
    if (eventX[expandedEventId] === undefined) return [];

    // Map each event to its cluster so we can skip arcs within the same node
    const eventCluster = {};
    clusteredMarkers.forEach((c) => c.items.forEach((item) => { eventCluster[item.event.id] = c.id; }));

    const arcs = [];
    for (const conn of [...(conns.causes || []), ...(conns.effects || [])]) {
      const otherId = conn.causeEventId === expandedEventId ? conn.effectEventId : conn.causeEventId;
      if (eventX[otherId] === undefined) continue;
      // Skip arcs between events that share a combined node
      if (eventCluster[conn.causeEventId] && eventCluster[conn.causeEventId] === eventCluster[conn.effectEventId]) continue;
      arcs.push({
        id: conn.id,
        x1: eventX[conn.causeEventId],
        x2: eventX[conn.effectEventId],
      });
    }
    return arcs;
  }, [expandedEventId, connectionsByEvent, filteredEvents, canvasWidth, minYear, totalSpan, clusteredMarkers]);

  // Cluster/node click handler (used for both single and multi-event nodes)
  const handleNodeClick = useCallback((e, cluster) => {
    e.stopPropagation();
    if (openClusterId === cluster.id) {
      setOpenClusterId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom - wrapperRect.top + 4,
      left: Math.max(110, Math.min(rect.left + rect.width / 2 - wrapperRect.left, wrapperRect.width - 110)),
    });
    setOpenClusterId(cluster.id);
  }, [openClusterId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openClusterId) return;
    const onClick = (e) => {
      if (!e.target.closest("[data-dropdown]") && !e.target.closest("[data-cluster]")) {
        setOpenClusterId(null);
      }
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [openClusterId]);

  // Dynamic year label interval — scales from 1-year to 1000-year ticks
  const labelInterval = useMemo(() => {
    if (!viewportWidth) return 10;
    const pixelsPerYear = (viewportWidth * zoomLevel) / totalSpan;
    if (pixelsPerYear >= 40) return 1;
    if (pixelsPerYear >= 20) return 2;
    if (pixelsPerYear >= 8) return 5;
    if (pixelsPerYear >= 4) return 10;
    if (pixelsPerYear >= 2) return 25;
    if (pixelsPerYear >= 1) return 50;
    if (pixelsPerYear >= 0.5) return 100;
    if (pixelsPerYear >= 0.2) return 250;
    if (pixelsPerYear >= 0.1) return 500;
    return 1000;
  }, [viewportWidth, zoomLevel, totalSpan]);

  // Whether the range includes BCE years (affects label formatting)
  const hasBCE = minYear < 0;

  const yearLabels = useMemo(() => {
    const labels = [];
    const start = Math.ceil(minYear / labelInterval) * labelInterval;
    for (let y = start; y <= maxYear; y += labelInterval) {
      if (y === 0) continue; // year 0 doesn't exist
      labels.push(y);
    }
    return labels;
  }, [minYear, maxYear, labelInterval]);

  const openCluster = openClusterId
    ? (clusteredMarkers.find((c) => c.id === openClusterId) || durationMarkers.find((c) => c.id === openClusterId))
    : null;

  return (
    <div ref={wrapperRef} style={{ padding: "12px 24px 8px", position: "relative" }}>
      {/* Zoom controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
          marginBottom: 6,
          height: 22,
        }}
      >
        <button
          onClick={() => handleZoom(zoomLevel - ZOOM_STEP, undefined, true)}
          disabled={zoomLevel <= MIN_ZOOM}
          title="Zoom out"
          style={{
            width: 22,
            height: 22,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 4,
            background: theme.inputBg,
            color: zoomLevel <= MIN_ZOOM ? theme.textMuted : theme.textPrimary,
            cursor: zoomLevel <= MIN_ZOOM ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Overpass Mono', monospace",
            padding: 0,
            transition: "all 0.15s",
          }}
        >
          &minus;
        </button>
        <span
          style={{
            fontSize: 9,
            fontFamily: "'Overpass Mono', monospace",
            color: theme.textMuted,
            minWidth: 36,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => handleZoom(zoomLevel + ZOOM_STEP, undefined, true)}
          disabled={zoomLevel >= MAX_ZOOM}
          title="Zoom in"
          style={{
            width: 22,
            height: 22,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 4,
            background: theme.inputBg,
            color: zoomLevel >= MAX_ZOOM ? theme.textMuted : theme.textPrimary,
            cursor: zoomLevel >= MAX_ZOOM ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Overpass Mono', monospace",
            padding: 0,
            transition: "all 0.15s",
          }}
        >
          +
        </button>
        <button
          onClick={() => handleZoom(1, undefined, true)}
          disabled={zoomLevel === 1}
          title="Fit entire range"
          style={{
            marginLeft: 4,
            height: 22,
            padding: "0 8px",
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 4,
            background: zoomLevel === 1 ? theme.subtleBg : theme.inputBg,
            color: zoomLevel === 1 ? theme.textMuted : theme.textPrimary,
            cursor: zoomLevel === 1 ? "default" : "pointer",
            fontSize: 9,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          FIT
        </button>
      </div>

      {/* Scrollable viewport */}
      <div
        ref={viewportRef}
        onScroll={handleViewportScroll}
        style={{
          overflowX: zoomLevel > 1 ? "auto" : "hidden",
          overflowY: "hidden",
          position: "relative",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "pan-y",
          scrollbarWidth: "thin",
          scrollbarColor: `${theme.textMuted}40 transparent`,
        }}
      >
        {/* Zoomable canvas — pointer events here so scrollbar isn't affected */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: "relative",
            width: canvasWidth || "100%",
            minWidth: "100%",
            cursor: isPanning ? "grabbing" : zoomLevel > 1 ? "grab" : "default",
          }}
        >
          {/* Era bands */}
          <div
            style={{
              position: "relative",
              height: 40,
              borderRadius: 6,
              overflow: "hidden",
              background: theme.subtleBg,
            }}
          >
            {periods.map((u) => {
              const left = getPosition(u.era[0]);
              const width = getPosition(u.era[1]) - left;
              const isActive = selectedPeriod === "all" || selectedPeriod === u.id;
              return (
                <div
                  key={u.id}
                  data-era
                  onClick={() => {
                    const isDeselecting = u.id === selectedPeriod;
                    onEraClick(isDeselecting ? "all" : u.id);
                    if (isDeselecting) {
                      handleZoom(1, undefined, true);
                    } else {
                      zoomToEra(u);
                    }
                  }}
                  title={u.label}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    bottom: 0,
                    background: isActive ? u.accent + "25" : theme.subtleBg,
                    borderLeft: `2px solid ${isActive ? u.color : theme.inputBorder}`,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: isActive ? u.color : theme.textSecondary,
                      fontFamily: "'Overpass Mono', monospace",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      opacity: width > 4 ? 1 : 0,
                      transition: "opacity 0.3s",
                    }}
                  >
                    {u.label.slice(0, 12)}
                  </span>
                </div>
              );
            })}
            {/* Future overlay */}
            {showFutureOverlay &&
              (() => {
                const futureLeft = getPosition(currentYear);
                const futureWidth = 100 - futureLeft;
                return (
                  <div
                    title={`${currentYear}\u2013${maxYear}: Future`}
                    style={{
                      position: "absolute",
                      left: `${futureLeft}%`,
                      width: `${futureWidth}%`,
                      top: 0,
                      bottom: 0,
                      background: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        ${theme.textMuted}18 3px,
                        ${theme.textMuted}18 6px
                      )`,
                      borderLeft: `1.5px dashed ${theme.textMuted}60`,
                      pointerEvents: "none",
                      zIndex: 3,
                      transition: "all 0.3s ease",
                    }}
                  />
                );
              })()}
          </div>

          {/* Connection arcs for the expanded event — arcs curve downward below the markers */}
          {connectionArcs.length > 0 && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: canvasWidth,
                height: 42 + (durationLaneCount > 0 ? durationLaneCount * 12 + 4 : 0) + 28 + 40,
                pointerEvents: "none",
                zIndex: 4,
                overflow: "visible",
              }}
            >
              <defs>
                <marker
                  id="conn-arrow"
                  viewBox="0 0 8 6"
                  refX="7"
                  refY="3"
                  markerWidth="7"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke={theme.accentGold} strokeWidth="1" />
                </marker>
              </defs>
              {connectionArcs.map((arc) => {
                const dotY = 42 + (durationLaneCount > 0 ? durationLaneCount * 12 + 4 : 0) + 7;
                const dist = Math.abs(arc.x2 - arc.x1);
                const arcHeight = Math.min(36, Math.max(14, dist * 0.12));
                const midX = (arc.x1 + arc.x2) / 2;
                const cy = dotY + arcHeight;
                return (
                  <g key={arc.id}>
                    <path
                      d={`M ${arc.x1} ${dotY} Q ${midX} ${cy} ${arc.x2} ${dotY}`}
                      fill="none"
                      stroke={theme.accentGold}
                      strokeWidth={1.5}
                      opacity={0.55}
                      markerEnd="url(#conn-arrow)"
                    />
                    {/* Endpoint dots */}
                    <circle cx={arc.x1} cy={dotY} r={2.5} fill={theme.accentGold} opacity={0.7} />
                    <circle cx={arc.x2} cy={dotY} r={2.5} fill={theme.accentGold} opacity={0.7} />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Event markers — duration bars in lanes on top, singular dots/clusters below */}
          <div style={{ position: "relative", height: (durationLaneCount > 0 ? durationLaneCount * 12 + 4 : 0) + 28, marginTop: 2 }}>
            {/* Duration bars — each in its assigned lane */}
            {durationMarkers.map((cluster) => {
              const isOpen = openClusterId === cluster.id;
              const item = cluster.items[0];
              const barLeft = Math.min(item.pct, item.endPct);
              const barRight = Math.max(item.pct, item.endPct);
              const barWidth = Math.max(barRight - barLeft, 0.3);
              const laneTop = cluster.lane * 12 + 2;
              return (
                <div
                  key={cluster.id}
                  data-cluster
                  onClick={(e) => handleNodeClick(e, cluster)}
                  style={{
                    position: "absolute",
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    top: laneTop,
                    height: 8,
                    borderRadius: 4,
                    background: item.period.color + "50",
                    border: `1.5px solid ${item.period.color}`,
                    cursor: "pointer",
                    zIndex: isOpen ? 4 : 2,
                    transition: "all 0.2s ease",
                    boxShadow: isOpen
                      ? `0 0 0 2px ${item.period.color}60`
                      : "none",
                  }}
                />
              );
            })}

            {/* Singular event dots/clusters — below duration lanes */}
            {clusteredMarkers.map((cluster) => {
              const isOpen = openClusterId === cluster.id;
              const durationOffset = durationLaneCount > 0 ? durationLaneCount * 12 + 4 : 0;

              if (cluster.isSingle) {
                const item = cluster.items[0];
                return (
                  <div
                    key={cluster.id}
                    data-cluster
                    onClick={(e) => handleNodeClick(e, cluster)}
                    style={{
                      position: "absolute",
                      left: `${cluster.centerPct}%`,
                      top: durationOffset,
                      transform: "translateX(-50%)",
                      cursor: "pointer",
                      zIndex: isOpen ? 4 : 2,
                      padding: "3px",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: item.period.color,
                        border: `2px solid ${theme.cardBg}`,
                        boxShadow: isOpen
                          ? `0 0 0 2px ${item.period.color}60, 0 0 8px ${item.period.color}30`
                          : `0 0 0 1px ${item.period.color}40`,
                        transition: "all 0.2s ease",
                      }}
                    />
                  </div>
                );
              }

              // Multi-event cluster node: larger dot with count badge
              const clusterColor = cluster.isMixed ? theme.textSecondary : cluster.period.color;
              return (
                <div
                  key={cluster.id}
                  data-cluster
                  onClick={(e) => handleNodeClick(e, cluster)}
                  style={{
                    position: "absolute",
                    left: `${cluster.centerPct}%`,
                    top: 1 + durationOffset,
                    transform: "translateX(-50%)",
                    cursor: "pointer",
                    zIndex: isOpen ? 4 : 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: clusterColor,
                      border: `2px solid ${theme.cardBg}`,
                      boxShadow: isOpen
                        ? `0 0 0 2px ${clusterColor}60, 0 0 8px ${clusterColor}30`
                        : `0 0 0 1px ${clusterColor}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        color: "#fff",
                        fontFamily: "'Overpass Mono', monospace",
                        lineHeight: 1,
                      }}
                    >
                      {cluster.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Year labels — edge labels clamped to prevent clipping */}
          <div style={{ position: "relative", height: 14 }}>
            {yearLabels.map((y) => {
              const label = formatYearLabel(y, hasBCE);
              if (label === null) return null;
              // Major tick: adapts to interval scale
              const isMajor = labelInterval >= 100
                ? y % 500 === 0
                : labelInterval >= 10
                  ? y % 100 === 0
                  : labelInterval >= 5
                    ? y % 50 === 0
                    : y % 10 === 0;
              const pct = getPosition(y);
              return (
                <span
                  key={y}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    transform: `translateX(-${pct}%)`,
                    fontSize: isMajor ? 9 : 8,
                    color: theme.textMuted,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: isMajor ? 600 : 400,
                    whiteSpace: "nowrap",
                    opacity: isMajor ? 1 : 0.6,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event dropdown (rendered outside viewport to avoid clipping) */}
      {openCluster && (
        <div
          data-dropdown
          style={{
            position: "absolute",
            top: dropdownPos.top,
            left: dropdownPos.left,
            transform: "translateX(-50%)",
            zIndex: 100,
            background: theme.cardBg,
            border: `1.5px solid ${theme.cardBorder}`,
            borderRadius: 8,
            boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
            padding: "6px 0",
            minWidth: 200,
            maxWidth: 280,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "4px 12px 6px",
              fontSize: 9,
              fontFamily: "'Overpass Mono', monospace",
              color: theme.textMuted,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: `1px solid ${theme.cardBorder}`,
            }}
          >
            {openCluster.count} {openCluster.count === 1 ? "event" : "events"}
          </div>
          {openCluster.items.map(({ event, period }) => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                setOpenClusterId(null);
                onEventSelect?.(event.id);
              }}
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: onEventSelect ? "pointer" : "default",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = theme.subtleBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "'Overpass Mono', monospace",
                  color: period.color,
                  minWidth: 32,
                  flexShrink: 0,
                }}
              >
                {formatEventDate(event)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: theme.textPrimary,
                  fontFamily: "'Newsreader', serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {event.title}
              </span>
              {onEventSelect && (
                <span
                  style={{
                    fontSize: 9,
                    color: theme.textMuted,
                    fontFamily: "'Overpass Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {"\u2197"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
