import { useState } from "react";
import { TAGS, SOURCE_TYPES } from "../data/constants";
import { MONTHS, maxDaysInMonth, dateToFractionalYear } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import sendIcon from "@iconify-icons/mdi/send";
import lightbulbOutline from "@iconify-icons/mdi/lightbulb-outline";
import { useTheme } from "../contexts/ThemeContext";

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
  sourceNote: "mandatory",
  sourceUrl: "optional",
  imageUrl: "optional",
  region: "optional",
};

export default function AddEventPanel({ onAdd, onClose, userName, timelineStart = 1910, timelineEnd = 2000, periods = [], fieldConfig, editingEvent, isTeacher }) {
  const fc = { ...DEFAULT_FIELD_CONFIG, ...(fieldConfig || {}) };
  const { theme, getThemedSourceTypeBg } = useTheme();
  const isEditing = !!editingEvent;
  const [form, setForm] = useState(isEditing ? {
    title: editingEvent.title || "",
    year: String(editingEvent.year || ""),
    month: editingEvent.month ? String(editingEvent.month) : "",
    day: editingEvent.day ? String(editingEvent.day) : "",
    endYear: editingEvent.endYear ? String(editingEvent.endYear) : "",
    endMonth: editingEvent.endMonth ? String(editingEvent.endMonth) : "",
    endDay: editingEvent.endDay ? String(editingEvent.endDay) : "",
    period: editingEvent.period || "",
    tags: [...(editingEvent.tags || [])],
    sourceType: editingEvent.sourceType || "Primary",
    description: editingEvent.description || "",
    sourceNote: editingEvent.sourceNote || "",
    sourceUrl: editingEvent.sourceUrl || "",
    imageUrl: editingEvent.imageUrl || "",
    region: editingEvent.region || "",
  } : {
    title: "",
    year: "",
    month: "",
    day: "",
    endYear: "",
    endMonth: "",
    endDay: "",
    period: "",
    tags: [],
    sourceType: "Primary",
    description: "",
    sourceNote: "",
    sourceUrl: "",
    imageUrl: "",
    region: "",
  });
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [showEndDate, setShowEndDate] = useState(isEditing ? !!editingEvent.endYear : false);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
    setErrors((e) => ({ ...e, tags: undefined }));
  };

  const validate = () => {
    const e = {};
    const w = {};
    if (fc.title === "mandatory" && !form.title.trim()) e.title = true;
    if (fc.year !== "hidden") {
      if (fc.year === "mandatory" && (!form.year || isNaN(form.year))) {
        e.year = true;
      } else if (form.year && !isNaN(form.year) && (Number(form.year) < timelineStart || Number(form.year) > timelineEnd)) {
        w.year = `Year ${form.year} is outside the timeline range (${timelineStart}–${timelineEnd}). It will still be submitted.`;
      }
    }
    if (fc.month !== "hidden") {
      if (fc.month === "mandatory" && !form.month) e.month = true;
      else if (form.month && (Number(form.month) < 1 || Number(form.month) > 12)) e.month = true;
    }
    if (fc.day !== "hidden") {
      if (fc.day === "mandatory" && !form.day) e.day = true;
      else if (form.day) {
        const max = maxDaysInMonth(Number(form.month), Number(form.year));
        if (Number(form.day) < 1 || Number(form.day) > max) e.day = true;
      }
    }
    if (fc.endDate === "optional" && showEndDate) {
      if (!form.endYear || isNaN(form.endYear)) e.endYear = true;
      if (fc.month === "mandatory" && !form.endMonth) e.endMonth = true;
      if (fc.day === "mandatory" && !form.endDay) e.endDay = true;
      // Validate end date is after start date
      if (form.year && form.endYear && !isNaN(form.year) && !isNaN(form.endYear)) {
        const startFrac = dateToFractionalYear(Number(form.year), Number(form.month) || undefined, Number(form.day) || undefined);
        const endFrac = dateToFractionalYear(Number(form.endYear), Number(form.endMonth) || undefined, Number(form.endDay) || undefined);
        if (endFrac !== null && startFrac !== null && endFrac < startFrac) {
          e.endYear = true;
          w.endDate = "End date must be after start date.";
        }
      }
    }
    if (fc.period === "mandatory" && !form.period) e.period = true;
    if (fc.tags === "mandatory" && form.tags.length === 0) e.tags = true;
    if (fc.description === "mandatory" && !form.description.trim()) e.description = true;
    if (fc.sourceNote === "mandatory" && !form.sourceNote.trim()) e.sourceNote = true;
    if (fc.sourceUrl !== "hidden" && form.sourceUrl.trim()) {
      try { new URL(form.sourceUrl.trim()); } catch { e.sourceUrl = true; }
    }
    if (fc.sourceUrl === "mandatory" && !form.sourceUrl.trim()) e.sourceUrl = true;
    if (fc.imageUrl !== "hidden" && form.imageUrl.trim()) {
      try { new URL(form.imageUrl.trim()); } catch { e.imageUrl = true; }
    }
    if (fc.imageUrl === "mandatory" && !form.imageUrl.trim()) e.imageUrl = true;
    if (fc.region === "mandatory" && !form.region.trim()) e.region = true;
    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };

  const FIELD_NAMES = { title: "Title", year: "Year", month: "Month", day: "Day", endYear: "End Year", endMonth: "End Month", endDay: "End Day", period: "Time Period", tags: "Tags", description: "Description", sourceNote: "Source Citation", sourceUrl: "Source URL", imageUrl: "Image URL", region: "Region" };

  const handleSubmit = async () => {
    if (!validate()) {
      setShowValidationHint(true);
      return;
    }
    setShowValidationHint(false);
    setSubmitting(true);
    try {
      const data = {
        ...form,
        year: parseInt(form.year),
        month: form.month ? parseInt(form.month) : null,
        day: form.day ? parseInt(form.day) : null,
      };
      if (showEndDate && form.endYear) {
        data.endYear = parseInt(form.endYear);
        data.endMonth = form.endMonth ? parseInt(form.endMonth) : null;
        data.endDay = form.endDay ? parseInt(form.endDay) : null;
      } else {
        data.endYear = null;
        data.endMonth = null;
        data.endDay = null;
      }
      // Strip hidden fields and null/empty values to avoid storing them in Firebase
      Object.keys(data).forEach((k) => {
        if (fc[k] === "hidden" || data[k] === null || data[k] === undefined || data[k] === "") delete data[k];
      });
      await onAdd(data);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setSubmitting(false);
      setShowValidationHint(true);
      setErrors({ _submit: true });
    }
  };

  const fieldStyle = (field) => ({
    width: "100%",
    padding: "9px 12px",
    border: `1.5px solid ${errors[field] ? theme.errorRed : theme.inputBorder}`,
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "'Overpass Mono', monospace",
    background: theme.inputBg,
    color: theme.textPrimary,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: theme.textTertiary,
    fontFamily: "'Overpass Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: theme.modalOverlay,
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
          padding: "28px 28px 20px",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: theme.modalShadow,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                fontFamily: "'Newsreader', 'Georgia', serif",
                color: theme.textPrimary,
              }}
            >
              {isEditing ? "Edit Historical Event" : "Add a Historical Event"}
            </h2>
            <p
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                margin: "4px 0 0",
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              {isEditing
                ? <>Editing as <strong style={{ color: theme.textDescription }}>{userName}</strong></>
                : <>Submitting as <strong style={{ color: theme.textDescription }}>{userName}</strong>{!isTeacher && <> &middot; Requires teacher approval</>}</>
              }
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textSecondary,
              lineHeight: 1,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon icon={closeIcon} width={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title + Year row */}
          <div style={{ display: "grid", gridTemplateColumns: fc.year !== "hidden" ? "1fr 100px" : "1fr", gap: 10 }}>
            {fc.title !== "hidden" && (
            <div>
              <label style={labelStyle}>Event Title{fc.title === "mandatory" ? " *" : ""}</label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What happened?"
                style={fieldStyle("title")}
              />
            </div>
            )}
            {fc.year !== "hidden" && (
            <div>
              <label style={labelStyle}>Year{fc.year === "mandatory" ? " *" : ""}</label>
              <input
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder={String(Math.round((timelineStart + timelineEnd) / 2))}
                type="number"
                style={{
                  ...fieldStyle("year"),
                  borderColor: warnings.year ? "#D97706" : (errors.year ? theme.errorRed : theme.inputBorder),
                }}
              />
            </div>
            )}
          </div>

          {/* Year out-of-range warning */}
          {warnings.year && (
            <div
              style={{
                background: "#FEF3C7",
                border: "1px solid #D97706",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                color: "#92400E",
                lineHeight: 1.4,
                marginTop: -6,
              }}
            >
              {warnings.year}
            </div>
          )}

          {/* Month + Day row */}
          {(fc.month !== "hidden" || fc.day !== "hidden") && (
            <div style={{ display: "flex", gap: 10 }}>
              {fc.month !== "hidden" && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Month{fc.month === "mandatory" ? " *" : ""}</label>
                  <select
                    value={form.month}
                    onChange={(e) => update("month", e.target.value)}
                    style={fieldStyle("month")}
                  >
                    <option value="">—</option>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
              {fc.day !== "hidden" && (
                <div style={{ width: 80 }}>
                  <label style={labelStyle}>Day{fc.day === "mandatory" ? " *" : ""}</label>
                  <input
                    value={form.day}
                    onChange={(e) => update("day", e.target.value)}
                    placeholder="—"
                    type="number"
                    min={1}
                    max={maxDaysInMonth(Number(form.month), Number(form.year))}
                    style={fieldStyle("day")}
                  />
                </div>
              )}
            </div>
          )}

          {/* End date toggle + inputs */}
          {fc.endDate === "optional" && (
            <>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontFamily: "'Overpass Mono', monospace",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  userSelect: "none",
                  marginTop: -4,
                }}
              >
                <input
                  type="checkbox"
                  checked={showEndDate}
                  onChange={(e) => setShowEndDate(e.target.checked)}
                  style={{ accentColor: theme.activeToggleBg }}
                />
                This event spans a date range
              </label>
              {showEndDate && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ width: 100 }}>
                    <label style={labelStyle}>End Year *</label>
                    <input
                      value={form.endYear}
                      onChange={(e) => update("endYear", e.target.value)}
                      placeholder={form.year || "—"}
                      type="number"
                      style={fieldStyle("endYear")}
                    />
                  </div>
                  {fc.month !== "hidden" && (
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label style={labelStyle}>End Month{fc.month === "mandatory" ? " *" : ""}</label>
                      <select
                        value={form.endMonth}
                        onChange={(e) => update("endMonth", e.target.value)}
                        style={fieldStyle("endMonth")}
                      >
                        <option value="">—</option>
                        {MONTHS.map((m, i) => (
                          <option key={i} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {fc.day !== "hidden" && (
                    <div style={{ width: 80 }}>
                      <label style={labelStyle}>End Day{fc.day === "mandatory" ? " *" : ""}</label>
                      <input
                        value={form.endDay}
                        onChange={(e) => update("endDay", e.target.value)}
                        placeholder="—"
                        type="number"
                        min={1}
                        max={maxDaysInMonth(Number(form.endMonth), Number(form.endYear))}
                        style={fieldStyle("endDay")}
                      />
                    </div>
                  )}
                </div>
              )}
              {warnings.endDate && (
                <div
                  style={{
                    background: "#FEF3C7",
                    border: "1px solid #D97706",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 11,
                    fontFamily: "'Overpass Mono', monospace",
                    color: "#92400E",
                    lineHeight: 1.4,
                    marginTop: -6,
                  }}
                >
                  {warnings.endDate}
                </div>
              )}
            </>
          )}

          {/* Period */}
          {fc.period !== "hidden" && (
          <div>
            <label style={labelStyle}>Time Period{fc.period === "mandatory" ? " *" : ""}</label>
            <select
              value={form.period}
              onChange={(e) => update("period", e.target.value)}
              style={fieldStyle("period")}
            >
              <option value="">Select a time period...</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Tags */}
          {fc.tags !== "hidden" && (
          <div>
            <label
              style={{
                ...labelStyle,
                color: errors.tags ? theme.errorRed : theme.textTertiary,
              }}
            >
              Tags{fc.tags === "mandatory" ? " (select at least 1) *" : ""}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 5,
                    border: `1.5px solid ${form.tags.includes(tag) ? theme.activeToggleBg : theme.inputBorder}`,
                    background: form.tags.includes(tag) ? theme.activeToggleBg : theme.inputBg,
                    color: form.tags.includes(tag) ? theme.activeToggleText : theme.textTertiary,
                    fontSize: 11,
                    fontFamily: "'Overpass Mono', monospace",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Source Type */}
          {fc.sourceType !== "hidden" && (
          <div>
            <label style={labelStyle}>Source Type{fc.sourceType === "mandatory" ? " *" : ""}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {SOURCE_TYPES.map((st) => {
                const isSelected =
                  form.sourceType === (st.id === "primary" ? "Primary" : "Secondary");
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      update("sourceType", st.id === "primary" ? "Primary" : "Secondary")
                    }
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 7,
                      border: `1.5px solid ${isSelected ? st.color : theme.inputBorder}`,
                      background: isSelected
                        ? (getThemedSourceTypeBg(st.id) || st.bg)
                        : theme.inputBg,
                      color: isSelected ? st.color : theme.textSecondary,
                      fontSize: 12,
                      fontFamily: "'Overpass Mono', monospace",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Description */}
          {fc.description !== "hidden" && (
          <div>
            <label style={labelStyle}>Description{fc.description === "mandatory" ? " *" : ""}</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What happened and why does it matter? Use evidence from your sources."
              rows={4}
              style={{
                ...fieldStyle("description"),
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>
          )}

          {/* Source Note */}
          {fc.sourceNote !== "hidden" && (
          <div>
            <label style={labelStyle}>Source Citation{fc.sourceNote === "mandatory" ? " *" : ""}</label>
            <input
              value={form.sourceNote}
              onChange={(e) => update("sourceNote", e.target.value)}
              placeholder="Where did you learn about this?"
              style={fieldStyle("sourceNote")}
            />
          </div>
          )}

          {/* Source URL */}
          {fc.sourceUrl !== "hidden" && (
          <div>
            <label style={labelStyle}>Source URL{fc.sourceUrl === "optional" ? " (optional)" : fc.sourceUrl === "mandatory" ? " *" : ""}</label>
            <input
              value={form.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
              placeholder="https://..."
              type="url"
              style={fieldStyle("sourceUrl")}
            />
          </div>
          )}

          {/* Image URL */}
          {fc.imageUrl !== "hidden" && (
          <div>
            <label style={labelStyle}>Image URL{fc.imageUrl === "optional" ? " (optional)" : fc.imageUrl === "mandatory" ? " *" : ""}</label>
            <input
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://upload.wikimedia.org/..."
              type="url"
              style={fieldStyle("imageUrl")}
            />
            {form.imageUrl && !errors.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 150,
                  borderRadius: 6,
                  objectFit: "contain",
                  marginTop: 6,
                  background: theme.subtleBg,
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
          </div>
          )}

          {/* Region */}
          {fc.region !== "hidden" && (
          <div>
            <label style={labelStyle}>Region{fc.region === "optional" ? " (optional)" : fc.region === "mandatory" ? " *" : ""}</label>
            <input
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="e.g. Europe, Pacific, National..."
              style={fieldStyle("region")}
            />
          </div>
          )}

          {/* Skill connection hint */}
          <div
            style={{
              background: theme.warmSubtleBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              color: theme.textTertiary,
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700, color: theme.textDescription, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon icon={lightbulbOutline} width={14} style={{ color: "#F59E0B" }} />
              Historian's Tip:
            </span>{" "}
            Writing a strong event entry practices several skills &mdash; sourcing
            (2A), contextualization (2B), and classification (3A). A great
            description explains not just <em>what</em> happened but{" "}
            <em>why it matters</em>.
          </div>

          {/* Validation hint */}
          {showValidationHint && Object.keys(errors).length > 0 && (
            <div
              style={{
                background: theme.errorRed + "12",
                border: `1px solid ${theme.errorRed}40`,
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                color: theme.errorRed,
                lineHeight: 1.4,
              }}
            >
              {errors._submit
                ? "Save failed — check the browser console (F12) for details."
                : <>Please fix the following fields: {Object.keys(errors).map((k) => FIELD_NAMES[k] || k).join(", ")}</>
              }
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "12px 20px",
              background: submitting ? theme.textSecondary : theme.activeToggleBg,
              color: theme.activeToggleText,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "'Overpass Mono', monospace",
              fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}
          >
            {submitting
              ? (isEditing ? "Saving..." : "Submitting...")
              : <><Icon icon={sendIcon} width={14} style={{ verticalAlign: "middle", marginRight: 5 }} />{isEditing ? "Save Changes" : isTeacher ? "Add Event" : "Submit Event for Approval"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
