import { useState } from "react";
import ModalShell, { ModalCloseButton } from "./ModalShell";
import { getRegistryList } from "../easterEggs/registry";
import { linkEasterEgg } from "../services/database";
import {
  useTheme,
  FONT_MONO,
  FONT_SERIF,
  FONT_SIZES,
  SPACING,
  RADII,
} from "../contexts/ThemeContext";

export default function EasterEggLinkDialog({ event, userName, onClose }) {
  const { theme } = useTheme();
  const registryList = getRegistryList();
  const [selectedEggId, setSelectedEggId] = useState(
    registryList[0]?.id || ""
  );
  const [visibility, setVisibility] = useState("visible");
  const [saving, setSaving] = useState(false);

  const handleLink = async () => {
    if (!selectedEggId) return;
    setSaving(true);
    try {
      await linkEasterEgg(event.id, selectedEggId, visibility, userName);
      onClose();
    } catch (err) {
      console.error("Failed to link Easter egg:", err);
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={480}>
      <ModalCloseButton onClose={onClose} />
      <div style={{ padding: `${SPACING[6]} ${SPACING[6]}` }}>
        <h2
          style={{
            fontSize: FONT_SIZES.xl,
            fontWeight: 700,
            fontFamily: FONT_SERIF,
            color: theme.textPrimary,
            margin: `0 0 ${SPACING[1]} 0`,
          }}
        >
          Link Easter Egg
        </h2>
        <p
          style={{
            fontSize: FONT_SIZES.sm,
            color: theme.textSecondary,
            fontFamily: FONT_MONO,
            margin: `0 0 ${SPACING[5]} 0`,
          }}
        >
          Linking to: {event.title}
        </p>

        {/* Game selection */}
        <label
          style={{
            display: "block",
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: theme.textTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: FONT_MONO,
            marginBottom: SPACING[1],
          }}
        >
          Game
        </label>
        <select
          value={selectedEggId}
          onChange={(e) => setSelectedEggId(e.target.value)}
          style={{
            width: "100%",
            padding: `${SPACING[2]} ${SPACING[3]}`,
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: RADII.md,
            background: theme.inputBg,
            color: theme.textPrimary,
            fontSize: FONT_SIZES.base,
            fontFamily: FONT_MONO,
            marginBottom: SPACING[4],
          }}
        >
          {registryList.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>

        {/* Selected game description */}
        {selectedEggId && (
          <p
            style={{
              fontSize: FONT_SIZES.sm,
              color: theme.textDescription,
              fontFamily: FONT_SERIF,
              lineHeight: 1.6,
              margin: `0 0 ${SPACING[4]} 0`,
            }}
          >
            {registryList.find((e) => e.id === selectedEggId)?.description}
          </p>
        )}

        {/* Visibility toggle */}
        <label
          style={{
            display: "block",
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: theme.textTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: FONT_MONO,
            marginBottom: SPACING["1.5"],
          }}
        >
          Discovery Mode
        </label>
        <div
          style={{
            display: "flex",
            gap: SPACING[2],
            marginBottom: SPACING[2],
          }}
        >
          {["visible", "hidden"].map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              style={{
                padding: `${SPACING["1.5"]} ${SPACING[3]}`,
                borderRadius: RADII.md,
                border: `1.5px solid ${
                  visibility === v ? theme.accentGold : theme.inputBorder
                }`,
                background:
                  visibility === v ? theme.accentGold + "18" : theme.inputBg,
                color:
                  visibility === v ? theme.accentGold : theme.textSecondary,
                fontSize: FONT_SIZES.sm,
                fontFamily: FONT_MONO,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: FONT_SIZES.tiny,
            color: theme.textMuted,
            fontFamily: FONT_MONO,
            margin: `0 0 ${SPACING[5]} 0`,
          }}
        >
          {visibility === "visible"
            ? "Students see a clear indicator on the event card."
            : "Students must explore the event to find this egg."}
        </p>

        {/* Confirm button */}
        <button
          onClick={handleLink}
          disabled={saving || !selectedEggId}
          style={{
            width: "100%",
            padding: `${SPACING[3]} ${SPACING[5]}`,
            borderRadius: RADII.lg,
            border: "none",
            background: saving ? theme.inputBorder : theme.accentGold,
            color: "#18181B",
            fontSize: FONT_SIZES.sm,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Linking..." : "Link Easter Egg"}
        </button>
      </div>
    </ModalShell>
  );
}
