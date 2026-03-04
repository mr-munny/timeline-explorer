import { getPeriod } from "../data/constants";
import { formatDate } from "../utils/dateUtils";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";

export default function MapEventPopup({ event, periods, onViewInTimeline }) {
  const { theme, getThemedPeriodBg } = useTheme();
  const period = getPeriod(periods, event.period);

  return (
    <div style={{
      minWidth: 200,
      maxWidth: 280,
      fontFamily: FONT_SERIF,
    }}>
      {/* Period badge + date */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING[2],
        marginBottom: SPACING[2],
      }}>
        {period && (
          <span style={{
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            color: period.color,
            background: getThemedPeriodBg(period) || period.bg,
            padding: `${SPACING["0.5"]} ${SPACING[2]}`,
            borderRadius: RADII.sm,
            whiteSpace: "nowrap",
          }}>
            {period.label}
          </span>
        )}
        <span style={{
          fontSize: FONT_SIZES.micro,
          fontFamily: FONT_MONO,
          color: theme.textSecondary,
        }}>
          {formatDate(event.year, event.month, event.day)}
        </span>
      </div>

      {/* Title */}
      <h4 style={{
        margin: `0 0 ${SPACING[2]}`,
        fontSize: FONT_SIZES.base,
        fontWeight: 700,
        color: theme.textPrimary,
        lineHeight: 1.3,
      }}>
        {event.title}
      </h4>

      {/* Description preview */}
      <p style={{
        margin: `0 0 ${SPACING["2.5"]}`,
        fontSize: FONT_SIZES.tiny,
        color: theme.textDescription,
        lineHeight: 1.5,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {event.description}
      </p>

      {/* View in Timeline button */}
      <button
        onClick={() => onViewInTimeline(event.id)}
        style={{
          width: "100%",
          padding: `${SPACING[2]} ${SPACING[3]}`,
          background: theme.activeToggleBg,
          color: theme.activeToggleText,
          border: "none",
          borderRadius: RADII.md,
          fontSize: FONT_SIZES.micro,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING[1],
        }}
        onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
      >
        <Icon icon={openInNewIcon} width={12} />
        View in Timeline
      </button>
    </div>
  );
}
