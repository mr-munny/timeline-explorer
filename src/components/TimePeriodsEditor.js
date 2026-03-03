import { useState, useRef } from "react";
import { useTheme, FONT_MONO } from "../contexts/ThemeContext";
import { PERIOD_COLORS } from "../data/constants";
import { Icon } from "@iconify/react";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import plusIcon from "@iconify-icons/mdi/plus";
import IconButton from "./IconButton";

export default function TimePeriodsEditor({ draftPeriods, draftTimelineRange, onPeriodsChange, inputStyle }) {
  const { theme } = useTheme();

  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [draftEraStart, setDraftEraStart] = useState("");
  const [draftEraEnd, setDraftEraEnd] = useState("");
  const selfChangeRef = useRef(false);

  const handlePeriodsChange = (newPeriods) => {
    selfChangeRef.current = true;
    onPeriodsChange(newPeriods);
  };

  const openPeriodEdit = (period) => {
    setEditingPeriodId(period.id);
    setDraftEraStart(String(period.era[0]));
    setDraftEraEnd(String(period.era[1]));
  };

  const commitEra = (periodId) => {
    const s = Number(draftEraStart) || 0;
    const e = Number(draftEraEnd) || 0;
    handlePeriodsChange(
      draftPeriods.map((x) => x.id === periodId ? { ...x, era: [s, Math.max(s + 1, e)] } : x)
    );
  };

  // Close inline edit when parent resets (discard), but not on self-edits
  const [prevPeriods, setPrevPeriods] = useState(draftPeriods);
  if (draftPeriods !== prevPeriods) {
    setPrevPeriods(draftPeriods);
    if (!selfChangeRef.current) {
      setEditingPeriodId(null);
    }
    selfChangeRef.current = false;
  }

  const eraInputStyle = {
    width: "100%",
    padding: "5px 6px",
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: 4,
    fontSize: 11,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    outline: "none",
    boxSizing: "border-box",
    textAlign: "center",
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {draftPeriods.length === 0 && (
          <div style={{
            fontSize: 10,
            color: theme.textMuted,
            fontStyle: "italic",
            padding: "4px 6px",
          }}>
            No time periods configured
          </div>
        )}
        {draftPeriods.map((p) => {
          const isEditing = editingPeriodId === p.id;
          return (
            <div key={p.id}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 6px",
                borderRadius: 4,
                background: isEditing ? theme.subtleBg : "transparent",
                transition: "background 0.15s",
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: p.accent,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 10,
                  color: theme.textPrimary,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {p.label}
                </span>
                <span style={{
                  fontSize: 9,
                  color: theme.textMuted,
                  flexShrink: 0,
                }}>
                  {p.era[0]}&ndash;{p.era[1]}
                </span>
                <IconButton
                  icon={pencilOutline}
                  onClick={() => isEditing ? setEditingPeriodId(null) : openPeriodEdit(p)}
                  title="Edit time period"
                  size={11}
                  color={isEditing ? theme.teacherGreen : theme.textMuted}
                  hoverColor={isEditing ? theme.teacherGreen : theme.textPrimary}
                  padding={0}
                />
                <IconButton
                  icon={closeCircleOutline}
                  onClick={() => {
                    if (!window.confirm(`Delete "${p.label}"? Events assigned to this time period will lose their time period.`)) return;
                    const next = draftPeriods.filter((x) => x.id !== p.id);
                    if (editingPeriodId === p.id) setEditingPeriodId(null);
                    handlePeriodsChange(next);
                  }}
                  title="Delete time period"
                  size={11}
                  color={theme.textMuted}
                  hoverColor={theme.errorRed}
                  padding={0}
                />
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{
                  padding: "8px 6px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}>
                  <input
                    type="text"
                    value={p.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.trim() || val === "") {
                        handlePeriodsChange(
                          draftPeriods.map((x) => x.id === p.id ? { ...x, label: val } : x)
                        );
                      }
                    }}
                    onBlur={(e) => {
                      const finalLabel = e.target.value.trim() || "Untitled Time Period";
                      handlePeriodsChange(
                        draftPeriods.map((x) => x.id === p.id ? { ...x, label: finalLabel } : x)
                      );
                    }}
                    placeholder="Time period label"
                    style={{
                      padding: "5px 8px",
                      border: `1.5px solid ${theme.inputBorder}`,
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: FONT_MONO,
                      background: theme.inputBg,
                      color: theme.textPrimary,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="number"
                      value={draftEraStart}
                      onChange={(e) => setDraftEraStart(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      onBlur={() => commitEra(p.id)}
                      style={eraInputStyle}
                    />
                    <span style={{ fontSize: 10, color: theme.textMuted }}>&ndash;</span>
                    <input
                      type="number"
                      value={draftEraEnd}
                      onChange={(e) => setDraftEraEnd(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      onBlur={() => commitEra(p.id)}
                      style={eraInputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {PERIOD_COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handlePeriodsChange(
                            draftPeriods.map((x) => x.id === p.id ? { ...x, color: c.color, bg: c.bg, accent: c.accent } : x)
                          );
                        }}
                        title={`Color ${i + 1}`}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: c.accent,
                          border: p.color === c.color ? `2px solid ${theme.textPrimary}` : `2px solid transparent`,
                          cursor: "pointer",
                          padding: 0,
                          transition: "border-color 0.15s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add period button */}
      <button
        onClick={() => {
          const newId = "period-" + Date.now();
          const colorIdx = draftPeriods.length % PERIOD_COLORS.length;
          const c = PERIOD_COLORS[colorIdx];
          const newPeriod = {
            id: newId,
            label: "New Time Period",
            color: c.color,
            bg: c.bg,
            accent: c.accent,
            era: [draftTimelineRange.start, draftTimelineRange.end],
          };
          handlePeriodsChange([...draftPeriods, newPeriod]);
          openPeriodEdit(newPeriod);
        }}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "5px 0",
          border: `1.5px dashed ${theme.inputBorder}`,
          borderRadius: 4,
          background: "transparent",
          color: theme.textSecondary,
          fontSize: 10,
          fontFamily: FONT_MONO,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.textSecondary; e.currentTarget.style.color = theme.textPrimary; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textSecondary; }}
      >
        <Icon icon={plusIcon} width={12} />
        Add Time Period
      </button>
    </>
  );
}
