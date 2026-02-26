import { SCHOOL_DOMAIN } from "../firebase";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import googleIcon from "@iconify-icons/mdi/google";
import alertCircleOutline from "@iconify-icons/mdi/alert-circle-outline";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginScreen({ onLogin, error }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        fontFamily: "'Newsreader', 'Georgia', serif",
        background: theme.pageBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: theme.textPrimary,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`* { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }`}</style>

      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
          padding: "40px 36px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: theme.cardShadow,
          border: `1.5px solid ${theme.cardBorder}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.accentGold,
            fontFamily: "'Overpass Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: theme.accentGoldSubtle,
            padding: "3px 8px",
            borderRadius: 4,
            display: "inline-block",
            marginBottom: 12,
          }}
        >
          Historian's Workshop
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 6px 0",
            fontFamily: "'Newsreader', 'Georgia', serif",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon icon={chartTimelineVariantShimmer} width={28} style={{ color: "#F59E0B" }} />
          Timeline Explorer
        </h1>

        <p
          style={{
            fontSize: 12,
            color: theme.textSecondary,
            margin: "0 0 28px 0",
            fontFamily: "'Overpass Mono', monospace",
          }}
        >
          Sign in with your school account to continue
        </p>

        {error && (
          <div
            style={{
              background: theme.errorRedBg,
              border: `1px solid ${theme.errorRedBorder}`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              color: theme.errorRedText,
              fontFamily: "'Overpass Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon icon={alertCircleOutline} width={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button
          onClick={onLogin}
          style={{
            padding: "12px 24px",
            background: theme.activeToggleBg,
            color: theme.activeToggleText,
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            width: "100%",
            transition: "all 0.15s",
          }}
        >
          <Icon icon={googleIcon} width={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Sign in with Google
        </button>

        <p
          style={{
            fontSize: 10,
            color: theme.textMuted,
            margin: "16px 0 0 0",
            fontFamily: "'Overpass Mono', monospace",
          }}
        >
          Requires an @{SCHOOL_DOMAIN} account
        </p>
      </div>
    </div>
  );
}
