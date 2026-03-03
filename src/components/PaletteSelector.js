import { useTheme, FONT_MONO, FONT_SIZES } from "../contexts/ThemeContext";
import { COLOR_PALETTES } from "../data/constants";

export default function PaletteSelector({ selectedPaletteId, onSelect }) {
  const { theme } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {Object.values(COLOR_PALETTES).map((palette) => {
        const isSelected = palette.id === selectedPaletteId;
        return (
          <button
            key={palette.id}
            onClick={() => onSelect(palette.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 6,
              border: isSelected
                ? `2px solid ${theme.accentGold}`
                : `1.5px solid ${theme.inputBorder}`,
              background: isSelected ? theme.accentGold + "15" : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = theme.textSecondary;
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = theme.inputBorder;
            }}
          >
            <span style={{
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? theme.textPrimary : theme.textSecondary,
              minWidth: 90,
              textAlign: "left",
            }}>
              {palette.label}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {palette.colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: c.accent,
                    border: `1px solid ${c.color}40`,
                  }}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
