import { SCHOOL_DOMAIN, ALLOW_ALL_DOMAINS } from "../firebase";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import googleIcon from "@iconify-icons/mdi/google";
import alertCircleOutline from "@iconify-icons/mdi/alert-circle-outline";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";

export default function LoginScreen({ onLogin, error }) {
  const { theme } = useTheme();

  return (
    <main
      style={{
        fontFamily: FONT_SERIF,
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
          borderRadius: RADII["2xl"],
          padding: `${SPACING[10]} ${SPACING[8]}`,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: theme.cardShadow,
          border: `1.5px solid ${theme.cardBorder}`,
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            fontWeight: 700,
            color: theme.accentGold,
            fontFamily: FONT_MONO,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: theme.accentGoldSubtle,
            padding: `${SPACING[1]} ${SPACING[2]}`,
            borderRadius: RADII.sm,
            display: "inline-block",
            marginBottom: SPACING[3],
          }}
        >
          Historian's Workshop
        </div>

        <h1
          style={{
            fontSize: FONT_SIZES.xxl,
            fontWeight: 700,
            margin: `0 0 ${SPACING["1.5"]} 0`,
            fontFamily: FONT_SERIF,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: SPACING[2],
          }}
        >
          <Icon icon={chartTimelineVariantShimmer} width={28} style={{ color: "#F59E0B" }} aria-hidden="true" />
          Timeline Explorer
        </h1>

        <p
          style={{
            fontSize: FONT_SIZES.base,
            color: theme.textSecondary,
            margin: `0 0 ${SPACING[8]} 0`,
            fontFamily: FONT_MONO,
          }}
        >
          Sign in with your school account to continue
        </p>

        {error && (
          <div
            role="alert"
            style={{
              background: theme.errorRedBg,
              border: `1px solid ${theme.errorRedBorder}`,
              borderRadius: RADII.lg,
              padding: `${SPACING["2.5"]} ${SPACING[3]}`,
              marginBottom: SPACING[4],
              fontSize: FONT_SIZES.base,
              color: theme.errorRedText,
              fontFamily: FONT_MONO,
              display: "flex",
              alignItems: "center",
              gap: SPACING["1.5"],
            }}
          >
            <Icon icon={alertCircleOutline} width={16} style={{ flexShrink: 0 }} aria-hidden="true" />
            {error}
          </div>
        )}

        <button
          onClick={onLogin}
          style={{
            padding: `${SPACING[3]} ${SPACING[6]}`,
            background: theme.activeToggleBg,
            color: theme.activeToggleText,
            border: "none",
            borderRadius: RADII.lg,
            fontSize: FONT_SIZES.sm,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            width: "100%",
            transition: "all 0.15s",
          }}
        >
          <Icon icon={googleIcon} width={16} style={{ verticalAlign: "middle", marginRight: SPACING["1.5"] }} aria-hidden="true" />
          Sign in with Google
        </button>

        <p
          style={{
            fontSize: FONT_SIZES.micro,
            color: theme.textMuted,
            margin: `${SPACING[4]} 0 0 0`,
            fontFamily: FONT_MONO,
          }}
        >
          {ALLOW_ALL_DOMAINS ? "Any Google account can sign in" : `Requires an @${SCHOOL_DOMAIN} account`}
        </p>
      </div>
    </main>
  );
}
