import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SAMPLE_CASES } from "../data/sampleCases";
import styles from "./ResultsPage.module.css";
import TopBar from "../components/TopBar";
import {
  FILTER_SECTIONS,
  buildFilterSections,
  matchesSelectedFilters,
  CARD_FIELDS,
  CARD_FIELDS_FINANCIAL,
  CARD_FIELDS_CONTRACT,
  ALL_FIELDS,
  ALL_FIELDS_FINANCIAL,
  ALL_FIELDS_CONTRACT,
  LIST_FIELDS,
  LIST_FIELDS_FINANCIAL,
  LIST_FIELDS_CONTRACT,
  ALL_LIST_FIELDS,
  ALL_LIST_FIELDS_FINANCIAL,
  ALL_LIST_FIELDS_CONTRACT,
} from "./results/constants";
import SearchRow from "./results/SearchRow";
import FilterSidebar from "./results/FilterSidebar";
import ResultCard from "./results/ResultCard";
import ResultListRow from "./results/ResultListRow";
import PreviewPanel from "./results/PreviewPanel";
import MixedTypeModal from "./results/MixedTypeModal";
import EditCardModal from "./results/EditCardModal";

/* ─── Constants ──────────────────────────────────────────── */

const MAX_COLLECTION = 10;
const SIDEBAR_WIDTH = 240;
const RESULTS_MIN_WIDTH = 560;
const PREVIEW_MIN_WIDTH = 320;
const PREVIEW_DEFAULT_WIDTH = 360;
const PREVIEW_MAX_WIDTH = 760;
const PREVIEW_RESIZER_WIDTH = 12;
const PREVIEW_WIDTH_STORAGE_KEY = "jibudocs-results-preview-width";

function getInitialPreviewWidth() {
  if (typeof window === "undefined") return PREVIEW_DEFAULT_WIDTH;

  const storedValue = Number(window.localStorage.getItem(PREVIEW_WIDTH_STORAGE_KEY));
  return Number.isFinite(storedValue) ? storedValue : PREVIEW_DEFAULT_WIDTH;
}

function normalizeFilterState(filters) {
  return Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      const values = [...(filters[key] || [])].sort();
      if (values.length > 0) acc[key] = values;
      return acc;
    }, {});
}

/* ─── Main Page Component ────────────────────────────────── */

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const mainLayoutRef = useRef(null);
  const resizeStateRef = useRef({ active: false, containerRight: 0 });

  // Filter collapse state
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const init = {};
    FILTER_SECTIONS.forEach((s) => {
      if (!s.defaultOpen) init[s.key] = true;
    });
    return init;
  });
  const [draftFilters, setDraftFilters] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  // Manual report collection
  const [collectionIds, setCollectionIds] = useState(new Set());

  const toggleCollectionItem = useCallback((id) => {
    setCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_COLLECTION) return prev;
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearCollection = useCallback(() => {
    setCollectionIds(new Set());
  }, []);

  // Card footer expansion
  const [expandedFooters, setExpandedFooters] = useState({});

  // Mixed-type modal
  const [mixedTypeChoice, setMixedTypeChoice] = useState(null);

  // Edit card modal
  const [editCardId, setEditCardId] = useState(null);
  const [editMode, setEditMode] = useState("cards");
  const [customFieldsMap, setCustomFieldsMap] = useState({});
  const [listFieldsMap, setListFieldsMap] = useState({});
  const [viewMode, setViewMode] = useState("list");
  const [previewWidth, setPreviewWidth] = useState(getInitialPreviewWidth);
  const [isPreviewResizing, setIsPreviewResizing] = useState(false);

  const casesArray = useMemo(() => Object.entries(SAMPLE_CASES), []);
  const filterSections = useMemo(() => buildFilterSections(SAMPLE_CASES), []);
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const filteredCasesArray = useMemo(
    () => casesArray.filter(([, data]) => matchesSelectedFilters(data, appliedFilters)),
    [appliedFilters, casesArray]
  );
  const draftFiltersSignature = useMemo(
    () => JSON.stringify(normalizeFilterState(draftFilters)),
    [draftFilters]
  );
  const appliedFiltersSignature = useMemo(
    () => JSON.stringify(normalizeFilterState(appliedFilters)),
    [appliedFilters]
  );
  const hasPendingFilterChanges = draftFiltersSignature !== appliedFiltersSignature;
  const hasAnySelectedFilters = draftFiltersSignature !== "{}" || appliedFiltersSignature !== "{}";
  const resultCount = filteredCasesArray.length;
  const previewData = useMemo(
    () => filteredCasesArray.find(([id]) => id === selectedPreviewId)?.[1] ?? null,
    [filteredCasesArray, selectedPreviewId]
  );

  const toggleCollapse = useCallback((key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleDraftFilter = useCallback((sectionKey, optionLabel) => {
    setDraftFilters((prev) => {
      const currentValues = prev[sectionKey] || [];
      const nextValues = currentValues.includes(optionLabel)
        ? currentValues.filter((value) => value !== optionLabel)
        : [...currentValues, optionLabel];

      if (nextValues.length === 0) {
        const { [sectionKey]: _removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [sectionKey]: nextValues };
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(normalizeFilterState(draftFilters));
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
  }, []);

  const toggleFooter = useCallback((cardId, section) => {
    setExpandedFooters((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], [section]: !prev[cardId]?.[section] },
    }));
  }, []);

  const persistReportContext = useCallback((sourceType, chosenType, ids) => {
    const items = {};

    ids.forEach((id) => {
      const data = SAMPLE_CASES[id];
      if (!data) return;
      items[id] = data.parties || data.companyName || data.documentTitle;
    });

    sessionStorage.setItem("reportItems", JSON.stringify(items));
    sessionStorage.setItem("reportDocType", chosenType);
    sessionStorage.setItem(
      "reportSource",
      JSON.stringify({
        type: sourceType,
        query,
        documentType: chosenType,
        ids,
        count: ids.length,
      })
    );
  }, [query]);

  const startReportFlow = useCallback((sourceType, chosenType, ids) => {
    persistReportContext(sourceType, chosenType, ids);
    navigate("/report");
  }, [navigate, persistReportContext]);

  const proceedWithType = useCallback((chosenType) => {
    if (!mixedTypeChoice) return;

    const ids = (mixedTypeChoice.groups[chosenType] || []).map((item) => item.id);
    startReportFlow(mixedTypeChoice.sourceType, chosenType, ids);
    setMixedTypeChoice(null);
  }, [mixedTypeChoice, startReportFlow]);

  const buildGroupsFromIds = useCallback((ids) => {
    const groups = {};

    ids.forEach((id) => {
      const data = SAMPLE_CASES[id];
      if (!data) return;

      const docType = data.documentType || "case-law";
      if (!groups[docType]) groups[docType] = [];
      groups[docType].push({ id, label: data.parties || data.companyName || data.documentTitle });
    });

    return groups;
  }, []);

  const continueReportFlow = useCallback((sourceType, groups) => {
    const typeKeys = Object.keys(groups);
    if (typeKeys.length === 1) {
      const chosenType = typeKeys[0];
      startReportFlow(sourceType, chosenType, groups[chosenType].map((item) => item.id));
    } else {
      setMixedTypeChoice({ sourceType, groups });
    }
  }, [startReportFlow]);

  const launchSearchReport = useCallback(() => {
    if (filteredCasesArray.length === 0) return;
    const groups = buildGroupsFromIds(filteredCasesArray.map(([id]) => id));
    continueReportFlow("search", groups);
  }, [buildGroupsFromIds, continueReportFlow, filteredCasesArray]);

  const launchSelectionReport = useCallback(() => {
    if (collectionIds.size === 0) return;

    const groups = buildGroupsFromIds([...collectionIds]);
    continueReportFlow("selection", groups);
  }, [buildGroupsFromIds, collectionIds, continueReportFlow]);

  const handleSubscribeToSearch = useCallback(() => {
    launchSearchReport();
  }, [launchSearchReport]);

  const handleBuildSelectedReport = useCallback(() => {
    if (collectionIds.size === 0) return;
    launchSelectionReport();
  }, [collectionIds.size, launchSelectionReport]);

  const handleGoToReports = useCallback(() => {
    navigate("/report");
  }, [navigate]);

  const handleEditCard = useCallback((id, mode) => {
    setEditCardId(id);
    setEditMode(mode);
  }, []);

  const handleApplyCustomFields = useCallback((newFields) => {
    if (editMode === "list") {
      setListFieldsMap((prev) => ({ ...prev, [editCardId]: newFields }));
    } else {
      setCustomFieldsMap((prev) => ({ ...prev, [editCardId]: newFields }));
    }
    setEditCardId(null);
  }, [editCardId, editMode]);

  const getFieldsForDocType = useCallback((docType, mode = "cards") => {
    if (mode === "list") {
      if (docType === "financial-statement") return { defaults: LIST_FIELDS_FINANCIAL, all: ALL_LIST_FIELDS_FINANCIAL };
      if (docType === "contract") return { defaults: LIST_FIELDS_CONTRACT, all: ALL_LIST_FIELDS_CONTRACT };
      return { defaults: LIST_FIELDS, all: ALL_LIST_FIELDS };
    }

    if (docType === "financial-statement") return { defaults: CARD_FIELDS_FINANCIAL, all: ALL_FIELDS_FINANCIAL };
    if (docType === "contract") return { defaults: CARD_FIELDS_CONTRACT, all: ALL_FIELDS_CONTRACT };
    return { defaults: CARD_FIELDS, all: ALL_FIELDS };
  }, []);

  const handleSearch = useCallback(() => {
    // placeholder
  }, []);

  useEffect(() => {
    if (selectedPreviewId === null) return;
    if (filteredCasesArray.some(([id]) => id === selectedPreviewId)) return;
    setSelectedPreviewId(null);
  }, [filteredCasesArray, selectedPreviewId]);

  const getPreviewMaxWidth = useCallback(() => {
    const containerWidth = mainLayoutRef.current?.clientWidth
      ?? (typeof window !== "undefined" ? window.innerWidth : PREVIEW_DEFAULT_WIDTH + PREVIEW_MIN_WIDTH);
    const availableWidth = containerWidth - SIDEBAR_WIDTH - RESULTS_MIN_WIDTH - PREVIEW_RESIZER_WIDTH;

    return Math.max(
      PREVIEW_MIN_WIDTH,
      Math.min(PREVIEW_MAX_WIDTH, availableWidth)
    );
  }, []);

  const clampPreviewWidth = useCallback((nextWidth) => {
    const maxWidth = getPreviewMaxWidth();
    return Math.min(Math.max(nextWidth, PREVIEW_MIN_WIDTH), maxWidth);
  }, [getPreviewMaxWidth]);

  const handlePreviewResizeStart = useCallback((event) => {
    if (typeof window !== "undefined" && window.innerWidth <= 1100) return;

    const rect = mainLayoutRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    resizeStateRef.current = {
      active: true,
      containerRight: rect.right,
    };
    setIsPreviewResizing(true);
  }, []);

  const handlePreviewResizeKeyDown = useCallback((event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPreviewWidth((current) => clampPreviewWidth(current + 24));
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPreviewWidth((current) => clampPreviewWidth(current - 24));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setPreviewWidth(PREVIEW_MIN_WIDTH);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setPreviewWidth(getPreviewMaxWidth());
    }
  }, [clampPreviewWidth, getPreviewMaxWidth]);

  const handlePreviewResizeReset = useCallback(() => {
    setPreviewWidth(clampPreviewWidth(PREVIEW_DEFAULT_WIDTH));
  }, [clampPreviewWidth]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!resizeStateRef.current.active) return;

      const nextWidth = resizeStateRef.current.containerRight - event.clientX;
      setPreviewWidth(clampPreviewWidth(nextWidth));
    };

    const stopResizing = () => {
      if (!resizeStateRef.current.active) return;

      resizeStateRef.current.active = false;
      setIsPreviewResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [clampPreviewWidth]);

  useEffect(() => {
    const handleWindowResize = () => {
      setPreviewWidth((current) => clampPreviewWidth(current));
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [clampPreviewWidth]);

  useEffect(() => {
    window.localStorage.setItem(PREVIEW_WIDTH_STORAGE_KEY, String(Math.round(previewWidth)));
  }, [previewWidth]);

  useEffect(() => {
    if (!isPreviewResizing) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isPreviewResizing]);

  return (
    <div className={styles.page}>
      <TopBar activeTab="search" onReportsClick={handleGoToReports} />
      <div
        ref={mainLayoutRef}
        className={`${styles.mainLayout} ${isPreviewResizing ? styles.mainLayoutResizing : ""}`}
        style={{ "--preview-width": `${previewWidth}px` }}
      >
        <FilterSidebar
          filterSections={filterSections}
          collapsedSections={collapsedSections}
          toggleCollapse={toggleCollapse}
          selectedFilters={draftFilters}
          onToggleOption={toggleDraftFilter}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          hasPendingChanges={hasPendingFilterChanges}
          hasAnySelectedFilters={hasAnySelectedFilters}
        />

        <main className={styles.resultsArea} style={collectionIds.size > 0 ? { paddingBottom: 70 } : undefined}>
          <SearchRow
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
          />

          <div className={styles.resultCountRow}>
            <div className={styles.resultCount}>
              {resultCount} Result{resultCount === 1 ? "" : "s"}
            </div>
            <div className={styles.resultUtilityGroup}>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${viewMode === "cards" ? styles.viewToggleBtnActive : ""}`}
                  onClick={() => setViewMode("cards")}
                >
                  Cards
                </button>
              </div>
              <div className={styles.reportActionGroup}>
                <button className={styles.subscribeSearchBtn} onClick={handleSubscribeToSearch} disabled={resultCount === 0}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Subscribe to Search
                </button>
                {collectionIds.size > 0 && (
                  <button className={styles.exportSelectedBtn} onClick={handleBuildSelectedReport}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Build Report
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={viewMode === "list" ? styles.resultList : styles.resultCardStack}>
            {filteredCasesArray.length === 0 ? (
              <div className={styles.emptyResults}>No results match the selected filters.</div>
            ) : (
              filteredCasesArray.map(([id, data]) =>
                viewMode === "list" ? (
                  <ResultListRow
                    key={id}
                    id={id}
                    data={data}
                    isPreviewActive={selectedPreviewId === id}
                    onPreviewSelect={setSelectedPreviewId}
                    onAddToReport={toggleCollectionItem}
                    addedToReport={collectionIds.has(id)}
                    collectionFull={collectionIds.size >= MAX_COLLECTION}
                    customFields={listFieldsMap[id]}
                    onEditCard={(targetId) => handleEditCard(targetId, "list")}
                  />
                ) : (
                  <ResultCard
                    key={id}
                    id={id}
                    data={data}
                    isPreviewActive={selectedPreviewId === id}
                    onPreviewSelect={setSelectedPreviewId}
                    expandedFooter={expandedFooters[id]}
                    onToggleFooter={toggleFooter}
                    onAddToReport={toggleCollectionItem}
                    addedToReport={collectionIds.has(id)}
                    collectionFull={collectionIds.size >= MAX_COLLECTION}
                    customFields={customFieldsMap[id]}
                    onEditCard={(targetId) => handleEditCard(targetId, "cards")}
                  />
                )
              )
            )}
          </div>
        </main>

        <div
          className={`${styles.previewResizer} ${isPreviewResizing ? styles.previewResizerActive : ""}`}
          role="separator"
          aria-label="Resize preview panel"
          aria-orientation="vertical"
          aria-valuemin={PREVIEW_MIN_WIDTH}
          aria-valuemax={getPreviewMaxWidth()}
          aria-valuenow={Math.round(previewWidth)}
          aria-valuetext={`${Math.round(previewWidth)} pixels`}
          tabIndex={0}
          title="Drag to resize preview panel"
          onPointerDown={handlePreviewResizeStart}
          onKeyDown={handlePreviewResizeKeyDown}
          onDoubleClick={handlePreviewResizeReset}
        />
        <PreviewPanel data={previewData} />
      </div>

      {mixedTypeChoice && (
        <MixedTypeModal
          typeGroups={mixedTypeChoice.groups}
          onProceed={proceedWithType}
          onCancel={() => setMixedTypeChoice(null)}
        />
      )}

      {editCardId && (() => {
        const docType = SAMPLE_CASES[editCardId]?.documentType || "case-law";
        const { defaults, all } = getFieldsForDocType(docType, editMode);
        return (
          <EditCardModal
            fields={(editMode === "list" ? listFieldsMap[editCardId] : customFieldsMap[editCardId]) || defaults}
            defaultFields={defaults}
            allFields={all}
            onApply={handleApplyCustomFields}
            onClose={() => setEditCardId(null)}
          />
        );
      })()}

      {collectionIds.size > 0 && (
        <div className={styles.collectorBar}>
          <div className={styles.collectorIcon}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className={styles.collectorInfo}>
            <span className={styles.collectorCount}>{collectionIds.size}/{MAX_COLLECTION} selected</span>
            <span className={styles.collectorHint}>
              {collectionIds.size >= 2
                ? "Build the report first, then use the Compare tab before export."
                : "Hand-picked document ready for a one-time report."}
            </span>
          </div>
          <div className={styles.collectorPills}>
            {[...collectionIds].map((id) => {
              const data = SAMPLE_CASES[id];
              const label = data?.caseRef || data?.companyName || data?.documentTitle || id;
              return (
                <span key={id} className={styles.collectorPill}>
                  {label}
                  <span className={styles.collectorPillRemove} onClick={() => toggleCollectionItem(id)}>&times;</span>
                </span>
              );
            })}
          </div>
          <button className={styles.clearAllBtn} onClick={clearCollection}>Clear all</button>
          <button className={styles.buildReportBtn} onClick={handleBuildSelectedReport}>
            Build Report &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
