import type { CaseRecord } from "../../data/sampleCases";
import {
  LIST_FIELDS,
  LIST_FIELDS_FINANCIAL,
  LIST_FIELDS_CONTRACT,
} from "./constants";
import {
  getDocTypeKey as getDocumentTypeKey,
  getResultTitle,
  getResultTypeLabel,
  getSourceLabel,
} from "../../data/documentUtils";

interface FieldItem {
  name: string;
  visible: boolean;
}

interface ResultListRowProps {
  id: string;
  data: CaseRecord;
  isPreviewActive: boolean;
  onPreviewSelect?: (id: string) => void;
  onAddToReport: (id: string) => void;
  addedToReport: boolean;
  collectionFull: boolean;
  customFields?: FieldItem[];
  onEditCard?: (id: string) => void;
  showEditButton?: boolean;
}

const DEFAULT_FIELDS_BY_TYPE: Record<string, string[]> = {
  "case-law": LIST_FIELDS,
  "financial-statement": LIST_FIELDS_FINANCIAL,
  contract: LIST_FIELDS_CONTRACT,
};

function getVisibleFields(docType: string, customFields?: FieldItem[]): string[] {
  if (customFields) {
    return customFields.filter((field) => field.visible).map((field) => field.name);
  }
  return DEFAULT_FIELDS_BY_TYPE[docType] || LIST_FIELDS;
}

function getValueStyle(field: string, value: string | undefined): React.CSSProperties | undefined {
  if (field === "Disposition") {
    if (value === "Dismissed") return { color: "#b91c1c", fontWeight: 600 };
    if (value === "Allowed") return { color: "#047857", fontWeight: 600 };
  }

  if (field === "Profit Or Loss" && value && value !== "—") {
    return parseFloat(String(value).replace(/,/g, "")) >= 0
      ? { color: "#047857", fontWeight: 600 }
      : { color: "#b91c1c", fontWeight: 600 };
  }

  return undefined;
}

export default function ResultListRow({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  onAddToReport,
  addedToReport,
  collectionFull,
  customFields,
  onEditCard,
  showEditButton = true,
}: ResultListRowProps) {
  const docType = getDocumentTypeKey(data);
  const hasCustomFields = customFields !== undefined;
  const visibleFields = getVisibleFields(docType, customFields);
  const defaultFields = getVisibleFields(docType);
  const metaFields = (hasCustomFields ? visibleFields : defaultFields).filter((field) => data[field]);
  const titleText = getResultTitle(data);
  const typeLabel = getResultTypeLabel(data);
  const sublineText = getSourceLabel(data);

  const rowBase = "bg-white border border-slate-200 rounded-xl px-4 py-[14px] pb-3 cursor-pointer transition-[box-shadow,border-color] duration-150";
  const rowHover = "hover:[box-shadow:inset_3px_0_0_#ca8a04,0_2px_8px_rgba(0,0,0,0.06)] hover:border-slate-300 focus-within:[box-shadow:inset_3px_0_0_#ca8a04,0_2px_8px_rgba(0,0,0,0.06)] focus-within:border-slate-300";
  const rowActive = isPreviewActive ? "border-slate-300 [box-shadow:inset_3px_0_0_#ca8a04]" : "";
  const rowSelected = addedToReport ? "border-yellow-600 [box-shadow:0_0_0_2px_rgba(202,138,4,0.15)]" : "";

  return (
    <div
      className={`${rowBase} ${rowHover} ${rowActive} ${rowSelected}`}
      onClick={() => onPreviewSelect?.(id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold text-slate-800 leading-[1.35] m-0">{titleText}</h4>
          <div className="flex items-center gap-2 flex-wrap mt-[5px]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-amber-800 text-[11px] font-semibold">{typeLabel}</span>
            <span className="text-xs text-slate-500">{sublineText}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Add button */}
          <button
            type="button"
            className={`text-[11px] font-semibold border rounded-[5px] px-[10px] py-1 cursor-pointer flex items-center gap-1 whitespace-nowrap transition-all duration-150 ${
              addedToReport
                ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:border-slate-700"
                : "text-slate-600 bg-none border-slate-200 hover:border-yellow-600 hover:bg-yellow-50"
            } disabled:opacity-35 disabled:cursor-not-allowed`}
            onClick={(event) => {
              event.stopPropagation();
              onAddToReport(id);
            }}
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
                Select for Analysis
              </>
            )}
          </button>
          {/* Open button */}
          <button
            type="button"
            className="text-[11px] text-slate-600 bg-none border border-slate-200 rounded-[5px] px-[10px] py-1 cursor-pointer flex items-center gap-1 whitespace-nowrap transition-all duration-150 hover:border-yellow-600 hover:bg-yellow-50 [&_svg]:text-yellow-600"
            onClick={(event) => event.stopPropagation()}
          >
            Open
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          {showEditButton && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-none border border-slate-200 rounded-[5px] px-[10px] py-[3px] cursor-pointer whitespace-nowrap ml-auto transition-all duration-150 hover:border-yellow-600 hover:bg-yellow-50 [&_svg]:text-yellow-600"
              onClick={(event) => {
                event.stopPropagation();
                onEditCard?.(id);
              }}
            >
              Edit Card
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          )}
        </div>
      </div>

      {metaFields.length > 0 && (
        <div className="grid gap-[10px_14px]" style={{ gridTemplateColumns: "repeat(5, minmax(120px, 1fr))" }}>
          {metaFields.map((field) => (
            <div key={field} className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">{field}</span>
              <span className="text-xs text-slate-700 leading-[1.45]" style={getValueStyle(field, data[field])}>
                {data[field]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
