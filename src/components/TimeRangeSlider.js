import { useCallback, useRef } from "react";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";

export default function TimeRangeSlider({ min, max, value, onChange, periods }) {
  const { theme, mode } = useTheme();
  const trackRef = useRef(null);
  const [startVal, endVal] = value;
  const range = max - min || 1;

  const handleChange = useCallback((index, newValue) => {
    const clamped = Math.max(min, Math.min(max, Number(newValue)));
    const next = [...value];
    next[index] = clamped;
    // Ensure start <= end
    if (index === 0 && next[0] > next[1]) next[0] = next[1];
    if (index === 1 && next[1] < next[0]) next[1] = next[0];
    onChange(next);
  }, [min, max, value, onChange]);

  const startPct = ((startVal - min) / range) * 100;
  const endPct = ((endVal - min) / range) * 100;

  const thumbStyle = {
    WebkitAppearance: "none",
    appearance: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "transparent",
    pointerEvents: "none",
    margin: 0,
    padding: 0,
    outline: "none",
    zIndex: 3,
  };

  // Inline <style> for range thumb (can't do pseudo-elements inline)
  const thumbCSS = `
    .time-range-slider input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${theme.activeToggleBg};
      border: 2px solid ${theme.activeToggleText};
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .time-range-slider input[type=range]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${theme.activeToggleBg};
      border: 2px solid ${theme.activeToggleText};
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .time-range-slider input[type=range]::-webkit-slider-runnable-track {
      height: 4px;
      background: transparent;
    }
    .time-range-slider input[type=range]::-moz-range-track {
      height: 4px;
      background: transparent;
    }
  `;

  return (
    <div style={{
      padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[3]}`,
      background: theme.cardBg,
      borderRadius: RADII.xl,
      border: `1.5px solid ${theme.cardBorder}`,
    }}>
      <style>{thumbCSS}</style>

      {/* Year labels */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: SPACING[2],
      }}>
        <span style={{
          fontSize: FONT_SIZES.sm,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          color: theme.textPrimary,
        }}>
          {startVal < 0 ? `${Math.abs(startVal)} BCE` : startVal}
        </span>
        <span style={{
          fontSize: FONT_SIZES.micro,
          fontFamily: FONT_MONO,
          color: theme.textMuted,
          fontWeight: 600,
        }}>
          TIME RANGE
        </span>
        <span style={{
          fontSize: FONT_SIZES.sm,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          color: theme.textPrimary,
        }}>
          {endVal < 0 ? `${Math.abs(endVal)} BCE` : endVal}
        </span>
      </div>

      {/* Track with era bands */}
      <div
        ref={trackRef}
        className="time-range-slider"
        style={{
          position: "relative",
          height: 28,
          borderRadius: RADII.sm,
          overflow: "visible",
        }}
      >
        {/* Background track */}
        <div style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: theme.inputBorder,
          zIndex: 0,
        }} />

        {/* Era bands behind the track */}
        {periods.map((p) => {
          const eraStart = Math.max(p.era[0], min);
          const eraEnd = Math.min(p.era[1], max);
          if (eraEnd <= min || eraStart >= max) return null;
          const left = ((eraStart - min) / range) * 100;
          const width = ((eraEnd - eraStart) / range) * 100;
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                top: 10,
                left: `${left}%`,
                width: `${width}%`,
                height: 8,
                background: mode === "dark" ? p.accent + "40" : p.bg,
                borderRadius: 2,
                zIndex: 1,
              }}
              title={p.label}
            />
          );
        })}

        {/* Selected range highlight */}
        <div style={{
          position: "absolute",
          top: 11,
          left: `${startPct}%`,
          width: `${endPct - startPct}%`,
          height: 6,
          background: theme.activeToggleBg + "50",
          borderRadius: 3,
          zIndex: 2,
        }} />

        {/* Start thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={startVal}
          onChange={(e) => handleChange(0, e.target.value)}
          aria-label="Time range start year"
          style={thumbStyle}
        />

        {/* End thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={endVal}
          onChange={(e) => handleChange(1, e.target.value)}
          aria-label="Time range end year"
          style={{ ...thumbStyle, zIndex: 4 }}
        />
      </div>
    </div>
  );
}
