import { SCHOOL_DOMAIN } from "../firebase";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import googleIcon from "@iconify-icons/mdi/google";
import alertCircleOutline from "@iconify-icons/mdi/alert-circle-outline";

export default function LoginScreen({ onLogin, error }) {
  return (
    <div
      style={{
        fontFamily: "'Newsreader', 'Georgia', serif",
        background: "#F7F7F5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#1a1a1a",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "40px 36px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          border: "1.5px solid #EBEBEB",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#F59E0B",
            fontFamily: "'Overpass Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "#F59E0B18",
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
            color: "#9CA3AF",
            margin: "0 0 28px 0",
            fontFamily: "'Overpass Mono', monospace",
          }}
        >
          Sign in with your school account to continue
        </p>

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              color: "#991B1B",
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
            background: "#1a1a1a",
            color: "#fff",
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
            color: "#B0B0B0",
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
