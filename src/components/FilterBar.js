import { TAGS } from "../data/constants";
import { useTheme, FONT_MONO, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import sortAscending from "@iconify-icons/mdi/sort-ascending";
import sortDescending from "@iconify-icons/mdi/sort-descending";
import accountGroup from "@iconify-icons/mdi/account-group";
import filterRemoveOutline from "@iconify-icons/mdi/filter-remove-outline";
import earthIcon from "@iconify-icons/mdi/earth";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  selectedPeriods,
  togglePeriod,
  selectedTags,
  toggleTag,
  tagMatchMode,
  setTagMatchMode,
  clearAllFilters,
  sortOrder,
  setSortOrder,
  showContributors,
  setShowContributors,
  displayPeriods,
  findPeriod,
  filteredCount,
  totalCount,
  viewMode,
  setViewMode,
}) {
  const { theme, getThemedPeriodBg } = useTheme();
  const hasActiveFilters =
    selectedPeriods.length > 0 ||
    selectedTags.length > 0 ||
    searchTerm;

  const pillStyle = {
    padding: `${SPACING[1]} ${SPACING["2.5"]}`,
    borderRadius: RADII.pill,
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONT_MONO,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <section aria-label="Filters">
      {/* Row 1: Search + controls */}
      <div
        style={{
          display: "flex",
          gap: SPACING[2],
          flexWrap: "wrap",
          marginBottom: SPACING["2.5"],
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 200px", position: "relative", minWidth: 160 }}>
          <Icon
            icon={magnifyIcon}
            width={14}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: SPACING["2.5"],
              top: "50%",
              transform: "translateY(-50%)",
              color: theme.textSecondary,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search events, people, regions..."
            aria-label="Search events"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: `${SPACING[2]} ${SPACING[3]} ${SPACING[2]} 30px`,
              border: `1.5px solid ${theme.inputBorder}`,
              borderRadius: RADII.lg,
              fontSize: FONT_SIZES.base,
              fontFamily: FONT_MONO,
              background: theme.inputBg,
              color: theme.textPrimary,
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => setSortOrder((s) => (s === "chrono" ? "reverse" : "chrono"))}
          aria-label={sortOrder === "chrono" ? "Sort: oldest first. Click for newest first" : "Sort: newest first. Click for oldest first"}
          style={{
            padding: `${SPACING[2]} ${SPACING[3]}`,
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: RADII.lg,
            fontSize: FONT_SIZES.sm,
            fontFamily: FONT_MONO,
            background: theme.inputBg,
            cursor: "pointer",
            color: theme.textTertiary,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; }}
        >
          <Icon icon={sortOrder === "chrono" ? sortAscending : sortDescending} width={14} style={{ verticalAlign: "middle", marginRight: SPACING["0.5"] }} aria-hidden="true" />
          {sortOrder === "chrono" ? "Oldest" : "Newest"}
        </button>
        <button
          onClick={() => setShowContributors((s) => !s)}
          aria-pressed={showContributors}
          style={{
            padding: `${SPACING[2]} ${SPACING[3]}`,
            border: `1.5px solid ${showContributors ? theme.activeToggleBg : theme.inputBorder}`,
            borderRadius: RADII.lg,
            fontSize: FONT_SIZES.sm,
            fontFamily: FONT_MONO,
            background: showContributors ? theme.activeToggleBg : theme.inputBg,
            color: showContributors ? theme.activeToggleText : theme.textTertiary,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; } }}
          onMouseLeave={(e) => { if (!showContributors) { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; } }}
        >
          <Icon icon={accountGroup} width={14} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} aria-hidden="true" />
          Contributors
        </button>
        {viewMode != null && (
          <button
            onClick={() => setViewMode(viewMode === "timeline" ? "worldview" : "timeline")}
            aria-pressed={viewMode === "worldview"}
            style={{
              padding: `${SPACING[2]} ${SPACING[3]}`,
              border: `1.5px solid ${viewMode === "worldview" ? theme.activeToggleBg : theme.inputBorder}`,
              borderRadius: RADII.lg,
              fontSize: FONT_SIZES.sm,
              fontFamily: FONT_MONO,
              background: viewMode === "worldview" ? theme.activeToggleBg : theme.inputBg,
              color: viewMode === "worldview" ? theme.activeToggleText : theme.textTertiary,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (viewMode !== "worldview") { e.currentTarget.style.borderColor = theme.textTertiary; e.currentTarget.style.color = theme.textPrimary; } }}
            onMouseLeave={(e) => { if (viewMode !== "worldview") { e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textTertiary; } }}
          >
            <Icon icon={earthIcon} width={14} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} aria-hidden="true" />
            {viewMode === "worldview" ? "Timeline" : "World View"}
          </button>
        )}
      </div>

      {/* Row 2: Period pills */}
      {displayPeriods.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: SPACING["1.5"],
            flexWrap: "wrap",
            marginBottom: SPACING[2],
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              color: theme.textMuted,
              fontWeight: 600,
              marginRight: SPACING["0.5"],
            }}
          >
            Periods:
          </span>
          {displayPeriods.map((p) => {
            const isSelected = selectedPeriods.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePeriod(p.id)}
                aria-pressed={isSelected}
                style={{
                  ...pillStyle,
                  border: `1.5px solid ${isSelected ? p.color : theme.inputBorder}`,
                  background: isSelected ? (getThemedPeriodBg(p) || p.bg) : "transparent",
                  color: isSelected ? p.color : theme.textTertiary,
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Row 3: Tag pills + AND/OR toggle */}
      <div
        style={{
          display: "flex",
          gap: SPACING["1.5"],
          flexWrap: "wrap",
          marginBottom: SPACING[3],
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: FONT_SIZES.tiny,
            fontFamily: FONT_MONO,
            color: theme.textMuted,
            fontWeight: 600,
            marginRight: SPACING["0.5"],
          }}
        >
          Tags:
        </span>
        {TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              aria-pressed={isSelected}
              style={{
                ...pillStyle,
                border: `1.5px solid ${isSelected ? theme.textDescription : theme.inputBorder}`,
                background: isSelected ? theme.subtleBg : "transparent",
                color: isSelected ? theme.textDescription : theme.textTertiary,
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {tag}
            </button>
          );
        })}
        {selectedTags.length >= 2 && (
          <button
            onClick={() => setTagMatchMode((m) => (m === "or" ? "and" : "or"))}
            aria-label={
              tagMatchMode === "or"
                ? "OR mode: events with ANY selected tag. Click to switch to AND mode"
                : "AND mode: events with ALL selected tags. Click to switch to OR mode"
            }
            style={{
              marginLeft: SPACING[1],
              padding: `${SPACING[1]} ${SPACING[2]}`,
              borderRadius: RADII.xl,
              border: `1.5px solid ${theme.inputBorder}`,
              background: tagMatchMode === "and" ? theme.subtleBg : "transparent",
              color: theme.textDescription,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "0.05em",
            }}
          >
            {tagMatchMode.toUpperCase()}
          </button>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div
          style={{
            display: "flex",
            gap: SPACING["1.5"],
            alignItems: "center",
            marginBottom: SPACING[3],
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: FONT_SIZES.tiny,
              color: theme.textMuted,
              fontFamily: FONT_MONO,
            }}
          >
            Showing:
          </span>
          {selectedPeriods.map((pId) => {
            const p = findPeriod(pId);
            if (!p) return null;
            return (
              <button
                key={pId}
                onClick={() => togglePeriod(pId)}
                aria-label={`Remove ${p.label} filter`}
                style={{
                  fontSize: FONT_SIZES.tiny,
                  background: getThemedPeriodBg(p) || p.bg,
                  color: p.color,
                  padding: `${SPACING[1]} ${SPACING[2]}`,
                  borderRadius: RADII.sm,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {p.label} &times;
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <>
              {selectedTags.length >= 2 && (
                <span
                  style={{
                    fontSize: FONT_SIZES.micro,
                    color: theme.textMuted,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                  }}
                >
                  ({tagMatchMode.toUpperCase()})
                </span>
              )}
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-label={`Remove ${tag} filter`}
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    background: theme.subtleBg,
                    color: theme.textDescription,
                    padding: `${SPACING[1]} ${SPACING[2]}`,
                    borderRadius: RADII.sm,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {tag} &times;
                </button>
              ))}
            </>
          )}
          {searchTerm && (
            <span
              style={{
                fontSize: FONT_SIZES.tiny,
                background: theme.subtleBg,
                color: theme.textDescription,
                padding: `${SPACING[1]} ${SPACING[2]}`,
                borderRadius: RADII.sm,
                fontFamily: FONT_MONO,
              }}
            >
              "{searchTerm}"
            </span>
          )}
          <button
            onClick={clearAllFilters}
            aria-label="Clear all filters"
            style={{
              fontSize: FONT_SIZES.tiny,
              color: theme.errorRed,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT_MONO,
              fontWeight: 700,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Icon icon={filterRemoveOutline} width={12} style={{ verticalAlign: "middle", marginRight: SPACING["0.5"] }} aria-hidden="true" />
            Clear
          </button>
          <span
            aria-live="polite"
            style={{
              marginLeft: "auto",
              fontSize: FONT_SIZES.sm,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
            }}
          >
            {filteredCount} of {totalCount} events
          </span>
        </div>
      )}
    </section>
  );
}
