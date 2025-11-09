import { NavLink, Outlet } from 'react-router-dom';

import ToastStack from '../../components/ToastStack.jsx';
import styles from './TeacherLayout.module.css';

const NAV_ITEMS = [
  { to: '/teacher/upload', label: 'Upload lecture' },
  { to: '/teacher/uploads', label: 'My uploads' },
  { to: '/teacher/profile', label: 'Profile' },
];

const TeacherLayout = ({ outletContext, status, onRefresh, errorMessage }) => {
  const { currentUser, handleLogout, toasts, dismissToast } = outletContext ?? {};
  const banner = errorMessage;

  return (
    <div className={styles.shell}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <aside className={styles.sidebar}>
        <header className={styles.brand}>
          <span className={styles.brandMark}>Teach</span>
          <div>
            <p className={styles.brandEyebrow}>Teacher workspace</p>
            <h1 className={styles.brandTitle}>{currentUser?.name ?? 'Educator'}</h1>
          </div>
        </header>

        <nav className={styles.nav} aria-label="Teacher navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <footer className={styles.sidebarFooter}>
          <button type="button" className={styles.signOut} onClick={handleLogout}>
            Sign out
          </button>
          {status?.lectureCount !== undefined ? (
            <p className={styles.statusLine}>
              {status.lectureCount} upload{status.lectureCount === 1 ? '' : 's'} available
            </p>
          ) : null}
          {status?.downloadsLoading || status?.lecturesLoading ? (
            <p className={styles.statusLine}>Syncing latest data…</p>
          ) : null}
          <button type="button" className={styles.refreshButton} onClick={onRefresh}>
            Refresh data
          </button>
        </footer>
      </aside>

      <section className={styles.mainContent}>
        {banner ? <div className={styles.errorBanner}>{banner}</div> : null}
        <main className={styles.contentArea}>
          <Outlet context={{ ...outletContext, status, onRefresh }} />
        </main>
      </section>
    </div>
  );
};

export default TeacherLayout;
