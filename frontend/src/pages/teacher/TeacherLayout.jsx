import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import ToastStack from "../../components/ToastStack.jsx";
import styles from "./TeacherLayout.module.css";

const NAV_ITEMS = [
  { to: "/teacher/upload", label: "Upload lecture" },
  { to: "/teacher/uploads", label: "My uploads" },
  { to: "/teacher/profile", label: "Profile" },
];

const TeacherLayout = ({ outletContext, status, onRefresh, errorMessage }) => {
  const { currentUser, handleLogout, toasts, dismissToast } =
    outletContext ?? {};
  const banner = errorMessage;
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  const handleToggleMenu = () => setIsNavOpen((prev) => !prev);

  return (
    <div className={styles.shell}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandMark}>Teach</span>
          <div className={styles.brandCopy}>
            <p className={styles.brandEyebrow}>Teacher workspace</p>
            <h1 className={styles.brandTitle}>
              {currentUser?.name ?? "Educator"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.menuToggle} ${
            isNavOpen ? styles.menuToggleActive : ""
          }`}
          onClick={handleToggleMenu}
          aria-expanded={isNavOpen}
          aria-controls="teacher-topbar-cluster"
        >
          <span className={styles.menuToggleIcon} aria-hidden="true" />
          <span className={styles.srOnly}>
            {isNavOpen ? "Close menu" : "Open menu"}
          </span>
        </button>

        <div
          className={`${styles.topbarCluster} ${
            isNavOpen ? styles.topbarClusterOpen : ""
          }`}
          id="teacher-topbar-cluster"
        >
          <nav className={styles.nav} aria-label="Teacher navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={onRefresh}
            >
              Refresh data
            </button>
            <button
              type="button"
              className={styles.signOut}
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {banner ? <div className={styles.errorBanner}>{banner}</div> : null}

      <main className={styles.contentArea}>
        <Outlet context={{ ...outletContext, status, onRefresh }} />
      </main>
    </div>
  );
};

export default TeacherLayout;
