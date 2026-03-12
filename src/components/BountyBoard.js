import { Icon } from "@iconify/react";
import targetIcon from "@iconify-icons/mdi/bullseye-arrow";
import checkCircleOutline from "@iconify-icons/mdi/check-circle-outline";
import arrowRightBold from "@iconify-icons/mdi/arrow-right-bold";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { getPeriod } from "../data/constants";
import ModalShell, { ModalCloseButton } from "./ModalShell";

export default function BountyBoard({ bounties, completedBounties, onAccept, onClose, periods, approvedEvents }) {
  const { theme } = useTheme();

  const findEvent = (id) => approvedEvents.find((e) => e.id === id);

  return (
    <ModalShell onClose={onClose} maxWidth={560}>
      <ModalCloseButton onClose={onClose} />
      <div style={{ padding: `${SPACING[5]} ${SPACING[5]}` }}>
        <h2
          style={{
            fontSize: FONT_SIZES.lg,
            fontWeight: 700,
            fontFamily: FONT_SERIF,
            color: theme.textPrimary,
            margin: `0 0 ${SPACING[1]} 0`,
            display: "flex",
            alignItems: "center",
            gap: SPACING[2],
          }}
        >
          <Icon icon={targetIcon} width={22} style={{ color: "#0D9488" }} />
          Bounty Board
        </h2>
        <p style={{
          fontSize: FONT_SIZES.tiny,
          fontFamily: FONT_MONO,
          color: theme.textSecondary,
          margin: `0 0 ${SPACING[4]} 0`,
        }}>
          Your teacher is looking for these events and connections. Accept a bounty to get started.
        </p>

        {bounties.length === 0 && completedBounties.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: `${SPACING[6]} 0`,
            color: theme.textMuted,
            fontFamily: FONT_MONO,
            fontSize: FONT_SIZES.sm,
          }}>
            No bounties posted yet.
          </div>
        )}

        {/* Open bounties */}
        {bounties.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2.5], marginBottom: completedBounties.length > 0 ? SPACING[4] : 0 }}>
            {bounties.map((bounty) => (
              <div
                key={bounty.id}
                style={{
                  padding: `${SPACING[3]} ${SPACING[4]}`,
                  border: `1.5px solid #0D948830`,
                  borderRadius: RADII.lg,
                  borderLeft: `4px solid #0D9488`,
                  background: "#0D948806",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: SPACING[1.5], marginBottom: SPACING[1.5] }}>
                  <span
                    style={{
                      fontSize: FONT_SIZES.micro,
                      fontWeight: 700,
                      fontFamily: FONT_MONO,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: `${SPACING[0.5] || "0.1875rem"} ${SPACING[2]}`,
                      borderRadius: RADII.sm,
                      background: bounty.type === "event" ? "#0D948815" : (theme.accentGold || "#F59E0B") + "15",
                      color: bounty.type === "event" ? "#0D9488" : (theme.accentGold || "#F59E0B"),
                    }}
                  >
                    {bounty.type}
                  </span>
                </div>
                <div style={{
                  fontSize: FONT_SIZES.base,
                  fontWeight: 700,
                  fontFamily: FONT_SERIF,
                  color: theme.textPrimary,
                  marginBottom: SPACING[1],
                }}>
                  {bounty.title}
                </div>
                <p style={{
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_SERIF,
                  color: theme.textDescription,
                  lineHeight: 1.6,
                  margin: `0 0 ${SPACING[2]} 0`,
                }}>
                  {bounty.description}
                </p>

                {/* Show connection hints if present */}
                {bounty.type === "connection" && bounty.hints && (bounty.hints.causeEventId || bounty.hints.effectEventId) && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[1.5],
                    flexWrap: "wrap",
                    marginBottom: SPACING[2],
                    padding: `${SPACING[1.5]} ${SPACING[2.5]}`,
                    background: theme.warmSubtleBg,
                    borderRadius: RADII.md,
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_MONO,
                  }}>
                    {bounty.hints.causeEventId ? (
                      <span style={{ color: theme.textSecondary }}>{findEvent(bounty.hints.causeEventId)?.title || "?"}</span>
                    ) : (
                      <span style={{ color: theme.textMuted, fontStyle: "italic" }}>???</span>
                    )}
                    <Icon icon={arrowRightBold} width={14} style={{ color: theme.accentGold || "#F59E0B" }} />
                    {bounty.hints.effectEventId ? (
                      <span style={{ color: theme.textSecondary }}>{findEvent(bounty.hints.effectEventId)?.title || "?"}</span>
                    ) : (
                      <span style={{ color: theme.textMuted, fontStyle: "italic" }}>???</span>
                    )}
                  </div>
                )}

                {/* Show event hints preview if present */}
                {bounty.type === "event" && bounty.hints && (bounty.hints.year || bounty.hints.period) && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    marginBottom: SPACING[2],
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_MONO,
                    color: theme.textMuted,
                  }}>
                    {bounty.hints.year && <span>~{bounty.hints.year}</span>}
                    {bounty.hints.period && (() => {
                      const p = getPeriod(periods, bounty.hints.period);
                      return p ? (
                        <span style={{
                          padding: `0 ${SPACING[1.5]}`,
                          borderRadius: RADII.sm,
                          background: p.bg,
                          color: p.color,
                          fontSize: FONT_SIZES.micro,
                          fontWeight: 600,
                        }}>
                          {p.label}
                        </span>
                      ) : null;
                    })()}
                    {bounty.hints.region && <span>{bounty.hints.region}</span>}
                  </div>
                )}

                <button
                  onClick={() => onAccept(bounty)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: SPACING[1],
                    padding: `${SPACING[1.5]} ${SPACING[3]}`,
                    background: "#0D9488",
                    color: "#fff",
                    border: "none",
                    borderRadius: RADII.md,
                    fontSize: FONT_SIZES.micro,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  <Icon icon={targetIcon} width={13} />
                  Accept Bounty
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed bounties */}
        {completedBounties.length > 0 && (
          <>
            <div style={{
              fontSize: FONT_SIZES.micro,
              fontWeight: 700,
              fontFamily: FONT_MONO,
              color: theme.textTertiary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: SPACING[2],
            }}>
              Completed
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1.5] }}>
              {completedBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[3]}`,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: RADII.md,
                    opacity: 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontSize: FONT_SIZES.tiny,
                      fontFamily: FONT_SERIF,
                      color: theme.textSecondary,
                      textDecoration: "line-through",
                    }}>
                      {bounty.title}
                    </span>
                    <span style={{
                      fontSize: FONT_SIZES.micro,
                      fontFamily: FONT_MONO,
                      color: theme.successGreen || "#16A34A",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: SPACING[0.5],
                    }}>
                      <Icon icon={checkCircleOutline} width={11} />
                      {bounty.completedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
