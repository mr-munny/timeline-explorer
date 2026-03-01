import { TAGS } from "../data/constants";
import { Icon } from "@iconify/react";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import sortAscending from "@iconify-icons/mdi/sort-ascending";
import sortDescending from "@iconify-icons/mdi/sort-descending";
import accountGroup from "@iconify-icons/mdi/account-group";
import filterRemoveOutline from "@iconify-icons/mdi/filter-remove-outline";

export default function FilterBar({
  theme,
  getThemedPeriodBg,
  searchTerm,
  setSearchTerm,
  selectedPeriod,
  setSelectedPeriod,
  selectedTag,
  setSelectedTag,
  sectionFilter,
  setSectionFilter,
  sortOrder,
  setSortOrder,
  showContributors,
  setShowContributors,
  isTeacher,
  section,
  displayPeriods,
  activeSections,
  findPeriod,
  getSectionName,
  filteredCount,
  totalCount,
}) {
  return (
    <>
      {/* Filters row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 200px", position: "relative", minWidth: 160 }}>
          <Icon
            icon={magnifyIcon}
            width={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: theme.textSecondary,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search events, people, regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 30px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              color: theme.textPrimary,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{
            padding: "9px 12px",
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            background: theme.inputBg,
            cursor: "pointer",
            color:
              selectedPeriod === "all"
                ? theme.textSecondary
                : findPeriod(selectedPeriod)?.color,
            fontWeight: selectedPeriod === "all" ? 500 : 700,
          }}
        >
          <option value="all">All Time Periods</option>
          {displayPeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{
            padding: "9px 12px",
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            background: theme.inputBg,
            cursor: "pointer",
            color: selectedTag === "all" ? theme.textSecondary : theme.textPrimary,
          }}
        >
          <option value="all">All Tags</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {isTeacher && section === "all" && (
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'Overpass Mono', monospace",
              background: theme.inputBg,
              cursor: "pointer",
              color: sectionFilter === "all" ? theme.textSecondary : theme.textPrimary,
            }}
          >
            <option value="all">All Sections</option>
            {activeSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setSortOrder((s) => (s === "chrono" ? "reverse" : "chrono"))}
          style={{
            padding: "9px 12px",
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            background: theme.inputBg,
            cursor: "pointer",
            color: theme.textTertiary,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; }}
        >
          <Icon icon={sortOrder === "chrono" ? sortAscending : sortDescending} width={14} style={{ verticalAlign: "middle", marginRight: 3 }} />
          {sortOrder === "chrono" ? "Oldest" : "Newest"}
        </button>
        <button
          onClick={() => setShowContributors((s) => !s)}
          style={{
            padding: "9px 12px",
            border: `1.5px solid ${showContributors ? theme.activeToggleBg : theme.inputBorder}`,
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'Overpass Mono', monospace",
            background: showContributors ? theme.activeToggleBg : theme.inputBg,
            color: showContributors ? theme.activeToggleText : theme.textTertiary,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; } }}
          onMouseLeave={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; } }}
        >
          <Icon icon={accountGroup} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Contributors
        </button>
      </div>

      {/* Active filters */}
      {(selectedPeriod !== "all" ||
        selectedTag !== "all" ||
        searchTerm ||
        sectionFilter !== "all") && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: theme.textMuted,
              fontFamily: "'Overpass Mono', monospace",
            }}
          >
            Showing:
          </span>
          {selectedPeriod !== "all" && (
            <span
              style={{
                fontSize: 10,
                background: getThemedPeriodBg(findPeriod(selectedPeriod)) || findPeriod(selectedPeriod)?.bg,
                color: findPeriod(selectedPeriod)?.color,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 700,
              }}
            >
              {findPeriod(selectedPeriod)?.label}
            </span>
          )}
          {selectedTag !== "all" && (
            <span
              style={{
                fontSize: 10,
                background: theme.subtleBg,
                color: theme.textDescription,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
              }}
            >
              {selectedTag}
            </span>
          )}
          {sectionFilter !== "all" && (
            <span
              style={{
                fontSize: 10,
                background: theme.subtleBg,
                color: theme.textDescription,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "'Overpass Mono', monospace",
                fontWeight: 600,
              }}
            >
              {getSectionName(sectionFilter)}
            </span>
          )}
          {searchTerm && (
            <span
              style={{
                fontSize: 10,
                background: theme.subtleBg,
                color: theme.textDescription,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "'Overpass Mono', monospace",
              }}
            >
              "{searchTerm}"
            </span>
          )}
          <button
            onClick={() => {
              setSelectedPeriod("all");
              setSelectedTag("all");
              setSearchTerm("");
              setSectionFilter("all");
            }}
            style={{
              fontSize: 10,
              color: theme.errorRed,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Overpass Mono', monospace",
              fontWeight: 700,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Icon icon={filterRemoveOutline} width={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
            Clear
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: theme.textSecondary,
              fontFamily: "'Overpass Mono', monospace",
            }}
          >
            {filteredCount} of {totalCount} events
          </span>
        </div>
      )}
    </>
  );
}