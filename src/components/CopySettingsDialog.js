import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { savePeriods, saveCompellingQuestion, saveTimelineRange, saveFieldConfig } from "../services/database";
import { Icon } from "@iconify/react";
import contentCopy from "@iconify-icons/mdi/content-copy";
import closeIcon from "@iconify-icons/mdi/close";

const SETTING_CATEGORIES = [
  { key: "timelineRange", label: "Timeline Range" },
  { key: "periods", label: "Time Periods" },
  { key: "compellingQuestion", label: "Compelling Question" },
  { key: "fieldConfig", label: "Entry Fields" },
];

export default function CopySettingsDialog({ sourceSection, sourceName, sections, liveSettings, onClose }) {
  const { theme } = useTheme();
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [selectedSettings, setSelectedSettings] = useState(new Set(SETTING_CATEGORIES.map((c) => c.key)));
  const [copying, setCopying] = useState(false);
  const [done, setDone] = useState(false);

  const targetSections = sections.filter((s) => s.id !== sourceSection);

  const toggleSection = (id) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSections = () => {
    if (selectedSections.size === targetSections.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(targetSections.map((s) => s.id)));
    }
  };

  const toggleSetting = (key) => {
    setSelectedSettings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllSettings = () => {
    if (selectedSettings.size === SETTING_CATEGORIES.length) {
      setSelectedSettings(new Set());
    } else {
      setSelectedSettings(new Set(SETTING_CATEGORIES.map((c) => c.key)));
    }
  };

  const handleCopy = async () => {
    if (selectedSections.size === 0 || selectedSettings.size === 0) return;
    setCopying(true);
    try {
      const promises = [];
      for (const targetId of selectedSections) {
        if (selectedSettings.has("periods")) promises.push(savePeriods(targetId, liveSettings.periods));
        if (selectedSettings.has("compellingQuestion")) promises.push(saveCompellingQuestion(targetId, liveSettings.compellingQuestion));
        if (selectedSettings.has("timelineRange")) promises.push(saveTimelineRange(targetId, liveSettings.timelineRange));
        if (selectedSettings.has("fieldConfig")) promises.push(saveFieldConfig(targetId, liveSettings.fieldConfig));
      }
      await Promise.all(promises);
      setDone(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error("Failed to copy settings:", err);
    }
    setCopying(false);
  };

  const canCopy = selectedSections.size > 0 && selectedSettings.size > 0 && !copying && !done;

  const checkboxStyle = (checked) => ({
    width: 16,
    height: 16,
    borderRadius: 3,
    border: `1.5px solid ${checked ? theme.accentGold : theme.inputBorder}`,
    background: checked ? theme.accentGold : "transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s",
    color: checked ? theme.bg : "transparent",
    fontSize: 11,
    fontWeight: 700,
    padding: 0,
  });

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 12,
        padding: "24px 28px",
        minWidth: 360,
        maxWidth: 440,
        fontFamily: "'Overpass Mono', monospace",
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: theme.textPrimary,
          }}>
            Copy Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: theme.textMuted,
              display: "inline-flex",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
          >
            <Icon icon={closeIcon} width={18} />
          </button>
        </div>

        <div style={{
          fontSize: 10,
          color: theme.textSecondary,
          marginBottom: 16,
        }}>
          Copy settings from <strong style={{ color: theme.textPrimary }}>{sourceName}</strong> to:
        </div>

        {/* Target sections */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>Sections</span>
            <button
              onClick={toggleAllSections}
              style={{
                fontSize: 8,
                color: theme.accentGold,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {selectedSections.size === targetSections.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          {targetSections.length === 0 && (
            <div style={{ fontSize: 10, color: theme.textMuted, fontStyle: "italic" }}>
              No other sections to copy to
            </div>
          )}
          {targetSections.map((s) => (
            <label
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                cursor: "pointer",
                fontSize: 11,
                color: theme.textPrimary,
              }}
            >
              <button
                onClick={() => toggleSection(s.id)}
                style={checkboxStyle(selectedSections.has(s.id))}
              >
                {selectedSections.has(s.id) ? "\u2713" : ""}
              </button>
              {s.name}
            </label>
          ))}
        </div>

        {/* Setting categories */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>Include</span>
            <button
              onClick={toggleAllSettings}
              style={{
                fontSize: 8,
                color: theme.accentGold,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {selectedSettings.size === SETTING_CATEGORIES.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          {SETTING_CATEGORIES.map((c) => (
            <label
              key={c.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                cursor: "pointer",
                fontSize: 11,
                color: theme.textPrimary,
              }}
            >
              <button
                onClick={() => toggleSetting(c.key)}
                style={checkboxStyle(selectedSettings.has(c.key))}
              >
                {selectedSettings.has(c.key) ? "\u2713" : ""}
              </button>
              {c.label}
            </label>
          ))}
        </div>

        {/* Warning */}
        {selectedSections.size > 0 && selectedSettings.size > 0 && (
          <div style={{
            fontSize: 9,
            color: theme.textMuted,
            fontStyle: "italic",
            marginBottom: 12,
            letterSpacing: "0.03em",
          }}>
            This will overwrite the selected settings for {selectedSections.size} section{selectedSections.size > 1 ? "s" : ""}.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={!canCopy}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              background: done ? theme.teacherGreen : canCopy ? theme.accentGold : theme.inputBorder,
              color: done ? "#fff" : canCopy ? theme.bg : theme.textMuted,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              fontWeight: 700,
              cursor: canCopy ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (canCopy) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            <Icon icon={contentCopy} width={14} />
            {done ? "Copied!" : copying ? "Copying..." : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
