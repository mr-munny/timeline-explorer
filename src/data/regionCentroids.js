// Static mapping of known region strings to [latitude, longitude].
// Used as a fallback when events lack precise coordinates.

export const REGION_CENTROIDS = {
  // US regions
  "National":       [39.83, -98.58],
  "Northeast":      [41.20, -73.20],
  "South":          [33.75, -84.39],
  "Southeast":      [33.75, -84.39],
  "Midwest":        [41.88, -87.63],
  "West":           [37.77, -122.42],
  "Southwest":      [34.05, -118.24],
  "Pacific":        [21.31, -157.86],
  "Caribbean":      [18.47, -66.11],

  // Broad world regions
  "Europe":         [48.86, 2.35],
  "Asia":           [35.68, 139.65],
  "Africa":         [6.52, 3.38],
  "South America":  [-23.55, -46.63],
  "Middle East":    [33.32, 44.37],
  "North America":  [39.83, -98.58],
  "Central America": [14.63, -90.51],
  "Oceania":        [-33.87, 151.21],
};

/**
 * Resolve an event to [latitude, longitude] or null.
 * Prefers explicit coordinates, falls back to region centroid.
 */
export function resolveEventCoordinates(event) {
  if (event.latitude != null && event.longitude != null) {
    return [event.latitude, event.longitude];
  }
  if (event.region) {
    const key = event.region.trim();
    if (REGION_CENTROIDS[key]) return REGION_CENTROIDS[key];
    // Case-insensitive fallback
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(REGION_CENTROIDS)) {
      if (k.toLowerCase() === lower) return v;
    }
  }
  return null;
}
