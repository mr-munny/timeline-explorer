import { FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import plusIcon from "@iconify-icons/mdi/plus";
import logoutIcon from "@iconify-icons/mdi/logout";
import inboxArrowDown from "@iconify-icons/mdi/inbox-arrow-down";
import shieldAccountOutline from "@iconify-icons/mdi/shield-account-outline";
import vectorLink from "@iconify-icons/mdi/vector-link";
import cogOutline from "@iconify-icons/mdi/cog-outline";
import arrowLeft from "@iconify-icons/mdi/arrow-left";
import bellRingOutline from "@iconify-icons/mdi/bell-ring-outline";
import targetIcon from "@iconify-icons/mdi/bullseye-arrow";
import IconButton from "./IconButton";

export default function TimelineHeader({
  theme,
  mode,
  toggleTheme,
  isTeacher,
  showAdminView,
  setShowAdminView,
  pendingEvents,
  pendingConnections,
  approvedEvents,
  studentCount,
  section,
  activeSections,
  switchSection,
  setShowAddPanel,
  setShowAddConnectionPanel,
  logout,
  showPendingQueue,
  setShowPendingQueue,
  myRevisionEvents = [],
  myRevisionConnections = [],
  myRejectedEvents = [],
  myRejectedConnections = [],
  setShowRevisionPanel,
  openBountyCount = 0,
  setShowBountyBoard,
}) {
  const revisionCount = myRevisionEvents.length + myRevisionConnections.length + myRejectedEvents.length + myRejectedConnections.length;
  const pendingCount = pendingEvents.length + pendingConnections.length;

  const badgeStyle = {
    background: theme.errorRed,
    color: "#fff",
    fontSize: FONT_SIZES.micro,
    fontWeight: 700,
    padding: `${SPACING["0.5"]} ${SPACING[1]}`,
    borderRadius: RADII.lg,
    marginLeft: SPACING["0.5"],
  };

  const headerBtnStyle = {
    background: "transparent",
    padding: `${SPACING["2.5"]} ${SPACING[4]}`,
    border: `1.5px solid ${theme.accentGold}`,
    borderRadius: RADII.lg,
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    letterSpacing: "0.02em",
    gap: SPACING[1],
  };

  return (
    <header style={{ background: theme.headerBg, color: theme.headerText, padding: `${SPACING[6]} ${SPACING[8]} ${SPACING[4]}` }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING[4] }}>
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING["2.5"],
                marginBottom: SPACING["0.5"],
              }}
            >
              {isTeacher && (
                <span
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    fontWeight: 700,
                    color: theme.teacherGreen,
                    fontFamily: FONT_MONO,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: theme.teacherGreenSubtle,
                    padding: `${SPACING[1]} ${SPACING[2]}`,
                    borderRadius: RADII.sm,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: SPACING[1],
                  }}
                >
                  <Icon icon={shieldAccountOutline} width={12} aria-hidden="true" />
                  Teacher View
                </span>
              )}
              {isTeacher && !showAdminView && (
                <IconButton
                  icon={cogOutline}
                  onClick={() => setShowAdminView(true)}
                  title="Open admin panel"
                  size={12}
                  color={theme.teacherGreen}
                  hoverBg={theme.teacherGreen + "35"}
                  style={{
                    background: theme.teacherGreenSubtle, fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                    letterSpacing: "0.1em", textTransform: "uppercase", padding: `${SPACING[1]} ${SPACING[2]}`, borderRadius: RADII.sm, gap: SPACING[1],
                  }}
                >
                  Admin
                  {pendingCount > 0 && (
                    <span style={badgeStyle} aria-label={`${pendingCount} items pending review`}>
                      {pendingCount}
                    </span>
                  )}
                </IconButton>
              )}
              {showAdminView && (
                <IconButton
                  icon={arrowLeft}
                  onClick={() => setShowAdminView(false)}
                  title="Back to timeline"
                  size={12}
                  color={theme.headerSubtext}
                  hoverColor={theme.headerText}
                  hoverBg={theme.headerBorder + "60"}
                  style={{
                    background: theme.headerButtonBg, fontSize: FONT_SIZES.tiny, fontWeight: 700, fontFamily: FONT_MONO,
                    letterSpacing: "0.1em", textTransform: "uppercase", padding: `${SPACING[1]} ${SPACING[2]}`, borderRadius: RADII.sm, gap: SPACING[1],
                  }}
                >
                  Back to Timeline
                </IconButton>
              )}
            </div>
            <h1
              style={{
                fontSize: FONT_SIZES.xxl,
                fontWeight: 700,
                margin: `${SPACING["1.5"]} 0 0 0`,
                fontFamily: FONT_SERIF,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                gap: SPACING[2],
              }}
            >
              <Icon icon={chartTimelineVariantShimmer} width={26} style={{ color: "#F59E0B" }} aria-hidden="true" />
              Timeline Explorer
            </h1>
            {!showAdminView && (
              <p
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: theme.headerSubtext,
                  margin: `${SPACING["1.5"]} 0 0 0`,
                  fontFamily: FONT_MONO,
                }}
              >
                {approvedEvents.length} events &middot; {studentCount} student
                historians &middot;{" "}
                {[...new Set(approvedEvents.map((e) => e.period))].length} time periods
              </p>
            )}
            {showAdminView && (
              <p
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: theme.headerSubtext,
                  margin: `${SPACING["1.5"]} 0 0 0`,
                  fontFamily: FONT_MONO,
                }}
              >
                Administration
              </p>
            )}
            {/* Section tabs (teacher only, hidden in admin) */}
            {isTeacher && !showAdminView && (
              <nav aria-label="Section navigation" style={{ display: "flex", gap: SPACING[1], marginTop: SPACING["2.5"] }}>
                {activeSections.map((s) => {
                  const isActive = section === s.id;
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => switchSection(s.id)}
                      style={{
                        padding: `${SPACING["1.5"]} ${SPACING[3]}`,
                        borderRadius: RADII.md,
                        border: "none",
                        background: isActive ? theme.accentGold : theme.headerButtonBg,
                        color: isActive ? theme.headerBg : theme.headerSubtext,
                        fontSize: FONT_SIZES.sm,
                        fontFamily: FONT_MONO,
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.headerBorder + "60"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = theme.headerButtonBg; }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
          <div style={{ display: "flex", gap: SPACING[2], alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {!showAdminView && (
              <>
                {isTeacher && pendingCount > 0 && (
                  <button
                    onClick={() => setShowAdminView(true)}
                    style={{
                      padding: `${SPACING["2.5"]} ${SPACING[4]}`,
                      background: theme.errorRed,
                      color: theme.headerText,
                      border: "none",
                      borderRadius: RADII.lg,
                      fontSize: FONT_SIZES.tiny,
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      cursor: "pointer",
                      position: "relative",
                      transition: "filter 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                  >
                    <Icon icon={inboxArrowDown} width={14} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} aria-hidden="true" />
                    Review ({pendingCount})
                  </button>
                )}
                {revisionCount > 0 && (
                  <IconButton
                    icon={bellRingOutline}
                    onClick={() => setShowRevisionPanel(true)}
                    title={`${revisionCount} items need revision`}
                    size={14}
                    color={theme.feedbackAmber}
                    hoverBg={theme.feedbackAmber + "15"}
                    style={{
                      ...headerBtnStyle,
                      background: "transparent",
                      borderColor: theme.feedbackAmber,
                    }}
                  >
                    Revisions ({revisionCount})
                  </IconButton>
                )}
                {!isTeacher && pendingCount > 0 && (
                  <IconButton
                    icon={inboxArrowDown}
                    onClick={() => setShowPendingQueue(true)}
                    title={`${pendingCount} items pending`}
                    size={14}
                    color={theme.accentGold}
                    hoverBg={theme.accentGold + "15"}
                    style={headerBtnStyle}
                  >
                    Pending ({pendingCount})
                  </IconButton>
                )}
                {openBountyCount > 0 && (
                  <IconButton
                    icon={targetIcon}
                    onClick={() => setShowBountyBoard(true)}
                    title={`${openBountyCount} open bounties`}
                    size={14}
                    color="#0D9488"
                    hoverBg="#0D948815"
                    style={{
                      ...headerBtnStyle,
                      borderColor: "#0D9488",
                    }}
                  >
                    Bounties ({openBountyCount})
                  </IconButton>
                )}
                <button
                  onClick={() => setShowAddPanel(true)}
                  style={{
                    padding: `${SPACING["2.5"]} ${SPACING[4]}`,
                    background: theme.accentGold,
                    color: theme.headerBg,
                    border: "none",
                    borderRadius: RADII.lg,
                    fontSize: FONT_SIZES.tiny,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  <Icon icon={plusIcon} width={14} style={{ verticalAlign: "middle", marginRight: SPACING["0.5"] }} aria-hidden="true" />
                  Add Event
                </button>
                <IconButton
                  icon={vectorLink}
                  onClick={() => setShowAddConnectionPanel(true)}
                  title="Add a cause-effect connection"
                  size={14}
                  color={theme.accentGold}
                  hoverBg={theme.accentGold + "15"}
                  style={headerBtnStyle}
                >
                  Add Connection
                </IconButton>
              </>
            )}
            <button
              onClick={toggleTheme}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                padding: `${SPACING["2.5"]} ${SPACING[3]}`,
                background: "transparent",
                color: theme.headerSubtext,
                border: `1px solid ${theme.headerBorder}`,
                borderRadius: RADII.lg,
                fontSize: FONT_SIZES.md,
                fontFamily: FONT_MONO,
                cursor: "pointer",
                lineHeight: 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.headerBorder + "40"; e.currentTarget.style.color = theme.headerText; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.headerSubtext; }}
            >
              {mode === "dark" ? "\u2600" : "\u263E"}
            </button>
            <IconButton
              icon={logoutIcon}
              onClick={logout}
              title="Sign out"
              size={13}
              color={theme.headerSubtext}
              hoverColor={theme.headerText}
              hoverBg={theme.headerBorder + "40"}
              style={{
                background: "transparent", padding: `${SPACING["2.5"]} ${SPACING[3]}`, border: `1px solid ${theme.headerBorder}`,
                borderRadius: RADII.lg, fontSize: FONT_SIZES.sm, fontFamily: FONT_MONO, fontWeight: 600, gap: SPACING[1],
              }}
            >
              Sign Out
            </IconButton>
          </div>
      </div>
    </header>
  );
}
