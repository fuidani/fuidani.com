interface TypeGroup {
  id: string;
  label: string;
}

interface MixedTypeModalProps {
  typeGroups: Record<string, TypeGroup[]>;
  onProceed: (type: string) => void;
  onCancel: () => void;
}

const typeLabel = (t: string): string =>
  t === "case-law" ? "Case Law" : t === "financial-statement" ? "Financial Statements" : "Contracts";

export default function MixedTypeModal({ typeGroups, onProceed, onCancel }: MixedTypeModalProps) {
  if (!typeGroups) return null;

  const typeKeys = Object.keys(typeGroups);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-xl px-8 py-7 max-w-[420px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2.5 mb-3">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-base font-semibold text-slate-800 m-0">Multiple document types selected</h3>
        </div>
        <p className="text-[13px] text-slate-500 m-0 mb-5 leading-[1.5]">
          Reports can only contain one document type. Choose which type to include:
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {typeKeys.map((t) => (
            <button
              key={t}
              className="flex items-center justify-between px-4 py-3 border-[1.5px] border-slate-200 rounded-lg bg-slate-50 cursor-pointer transition-all duration-150 hover:border-yellow-600 hover:bg-yellow-50"
              onClick={() => onProceed(t)}
            >
              <span className="text-[14px] font-semibold text-slate-800">{typeLabel(t)}</span>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-[10px]">
                {typeGroups[t].length} document{typeGroups[t].length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
        <button
          className="w-full py-2 border-none bg-none text-[13px] text-slate-500 cursor-pointer rounded-md hover:bg-slate-100 hover:text-slate-800"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
