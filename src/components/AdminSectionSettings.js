import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { DEFAULT_FIELD_CONFIG, DEFAULT_PALETTE_ID, COLOR_PALETTES, getPaletteColors } from "../data/constants";
import { subscribeToPeriods, subscribeToCompellingQuestion, subscribeToTimelineRange, subscribeToFieldConfig, subscribeToPaletteId, savePeriods, saveCompellingQuestion, saveTimelineRange, saveFieldConfig, savePaletteId, seedDemoData, wipeSectionData } from "../services/database";
import { Icon } from "@iconify/react";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import formatQuoteOpenOutline from "@iconify-icons/mdi/format-quote-open-outline";
import formTextboxIcon from "@iconify-icons/mdi/form-textbox";
import paletteOutline from "@iconify-icons/mdi/palette-outline";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import chevronUp from "@iconify-icons/mdi/chevron-up";
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
import PaletteSelector from "./PaletteSelector";
import BountyEditor from "./BountyEditor";

export default function AdminSectionSettings({
  sectionId,
  sectionName,
  sections,
  allStudentAssignments,
  onDeleteSection,
  onRenameSection,
  reassignStudentSection,
  removeStudentSection,
  bounties = [],
  allEvents = [],
  displayPeriods = [],
  userName,
  userUid,
}) {
  const { theme } = useTheme();

  // Live state (from Firebase)
  const [livePeriods, setLivePeriods] = useState([]);
  const [liveCQ, setLiveCQ] = useState({ text: "", enabled: false });
  const [liveTimelineRange, setLiveTimelineRange] = useState({ start: 1900, end: 2000 });
  const [liveFieldConfig, setLiveFieldConfig] = useState({ ...DEFAULT_FIELD_CONFIG });
  const [livePaletteId, setLivePaletteId] = useState(DEFAULT_PALETTE_ID);

  // Draft state (editable)
  const [draftPeriods, setDraftPeriods] = useState([]);
  const [draftCQ, setDraftCQ] = useState({ text: "", enabled: false });
  const [draftTimelineRange, setDraftTimelineRange] = useState({ start: 1900, end: 2000 });
  const [draftFieldConfig, setDraftFieldConfig] = useState({ ...DEFAULT_FIELD_CONFIG });
  const [draftPaletteId, setDraftPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [isDirty, setIsDirty] = useState(false);

  // Section rename
  const [editingName, setEditingName] = useState(false);
  const [draftSectionName, setDraftSectionName] = useState(sectionName);

  // Palette section collapsed state
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  // Subscribe to palette ID
  useEffect(() => {
    const unsub = subscribeToPaletteId(sectionId, (data) => {
      const pid = data || DEFAULT_PALETTE_ID;
      setLivePaletteId(pid);
      if (!isDirtyRef.current) {
        setDraftPaletteId(pid);
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
        savePaletteId(sectionId, draftPaletteId),
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
    setDraftPaletteId(livePaletteId);
    setIsDirty(false);
    isDirtyRef.current = false;
  };

  const handleDeleteSection = () => {
    if (!window.confirm(`Delete "${sectionName}"? Events in this section will no longer be visible.`)) return;
    onDeleteSection(sectionId);
  };

  const handleRenameSubmit = () => {
    const trimmed = draftSectionName.trim();
    if (trimmed && trimmed !== sectionName) {
      onRenameSection(sectionId, trimmed);
    }
    setEditingName(false);
  };

  const handlePaletteSwitch = (newPaletteId) => {
    const oldColors = getPaletteColors(draftPaletteId);
    const newColors = getPaletteColors(newPaletteId);
    const remapped = draftPeriods.map((period) => {
      const oldIdx = oldColors.findIndex(
        (c) => c.color === period.color && c.bg === period.bg && c.accent === period.accent
      );
      if (oldIdx >= 0 && oldIdx < newColors.length) {
        const nc = newColors[oldIdx];
        return { ...period, color: nc.color, bg: nc.bg, accent: nc.accent };
      }
      return period;
    });
    setDraftPeriods(remapped);
    setDraftPaletteId(newPaletteId);
    markDirty();
  };

  // Section header style
  const sectionHeaderStyle = {
    fontSize: FONT_SIZES.tiny,
    fontWeight: 700,
    color: theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: SPACING["2.5"],
    display: "flex",
    alignItems: "center",
    gap: SPACING["1.5"],
  };

  const dividerStyle = { height: 1, background: theme.cardBorder, margin: `${SPACING[5]} 0` };

  const inputStyle = {
    padding: `${SPACING["1.5"]} ${SPACING[2]}`,
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    background: theme.inputBg,
    color: theme.textPrimary,
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
      <div style={{ flex: 1, padding: `${SPACING[6]} ${SPACING[8]} 100px`, maxWidth: 640, width: "100%" }}>
        {/* Section Name Header */}
        <div style={{ marginBottom: SPACING[6] }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING[3], marginBottom: SPACING[1] }}>
            {editingName ? (
              <input
                autoFocus
                aria-label="Section name"
                value={draftSectionName}
                onChange={(e) => setDraftSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setEditingName(false); setDraftSectionName(sectionName); }
                }}
                onBlur={handleRenameSubmit}
                style={{
                  fontSize: FONT_SIZES.xl,
                  fontWeight: 700,
                  fontFamily: FONT_SERIF,
                  border: `1.5px solid ${theme.inputBorder}`,
                  borderRadius: RADII.md,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  padding: `${SPACING[1]} ${SPACING["2.5"]}`,
                }}
              />
            ) : (
              <h2
                style={{
                  fontSize: FONT_SIZES.xl,
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
          <div style={{ fontSize: FONT_SIZES.tiny, color: theme.textMuted, letterSpacing: "0.05em" }}>
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

        {/* Color Palette */}
        <button
          onClick={() => setPaletteOpen((o) => !o)}
          style={{
            ...sectionHeaderStyle,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            width: "100%",
          }}
        >
          <Icon icon={paletteOutline} width={12} />
          Color Palette
          {!paletteOpen && (
            <>
              <span style={{
                fontWeight: 600,
                fontSize: FONT_SIZES.micro,
                color: theme.textSecondary,
                textTransform: "none",
                letterSpacing: "0.03em",
              }}>
                {COLOR_PALETTES[draftPaletteId]?.label || "Classic"}
              </span>
              <span style={{ display: "inline-flex", gap: 2, marginLeft: 2 }}>
                {getPaletteColors(draftPaletteId).map((c, i) => (
                  <span key={i} style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.accent,
                    display: "inline-block",
                  }} />
                ))}
              </span>
            </>
          )}
          <Icon icon={paletteOpen ? chevronUp : chevronDown} width={14} style={{ marginLeft: "auto" }} />
        </button>
        {paletteOpen && (
          <PaletteSelector
            selectedPaletteId={draftPaletteId}
            onSelect={handlePaletteSwitch}
          />
        )}

        <div style={dividerStyle} />

        {/* Time Periods */}
        <div style={sectionHeaderStyle}>Time Periods</div>
        <TimePeriodsEditor
          draftPeriods={draftPeriods}
          draftTimelineRange={draftTimelineRange}
          onPeriodsChange={(newPeriods) => { setDraftPeriods(newPeriods); markDirty(); }}
          inputStyle={inputStyle}
          paletteId={draftPaletteId}
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

        {/* Bounty Board */}
        <BountyEditor
          section={sectionId}
          bounties={bounties}
          periods={displayPeriods}
          approvedEvents={allEvents.filter((e) => e.status === "approved" && e.section === sectionId)}
          userName={userName}
          userUid={userUid}
        />

        <div style={dividerStyle} />

        {/* Demo Data */}
        <div style={sectionHeaderStyle}>
          <Icon icon={databaseImportOutline} width={12} />
          Demo Data
        </div>
        <div style={{
          fontSize: FONT_SIZES.tiny,
          color: theme.textSecondary,
          marginBottom: SPACING[3],
          lineHeight: 1.5,
        }}>
          Seed this section with sample events, connections, and settings for demos and training. Wipe removes all events and connections from this section.
        </div>
        <div style={{ display: "flex", gap: SPACING[2] }}>
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
              padding: `${SPACING[2]} ${SPACING[4]}`,
              borderRadius: RADII.md,
              border: "none",
              background: seeding ? "#6366F180" : "#6366F1",
              color: "#fff",
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: seeding || wiping ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING["1.5"],
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
              padding: `${SPACING[2]} ${SPACING[4]}`,
              borderRadius: RADII.md,
              border: `1px solid ${theme.errorRed}`,
              background: "transparent",
              color: theme.errorRed,
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: seeding || wiping ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING["1.5"],
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
          <div aria-live="polite" style={{
            marginTop: SPACING[2],
            fontSize: FONT_SIZES.tiny,
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
        padding: `${SPACING[3]} ${SPACING[8]}`,
        display: "flex",
        alignItems: "center",
        gap: SPACING[2],
        maxWidth: 640,
        width: "100%",
        boxSizing: "border-box",
      }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            padding: `${SPACING[2]} ${SPACING[5]}`,
            borderRadius: RADII.md,
            border: "none",
            background: isDirty ? theme.teacherGreen : theme.inputBorder,
            color: isDirty ? "#fff" : theme.textMuted,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: isDirty && !saving ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING["1.5"],
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
            padding: `${SPACING[2]} ${SPACING[4]}`,
            borderRadius: RADII.md,
            border: `1px solid ${isDirty ? theme.inputBorder : "transparent"}`,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            fontWeight: 600,
            gap: SPACING["1.5"],
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
            padding: `${SPACING[2]} ${SPACING[4]}`,
            borderRadius: RADII.md,
            border: `1px solid ${theme.inputBorder}`,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            fontWeight: 600,
            gap: SPACING["1.5"],
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
            paletteId: livePaletteId,
          }}
          onClose={() => setShowCopyDialog(false)}
        />
      )}
    </div>
  );
}
