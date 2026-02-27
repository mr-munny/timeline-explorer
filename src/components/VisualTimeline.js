import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getPeriod } from "../data/constants";
import { useTheme } from "../contexts/ThemeContext";

const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const ZOOM_STEP = 0.5;
const ZOOM_WHEEL_FACTOR = 0.003;
const CLUSTER_PX_THRESHOLD = 14;

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

  // Zoom handler — preserves focal point
  const handleZoom = useCallback((newZoom, focalFraction) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoom * 100) / 100));
    if (clamped === zoomRef.current) return;

    const vp = viewportRef.current;
    const oldZoom = zoomRef.current;
    setZoomLevel(clamped);

    if (!vp) return;
    if (focalFraction === undefined) {
      focalFraction = (vp.scrollLeft + vp.clientWidth / 2) / (viewportWidth * oldZoom);
    }
    requestAnimationFrame(() => {
      const newCanvas = viewportWidth * clamped;
      const cursorViewportX = focalFraction * viewportWidth * oldZoom - vp.scrollLeft;
      vp.scrollLeft = Math.max(0, focalFraction * newCanvas - cursorViewportX);
    });
  }, [viewportWidth]);

  // Auto-zoom to fit a specific era in the viewport
  const zoomToEra = useCallback((period) => {
    const eraSpan = period.era[1] - period.era[0];
    const eraFrac = eraSpan / totalSpan;
    const targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, 0.8 / eraFrac));
    const eraCenterFrac = ((period.era[0] + period.era[1]) / 2 - minYear) / totalSpan;

    setZoomLevel(targetZoom);
    requestAnimationFrame(() => {
      const vp = viewportRef.current;
      if (!vp) return;
      const newCanvas = viewportWidth * targetZoom;
      vp.scrollLeft = Math.max(0, eraCenterFrac * newCanvas - vp.clientWidth / 2);
    });
  }, [viewportWidth, totalSpan, minYear]);

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

  // Event clustering
  const clusteredMarkers = useMemo(() => {
    if (!viewportWidth || filteredEvents.length === 0) return [];
    const cw = viewportWidth * zoomLevel;

    const positioned = filteredEvents
      .map((event) => {
        const period = getPeriod(periods, event.period);
        if (!period) return null;
        const pct = ((event.year - minYear) / totalSpan) * 100;
        const px = (pct / 100) * cw;
        return { event, period, px };
      })
      .filter(Boolean)
      .sort((a, b) => a.px - b.px);

    if (positioned.length === 0) return [];

    const clusters = [];
    let cur = { items: [positioned[0]], minPx: positioned[0].px, maxPx: positioned[0].px };

    for (let i = 1; i < positioned.length; i++) {
      const item = positioned[i];
      if (item.px - cur.maxPx <= CLUSTER_PX_THRESHOLD) {
        cur.items.push(item);
        cur.maxPx = item.px;
      } else {
        clusters.push(cur);
        cur = { items: [item], minPx: item.px, maxPx: item.px };
      }
    }
    clusters.push(cur);

    return clusters.map((c, idx) => {
      const centerPx = (c.minPx + c.maxPx) / 2;
      const centerPct = (centerPx / cw) * 100;
      const isSingle = c.items.length === 1;
      return {
        id: `cluster-${idx}`,
        centerPct,
        count: c.items.length,
        isSingle,
        items: c.items,
        period: isSingle ? c.items[0].period : getDominantPeriod(c.items),
      };
    });
  }, [filteredEvents, zoomLevel, viewportWidth, periods, minYear, totalSpan]);

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

  // Dynamic year label interval
  const labelInterval = useMemo(() => {
    if (!viewportWidth) return 10;
    const pixelsPerYear = (viewportWidth * zoomLevel) / totalSpan;
    if (pixelsPerYear >= 40) return 1;
    if (pixelsPerYear >= 20) return 2;
    if (pixelsPerYear >= 8) return 5;
    return 10;
  }, [viewportWidth, zoomLevel, totalSpan]);

  const yearLabels = useMemo(() => {
    const labels = [];
    const start = Math.ceil(minYear / labelInterval) * labelInterval;
    for (let y = start; y <= maxYear; y += labelInterval) {
      labels.push(y);
    }
    return labels;
  }, [minYear, maxYear, labelInterval]);

  const openCluster = openClusterId ? clusteredMarkers.find((c) => c.id === openClusterId) : null;

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
          onClick={() => handleZoom(zoomLevel - ZOOM_STEP)}
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
          onClick={() => handleZoom(zoomLevel + ZOOM_STEP)}
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
          onClick={() => handleZoom(1)}
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
                      handleZoom(1);
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

          {/* Event markers / clusters — all nodes are clickable */}
          <div style={{ position: "relative", height: 28, marginTop: 2 }}>
            {clusteredMarkers.map((cluster) => {
              const isOpen = openClusterId === cluster.id;

              if (cluster.isSingle) {
                // Single-event node: smaller dot, clickable to open dropdown
                const item = cluster.items[0];
                return (
                  <div
                    key={cluster.id}
                    data-cluster
                    onClick={(e) => handleNodeClick(e, cluster)}
                    style={{
                      position: "absolute",
                      left: `${cluster.centerPct}%`,
                      top: 0,
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
              return (
                <div
                  key={cluster.id}
                  data-cluster
                  onClick={(e) => handleNodeClick(e, cluster)}
                  style={{
                    position: "absolute",
                    left: `${cluster.centerPct}%`,
                    top: 1,
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
                      background: cluster.period.color,
                      border: `2px solid ${theme.cardBg}`,
                      boxShadow: isOpen
                        ? `0 0 0 2px ${cluster.period.color}60, 0 0 8px ${cluster.period.color}30`
                        : `0 0 0 1px ${cluster.period.color}40`,
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
              const isDecade = y % 10 === 0;
              const pct = getPosition(y);
              return (
                <span
                  key={y}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    transform: `translateX(-${pct}%)`,
                    fontSize: isDecade ? 9 : 8,
                    color: theme.textMuted,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: isDecade ? 600 : 400,
                    whiteSpace: "nowrap",
                    opacity: isDecade ? 1 : 0.6,
                  }}
                >
                  {y}
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
                {event.year}
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
