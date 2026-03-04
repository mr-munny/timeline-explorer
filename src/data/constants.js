// ── Color Palettes ──────────────────────────────────────────
// All color-on-bg pairs verified ≥ WCAG AA 4.5:1 contrast ratio.

export const COLOR_PALETTES = {
  classic: {
    id: "classic",
    label: "Classic",
    colors: [
      { color: "#991B1B", bg: "#FEE2E2", accent: "#EF4444" },  // Red
      { color: "#92400E", bg: "#FEF3C7", accent: "#F59E0B" },  // Orange
      { color: "#1E40AF", bg: "#DBEAFE", accent: "#3B82F6" },  // Blue
      { color: "#5B21B6", bg: "#EDE9FE", accent: "#8B5CF6" },  // Purple
      { color: "#065F46", bg: "#D1FAE5", accent: "#10B981" },  // Green
      { color: "#9D174D", bg: "#FCE7F3", accent: "#EC4899" },  // Pink
      { color: "#78350F", bg: "#FEF3C7", accent: "#D97706" },  // Amber
      { color: "#1E3A5F", bg: "#DBEAFE", accent: "#0EA5E9" },  // Sky
    ],
  },
  earth: {
    id: "earth",
    label: "Earth Tones",
    colors: [
      { color: "#78350F", bg: "#FEF3C7", accent: "#B45309" },  // Burnt Sienna
      { color: "#713F12", bg: "#FEF9C3", accent: "#A16207" },  // Ochre
      { color: "#365314", bg: "#ECFCCB", accent: "#65A30D" },  // Olive
      { color: "#1C1917", bg: "#F5F5F4", accent: "#78716C" },  // Slate
      { color: "#7C2D12", bg: "#FFEDD5", accent: "#C2410C" },  // Terracotta
      { color: "#3F6212", bg: "#F7FEE7", accent: "#84CC16" },  // Moss
      { color: "#44403C", bg: "#FAFAF9", accent: "#A8A29E" },  // Warm Gray
      { color: "#854D0E", bg: "#FEFCE8", accent: "#CA8A04" },  // Gold
    ],
  },
  jewel: {
    id: "jewel",
    label: "Jewel Tones",
    colors: [
      { color: "#7F1D1D", bg: "#FEF2F2", accent: "#DC2626" },  // Ruby
      { color: "#1E3A8A", bg: "#EFF6FF", accent: "#2563EB" },  // Sapphire
      { color: "#064E3B", bg: "#ECFDF5", accent: "#059669" },  // Emerald
      { color: "#4C1D95", bg: "#F5F3FF", accent: "#7C3AED" },  // Amethyst
      { color: "#9A3412", bg: "#FFF7ED", accent: "#EA580C" },  // Topaz
      { color: "#831843", bg: "#FDF2F8", accent: "#DB2777" },  // Garnet
      { color: "#164E63", bg: "#ECFEFF", accent: "#0891B2" },  // Aquamarine
      { color: "#3B0764", bg: "#FAF5FF", accent: "#A855F7" },  // Tanzanite
    ],
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    colors: [
      { color: "#164E63", bg: "#ECFEFF", accent: "#06B6D4" },  // Cyan
      { color: "#1E3A8A", bg: "#DBEAFE", accent: "#3B82F6" },  // Deep Blue
      { color: "#065F46", bg: "#D1FAE5", accent: "#10B981" },  // Seafoam
      { color: "#0F766E", bg: "#CCFBF1", accent: "#14B8A6" },  // Teal
      { color: "#1E40AF", bg: "#EFF6FF", accent: "#60A5FA" },  // Periwinkle
      { color: "#115E59", bg: "#F0FDFA", accent: "#2DD4BF" },  // Mint
      { color: "#1D4ED8", bg: "#DBEAFE", accent: "#818CF8" },  // Indigo
      { color: "#155E75", bg: "#CFFAFE", accent: "#22D3EE" },  // Turquoise
    ],
  },
  sunset: {
    id: "sunset",
    label: "Warm Sunset",
    colors: [
      { color: "#9A3412", bg: "#FFF7ED", accent: "#F97316" },  // Orange
      { color: "#991B1B", bg: "#FEF2F2", accent: "#EF4444" },  // Crimson
      { color: "#92400E", bg: "#FFFBEB", accent: "#F59E0B" },  // Amber
      { color: "#9D174D", bg: "#FDF2F8", accent: "#EC4899" },  // Hot Pink
      { color: "#7C2D12", bg: "#FFEDD5", accent: "#EA580C" },  // Burnt Orange
      { color: "#854D0E", bg: "#FEFCE8", accent: "#EAB308" },  // Saffron
      { color: "#881337", bg: "#FFF1F2", accent: "#F43F5E" },  // Rose
      { color: "#78350F", bg: "#FEF3C7", accent: "#D97706" },  // Honey
    ],
  },
  pastel: {
    id: "pastel",
    label: "Pastel",
    colors: [
      { color: "#BE185D", bg: "#FCE7F3", accent: "#F9A8D4" },  // Rose
      { color: "#7C3AED", bg: "#EDE9FE", accent: "#C4B5FD" },  // Lavender
      { color: "#155E75", bg: "#CFFAFE", accent: "#67E8F9" },  // Baby Blue
      { color: "#065F46", bg: "#D1FAE5", accent: "#6EE7B7" },  // Mint
      { color: "#92400E", bg: "#FEF3C7", accent: "#FCD34D" },  // Buttercup
      { color: "#9F1239", bg: "#FFE4E6", accent: "#FDA4AF" },  // Blush
      { color: "#4F46E5", bg: "#E0E7FF", accent: "#A5B4FC" },  // Periwinkle
      { color: "#115E59", bg: "#CCFBF1", accent: "#5EEAD4" },  // Sage
    ],
  },
  monochrome: {
    id: "monochrome",
    label: "Monochrome",
    colors: [
      { color: "#18181B", bg: "#F4F4F5", accent: "#71717A" },  // Zinc 900
      { color: "#27272A", bg: "#FAFAFA", accent: "#A1A1AA" },  // Zinc 800
      { color: "#3F3F46", bg: "#F4F4F5", accent: "#52525B" },  // Zinc 700
      { color: "#1C1917", bg: "#F5F5F4", accent: "#78716C" },  // Stone 900
      { color: "#292524", bg: "#FAFAF9", accent: "#A8A29E" },  // Stone 800
      { color: "#44403C", bg: "#F5F5F4", accent: "#57534E" },  // Stone 700
      { color: "#1F2937", bg: "#F3F4F6", accent: "#6B7280" },  // Gray 800
      { color: "#374151", bg: "#F9FAFB", accent: "#9CA3AF" },  // Gray 700
    ],
  },
};

export const DEFAULT_PALETTE_ID = "classic";

export const getPaletteColors = (paletteId) =>
  COLOR_PALETTES[paletteId]?.colors || COLOR_PALETTES[DEFAULT_PALETTE_ID].colors;

// Backward compat: PERIOD_COLORS is the classic palette
export const PERIOD_COLORS = COLOR_PALETTES.classic.colors;

export const DEFAULT_PERIODS = [
  { id: "wwi", label: "World War I", color: "#991B1B", bg: "#FEE2E2", accent: "#EF4444", era: [1914, 1920] },
  { id: "depression", label: "Great Depression", color: "#92400E", bg: "#FEF3C7", accent: "#F59E0B", era: [1929, 1941] },
  { id: "wwii", label: "World War II", color: "#1E40AF", bg: "#DBEAFE", accent: "#3B82F6", era: [1939, 1945] },
  { id: "coldwar", label: "Cold War", color: "#5B21B6", bg: "#EDE9FE", accent: "#8B5CF6", era: [1945, 1991] },
];

export const getPeriod = (periods, id) => periods.find((p) => p.id === id);

export const TAGS = [
  "Political",
  "Economic",
  "Social",
  "Cultural",
  "Military",
  "Geographic",
  "Legal",
  "Technological",
  "Religious",
];

export const SOURCE_TYPES = [
  { id: "primary", label: "Primary Source", color: "#059669", bg: "#D1FAE5" },
  { id: "secondary", label: "Secondary Source", color: "#6366F1", bg: "#EEF2FF" },
];

export const DEFAULT_FIELD_CONFIG = {
  title: "mandatory",
  year: "mandatory",
  month: "hidden",
  day: "hidden",
  endDate: "hidden",
  period: "mandatory",
  tags: "mandatory",
  sourceType: "mandatory",
  description: "mandatory",
  sourceNote: "mandatory",
  sourceUrl: "optional",
  imageUrl: "optional",
  region: "optional",
  location: "optional",
};
