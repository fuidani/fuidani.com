import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import styles from "./SearchPage.module.css";

const SUGGESTIONS = [
  "Blind discrimination",
  "Discover fraud upon exercise of reasonable diligence",
  "Value Added Tax",
  "General damages for unfair termination",
  "Section 12 of the Consumer Protection Act",
  "Breach of fiduciary duty",
  "Constitutional right to fair hearing",
  "Vicarious liability in employment",
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/refine?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleChipClick = (text) => {
    setQuery(text);
  };

  return (
    <div className={styles.pageWrapper}>
      <TopBar activeTab="search" />
      <div className={styles.contentArea}>
        <div className={styles.container}>
          <h1 className={styles.heading}>What are you looking for?</h1>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" onClick={handleSubmit} aria-label="Search">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 19V5m0 0l-6 6m6-6l6 6"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          <div className={styles.suggestionsLabel}>Suggestions</div>
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((text) => (
              <span
                key={text}
                className={styles.chip}
                onClick={() => handleChipClick(text)}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
