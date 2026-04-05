import { useState, useMemo } from "react";
import { getDocumentLabel, getCompareDocumentHeading, getComparisonRows } from "./utils";
import { SwapIcon } from "./Icons";
import CompareAIAssistant from "./CompareAIAssistant";
import styles from "../ReportPage.module.css";

/* ─── Heatmap Overview ─────────────────────────────────── */

function HeatmapOverview({
  cases,
  metadataRows,
  narrativeRows,
  differingMetadataCount,
  sharedMetadataCount,
  differingNarrativeCount,
  docLabel,
  includeInExport,
  onToggleInclude,
  onCellClick,
}) {
  const allRows = [
    ...metadataRows.map((r) => ({ ...r, group: "metadata" })),
    ...narrativeRows.map((r) => ({ ...r, group: "narrative" })),
  ];

  const getCellStatus = (row, docIndex) => {
    const val = row.values[docIndex];
    if (val === "—") return "empty";
    return row.isDifferent ? "diff" : "match";
  };

  return (
    <div className={styles.compareWorkspace}>
      <div className={styles.compareOverview}>
        <div className={styles.compareOverviewMain}>
          <div className={styles.compareEyebrow}>Compare selected documents</div>
          <div className={styles.compareTitle}>{cases.length} {docLabel} at a glance</div>
          <p className={styles.compareIntro}>
            Each cell shows whether a field matches or differs across documents. Click any cell to drill into a side-by-side comparison.
          </p>
          <div className={styles.compareOverviewActions}>
            <span
              className={`${styles.compareConfigBadge} ${
                includeInExport ? styles.compareConfigBadgeActive : styles.compareConfigBadgeInactive
              }`}
            >
              {includeInExport ? "Included in export" : "Preview only"}
            </span>
            {onToggleInclude && (
              <button className={styles.compareExportBtn} onClick={onToggleInclude}>
                {includeInExport ? "Remove from export" : "Add comparison to export"}
              </button>
            )}
          </div>
        </div>
        <div className={styles.compareStats}>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{differingMetadataCount}</span>
            <span className={styles.compareStatLabel}>metadata fields differ</span>
          </div>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{sharedMetadataCount}</span>
            <span className={styles.compareStatLabel}>metadata fields match</span>
          </div>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{differingNarrativeCount}</span>
            <span className={styles.compareStatLabel}>narrative sections differ</span>
          </div>
        </div>
      </div>

      {allRows.length > 0 ? (
        <section className={styles.comparePanel}>
          <div className={styles.comparePanelHeader}>
            <div>
              <div className={styles.comparePanelTitle}>Differences heatmap</div>
              <div className={styles.comparePanelHint}>
                Click any cell to open a detailed side-by-side comparison of two documents.
              </div>
            </div>
            <div className={styles.heatmapLegend}>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotMatch}`} /> Same
              </span>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotDiff}`} /> Differs
              </span>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotEmpty}`} /> N/A
              </span>
            </div>
          </div>

          <div className={styles.heatmapContainer}>
            <table className={styles.heatmapTable}>
              <thead>
                <tr>
                  <th className={styles.heatmapCorner}>Field</th>
                  {cases.map((doc) => {
                    const heading = getCompareDocumentHeading(doc);
                    const label = heading.eyebrow;
                    return (
                      <th key={doc.id} className={styles.heatmapDocHeader} title={`${heading.eyebrow}: ${heading.title}`}>
                        <div className={styles.heatmapDocLabel}>{label}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {metadataRows.length > 0 && (
                  <tr className={styles.heatmapGroupRow}>
                    <td colSpan={cases.length + 1} className={styles.heatmapGroupCell}>Metadata</td>
                  </tr>
                )}
                {metadataRows.map((row) => (
                  <tr key={row.id} className={styles.heatmapRow}>
                    <th scope="row" className={styles.heatmapFieldLabel}>
                      <span className={styles.heatmapFieldName}>{row.label}</span>
                      <span className={`${styles.heatmapFieldBadge} ${row.isDifferent ? styles.heatmapFieldBadgeDiff : styles.heatmapFieldBadgeSame}`}>
                        {row.isDifferent ? "Differs" : "Same"}
                      </span>
                    </th>
                    {cases.map((doc, colIdx) => {
                      const status = getCellStatus(row, colIdx);
                      return (
                        <td
                          key={`${row.id}-${doc.id}`}
                          className={styles.heatmapCell}
                          onClick={() => onCellClick(doc.id)}
                          title={`${row.label}: ${row.values[colIdx]}`}
                          aria-label={`${row.label}, ${getDocumentLabel(doc)}: ${status}`}
                        >
                          <span className={`${styles.heatmapDot} ${
                            status === "diff" ? styles.heatmapDotDiff
                              : status === "match" ? styles.heatmapDotMatch
                              : styles.heatmapDotEmpty
                          }`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {narrativeRows.length > 0 && (
                  <tr className={styles.heatmapGroupRow}>
                    <td colSpan={cases.length + 1} className={styles.heatmapGroupCell}>Narrative Sections</td>
                  </tr>
                )}
                {narrativeRows.map((row) => (
                  <tr key={row.id} className={styles.heatmapRow}>
                    <th scope="row" className={styles.heatmapFieldLabel}>
                      <span className={styles.heatmapFieldName}>{row.label}</span>
                      <span className={`${styles.heatmapFieldBadge} ${row.isDifferent ? styles.heatmapFieldBadgeDiff : styles.heatmapFieldBadgeSame}`}>
                        {row.isDifferent ? "Differs" : "Same"}
                      </span>
                    </th>
                    {cases.map((doc, colIdx) => {
                      const status = getCellStatus(row, colIdx);
                      return (
                        <td
                          key={`${row.id}-${doc.id}`}
                          className={styles.heatmapCell}
                          onClick={() => onCellClick(doc.id)}
                          title={`${row.label}: ${String(row.values[colIdx]).substring(0, 120)}${String(row.values[colIdx]).length > 120 ? "…" : ""}`}
                          aria-label={`${row.label}, ${getDocumentLabel(doc)}: ${status}`}
                        >
                          <span className={`${styles.heatmapDot} ${
                            status === "diff" ? styles.heatmapDotDiff
                              : status === "match" ? styles.heatmapDotMatch
                              : styles.heatmapDotEmpty
                          }`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className={styles.compareEmpty}>
          <div className={styles.compareEmptyTitle}>Nothing to compare yet</div>
          <p className={styles.compareEmptyText}>
            Turn on metadata fields or sections in the left panel to populate the comparison view.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Pairwise Detail ──────────────────────────────────── */

function PairwiseDetail({
  cases,
  metaFields,
  sections,
  leftDocId,
  rightDocId,
  onChangeLeft,
  onChangeRight,
  onSwap,
  onBack,
  onAddToReport = null,
}) {
  const leftDoc = cases.find((c) => c.id === leftDocId) || cases[0];
  const rightDoc = cases.find((c) => c.id === rightDocId) || cases[1];
  const pair = [leftDoc, rightDoc].filter(Boolean);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  const {
    metadataRows,
    narrativeRows,
  } = pair.length === 2 ? getComparisonRows(pair, metaFields, sections) : { metadataRows: [], narrativeRows: [] };

  const differCount = metadataRows.filter((r) => r.isDifferent).length;

  return (
    <div className={styles.compareWorkspace}>
      <div className={styles.pairwiseHeader}>
        <button className={styles.pairwiseBackBtn} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          Heatmap overview
        </button>
        <div className={styles.pairwisePickerRow}>
          <select
            className={styles.pairwisePicker}
            value={leftDoc?.id || ""}
            onChange={(e) => onChangeLeft(e.target.value)}
          >
            {cases.map((doc) => (
              <option key={doc.id} value={doc.id} disabled={doc.id === rightDoc?.id}>
                {getDocumentLabel(doc)}
              </option>
            ))}
          </select>
          <button className={styles.pairwiseSwapBtn} onClick={onSwap} title="Swap documents">
            <SwapIcon />
          </button>
          <select
            className={styles.pairwisePicker}
            value={rightDoc?.id || ""}
            onChange={(e) => onChangeRight(e.target.value)}
          >
            {cases.map((doc) => (
              <option key={doc.id} value={doc.id} disabled={doc.id === leftDoc?.id}>
                {getDocumentLabel(doc)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pair.length === 2 && narrativeRows.length > 0 && (
        <CompareAIAssistant
          leftDoc={leftDoc}
          rightDoc={rightDoc}
          narrativeRows={narrativeRows}
          onAddToReport={onAddToReport}
        />
      )}

      {metadataRows.length > 0 && (
        <section className={styles.comparePanel}>
          <button
            className={styles.comparePanelHeaderToggle}
            onClick={() => setMetadataExpanded((v) => !v)}
            aria-expanded={metadataExpanded}
          >
            <div>
              <div className={styles.comparePanelTitle}>
                Metadata comparison
                <span className={styles.metadataBadge}>
                  {differCount} differ{differCount !== 1 ? "" : "s"} &middot; {metadataRows.length} fields
                </span>
              </div>
              <div className={styles.comparePanelHint}>
                Side-by-side view of the two selected documents.
              </div>
            </div>
            <svg
              className={`${styles.collapseChevron} ${metadataExpanded ? styles.collapseChevronOpen : ""}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {metadataExpanded && (
            <div className={styles.compareMatrix}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.compareCorner}>Field</th>
                    {pair.map((doc) => {
                      const heading = getCompareDocumentHeading(doc);
                      return (
                        <th key={doc.id} className={styles.compareDocHeader}>
                          <div className={styles.compareDocEyebrow}>{heading.eyebrow}</div>
                          <div className={styles.compareDocTitle}>{heading.title}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {metadataRows.map((row) => (
                    <tr key={row.id} className={row.isDifferent ? styles.compareDiffRow : ""}>
                      <th scope="row" className={styles.compareFieldLabel}>
                        <div className={styles.compareFieldName}>{row.label}</div>
                        <span
                          className={`${styles.compareFieldState} ${
                            row.isDifferent ? styles.compareFieldStateDiff : styles.compareFieldStateSame
                          }`}
                        >
                          {row.isDifferent ? "Differs" : "Same"}
                        </span>
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.id}-${pair[index].id}`}
                          className={`${styles.compareCell} ${
                            row.isDifferent ? styles.compareCellDiff : styles.compareCellSame
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {metadataRows.length === 0 && narrativeRows.length === 0 && (
        <div className={styles.compareEmpty}>
          <div className={styles.compareEmptyTitle}>Nothing to compare yet</div>
          <p className={styles.compareEmptyText}>
            Turn on metadata fields or sections in the left panel to populate the comparison view.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Comparison Matrix ───────────────────────────── */

export default function ComparisonMatrix({
  cases,
  metaFields,
  sections,
  docTypeLabel,
  includeInExport = false,
  onToggleInclude = null,
  onAddToReport = null,
}) {
  const [compareView, setCompareView] = useState("pairwise");
  const [leftDocId, setLeftDocId] = useState(cases[0]?.id || null);
  const [rightDocId, setRightDocId] = useState(cases[1]?.id || null);

  const caseIds = useMemo(() => new Set(cases.map((c) => c.id)), [cases]);
  const safeLeftId = caseIds.has(leftDocId) ? leftDocId : cases[0]?.id || null;
  const safeRightId = caseIds.has(rightDocId) && rightDocId !== safeLeftId ? rightDocId : cases.find((c) => c.id !== safeLeftId)?.id || null;

  if (cases.length < 2) {
    return (
      <div className={styles.compareEmpty}>
        <div className={styles.compareEmptyTitle}>Compare Documents</div>
        <p className={styles.compareEmptyText}>Select at least 2 documents to compare.</p>
      </div>
    );
  }

  const {
    metadataRows,
    narrativeRows,
    differingMetadataCount,
    sharedMetadataCount,
    differingNarrativeCount,
  } = getComparisonRows(cases, metaFields, sections);
  const docLabel = `${docTypeLabel} document${cases.length !== 1 ? "s" : ""}`;

  const handleCellClick = (docId) => {
    const newRight = docId;
    const newLeft = safeLeftId === docId ? cases.find((c) => c.id !== docId)?.id || null : safeLeftId;
    setLeftDocId(newLeft);
    setRightDocId(newRight);
    setCompareView("pairwise");
  };

  const handleSwap = () => {
    setLeftDocId(safeRightId);
    setRightDocId(safeLeftId);
  };

  if (compareView === "pairwise") {
    return (
      <PairwiseDetail
        cases={cases}
        metaFields={metaFields}
        sections={sections}
        leftDocId={safeLeftId}
        rightDocId={safeRightId}
        onChangeLeft={setLeftDocId}
        onChangeRight={setRightDocId}
        onSwap={handleSwap}
        onBack={() => setCompareView("overview")}
        onAddToReport={onAddToReport}
      />
    );
  }

  return (
    <HeatmapOverview
      cases={cases}
      metadataRows={metadataRows}
      narrativeRows={narrativeRows}
      differingMetadataCount={differingMetadataCount}
      sharedMetadataCount={sharedMetadataCount}
      differingNarrativeCount={differingNarrativeCount}
      docLabel={docLabel}
      includeInExport={includeInExport}
      onToggleInclude={onToggleInclude}
      onCellClick={handleCellClick}
    />
  );
}
