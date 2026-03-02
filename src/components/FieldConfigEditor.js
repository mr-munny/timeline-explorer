import { useTheme, FONT_MONO } from "../contexts/ThemeContext";

const FIELD_DEFINITIONS = [
  { key: "title", label: "Event Title" },
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "day", label: "Day" },
  { key: "endDate", label: "End Date" },
  { key: "period", label: "Time Period" },
  { key: "tags", label: "Tags" },
  { key: "sourceType", label: "Source Type" },
  { key: "description", label: "Description" },
  { key: "sourceNote", label: "Source Citation" },
  { key: "sourceUrl", label: "Source URL" },
  { key: "imageUrl", label: "Image URL" },
  { key: "region", label: "Region" },
];

export default function FieldConfigEditor({ draftFieldConfig, onFieldConfigChange }) {
  const { theme } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {FIELD_DEFINITIONS.map(({ key, label }) => {
        const mode = draftFieldConfig[key] || "mandatory";
        const allowedModes = key === "endDate"
          ? ["optional", "hidden"]
          : key === "year"
          ? ["mandatory"]
          : ["mandatory", "optional", "hidden"];
        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 6px",
              borderRadius: 4,
            }}
          >
            <span style={{
              fontSize: 10,
              color: mode === "hidden" ? theme.textMuted : theme.textPrimary,
              flex: 1,
              textDecoration: mode === "hidden" ? "line-through" : "none",
              opacity: mode === "hidden" ? 0.5 : 1,
            }}>
              {label}
            </span>
            <div style={{ display: "flex", gap: 2 }}>
              {allowedModes.map((m) => (
                <button
                  key={m}
                  onClick={() => onFieldConfigChange({ ...draftFieldConfig, [key]: m })}
                  style={{
                    fontSize: 8,
                    fontWeight: mode === m ? 700 : 500,
                    fontFamily: FONT_MONO,
                    padding: "2px 5px",
                    borderRadius: 3,
                    border: `1px solid ${mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? theme.feedbackAmber : theme.errorRed) : theme.inputBorder}`,
                    background: mode === m ? (m === "mandatory" ? theme.teacherGreen + "20" : m === "optional" ? theme.feedbackAmber + "20" : theme.errorRed + "20") : "transparent",
                    color: mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? theme.feedbackAmber : theme.errorRed) : theme.textMuted,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (mode !== m) { const c = m === "mandatory" ? theme.teacherGreen : m === "optional" ? theme.feedbackAmber : theme.errorRed; e.currentTarget.style.borderColor = c; e.currentTarget.style.color = c; } }}
                  onMouseLeave={(e) => { if (mode !== m) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
                >
                  {m === "mandatory" ? "Req" : m === "optional" ? "Opt" : "Hide"}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
