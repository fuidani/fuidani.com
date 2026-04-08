import type { CaseRecord } from "../../data/sampleCases";
import {
  getDocTypeKey,
  getPrimaryDateText,
  getResultTitle,
  getResultTypeLabel,
  getSourceLabel,
} from "../../data/documentUtils";

interface ResultTableRowProps {
  id: string;
  data: CaseRecord;
  isPreviewActive: boolean;
  onPreviewSelect?: (id: string) => void;
  onAddToReport: (id: string) => void;
  addedToReport: boolean;
  collectionFull: boolean;
}

export default function ResultTableRow({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  onAddToReport,
  addedToReport,
  collectionFull,
}: ResultTableRowProps) {
  const docType = getDocTypeKey(data);
  const titleText = getResultTitle(data);
  const typeLabel = getResultTypeLabel(data);
  const sourceText = docType === "case-law" ? "Kenya Law" : getSourceLabel(data);
  const dateText = getPrimaryDateText(data);

  const rowBase = "relative flex items-stretch border-b border-b-[#f5f5f5] bg-white cursor-pointer transition-[background] duration-150 last:border-b-0 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-transparent before:transition-[background] before:duration-150";
  const rowActive = isPreviewActive
    ? "bg-slate-50 before:!bg-yellow-600"
    : "hover:bg-slate-50 focus-within:bg-slate-50";
  const rowSelected = addedToReport ? "bg-yellow-50 before:!bg-yellow-600" : "";

  return (
    <div
      className={`${rowBase} ${rowActive} ${rowSelected}`}
      style={{ display: "grid", gridTemplateColumns: "var(--result-table-columns)" }}
      onClick={() => onPreviewSelect?.(id)}
    >
      {/* Select cell */}
      <div className="min-w-0 px-3 py-[13px] flex items-center justify-center">
        <button
          type="button"
          className={`w-6 h-6 rounded border-none cursor-pointer p-0 inline-flex items-center justify-center transition-[color,background] duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
            addedToReport
              ? "bg-yellow-600 text-white rounded-[5px] hover:bg-yellow-700"
              : "bg-transparent text-slate-300 hover:text-yellow-600"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onAddToReport(id);
          }}
          disabled={!addedToReport && collectionFull}
          aria-label={addedToReport ? "Remove from report" : "Add to report"}
          title={addedToReport ? "Remove from report" : "Add to report"}
        >
          {addedToReport ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
          )}
        </button>
      </div>

      {/* Document cell */}
      <div className="min-w-0 px-3 py-[13px] flex flex-col items-start justify-center">
        <span className="w-full text-[13px] font-semibold text-slate-800 leading-[1.35] whitespace-nowrap overflow-hidden text-ellipsis">{titleText}</span>
      </div>

      {/* Type cell */}
      <div className="min-w-0 px-3 py-[13px] flex items-center">
        <span className="text-xs font-semibold text-slate-600 leading-[1.35]">{typeLabel}</span>
      </div>

      {/* Source cell */}
      <div className="min-w-0 px-3 py-[13px] flex items-center">
        <span className="text-xs text-slate-500 leading-[1.4]">{sourceText}</span>
      </div>

      {/* Date cell */}
      <div className="min-w-0 px-3 py-[13px] flex items-center">
        <span className="text-xs text-slate-700 leading-[1.4]">{dateText}</span>
      </div>

      {/* Actions cell */}
      <div className="min-w-0 px-3 py-[13px] flex items-center justify-center">
        <button
          type="button"
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 inline-flex items-center justify-center cursor-pointer transition-[border-color,background,color] duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-amber-800"
          onClick={(event) => event.stopPropagation()}
          aria-label="Open result"
          title="Open"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>
      </div>
    </div>
  );
}
