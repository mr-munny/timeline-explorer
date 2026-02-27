import { useState } from "react";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import { useTheme } from "../contexts/ThemeContext";

export default function SectionPicker({ sections, onSelect, userName }) {
  const { theme } = useTheme();
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (sectionId) => {
    setSelecting(true);
    try {
      await onSelect(sectionId);
    } catch (err) {
      console.error("Section assignment failed:", err);
      setSelecting(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Newsreader', 'Georgia', serif",
        background: theme.pageBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: theme.textPrimary,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
          padding: "40px 36px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: theme.cardShadow,
          border: `1.5px solid ${theme.cardBorder}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.accentGold,
            fontFamily: "'Overpass Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: theme.accentGoldSubtle,
            padding: "3px 8px",
            borderRadius: 4,
            display: "inline-block",
            marginBottom: 12,
          }}
        >
          Historian's Workshop
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 6px 0",
            fontFamily: "'Newsreader', 'Georgia', serif",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon icon={chartTimelineVariantShimmer} width={28} style={{ color: "#F59E0B" }} />
          Timeline Explorer
        </h1>

        <p
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            margin: "0 0 6px 0",
            fontFamily: "'Newsreader', 'Georgia', serif",
          }}
        >
          Welcome, {userName}!
        </p>

        <p
          style={{
            fontSize: 12,
            color: theme.textMuted,
            margin: "0 0 24px 0",
            fontFamily: "'Overpass Mono', monospace",
          }}
        >
          Select your class period to get started
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              disabled={selecting}
              style={{
                padding: "14px 20px",
                background: theme.activeToggleBg,
                color: theme.activeToggleText,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
                cursor: selecting ? "default" : "pointer",
                letterSpacing: "0.02em",
                transition: "all 0.15s",
                opacity: selecting ? 0.6 : 1,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {sections.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: theme.textMuted,
              margin: "16px 0 0 0",
              fontFamily: "'Overpass Mono', monospace",
            }}
          >
            No sections available yet. Ask your teacher to set up class sections.
          </p>
        )}
      </div>
    </div>
  );
}
