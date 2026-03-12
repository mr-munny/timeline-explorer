import { useState } from "react";
import { Icon } from "@iconify/react";
import plusIcon from "@iconify-icons/mdi/plus";
import deleteIcon from "@iconify-icons/mdi/delete-outline";
import targetIcon from "@iconify-icons/mdi/bullseye-arrow";
import checkCircleOutline from "@iconify-icons/mdi/check-circle-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { TAGS, SOURCE_TYPES } from "../data/constants";
import { createBounty, deleteBounty } from "../services/database";

export default function BountyEditor({ section, bounties, periods, approvedEvents, userName, userUid }) {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("event");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hints, setHints] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const sectionBounties = bounties.filter((b) => b.section === section);
  const openBounties = sectionBounties.filter((b) => b.status === "open");
  const completedBounties = sectionBounties.filter((b) => b.status === "completed");

  const inputStyle = {
    width: "100%",
    padding: `${SPACING[1.5] || "0.4375rem"} ${SPACING[2.5]}`,
    border: `1.5px solid ${theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
  };

  const resetForm = () => {
    setType("event");
    setTitle("");
    setDescription("");
    setHints({});
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      // Clean empty hint values
      const cleanHints = {};
      for (const [k, v] of Object.entries(hints)) {
        if (Array.isArray(v) ? v.length > 0 : v) cleanHints[k] = v;
      }
      await createBounty({
        type,
        title: title.trim(),
        description: description.trim(),
        hints: cleanHints,
        section,
        createdBy: userName,
        createdByUid: userUid,
      });
      resetForm();
    } catch (err) {
      console.error("Failed to create bounty:", err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (bountyId) => {
    if (!window.confirm("Delete this bounty?")) return;
    try {
      await deleteBounty(bountyId);
    } catch (err) {
      console.error("Failed to delete bounty:", err);
    }
  };

  const updateHint = (key, value) => {
    setHints((h) => ({ ...h, [key]: value }));
  };

  return (
    <div>
      <h3
        style={{
          fontSize: FONT_SIZES.sm,
          fontWeight: 700,
          fontFamily: FONT_MONO,
          color: theme.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: `0 0 ${SPACING[3]} 0`,
        }}
      >
        <Icon icon={targetIcon} width={14} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} />
        Bounty Board ({openBounties.length} open)
      </h3>

      {/* Existing bounties */}
      {sectionBounties.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2], marginBottom: SPACING[3] }}>
          {sectionBounties.map((bounty) => (
            <div
              key={bounty.id}
              style={{
                padding: `${SPACING[3]} ${SPACING[3]}`,
                border: `1.5px solid ${bounty.status === "completed" ? (theme.successGreen || "#16A34A") + "40" : theme.inputBorder}`,
                borderRadius: RADII.lg,
                borderLeft: `4px solid ${bounty.status === "completed" ? (theme.successGreen || "#16A34A") : "#0D9488"}`,
                opacity: bounty.status === "completed" ? 0.7 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING[2] }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING[1.5], marginBottom: SPACING[1] }}>
                    <span
                      style={{
                        fontSize: FONT_SIZES.micro,
                        fontWeight: 700,
                        fontFamily: FONT_MONO,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: `${SPACING[0.5] || "0.1875rem"} ${SPACING[2]}`,
                        borderRadius: RADII.sm,
                        background: bounty.type === "event" ? "#0D948815" : (theme.accentGold || "#F59E0B") + "15",
                        color: bounty.type === "event" ? "#0D9488" : (theme.accentGold || "#F59E0B"),
                      }}
                    >
                      {bounty.type}
                    </span>
                    {bounty.status === "completed" && (
                      <span style={{
                        fontSize: FONT_SIZES.micro,
                        fontWeight: 700,
                        fontFamily: FONT_MONO,
                        color: theme.successGreen || "#16A34A",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: SPACING[0.5],
                      }}>
                        <Icon icon={checkCircleOutline} width={12} />
                        Completed by {bounty.completedBy}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: FONT_SIZES.base,
                    fontWeight: 700,
                    fontFamily: FONT_SERIF,
                    color: theme.textPrimary,
                    marginBottom: SPACING[1],
                  }}>
                    {bounty.title}
                  </div>
                  <div style={{
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_SERIF,
                    color: theme.textDescription,
                    lineHeight: 1.5,
                  }}>
                    {bounty.description}
                  </div>
                </div>
                {bounty.status === "open" && (
                  <button
                    onClick={() => handleDelete(bounty.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: theme.textMuted,
                      padding: SPACING[1],
                      borderRadius: RADII.sm,
                      transition: "color 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.errorRed; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
                    aria-label="Delete bounty"
                  >
                    <Icon icon={deleteIcon} width={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {completedBounties.length > 0 && openBounties.length === 0 && sectionBounties.length === completedBounties.length && (
        <p style={{ fontSize: FONT_SIZES.tiny, color: theme.textMuted, fontFamily: FONT_MONO, marginBottom: SPACING[3] }}>
          All bounties completed.
        </p>
      )}

      {/* Create bounty form */}
      {showForm ? (
        <div
          style={{
            padding: `${SPACING[4]} ${SPACING[4]}`,
            border: `1.5px solid #0D948840`,
            borderRadius: RADII.lg,
            background: "#0D948808",
          }}
        >
          <div style={{ fontSize: FONT_SIZES.sm, fontWeight: 700, fontFamily: FONT_MONO, color: "#0D9488", marginBottom: SPACING[3] }}>
            New Bounty
          </div>

          {/* Type selector */}
          <div style={{ display: "flex", gap: SPACING[2], marginBottom: SPACING[2.5] }}>
            {["event", "connection"].map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setHints({}); }}
                style={{
                  padding: `${SPACING[1.5]} ${SPACING[3]}`,
                  borderRadius: RADII.md,
                  border: `1.5px solid ${type === t ? "#0D9488" : theme.inputBorder}`,
                  background: type === t ? "#0D948815" : theme.inputBg,
                  color: type === t ? "#0D9488" : theme.textSecondary,
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_MONO,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: SPACING[2] }}>
            <label style={{ fontSize: FONT_SIZES.micro, fontWeight: 700, fontFamily: FONT_MONO, color: theme.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: SPACING[1] }}>
              Bounty Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              placeholder='e.g. "Find an event about the Treaty of Versailles"'
            />
          </div>

          {/* Description / instructions */}
          <div style={{ marginBottom: SPACING[2.5] }}>
            <label style={{ fontSize: FONT_SIZES.micro, fontWeight: 700, fontFamily: FONT_MONO, color: theme.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: SPACING[1] }}>
              Instructions for Students *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              placeholder="Describe what you're looking for and any specific requirements..."
            />
          </div>

          {/* Hint fields */}
          <div style={{
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            fontFamily: FONT_MONO,
            color: theme.textTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: SPACING[1.5],
          }}>
            Pre-fill Hints (shown as placeholders)
          </div>

          {type === "event" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5], marginBottom: SPACING[3] }}>
              <input value={hints.title || ""} onChange={(e) => updateHint("title", e.target.value)} style={inputStyle} placeholder="Hint for title..." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING[1.5] }}>
                <input value={hints.year || ""} onChange={(e) => updateHint("year", e.target.value)} style={inputStyle} placeholder="Hint for year..." />
                <select value={hints.period || ""} onChange={(e) => updateHint("period", e.target.value)} style={inputStyle}>
                  <option value="">Period hint...</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <textarea value={hints.description || ""} onChange={(e) => updateHint("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={2} placeholder="Hint for description..." />
              <input value={hints.region || ""} onChange={(e) => updateHint("region", e.target.value)} style={inputStyle} placeholder="Hint for region..." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5], marginBottom: SPACING[3] }}>
              <select value={hints.causeEventId || ""} onChange={(e) => updateHint("causeEventId", e.target.value)} style={inputStyle}>
                <option value="">Hint: cause event...</option>
                {approvedEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.year} — {ev.title}</option>)}
              </select>
              <select value={hints.effectEventId || ""} onChange={(e) => updateHint("effectEventId", e.target.value)} style={inputStyle}>
                <option value="">Hint: effect event...</option>
                {approvedEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.year} — {ev.title}</option>)}
              </select>
              <textarea value={hints.connectionDescription || ""} onChange={(e) => updateHint("connectionDescription", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={2} placeholder="Hint for connection description..." />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: SPACING[1.5], justifyContent: "flex-end" }}>
            <button
              onClick={resetForm}
              style={{
                padding: `${SPACING[1.5]} ${SPACING[3]}`,
                background: "none",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: RADII.md,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                cursor: "pointer",
                color: theme.textTertiary,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.subtleBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || !title.trim() || !description.trim()}
              style={{
                padding: `${SPACING[1.5]} ${SPACING[3]}`,
                background: title.trim() && description.trim() ? "#0D9488" : theme.inputBorder,
                color: "#fff",
                border: "none",
                borderRadius: RADII.md,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                cursor: title.trim() && description.trim() ? "pointer" : "default",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { if (title.trim() && description.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              {submitting ? "..." : "Post Bounty"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING[1],
            padding: `${SPACING[2]} ${SPACING[3]}`,
            background: "none",
            border: `1.5px dashed #0D948860`,
            borderRadius: RADII.md,
            color: "#0D9488",
            fontSize: FONT_SIZES.tiny,
            fontFamily: FONT_MONO,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0D948808"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          <Icon icon={plusIcon} width={16} />
          Post a Bounty
        </button>
      )}
    </div>
  );
}
