export const UNITS = [
  { id: "wwi", label: "World War I", short: "WWI", color: "#991B1B", bg: "#FEE2E2", accent: "#EF4444", era: [1914, 1920] },
  { id: "depression", label: "Great Depression", short: "Depression", color: "#92400E", bg: "#FEF3C7", accent: "#F59E0B", era: [1929, 1941] },
  { id: "wwii", label: "World War II", short: "WWII", color: "#1E40AF", bg: "#DBEAFE", accent: "#3B82F6", era: [1939, 1945] },
  { id: "coldwar", label: "Cold War", short: "Cold War", color: "#5B21B6", bg: "#EDE9FE", accent: "#8B5CF6", era: [1945, 1991] },
];

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

export const getUnit = (id) => UNITS.find((u) => u.id === id);