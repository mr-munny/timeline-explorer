export const PERIOD_COLORS = [
  { color: "#991B1B", bg: "#FEE2E2", accent: "#EF4444" },  // Red
  { color: "#92400E", bg: "#FEF3C7", accent: "#F59E0B" },  // Orange
  { color: "#1E40AF", bg: "#DBEAFE", accent: "#3B82F6" },  // Blue
  { color: "#5B21B6", bg: "#EDE9FE", accent: "#8B5CF6" },  // Purple
  { color: "#065F46", bg: "#D1FAE5", accent: "#10B981" },  // Green
  { color: "#9D174D", bg: "#FCE7F3", accent: "#EC4899" },  // Pink
  { color: "#78350F", bg: "#FEF3C7", accent: "#D97706" },  // Amber
  { color: "#1E3A5F", bg: "#DBEAFE", accent: "#0EA5E9" },  // Sky
];

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
