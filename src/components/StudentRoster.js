import { useState } from "react";
import { Icon } from "@iconify/react";
import accountGroup from "@iconify-icons/mdi/account-group";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";

export default function StudentRoster({
  students,
  sections,
  onReassign,
  onRemove,
  theme,
}) {
  const [expanded, setExpanded] = useState(false);

  const getSectionName = (id) =>
    sections.find((s) => s.id === id)?.name || id;

  // Group students by section
  const grouped = {};
  for (const s of sections) {
    grouped[s.id] = [];
  }
  grouped["_unassigned"] = [];
  for (const student of students) {
    const key = sections.some((s) => s.id === student.section)
      ? student.section
      : "_unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(student);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 1,
          background: theme.inputBorder,
          margin: "10px 0",
        }}
      />
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.mutedText,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: "'Overpass Mono', monospace",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon icon={accountGroup} width={12} />
          Student Roster
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: theme.textSecondary,
            }}
          >
            ({students.length})
          </span>
        </span>
        <Icon
          icon={chevronDown}
          width={12}
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            color: theme.textMuted,
          }}
        />
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {students.length === 0 && (
            <div
              style={{
                fontSize: 10,
                color: theme.textMuted,
                fontStyle: "italic",
                padding: "4px 6px",
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              No students have selected a section yet
            </div>
          )}

          {sections.map((sec) => {
            const sectionStudents = grouped[sec.id] || [];
            if (sectionStudents.length === 0) return null;
            return (
              <div key={sec.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: theme.accentGold,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'Overpass Mono', monospace",
                    marginBottom: 4,
                    padding: "0 6px",
                  }}
                >
                  {sec.name} ({sectionStudents.length})
                </div>
                {sectionStudents.map((student) => (
                  <StudentRow
                    key={student.uid}
                    student={student}
                    sections={sections}
                    getSectionName={getSectionName}
                    onReassign={onReassign}
                    onRemove={onRemove}
                    theme={theme}
                  />
                ))}
              </div>
            );
          })}

          {/* Unassigned students (section was deleted) */}
          {grouped["_unassigned"].length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: theme.errorRed,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "'Overpass Mono', monospace",
                  marginBottom: 4,
                  padding: "0 6px",
                }}
              >
                Invalid Section ({grouped["_unassigned"].length})
              </div>
              {grouped["_unassigned"].map((student) => (
                <StudentRow
                  key={student.uid}
                  student={student}
                  sections={sections}
                  getSectionName={getSectionName}
                  onReassign={onReassign}
                  onRemove={onRemove}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentRow({
  student,
  sections,
  getSectionName,
  onReassign,
  onRemove,
  theme,
}) {
  const [showReassign, setShowReassign] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontFamily: "'Overpass Mono', monospace",
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: theme.textPrimary,
        }}
        title={student.email}
      >
        {student.displayName || student.email}
      </div>
      <span
        style={{
          fontSize: 8,
          color: student.assignedBy === "teacher" ? theme.teacherGreen : theme.textMuted,
          flexShrink: 0,
        }}
        title={`Assigned by ${student.assignedBy}`}
      >
        {student.assignedBy === "teacher" ? "teacher" : "self"}
      </span>

      {showReassign ? (
        <select
          autoFocus
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onReassign(student.uid, e.target.value);
            }
            setShowReassign(false);
          }}
          onBlur={() => setShowReassign(false)}
          style={{
            fontSize: 9,
            fontFamily: "'Overpass Mono', monospace",
            padding: "2px 4px",
            borderRadius: 3,
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.textPrimary,
            cursor: "pointer",
          }}
        >
          <option value="" disabled>
            Move to...
          </option>
          {sections
            .filter((s) => s.id !== student.section)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      ) : (
        <button
          onClick={() => setShowReassign(true)}
          title={`Reassign ${student.displayName || student.email}`}
          style={{
            background: "none",
            border: "none",
            padding: "1px 4px",
            cursor: "pointer",
            color: theme.textMuted,
            fontSize: 8,
            fontFamily: "'Overpass Mono', monospace",
            borderRadius: 3,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.teacherGreen;
            e.currentTarget.style.background = theme.teacherGreenSubtle;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.textMuted;
            e.currentTarget.style.background = "none";
          }}
        >
          move
        </button>
      )}

      <button
        onClick={() => {
          if (
            !window.confirm(
              `Remove ${student.displayName || student.email} from ${getSectionName(student.section)}? They will need to re-select their section.`
            )
          )
            return;
          onRemove(student.uid);
        }}
        title="Remove section assignment"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.textMuted,
          display: "inline-flex",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = theme.errorRed)}
        onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
      >
        <Icon icon={closeCircleOutline} width={11} />
      </button>
    </div>
  );
}
