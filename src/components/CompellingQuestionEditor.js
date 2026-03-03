import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES } from "../contexts/ThemeContext";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import eyeOffOutline from "@iconify-icons/mdi/eye-off-outline";
import IconButton from "./IconButton";

export default function CompellingQuestionEditor({ draftCQ, onCQChange }) {
  const { theme } = useTheme();

  return (
    <>
      <IconButton
        icon={draftCQ.enabled ? eyeOutline : eyeOffOutline}
        onClick={() => onCQChange({ ...draftCQ, enabled: !draftCQ.enabled })}
        aria-label={draftCQ.enabled ? "Hide compelling question from students" : "Show compelling question to students"}
        size={13}
        color={draftCQ.enabled ? theme.teacherGreen : theme.textMuted}
        hoverBg={theme.subtleBg}
        style={{ background: "transparent", padding: "4px 6px", gap: 6, fontSize: FONT_SIZES.tiny, fontFamily: FONT_MONO, fontWeight: 600, marginBottom: 6 }}
      >
        {draftCQ.enabled ? "Visible to students" : "Hidden from students"}
      </IconButton>

      <label htmlFor="compelling-question-text" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Compelling question</label>
      <textarea
        id="compelling-question-text"
        value={draftCQ.text}
        onChange={(e) => onCQChange({ ...draftCQ, text: e.target.value })}
        placeholder="e.g., How did global conflicts reshape the American identity?"
        style={{
          width: "100%",
          padding: "8px 10px",
          border: `1.5px solid ${theme.inputBorder}`,
          borderRadius: 6,
          fontSize: FONT_SIZES.tiny,
          fontFamily: FONT_SERIF,
          background: theme.inputBg,
          color: theme.textPrimary,
          boxSizing: "border-box",
          resize: "vertical",
          minHeight: 60,
        }}
      />
    </>
  );
}
