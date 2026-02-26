import { useState } from "react";
import { UNITS, TAGS, SOURCE_TYPES } from "../data/constants";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import sendIcon from "@iconify-icons/mdi/send";
import lightbulbOutline from "@iconify-icons/mdi/lightbulb-outline";
import { useTheme } from "../contexts/ThemeContext";

export default function AddEventPanel({ onAdd, onClose, userName }) {
  const { theme, getThemedSourceTypeBg } = useTheme();
  const [form, setForm] = useState({
    title: "",
    year: "",
    unit: "",
    tags: [],
    sourceType: "Primary",
    description: "",
    sourceNote: "",
    region: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.title.trim()) e.title = true;
    if (!form.year || isNaN(form.year) || form.year < 1900 || form.year > 2000)
      e.year = true;
    if (!form.unit) e.unit = true;
    if (form.tags.length === 0) e.tags = true;
    if (!form.description.trim()) e.description = true;
    if (!form.sourceNote.trim()) e.sourceNote = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onAdd({
        ...form,
        year: parseInt(form.year),
      });
      onClose();
    } catch {
      setSubmitting(false);
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
              Add a Historical Event
            </h2>
            <p
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                margin: "4px 0 0",
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              Submitting as <strong style={{ color: theme.textDescription }}>{userName}</strong> &middot;
              Requires teacher approval
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What happened?"
                style={fieldStyle("title")}
              />
            </div>
            <div>
              <label style={labelStyle}>Year *</label>
              <input
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="1945"
                type="number"
                style={fieldStyle("year")}
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label style={labelStyle}>Unit *</label>
            <select
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
              style={fieldStyle("unit")}
            >
              <option value="">Select a unit...</option>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label
              style={{
                ...labelStyle,
                color: errors.tags ? theme.errorRed : theme.textTertiary,
              }}
            >
              Tags (select at least 1) *
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

          {/* Source Type */}
          <div>
            <label style={labelStyle}>Source Type *</label>
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

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
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

          {/* Source Note */}
          <div>
            <label style={labelStyle}>Source Citation *</label>
            <input
              value={form.sourceNote}
              onChange={(e) => update("sourceNote", e.target.value)}
              placeholder="Where did you learn about this?"
              style={fieldStyle("sourceNote")}
            />
          </div>

          {/* Region */}
          <div>
            <label style={labelStyle}>Region (optional)</label>
            <input
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="e.g. Europe, Pacific, National..."
              style={fieldStyle("region")}
            />
          </div>

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
            {submitting ? "Submitting..." : <><Icon icon={sendIcon} width={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Submit Event for Approval</>}
          </button>
        </div>
      </div>
    </div>
  );
}
