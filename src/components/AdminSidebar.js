import { useState } from "react";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import inboxArrowDown from "@iconify-icons/mdi/inbox-arrow-down";
import plusIcon from "@iconify-icons/mdi/plus";
import checkIcon from "@iconify-icons/mdi/check";
import accountGroup from "@iconify-icons/mdi/account-group";

export default function AdminSidebar({ sections, selectedTab, onSelectTab, pendingCount, onAddSection, isSuperAdmin }) {
  const { theme } = useTheme();
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAddSubmit = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onAddSection(trimmed);
      setNewName("");
      setAddingNew(false);
    }
  };

  return (
    <div style={{
      width: 240,
      minWidth: 240,
      borderRight: `1px solid ${theme.cardBorder}`,
      background: theme.bg,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      fontFamily: FONT_MONO,
    }}>
      {/* Moderation tab */}
      <nav aria-label="Admin navigation" style={{ padding: `${SPACING[4]} ${SPACING[3]} ${SPACING[2]}` }}>
        <button
          onClick={() => onSelectTab("moderation")}
          aria-current={selectedTab === "moderation" ? "page" : undefined}
          style={{
            width: "100%",
            padding: `${SPACING["2.5"]} ${SPACING[3]}`,
            borderRadius: RADII.md,
            border: selectedTab === "moderation" ? `1.5px solid ${theme.accentGold}` : `1.5px solid transparent`,
            background: selectedTab === "moderation" ? theme.accentGold + "15" : "transparent",
            color: selectedTab === "moderation" ? theme.accentGold : theme.textPrimary,
            fontSize: FONT_SIZES.micro,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: SPACING[2],
            transition: "all 0.15s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => { if (selectedTab !== "moderation") e.currentTarget.style.background = theme.subtleBg; }}
          onMouseLeave={(e) => { if (selectedTab !== "moderation") e.currentTarget.style.background = "transparent"; }}
        >
          <Icon icon={inboxArrowDown} width={16} />
          Moderation
          {pendingCount > 0 && (
            <span style={{
              marginLeft: "auto",
              background: theme.errorRed,
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              padding: `${SPACING["0.5"]} ${SPACING["1.5"]}`,
              borderRadius: RADII.xl,
              minWidth: 18,
              textAlign: "center",
            }}>
              {pendingCount}
            </span>
          )}
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => onSelectTab("teachers")}
            aria-current={selectedTab === "teachers" ? "page" : undefined}
            style={{
              width: "100%",
              padding: `${SPACING["2.5"]} ${SPACING[3]}`,
              borderRadius: RADII.md,
              border: selectedTab === "teachers" ? `1.5px solid ${theme.accentGold}` : `1.5px solid transparent`,
              background: selectedTab === "teachers" ? theme.accentGold + "15" : "transparent",
              color: selectedTab === "teachers" ? theme.accentGold : theme.textPrimary,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
              transition: "all 0.15s",
              textAlign: "left",
              marginTop: SPACING[1],
            }}
            onMouseEnter={(e) => { if (selectedTab !== "teachers") e.currentTarget.style.background = theme.subtleBg; }}
            onMouseLeave={(e) => { if (selectedTab !== "teachers") e.currentTarget.style.background = "transparent"; }}
          >
            <Icon icon={accountGroup} width={16} />
            Teachers
          </button>
        )}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: theme.cardBorder, margin: `${SPACING[1]} ${SPACING[3]}` }} />

      {/* Sections heading */}
      <div style={{
        padding: `${SPACING[3]} ${SPACING[4]} ${SPACING["1.5"]}`,
        fontSize: "9px",
        fontWeight: 700,
        color: theme.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}>
        Sections
      </div>

      {/* Section list */}
      <div style={{ flex: 1, overflowY: "auto", padding: `0 ${SPACING[3]}` }}>
        {sections.map((s) => {
          const isActive = selectedTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectTab(s.id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                width: "100%",
                padding: `${SPACING[2]} ${SPACING[3]}`,
                borderRadius: RADII.md,
                border: isActive ? `1.5px solid ${theme.accentGold}` : `1.5px solid transparent`,
                background: isActive ? theme.accentGold + "15" : "transparent",
                color: isActive ? theme.accentGold : theme.textPrimary,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "block",
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: SPACING["0.5"],
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.subtleBg; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Add Section */}
      <div style={{ padding: `${SPACING[2]} ${SPACING[3]} ${SPACING[4]}` }}>
        {addingNew ? (
          <div style={{ display: "flex", gap: SPACING[1], alignItems: "center" }}>
            <label htmlFor="new-section-name" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>New section name</label>
            <input
              id="new-section-name"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubmit();
                if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
              }}
              onBlur={() => {
                if (!newName.trim()) { setAddingNew(false); setNewName(""); }
              }}
              placeholder="Section name"
              style={{
                flex: 1,
                padding: `${SPACING["1.5"]} ${SPACING[2]}`,
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: RADII.sm,
                fontSize: FONT_SIZES.micro,
                fontFamily: FONT_MONO,
                background: theme.inputBg,
                color: theme.textPrimary,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleAddSubmit}
              aria-label="Confirm add section"
              style={{
                background: theme.teacherGreen,
                color: "#fff",
                border: "none",
                borderRadius: RADII.sm,
                padding: `${SPACING["1.5"]} ${SPACING[2]}`,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon icon={checkIcon} width={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            style={{
              width: "100%",
              padding: `${SPACING[2]} 0`,
              border: `1.5px dashed ${theme.inputBorder}`,
              borderRadius: RADII.md,
              background: "transparent",
              color: theme.textSecondary,
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: SPACING[1],
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.textSecondary; e.currentTarget.style.color = theme.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textSecondary; }}
          >
            <Icon icon={plusIcon} width={14} />
            New Section
          </button>
        )}
      </div>
    </div>
  );
}
