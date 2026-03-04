import { useState } from "react";
import { TAGS, SOURCE_TYPES, DEFAULT_FIELD_CONFIG } from "../data/constants";
import { MONTHS, maxDaysInMonth, dateToFractionalYear } from "../utils/dateUtils";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import sendIcon from "@iconify-icons/mdi/send";
import lightbulbOutline from "@iconify-icons/mdi/lightbulb-outline";
import mapMarkerIcon from "@iconify-icons/mdi/map-marker";
import mapMarkerRemoveOutline from "@iconify-icons/mdi/map-marker-remove-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import FeedbackBanner from "./FeedbackBanner";
import ModalShell from "./ModalShell";
import IconButton from "./IconButton";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function AddEventPanel({ onAdd, onClose, userName, timelineStart = 1910, timelineEnd = 2000, periods = [], fieldConfig, editingEvent, isTeacher, revisionMode = false, feedback = null }) {
  const fc = { ...DEFAULT_FIELD_CONFIG, ...(fieldConfig || {}) };
  const { theme, mode, getThemedSourceTypeBg } = useTheme();
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
    latitude: editingEvent.latitude ?? null,
    longitude: editingEvent.longitude ?? null,
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
    latitude: null,
    longitude: null,
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
    if (fc.location === "mandatory" && form.latitude == null) e.location = true;
    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };

  const FIELD_NAMES = { title: "Title", year: "Year", month: "Month", day: "Day", endYear: "End Year", endMonth: "End Month", endDay: "End Day", period: "Time Period", tags: "Tags", description: "Description", sourceNote: "Source Citation", sourceUrl: "Source URL", imageUrl: "Image URL", region: "Region", location: "Location" };

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
    padding: `9px ${SPACING["3"]}`,
    border: `1.5px solid ${errors[field] ? theme.errorRed : theme.inputBorder}`,
    borderRadius: RADII.md,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_MONO,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

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
              {revisionMode ? "Revise Your Submission" : isEditing ? "Edit Historical Event" : "Add a Historical Event"}
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
                : <>Submitting as <strong style={{ color: theme.textDescription }}>{userName}</strong>{!isTeacher && <> &middot; Requires teacher approval</>}</>
              }
            </p>
          </div>
          <IconButton icon={closeIcon} onClick={onClose} size={20} color={theme.textSecondary} hoverColor={theme.textPrimary} hoverBg={theme.subtleBg} />
        </div>

        {revisionMode && <FeedbackBanner feedback={feedback} />}

        <div style={{ display: "flex", flexDirection: "column", gap: SPACING["3.5"] || "0.875rem" }}>
          {/* Title + Year row */}
          <div style={{ display: "grid", gridTemplateColumns: fc.year !== "hidden" ? "1fr 100px" : "1fr", gap: SPACING["2.5"] }}>
            {fc.title !== "hidden" && (
            <div>
              <label htmlFor="aep-title" style={labelStyle}>Event Title{fc.title === "mandatory" ? " *" : ""}</label>
              <input
                id="aep-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What happened?"
                style={fieldStyle("title")}
                aria-invalid={errors.title ? "true" : undefined}
                aria-describedby={errors.title ? "aep-validation-hint" : undefined}
              />
            </div>
            )}
            {fc.year !== "hidden" && (
            <div>
              <label htmlFor="aep-year" style={labelStyle}>Year{fc.year === "mandatory" ? " *" : ""}</label>
              <input
                id="aep-year"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder={String(Math.round((timelineStart + timelineEnd) / 2))}
                type="number"
                style={{
                  ...fieldStyle("year"),
                  borderColor: warnings.year ? theme.feedbackAmber : (errors.year ? theme.errorRed : theme.inputBorder),
                }}
                aria-invalid={errors.year ? "true" : undefined}
                aria-describedby={warnings.year ? "aep-year-warning" : (errors.year ? "aep-validation-hint" : undefined)}
              />
            </div>
            )}
          </div>

          {/* Year out-of-range warning */}
          {warnings.year && (
            <div
              id="aep-year-warning"
              role="alert"
              style={{
                background: theme.feedbackAmberBg,
                border: `1px solid ${theme.feedbackAmber}`,
                borderRadius: RADII.md,
                padding: `${SPACING["2"]} ${SPACING["3"]}`,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                color: theme.feedbackAmberText,
                lineHeight: 1.4,
                marginTop: `-${SPACING["1.5"]}`,
              }}
            >
              {warnings.year}
            </div>
          )}

          {/* Month + Day row */}
          {(fc.month !== "hidden" || fc.day !== "hidden") && (
            <div style={{ display: "flex", gap: SPACING["2.5"] }}>
              {fc.month !== "hidden" && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="aep-month" style={labelStyle}>Month{fc.month === "mandatory" ? " *" : ""}</label>
                  <select
                    id="aep-month"
                    value={form.month}
                    onChange={(e) => update("month", e.target.value)}
                    style={fieldStyle("month")}
                    aria-invalid={errors.month ? "true" : undefined}
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
                  <label htmlFor="aep-day" style={labelStyle}>Day{fc.day === "mandatory" ? " *" : ""}</label>
                  <input
                    id="aep-day"
                    value={form.day}
                    onChange={(e) => update("day", e.target.value)}
                    placeholder="—"
                    type="number"
                    min={1}
                    max={maxDaysInMonth(Number(form.month), Number(form.year))}
                    style={fieldStyle("day")}
                    aria-invalid={errors.day ? "true" : undefined}
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
                  gap: SPACING["2"],
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_MONO,
                  color: theme.textSecondary,
                  cursor: "pointer",
                  userSelect: "none",
                  marginTop: `-${SPACING["1"]}`,
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
                <div style={{ display: "flex", gap: SPACING["2.5"], flexWrap: "wrap" }}>
                  <div style={{ width: 100 }}>
                    <label htmlFor="aep-end-year" style={labelStyle}>End Year *</label>
                    <input
                      id="aep-end-year"
                      value={form.endYear}
                      onChange={(e) => update("endYear", e.target.value)}
                      placeholder={form.year || "—"}
                      type="number"
                      style={fieldStyle("endYear")}
                      aria-invalid={errors.endYear ? "true" : undefined}
                      aria-describedby={warnings.endDate ? "aep-enddate-warning" : undefined}
                    />
                  </div>
                  {fc.month !== "hidden" && (
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label htmlFor="aep-end-month" style={labelStyle}>End Month{fc.month === "mandatory" ? " *" : ""}</label>
                      <select
                        id="aep-end-month"
                        value={form.endMonth}
                        onChange={(e) => update("endMonth", e.target.value)}
                        style={fieldStyle("endMonth")}
                        aria-invalid={errors.endMonth ? "true" : undefined}
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
                      <label htmlFor="aep-end-day" style={labelStyle}>End Day{fc.day === "mandatory" ? " *" : ""}</label>
                      <input
                        id="aep-end-day"
                        value={form.endDay}
                        onChange={(e) => update("endDay", e.target.value)}
                        placeholder="—"
                        type="number"
                        min={1}
                        max={maxDaysInMonth(Number(form.endMonth), Number(form.endYear))}
                        style={fieldStyle("endDay")}
                        aria-invalid={errors.endDay ? "true" : undefined}
                      />
                    </div>
                  )}
                </div>
              )}
              {warnings.endDate && (
                <div
                  id="aep-enddate-warning"
                  role="alert"
                  style={{
                    background: theme.feedbackAmberBg,
                    border: `1px solid ${theme.feedbackAmber}`,
                    borderRadius: RADII.md,
                    padding: `${SPACING["2"]} ${SPACING["3"]}`,
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    color: theme.feedbackAmberText,
                    lineHeight: 1.4,
                    marginTop: `-${SPACING["1.5"]}`,
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
            <label htmlFor="aep-period" style={labelStyle}>Time Period{fc.period === "mandatory" ? " *" : ""}</label>
            <select
              id="aep-period"
              value={form.period}
              onChange={(e) => update("period", e.target.value)}
              style={fieldStyle("period")}
              aria-invalid={errors.period ? "true" : undefined}
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
              id="aep-tags-label"
              style={{
                ...labelStyle,
                color: errors.tags ? theme.errorRed : theme.textTertiary,
              }}
            >
              Tags{fc.tags === "mandatory" ? " (select at least 1) *" : ""}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }} role="group" aria-labelledby="aep-tags-label">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={form.tags.includes(tag)}
                  style={{
                    padding: `5px ${SPACING["2.5"]}`,
                    borderRadius: RADII.sm,
                    border: `1.5px solid ${form.tags.includes(tag) ? theme.activeToggleBg : theme.inputBorder}`,
                    background: form.tags.includes(tag) ? theme.activeToggleBg : theme.inputBg,
                    color: form.tags.includes(tag) ? theme.activeToggleText : theme.textTertiary,
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
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
            <label id="aep-sourcetype-label" style={labelStyle}>Source Type{fc.sourceType === "mandatory" ? " *" : ""}</label>
            <div style={{ display: "flex", gap: SPACING["2"] }} role="group" aria-labelledby="aep-sourcetype-label">
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
                    aria-pressed={isSelected}
                    style={{
                      flex: 1,
                      padding: `${SPACING["2"]} ${SPACING["3"]}`,
                      borderRadius: RADII.md,
                      border: `1.5px solid ${isSelected ? st.color : theme.inputBorder}`,
                      background: isSelected
                        ? (getThemedSourceTypeBg(st.id) || st.bg)
                        : theme.inputBg,
                      color: isSelected ? st.color : theme.textSecondary,
                      fontSize: FONT_SIZES.tiny,
                      fontFamily: FONT_MONO,
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
            <label htmlFor="aep-description" style={labelStyle}>Description{fc.description === "mandatory" ? " *" : ""}</label>
            <textarea
              id="aep-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What happened and why does it matter? Use evidence from your sources."
              rows={4}
              style={{
                ...fieldStyle("description"),
                resize: "vertical",
                lineHeight: 1.5,
              }}
              aria-invalid={errors.description ? "true" : undefined}
            />
          </div>
          )}

          {/* Source Note */}
          {fc.sourceNote !== "hidden" && (
          <div>
            <label htmlFor="aep-source-note" style={labelStyle}>Source Citation{fc.sourceNote === "mandatory" ? " *" : ""}</label>
            <input
              id="aep-source-note"
              value={form.sourceNote}
              onChange={(e) => update("sourceNote", e.target.value)}
              placeholder="Where did you learn about this?"
              style={fieldStyle("sourceNote")}
              aria-invalid={errors.sourceNote ? "true" : undefined}
            />
          </div>
          )}

          {/* Source URL */}
          {fc.sourceUrl !== "hidden" && (
          <div>
            <label htmlFor="aep-source-url" style={labelStyle}>Source URL{fc.sourceUrl === "optional" ? " (optional)" : fc.sourceUrl === "mandatory" ? " *" : ""}</label>
            <input
              id="aep-source-url"
              value={form.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
              placeholder="https://..."
              type="url"
              style={fieldStyle("sourceUrl")}
              aria-invalid={errors.sourceUrl ? "true" : undefined}
            />
          </div>
          )}

          {/* Image URL */}
          {fc.imageUrl !== "hidden" && (
          <div>
            <label htmlFor="aep-image-url" style={labelStyle}>Image URL{fc.imageUrl === "optional" ? " (optional)" : fc.imageUrl === "mandatory" ? " *" : ""}</label>
            <input
              id="aep-image-url"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://upload.wikimedia.org/..."
              type="url"
              style={fieldStyle("imageUrl")}
              aria-invalid={errors.imageUrl ? "true" : undefined}
            />
            {form.imageUrl && !errors.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 150,
                  borderRadius: RADII.md,
                  objectFit: "contain",
                  marginTop: SPACING["1.5"],
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
            <label htmlFor="aep-region" style={labelStyle}>Region{fc.region === "optional" ? " (optional)" : fc.region === "mandatory" ? " *" : ""}</label>
            <input
              id="aep-region"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="e.g. Europe, Pacific, National..."
              style={fieldStyle("region")}
              aria-invalid={errors.region ? "true" : undefined}
            />
          </div>
          )}

          {/* Location (map picker) */}
          {fc.location !== "hidden" && (
          <div>
            <label style={labelStyle}>
              <Icon icon={mapMarkerIcon} width={12} style={{ verticalAlign: "middle", marginRight: SPACING["0.5"] }} />
              Map Location{fc.location === "optional" ? " (optional)" : fc.location === "mandatory" ? " *" : ""}
            </label>
            <div style={{
              borderRadius: RADII.lg,
              overflow: "hidden",
              border: `1.5px solid ${errors.location ? theme.errorRed : theme.inputBorder}`,
              height: 180,
              position: "relative",
            }}>
              <Map
                mapStyle={mode === "dark" ? DARK_STYLE : LIGHT_STYLE}
                initialViewState={{
                  longitude: form.longitude ?? -40,
                  latitude: form.latitude ?? 30,
                  zoom: form.latitude != null ? 4 : 1.5,
                }}
                style={{ width: "100%", height: "100%" }}
                cursor="crosshair"
                onClick={(e) => {
                  setForm((f) => ({
                    ...f,
                    latitude: Math.round(e.lngLat.lat * 1000) / 1000,
                    longitude: Math.round(e.lngLat.lng * 1000) / 1000,
                  }));
                  setErrors((prev) => ({ ...prev, location: undefined }));
                }}
                attributionControl={false}
              >
                <NavigationControl position="top-right" showCompass={false} />
                {form.latitude != null && form.longitude != null && (
                  <Marker
                    longitude={form.longitude}
                    latitude={form.latitude}
                    anchor="bottom"
                  >
                    <Icon icon={mapMarkerIcon} width={28} style={{ color: theme.errorRed, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
                  </Marker>
                )}
              </Map>
            </div>
            {form.latitude != null && form.longitude != null && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: SPACING[2],
              }}>
                <span style={{
                  fontSize: FONT_SIZES.micro,
                  fontFamily: FONT_MONO,
                  color: theme.textSecondary,
                }}>
                  {form.latitude.toFixed(3)}, {form.longitude.toFixed(3)}
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                  style={{
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    color: theme.errorRed,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING["0.5"],
                  }}
                >
                  <Icon icon={mapMarkerRemoveOutline} width={12} />
                  Clear pin
                </button>
              </div>
            )}
            {form.latitude == null && (
              <p style={{
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                color: theme.textMuted,
                marginTop: SPACING[1],
                marginBottom: 0,
              }}>
                Click the map to place a pin for this event's location
              </p>
            )}
          </div>
          )}

          {/* Skill connection hint */}
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
            <span style={{ fontWeight: 700, color: theme.textDescription, display: "inline-flex", alignItems: "center", gap: SPACING["1"] }}>
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
              id="aep-validation-hint"
              role="alert"
              style={{
                background: theme.errorRed + "12",
                border: `1px solid ${theme.errorRed}40`,
                borderRadius: RADII.md,
                padding: `${SPACING["2"]} ${SPACING["3"]}`,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
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
              : <><Icon icon={sendIcon} width={14} style={{ verticalAlign: "middle", marginRight: 5 }} />{revisionMode ? "Resubmit for Review" : isEditing ? "Save Changes" : isTeacher ? "Add Event" : "Submit Event for Approval"}</>
            }
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
