import { useState } from "react";
import { useTheme, FONT_SIZES } from "../contexts/ThemeContext";
import { floorToDecade, ceilToDecade } from "../utils/dateUtils";

export default function TimelineRangeEditor({ draftRange, onRangeChange, inputStyle }) {
  const { theme } = useTheme();

  const [startStr, setStartStr] = useState(String(draftRange.start));
  const [endStr, setEndStr] = useState(String(draftRange.end));

  // Sync local strings when parent resets draft (e.g. discard)
  const [prevRange, setPrevRange] = useState(draftRange);
  if (draftRange !== prevRange) {
    setPrevRange(draftRange);
    setStartStr(String(draftRange.start));
    setEndStr(String(draftRange.end));
  }

  const labelStyle = {
    fontSize: FONT_SIZES.micro,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    marginBottom: 3,
    display: "block",
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="timeline-range-start" style={labelStyle}>Start</label>
          <input
            id="timeline-range-start"
            type="number"
            value={startStr}
            step={10}
            onChange={(e) => setStartStr(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            onBlur={() => {
              const v = floorToDecade(Math.min(Number(startStr), draftRange.end - 10));
              onRangeChange({ ...draftRange, start: v });
              setStartStr(String(v));
            }}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
        <span style={{ fontSize: FONT_SIZES.tiny, color: theme.textMuted, marginTop: 14 }}>&ndash;</span>
        <div style={{ flex: 1 }}>
          <label htmlFor="timeline-range-end" style={labelStyle}>End</label>
          <input
            id="timeline-range-end"
            type="number"
            value={endStr}
            step={10}
            onChange={(e) => setEndStr(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            onBlur={() => {
              const v = ceilToDecade(Math.max(draftRange.start + 10, Number(endStr)));
              onRangeChange({ ...draftRange, end: v });
              setEndStr(String(v));
            }}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      </div>
      <div style={{
        fontSize: FONT_SIZES.micro,
        color: theme.textMuted,
        marginTop: 6,
        textAlign: "center",
        letterSpacing: "0.05em",
      }}>
        {draftRange.end - draftRange.start} year span &middot; snaps to decade
      </div>
    </>
  );
}
