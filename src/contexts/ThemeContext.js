import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "timeline-explorer-theme";

const lightTheme = {
  pageBg: "#F7F7F5",
  pageText: "#1a1a1a",

  headerBg: "#18181B",
  headerText: "#fff",
  headerSubtext: "#71717A",
  headerButtonBg: "#ffffff18",
  headerBorder: "#3f3f46",

  cardBg: "#fff",
  cardBorder: "#EBEBEB",
  cardShadow: "0 8px 24px rgba(0,0,0,0.08)",

  textPrimary: "#1a1a1a",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
  textDescription: "#374151",
  textMuted: "#B0B0B0",
  textDivider: "#D1D5DB",

  inputBg: "#fff",
  inputBorder: "#E5E7EB",

  subtleBg: "#F3F4F6",
  warmSubtleBg: "#FAFAF8",

  activeToggleBg: "#1a1a1a",
  activeToggleText: "#fff",

  accentGold: "#F59E0B",
  accentGoldSubtle: "#F59E0B18",
  errorRed: "#EF4444",
  errorRedBg: "#FEF2F2",
  errorRedBorder: "#FECACA",
  errorRedText: "#991B1B",
  successGreen: "#059669",
  teacherGreen: "#34D399",
  teacherGreenSubtle: "#34D39918",
  seedPurple: "#6366F1",

  modalOverlay: "rgba(0,0,0,0.4)",
  modalShadow: "0 24px 48px rgba(0,0,0,0.15)",

  unitBg: {
    wwi: "#FEE2E2",
    depression: "#FEF3C7",
    wwii: "#DBEAFE",
    coldwar: "#EDE9FE",
  },
  sourceTypeBg: {
    primary: "#D1FAE5",
    secondary: "#EEF2FF",
  },
};

const darkTheme = {
  pageBg: "#0F0F11",
  pageText: "#E4E4E7",

  headerBg: "#18181B",
  headerText: "#fff",
  headerSubtext: "#71717A",
  headerButtonBg: "#ffffff18",
  headerBorder: "#3f3f46",

  cardBg: "#1C1C20",
  cardBorder: "#2E2E33",
  cardShadow: "0 8px 24px rgba(0,0,0,0.3)",

  textPrimary: "#E4E4E7",
  textSecondary: "#71717A",
  textTertiary: "#8B8B96",
  textDescription: "#A1A1AA",
  textMuted: "#52525B",
  textDivider: "#3F3F46",

  inputBg: "#27272A",
  inputBorder: "#3F3F46",

  subtleBg: "#27272A",
  warmSubtleBg: "#1E1E22",

  activeToggleBg: "#E4E4E7",
  activeToggleText: "#18181B",

  accentGold: "#F59E0B",
  accentGoldSubtle: "#F59E0B22",
  errorRed: "#EF4444",
  errorRedBg: "#3B1111",
  errorRedBorder: "#7F1D1D",
  errorRedText: "#FCA5A5",
  successGreen: "#059669",
  teacherGreen: "#34D399",
  teacherGreenSubtle: "#34D39922",
  seedPurple: "#6366F1",

  modalOverlay: "rgba(0,0,0,0.6)",
  modalShadow: "0 24px 48px rgba(0,0,0,0.4)",

  unitBg: {
    wwi: "#991B1B20",
    depression: "#92400E20",
    wwii: "#1E40AF20",
    coldwar: "#5B21B620",
  },
  sourceTypeBg: {
    primary: "#05966920",
    secondary: "#6366F120",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setMode(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", mode === "dark" ? "#0F0F11" : "#18181B");
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  const getThemedUnitBg = (unitId) => theme.unitBg[unitId] || null;
  const getThemedSourceTypeBg = (sourceTypeId) => theme.sourceTypeBg[sourceTypeId] || null;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, getThemedUnitBg, getThemedSourceTypeBg }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
