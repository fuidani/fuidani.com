import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SAMPLE_CASES } from "../data/sampleCases";
import styles from "./ResultsPage.module.css";
import TopBar from "../components/TopBar";

/* ─── Constants ──────────────────────────────────────────── */

const FILTER_SECTIONS = [
  {
    key: "taxType",
    label: "Tax Type",
    options: [
      { label: "Income Tax", count: 214 },
      { label: "VAT", count: 187 },
      { label: "Customs Duty", count: 132 },
      { label: "Excise Duty", count: 98 },
      { label: "Transfer Pricing", count: 76 },
      { label: "Corporation Tax", count: 64 },
      { label: "Withholding Tax", count: 42 },
      { label: "Capital Gains", count: 34 },
    ],
    defaultOpen: true,
  },
  {
    key: "disposition",
    label: "Disposition",
    options: [
      { label: "Dismissed", count: 312 },
      { label: "Allowed", count: 289 },
      { label: "Partially Allowed", count: 146 },
      { label: "Struck Out", count: 58 },
      { label: "Withdrawn", count: 42 },
    ],
    defaultOpen: true,
  },
  {
    key: "prevailingParty",
    label: "Prevailing Party",
    options: [
      { label: "Respondent (KRA)", count: 423 },
      { label: "Appellant (Taxpayer)", count: 312 },
      { label: "Split Decision", count: 112 },
    ],
    defaultOpen: true,
  },
  {
    key: "taxIssueCategory",
    label: "Tax Issue Category",
    options: [
      { label: "Assessment Dispute", count: 198 },
      { label: "Classification Dispute", count: 156 },
      { label: "Transfer Pricing", count: 76 },
      { label: "Exemption Claim", count: 112 },
      { label: "Penalty Challenge", count: 94 },
      { label: "Refund Claim", count: 67 },
    ],
    defaultOpen: false,
  },
  {
    key: "taxpayerClassification",
    label: "Taxpayer Classification",
    options: [
      { label: "Large Taxpayer", count: 312 },
      { label: "Medium Taxpayer", count: 287 },
      { label: "Small Taxpayer", count: 156 },
      { label: "Individual", count: 92 },
    ],
    defaultOpen: false,
  },
  {
    key: "decisionYear",
    label: "Decision Year",
    options: [
      { label: "2025", count: 187 },
      { label: "2024", count: 234 },
      { label: "2023", count: 198 },
      { label: "2022", count: 156 },
      { label: "2021", count: 72 },
    ],
    defaultOpen: false,
  },
  {
    key: "disputedAmount",
    label: "Disputed Amount",
    options: [
      { label: "Over KES 1B", count: 23 },
      { label: "KES 100M – 1B", count: 87 },
      { label: "KES 10M – 100M", count: 234 },
      { label: "KES 1M – 10M", count: 312 },
      { label: "Under KES 1M", count: 191 },
    ],
    defaultOpen: false,
  },
];

const SUGGESTED_CHIPS = [
  "Customs Duty",
  "Transfer Pricing",
  "Large Taxpayer",
  "Dismissed",
  "2025 Decisions",
];

const CARD_FIELDS = [
  "Court",
  "Tax Type",
  "Decision Date",
  "Disposition",
  "Disputed Tax Amount",
  "Prevailing Party",
  "Tax Issue Category",
];

const CARD_FIELDS_FINANCIAL = [
  "Statement Type",
  "Reporting Period End Date",
  "Industry",
  "Country Or Region",
  "Revenue",
  "Profit Or Loss",
  "Auditor Opinion",
  "Is Signed",
];

const CARD_FIELDS_CONTRACT = [
  "Contract Name",
  "Contract Type",
  "Legal Area",
  "Contract Date",
  "Signing Date",
  "Expiration Date",
  "Parties",
  "Governing Law",
  "Contract Value",
  "Currency",
];

/* ─── SVG Icons (inline) ─────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

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


/* ─── Subcomponents ──────────────────────────────────────── */

function SearchRow({ query, onQueryChange, onSearch }) {
  return (
    <div className={styles.searchRow}>
      <div className={styles.searchInputWrap}>
        <span className={styles.searchInputIcon}><SearchIcon /></span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search cases..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <button className={styles.searchBtn} onClick={onSearch}>Search</button>
      <div className={styles.actionIcons}>
        <button className={styles.iconBtn} title="Save search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        </button>
        <button className={styles.iconBtn} title="Export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button className={styles.iconBtn} title="Grid view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
      </div>
    </div>
  );
}

function FilterSidebar({ collapsedSections, toggleCollapse }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>Filters</h3>
      </div>
      <div className={styles.filterList}>
        {FILTER_SECTIONS.map((sec) => {
          const open = !collapsedSections[sec.key];
          return (
            <div key={sec.key} className={styles.filterSection}>
              <button className={styles.filterHeader} onClick={() => toggleCollapse(sec.key)}>
                <span>{sec.label}</span>
                <ChevronIcon open={open} />
              </button>
              {open && (
                <div className={styles.filterBody}>
                  {sec.options.map((opt) => (
                    <label key={opt.label} className={styles.filterOption}>
                      <input type="checkbox" className={styles.filterCb} />
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
        <button className={styles.applyBtn}>Apply Filters</button>
        <button className={styles.resetBtn}>Reset</button>
      </div>
    </aside>
  );
}

const FOOTER_SECTIONS_BY_TYPE = {
  "financial-statement": [
    { key: "companyIdentifiers", label: "Company Identifiers" },
    { key: "reportingStandards", label: "Reporting Standards" },
    { key: "consolidationLevel", label: "Consolidation Level" },
    { key: "presentationCurrency", label: "Presentation Currency" },
    { key: "units", label: "Units" },
    { key: "roundingPolicy", label: "Rounding Policy" },
  ],
  contract: [
    { key: "effectiveDate", label: "Effective Date" },
    { key: "jurisdiction", label: "Jurisdiction" },
    { key: "paymentTerms", label: "Payment Terms" },
    { key: "term", label: "Term" },
    { key: "scopeOfWork", label: "Scope of Work" },
    { key: "background", label: "Background" },
    { key: "fees", label: "Fees" },
  ],
};

function ResultCard({ id, data, expandedFooter, onToggleFooter, onAddToReport, addedToReport, collectionFull }) {
  const docType = data.documentType; // "financial-statement", "contract", or undefined (case law)
  const isCase = !docType;
  const FOOTER_SECTIONS_CASE = ["background", "issues", "findings", "decision"];
  const footerSections = isCase ? null : FOOTER_SECTIONS_BY_TYPE[docType];

  const fields = docType === "financial-statement"
    ? CARD_FIELDS_FINANCIAL
    : docType === "contract"
      ? CARD_FIELDS_CONTRACT
      : CARD_FIELDS;

  const titleText = isCase
    ? `${data.caseRef}: ${data.parties.split(" VS ").join(" vs ")}`
    : data.documentTitle;
  const showSubtitle = !isCase;
  const useWideGrid = !isCase;

  return (
    <div className={`${styles.resultCard} ${addedToReport ? styles.resultCardSelected : ""}`}>
      {/* Header: title + action buttons on the right */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h4 className={styles.cardTitle}>{titleText}</h4>
          {showSubtitle && (
            <span className={styles.cardSubtitle}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              JibuDocs File Manager
            </span>
          )}
        </div>
        <div className={styles.cardHeaderActions}>
          <button
            className={`${styles.cardAddBtn} ${addedToReport ? styles.cardAddBtnActive : ""}`}
            onClick={() => onAddToReport(id)}
            disabled={!addedToReport && collectionFull}
            title={addedToReport ? "Remove from one-time export" : "Select for one-time export"}
          >
            {addedToReport ? (
              <>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Selected
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Select for Export
              </>
            )}
          </button>
          <button className={styles.cardOpenBtn}>
            Open
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* Fields grid */}
      <div className={useWideGrid ? styles.cardFieldsWide : styles.cardFields}>
        {fields.map((f) => {
          const val = data[f] || "—";
          const isDisposition = f === "Disposition";
          const isProfitLoss = f === "Profit Or Loss";
          const color = isDisposition
            ? val === "Dismissed" ? "#b91c1c" : val === "Allowed" ? "#047857" : undefined
            : isProfitLoss && val !== "—"
              ? parseFloat(val.replace(/,/g, "")) >= 0 ? "#047857" : "#b91c1c"
              : undefined;
          return (
            <div key={f} className={styles.cardField}>
              <span className={styles.fieldKey}>{f}</span>
              <span className={styles.fieldVal} style={color ? { color, fontWeight: 600 } : undefined}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Key Issue full-width row (case law only) */}
      {isCase && (
        <div className={styles.cardKeyIssue}>
          <span className={styles.fieldKey}>Key Issue</span>
          <span className={`${styles.fieldVal} ${styles.truncateVal}`}>{data.issues || "—"}</span>
        </div>
      )}

      {/* Footer with expandable section buttons + Edit Card */}
      <div className={styles.cardFooter}>
        <div className={styles.footerFields}>
          {footerSections
            ? footerSections.map((sec) => (
                <button
                  key={sec.key}
                  className={styles.footerFieldBtn}
                  onClick={() => onToggleFooter(id, sec.key)}
                >
                  {sec.label} {expandedFooter?.[sec.key] ? "−" : "+"}
                </button>
              ))
            : <>
                {FOOTER_SECTIONS_CASE.map((sec) => (
                  <button
                    key={sec}
                    className={styles.footerFieldBtn}
                    onClick={() => onToggleFooter(id, sec)}
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)} {expandedFooter?.[sec] ? "−" : "+"}
                  </button>
                ))}
                <button className={styles.footerFieldBtn} onClick={() => onToggleFooter(id, "statute")}>
                  Cited Statute +
                </button>
              </>
          }
        </div>
        <button className={styles.editCardBtn}>
          Edit Card
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      {/* Expanded content below footer */}
      {footerSections
        ? footerSections.map((sec) =>
            expandedFooter?.[sec.key] && data[sec.key] ? (
              <div key={sec.key} className={styles.expandedSection}>
                <h5 className={styles.expandedTitle}>{sec.label}</h5>
                <p className={styles.expandedText}>{data[sec.key]}</p>
              </div>
            ) : null
          )
        : <>
            {FOOTER_SECTIONS_CASE.map((sec) =>
              expandedFooter?.[sec] && data[sec] ? (
                <div key={sec} className={styles.expandedSection}>
                  <h5 className={styles.expandedTitle}>{sec.charAt(0).toUpperCase() + sec.slice(1)}</h5>
                  <p className={styles.expandedText}>{data[sec]}</p>
                </div>
              ) : null
            )}
            {expandedFooter?.statute && data["Cited Statute"] && (
              <div className={styles.expandedSection}>
                <h5 className={styles.expandedTitle}>Cited Statute</h5>
                <p className={styles.expandedText}>{data["Cited Statute"]}</p>
              </div>
            )}
          </>
      }
    </div>
  );
}

function PreviewPanel({ data }) {
  if (!data) return null;
  const docType = data.documentType;
  const title = docType ? (data.companyName || data.documentTitle) : data.parties;
  const sections = docType === "financial-statement"
    ? [
        { key: "documentTitle", label: "Document Title" },
        { key: "Statement Type", label: "Statement Type" },
        { key: "Reporting Period End Date", label: "Reporting Period" },
        { key: "Revenue", label: "Revenue" },
        { key: "Profit Or Loss", label: "Profit Or Loss" },
        { key: "Auditor Opinion", label: "Auditor Opinion" },
      ]
    : docType === "contract"
      ? [
          { key: "Contract Name", label: "Contract Name" },
          { key: "Contract Type", label: "Contract Type" },
          { key: "Legal Area", label: "Legal Area" },
          { key: "Parties", label: "Parties" },
          { key: "Contract Value", label: "Contract Value" },
          { key: "Governing Law", label: "Governing Law" },
        ]
      : [
          { key: "background", label: "Background" },
          { key: "issues", label: "Issues" },
          { key: "findings", label: "Findings" },
          { key: "decision", label: "Decision" },
        ];
  return (
    <aside className={styles.previewPanel}>
      <h3 className={styles.previewTitle}>{title}</h3>
      {sections.map((sec) =>
        data[sec.key] ? (
          <div key={sec.key} className={styles.previewSection}>
            <h4 className={styles.previewSectionTitle}>{sec.label}</h4>
            <p className={styles.previewText}>{data[sec.key]}</p>
          </div>
        ) : null
      )}
    </aside>
  );
}


/* ─── Toast ──────────────────────────────────────────────── */

function Toast({ message, visible }) {
  return (
    <div className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}>
      {message}
    </div>
  );
}

/* ─── Mixed-Type Modal ──────────────────────────────────── */

function MixedTypeModal({ typeGroups, onProceed, onCancel }) {
  if (!typeGroups) return null;

  const typeKeys = Object.keys(typeGroups);
  const typeLabel = (t) =>
    t === "case-law" ? "Case Law" : t === "financial-statement" ? "Financial Statements" : "Contracts";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className={styles.modalTitle}>Multiple document types selected</h3>
        </div>
        <p className={styles.modalDesc}>
          Reports can only contain one document type. Choose which type to include:
        </p>
        <div className={styles.modalOptions}>
          {typeKeys.map((t) => (
            <button key={t} className={styles.modalOptionBtn} onClick={() => onProceed(t)}>
              <span className={styles.modalOptionLabel}>{typeLabel(t)}</span>
              <span className={styles.modalOptionCount}>
                {typeGroups[t].length} document{typeGroups[t].length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
        <button className={styles.modalCancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Main Page Component ────────────────────────────────── */

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Filter collapse state
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const init = {};
    FILTER_SECTIONS.forEach((s) => {
      if (!s.defaultOpen) init[s.key] = true;
    });
    return init;
  });

  // Manual report collection
  const MAX_COLLECTION = 10;
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

  // Toast
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef(null);

  const casesArray = useMemo(() => Object.entries(SAMPLE_CASES), []);
  const firstCase = casesArray.length > 0 ? casesArray[0][1] : null;

  // Read q from URL
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message: msg, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const toggleCollapse = useCallback((key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
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
    const groups = buildGroupsFromIds(casesArray.map(([id]) => id));
    continueReportFlow("search", groups);
  }, [buildGroupsFromIds, casesArray, continueReportFlow]);

  const launchSelectionReport = useCallback(() => {
    if (collectionIds.size === 0) return;

    const groups = buildGroupsFromIds([...collectionIds]);
    continueReportFlow("selection", groups);
  }, [buildGroupsFromIds, collectionIds, continueReportFlow]);

  const handleSubscribeToSearch = useCallback(() => {
    launchSearchReport();
  }, [launchSearchReport]);

  const handleExportSelected = useCallback(() => {
    if (collectionIds.size === 0) return;
    launchSelectionReport();
  }, [collectionIds.size, launchSelectionReport]);

  const handleGoToReports = useCallback(() => {
    navigate("/report");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    // placeholder
  }, []);

  return (
    <div className={styles.page}>
      <TopBar activeTab="search" onReportsClick={handleGoToReports} />
      <SearchRow
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />

      <div className={styles.mainLayout}>
        <FilterSidebar
          collapsedSections={collapsedSections}
          toggleCollapse={toggleCollapse}
        />

        <main className={styles.resultsArea} style={collectionIds.size > 0 ? { paddingBottom: 70 } : undefined}>
          {/* Suggested chips */}
          <div className={styles.chipRow}>
            {SUGGESTED_CHIPS.map((c) => (
              <button key={c} className={styles.chip}>{c}</button>
            ))}
          </div>

          <div className={styles.resultCountRow}>
            <div className={styles.resultCount}>847 Results</div>
            <div className={styles.reportActionGroup}>
              <button className={styles.subscribeSearchBtn} onClick={handleSubscribeToSearch}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Subscribe to Search
              </button>
              {collectionIds.size > 0 && (
                <button className={styles.exportSelectedBtn} onClick={handleExportSelected}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Export {collectionIds.size} Selected
                </button>
              )}
            </div>
          </div>

          {casesArray.map(([id, data]) => (
            <ResultCard
              key={id}
              id={id}
              data={data}
              expandedFooter={expandedFooters[id]}
              onToggleFooter={toggleFooter}
              onAddToReport={toggleCollectionItem}
              addedToReport={collectionIds.has(id)}
              collectionFull={collectionIds.size >= MAX_COLLECTION}
            />
          ))}
        </main>

        <PreviewPanel data={firstCase} />
      </div>

      {mixedTypeChoice && (
        <MixedTypeModal
          typeGroups={mixedTypeChoice.groups}
          onProceed={proceedWithType}
          onCancel={() => setMixedTypeChoice(null)}
        />
      )}

      {collectionIds.size > 0 && (
        <div className={styles.collectorBar}>
          <div className={styles.collectorIcon}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className={styles.collectorInfo}>
            <span className={styles.collectorCount}>{collectionIds.size}/{MAX_COLLECTION} selected</span>
            <span className={styles.collectorHint}>Hand-picked documents for a one-time export</span>
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
          <button className={styles.buildReportBtn} onClick={handleExportSelected}>
            Export Selected &rarr;
          </button>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
