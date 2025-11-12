import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ToastStack from "../../components/ToastStack.jsx";
import CenteredLoader from "../../components/CenteredLoader.jsx";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";
import styles from "./TeacherLayout.module.css";

const NAV_ITEMS = [
  { to: "/teacher/upload", key: "teacher.nav.upload" },
  { to: "/teacher/uploads", key: "teacher.nav.uploads" },
  { to: "/teacher/doubts", key: "teacher.nav.doubts" },
  { to: "/teacher/profile", key: "teacher.nav.profile" },
];

const TeacherLayout = ({ outletContext, status, onRefresh, errorMessage }) => {
  const { currentUser, handleLogout, toasts, dismissToast } =
    outletContext ?? {};
  const banner = errorMessage;
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  const handleToggleMenu = () => setIsNavOpen((prev) => !prev);

  const showLoader = Boolean(
    status?.loading || status?.downloadsLoading || status?.lecturesLoading
  );

  return (
    <div className={styles.shell}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {showLoader ? <CenteredLoader /> : null}

      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandMark}>{t("teacher.layout.brandMark")}</span>
          <div className={styles.brandCopy}>
            <p className={styles.brandEyebrow}>{t("teacher.layout.eyebrow")}</p>
            <h1 className={styles.brandTitle}>
              {currentUser?.name ?? t("teacher.layout.fallbackName")}
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
            {isNavOpen ? t("teacher.layout.closeMenu") : t("teacher.layout.openMenu")}
          </span>
        </button>

        <div
          className={`${styles.topbarCluster} ${
            isNavOpen ? styles.topbarClusterOpen : ""
          }`}
          id="teacher-topbar-cluster"
        >
          <nav
            className={styles.nav}
            aria-label={t("teacher.layout.navAria")}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className={styles.topbarActions}>
            <LanguageSwitcher />
            <button
              type="button"
              className={styles.refreshButton}
              onClick={onRefresh}
            >
              {t("teacher.layout.refresh")}
            </button>
            <button
              type="button"
              className={styles.signOut}
              onClick={handleLogout}
            >
              {t("teacher.layout.signOut")}
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
