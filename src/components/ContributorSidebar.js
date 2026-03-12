import { useMemo } from "react";
import { Icon } from "@iconify/react";
import accountGroup from "@iconify-icons/mdi/account-group";
import trophyOutline from "@iconify-icons/mdi/trophy-outline";
import puzzleOutline from "@iconify-icons/mdi/puzzle-outline";
import targetIcon from "@iconify-icons/mdi/bullseye-arrow";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";

export default function ContributorSidebar({ events, teacherEmail, easterEggDiscoveries, bounties = [] }) {
  const { theme } = useTheme();

  const contributors = useMemo(() => {
    const byName = {};
    events.forEach((e) => {
      if (!byName[e.addedBy]) {
        byName[e.addedBy] = { count: 0, discoveryCount: 0, bountyCount: 0, email: e.addedByEmail };
      }
      byName[e.addedBy].count += 1;
    });
    if (easterEggDiscoveries) {
      easterEggDiscoveries.forEach((d) => {
        if (!byName[d.discoveredBy]) {
          byName[d.discoveredBy] = { count: 0, discoveryCount: 0, bountyCount: 0, email: d.discoveredByEmail };
        }
        byName[d.discoveredBy].discoveryCount += 1;
      });
    }
    // Count completed bounties per student
    if (bounties) {
      bounties.forEach((b) => {
        if (b.status === "completed" && b.completedBy) {
          if (!byName[b.completedBy]) {
            byName[b.completedBy] = { count: 0, discoveryCount: 0, bountyCount: 0, email: "" };
          }
          byName[b.completedBy].bountyCount += 1;
        }
      });
    }
    return Object.entries(byName)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, discoveryCount, bountyCount, email }]) => ({
        name,
        count,
        discoveryCount,
        bountyCount,
        isTeacher: email === teacherEmail,
      }));
  }, [events, easterEggDiscoveries, bounties, teacherEmail]);

  const topContributor = contributors.find((x) => !x.isTeacher);

  return (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: RADII.xl,
        border: `1.5px solid ${theme.cardBorder}`,
        padding: `${SPACING[4]} ${SPACING[4]}`,
      }}
    >
      <h3
        style={{
          fontSize: FONT_SIZES.sm,
          fontWeight: 700,
          color: theme.textSecondary,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: `0 0 ${SPACING[3]} 0`,
        }}
      >
        <Icon icon={accountGroup} width={13} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} aria-hidden="true" />
        Contributors
      </h3>
      <div role="list" style={{ display: "flex", flexDirection: "column", gap: SPACING["1.5"] }}>
        {contributors.map((c) => (
          <div
            key={c.name}
            role="listitem"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: `${SPACING["1.5"]} 0`,
            }}
          >
            <span
              style={{
                fontSize: FONT_SIZES.base,
                fontFamily: FONT_MONO,
                color: c.isTeacher ? theme.textTertiary : theme.textPrimary,
                fontWeight: c.isTeacher ? 500 : 600,
                fontStyle: c.isTeacher ? "italic" : "normal",
              }}
            >
              {!c.isTeacher && c === topContributor && (
                <Icon icon={trophyOutline} width={12} style={{ color: "#F59E0B", marginRight: SPACING["0.5"], verticalAlign: "middle" }} aria-hidden="true" />
              )}
              {c.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: SPACING["1.5"] }}>
              <div
                role="img"
                aria-label={`${c.count} events`}
                style={{
                  width: Math.min(c.count * 16, 80),
                  height: 6,
                  borderRadius: 3,
                  background: c.isTeacher ? theme.inputBorder : theme.textPrimary,
                  transition: "width 0.3s ease",
                }}
              />
              <span
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontFamily: FONT_MONO,
                  color: theme.textSecondary,
                  fontWeight: 600,
                  minWidth: 16,
                  textAlign: "right",
                }}
              >
                {c.count}
              </span>
              {c.bountyCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                  title={`${c.bountyCount} ${c.bountyCount === 1 ? "bounty" : "bounties"} completed`}
                >
                  {Array.from({ length: Math.min(c.bountyCount, 8) }).map((_, i) => (
                    <Icon
                      key={i}
                      icon={targetIcon}
                      width={9}
                      style={{ color: "#0D9488" }}
                      aria-hidden="true"
                    />
                  ))}
                  {c.bountyCount > 8 && (
                    <span style={{
                      fontSize: FONT_SIZES.micro,
                      fontFamily: FONT_MONO,
                      color: "#0D9488",
                      fontWeight: 700,
                    }}>
                      +{c.bountyCount - 8}
                    </span>
                  )}
                </span>
              )}
              {c.discoveryCount > 0 && (
                <span
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_MONO,
                    color: theme.accentGold,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: SPACING["0.5"],
                  }}
                >
                  <Icon icon={puzzleOutline} width={10} aria-hidden="true" />
                  {c.discoveryCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
