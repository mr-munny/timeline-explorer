import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import sendIcon from "@iconify-icons/mdi/send";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme } from "../contexts/ThemeContext";
import { getPeriod } from "../data/constants";
import { formatEventDate } from "../utils/dateUtils";

function EventSearchDropdown({ label, events, selectedId, onSelect, excludeId, periods, error, theme }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

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
    padding: "9px 12px",
    border: `1.5px solid ${error ? theme.errorRed : theme.inputBorder}`,
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "'Overpass Mono', monospace",
    background: theme.inputBg,
    color: theme.textPrimary,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: error ? theme.errorRed : theme.textTertiary,
    fontFamily: "'Overpass Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
    display: "block",
  };

  if (selected) {
    const period = getPeriod(periods, selected.period);
    const color = period?.color || "#6B7280";
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: theme.warmSubtleBg,
            border: `1.5px solid ${color}60`,
            borderRadius: 7,
            borderLeft: `4px solid ${color}`,
          }}
        >
          <span
            style={{
              background: color,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "'Overpass Mono', monospace",
              flexShrink: 0,
            }}
          >
            {formatEventDate(selected)}
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: "'Newsreader', serif",
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
          <button
            onClick={() => onSelect(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textSecondary,
              padding: 2,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon icon={closeIcon} width={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by title, year, or contributor..."
        style={fieldStyle}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflow: "auto",
            background: theme.cardBg,
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: 7,
            marginTop: 4,
            zIndex: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {filtered.slice(0, 30).map((event) => {
            const period = getPeriod(periods, event.period);
            const color = period?.color || "#6B7280";
            return (
              <div
                key={event.id}
                onClick={() => { onSelect(event.id); setSearch(""); setOpen(false); }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
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
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 5px",
                    borderRadius: 3,
                    fontFamily: "'Overpass Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {formatEventDate(event)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "'Newsreader', serif",
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
            borderRadius: 7,
            marginTop: 4,
            padding: "12px 14px",
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
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

export default function AddConnectionPanel({ onAdd, onClose, userName, approvedEvents, periods, prefilledCause, prefilledEffect }) {
  const { theme } = useTheme();
  const [causeEventId, setCauseEventId] = useState(prefilledCause || null);
  const [effectEventId, setEffectEventId] = useState(prefilledEffect || null);
  const [description, setDescription] = useState("");
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
              Connect Two Events
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
          <EventSearchDropdown
            label="Cause Event *"
            events={approvedEvents}
            selectedId={causeEventId}
            onSelect={(id) => { setCauseEventId(id); setErrors((e) => ({ ...e, cause: undefined })); }}
            excludeId={effectEventId}
            periods={periods}
            error={errors.cause}
            theme={theme}
          />

          <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
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
          />

          <div>
            <label style={{ ...labelStyle, color: errors.description ? theme.errorRed : theme.textTertiary }}>
              Describe the Connection *
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((err) => ({ ...err, description: undefined })); }}
              placeholder="How does the cause event lead to the effect event? What is the connection?"
              rows={3}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: `1.5px solid ${errors.description ? theme.errorRed : theme.inputBorder}`,
                borderRadius: 7,
                fontSize: 13,
                fontFamily: "'Overpass Mono', monospace",
                background: theme.inputBg,
                color: theme.textPrimary,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

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
            <span style={{ fontWeight: 700, color: theme.textDescription }}>
              Tip:
            </span>{" "}
            Explain the cause-and-effect relationship clearly. What about the cause event
            led to the effect? Use evidence and reasoning, not just "they happened around the same time."
          </div>

          {submitError && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #EF4444",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                color: "#991B1B",
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
            {submitting ? "Submitting..." : <><Icon icon={sendIcon} width={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Submit Connection for Approval</>}
          </button>
        </div>
      </div>
    </div>
  );
}
