import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/Light_Logo_JibuDocs_Icon.png";
import styles from "./TopBar.module.css";

export default function TopBar({ activeTab, onReportsClick }) {
  const navigate = useNavigate();

  const handleReportsClick = () => {
    if (onReportsClick) {
      onReportsClick();
    } else {
      navigate("/report");
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <img src={logoIcon} alt="JibuDocs" width="28" height="28" />
        <span className={styles.logoText}>JibuDocs</span>
        <nav className={styles.topTabs}>
          <button
            className={`${styles.topTab} ${activeTab === "search" ? styles.topTabActive : ""}`}
            onClick={() => navigate("/")}
          >
            Doc Search
          </button>
          <button
            className={`${styles.topTab} ${activeTab === "files" ? styles.topTabActive : ""}`}
          >
            File Browser
          </button>
          <button
            className={`${styles.topTab} ${activeTab === "reports" ? styles.topTabActive : ""}`}
            onClick={handleReportsClick}
          >
            Reports
          </button>
        </nav>
      </div>
      <div className={styles.topBarRight}>
        <span className={styles.userEmail}>dpisani@637capital.com</span>
        <div className={styles.avatar}>DP</div>
      </div>
    </header>
  );
}
