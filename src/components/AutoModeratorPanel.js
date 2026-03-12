import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { saveAutoModeratorVisible, saveAutoModeratorEnabled } from "../services/database";
import { Icon } from "@iconify/react";
import eyeIcon from "@iconify-icons/mdi/eye";
import eyeOffIcon from "@iconify-icons/mdi/eye-off";

export default function AutoModeratorPanel({ isSuperAdmin, autoModeratorVisible, autoModeratorEnabled, teacherUid }) {
  const { theme } = useTheme();

  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING[2],
        padding: `${SPACING[2]} ${SPACING[3]}`,
        borderRadius: RADII.lg,
        border: `1.5px solid ${enabled ? theme.accentGold : theme.inputBorder}`,
        background: enabled ? theme.accentGold + "15" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <span style={{
        fontSize: FONT_SIZES.micro,
        fontFamily: FONT_MONO,
        fontWeight: 700,
        color: enabled ? theme.accentGold : theme.textSecondary,
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <span style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: enabled ? theme.accentGold : theme.inputBorder,
        position: "relative",
        display: "inline-block",
        transition: "background 0.15s",
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute",
          top: 2,
          left: enabled ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s",
        }} />
      </span>
    </button>
  );

  return (
    <div style={{
      padding: `${SPACING[6]} ${SPACING[8]}`,
      maxWidth: 640,
      fontFamily: FONT_MONO,
    }}>
      <h2 style={{
        fontSize: FONT_SIZES.lg,
        fontWeight: 700,
        margin: 0,
        fontFamily: FONT_SERIF,
        color: theme.textPrimary,
        marginBottom: SPACING[2],
      }}>
        Auto-moderator
      </h2>
      <p style={{
        fontSize: FONT_SIZES.micro,
        color: theme.textSecondary,
        margin: `0 0 ${SPACING[5]}`,
        fontFamily: FONT_MONO,
        lineHeight: 1.5,
      }}>
        AI-powered tools that assist with reviewing and managing student submissions.
      </p>

      {/* Super admin visibility toggle */}
      {isSuperAdmin && (
        <div style={{
          padding: `${SPACING[3]} ${SPACING[4]}`,
          borderRadius: RADII.lg,
          border: `1.5px solid ${theme.cardBorder}`,
          background: theme.subtleBg,
          marginBottom: SPACING[6],
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
            <Icon
              icon={autoModeratorVisible ? eyeIcon : eyeOffIcon}
              width={18}
              style={{ color: autoModeratorVisible ? theme.accentGold : theme.textMuted }}
            />
            <div>
              <div style={{
                fontSize: FONT_SIZES.tiny,
                fontWeight: 700,
                color: theme.textPrimary,
                fontFamily: FONT_MONO,
              }}>
                Visibility for Teachers
              </div>
              <div style={{
                fontSize: FONT_SIZES.micro,
                color: theme.textSecondary,
                fontFamily: FONT_MONO,
                marginTop: SPACING["0.5"],
              }}>
                {autoModeratorVisible
                  ? "Other teachers can see and use auto-moderator features"
                  : "Auto-moderator features are hidden from other teachers"}
              </div>
            </div>
          </div>
          <button
            onClick={() => saveAutoModeratorVisible(!autoModeratorVisible)}
            style={{
              padding: `${SPACING["1.5"]} ${SPACING[3]}`,
              borderRadius: RADII.md,
              border: `1.5px solid ${autoModeratorVisible ? theme.accentGold : theme.inputBorder}`,
              background: autoModeratorVisible ? theme.accentGold + "15" : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              color: autoModeratorVisible ? theme.accentGold : theme.textSecondary,
              whiteSpace: "nowrap",
            }}
          >
            {autoModeratorVisible ? "Visible" : "Hidden"}
          </button>
        </div>
      )}

      {/* Event Suggestions feature */}
      <div style={{
        padding: `${SPACING[4]} ${SPACING[4]}`,
        borderRadius: RADII.lg,
        border: `1.5px solid ${theme.cardBorder}`,
        background: theme.cardBg,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div style={{ flex: 1, marginRight: SPACING[4] }}>
            <h3 style={{
              fontSize: FONT_SIZES.sm,
              fontWeight: 700,
              margin: 0,
              fontFamily: FONT_SERIF,
              color: theme.textPrimary,
              marginBottom: SPACING[1],
            }}>
              Event Suggestions
            </h3>
            <p style={{
              fontSize: FONT_SIZES.micro,
              color: theme.textSecondary,
              margin: 0,
              fontFamily: FONT_MONO,
              lineHeight: 1.5,
            }}>
              When enabled, new event submissions are automatically sent to the AI for review. The AI evaluates historical accuracy and provides a recommendation score to help inform your approval decisions.
            </p>
          </div>
          <ToggleSwitch
            enabled={autoModeratorEnabled}
            onToggle={() => teacherUid && saveAutoModeratorEnabled(teacherUid, !autoModeratorEnabled)}
            label={autoModeratorEnabled ? "On" : "Off"}
          />
        </div>
      </div>
    </div>
  );
}