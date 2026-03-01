import { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import AdminSidebar from "./AdminSidebar";
import AdminSectionSettings from "./AdminSectionSettings";
import ModerationPanel from "./ModerationPanel";

export default function AdminView({
  sections,
  pendingEvents,
  pendingConnections,
  allEvents,
  allConnections,
  allStudentAssignments,
  getSectionName,
  onClose,
  onAddSection,
  onDeleteSection,
  onRenameSection,
  onEventApproved,
  displayPeriods,
  reassignStudentSection,
  removeStudentSection,
}) {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState("moderation");

  const pendingCount = (pendingEvents?.length || 0) + (pendingConnections?.length || 0);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedTab),
    [sections, selectedTab]
  );

  // If the selected section was deleted, fall back to moderation
  const effectiveTab = selectedSection || selectedTab === "moderation" ? selectedTab : "moderation";

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 140px)",
      background: theme.bg,
    }}>
      <AdminSidebar
        sections={sections}
        selectedTab={effectiveTab}
        onSelectTab={setSelectedTab}
        pendingCount={pendingCount}
        onAddSection={onAddSection}
      />

      <div style={{
        flex: 1,
        overflowY: "auto",
        background: theme.bg,
      }}>
        {effectiveTab === "moderation" ? (
          <ModerationPanel
            embedded
            pendingEvents={pendingEvents}
            pendingConnections={pendingConnections}
            allEvents={allEvents}
            allConnections={allConnections}
            periods={displayPeriods}
            getSectionName={getSectionName}
            onEventApproved={onEventApproved}
          />
        ) : selectedSection ? (
          <AdminSectionSettings
            sectionId={selectedSection.id}
            sectionName={selectedSection.name}
            sections={sections}
            allStudentAssignments={allStudentAssignments}
            onDeleteSection={onDeleteSection}
            onRenameSection={onRenameSection}
            reassignStudentSection={reassignStudentSection}
            removeStudentSection={removeStudentSection}
          />
        ) : null}
      </div>
    </div>
  );
}
