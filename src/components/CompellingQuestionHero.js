import { useTheme } from "../contexts/ThemeContext";

export default function CompellingQuestionHero({ compellingQuestion }) {
  const { theme } = useTheme();

  if (!compellingQuestion || !compellingQuestion.enabled || !compellingQuestion.text.trim()) {
    return null;
  }

  return (
    <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
      <div style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "24px 28px 20px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: theme.textMuted,
          fontFamily: "'Overpass Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Compelling Question
        </div>
        <p style={{
          fontSize: 20,
          fontWeight: 600,
          fontFamily: "'Newsreader', 'Georgia', serif",
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
