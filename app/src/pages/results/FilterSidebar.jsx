import { useState, useMemo } from "react";
import styles from "../ResultsPage.module.css";

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function FilterSidebar({
  filterSections,
  primaryFilterKeys,
  extraFilterKeys,
  collapsedSections,
  toggleCollapse,
  onExpandAll,
  onCollapseAll,
  selectedFilters,
  onToggleOption,
  onApplyFilters,
  onResetFilters,
  hasPendingChanges,
  hasAnySelectedFilters,
  sidebarOpen,
  onToggleSidebar,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [addedExtras, setAddedExtras] = useState(new Set());
  const [showMoreOpen, setShowMoreOpen] = useState(false);

  const primarySections = useMemo(
    () => filterSections.filter((s) => primaryFilterKeys.includes(s.key)),
    [filterSections, primaryFilterKeys]
  );

  const extraSections = useMemo(
    () => filterSections.filter((s) => extraFilterKeys.includes(s.key)),
    [filterSections, extraFilterKeys]
  );

  const visibleExtraSections = useMemo(
    () => extraSections.filter((s) => addedExtras.has(s.key)),
    [extraSections, addedExtras]
  );

  const availableExtras = useMemo(
    () => extraSections.filter((s) => !addedExtras.has(s.key)),
    [extraSections, addedExtras]
  );

  // Search matches across ALL sections (primary + extra)
  const searchMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return filterSections.filter((s) => s.label.toLowerCase().includes(term));
  }, [searchTerm, filterSections]);

  const addExtra = (key) => {
    setAddedExtras((prev) => new Set([...prev, key]));
    setShowMoreOpen(false);
    setSearchTerm("");
  };

  const removeExtra = (key) => {
    setAddedExtras((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Check if all visible sections are expanded
  const visibleSectionKeys = useMemo(() => {
    const keys = primarySections.map((s) => s.key);
    visibleExtraSections.forEach((s) => keys.push(s.key));
    return keys;
  }, [primarySections, visibleExtraSections]);

  const allExpanded = visibleSectionKeys.length > 0 && visibleSectionKeys.every((k) => !collapsedSections[k]);

  if (!sidebarOpen) return null;

  const renderSection = (sec, { removable = false } = {}) => {
    const open = !collapsedSections[sec.key];
    return (
      <div key={sec.key} className={styles.filterSection}>
        <button type="button" className={styles.filterHeader} onClick={() => toggleCollapse(sec.key)}>
          <span>{sec.label}</span>
          <span className={styles.filterHeaderActions}>
            {removable && (
              <span
                className={styles.filterRemoveBtn}
                role="button"
                tabIndex={0}
                title={`Remove ${sec.label} filter`}
                onClick={(e) => { e.stopPropagation(); removeExtra(sec.key); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeExtra(sec.key); } }}
              >
                <RemoveIcon />
              </span>
            )}
            <ChevronIcon open={open} />
          </span>
        </button>
        {open && (
          <div className={styles.filterBody}>
            {sec.options.map((opt) => (
              <label key={opt.label} className={styles.filterOption}>
                <input
                  type="checkbox"
                  className={styles.filterCb}
                  checked={selectedFilters[sec.key]?.includes(opt.label) || false}
                  onChange={() => onToggleOption(sec.key, opt.label)}
                />
                <span className={styles.filterLabel}>{opt.label}</span>
                <span className={styles.filterCount}>{opt.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  // When searching, show matching sections from everywhere
  const isSearching = searchMatches !== null;
  const searchResultSections = isSearching
    ? searchMatches.filter((s) => s.options.length > 0)
    : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>Filters</h3>
        <button type="button" className={styles.sidebarCollapseBtn} onClick={onToggleSidebar} title="Hide filters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        className={styles.expandCollapseAllBtn}
        onClick={allExpanded ? onCollapseAll : onExpandAll}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: allExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .2s" }}
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        {allExpanded ? 'Collapse all' : 'Expand all'}
      </button>

      {/* Search input */}
      <div className={styles.filterSearchWrap}>
        <SearchIcon />
        <input
          type="text"
          className={styles.filterSearchInput}
          placeholder="Find filters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button type="button" className={styles.filterSearchClear} onClick={() => setSearchTerm("")}>
            <RemoveIcon />
          </button>
        )}
      </div>

      <div className={styles.filterList}>
        {isSearching ? (
          /* Search results mode */
          searchResultSections.length > 0 ? (
            searchResultSections.map((sec) => {
              const isExtra = extraFilterKeys.includes(sec.key);
              const alreadyAdded = addedExtras.has(sec.key) || primaryFilterKeys.includes(sec.key);
              return (
                <div key={sec.key}>
                  {renderSection(sec)}
                  {isExtra && !alreadyAdded && (
                    <button
                      type="button"
                      className={styles.addFilterInline}
                      onClick={() => addExtra(sec.key)}
                    >
                      + Pin to sidebar
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.filterSearchEmpty}>No filters match &ldquo;{searchTerm}&rdquo;</div>
          )
        ) : (
          /* Normal mode */
          <>
            {primarySections.map((sec) => renderSection(sec))}

            {visibleExtraSections.length > 0 && (
              <>
                <div className={styles.extraFiltersDivider}>
                  <span>Added filters</span>
                </div>
                {visibleExtraSections.map((sec) => renderSection(sec, { removable: true }))}
              </>
            )}

            {availableExtras.length > 0 && (
              <div className={styles.addMoreWrap}>
                <button
                  type="button"
                  className={styles.addMoreBtn}
                  onClick={() => setShowMoreOpen((v) => !v)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add more filters
                </button>
                {showMoreOpen && (
                  <div className={styles.addMoreDropdown}>
                    {availableExtras.map((sec) => (
                      <button
                        key={sec.key}
                        type="button"
                        className={styles.addMoreItem}
                        onClick={() => addExtra(sec.key)}
                      >
                        <span>{sec.label}</span>
                        <span className={styles.filterCount}>{sec.options.length} values</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.filterActions}>
        <button type="button" className={styles.applyBtn} onClick={onApplyFilters} disabled={!hasPendingChanges}>Apply Filters</button>
        <button type="button" className={styles.resetBtn} onClick={onResetFilters} disabled={!hasAnySelectedFilters}>Reset</button>
      </div>
    </aside>
  );
}
