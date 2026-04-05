import { useState, useCallback } from "react";
import styles from "../ResultsPage.module.css";

export default function EditCardModal({ fields, allFields, defaultFields, onApply, onClose }) {
  // Each item: { name, visible }
  const [items, setItems] = useState(() =>
    fields.map((f) => typeof f === "string" ? { name: f, visible: true } : f)
  );

  const visibleNames = new Set(items.map((i) => i.name));
  const unusedFields = allFields.filter((f) => !visibleNames.has(f));

  const toggle = useCallback((idx) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, visible: !it.visible } : it));
  }, []);

  const moveUp = useCallback((idx) => {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx) => {
    setItems((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const addField = useCallback((fieldName) => {
    setItems((prev) => [...prev, { name: fieldName, visible: true }]);
  }, []);

  const removeField = useCallback((idx) => {
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.ecmBox} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.ecmHeader}>
          <div className={styles.ecmHeaderLeft}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <h3 className={styles.ecmTitle}>Edit Custom View</h3>
          </div>
          <button className={styles.ecmCloseBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p className={styles.ecmDesc}>
          Select which custom properties to display in the search results. Drag and drop to reorder them.
        </p>

        {/* Action buttons */}
        <div className={styles.ecmActions}>
          <button className={styles.ecmActionBtn} onClick={addAll}>
            Add All Metadata
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button className={styles.ecmActionBtn} onClick={resetDefaults}>
            Reset to Defaults
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>

        {/* Field list */}
        <div className={styles.ecmList}>
          {items.map((item, idx) => (
            <div key={item.name} className={styles.ecmRow}>
              <span className={styles.ecmDragHandle}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#94a3b8"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
              </span>
              <button
                className={`${styles.ecmVisBtn} ${!item.visible ? styles.ecmVisBtnOff : ""}`}
                onClick={() => toggle(idx)}
                title={item.visible ? "Hide field" : "Show field"}
              >
                {item.visible ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
              <span className={`${styles.ecmFieldName} ${!item.visible ? styles.ecmFieldNameOff : ""}`}>{item.name}</span>
              <div className={styles.ecmArrows}>
                {idx > 0 && (
                  <button className={styles.ecmArrowBtn} onClick={() => moveUp(idx)} title="Move up">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                )}
                {idx < items.length - 1 && (
                  <button className={styles.ecmArrowBtn} onClick={() => moveDown(idx)} title="Move down">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                )}
                <button className={styles.ecmArrowBtn} onClick={() => removeField(idx)} title="Remove field">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.ecmFooter}>
          <button className={styles.ecmApplyBtn} onClick={handleApply}>
            Apply Custom View (Ctrl+Enter)
          </button>
          <div className={styles.ecmAddWrap}>
            <button
              className={styles.ecmAddBtn}
              onClick={() => setAddMenuOpen((v) => !v)}
              disabled={unusedFields.length === 0}
              title="Add a field"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            {addMenuOpen && unusedFields.length > 0 && (
              <div className={styles.ecmAddMenu}>
                {unusedFields.map((f) => (
                  <button
                    key={f}
                    className={styles.ecmAddMenuItem}
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
