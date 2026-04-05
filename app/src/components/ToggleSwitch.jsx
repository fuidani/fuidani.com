import styles from "../pages/ReportPage.module.css";

export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <label className={styles.toggleSwitch} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={styles.slider} />
    </label>
  );
}
