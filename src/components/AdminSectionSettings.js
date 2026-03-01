import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { PERIOD_COLORS } from "../data/constants";
import { subscribeToPeriods, subscribeToCompellingQuestion, subscribeToTimelineRange, subscribeToFieldConfig, savePeriods, saveCompellingQuestion, saveTimelineRange, saveFieldConfig } from "../services/database";
import { Icon } from "@iconify/react";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import eyeOffOutline from "@iconify-icons/mdi/eye-off-outline";
import formatQuoteOpenOutline from "@iconify-icons/mdi/format-quote-open-outline";
import formTextboxIcon from "@iconify-icons/mdi/form-textbox";
import plusIcon from "@iconify-icons/mdi/plus";
import contentSave from "@iconify-icons/mdi/content-save";
import undoIcon from "@iconify-icons/mdi/undo";
import contentCopy from "@iconify-icons/mdi/content-copy";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import StudentRoster from "./StudentRoster";
import CopySettingsDialog from "./CopySettingsDialog";

const floorToDecade = (value) => Math.floor(value / 10) * 10;
const ceilToDecade = (value) => Math.ceil(value / 10) * 10;

const DEFAULT_FIELD_CONFIG = {
  title: "mandatory",
  year: "mandatory",
  month: "hidden",
  day: "hidden",
  endDate: "hidden",
  period: "mandatory",
  tags: "mandatory",
  sourceType: "mandatory",
  description: "mandatory",
  sourceNote: "optional",
  sourceUrl: "optional",
  imageUrl: "optional",
  region: "optional",
};

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

export default function AdminSectionSettings({
  sectionId,
  sectionName,
  sections,
  allStudentAssignments,
  onDeleteSection,
  onRenameSection,
  reassignStudentSection,
  removeStudentSection,
}) {
  const { theme } = useTheme();

  // Live state (from Firebase)
  const [livePeriods, setLivePeriods] = useState([]);
  const [liveCQ, setLiveCQ] = useState({ text: "", enabled: false });
  const [liveTimelineRange, setLiveTimelineRange] = useState({ start: 1900, end: 2000 });
  const [liveFieldConfig, setLiveFieldConfig] = useState({ ...DEFAULT_FIELD_CONFIG });

  // Draft state (editable)
  const [draftPeriods, setDraftPeriods] = useState([]);
  const [draftCQ, setDraftCQ] = useState({ text: "", enabled: false });
  const [draftTimelineRange, setDraftTimelineRange] = useState({ start: 1900, end: 2000 });
  const [draftFieldConfig, setDraftFieldConfig] = useState({ ...DEFAULT_FIELD_CONFIG });
  const [isDirty, setIsDirty] = useState(false);

  // Period editing
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [draftEraStart, setDraftEraStart] = useState("");
  const [draftEraEnd, setDraftEraEnd] = useState("");

  // Section rename
  const [editingName, setEditingName] = useState(false);
  const [draftSectionName, setDraftSectionName] = useState(sectionName);

  // Timeline range draft inputs
  const [draftStartStr, setDraftStartStr] = useState(String(liveTimelineRange.start));
  const [draftEndStr, setDraftEndStr] = useState(String(liveTimelineRange.end));

  // Copy dialog
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Track if dirty ref for subscription updates
  const isDirtyRef = useRef(false);

  // Reset everything when section changes
  useEffect(() => {
    setIsDirty(false);
    isDirtyRef.current = false;
    setEditingPeriodId(null);
    setEditingName(false);
    setDraftSectionName(sectionName);
  }, [sectionId, sectionName]);

  // Subscribe to periods
  useEffect(() => {
    const unsub = subscribeToPeriods(sectionId, (data) => {
      const periods = data || [];
      setLivePeriods(periods);
      if (!isDirtyRef.current) {
        setDraftPeriods(periods);
      }
    });
    return () => unsub();
  }, [sectionId]);

  // Subscribe to compelling question
  useEffect(() => {
    const unsub = subscribeToCompellingQuestion(sectionId, (data) => {
      const cq = data || { text: "", enabled: false };
      setLiveCQ(cq);
      if (!isDirtyRef.current) {
        setDraftCQ(cq);
      }
    });
    return () => unsub();
  }, [sectionId]);

  // Subscribe to timeline range
  useEffect(() => {
    const unsub = subscribeToTimelineRange(sectionId, (data) => {
      const range = data || { start: 1900, end: 2000 };
      setLiveTimelineRange(range);
      if (!isDirtyRef.current) {
        setDraftTimelineRange(range);
        setDraftStartStr(String(range.start));
        setDraftEndStr(String(range.end));
      }
    });
    return () => unsub();
  }, [sectionId]);

  // Subscribe to field config
  useEffect(() => {
    const unsub = subscribeToFieldConfig(sectionId, (data) => {
      const config = { ...DEFAULT_FIELD_CONFIG, ...(data || {}) };
      setLiveFieldConfig(config);
      if (!isDirtyRef.current) {
        setDraftFieldConfig(config);
      }
    });
    return () => unsub();
  }, [sectionId]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    isDirtyRef.current = true;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        savePeriods(sectionId, draftPeriods),
        saveCompellingQuestion(sectionId, draftCQ),
        saveTimelineRange(sectionId, draftTimelineRange),
        saveFieldConfig(sectionId, draftFieldConfig),
      ]);
      setIsDirty(false);
      isDirtyRef.current = false;
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setSaving(false);
  };

  const handleDiscard = () => {
    setDraftPeriods(livePeriods);
    setDraftCQ(liveCQ);
    setDraftTimelineRange(liveTimelineRange);
    setDraftStartStr(String(liveTimelineRange.start));
    setDraftEndStr(String(liveTimelineRange.end));
    setDraftFieldConfig(liveFieldConfig);
    setEditingPeriodId(null);
    setIsDirty(false);
    isDirtyRef.current = false;
  };

  const handleDeleteSection = () => {
    if (!window.confirm(`Delete "${sectionName}"? Events in this section will only be visible in the All Sections view.`)) return;
    onDeleteSection(sectionId);
  };

  const handleRenameSubmit = () => {
    const trimmed = draftSectionName.trim();
    if (trimmed && trimmed !== sectionName) {
      onRenameSection(sectionId, trimmed);
    }
    setEditingName(false);
  };

  // Period editing helpers
  const openPeriodEdit = (period) => {
    setEditingPeriodId(period.id);
    setDraftEraStart(String(period.era[0]));
    setDraftEraEnd(String(period.era[1]));
  };

  const commitEra = (periodId) => {
    const s = Number(draftEraStart) || 0;
    const e = Number(draftEraEnd) || 0;
    setDraftPeriods((prev) =>
      prev.map((x) => x.id === periodId ? { ...x, era: [s, Math.max(s + 1, e)] } : x)
    );
    markDirty();
  };

  // Section header style
  const sectionHeaderStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const dividerStyle = { height: 1, background: theme.cardBorder, margin: "20px 0" };

  const inputStyle = {
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
  };

  const sectionStudents = allStudentAssignments.filter((s) => s.section === sectionId);

  return (
    <div style={{
      fontFamily: "'Overpass Mono', monospace",
      position: "relative",
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, padding: "24px 32px 100px", maxWidth: 640, width: "100%" }}>
        {/* Section Name Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            {editingName ? (
              <input
                autoFocus
                value={draftSectionName}
                onChange={(e) => setDraftSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setEditingName(false); setDraftSectionName(sectionName); }
                }}
                onBlur={handleRenameSubmit}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "'Newsreader', 'Georgia', serif",
                  border: `1.5px solid ${theme.inputBorder}`,
                  borderRadius: 6,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  padding: "4px 10px",
                  outline: "none",
                }}
              />
            ) : (
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "'Newsreader', 'Georgia', serif",
                  color: theme.textPrimary,
                  margin: 0,
                  cursor: "pointer",
                }}
                onClick={() => { setEditingName(true); setDraftSectionName(sectionName); }}
                title="Click to rename"
              >
                {sectionName}
              </h2>
            )}
            <button
              onClick={() => { setEditingName(true); setDraftSectionName(sectionName); }}
              title="Rename section"
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: theme.textMuted,
                display: "inline-flex",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
            >
              <Icon icon={pencilOutline} width={16} />
            </button>
            <button
              onClick={handleDeleteSection}
              title="Delete section"
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: theme.textMuted,
                display: "inline-flex",
                transition: "color 0.15s",
                marginLeft: "auto",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = theme.errorRed; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
            >
              <Icon icon={deleteOutline} width={16} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.05em" }}>
            ID: {sectionId}
          </div>
        </div>

        {/* Timeline Range */}
        <div style={sectionHeaderStyle}>Timeline Range</div>
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
              value={draftStartStr}
              step={10}
              onChange={(e) => setDraftStartStr(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
              onBlur={() => {
                const v = floorToDecade(Math.min(Number(draftStartStr), draftTimelineRange.end - 10));
                setDraftTimelineRange((prev) => ({ ...prev, start: v }));
                setDraftStartStr(String(v));
                markDirty();
              }}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <span style={{ fontSize: 12, color: theme.textMuted, marginTop: 14 }}>&ndash;</span>
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
              value={draftEndStr}
              step={10}
              onChange={(e) => setDraftEndStr(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
              onBlur={() => {
                const v = ceilToDecade(Math.max(draftTimelineRange.start + 10, Number(draftEndStr)));
                setDraftTimelineRange((prev) => ({ ...prev, end: v }));
                setDraftEndStr(String(v));
                markDirty();
              }}
              style={{ ...inputStyle, width: "100%" }}
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
          {draftTimelineRange.end - draftTimelineRange.start} year span &middot; snaps to decade
        </div>

        <div style={dividerStyle} />

        {/* Time Periods */}
        <div style={sectionHeaderStyle}>Time Periods</div>

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
                      setDraftPeriods((prev) => prev.filter((x) => x.id !== p.id));
                      if (editingPeriodId === p.id) setEditingPeriodId(null);
                      markDirty();
                    }}
                    title="Delete time period"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: theme.textMuted,
                      display: "inline-flex",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.errorRed; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
                  >
                    <Icon icon={closeCircleOutline} width={11} />
                  </button>
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
                          setDraftPeriods((prev) =>
                            prev.map((x) => x.id === p.id ? { ...x, label: val } : x)
                          );
                          markDirty();
                        }
                      }}
                      onBlur={(e) => {
                        const finalLabel = e.target.value.trim() || "Untitled Time Period";
                        setDraftPeriods((prev) =>
                          prev.map((x) => x.id === p.id ? { ...x, label: finalLabel } : x)
                        );
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
                      <span style={{ fontSize: 10, color: theme.textMuted }}>&ndash;</span>
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
                            setDraftPeriods((prev) =>
                              prev.map((x) => x.id === p.id ? { ...x, color: c.color, bg: c.bg, accent: c.accent } : x)
                            );
                            markDirty();
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
            setDraftPeriods((prev) => [...prev, newPeriod]);
            openPeriodEdit(newPeriod);
            markDirty();
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

        <div style={dividerStyle} />

        {/* Compelling Question */}
        <div style={sectionHeaderStyle}>
          <Icon icon={formatQuoteOpenOutline} width={12} />
          Compelling Question
        </div>

        <button
          onClick={() => {
            setDraftCQ((prev) => ({ ...prev, enabled: !prev.enabled }));
            markDirty();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 6px",
            borderRadius: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 10,
            fontFamily: "'Overpass Mono', monospace",
            color: draftCQ.enabled ? theme.teacherGreen : theme.textMuted,
            fontWeight: 600,
            transition: "all 0.15s",
            marginBottom: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon icon={draftCQ.enabled ? eyeOutline : eyeOffOutline} width={13} />
          {draftCQ.enabled ? "Visible to students" : "Hidden from students"}
        </button>

        <textarea
          value={draftCQ.text}
          onChange={(e) => {
            setDraftCQ((prev) => ({ ...prev, text: e.target.value }));
            markDirty();
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
          }}
        />

        <div style={dividerStyle} />

        {/* Entry Fields Config */}
        <div style={sectionHeaderStyle}>
          <Icon icon={formTextboxIcon} width={12} />
          Entry Fields
        </div>

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
                      onClick={() => {
                        setDraftFieldConfig((prev) => ({ ...prev, [key]: m }));
                        markDirty();
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
              </div>
            );
          })}
        </div>

        <div style={dividerStyle} />

        {/* Student Roster */}
        <StudentRoster
          students={sectionStudents}
          sections={sections}
          onReassign={reassignStudentSection}
          onRemove={removeStudentSection}
          theme={theme}
        />
      </div>

      {/* Sticky bottom action bar */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: theme.cardBg,
        borderTop: `1px solid ${theme.cardBorder}`,
        padding: "12px 32px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 640,
        width: "100%",
        boxSizing: "border-box",
      }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            border: "none",
            background: isDirty ? theme.teacherGreen : theme.inputBorder,
            color: isDirty ? "#fff" : theme.textMuted,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 700,
            cursor: isDirty && !saving ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.15s",
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (isDirty && !saving) e.currentTarget.style.filter = "brightness(1.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
        >
          <Icon icon={contentSave} width={14} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={handleDiscard}
          disabled={!isDirty}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: `1px solid ${isDirty ? theme.inputBorder : "transparent"}`,
            background: "transparent",
            color: isDirty ? theme.textSecondary : theme.textMuted,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 600,
            cursor: isDirty ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
            opacity: isDirty ? 1 : 0.4,
          }}
          onMouseEnter={(e) => { if (isDirty) e.currentTarget.style.background = theme.subtleBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon icon={undoIcon} width={14} />
          Discard
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowCopyDialog(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: `1px solid ${theme.inputBorder}`,
            background: "transparent",
            color: theme.textSecondary,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; e.currentTarget.style.color = theme.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.textSecondary; }}
        >
          <Icon icon={contentCopy} width={14} />
          Copy to...
        </button>
      </div>

      {/* Copy Settings Dialog */}
      {showCopyDialog && (
        <CopySettingsDialog
          sourceSection={sectionId}
          sourceName={sectionName}
          sections={sections}
          liveSettings={{
            periods: livePeriods,
            compellingQuestion: liveCQ,
            timelineRange: liveTimelineRange,
            fieldConfig: liveFieldConfig,
          }}
          onClose={() => setShowCopyDialog(false)}
        />
      )}
    </div>
  );
}
