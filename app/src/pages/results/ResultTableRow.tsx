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

  const rowBase = "relative flex items-stretch border-b border-b-[#f5f5f5] bg-white cursor-pointer last:border-b-0 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-transparent";
  const rowActive = isPreviewActive
    ? "bg-slate-50 before:!bg-yellow-600"
    : addedToReport
      ? ""
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
          className="group w-6 h-6 p-0 border-none bg-transparent appearance-none inline-flex items-center justify-center flex-none shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          onClick={(event) => {
            event.stopPropagation();
            onAddToReport(id);
          }}
          disabled={!addedToReport && collectionFull}
          aria-label={addedToReport ? "Remove from report" : "Add to report"}
          title={addedToReport ? "Remove from report" : "Add to report"}
        >
          <span
            className={`w-[18px] h-[18px] box-border inline-flex items-center justify-center border transition-[color,background,border-color] duration-150 ${
              addedToReport
                ? "border-slate-700 bg-slate-800 text-white group-hover:border-slate-900 group-hover:bg-slate-900"
                : "border-slate-300 bg-white text-transparent group-hover:border-slate-500"
            }`}
            style={{ borderRadius: 0 }}
          >
            {addedToReport ? (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="0"/></svg>
            )}
          </span>
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
