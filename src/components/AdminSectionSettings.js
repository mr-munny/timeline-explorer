import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme, FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
import { DEFAULT_FIELD_CONFIG } from "../data/constants";
import { subscribeToPeriods, subscribeToCompellingQuestion, subscribeToTimelineRange, subscribeToFieldConfig, savePeriods, saveCompellingQuestion, saveTimelineRange, saveFieldConfig, seedDemoData, wipeSectionData } from "../services/database";
import { Icon } from "@iconify/react";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import formatQuoteOpenOutline from "@iconify-icons/mdi/format-quote-open-outline";
import formTextboxIcon from "@iconify-icons/mdi/form-textbox";
import contentSave from "@iconify-icons/mdi/content-save";
import undoIcon from "@iconify-icons/mdi/undo";
import contentCopy from "@iconify-icons/mdi/content-copy";
import deleteOutline from "@iconify-icons/mdi/delete-outline";
import databaseImportOutline from "@iconify-icons/mdi/database-import-outline";
import deleteSweepOutline from "@iconify-icons/mdi/delete-sweep-outline";
import StudentRoster from "./StudentRoster";
import CopySettingsDialog from "./CopySettingsDialog";
import IconButton from "./IconButton";
import TimelineRangeEditor from "./TimelineRangeEditor";
import TimePeriodsEditor from "./TimePeriodsEditor";
import CompellingQuestionEditor from "./CompellingQuestionEditor";
import FieldConfigEditor from "./FieldConfigEditor";

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

  // Section rename
  const [editingName, setEditingName] = useState(false);
  const [draftSectionName, setDraftSectionName] = useState(sectionName);

  // Copy dialog
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Demo seed/wipe state
  const [seeding, setSeeding] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [demoMessage, setDemoMessage] = useState(null);

  // Track if dirty ref for subscription updates
  const isDirtyRef = useRef(false);

  // Reset everything when section changes
  useEffect(() => {
    setIsDirty(false);
    isDirtyRef.current = false;
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
    setDraftFieldConfig(liveFieldConfig);
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
    fontFamily: FONT_MONO,
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
      fontFamily: FONT_MONO,
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
                  fontFamily: FONT_SERIF,
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
                  fontFamily: FONT_SERIF,
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
            <IconButton icon={pencilOutline} onClick={() => { setEditingName(true); setDraftSectionName(sectionName); }} title="Rename section" size={16} color={theme.textMuted} hoverColor={theme.textPrimary} />
            <IconButton icon={deleteOutline} onClick={handleDeleteSection} title="Delete section" size={16} color={theme.textMuted} hoverColor={theme.errorRed} style={{ marginLeft: "auto" }} />
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.05em" }}>
            ID: {sectionId}
          </div>
        </div>

        {/* Timeline Range */}
        <div style={sectionHeaderStyle}>Timeline Range</div>
        <TimelineRangeEditor
          draftRange={draftTimelineRange}
          onRangeChange={(newRange) => { setDraftTimelineRange(newRange); markDirty(); }}
          inputStyle={inputStyle}
        />

        <div style={dividerStyle} />

        {/* Time Periods */}
        <div style={sectionHeaderStyle}>Time Periods</div>
        <TimePeriodsEditor
          draftPeriods={draftPeriods}
          draftTimelineRange={draftTimelineRange}
          onPeriodsChange={(newPeriods) => { setDraftPeriods(newPeriods); markDirty(); }}
          inputStyle={inputStyle}
        />

        <div style={dividerStyle} />

        {/* Compelling Question */}
        <div style={sectionHeaderStyle}>
          <Icon icon={formatQuoteOpenOutline} width={12} />
          Compelling Question
        </div>
        <CompellingQuestionEditor
          draftCQ={draftCQ}
          onCQChange={(newCQ) => { setDraftCQ(newCQ); markDirty(); }}
        />

        <div style={dividerStyle} />

        {/* Entry Fields Config */}
        <div style={sectionHeaderStyle}>
          <Icon icon={formTextboxIcon} width={12} />
          Entry Fields
        </div>
        <FieldConfigEditor
          draftFieldConfig={draftFieldConfig}
          onFieldConfigChange={(newConfig) => { setDraftFieldConfig(newConfig); markDirty(); }}
        />

        <div style={dividerStyle} />

        {/* Student Roster */}
        <StudentRoster
          students={sectionStudents}
          sections={sections}
          onReassign={reassignStudentSection}
          onRemove={removeStudentSection}
        />

        <div style={dividerStyle} />

        {/* Demo Data */}
        <div style={sectionHeaderStyle}>
          <Icon icon={databaseImportOutline} width={12} />
          Demo Data
        </div>
        <div style={{
          fontSize: 10,
          color: theme.textSecondary,
          marginBottom: 12,
          lineHeight: 1.5,
        }}>
          Seed this section with sample events, connections, and settings for demos and training. Wipe removes all events and connections from this section.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              if (!window.confirm(
                `Seed "${sectionName}" with demo data?\n\nThis will add ~36 sample events, ~13 connections, and configure time periods, compelling question, and timeline range for this section.\n\nExisting data in this section will NOT be removed.`
              )) return;
              setSeeding(true);
              setDemoMessage(null);
              try {
                const result = await seedDemoData(sectionId);
                setDemoMessage(`Seeded ${result.events} events and ${result.connections} connections.`);
              } catch (err) {
                console.error("Seed failed:", err);
                setDemoMessage("Seed failed — check console for details.");
              }
              setSeeding(false);
            }}
            disabled={seeding || wiping}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: seeding ? "#6366F180" : "#6366F1",
              color: "#fff",
              fontSize: 10,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: seeding || wiping ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!seeding && !wiping) e.currentTarget.style.filter = "brightness(1.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            <Icon icon={databaseImportOutline} width={13} />
            {seeding ? "Seeding..." : "Seed Demo Data"}
          </button>
          <button
            onClick={async () => {
              if (!window.confirm(
                `Wipe ALL events and connections from "${sectionName}"?\n\nThis cannot be undone.`
              )) return;
              setWiping(true);
              setDemoMessage(null);
              try {
                const result = await wipeSectionData(sectionId);
                setDemoMessage(`Wiped ${result.events} events and ${result.connections} connections.`);
              } catch (err) {
                console.error("Wipe failed:", err);
                setDemoMessage("Wipe failed — check console for details.");
              }
              setWiping(false);
            }}
            disabled={seeding || wiping}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: `1px solid ${theme.errorRed}`,
              background: "transparent",
              color: theme.errorRed,
              fontSize: 10,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: seeding || wiping ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!seeding && !wiping) { e.currentTarget.style.background = theme.errorRed + "15"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Icon icon={deleteSweepOutline} width={13} />
            {wiping ? "Wiping..." : "Wipe Section Data"}
          </button>
        </div>
        {demoMessage && (
          <div style={{
            marginTop: 8,
            fontSize: 10,
            fontFamily: FONT_MONO,
            color: demoMessage.includes("failed") ? theme.errorRed : theme.teacherGreen,
            fontWeight: 600,
          }}>
            {demoMessage}
          </div>
        )}
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
            fontFamily: FONT_MONO,
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
        <IconButton
          icon={undoIcon}
          onClick={handleDiscard}
          disabled={!isDirty}
          size={14}
          color={isDirty ? theme.textSecondary : theme.textMuted}
          hoverBg={theme.subtleBg}
          style={{
            background: "transparent",
            padding: "8px 16px",
            borderRadius: 6,
            border: `1px solid ${isDirty ? theme.inputBorder : "transparent"}`,
            fontSize: 11,
            fontFamily: FONT_MONO,
            fontWeight: 600,
            gap: 6,
            opacity: isDirty ? 1 : 0.4,
          }}
        >
          Discard
        </IconButton>
        <div style={{ flex: 1 }} />
        <IconButton
          icon={contentCopy}
          onClick={() => setShowCopyDialog(true)}
          size={14}
          color={theme.textSecondary}
          hoverColor={theme.textPrimary}
          hoverBg={theme.subtleBg}
          style={{
            background: "transparent",
            padding: "8px 16px",
            borderRadius: 6,
            border: `1px solid ${theme.inputBorder}`,
            fontSize: 11,
            fontFamily: FONT_MONO,
            fontWeight: 600,
            gap: 6,
          }}
        >
          Copy to...
        </IconButton>
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
