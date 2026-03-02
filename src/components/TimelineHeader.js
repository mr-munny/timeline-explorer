import { FONT_MONO, FONT_SERIF } from "../contexts/ThemeContext";
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
  setShowRevisionPanel,
}) {
  const revisionCount = myRevisionEvents.length + myRevisionConnections.length;
  return (
    <div style={{ background: theme.headerBg, color: theme.headerText, padding: "24px 28px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 2,
              }}
            >
{isTeacher && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.teacherGreen,
                    fontFamily: FONT_MONO,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: theme.teacherGreenSubtle,
                    padding: "3px 8px",
                    borderRadius: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon icon={shieldAccountOutline} width={12} />
                  Teacher View
                </span>
              )}
              {isTeacher && !showAdminView && (
                <IconButton
                  icon={cogOutline}
                  onClick={() => setShowAdminView(true)}
                  size={12}
                  color={theme.teacherGreen}
                  hoverBg={theme.teacherGreen + "35"}
                  style={{
                    background: theme.teacherGreenSubtle, fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                    letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, gap: 4,
                  }}
                >
                  Admin
                  {(pendingEvents.length + pendingConnections.length) > 0 && (
                    <span style={{
                      background: theme.errorRed, color: "#fff", fontSize: 8, fontWeight: 700,
                      padding: "1px 4px", borderRadius: 8, marginLeft: 2,
                    }}>
                      {pendingEvents.length + pendingConnections.length}
                    </span>
                  )}
                </IconButton>
              )}
              {showAdminView && (
                <IconButton
                  icon={arrowLeft}
                  onClick={() => setShowAdminView(false)}
                  size={12}
                  color={theme.headerSubtext}
                  hoverColor={theme.headerText}
                  hoverBg={theme.headerBorder + "60"}
                  style={{
                    background: theme.headerButtonBg, fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                    letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, gap: 4,
                  }}
                >
                  Back to Timeline
                </IconButton>
              )}
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                margin: "6px 0 0 0",
                fontFamily: FONT_SERIF,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon icon={chartTimelineVariantShimmer} width={26} style={{ color: "#F59E0B" }} />
              Timeline Explorer
            </h1>
            {!showAdminView && (
              <p
                style={{
                  fontSize: 11,
                  color: theme.headerSubtext,
                  margin: "6px 0 0 0",
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
                  fontSize: 11,
                  color: theme.headerSubtext,
                  margin: "6px 0 0 0",
                  fontFamily: FONT_MONO,
                }}
              >
                Administration
              </p>
            )}
            {/* View switcher (teacher only, hidden in admin) */}
            {isTeacher && !showAdminView && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {[{ id: "all", name: "All Sections" }, ...activeSections].map((s) => {
                  const isActive = section === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => switchSection(s.id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: isActive ? theme.accentGold : theme.headerButtonBg,
                        color: isActive ? theme.headerBg : theme.headerSubtext,
                        fontSize: 11,
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
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {!showAdminView && (
              <>
                {isTeacher && (pendingEvents.length + pendingConnections.length) > 0 && (
                  <button
                    onClick={() => setShowAdminView(true)}
                    style={{
                      padding: "10px 18px",
                      background: theme.errorRed,
                      color: theme.headerText,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      cursor: "pointer",
                      position: "relative",
                      transition: "filter 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                  >
                    <Icon icon={inboxArrowDown} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Review ({pendingEvents.length + pendingConnections.length})
                  </button>
                )}
                {revisionCount > 0 && (
                  <IconButton
                    icon={bellRingOutline}
                    onClick={() => setShowRevisionPanel(true)}
                    size={14}
                    color={theme.feedbackAmber}
                    hoverBg={theme.feedbackAmber + "15"}
                    style={{
                      background: "transparent", padding: "10px 18px", border: `1.5px solid ${theme.feedbackAmber}`,
                      borderRadius: 8, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, gap: 4,
                    }}
                  >
                    Revisions ({revisionCount})
                  </IconButton>
                )}
                {!isTeacher && (pendingEvents.length + pendingConnections.length) > 0 && (
                  <IconButton
                    icon={inboxArrowDown}
                    onClick={() => setShowPendingQueue(true)}
                    size={14}
                    color={theme.accentGold}
                    hoverBg={theme.accentGold + "15"}
                    style={{
                      background: "transparent", padding: "10px 18px", border: `1.5px solid ${theme.accentGold}`,
                      borderRadius: 8, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, gap: 4,
                    }}
                  >
                    Pending ({pendingEvents.length + pendingConnections.length})
                  </IconButton>
                )}
                <button
                  onClick={() => setShowAddPanel(true)}
                  style={{
                    padding: "10px 18px",
                    background: theme.accentGold,
                    color: theme.headerBg,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  <Icon icon={plusIcon} width={14} style={{ verticalAlign: "middle", marginRight: 2 }} />
                  Add Event
                </button>
                <IconButton
                  icon={vectorLink}
                  onClick={() => setShowAddConnectionPanel(true)}
                  size={14}
                  color={theme.accentGold}
                  hoverBg={theme.accentGold + "15"}
                  style={{
                    background: "transparent", padding: "10px 18px", border: `1.5px solid ${theme.accentGold}`,
                    borderRadius: 8, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: "0.02em", gap: 4,
                  }}
                >
                  Add Connection
                </IconButton>
              </>
            )}
            <button
              onClick={toggleTheme}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                padding: "10px 14px",
                background: "transparent",
                color: theme.headerSubtext,
                border: `1px solid ${theme.headerBorder}`,
                borderRadius: 8,
                fontSize: 16,
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
              size={13}
              color={theme.headerSubtext}
              hoverColor={theme.headerText}
              hoverBg={theme.headerBorder + "40"}
              style={{
                background: "transparent", padding: "10px 14px", border: `1px solid ${theme.headerBorder}`,
                borderRadius: 8, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600, gap: 4,
              }}
            >
              Sign Out
            </IconButton>
          </div>
      </div>
    </div>
  );
}