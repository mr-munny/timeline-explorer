import { useTheme } from "../contexts/ThemeContext";

export default function FeedbackBanner({ feedback, title = "Teacher Feedback", compact = false }) {
  const { theme } = useTheme();
  if (!feedback) return null;

  const sizes = compact
    ? { label: 9, body: 12, meta: 9, padding: "10px 14px", gap: 4 }
    : { label: 10, body: 13, meta: 10, padding: "12px 16px", gap: 6 };

  return (
    <div style={{
      background: theme.warmSubtleBg || "#FEF3C7",
      border: "1.5px solid #D97706",
      borderLeft: "4px solid #D97706",
      borderRadius: 8,
      padding: sizes.padding,
      marginBottom: compact ? 10 : 4,
    }}>
      <div style={{
        fontSize: sizes.label, fontWeight: 700, fontFamily: "'Overpass Mono', monospace",
        color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: sizes.gap,
      }}>
        {title}
      </div>
      <p style={{
        fontSize: sizes.body, fontFamily: "'Newsreader', serif",
        color: theme.textDescription, lineHeight: 1.6, margin: 0,
      }}>
        {feedback.text}
      </p>
      <div style={{
        fontSize: sizes.meta, fontFamily: "'Overpass Mono', monospace",
        color: theme.textTertiary, marginTop: sizes.gap,
      }}>
        {feedback.givenBy} &middot; {new Date(feedback.date).toLocaleDateString()}
      </div>
    </div>
  );
}
