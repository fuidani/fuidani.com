import type { CaseRecord } from "../../data/sampleCases";
import {
  CARD_FIELDS,
  CARD_FIELDS_FINANCIAL,
  CARD_FIELDS_CONTRACT,
  FOOTER_SECTIONS_BY_TYPE,
  FOOTER_SECTIONS_CASE,
} from "./constants";
import type { FooterSectionDef } from "./constants";
import { getDocTypeKey, getResultTitle } from "../../data/documentUtils";

interface FieldItem {
  name: string;
  visible: boolean;
}

interface ResultCardProps {
  id: string;
  data: CaseRecord;
  isPreviewActive: boolean;
  onPreviewSelect?: (id: string) => void;
  expandedFooter?: Record<string, boolean>;
  onToggleFooter: (id: string, section: string) => void;
  onAddToReport: (id: string) => void;
  addedToReport: boolean;
  collectionFull: boolean;
  customFields?: FieldItem[];
  onEditCard: (id: string) => void;
}

export default function ResultCard({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  expandedFooter,
  onToggleFooter,
  onAddToReport,
  addedToReport,
  collectionFull,
  customFields,
  onEditCard,
}: ResultCardProps) {
  const docType = getDocTypeKey(data);
  const isCase = docType === "case-law";
  const footerSections: FooterSectionDef[] | null = isCase ? null : FOOTER_SECTIONS_BY_TYPE[docType] ?? null;

  const defaultFields = docType === "financial-statement"
    ? CARD_FIELDS_FINANCIAL
    : docType === "contract"
      ? CARD_FIELDS_CONTRACT
      : CARD_FIELDS;
  const fields = customFields
    ? customFields.filter((f) => f.visible).map((f) => f.name)
    : defaultFields;

  const titleText = getResultTitle(data);
  const showSubtitle = !isCase;
  const useWideGrid = !isCase;

  const cardBase = "bg-white border border-slate-200 rounded-[10px] transition-[box-shadow,border-color] duration-150 cursor-pointer";
  const cardHover = "hover:[box-shadow:inset_3px_0_0_#ca8a04,0_2px_8px_rgba(0,0,0,0.06)] hover:border-slate-300 focus-within:[box-shadow:inset_3px_0_0_#ca8a04,0_2px_8px_rgba(0,0,0,0.06)] focus-within:border-slate-300";
  const cardActive = isPreviewActive ? "[box-shadow:inset_3px_0_0_#ca8a04] border-slate-300" : "";
  const cardSelected = addedToReport ? "border-yellow-600 [box-shadow:0_0_0_2px_rgba(202,138,4,0.15)]" : "";

  return (
    <div
      className={`${cardBase} ${cardHover} ${cardActive} ${cardSelected}`}
      onClick={() => onPreviewSelect?.(id)}
    >
      {/* Card Header */}
      <div className="px-[18px] pt-[14px] flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-slate-800 m-0 leading-[1.3] break-words">{titleText}</h4>
          {showSubtitle && (
            <span className="inline-flex items-center gap-1 text-[11px] text-yellow-600 font-medium mt-0.5">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              JibuDocs File Manager
            </span>
          )}
        </div>
        <div className="flex gap-1.5 items-center flex-shrink-0">
          {/* Add/Select button */}
          <button
            type="button"
            className={`text-[11px] font-semibold border rounded-[5px] px-[10px] py-1 cursor-pointer flex items-center gap-1 whitespace-nowrap transition-all duration-150 ${
              addedToReport
                ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:border-slate-700"
                : "text-slate-600 bg-white border-slate-200 hover:border-yellow-600 hover:bg-yellow-50"
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
        </div>
      </div>

      {/* Card Fields */}
      <div className={`grid gap-[12px_20px] px-[18px] py-3 pb-[14px] ${useWideGrid ? "grid-cols-4" : "grid-cols-3"}`}>
        {fields.map((f) => {
          const val = data[f] || "—";
          const isDisposition = f === "Disposition";
          const isProfitLoss = f === "Profit Or Loss";
          const color = isDisposition
            ? val === "Dismissed" ? "#b91c1c" : val === "Allowed" ? "#047857" : undefined
            : isProfitLoss && val !== "—"
              ? parseFloat(String(val).replace(/,/g, "")) >= 0 ? "#047857" : "#b91c1c"
              : undefined;
          return (
            <div key={f} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">{f}</span>
              <span className="text-xs text-slate-700 leading-[1.4]" style={color ? { color, fontWeight: 600 } : undefined}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Key Issue (case law only) */}
      {isCase && (
        <div className="px-[18px] pb-[10px] flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">Key Issue</span>
          <span className="text-xs text-slate-700 leading-[1.4] [display:-webkit-box] [-webkit-line-clamp:3] [line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">{data.issues || "—"}</span>
        </div>
      )}

      {/* Card Footer */}
      <div className="border-t border-slate-100 px-[18px] py-2 flex items-center gap-0 bg-[#fafbfc] rounded-b-[10px]">
        <div className="flex items-center gap-0 overflow-x-auto flex-1">
          {footerSections
            ? footerSections.map((sec) => (
                <button
                  key={sec.key}
                  className="inline-flex items-center gap-[3px] text-[11px] text-slate-400 px-[10px] py-[3px] whitespace-nowrap cursor-pointer border-none bg-none border-r border-r-slate-100 last:border-r-0 transition-[color] duration-150 hover:text-slate-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFooter(id, sec.key);
                  }}
                >
                  {sec.label} {expandedFooter?.[sec.key] ? "−" : "+"}
                </button>
              ))
            : <>
                {FOOTER_SECTIONS_CASE.map((sec) => (
                  <button
                    key={sec}
                    className="inline-flex items-center gap-[3px] text-[11px] text-slate-400 px-[10px] py-[3px] whitespace-nowrap cursor-pointer border-none bg-none border-r border-r-slate-100 last:border-r-0 transition-[color] duration-150 hover:text-slate-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFooter(id, sec);
                    }}
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)} {expandedFooter?.[sec] ? "−" : "+"}
                  </button>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-[3px] text-[11px] text-slate-400 px-[10px] py-[3px] whitespace-nowrap cursor-pointer border-none bg-none border-r border-r-slate-100 last:border-r-0 transition-[color] duration-150 hover:text-slate-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFooter(id, "statute");
                  }}
                >
                  Cited Statute +
                </button>
              </>
          }
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-none border border-slate-200 rounded-[5px] px-[10px] py-[3px] cursor-pointer whitespace-nowrap ml-auto transition-all duration-150 hover:border-yellow-600 hover:bg-yellow-50 [&_svg]:text-yellow-600"
          onClick={(event) => {
            event.stopPropagation();
            onEditCard(id);
          }}
        >
          Edit Card
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      {/* Expanded sections */}
      {footerSections
        ? footerSections.map((sec) =>
            expandedFooter?.[sec.key] && data[sec.key] ? (
              <div key={sec.key} className="px-[18px] py-2 pb-3 border-t border-slate-100">
                <h5 className="text-[11px] font-bold uppercase tracking-[0.3px] text-slate-800 m-0 mb-1">{sec.label}</h5>
                <p className="text-xs text-slate-600 leading-[1.55] m-0">{data[sec.key]}</p>
              </div>
            ) : null
          )
        : <>
            {FOOTER_SECTIONS_CASE.map((sec) =>
              expandedFooter?.[sec] && data[sec] ? (
                <div key={sec} className="px-[18px] py-2 pb-3 border-t border-slate-100">
                  <h5 className="text-[11px] font-bold uppercase tracking-[0.3px] text-slate-800 m-0 mb-1">{sec.charAt(0).toUpperCase() + sec.slice(1)}</h5>
                  <p className="text-xs text-slate-600 leading-[1.55] m-0">{data[sec]}</p>
                </div>
              ) : null
            )}
            {expandedFooter?.statute && data["Cited Statute"] && (
              <div className="px-[18px] py-2 pb-3 border-t border-slate-100">
                <h5 className="text-[11px] font-bold uppercase tracking-[0.3px] text-slate-800 m-0 mb-1">Cited Statute</h5>
                <p className="text-xs text-slate-600 leading-[1.55] m-0">{data["Cited Statute"]}</p>
              </div>
            )}
          </>
      }
    </div>
  );
}
