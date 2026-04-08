import { useState, useCallback } from "react";

interface FieldItem {
  name: string;
  visible: boolean;
}

interface EditCardModalProps {
  fields: (string | FieldItem)[];
  allFields: string[];
  defaultFields: string[];
  onApply: (fields: FieldItem[]) => void;
  onClose: () => void;
}

export default function EditCardModal({ fields, allFields, defaultFields, onApply, onClose }: EditCardModalProps) {
  const [items, setItems] = useState<FieldItem[]>(() =>
    fields.map((f) => typeof f === "string" ? { name: f, visible: true } : f)
  );

  const visibleNames = new Set(items.map((i) => i.name));
  const unusedFields = allFields.filter((f) => !visibleNames.has(f));

  const toggle = useCallback((idx: number) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, visible: !it.visible } : it));
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setItems((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const addField = useCallback((fieldName: string) => {
    setItems((prev) => [...prev, { name: fieldName, visible: true }]);
  }, []);

  const removeField = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addAll = useCallback(() => {
    const current = new Set(items.map((i) => i.name));
    const toAdd = allFields.filter((f) => !current.has(f)).map((f) => ({ name: f, visible: true }));
    setItems((prev) => [...prev, ...toAdd]);
  }, [items, allFields]);

  const resetDefaults = useCallback(() => {
    setItems(defaultFields.map((f) => ({ name: f, visible: true })));
  }, [defaultFields]);

  const handleApply = useCallback(() => {
    onApply(items.map((i) => ({ name: i.name, visible: i.visible })));
  }, [items, onApply]);

  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]" onClick={onClose}>
      <div
        className="bg-white rounded-xl px-7 pt-6 pb-0 max-w-[460px] w-[92%] shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <h3 className="text-base font-semibold text-slate-800 m-0">Edit Custom View</h3>
          </div>
          <button className="bg-none border-none text-slate-400 cursor-pointer p-1 rounded flex items-center hover:text-slate-600 hover:bg-slate-100" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p className="text-[13px] text-slate-500 m-0 mb-4 leading-[1.5]">
          Select which custom properties to display in the search results. Drag and drop to reorder them.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-[14px] py-1.5 cursor-pointer transition-all duration-150 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800"
            onClick={addAll}
          >
            Add All Metadata
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-[14px] py-1.5 cursor-pointer transition-all duration-150 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800"
            onClick={resetDefaults}
          >
            Reset to Defaults
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>

        {/* Field list */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-0">
          {items.map((item, idx) => (
            <div
              key={item.name}
              className="flex items-center gap-2.5 px-[14px] py-[10px] border-b border-b-slate-100 transition-[background] duration-100 last:border-b-0 hover:bg-[#fafbfc] group"
            >
              <span className="cursor-grab flex items-center opacity-50 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#94a3b8"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
              </span>
              <button
                className={`bg-none border-none cursor-pointer p-0.5 flex items-center rounded hover:bg-slate-100 ${!item.visible ? "[&_svg]:opacity-50" : ""}`}
                onClick={() => toggle(idx)}
                title={item.visible ? "Hide field" : "Show field"}
              >
                {item.visible ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
              <span className={`text-[13px] font-medium flex-1 min-w-0 ${!item.visible ? "text-slate-400 line-through" : "text-slate-800"}`}>{item.name}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {idx > 0 && (
                  <button className="bg-none border-none text-slate-400 cursor-pointer p-0.5 rounded flex items-center hover:text-slate-600 hover:bg-slate-100" onClick={() => moveUp(idx)} title="Move up">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                )}
                {idx < items.length - 1 && (
                  <button className="bg-none border-none text-slate-400 cursor-pointer p-0.5 rounded flex items-center hover:text-slate-600 hover:bg-slate-100" onClick={() => moveDown(idx)} title="Move down">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                )}
                <button className="bg-none border-none text-slate-400 cursor-pointer p-0.5 rounded flex items-center hover:text-slate-600 hover:bg-slate-100" onClick={() => removeField(idx)} title="Remove field">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 py-[14px]">
          <button
            className="flex-1 px-4 py-[10px] bg-slate-800 text-white border-none rounded-lg text-[13px] font-medium cursor-pointer transition-[background] duration-150 hover:bg-slate-700"
            onClick={handleApply}
          >
            Apply Custom View (Ctrl+Enter)
          </button>
          <div className="relative">
            <button
              className="w-[38px] h-[38px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-slate-500 transition-all duration-150 hover:not-disabled:border-slate-400 hover:not-disabled:text-slate-800 disabled:opacity-40 disabled:cursor-default"
              onClick={() => setAddMenuOpen((v) => !v)}
              disabled={unusedFields.length === 0}
              title="Add a field"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            {addMenuOpen && unusedFields.length > 0 && (
              <div className="absolute bottom-11 right-0 bg-white border border-slate-200 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] max-h-[200px] overflow-y-auto min-w-[200px] z-10">
                {unusedFields.map((f) => (
                  <button
                    key={f}
                    className="block w-full text-left px-[14px] py-2 text-[13px] text-slate-600 bg-none border-none cursor-pointer border-b border-b-slate-50 last:border-b-0 hover:bg-slate-50 hover:text-slate-800"
                    onClick={() => { addField(f); setAddMenuOpen(false); }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
