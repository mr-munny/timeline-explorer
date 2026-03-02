import { TAGS } from "../data/constants";
import { useTheme, FONT_MONO } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import sortAscending from "@iconify-icons/mdi/sort-ascending";
import sortDescending from "@iconify-icons/mdi/sort-descending";
import accountGroup from "@iconify-icons/mdi/account-group";
import filterRemoveOutline from "@iconify-icons/mdi/filter-remove-outline";

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
}) {
  const { theme, getThemedPeriodBg } = useTheme();
  const hasActiveFilters =
    selectedPeriods.length > 0 ||
    selectedTags.length > 0 ||
    searchTerm;

  return (
    <>
      {/* Row 1: Search + controls */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
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
              fontFamily: FONT_MONO,
              background: theme.inputBg,
              color: theme.textPrimary,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => setSortOrder((s) => (s === "chrono" ? "reverse" : "chrono"))}
          style={{
            padding: "9px 12px",
            border: `1.5px solid ${theme.inputBorder}`,
            borderRadius: 8,
            fontSize: 11,
            fontFamily: FONT_MONO,
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
          <Icon icon={accountGroup} width={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Contributors
        </button>
      </div>

      {/* Row 2: Period pills */}
      {displayPeriods.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: FONT_MONO,
              color: theme.textMuted,
              fontWeight: 600,
              marginRight: 2,
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
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? p.color : theme.inputBorder}`,
                  background: isSelected ? (getThemedPeriodBg(p) || p.bg) : "transparent",
                  color: isSelected ? p.color : theme.textTertiary,
                  fontSize: 10,
                  fontFamily: FONT_MONO,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
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
          gap: 5,
          flexWrap: "wrap",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: FONT_MONO,
            color: theme.textMuted,
            fontWeight: 600,
            marginRight: 2,
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
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                border: `1.5px solid ${isSelected ? theme.textDescription : theme.inputBorder}`,
                background: isSelected ? theme.subtleBg : "transparent",
                color: isSelected ? theme.textDescription : theme.textTertiary,
                fontSize: 10,
                fontFamily: FONT_MONO,
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tag}
            </button>
          );
        })}
        {selectedTags.length >= 2 && (
          <button
            onClick={() => setTagMatchMode((m) => (m === "or" ? "and" : "or"))}
            title={
              tagMatchMode === "or"
                ? "OR mode: events with ANY selected tag"
                : "AND mode: events with ALL selected tags"
            }
            style={{
              marginLeft: 4,
              padding: "3px 8px",
              borderRadius: 10,
              border: `1.5px solid ${theme.inputBorder}`,
              background: tagMatchMode === "and" ? theme.subtleBg : "transparent",
              color: theme.textDescription,
              fontSize: 9,
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
              fontFamily: FONT_MONO,
            }}
          >
            Showing:
          </span>
          {selectedPeriods.map((pId) => {
            const p = findPeriod(pId);
            if (!p) return null;
            return (
              <span
                key={pId}
                onClick={() => togglePeriod(pId)}
                style={{
                  fontSize: 10,
                  background: getThemedPeriodBg(p) || p.bg,
                  color: p.color,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {p.label} &times;
              </span>
            );
          })}
          {selectedTags.length > 0 && (
            <>
              {selectedTags.length >= 2 && (
                <span
                  style={{
                    fontSize: 9,
                    color: theme.textMuted,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                  }}
                >
                  ({tagMatchMode.toUpperCase()})
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    fontSize: 10,
                    background: theme.subtleBg,
                    color: theme.textDescription,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {tag} &times;
                </span>
              ))}
            </>
          )}
          {searchTerm && (
            <span
              style={{
                fontSize: 10,
                background: theme.subtleBg,
                color: theme.textDescription,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: FONT_MONO,
              }}
            >
              "{searchTerm}"
            </span>
          )}
          <button
            onClick={clearAllFilters}
            style={{
              fontSize: 10,
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
            <Icon icon={filterRemoveOutline} width={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
            Clear
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
            }}
          >
            {filteredCount} of {totalCount} events
          </span>
        </div>
      )}
    </>
  );
}
