import { useState, useEffect, useRef } from "react";
import { PERIOD_COLORS } from "../data/constants";
import { Icon } from "@iconify/react";
import lockOutline from "@iconify-icons/mdi/lock-outline";
import lockOpenVariantOutline from "@iconify-icons/mdi/lock-open-variant-outline";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import eyeOffOutline from "@iconify-icons/mdi/eye-off-outline";
import formatQuoteOpenOutline from "@iconify-icons/mdi/format-quote-open-outline";
import checkIcon from "@iconify-icons/mdi/check";
import formTextboxIcon from "@iconify-icons/mdi/form-textbox";
import plusIcon from "@iconify-icons/mdi/plus";
import cogOutline from "@iconify-icons/mdi/cog-outline";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import SectionConfiguration from "./SectionConfiguration";
import StudentRoster from "./StudentRoster";

const currentYear = new Date().getFullYear();
const floorToDecade = (value) => Math.floor(value / 10) * 10;
const ceilToDecade = (value) => Math.ceil(value / 10) * 10;

export default function AdminPanel({
  theme,
  section,
  getSectionName,
  // Shared state
  timelineStart,
  timelineEnd,
  periods,
  compellingQuestion,
  activeFieldConfig,
  activeSections,
  allStudentAssignments,
  selectedPeriod,
  // Setters for shared state
  setPeriods,
  setCompellingQuestion,
  setFieldConfig,
  setSelectedPeriod,
  setTimelineStart,
  setTimelineEnd,
  // Editing-defaults flags (owned by App.js, needed by subscriptions)
  editingDefaults,
  setEditingDefaults,
  cqEditingDefaults,
  setCqEditingDefaults,
  timelineRangeEditingDefaults,
  setTimelineRangeEditingDefaults,
  fieldConfigEditingDefaults,
  setFieldConfigEditingDefaults,
  // Persist callbacks
  persistTimelineRange,
  persistPeriods,
  persistCompellingQuestion,
  persistFieldConfig,
  // Editing refs (shared with App.js subscriptions)
  isEditingTimelineRangeRef,
  isEditingPeriodsRef,
  isEditingCQRef,
  isEditingFieldConfigRef,
  // Section actions
  handleAddSection,
  handleDeleteSection,
  handleRenameSection,
  reassignStudentSection,
  removeStudentSection,
}) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  // Admin-internal editing state
  const [draftStart, setDraftStart] = useState(String(timelineStart));
  const [draftEnd, setDraftEnd] = useState(String(timelineEnd));
  const [timelineRangeLocked, setTimelineRangeLocked] = useState(true);
  const [periodsLocked, setPeriodsLocked] = useState(true);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [draftEraStart, setDraftEraStart] = useState("");
  const [draftEraEnd, setDraftEraEnd] = useState("");
  const [cqLocked, setCqLocked] = useState(true);
  const [draftCQText, setDraftCQText] = useState(compellingQuestion.text || "");
  const [draftCQEnabled, setDraftCQEnabled] = useState(compellingQuestion.enabled || false);
  const [fieldConfigLocked, setFieldConfigLocked] = useState(true);
  const [sectionsLocked, setSectionsLocked] = useState(true);

  // Sync drafts from shared state when not editing
  useEffect(() => {
    if (timelineRangeLocked) {
      setDraftStart(String(timelineStart));
      setDraftEnd(String(timelineEnd));
    }
  }, [timelineStart, timelineEnd, timelineRangeLocked]);

  useEffect(() => {
    if (cqLocked) {
      setDraftCQText(compellingQuestion.text || "");
      setDraftCQEnabled(compellingQuestion.enabled || false);
    }
  }, [compellingQuestion, cqLocked]);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  // Reset internal editing state on section change
  useEffect(() => {
    setPeriodsLocked(true);
    setEditingPeriodId(null);
    setCqLocked(true);
  }, [section]);

  const openPeriodEdit = (period) => {
    setEditingPeriodId(period.id);
    setDraftEraStart(String(period.era[0]));
    setDraftEraEnd(String(period.era[1]));
  };

  const commitEra = (periodId) => {
    const s = Number(draftEraStart) || 0;
    const e = Number(draftEraEnd) || 0;
    const newPeriods = periods.map((x) => x.id === periodId ? { ...x, era: [s, Math.max(s + 1, e)] } : x);
    setPeriods(newPeriods);
    persistPeriods(newPeriods);
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setShowPanel((prev) => !prev)}
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: showPanel ? theme.bg : theme.teacherGreen,
          fontFamily: "'Overpass Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: showPanel ? theme.teacherGreen : theme.teacherGreenSubtle,
          padding: "3px 8px",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { if (!showPanel) e.currentTarget.style.background = theme.teacherGreen + "35"; }}
        onMouseLeave={(e) => { if (!showPanel) e.currentTarget.style.background = theme.teacherGreenSubtle; }}
      >
        <Icon icon={cogOutline} width={12} />
        Admin
        <Icon icon={chevronDown} width={12} style={{
          transform: showPanel ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s",
        }} />
      </button>
      {showPanel && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: theme.cardBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 8,
            padding: 12,
            minWidth: 280,
            zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            fontFamily: "'Overpass Mono', monospace",
          }}
        >
          {/* Timeline Range */}
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.mutedText,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            Timeline Range{timelineRangeEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => {
                  setTimelineRangeEditingDefaults((v) => !v);
                  setTimelineRangeLocked(true);
                  isEditingTimelineRangeRef.current = false;
                }}
                title={timelineRangeEditingDefaults ? "Switch to section range" : "Edit default range (applies to all sections)"}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  fontFamily: "'Overpass Mono', monospace",
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${timelineRangeEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                  background: timelineRangeEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                  color: timelineRangeEditingDefaults ? theme.teacherGreen : theme.textMuted,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!timelineRangeEditingDefaults) { e.currentTarget.style.borderColor = theme.teacherGreen; e.currentTarget.style.color = theme.teacherGreen; } }}
                onMouseLeave={(e) => { if (!timelineRangeEditingDefaults) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
              >
                Default
              </button>
              <button
                onClick={() => {
                  setTimelineRangeLocked((v) => {
                    isEditingTimelineRangeRef.current = v;
                    return !v;
                  });
                }}
                title={timelineRangeLocked ? "Unlock to edit" : "Lock value"}
                style={{
                  background: "none",
                  border: "none",
                  padding: 2,
                  cursor: "pointer",
                  color: timelineRangeLocked ? theme.textMuted : theme.teacherGreen,
                  display: "inline-flex",
                  transition: "color 0.15s",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = theme.teacherGreen; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = timelineRangeLocked ? theme.textMuted : theme.teacherGreen; }}
              >
                <Icon icon={timelineRangeLocked ? lockOutline : lockOpenVariantOutline} width={12} />
              </button>
            </div>
          </div>

          {timelineRangeEditingDefaults && (
            <div style={{
              fontSize: 9,
              color: theme.textMuted,
              fontStyle: "italic",
              marginBottom: 6,
              letterSpacing: "0.03em",
            }}>
              Edits apply to all sections &amp; future sections
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: 9,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 3,
                display: "block",
              }}>Start</label>
              <input
                type="number"
                value={draftStart}
                step={10}
                disabled={timelineRangeLocked}
                onChange={(e) => setDraftStart(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                onBlur={() => {
                  const v = floorToDecade(Math.max(0, Math.min(Number(draftStart), timelineEnd - 10)));
                  setTimelineStart(v);
                  setDraftStart(String(v));
                  isEditingTimelineRangeRef.current = true;
                  persistTimelineRange(v, timelineEnd);
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: `1.5px solid ${theme.inputBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                  opacity: timelineRangeLocked ? 0.5 : 1,
                  cursor: timelineRangeLocked ? "not-allowed" : "text",
                  transition: "opacity 0.15s",
                }}
              />
            </div>
            <span style={{
              fontSize: 12,
              color: theme.textMuted,
              marginTop: 14,
            }}>–</span>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: 9,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 3,
                display: "block",
              }}>End</label>
              <input
                type="number"
                value={draftEnd}
                step={10}
                disabled={timelineRangeLocked}
                onChange={(e) => setDraftEnd(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                onBlur={() => {
                  const maxEnd = ceilToDecade(currentYear);
                  const v = ceilToDecade(Math.max(timelineStart + 10, Math.min(Number(draftEnd), maxEnd)));
                  setTimelineEnd(v);
                  setDraftEnd(String(v));
                  isEditingTimelineRangeRef.current = true;
                  persistTimelineRange(timelineStart, v);
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: `1.5px solid ${theme.inputBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "'Overpass Mono', monospace",
                  fontWeight: 700,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                  opacity: timelineRangeLocked ? 0.5 : 1,
                  cursor: timelineRangeLocked ? "not-allowed" : "text",
                  transition: "opacity 0.15s",
                }}
              />
            </div>
          </div>
          <div style={{
            fontSize: 9,
            color: theme.textMuted,
            marginTop: 6,
            textAlign: "center",
            letterSpacing: "0.05em",
          }}>
            {timelineEnd - timelineStart} year span · snaps to decade
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: theme.inputBorder, margin: "10px 0" }} />

          {/* Periods section */}
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.mutedText,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>
              Time Periods{editingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => {
                  setEditingDefaults((v) => !v);
                  setPeriodsLocked(true);
                  isEditingPeriodsRef.current = false;
                  setEditingPeriodId(null);
                }}
                title={editingDefaults ? "Switch to section time periods" : "Edit default time periods (applies to all sections)"}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  fontFamily: "'Overpass Mono', monospace",
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${editingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                  background: editingDefaults ? theme.teacherGreen + "20" : "transparent",
                  color: editingDefaults ? theme.teacherGreen : theme.textMuted,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!editingDefaults) { e.currentTarget.style.borderColor = theme.teacherGreen; e.currentTarget.style.color = theme.teacherGreen; } }}
                onMouseLeave={(e) => { if (!editingDefaults) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
              >
                Default
              </button>
              <button
                onClick={() => {
                  setPeriodsLocked((v) => {
                    isEditingPeriodsRef.current = v;
                    return !v;
                  });
                }}
                title={periodsLocked ? "Unlock to edit" : "Lock time periods"}
                style={{
                  background: "none",
                  border: "none",
                  padding: 2,
                  cursor: "pointer",
                  color: periodsLocked ? theme.textMuted : theme.teacherGreen,
                  display: "inline-flex",
                  transition: "color 0.15s",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = theme.teacherGreen; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = periodsLocked ? theme.textMuted : theme.teacherGreen; }}
              >
                <Icon icon={periodsLocked ? lockOutline : lockOpenVariantOutline} width={12} />
              </button>
            </div>
          </div>

          {editingDefaults && (
            <div style={{
              fontSize: 9,
              color: theme.textMuted,
              fontStyle: "italic",
              marginBottom: 6,
              letterSpacing: "0.03em",
            }}>
              Edits apply to all sections &amp; future sections
            </div>
          )}

          {/* Period list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {periods.length === 0 && (
              <div style={{
                fontSize: 10,
                color: theme.textMuted,
                fontStyle: "italic",
                padding: "4px 6px",
              }}>
                No time periods configured
              </div>
            )}
            {periods.map((p) => {
              const isEditing = editingPeriodId === p.id && !periodsLocked;
              return (
                <div key={p.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px",
                      borderRadius: 4,
                      background: isEditing ? theme.subtleBg : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
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
                      {p.era[0]}–{p.era[1]}
                    </span>
                    {!periodsLocked && (
                      <>
                        <button
                          onClick={() => isEditing ? setEditingPeriodId(null) : openPeriodEdit(p)}
                          title="Edit time period"
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: isEditing ? theme.teacherGreen : theme.textMuted,
                            display: "inline-flex",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.color = theme.textPrimary; }}
                          onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.color = theme.textMuted; }}
                        >
                          <Icon icon={pencilOutline} width={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete "${p.label}"? Events assigned to this time period will lose their time period.`)) return;
                            const newPeriods = periods.filter((x) => x.id !== p.id);
                            setPeriods(newPeriods);
                            persistPeriods(newPeriods);
                            if (selectedPeriod === p.id) setSelectedPeriod("all");
                            if (editingPeriodId === p.id) setEditingPeriodId(null);
                          }}
                          title="Delete time period"
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.errorRed}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: theme.textMuted,
                            display: "inline-flex",
                            transition: "color 0.15s",
                          }}
                        >
                          <Icon icon={closeCircleOutline} width={11} />
                        </button>
                      </>
                    )}
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
                            setPeriods((prev) =>
                              prev.map((x) => x.id === p.id ? { ...x, label: val } : x)
                            );
                          }
                        }}
                        onBlur={(e) => {
                          const finalLabel = e.target.value.trim() || "Untitled Time Period";
                          const newPeriods = periods.map((x) => x.id === p.id ? { ...x, label: finalLabel } : x);
                          setPeriods(newPeriods);
                          persistPeriods(newPeriods);
                        }}
                        placeholder="Time period label"
                        style={{
                          padding: "5px 8px",
                          border: `1.5px solid ${theme.inputBorder}`,
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: "'Overpass Mono', monospace",
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
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            border: `1.5px solid ${theme.inputBorder}`,
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            background: theme.inputBg,
                            color: theme.textPrimary,
                            outline: "none",
                            boxSizing: "border-box",
                            textAlign: "center",
                          }}
                        />
                        <span style={{ fontSize: 10, color: theme.textMuted }}>–</span>
                        <input
                          type="number"
                          value={draftEraEnd}
                          onChange={(e) => setDraftEraEnd(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                          onBlur={() => commitEra(p.id)}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            border: `1.5px solid ${theme.inputBorder}`,
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "'Overpass Mono', monospace",
                            background: theme.inputBg,
                            color: theme.textPrimary,
                            outline: "none",
                            boxSizing: "border-box",
                            textAlign: "center",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {PERIOD_COLORS.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const newPeriods = periods.map((x) => x.id === p.id ? { ...x, color: c.color, bg: c.bg, accent: c.accent } : x);
                              setPeriods(newPeriods);
                              persistPeriods(newPeriods);
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
          {!periodsLocked && (
            <button
              onClick={() => {
                const newId = "period-" + Date.now();
                const colorIdx = periods.length % PERIOD_COLORS.length;
                const c = PERIOD_COLORS[colorIdx];
                const newPeriod = {
                  id: newId,
                  label: "New Time Period",
                  color: c.color,
                  bg: c.bg,
                  accent: c.accent,
                  era: [timelineStart, timelineEnd],
                };
                const newPeriods = [...periods, newPeriod];
                setPeriods(newPeriods);
                persistPeriods(newPeriods);
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
                fontFamily: "'Overpass Mono', monospace",
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
          )}

          {/* Divider */}
          <div style={{ height: 1, background: theme.inputBorder, margin: "10px 0" }} />

          {/* Compelling Question section */}
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.mutedText,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon icon={formatQuoteOpenOutline} width={12} />
              Question{cqEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => {
                  setCqEditingDefaults((v) => !v);
                  setCqLocked(true);
                  isEditingCQRef.current = false;
                }}
                title={cqEditingDefaults ? "Switch to section question" : "Edit default question (applies to all sections)"}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  fontFamily: "'Overpass Mono', monospace",
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${cqEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                  background: cqEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                  color: cqEditingDefaults ? theme.teacherGreen : theme.textMuted,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!cqEditingDefaults) { e.currentTarget.style.borderColor = theme.teacherGreen; e.currentTarget.style.color = theme.teacherGreen; } }}
                onMouseLeave={(e) => { if (!cqEditingDefaults) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
              >
                Default
              </button>
              <button
                onClick={() => {
                  setCqLocked((v) => {
                    isEditingCQRef.current = v;
                    return !v;
                  });
                }}
                title={cqLocked ? "Unlock to edit" : "Lock question"}
                style={{
                  background: "none",
                  border: "none",
                  padding: 2,
                  cursor: "pointer",
                  color: cqLocked ? theme.textMuted : theme.teacherGreen,
                  display: "inline-flex",
                  transition: "color 0.15s",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = theme.teacherGreen; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = cqLocked ? theme.textMuted : theme.teacherGreen; }}
              >
                <Icon icon={cqLocked ? lockOutline : lockOpenVariantOutline} width={12} />
              </button>
            </div>
          </div>

          {cqEditingDefaults && (
            <div style={{
              fontSize: 9,
              color: theme.textMuted,
              fontStyle: "italic",
              marginBottom: 6,
              letterSpacing: "0.03em",
            }}>
              Edits apply to all sections &amp; future sections
            </div>
          )}

          {/* Enable/disable toggle */}
          <button
            onClick={() => {
              if (cqLocked) return;
              setDraftCQEnabled((v) => !v);
              isEditingCQRef.current = true;
            }}
            disabled={cqLocked}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 6px",
              borderRadius: 4,
              border: "none",
              background: "transparent",
              cursor: cqLocked ? "not-allowed" : "pointer",
              opacity: cqLocked ? 0.5 : 1,
              fontSize: 10,
              fontFamily: "'Overpass Mono', monospace",
              color: draftCQEnabled ? theme.teacherGreen : theme.textMuted,
              fontWeight: 600,
              transition: "all 0.15s",
              marginBottom: 6,
            }}
            onMouseEnter={(e) => { if (!cqLocked) e.currentTarget.style.background = theme.subtleBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Icon icon={draftCQEnabled ? eyeOutline : eyeOffOutline} width={13} />
            {draftCQEnabled ? "Visible to students" : "Hidden from students"}
          </button>

          {/* Question text field */}
          <textarea
            value={draftCQText}
            disabled={cqLocked}
            onChange={(e) => {
              setDraftCQText(e.target.value);
              isEditingCQRef.current = true;
            }}
            placeholder="e.g., How did global conflicts reshape the American identity?"
            style={{
              width: "100%",
              padding: "8px 10px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "'Newsreader', 'Georgia', serif",
              background: theme.inputBg,
              color: theme.textPrimary,
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              minHeight: 60,
              opacity: cqLocked ? 0.5 : 1,
              cursor: cqLocked ? "not-allowed" : "text",
              transition: "opacity 0.15s",
            }}
          />

          {/* Update button */}
          {!cqLocked && (draftCQText !== compellingQuestion.text || draftCQEnabled !== compellingQuestion.enabled) && (
            <button
              onClick={() => {
                const updated = { text: draftCQText, enabled: draftCQEnabled };
                setCompellingQuestion(updated);
                persistCompellingQuestion(updated);
                isEditingCQRef.current = false;
              }}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "6px 0",
                border: "none",
                borderRadius: 4,
                background: theme.teacherGreen,
                color: "#fff",
                fontSize: 10,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              <Icon icon={checkIcon} width={13} />
              Update
            </button>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: theme.inputBorder, margin: "10px 0" }} />

          {/* Entry Fields Config section */}
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.mutedText,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon icon={formTextboxIcon} width={12} />
              Entry Fields{fieldConfigEditingDefaults ? " · Default" : section !== "all" ? ` · ${getSectionName(section)}` : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => {
                  setFieldConfigEditingDefaults((v) => !v);
                  setFieldConfigLocked(true);
                  isEditingFieldConfigRef.current = false;
                }}
                title={fieldConfigEditingDefaults ? "Switch to section fields" : "Edit default fields (applies to all sections)"}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  fontFamily: "'Overpass Mono', monospace",
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${fieldConfigEditingDefaults ? theme.teacherGreen : theme.inputBorder}`,
                  background: fieldConfigEditingDefaults ? theme.teacherGreen + "20" : "transparent",
                  color: fieldConfigEditingDefaults ? theme.teacherGreen : theme.textMuted,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!fieldConfigEditingDefaults) { e.currentTarget.style.borderColor = theme.teacherGreen; e.currentTarget.style.color = theme.teacherGreen; } }}
                onMouseLeave={(e) => { if (!fieldConfigEditingDefaults) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
              >
                Default
              </button>
              <button
                onClick={() => {
                  setFieldConfigLocked((v) => {
                    isEditingFieldConfigRef.current = v;
                    return !v;
                  });
                }}
                title={fieldConfigLocked ? "Unlock to edit" : "Lock fields"}
                style={{
                  background: "none",
                  border: "none",
                  padding: 2,
                  cursor: "pointer",
                  color: fieldConfigLocked ? theme.textMuted : theme.teacherGreen,
                  display: "inline-flex",
                  transition: "color 0.15s",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = theme.teacherGreen; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = fieldConfigLocked ? theme.textMuted : theme.teacherGreen; }}
              >
                <Icon icon={fieldConfigLocked ? lockOutline : lockOpenVariantOutline} width={12} />
              </button>
            </div>
          </div>

          {fieldConfigEditingDefaults && (
            <div style={{
              fontSize: 9,
              color: theme.textMuted,
              fontStyle: "italic",
              marginBottom: 6,
              letterSpacing: "0.03em",
            }}>
              Edits apply to all sections &amp; future sections
            </div>
          )}

          {/* Field list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[
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
            ].map(({ key, label }) => {
              const mode = activeFieldConfig[key] || "mandatory";
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
                  {!fieldConfigLocked ? (
                    <div style={{ display: "flex", gap: 2 }}>
                      {allowedModes.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            const updated = { ...activeFieldConfig, [key]: m };
                            setFieldConfig(updated);
                            persistFieldConfig(updated);
                            isEditingFieldConfigRef.current = true;
                          }}
                          style={{
                            fontSize: 8,
                            fontWeight: mode === m ? 700 : 500,
                            fontFamily: "'Overpass Mono', monospace",
                            padding: "2px 5px",
                            borderRadius: 3,
                            border: `1px solid ${mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? "#D97706" : theme.errorRed) : theme.inputBorder}`,
                            background: mode === m ? (m === "mandatory" ? theme.teacherGreen + "20" : m === "optional" ? "#D9770620" : theme.errorRed + "20") : "transparent",
                            color: mode === m ? (m === "mandatory" ? theme.teacherGreen : m === "optional" ? "#D97706" : theme.errorRed) : theme.textMuted,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { if (mode !== m) { const c = m === "mandatory" ? theme.teacherGreen : m === "optional" ? "#D97706" : theme.errorRed; e.currentTarget.style.borderColor = c; e.currentTarget.style.color = c; } }}
                          onMouseLeave={(e) => { if (mode !== m) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMuted; } }}
                        >
                          {m === "mandatory" ? "Req" : m === "optional" ? "Opt" : "Hide"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 600,
                      fontFamily: "'Overpass Mono', monospace",
                      color: mode === "mandatory" ? theme.teacherGreen : mode === "optional" ? "#D97706" : theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}>
                      {mode === "mandatory" ? "Required" : mode === "optional" ? "Optional" : "Hidden"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: theme.inputBorder, margin: "10px 0" }} />

          {/* Sections config */}
          <SectionConfiguration
            sections={activeSections}
            locked={sectionsLocked}
            onToggleLock={() => setSectionsLocked((v) => !v)}
            onAdd={handleAddSection}
            onDelete={handleDeleteSection}
            onRename={handleRenameSection}
            theme={theme}
          />

          <StudentRoster
            students={allStudentAssignments}
            sections={activeSections}
            onReassign={reassignStudentSection}
            onRemove={removeStudentSection}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
