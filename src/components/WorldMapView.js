import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Map, { Source, Layer, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { resolveEventCoordinates } from "../data/regionCentroids";
import { getPeriod } from "../data/constants";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import mapMarkerOffOutline from "@iconify-icons/mdi/map-marker-off-outline";
import TimeRangeSlider from "./TimeRangeSlider";
import MapEventPopup from "./MapEventPopup";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function WorldMapView({
  filteredEvents,
  periods,
  onEventSelect,
  timelineStart,
  timelineEnd,
  selectedPeriods,
}) {
  const { theme, mode } = useTheme();
  const mapRef = useRef(null);
  const [timeRange, setTimeRange] = useState([timelineStart, timelineEnd]);
  const [popupEvent, setPopupEvent] = useState(null);
  const [cursor, setCursor] = useState("grab");

  // Reset time range when timeline bounds change
  useEffect(() => {
    setTimeRange([timelineStart, timelineEnd]);
  }, [timelineStart, timelineEnd]);

  // Resolve coordinates for all filtered events
  const { mappableEvents, unmappableCount } = useMemo(() => {
    const mappable = [];
    let unmappable = 0;
    for (const event of filteredEvents) {
      const coords = resolveEventCoordinates(event);
      if (coords) {
        mappable.push({ ...event, _coords: coords });
      } else {
        unmappable++;
      }
    }
    return { mappableEvents: mappable, unmappableCount: unmappable };
  }, [filteredEvents]);

  // Apply time range filter
  const timeFilteredEvents = useMemo(() => {
    const [start, end] = timeRange;
    return mappableEvents.filter((e) => e.year >= start && e.year <= end);
  }, [mappableEvents, timeRange]);

  // Build GeoJSON for the circle layer
  const geojson = useMemo(() => ({
    type: "FeatureCollection",
    features: timeFilteredEvents.map((e) => {
      const period = getPeriod(periods, e.period);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e._coords[1], e._coords[0]], // GeoJSON is [lng, lat]
        },
        properties: {
          id: e.id,
          title: e.title,
          color: period?.accent || period?.color || "#6B7280",
          borderColor: period?.color || "#374151",
        },
      };
    }),
  }), [timeFilteredEvents, periods]);

  // Circle layer paint
  const circleLayer = useMemo(() => ({
    id: "event-circles",
    type: "circle",
    paint: {
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        1, 5,
        6, 8,
        12, 12,
      ],
      "circle-color": ["get", "color"],
      "circle-stroke-color": ["get", "borderColor"],
      "circle-stroke-width": 2,
      "circle-opacity": 0.85,
    },
  }), []);

  const handleMapClick = useCallback((e) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      const eventId = feature.properties.id;
      const event = timeFilteredEvents.find((ev) => ev.id === eventId);
      if (event) {
        setPopupEvent(event);
      }
    } else {
      setPopupEvent(null);
    }
  }, [timeFilteredEvents]);

  const handleMouseEnter = useCallback(() => setCursor("pointer"), []);
  const handleMouseLeave = useCallback(() => setCursor("grab"), []);

  const handleViewInTimeline = useCallback((eventId) => {
    setPopupEvent(null);
    onEventSelect(eventId);
  }, [onEventSelect]);

  // Fit bounds to visible markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || timeFilteredEvents.length === 0) return;
    const lngs = timeFilteredEvents.map((e) => e._coords[1]);
    const lats = timeFilteredEvents.map((e) => e._coords[0]);
    const sw = [Math.min(...lngs) - 5, Math.min(...lats) - 5];
    const ne = [Math.max(...lngs) + 5, Math.max(...lats) + 5];
    try {
      map.fitBounds([sw, ne], { padding: 60, maxZoom: 8, duration: 800 });
    } catch {
      // Ignore if bounds are degenerate
    }
  }, [timeFilteredEvents]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
      {/* Map container */}
      <div style={{
        borderRadius: RADII.xl,
        overflow: "hidden",
        border: `1.5px solid ${theme.cardBorder}`,
        height: 500,
        position: "relative",
      }}>
        <Map
          ref={mapRef}
          mapStyle={mode === "dark" ? DARK_STYLE : LIGHT_STYLE}
          initialViewState={{
            longitude: -40,
            latitude: 30,
            zoom: 1.5,
          }}
          style={{ width: "100%", height: "100%" }}
          cursor={cursor}
          interactiveLayerIds={["event-circles"]}
          onClick={handleMapClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          attributionControl={true}
        >
          <NavigationControl position="top-right" />

          <Source id="events" type="geojson" data={geojson}>
            <Layer {...circleLayer} />
          </Source>

          {popupEvent && (
            <Popup
              longitude={popupEvent._coords[1]}
              latitude={popupEvent._coords[0]}
              anchor="bottom"
              onClose={() => setPopupEvent(null)}
              closeButton={true}
              closeOnClick={false}
              maxWidth="300px"
              style={{ zIndex: 10 }}
            >
              <MapEventPopup
                event={popupEvent}
                periods={periods}
                onViewInTimeline={handleViewInTimeline}
              />
            </Popup>
          )}
        </Map>

        {/* Unmappable events badge */}
        {unmappableCount > 0 && (
          <div style={{
            position: "absolute",
            bottom: SPACING[3],
            left: SPACING[3],
            background: mode === "dark" ? "rgba(28,28,32,0.9)" : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            padding: `${SPACING[2]} ${SPACING[3]}`,
            borderRadius: RADII.lg,
            border: `1px solid ${theme.cardBorder}`,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            color: theme.textSecondary,
            display: "flex",
            alignItems: "center",
            gap: SPACING["1.5"],
            zIndex: 5,
          }}>
            <Icon icon={mapMarkerOffOutline} width={14} />
            {unmappableCount} event{unmappableCount !== 1 ? "s" : ""} without location
          </div>
        )}

        {/* Event count badge */}
        <div style={{
          position: "absolute",
          top: SPACING[3],
          left: SPACING[3],
          background: mode === "dark" ? "rgba(28,28,32,0.9)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          padding: `${SPACING[2]} ${SPACING[3]}`,
          borderRadius: RADII.lg,
          border: `1px solid ${theme.cardBorder}`,
          fontSize: FONT_SIZES.micro,
          fontFamily: FONT_MONO,
          color: theme.textPrimary,
          fontWeight: 700,
          zIndex: 5,
        }}>
          {timeFilteredEvents.length} event{timeFilteredEvents.length !== 1 ? "s" : ""} on map
        </div>
      </div>

      {/* Time Range Slider */}
      <TimeRangeSlider
        min={timelineStart}
        max={timelineEnd}
        value={timeRange}
        onChange={setTimeRange}
        periods={periods}
      />
    </div>
  );
}
