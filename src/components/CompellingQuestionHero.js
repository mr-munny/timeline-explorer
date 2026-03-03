import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING } from "../contexts/ThemeContext";

export default function CompellingQuestionHero({ compellingQuestion }) {
  const { theme } = useTheme();

  if (!compellingQuestion || !compellingQuestion.enabled || !compellingQuestion.text.trim()) {
    return null;
  }

  return (
    <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
      <div
        role="region"
        aria-label="Compelling question"
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: `${SPACING[6]} ${SPACING[8]} ${SPACING[5]}`,
          textAlign: "center",
        }}
      >
        <div style={{
          fontSize: FONT_SIZES.micro,
          fontWeight: 700,
          color: theme.textMuted,
          fontFamily: FONT_MONO,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: SPACING[2],
        }}>
          Compelling Question
        </div>
        <p style={{
          fontSize: FONT_SIZES.lg,
          fontWeight: 600,
          fontFamily: FONT_SERIF,
          color: theme.textPrimary,
          lineHeight: 1.4,
          margin: 0,
          fontStyle: "italic",
          maxWidth: 680,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          {compellingQuestion.text}
        </p>
      </div>
    </div>
  );
}
