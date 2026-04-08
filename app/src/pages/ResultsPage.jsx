import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./ResultsPage.module.css";
import TopBar from "../components/TopBar";
import useLocalCaseDatabase from "../hooks/useLocalCaseDatabase";
import {
  getDocTypeKey as getDocumentTypeKey,
  getDocumentLabel,
  getPrimaryDateText,
  getResultTitle as buildResultTitle,
  getResultTypeLabel as buildResultTypeLabel,
} from "../data/documentUtils";
import {
  FILTER_SECTIONS,
  PRIMARY_FILTER_DEFS,
  EXTRA_FILTER_DEFS,
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
import ResultCompactRow from "./results/ResultListRow";
import ResultTableRow from "./results/ResultTableRow";
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
const LIST_FALLBACK_WIDTH = 640;
const RESULTS_BATCH_SIZE = 10;
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
  { value: "type", label: "Document type" },
];
const MONTH_INDEX_BY_NAME = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

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

function getDocTypeKey(data) {
  return getDocumentTypeKey(data);
}

function getResultTypeLabel(data) {
  return buildResultTypeLabel(data);
}

function getResultTitle(data) {
  return buildResultTitle(data);
}

function getSortDateText(data) {
  const dateText = getPrimaryDateText(data);
  return dateText === "—" ? "" : dateText;
}

function parseSortDate(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim();
  if (!normalizedValue || normalizedValue === "N/A") {
    return null;
  }

  const structuredMatch = normalizedValue.match(/^(\d{4})\s+([A-Za-z]+)(?:\s+(\d{1,2}))?$/);
  if (structuredMatch) {
    const [, yearText, monthText, dayText] = structuredMatch;
    const monthIndex = MONTH_INDEX_BY_NAME[monthText.toLowerCase()];
    if (monthIndex !== undefined) {
      return new Date(Number(yearText), monthIndex, Number(dayText || 1)).getTime();
    }
  }

  const fallbackTimestamp = Date.parse(normalizedValue);
  return Number.isNaN(fallbackTimestamp) ? null : fallbackTimestamp;
}

function getSortDateValue(data) {
  return parseSortDate(getSortDateText(data));
}

function getRelevanceScore(data, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;

  const terms = [...new Set(normalizedQuery.split(/\s+/).filter(Boolean))];
  const titleText = getResultTitle(data).toLowerCase();
  const typeText = getResultTypeLabel(data).toLowerCase();
  const searchText = [
    titleText,
    typeText,
    getSortDateText(data),
    data.parties,
    data.caseRef,
    data.documentTitle,
    data.companyName,
    data["Court"],
    data["Court Level"],
    data["Decision Type"],
    data["Disposition"],
    data["Prevailing Party"],
    data["Judge Name"],
    data["Jurisdiction"],
    data["Legal Topics"],
    data["Sector"],
    data["Plaintiff Name"],
    data["Defendant Name"],
    data["Precedent Name"],
    data["Cited Statute"],
    data.background,
    data.issues,
    data.findings,
    data.decision,
    data.legalPrinciples,
    data.passageText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (titleText.includes(normalizedQuery)) score += 80;
  if (typeText.includes(normalizedQuery)) score += 20;
  if (searchText.includes(normalizedQuery)) score += 35;

  terms.forEach((term) => {
    if (titleText.includes(term)) score += 18;
    if (typeText.includes(term)) score += 6;
    if (searchText.includes(term)) score += 8;
  });

  return score;
}

function matchesSearchQuery(data, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const terms = [...new Set(normalizedQuery.split(/\s+/).filter(Boolean))];
  const titleText = getResultTitle(data).toLowerCase();
  const searchText = [
    titleText,
    getResultTypeLabel(data),
    getSortDateText(data),
    data.parties,
    data["Court"],
    data["Court Level"],
    data["Decision Type"],
    data["Disposition"],
    data["Prevailing Party"],
    data["Judge Name"],
    data["Jurisdiction"],
    data["Legal Topics"],
    data["Sector"],
    data["Plaintiff Name"],
    data["Defendant Name"],
    data["Precedent Name"],
    data["Cited Statute"],
    data.background,
    data.issues,
    data.findings,
    data.decision,
    data.legalPrinciples,
    data.passageText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (titleText.includes(normalizedQuery) || searchText.includes(normalizedQuery)) {
    return true;
  }

  if (terms.length === 1) {
    return searchText.includes(terms[0]);
  }

  const matchedTermCount = terms.filter((term) => searchText.includes(term)).length;
  return matchedTermCount >= Math.max(2, Math.ceil(terms.length * 0.6));
}

function compareNullableDates(aValue, bValue, direction) {
  const aMissing = aValue == null;
  const bMissing = bValue == null;

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? aValue - bValue : bValue - aValue;
}

function sortCases(entries, sortBy, query) {
  return entries
    .map(([id, data], originalIndex) => ({ id, data, originalIndex }))
    .sort((a, b) => {
      const titleDiff = getResultTitle(a.data).localeCompare(getResultTitle(b.data), undefined, {
        sensitivity: "base",
        numeric: true,
      });

      if (sortBy === "newest") {
        const dateDiff = compareNullableDates(getSortDateValue(a.data), getSortDateValue(b.data), "desc");
        if (dateDiff !== 0) return dateDiff;
        if (titleDiff !== 0) return titleDiff;
        return a.originalIndex - b.originalIndex;
      }

      if (sortBy === "oldest") {
        const dateDiff = compareNullableDates(getSortDateValue(a.data), getSortDateValue(b.data), "asc");
        if (dateDiff !== 0) return dateDiff;
        if (titleDiff !== 0) return titleDiff;
        return a.originalIndex - b.originalIndex;
      }

      if (sortBy === "title") {
        if (titleDiff !== 0) return titleDiff;
        return a.originalIndex - b.originalIndex;
      }

      if (sortBy === "type") {
        const typeDiff = getResultTypeLabel(a.data).localeCompare(getResultTypeLabel(b.data), undefined, {
          sensitivity: "base",
        });
        if (typeDiff !== 0) return typeDiff;
        if (titleDiff !== 0) return titleDiff;
        return a.originalIndex - b.originalIndex;
      }

      if (query.trim()) {
        const relevanceDiff = getRelevanceScore(b.data, query) - getRelevanceScore(a.data, query);
        if (relevanceDiff !== 0) return relevanceDiff;

        const dateDiff = compareNullableDates(getSortDateValue(a.data), getSortDateValue(b.data), "desc");
        if (dateDiff !== 0) return dateDiff;
      }

      return a.originalIndex - b.originalIndex;
    })
    .map(({ id, data }) => [id, data]);
}

/* ─── Main Page Component ────────────────────────────────── */

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParamQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(searchParamQuery);
  const mainLayoutRef = useRef(null);
  const resizeStateRef = useRef({ active: false, containerRight: 0 });

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  const [compactFieldsMap, setCompactFieldsMap] = useState({});
  const [sortBy, setSortBy] = useState("relevance");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState(null);
  const tooltipTimer = useRef(null);
  const [viewMode, setViewMode] = useState("compact");
  const [visibleResultCount, setVisibleResultCount] = useState(RESULTS_BATCH_SIZE);
  const [previewWidth, setPreviewWidth] = useState(getInitialPreviewWidth);
  const [isPreviewResizing, setIsPreviewResizing] = useState(false);
  const [isListFallbackActive, setIsListFallbackActive] = useState(false);
  const resultsAreaRef = useRef(null);
  const sortControlRef = useRef(null);
  const {
    caseCount,
    caseEntries,
    casesById,
    error: caseLoadError,
    isLoading: isCaseDataLoading,
  } = useLocalCaseDatabase();

  const casesArray = caseEntries;
  const searchedCasesArray = useMemo(
    () => casesArray.filter(([, data]) => matchesSearchQuery(data, query)),
    [casesArray, query]
  );
  const filterSections = useMemo(
    () => buildFilterSections(Object.fromEntries(searchedCasesArray)),
    [searchedCasesArray]
  );
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const filteredCasesArray = useMemo(
    () => searchedCasesArray.filter(([, data]) => matchesSelectedFilters(data, appliedFilters)),
    [appliedFilters, searchedCasesArray]
  );
  const sortedCasesArray = useMemo(
    () => sortCases(filteredCasesArray, sortBy, query),
    [filteredCasesArray, query, sortBy]
  );
  const visibleCasesArray = useMemo(
    () => sortedCasesArray.slice(0, visibleResultCount),
    [sortedCasesArray, visibleResultCount]
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
  const resultCount = sortedCasesArray.length;
  const appliedFilterCount = useMemo(
    () => Object.values(appliedFilters).reduce((count, values) => count + values.length, 0),
    [appliedFilters]
  );
  const previewData = useMemo(
    () => sortedCasesArray.find(([id]) => id === selectedPreviewId)?.[1] ?? null,
    [selectedPreviewId, sortedCasesArray]
  );
  const activeSortOption = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0],
    [sortBy]
  );
  const effectiveViewMode = viewMode === "list" && isListFallbackActive ? "compact" : viewMode;
  const hasMoreResults = visibleCasesArray.length < sortedCasesArray.length;
  const resultCountLabel = isCaseDataLoading
    ? "Loading local database..."
    : caseLoadError
      ? "Local database unavailable"
      : `${resultCount} Result${resultCount === 1 ? "" : "s"}${caseCount ? ` of ${caseCount}` : ""}`;
  const emptyResultsMessage = isCaseDataLoading
    ? "Loading the uploaded CSV..."
    : caseLoadError
      ? caseLoadError
      : query.trim()
        ? `No results match "${query}".`
        : "No results match the selected filters.";
  const loadMoreLabel = `Load more results (${visibleCasesArray.length} / ${resultCount})`;

  const toggleCollapse = useCallback((key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const expandAllSections = useCallback(() => setCollapsedSections({}), []);
  const collapseAllSections = useCallback(() => {
    const all = {};
    [...PRIMARY_FILTER_DEFS, ...EXTRA_FILTER_DEFS].forEach((d) => { all[d.key] = true; });
    setCollapsedSections(all);
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
      const data = casesById[id];
      if (!data) return;
      items[id] = getDocumentLabel(data);
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
  }, [casesById, query]);

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
      const data = casesById[id];
      if (!data) return;

      const docType = getDocTypeKey(data);
      if (!groups[docType]) groups[docType] = [];
      groups[docType].push({ id, label: getDocumentLabel(data) });
    });

    return groups;
  }, [casesById]);

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
    if (editMode === "compact") {
      setCompactFieldsMap((prev) => ({ ...prev, [editCardId]: newFields }));
    } else {
      setCustomFieldsMap((prev) => ({ ...prev, [editCardId]: newFields }));
    }
    setEditCardId(null);
  }, [editCardId, editMode]);

  const getFieldsForDocType = useCallback((docType, mode = "cards") => {
    if (mode === "compact") {
      if (docType === "financial-statement") return { defaults: LIST_FIELDS_FINANCIAL, all: ALL_LIST_FIELDS_FINANCIAL };
      if (docType === "contract") return { defaults: LIST_FIELDS_CONTRACT, all: ALL_LIST_FIELDS_CONTRACT };
      return { defaults: LIST_FIELDS, all: ALL_LIST_FIELDS };
    }

    if (docType === "financial-statement") return { defaults: CARD_FIELDS_FINANCIAL, all: ALL_FIELDS_FINANCIAL };
    if (docType === "contract") return { defaults: CARD_FIELDS_CONTRACT, all: ALL_FIELDS_CONTRACT };
    return { defaults: CARD_FIELDS, all: ALL_FIELDS };
  }, []);

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed !== query) setQuery(trimmed);
    navigate(trimmed ? `/results?q=${encodeURIComponent(trimmed)}` : "/results", { replace: true });
  }, [navigate, query]);

  const handleLoadMore = useCallback(() => {
    setVisibleResultCount((current) => Math.min(current + RESULTS_BATCH_SIZE, sortedCasesArray.length));
  }, [sortedCasesArray.length]);

  useEffect(() => {
    setQuery(searchParamQuery);
  }, [searchParamQuery]);

  useEffect(() => {
    setVisibleResultCount(RESULTS_BATCH_SIZE);
  }, [query, appliedFiltersSignature]);

  useEffect(() => {
    if (selectedPreviewId === null) return;
    if (filteredCasesArray.some(([id]) => id === selectedPreviewId)) return;
    setSelectedPreviewId(null);
  }, [filteredCasesArray, selectedPreviewId]);

  useEffect(() => {
    if (selectedPreviewId === null) return;
    if (visibleCasesArray.some(([id]) => id === selectedPreviewId)) return;
    setSelectedPreviewId(null);
  }, [selectedPreviewId, visibleCasesArray]);

  useEffect(() => {
    setCollectionIds((prev) => new Set([...prev].filter((id) => casesById[id])));
  }, [casesById]);

  useEffect(() => {
    const node = resultsAreaRef.current;
    if (!node) return undefined;

    const updateFallbackState = () => {
      setIsListFallbackActive(node.clientWidth < LIST_FALLBACK_WIDTH);
    };

    updateFallbackState();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateFallbackState);
      return () => {
        window.removeEventListener("resize", updateFallbackState);
      };
    }

    const observer = new ResizeObserver(updateFallbackState);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getPreviewMaxWidth = useCallback(() => {
    const containerWidth = mainLayoutRef.current?.clientWidth
      ?? (typeof window !== "undefined" ? window.innerWidth : PREVIEW_DEFAULT_WIDTH + PREVIEW_MIN_WIDTH);
    const sidebarW = sidebarOpen ? SIDEBAR_WIDTH : 0;
    const availableWidth = containerWidth - sidebarW - RESULTS_MIN_WIDTH - PREVIEW_RESIZER_WIDTH;

    return Math.max(
      PREVIEW_MIN_WIDTH,
      Math.min(PREVIEW_MAX_WIDTH, availableWidth)
    );
  }, [sidebarOpen]);

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
    if (!sortMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (sortControlRef.current?.contains(event.target)) return;
      setSortMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSortMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortMenuOpen]);

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
      <div className={styles.searchStrip}>
        <div className={styles.searchStripInner}>
          <SearchRow
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            resultCount={resultCount}
            appliedFilterCount={appliedFilterCount}
          />
        </div>
      </div>
      <div
        ref={mainLayoutRef}
        className={`${styles.mainLayout} ${isPreviewResizing ? styles.mainLayoutResizing : ""} ${!sidebarOpen ? styles.mainLayoutSidebarHidden : ""}`}
        style={{ "--preview-width": `${previewWidth}px` }}
      >
        <FilterSidebar
          filterSections={filterSections}
          primaryFilterKeys={PRIMARY_FILTER_DEFS.map((d) => d.key)}
          extraFilterKeys={EXTRA_FILTER_DEFS.map((d) => d.key)}
          collapsedSections={collapsedSections}
          toggleCollapse={toggleCollapse}
          onExpandAll={expandAllSections}
          onCollapseAll={collapseAllSections}
          selectedFilters={draftFilters}
          onToggleOption={toggleDraftFilter}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          hasPendingChanges={hasPendingFilterChanges}
          hasAnySelectedFilters={hasAnySelectedFilters}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className={styles.resultsArea}>
          <div className={styles.resultCountRow}>
            <div className={styles.resultCountLeft}>
              {!sidebarOpen && (
                <button type="button" className={styles.filtersToggleBtn} onClick={() => setSidebarOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  Filters
                </button>
              )}
              <div className={styles.resultCount}>
                {resultCountLabel}
              </div>
            </div>
            <div className={styles.resultUtilityGroup}>
              <div ref={sortControlRef} className={styles.sortControl}>
                <label className={styles.sortLabel} htmlFor="results-sort">
                  Sort by
                </label>
                <div className={styles.sortSelectWrap}>
                  <button
                    id="results-sort"
                    type="button"
                    className={styles.sortSelectBtn}
                    onClick={() => setSortMenuOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={sortMenuOpen}
                    aria-controls="results-sort-menu"
                  >
                    {activeSortOption.label}
                  </button>
                  <svg
                    className={styles.sortSelectIcon}
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {sortMenuOpen && (
                    <div
                      id="results-sort-menu"
                      className={styles.sortMenu}
                      role="menu"
                      aria-label="Sort results"
                    >
                      {SORT_OPTIONS.map((option) => {
                        const isActive = option.value === sortBy;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.sortMenuOption} ${isActive ? styles.sortMenuOptionActive : ""}`}
                            role="menuitemradio"
                            aria-checked={isActive}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortMenuOpen(false);
                            }}
                          >
                            <span>{option.label}</span>
                            {isActive && (
                              <svg
                                className={styles.sortMenuOptionCheck}
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${viewMode === "compact" ? styles.viewToggleBtnActive : ""}`}
                  onClick={() => setViewMode("compact")}
                >
                  Compact
                </button>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${viewMode === "cards" ? styles.viewToggleBtnActive : ""}`}
                  onClick={() => setViewMode("cards")}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
              </div>
              <div className={styles.reportActionGroup}>
                <span
                  className={styles.tooltipWrap}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    tooltipTimer.current = setTimeout(() => {
                      setTooltipPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
                    }, 400);
                  }}
                  onMouseLeave={() => {
                    clearTimeout(tooltipTimer.current);
                    setTooltipPos(null);
                  }}
                >
                  <button
                    className={styles.subscribeSearchBtn}
                    onClick={handleSubscribeToSearch}
                    disabled={resultCount === 0 || collectionIds.size > 0}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Set Up Alerts
                  </button>
                </span>
                {collectionIds.size > 0 && (
                  <button className={styles.exportSelectedBtn} onClick={handleBuildSelectedReport}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Build Report
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            ref={resultsAreaRef}
            className={styles.resultsViewport}
            style={collectionIds.size > 0 ? { paddingBottom: "calc(86px + var(--app-safe-bottom, 0px))" } : undefined}
          >
            <div className={styles.resultsContent}>
              <div
                className={
                  effectiveViewMode === "cards"
                    ? styles.resultCardStack
                    : effectiveViewMode === "list"
                      ? styles.resultTable
                      : styles.resultList
                }
              >
                {sortedCasesArray.length === 0 ? (
                  <div className={styles.emptyResults}>{emptyResultsMessage}</div>
                ) : (
                  <>
                    {effectiveViewMode === "list" && (
                      <div className={styles.resultTableHeader}>
                        <span className={styles.resultTableHeaderCell} title="Select for report">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
                        </span>
                        <span className={styles.resultTableHeaderCell}>Document</span>
                        <span className={styles.resultTableHeaderCell}>Type</span>
                        <span className={styles.resultTableHeaderCell}>Source</span>
                        <span className={styles.resultTableHeaderCell}>Date</span>
                        <span className={styles.resultTableHeaderCell}>Open</span>
                      </div>
                    )}
                    {visibleCasesArray.map(([id, data]) =>
                      effectiveViewMode === "list" ? (
                        <ResultTableRow
                          key={id}
                          id={id}
                          data={data}
                          isPreviewActive={selectedPreviewId === id}
                          onPreviewSelect={setSelectedPreviewId}
                          onAddToReport={toggleCollectionItem}
                          addedToReport={collectionIds.has(id)}
                          collectionFull={collectionIds.size >= MAX_COLLECTION}
                        />
                      ) : effectiveViewMode === "compact" ? (
                        <ResultCompactRow
                          key={id}
                          id={id}
                          data={data}
                          isPreviewActive={selectedPreviewId === id}
                          onPreviewSelect={setSelectedPreviewId}
                          onAddToReport={toggleCollectionItem}
                          addedToReport={collectionIds.has(id)}
                          collectionFull={collectionIds.size >= MAX_COLLECTION}
                          customFields={viewMode === "compact" ? compactFieldsMap[id] : undefined}
                          showEditButton={viewMode === "compact"}
                          onEditCard={(targetId) => handleEditCard(targetId, "compact")}
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
                    )}
                  </>
                )}
              </div>
            </div>

            {hasMoreResults && (
              <div className={styles.loadMoreRow}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  onClick={handleLoadMore}
                >
                  {loadMoreLabel}
                </button>
              </div>
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
        const docType = getDocTypeKey(casesById[editCardId]);
        const { defaults, all } = getFieldsForDocType(docType, editMode);
        return (
          <EditCardModal
            fields={(editMode === "compact" ? compactFieldsMap[editCardId] : customFieldsMap[editCardId]) || defaults}
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
                ? "Build the report to see the overview summary and export."
                : "Hand-picked document ready for a one-time report."}
            </span>
          </div>
          <div className={styles.collectorPills}>
            {[...collectionIds].map((id) => {
              const data = casesById[id];
              const label = data ? getDocumentLabel(data) : id;
              return (
                <span key={id} className={styles.collectorPill}>
                  <span className={styles.collectorPillLabel} title={label}>
                    {label}
                  </span>
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
      {tooltipPos && (
        <div
          className={`${styles.tooltip} ${styles.tooltipVisible}`}
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: "translateX(-50%)" }}
        >
          {resultCount === 0
            ? "Alerts available once this search has results."
            : "Get notified when new matching cases are added."}
        </div>
      )}
    </div>
  );
}
