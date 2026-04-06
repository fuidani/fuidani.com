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

export default function FilterSidebar({
  filterSections,
  collapsedSections,
  toggleCollapse,
  selectedFilters,
  onToggleOption,
  onApplyFilters,
  onResetFilters,
  hasPendingChanges,
  hasAnySelectedFilters,
  sidebarOpen,
  onToggleSidebar,
}) {
  if (!sidebarOpen) return null;

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
      <div className={styles.filterList}>
        {filterSections.map((sec) => {
          const open = !collapsedSections[sec.key];
          return (
            <div key={sec.key} className={styles.filterSection}>
              <button type="button" className={styles.filterHeader} onClick={() => toggleCollapse(sec.key)}>
                <span>{sec.label}</span>
                <ChevronIcon open={open} />
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
        })}
      </div>
      <div className={styles.filterActions}>
        <button type="button" className={styles.applyBtn} onClick={onApplyFilters} disabled={!hasPendingChanges}>Apply Filters</button>
        <button type="button" className={styles.resetBtn} onClick={onResetFilters} disabled={!hasAnySelectedFilters}>Reset</button>
      </div>
    </aside>
  );
}
