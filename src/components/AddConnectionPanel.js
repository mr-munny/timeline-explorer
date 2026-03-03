import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import sendIcon from "@iconify-icons/mdi/send";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII, Z_INDEX } from "../contexts/ThemeContext";
import FeedbackBanner from "./FeedbackBanner";
import ModalShell from "./ModalShell";
import IconButton from "./IconButton";
import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";

function EventSearchDropdown({ label, events, selectedId, onSelect, excludeId, periods, error, theme, inputId }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const listboxId = `${inputId}-listbox`;

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = events.filter((e) => {
    if (e.id === excludeId) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(term) ||
      String(e.year).includes(term) ||
      (e.addedBy && e.addedBy.toLowerCase().includes(term))
    );
  });

  const selected = selectedId ? events.find((e) => e.id === selectedId) : null;

  const fieldStyle = {
    width: "100%",
    padding: `9px ${SPACING["3"]}`,
    border: `1.5px solid ${error ? theme.errorRed : theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: FONT_SIZES.micro,
    fontWeight: 700,
    color: error ? theme.errorRed : theme.textTertiary,
    fontFamily: FONT_MONO,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: SPACING["1"],
    display: "block",
  };

  if (selected) {
    const period = getPeriod(periods, selected.period);
    const color = period?.color || "#6B7280";
    return (
      <div>
        <label htmlFor={inputId} style={labelStyle}>{label}</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING["2"],
            padding: `${SPACING["2"]} ${SPACING["3"]}`,
            background: theme.warmSubtleBg,
            border: `1.5px solid ${color}60`,
            borderRadius: RADII.md,
            borderLeft: `4px solid ${color}`,
          }}
        >
          <span
            style={{
              background: color,
              color: "#fff",
              fontSize: FONT_SIZES.micro,
              fontWeight: 700,
              padding: `${SPACING["0.5"]} ${SPACING["1.5"]}`,
              borderRadius: RADII.sm,
              fontFamily: FONT_MONO,
              flexShrink: 0,
            }}
          >
            {formatEventDate(selected)}
          </span>
          <span
            style={{
              fontSize: FONT_SIZES.sm,
              fontFamily: FONT_SERIF,
              fontWeight: 600,
              color: theme.textPrimary,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selected.title}
          </span>
          <IconButton icon={closeIcon} onClick={() => onSelect(null)} size={16} color={theme.textSecondary} hoverColor={theme.textPrimary} hoverBg={theme.subtleBg} padding={2} borderRadius={3} style={{ flexShrink: 0 }} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label htmlFor={inputId} style={labelStyle}>{label}</label>
      <input
        id={inputId}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by title, year, or contributor..."
        style={fieldStyle}
        aria-label={`Search for ${label.replace(" *", "").toLowerCase()}`}
        aria-invalid={error ? "true" : undefined}
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        role="combobox"
        aria-autocomplete="list"
      />
      {open && filtered.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label.replace(" *", "")} results`}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflow: "auto",
            background: theme.cardBg,
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: RADII.md,
            marginTop: SPACING["1"],
            zIndex: Z_INDEX.dropdown,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {filtered.slice(0, 30).map((event) => {
            const period = getPeriod(periods, event.period);
            const color = period?.color || "#6B7280";
            return (
              <div
                key={event.id}
                role="option"
                aria-selected={false}
                onClick={() => { onSelect(event.id); setSearch(""); setOpen(false); }}
                style={{
                  padding: `${SPACING["2"]} ${SPACING["3"]}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: SPACING["2"],
                  borderBottom: `1px solid ${theme.inputBorder}40`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.warmSubtleBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  style={{
                    background: color,
                    color: "#fff",
                    fontSize: FONT_SIZES.tiny,
                    fontWeight: 700,
                    padding: `${SPACING["0.5"]} 5px`,
                    borderRadius: 3,
                    fontFamily: FONT_MONO,
                    flexShrink: 0,
                  }}
                >
                  {formatEventDate(event)}
                </span>
                <span
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_SERIF,
                    color: theme.textPrimary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: theme.cardBg,
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: RADII.md,
            marginTop: SPACING["1"],
            padding: `${SPACING["3"]} ${SPACING["3.5"] || "0.875rem"}`,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            color: theme.textSecondary,
            textAlign: "center",
          }}
        >
          No events match "{search}"
        </div>
      )}
    </div>
  );
}

export default function AddConnectionPanel({ onAdd, onClose, userName, approvedEvents, periods, prefilledCause, prefilledEffect, editingConnection, isTeacher, revisionMode = false, feedback = null }) {
  const { theme } = useTheme();
  const isEditing = !!editingConnection;
  const [causeEventId, setCauseEventId] = useState(isEditing ? editingConnection.causeEventId : (prefilledCause || null));
  const [effectEventId, setEffectEventId] = useState(isEditing ? editingConnection.effectEventId : (prefilledEffect || null));
  const [description, setDescription] = useState(isEditing ? editingConnection.description : "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validate = () => {
    const e = {};
    if (!causeEventId) e.cause = true;
    if (!effectEventId) e.effect = true;
    if (!description.trim()) e.description = true;
    if (causeEventId && effectEventId && causeEventId === effectEventId) e.effect = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onAdd({ causeEventId, effectEventId, description: description.trim() });
      onClose();
    } catch (err) {
      console.error("Connection submit failed:", err);
      setSubmitError(err.message || "Failed to submit connection. Check Firebase rules.");
      setSubmitting(false);
    }
  };

  const labelStyle = {
    fontSize: FONT_SIZES.micro,
    fontWeight: 700,
    color: theme.textTertiary,
    fontFamily: FONT_MONO,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: SPACING["1"],
    display: "block",
  };

  return (
    <ModalShell onClose={onClose} maxWidth={520} closeOnBackdrop={false}>
      <div style={{ padding: `${SPACING["8"]} ${SPACING["8"]} ${SPACING["5"]}` }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: SPACING["5"],
          }}
        >
          <div>
            <h2
              style={{
                fontSize: FONT_SIZES.lg,
                fontWeight: 700,
                margin: 0,
                fontFamily: FONT_SERIF,
                color: theme.textPrimary,
              }}
            >
              {revisionMode ? "Revise Your Connection" : isEditing ? "Edit Connection" : "Connect Two Events"}
            </h2>
            <p
              style={{
                fontSize: FONT_SIZES.micro,
                color: theme.textSecondary,
                margin: `${SPACING["1"]} 0 0`,
                fontFamily: FONT_MONO,
              }}
            >
              {revisionMode
                ? <>Address teacher feedback and resubmit</>
                : isEditing
                ? <>Editing as <strong style={{ color: theme.textDescription }}>{userName}</strong></>
                : <>Submitting as <strong style={{ color: theme.textDescription }}>{userName}</strong>
                  {!isTeacher && <> &middot; Requires teacher approval</>}</>
              }
            </p>
          </div>
          <IconButton icon={closeIcon} onClick={onClose} size={20} color={theme.textSecondary} hoverColor={theme.textPrimary} hoverBg={theme.subtleBg} />
        </div>

        {revisionMode && <FeedbackBanner feedback={feedback} />}

        <div style={{ display: "flex", flexDirection: "column", gap: SPACING["3.5"] || "0.875rem" }}>
          <EventSearchDropdown
            label="Cause Event *"
            events={approvedEvents}
            selectedId={causeEventId}
            onSelect={(id) => { setCauseEventId(id); setErrors((e) => ({ ...e, cause: undefined })); }}
            excludeId={effectEventId}
            periods={periods}
            error={errors.cause}
            theme={theme}
            inputId="acp-cause-search"
          />

          <div style={{ display: "flex", justifyContent: "center", padding: `${SPACING["0.5"]} 0` }}>
            <Icon icon={arrowRightBold} width={24} style={{ color: theme.accentGold, transform: "rotate(90deg)" }} />
          </div>

          <EventSearchDropdown
            label="Effect Event *"
            events={approvedEvents}
            selectedId={effectEventId}
            onSelect={(id) => { setEffectEventId(id); setErrors((e) => ({ ...e, effect: undefined })); }}
            excludeId={causeEventId}
            periods={periods}
            error={errors.effect}
            theme={theme}
            inputId="acp-effect-search"
          />

          <div>
            <label htmlFor="acp-description" style={{ ...labelStyle, color: errors.description ? theme.errorRed : theme.textTertiary }}>
              Describe the Connection *
            </label>
            <textarea
              id="acp-description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((err) => ({ ...err, description: undefined })); }}
              placeholder="How does the cause event lead to the effect event? What is the connection?"
              rows={3}
              style={{
                width: "100%",
                padding: `9px ${SPACING["3"]}`,
                border: `1.5px solid ${errors.description ? theme.errorRed : theme.inputBorder}`,
                borderRadius: RADII.md,
                fontSize: FONT_SIZES.sm,
                fontFamily: FONT_MONO,
                background: theme.inputBg,
                color: theme.textPrimary,
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                resize: "vertical",
                lineHeight: 1.5,
              }}
              aria-invalid={errors.description ? "true" : undefined}
            />
          </div>

          <div
            style={{
              background: theme.warmSubtleBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: RADII.lg,
              padding: `${SPACING["2.5"]} ${SPACING["3.5"] || "0.875rem"}`,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              color: theme.textTertiary,
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700, color: theme.textDescription }}>
              Tip:
            </span>{" "}
            Explain the cause-and-effect relationship clearly. What about the cause event
            led to the effect? Use evidence and reasoning, not just "they happened around the same time."
          </div>

          {submitError && (
            <div
              role="alert"
              style={{
                background: theme.errorRedBg,
                border: `1px solid ${theme.errorRed}`,
                borderRadius: RADII.md,
                padding: `${SPACING["2"]} ${SPACING["3"]}`,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                color: theme.errorRedText,
                lineHeight: 1.4,
              }}
            >
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: `${SPACING["3"]} ${SPACING["5"]}`,
              background: submitting ? theme.textSecondary : theme.activeToggleBg,
              color: theme.activeToggleText,
              border: "none",
              borderRadius: RADII.lg,
              fontSize: FONT_SIZES.sm,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {submitting
              ? (isEditing ? "Saving..." : "Submitting...")
              : <><Icon icon={sendIcon} width={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                {revisionMode ? "Resubmit for Review" : isEditing ? "Save Changes" : isTeacher ? "Add Connection" : "Submit Connection for Approval"}</>
            }
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
