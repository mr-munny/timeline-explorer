import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import inboxArrowDown from "@iconify-icons/mdi/inbox-arrow-down";
import plusIcon from "@iconify-icons/mdi/plus";
import checkIcon from "@iconify-icons/mdi/check";

export default function AdminSidebar({ sections, selectedTab, onSelectTab, pendingCount, onAddSection }) {
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
      fontFamily: "'Overpass Mono', monospace",
    }}>
      {/* Moderation tab */}
      <div style={{ padding: "16px 12px 8px" }}>
        <button
          onClick={() => onSelectTab("moderation")}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: selectedTab === "moderation" ? `1.5px solid ${theme.accentGold}` : `1.5px solid transparent`,
            background: selectedTab === "moderation" ? theme.accentGold + "15" : "transparent",
            color: selectedTab === "moderation" ? theme.accentGold : theme.textPrimary,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
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
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 10,
              minWidth: 18,
              textAlign: "center",
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: theme.cardBorder, margin: "4px 12px" }} />

      {/* Sections heading */}
      <div style={{
        padding: "12px 16px 6px",
        fontSize: 9,
        fontWeight: 700,
        color: theme.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}>
        Sections
      </div>

      {/* Section list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        {sections.map((s) => {
          const isActive = selectedTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectTab(s.id)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: isActive ? `1.5px solid ${theme.accentGold}` : `1.5px solid transparent`,
                background: isActive ? theme.accentGold + "15" : "transparent",
                color: isActive ? theme.accentGold : theme.textPrimary,
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "block",
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: 2,
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
      <div style={{ padding: "8px 12px 16px" }}>
        {addingNew ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
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
                padding: "6px 8px",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'Overpass Mono', monospace",
                background: theme.inputBg,
                color: theme.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleAddSubmit}
              style={{
                background: theme.teacherGreen,
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 8px",
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
              padding: "8px 0",
              border: `1.5px dashed ${theme.inputBorder}`,
              borderRadius: 6,
              background: "transparent",
              color: theme.textSecondary,
              fontSize: 10,
              fontFamily: "'Overpass Mono', monospace",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
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
