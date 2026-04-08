import { useState, useMemo } from "react";
import type { FilterSection } from "./constants";

interface FilterSidebarProps {
  filterSections: FilterSection[];
  primaryFilterKeys: string[];
  extraFilterKeys: string[];
  collapsedSections: Record<string, boolean>;
  toggleCollapse: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  selectedFilters: Record<string, string[]>;
  onToggleOption: (sectionKey: string, optionLabel: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  hasPendingChanges: boolean;
  hasAnySelectedFilters: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function ChevronIcon({ open }: { open: boolean }) {
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
}: FilterSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [addedExtras, setAddedExtras] = useState(new Set<string>());
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

  const searchMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return filterSections.filter((s) => s.label.toLowerCase().includes(term));
  }, [searchTerm, filterSections]);

  const addExtra = (key: string) => {
    setAddedExtras((prev) => new Set([...prev, key]));
    setShowMoreOpen(false);
    setSearchTerm("");
  };

  const removeExtra = (key: string) => {
    setAddedExtras((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const visibleSectionKeys = useMemo(() => {
    const keys = primarySections.map((s) => s.key);
    visibleExtraSections.forEach((s) => keys.push(s.key));
    return keys;
  }, [primarySections, visibleExtraSections]);

  const allExpanded = visibleSectionKeys.length > 0 && visibleSectionKeys.every((k) => !collapsedSections[k]);

  if (!sidebarOpen) return null;

  const renderSection = (sec: FilterSection, { removable = false } = {}) => {
    const open = !collapsedSections[sec.key];
    return (
      <div key={sec.key} className="border-b border-slate-200/40">
        <button type="button" className="flex items-center justify-between w-full px-[14px] py-[10px] bg-none border-none text-xs font-semibold text-slate-700 cursor-pointer transition-[background] duration-100 hover:bg-slate-50" onClick={() => toggleCollapse(sec.key)}>
          <span>{sec.label}</span>
          <span className="flex items-center gap-1">
            {removable && (
              <span
                className="flex items-center justify-center w-5 h-5 rounded text-slate-400 cursor-pointer transition-[background,color] duration-100 hover:bg-red-100 hover:text-red-600"
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
          <div className="px-[14px] pb-[10px]">
            {sec.options.map((opt) => (
              <label key={opt.label} className="flex items-center gap-1.5 py-[3px] text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="m-0 accent-yellow-600"
                  checked={selectedFilters[sec.key]?.includes(opt.label) || false}
                  onChange={() => onToggleOption(sec.key, opt.label)}
                />
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{opt.label}</span>
                <span className="text-[11px] text-slate-400 flex-shrink-0">{opt.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isSearching = searchMatches !== null;
  const searchResultSections = isSearching
    ? searchMatches!.filter((s) => s.options.length > 0)
    : [];

  return (
    <aside className="bg-transparent border-r-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-[14px] py-3 pb-2 border-b border-slate-200/40 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-700 m-0">Filters</h3>
        <button type="button" className="flex items-center justify-center w-6 h-6 bg-none border-none rounded cursor-pointer text-slate-400 transition-[background,color] duration-150 hover:bg-slate-100 hover:text-slate-700" onClick={onToggleSidebar} title="Hide filters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
      </div>

      {/* Expand/Collapse All */}
      <button
        type="button"
        className="flex items-center gap-1 w-full px-[14px] py-[5px] pb-[7px] bg-none border-none text-[11px] font-medium text-slate-400 cursor-pointer text-left transition-[color] duration-150 hover:text-yellow-600"
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
      <div className="flex items-center gap-1.5 mx-[10px] my-2 mb-1 px-[10px] py-1.5 border border-slate-200 rounded-md bg-slate-50 text-slate-400 transition-[border-color] duration-150 focus-within:border-yellow-600 focus-within:bg-white focus-within:text-slate-500">
        <SearchIcon />
        <input
          type="text"
          className="flex-1 border-none bg-transparent outline-none text-xs text-slate-700 min-w-0 placeholder:text-slate-400"
          placeholder="Find filters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button type="button" className="flex items-center justify-center bg-none border-none cursor-pointer text-slate-400 p-0 hover:text-slate-600" onClick={() => setSearchTerm("")}>
            <RemoveIcon />
          </button>
        )}
      </div>

      {/* Filter list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isSearching ? (
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
                      className="block w-[calc(100%-28px)] mx-[14px] mb-2 py-[5px] bg-none border border-dashed border-slate-300 rounded-[5px] text-[11px] font-medium text-yellow-600 cursor-pointer transition-[background] duration-150 hover:bg-yellow-50"
                      onClick={() => addExtra(sec.key)}
                    >
                      + Pin to sidebar
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-[14px] py-5 text-xs text-slate-400 text-center">No filters match &ldquo;{searchTerm}&rdquo;</div>
          )
        ) : (
          <>
            {primarySections.map((sec) => renderSection(sec))}

            {visibleExtraSections.length > 0 && (
              <>
                <div className="px-[14px] py-[10px] pb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400 border-t border-dashed border-slate-200/60">
                  <span>Added filters</span>
                </div>
                {visibleExtraSections.map((sec) => renderSection(sec, { removable: true }))}
              </>
            )}

            {availableExtras.length > 0 && (
              <div className="px-[10px] py-1.5 relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 w-full px-[10px] py-2 bg-none border border-dashed border-slate-300 rounded-md text-xs font-medium text-slate-500 cursor-pointer transition-[background,border-color,color] duration-150 hover:bg-yellow-50 hover:border-yellow-600 hover:text-yellow-600"
                  onClick={() => setShowMoreOpen((v) => !v)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add more filters
                </button>
                {showMoreOpen && (
                  <div className="absolute left-[10px] right-[10px] bottom-[calc(100%+2px)] bg-white border border-slate-200 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1)] p-1 z-20 max-h-[220px] overflow-y-auto">
                    {availableExtras.map((sec) => (
                      <button
                        key={sec.key}
                        type="button"
                        className="flex items-center justify-between w-full px-[10px] py-2 bg-none border-none rounded-[5px] text-xs text-slate-700 cursor-pointer transition-[background] duration-100 hover:bg-yellow-50"
                        onClick={() => addExtra(sec.key)}
                      >
                        <span>{sec.label}</span>
                        <span className="text-[11px] text-slate-400">{sec.options.length} values</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-[14px] pt-[10px] pb-[calc(10px+var(--app-safe-bottom,0px))] border-t border-slate-200/40 flex gap-2">
        <button type="button" className="flex-1 py-1.5 bg-slate-800 text-white border-none rounded-[5px] text-xs font-semibold cursor-pointer transition-[background] duration-150 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed" onClick={onApplyFilters} disabled={!hasPendingChanges}>Apply Filters</button>
        <button type="button" className="px-[14px] py-1.5 bg-none border border-slate-200 rounded-[5px] text-xs text-slate-500 cursor-pointer transition-[background] duration-150 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed" onClick={onResetFilters} disabled={!hasAnySelectedFilters}>Reset</button>
      </div>
    </aside>
  );
}
