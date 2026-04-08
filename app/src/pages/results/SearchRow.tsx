interface SearchRowProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  resultCount?: number;
  appliedFilterCount?: number;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function SearchRow({ query, onQueryChange, onSearch }: SearchRowProps) {
  return (
    <section className="flex flex-col items-center gap-[18px] text-center">
      <form
        className="w-full max-w-[900px] flex items-center gap-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <div className="flex-1 relative min-w-0">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-slate-400 flex pointer-events-none">
            <SearchIcon />
          </span>
          <input
            className="w-full min-h-10 py-2 pr-[14px] pl-[42px] border border-slate-400/40 rounded-[10px] text-sm leading-[1.5] outline-none transition-[border-color,box-shadow] duration-150 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-yellow-600 focus:shadow-[0_0_0_3px_rgba(202,138,4,0.12),0_4px_12px_rgba(15,23,42,0.08)] box-border"
            type="text"
            aria-label="Search query"
            placeholder="Search documents..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <button
          type="submit"
          className="min-h-9 px-[14px] bg-gradient-to-b from-slate-800 to-slate-900 text-white border-none rounded-lg text-xs font-semibold cursor-pointer flex-shrink-0 transition-transform duration-150 shadow-[0_4px_10px_rgba(15,23,42,0.10)] whitespace-nowrap hover:bg-gradient-to-b hover:from-slate-700 hover:to-slate-800 hover:-translate-y-px hover:shadow-[0_12px_22px_rgba(15,23,42,0.16)]"
        >
          Search
        </button>
      </form>
    </section>
  );
}
