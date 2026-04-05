import styles from "../ResultsPage.module.css";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function SearchRow({ query, onQueryChange, onSearch }) {
  return (
    <div className={styles.searchRow}>
      <div className={styles.searchInputWrap}>
        <span className={styles.searchInputIcon}><SearchIcon /></span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <button className={styles.searchBtn} onClick={onSearch}>Search</button>
    </div>
  );
}
