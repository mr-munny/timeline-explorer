import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "timeline-explorer-theme";
export const FONT_MONO = "'Overpass Mono', monospace";
export const FONT_SERIF = "'Newsreader', 'Georgia', serif";

// --- Design Tokens (theme-independent) ---

export const FONT_SIZES = {
  micro: "0.6875rem", // 11px — labels, timestamps, micro-metadata
  tiny: "0.75rem",    // 12px — filter labels, tag pills, sidebar headings
  sm: "0.8125rem",    // 13px — form labels, button text, metadata
  base: "0.875rem",   // 14px — body text, inputs, descriptions
  md: "1rem",         // 16px — card titles, modal subtitles
  lg: "1.25rem",      // 20px — compelling question, section headers
  xl: "1.375rem",     // 22px — modal titles, admin section name
  xxl: "1.75rem",     // 28px — page titles, h1s
};

export const LINE_HEIGHTS = {
  tight: 1.2,    // headings, badges
  snug: 1.35,    // card titles
  normal: 1.5,   // form inputs, short text
  relaxed: 1.6,  // body text, descriptions
};

export const SPACING = {
  "0.5": "0.125rem", // 2px
  "1": "0.25rem",    // 4px
  "1.5": "0.375rem", // 6px
  "2": "0.5rem",     // 8px
  "2.5": "0.625rem", // 10px
  "3": "0.75rem",    // 12px
  "4": "1rem",       // 16px
  "5": "1.25rem",    // 20px
  "6": "1.5rem",     // 24px
  "8": "2rem",       // 32px
  "10": "2.5rem",    // 40px
};

export const RADII = {
  sm: "4px",      // badges, tags, small buttons
  md: "6px",      // form inputs, filter buttons
  lg: "8px",      // primary buttons, card sub-sections
  xl: "10px",     // event cards
  "2xl": "14px",  // modals, login card
  pill: "9999px", // period filter pills
};

export const Z_INDEX = {
  base: 0,
  timeline: 2,
  timelineActive: 4,
  dropdown: 10,
  overlay: 100,
  modal: 1000,
  lightbox: 9999,
  toast: 10000,
};

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
  textSecondary: "#6B7280",
  textTertiary: "#52525B",
  textDescription: "#374151",
  textMuted: "#767676",
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

  feedbackAmber: "#D97706",
  feedbackAmberText: "#92400E",
  feedbackAmberBg: "#FEF3C7",

  modalOverlay: "rgba(0,0,0,0.4)",
  modalShadow: "0 24px 48px rgba(0,0,0,0.15)",

  focusRing: "#2563EB",

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

  feedbackAmber: "#D97706",
  feedbackAmberText: "#FDE68A",
  feedbackAmberBg: "#422006",

  modalOverlay: "rgba(0,0,0,0.6)",
  modalShadow: "0 24px 48px rgba(0,0,0,0.4)",

  focusRing: "#60A5FA",

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

  const getThemedPeriodBg = (period) => {
    if (!period) return null;
    return mode === "dark" ? period.color + "20" : period.bg;
  };
  const getThemedSourceTypeBg = (sourceTypeId) => theme.sourceTypeBg[sourceTypeId] || null;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, getThemedPeriodBg, getThemedSourceTypeBg }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
