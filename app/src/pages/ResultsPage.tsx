import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import useLocalCaseDatabase from "../hooks/useLocalCaseDatabase";
import type { CaseRecord } from "../data/sampleCases";
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

const MONTH_INDEX_BY_NAME: Record<string, number> = {
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

function getInitialPreviewWidth(): number {
  if (typeof window === "undefined") return PREVIEW_DEFAULT_WIDTH;
  const storedValue = Number(window.localStorage.getItem(PREVIEW_WIDTH_STORAGE_KEY));
  return Number.isFinite(storedValue) ? storedValue : PREVIEW_DEFAULT_WIDTH;
}

function normalizeFilterState(filters: Record<string, string[]>): Record<string, string[]> {
  return Object.keys(filters)
    .sort()
    .reduce<Record<string, string[]>>((acc, key) => {
      const values = [...(filters[key] || [])].sort();
      if (values.length > 0) acc[key] = values;
      return acc;
    }, {});
}

function getDocTypeKey(data: CaseRecord): string {
  return getDocumentTypeKey(data);
}

function getResultTypeLabel(data: CaseRecord): string {
  return buildResultTypeLabel(data);
}

function getResultTitle(data: CaseRecord): string {
  return buildResultTitle(data);
}

function getSortDateText(data: CaseRecord): string {
  const dateText = getPrimaryDateText(data);
  return dateText === "—" ? "" : dateText;
}

function parseSortDate(value: string | undefined): number | null {
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

function getSortDateValue(data: CaseRecord): number | null {
  return parseSortDate(getSortDateText(data));
}

function getRelevanceScore(data: CaseRecord, query: string): number {
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

function matchesSearchQuery(data: CaseRecord, query: string): boolean {
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

function compareNullableDates(
  aValue: number | null,
  bValue: number | null,
  direction: "asc" | "desc"
): number {
  const aMissing = aValue == null;
  const bMissing = bValue == null;

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? aValue! - bValue! : bValue! - aValue!;
}

function sortCases(
  entries: [string, CaseRecord][],
  sortBy: string,
  query: string
): [string, CaseRecord][] {
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

interface MixedTypeChoice {
  sourceType: string;
  groups: Record<string, { id: string; label: string }[]>;
}

interface TooltipPos {
  top: number;
  left: number;
}

/* ─── Main Page Component ────────────────────────────────── */

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParamQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(searchParamQuery);
  const mainLayoutRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{ active: boolean; containerRight: number }>({ active: false, containerRight: 0 });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    FILTER_SECTIONS.forEach((s) => {
      if (!s.defaultOpen) init[s.key] = true;
    });
    return init;
  });
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const [collectionIds, setCollectionIds] = useState<Set<string>>(new Set());

  const toggleCollectionItem = useCallback((id: string) => {
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

  const [expandedFooters, setExpandedFooters] = useState<Record<string, Record<string, boolean>>>({});
  const [mixedTypeChoice, setMixedTypeChoice] = useState<MixedTypeChoice | null>(null);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"cards" | "compact">("cards");
  const [customFieldsMap, setCustomFieldsMap] = useState<Record<string, { name: string; visible: boolean }[]>>({});
  const [compactFieldsMap, setCompactFieldsMap] = useState<Record<string, { name: string; visible: boolean }[]>>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewMode, setViewMode] = useState<"compact" | "cards" | "list">("compact");
  const [visibleResultCount, setVisibleResultCount] = useState(RESULTS_BATCH_SIZE);
  const [previewWidth, setPreviewWidth] = useState(getInitialPreviewWidth);
  const [isPreviewResizing, setIsPreviewResizing] = useState(false);
  const [isListFallbackActive, setIsListFallbackActive] = useState(false);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const sortControlRef = useRef<HTMLDivElement>(null);
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
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
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

  const toggleSelectAllVisible = useCallback(() => {
    setCollectionIds((prev) => {
      const visibleIds = visibleCasesArray.map(([id]) => id);
      const anyVisibleSelected = visibleIds.some((id) => prev.has(id));
      if (anyVisibleSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (next.size >= MAX_COLLECTION) break;
        next.add(id);
      }
      return next;
    });
  }, [visibleCasesArray]);

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

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const expandAllSections = useCallback(() => setCollapsedSections({}), []);
  const collapseAllSections = useCallback(() => {
    const all: Record<string, boolean> = {};
    [...PRIMARY_FILTER_DEFS, ...EXTRA_FILTER_DEFS].forEach((d) => { all[d.key] = true; });
    setCollapsedSections(all);
  }, []);

  const toggleDraftFilter = useCallback((sectionKey: string, optionLabel: string) => {
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

  const toggleFooter = useCallback((cardId: string, section: string) => {
    setExpandedFooters((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], [section]: !prev[cardId]?.[section] },
    }));
  }, []);

  const persistReportContext = useCallback((sourceType: string, chosenType: string, ids: string[]) => {
    const items: Record<string, string> = {};

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

  const startReportFlow = useCallback((sourceType: string, chosenType: string, ids: string[]) => {
    persistReportContext(sourceType, chosenType, ids);
    navigate("/report");
  }, [navigate, persistReportContext]);

  const proceedWithType = useCallback((chosenType: string) => {
    if (!mixedTypeChoice) return;

    const ids = (mixedTypeChoice.groups[chosenType] || []).map((item) => item.id);
    startReportFlow(mixedTypeChoice.sourceType, chosenType, ids);
    setMixedTypeChoice(null);
  }, [mixedTypeChoice, startReportFlow]);

  const buildGroupsFromIds = useCallback((ids: string[]) => {
    const groups: Record<string, { id: string; label: string }[]> = {};

    ids.forEach((id) => {
      const data = casesById[id];
      if (!data) return;

      const docType = getDocTypeKey(data);
      if (!groups[docType]) groups[docType] = [];
      groups[docType].push({ id, label: getDocumentLabel(data) });
    });

    return groups;
  }, [casesById]);

  const continueReportFlow = useCallback((sourceType: string, groups: Record<string, { id: string; label: string }[]>) => {
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

  const handleEditCard = useCallback((id: string, mode: "cards" | "compact") => {
    setEditCardId(id);
    setEditMode(mode);
  }, []);

  const handleApplyCustomFields = useCallback((newFields: { name: string; visible: boolean }[]) => {
    if (editMode === "compact") {
      setCompactFieldsMap((prev) => ({ ...prev, [editCardId!]: newFields }));
    } else {
      setCustomFieldsMap((prev) => ({ ...prev, [editCardId!]: newFields }));
    }
    setEditCardId(null);
  }, [editCardId, editMode]);

  const getFieldsForDocType = useCallback((docType: string, mode: "cards" | "compact" = "cards") => {
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

  const clampPreviewWidth = useCallback((nextWidth: number) => {
    const maxWidth = getPreviewMaxWidth();
    return Math.min(Math.max(nextWidth, PREVIEW_MIN_WIDTH), maxWidth);
  }, [getPreviewMaxWidth]);

  const handlePreviewResizeStart = useCallback((event: React.PointerEvent) => {
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

  const handlePreviewResizeKeyDown = useCallback((event: React.KeyboardEvent) => {
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

    const handlePointerDown = (event: PointerEvent) => {
      if (sortControlRef.current?.contains(event.target as Node)) return;
      setSortMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
    const handlePointerMove = (event: PointerEvent) => {
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

  // Grid layout classes
  const mainLayoutClass = [
    "grid flex-1 min-h-0 overflow-hidden",
    isPreviewResizing ? "cursor-col-resize" : "",
  ].filter(Boolean).join(" ");

  const mainLayoutStyle: React.CSSProperties = {
    gridTemplateColumns: sidebarOpen
      ? `240px minmax(0, 1fr) 12px minmax(320px, ${previewWidth}px)`
      : `minmax(0, 1fr) 12px minmax(320px, ${previewWidth}px)`,
  };

  return (
    <div
      className="flex flex-col overflow-hidden font-['Noto_Sans',sans-serif] text-slate-800"
      style={{
        height: "var(--app-height)",
        background: "radial-gradient(circle at center top, rgba(202, 138, 4, 0.10), transparent 50%), linear-gradient(180deg, #fffdf7 0%, #f8fafc 100%)",
      }}
    >
      <TopBar activeTab="search" onReportsClick={handleGoToReports} />

      {/* Search Strip */}
      <div className="bg-transparent border-b-0 px-6 pt-5 pb-6 flex-shrink-0 z-[18]">
        <div className="w-full max-w-[1080px] mx-auto">
          <SearchRow
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            resultCount={resultCount}
            appliedFilterCount={appliedFilterCount}
          />
        </div>
      </div>

      {/* Main 3-column layout */}
      <div
        ref={mainLayoutRef}
        className={mainLayoutClass}
        style={mainLayoutStyle}
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

        {/* Results Area */}
        <main className="overflow-hidden min-h-0 min-w-0 px-5 py-4 flex flex-col gap-[14px]">
          {/* Count / controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <div className="flex items-center gap-2.5">
              {!sidebarOpen && (
                <button
                  type="button"
                  className="inline-flex items-center gap-[5px] px-[10px] py-[5px] bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 cursor-pointer transition-[background,border-color] duration-150 hover:bg-slate-50 hover:border-slate-300"
                  onClick={() => setSidebarOpen(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  Filters
                </button>
              )}
              <div className="text-[13px] font-semibold text-slate-500">
                {resultCountLabel}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort control */}
              <div ref={sortControlRef} className="inline-flex items-center gap-2 min-w-0">
                <label className="text-[11px] font-bold text-slate-500 tracking-[0.03em] uppercase whitespace-nowrap" htmlFor="results-sort">
                  Sort by
                </label>
                <div className="relative inline-flex items-center min-w-[172px] bg-white border border-slate-200 rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[background,border-color,box-shadow] duration-150 hover:bg-yellow-50 hover:border-yellow-400 focus-within:border-yellow-400 focus-within:[box-shadow:0_0_0_3px_rgba(245,158,11,0.16)]">
                  <button
                    id="results-sort"
                    type="button"
                    className="w-full min-w-0 px-3 pr-[34px] py-[7px] text-xs font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer text-left"
                    onClick={() => setSortMenuOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={sortMenuOpen}
                    aria-controls="results-sort-menu"
                  >
                    {activeSortOption.label}
                  </button>
                  <svg
                    className="absolute right-[10px] text-slate-500 pointer-events-none"
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
                      className="absolute top-[calc(100%+8px)] left-0 z-40 min-w-full p-1.5 bg-white border border-slate-200 rounded-xl shadow-[0_18px_36px_rgba(15,23,42,0.14)]"
                      role="menu"
                      aria-label="Sort results"
                    >
                      {SORT_OPTIONS.map((option) => {
                        const isActive = option.value === sortBy;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full flex items-center justify-between gap-2.5 px-[10px] py-[9px] bg-transparent border-none rounded-lg text-slate-700 cursor-pointer text-xs font-semibold text-left transition-[background,color] duration-150 ${
                              isActive
                                ? "bg-[#fff3cd] text-[#9a3412]"
                                : "hover:bg-[#fff7e6] hover:text-slate-800"
                            }`}
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
                                className="flex-shrink-0"
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

              {/* View toggle */}
              <div className="inline-flex items-center p-[3px] bg-white border border-slate-200 rounded-[10px]">
                {(["compact", "cards", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`px-3 py-[5px] text-xs font-semibold rounded-lg cursor-pointer border-none transition-[background,color,box-shadow] duration-150 ${
                      viewMode === mode
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 bg-none hover:text-slate-900 hover:bg-slate-100 hover:[box-shadow:inset_0_0_0_1px_rgba(148,163,184,0.22)]"
                    }`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Report action group */}
              <div className="flex items-center gap-2">
                <span
                  className="relative inline-flex"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    tooltipTimer.current = setTimeout(() => {
                      setTooltipPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
                    }, 400);
                  }}
                  onMouseLeave={() => {
                    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
                    setTooltipPos(null);
                  }}
                >
                  <button
                    className="inline-flex items-center gap-1.5 px-[14px] py-1.5 text-[13px] font-semibold text-amber-800 bg-[#fef3c7] border border-[#fde68a] rounded-md cursor-pointer transition-all duration-150 hover:bg-[#fde68a] hover:border-yellow-400 disabled:text-yellow-700 disabled:bg-[#fef3c7] disabled:border-[#fde68a] disabled:opacity-65 disabled:cursor-not-allowed"
                    onClick={handleSubscribeToSearch}
                    disabled={resultCount === 0 || collectionIds.size > 0}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Set Up Alerts
                  </button>
                </span>
                {collectionIds.size > 0 && (
                  <button
                    className="inline-flex items-center gap-1.5 px-[14px] py-1.5 text-[13px] font-semibold text-white bg-slate-800 border border-slate-800 rounded-md cursor-pointer transition-[background] duration-150 hover:bg-slate-700 hover:border-slate-700"
                    onClick={handleBuildSelectedReport}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Build Report
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results viewport */}
          <div
            ref={resultsAreaRef}
            className="min-h-0 min-w-0 flex-1 grid gap-[14px] overflow-hidden"
            style={{
              gridTemplateRows: "minmax(0, 1fr) auto",
              paddingBottom: collectionIds.size > 0 ? "calc(86px + var(--app-safe-bottom, 0px))" : undefined,
            }}
          >
            {/* Scrollable results content */}
            <div className="min-h-0 min-w-0 overflow-y-scroll pr-1.5 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-[10px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:[background-clip:padding-box] [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [--result-table-columns:42px_minmax(0,2.5fr)_minmax(90px,0.8fr)_minmax(100px,0.85fr)_minmax(120px,1fr)_52px]">
              {/* Table header (list mode) */}
              {effectiveViewMode === "list" && (
                <div
                  className="bg-slate-50 border-b border-slate-100 sticky top-0 z-[2]"
                  style={{ display: "grid", gridTemplateColumns: "var(--result-table-columns)" }}
                >
                  {["icon", "Document", "Type", "Source", "Date", "Open"].map((h, i) => {
                    if (i === 0) {
                      const visibleIds = visibleCasesArray.map(([id]) => id);
                      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => collectionIds.has(id));
                      const someSelected = !allSelected && visibleIds.some((id) => collectionIds.has(id));
                      const canDeselectVisible = allSelected || someSelected;
                      return (
                        <span key={h} className="min-w-0 px-3 py-[10px] flex items-center justify-center">
                          <button
                            type="button"
                            className="group w-6 h-6 p-0 border-none bg-transparent appearance-none inline-flex items-center justify-center flex-none shrink-0 cursor-pointer"
                            onClick={toggleSelectAllVisible}
                            aria-label={canDeselectVisible ? "Deselect all visible" : "Select all visible"}
                            title={canDeselectVisible ? "Deselect all visible" : "Select all visible"}
                          >
                            <span
                              className={`w-[18px] h-[18px] box-border inline-flex items-center justify-center border transition-[color,background,border-color] duration-150 ${
                                allSelected
                                  ? "border-slate-700 bg-slate-800 text-white group-hover:border-slate-900 group-hover:bg-slate-900"
                                  : someSelected
                                    ? "border-slate-500 bg-slate-200 text-slate-600 group-hover:border-slate-600"
                                    : "border-slate-300 bg-white text-transparent group-hover:border-slate-500"
                              }`}
                              style={{ borderRadius: 0 }}
                            >
                              {allSelected ? (
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : someSelected ? (
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              ) : null}
                            </span>
                          </button>
                        </span>
                      );
                    }
                    return (
                      <span
                        key={h}
                        className={`min-w-0 px-3 py-[10px] text-[10px] font-bold uppercase tracking-[0.05em] text-slate-500 flex items-center ${i === 5 ? "justify-center text-center" : ""}`}
                      >
                        {h}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Result items */}
              <div
                className={
                  effectiveViewMode === "cards"
                    ? "flex flex-col gap-[14px]"
                    : effectiveViewMode === "list"
                      ? `flex flex-col gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]`
                      : "flex flex-col gap-[10px]"
                }
              >
                {sortedCasesArray.length === 0 ? (
                  <div className="px-5 py-8 bg-white border border-dashed border-slate-300 rounded-xl text-[13px] text-slate-500 text-center">
                    {emptyResultsMessage}
                  </div>
                ) : (
                  <>
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

            {/* Load more */}
            {hasMoreResults && (
              <div className="flex justify-center py-1.5 pb-1">
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-h-11 px-[18px] rounded-[10px] border border-slate-200 bg-white text-slate-900 text-xs font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.06)] cursor-pointer transition-[border-color,background,transform,box-shadow] duration-150 hover:border-yellow-400 hover:bg-yellow-50 hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                  onClick={handleLoadMore}
                >
                  {loadMoreLabel}
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Preview resizer */}
        <div
          className={`relative bg-transparent cursor-col-resize transition-[background] duration-150 touch-none before:content-[''] before:absolute before:top-0 before:left-1/2 before:w-0.5 before:h-full before:rounded-full before:-translate-x-1/2 before:opacity-0 before:bg-yellow-600 before:transition-[opacity,width,background] before:duration-150 hover:before:opacity-100 hover:before:w-[3px] focus-visible:before:opacity-100 focus-visible:outline-none ${
            isPreviewResizing ? "before:!opacity-100 before:!w-[3px]" : ""
          }`}
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

      {/* Mixed type modal */}
      {mixedTypeChoice && (
        <MixedTypeModal
          typeGroups={mixedTypeChoice.groups}
          onProceed={proceedWithType}
          onCancel={() => setMixedTypeChoice(null)}
        />
      )}

      {/* Edit card modal */}
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

      {/* Collection bar */}
      {collectionIds.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white flex items-center gap-[14px] z-50"
          style={{
            padding: "10px 20px calc(10px + var(--app-safe-bottom))",
            animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          <div className="w-8 h-8 bg-yellow-600/20 rounded-md flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[13px] font-bold">{collectionIds.size}/{MAX_COLLECTION} selected</span>
            <span className="text-[11px] text-slate-400">
              {collectionIds.size >= 2
                ? "Build the report to see the overview summary and export."
                : "Hand-picked document ready for a one-time report."}
            </span>
          </div>
          <div className="flex gap-1 flex-1 min-w-0 overflow-hidden py-0.5">
            {[...collectionIds].map((id) => {
              const data = casesById[id];
              const label = data ? getDocumentLabel(data) : id;
              return (
                <span key={id} className="inline-flex items-center gap-[5px] px-[10px] py-1 bg-white/10 rounded text-[11px] font-medium min-w-0 flex-[1_1_0]">
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
                  <span
                    className="flex-shrink-0 cursor-pointer opacity-50 text-[14px] leading-none transition-opacity duration-150 hover:opacity-100"
                    onClick={() => toggleCollectionItem(id)}
                  >
                    &times;
                  </span>
                </span>
              );
            })}
          </div>
          <button
            className="text-[11px] text-slate-400 bg-none border border-white/15 rounded-[5px] px-3 py-1.5 cursor-pointer whitespace-nowrap transition-all duration-150 hover:text-white hover:border-white/30"
            onClick={clearCollection}
          >
            Clear all
          </button>
          <button
            className="bg-slate-800 text-white border-none px-5 py-2 text-[13px] font-bold rounded-md cursor-pointer whitespace-nowrap transition-[background] duration-150 flex items-center gap-1.5 hover:bg-slate-700"
            onClick={handleBuildSelectedReport}
          >
            Build Report &rarr;
          </button>
        </div>
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          className="fixed px-[10px] py-1.5 bg-white text-slate-500 text-[11px] font-normal leading-[1.4] rounded-md w-max max-w-[220px] pointer-events-none z-[9999] opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
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
