import { useState } from "react";
import { Icon } from "@iconify/react";
import lockOutline from "@iconify-icons/mdi/lock-outline";
import lockOpenVariantOutline from "@iconify-icons/mdi/lock-open-variant-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import plusIcon from "@iconify-icons/mdi/plus";

export default function SectionConfiguration({
  sections,
  locked,
  onToggleLock,
  onAdd,
  onDelete,
  onRename,
  theme,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const startEdit = (section) => {
    setEditingId(section.id);
    setDraftName(section.name);
  };

  const commitRename = (id) => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onRename(id, trimmed);
    }
    setEditingId(null);
    setDraftName("");
  };

  const commitAdd = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setAddingNew(false);
    setNewName("");
  };

  return (
    <div>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: theme.mutedText,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        Sections
        <button
          onClick={onToggleLock}
          title={locked ? "Unlock to edit" : "Lock sections"}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
            color: locked ? theme.textMuted : theme.teacherGreen,
            display: "inline-flex",
            transition: "color 0.15s",
          }}
        >
          <Icon icon={locked ? lockOutline : lockOpenVariantOutline} width={12} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sections.length === 0 && (
          <div style={{
            fontSize: 10,
            color: theme.textMuted,
            fontStyle: "italic",
            padding: "4px 6px",
          }}>
            No sections configured
          </div>
        )}
        {sections.map((s) => {
          const isEditing = editingId === s.id && !locked;
          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 6px",
                borderRadius: 4,
                background: isEditing ? theme.subtleBg : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: theme.accentGold,
                flexShrink: 0,
              }} />
              {isEditing ? (
                <input
                  type="text"
                  value={draftName}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setDraftName("");
                    }
                  }}
                  onBlur={() => commitRename(s.id)}
                  style={{
                    flex: 1,
                    padding: "3px 6px",
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "'Overpass Mono', monospace",
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <span style={{
                  fontSize: 10,
                  color: theme.textPrimary,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {s.name}
                </span>
              )}
              <span style={{
                fontSize: 8,
                color: theme.textMuted,
                flexShrink: 0,
                opacity: 0.6,
                fontFamily: "'Overpass Mono', monospace",
              }}>
                {s.id}
              </span>
              {!locked && (
                <>
                  <button
                    onClick={() => isEditing ? setEditingId(null) : startEdit(s)}
                    title="Rename section"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: isEditing ? theme.teacherGreen : theme.textMuted,
                      display: "inline-flex",
                      transition: "color 0.15s",
                    }}
                  >
                    <Icon icon={pencilOutline} width={11} />
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`Delete "${s.name}"? Events in this section will only be visible in All Sections view.`)) return;
                      onDelete(s.id);
                      if (editingId === s.id) setEditingId(null);
                    }}
                    title="Delete section"
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.errorRed}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: theme.textMuted,
                      display: "inline-flex",
                      transition: "color 0.15s",
                    }}
                  >
                    <Icon icon={closeCircleOutline} width={11} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!locked && (
        addingNew ? (
          <div style={{
            marginTop: 6,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}>
            <input
              type="text"
              value={newName}
              autoFocus
              placeholder="Section name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") {
                  setAddingNew(false);
                  setNewName("");
                }
              }}
              onBlur={commitAdd}
              style={{
                flex: 1,
                padding: "5px 8px",
                border: `1.5px solid ${theme.inputBorder}`,
                borderRadius: 4,
                fontSize: 10,
                fontFamily: "'Overpass Mono', monospace",
                background: theme.inputBg,
                color: theme.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "5px 0",
              border: `1.5px dashed ${theme.inputBorder}`,
              borderRadius: 4,
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
          >
            <Icon icon={plusIcon} width={12} />
            Add Section
          </button>
        )
      )}
    </div>
  );
}
