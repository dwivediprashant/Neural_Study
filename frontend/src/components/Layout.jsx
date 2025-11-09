import { Outlet } from 'react-router-dom';

import Navbar from './Navbar';
import Footer from './Footer';
import ToastStack from './ToastStack';
import styles from './Layout.module.css';

const Layout = ({ status, onRefresh, outletContext, errorMessage }) => {
  const { error, toasts, dismissToast, currentUser, handleLogout } = outletContext ?? {};
  const banner = errorMessage || error;

  const profileIcon = (
    <svg
      className={styles.navProfileIcon}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Profile"
    >
      <defs>
        <linearGradient id="navProfileGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#navProfileGradient)" />
      <path
        d="M12 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 7.5c3.866 0 7 1.956 7 4.372V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-0.628C5 15.956 8.134 14 12 14Z"
        fill="#f8fafc"
      />
    </svg>
  );

  return (
    <div className={styles.appShell}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <Navbar
        navItems={[
          { to: '/', label: 'Home' },
          { to: '/courses', label: 'Explore courses' },
          { to: '/tests', label: 'Tests' },
          { to: '/downloads', label: 'Downloads' },
          { to: '/settings', label: 'Settings' },
          { to: '/profile', label: 'Profile', icon: profileIcon },
        ].filter((item) => currentUser?.role === 'student')}
        actions={
          currentUser ? (
            <button type="button" className={styles.signOut} onClick={handleLogout}>
              Sign out
            </button>
          ) : null
        }
      />

      {banner ? <div className={styles.errorBanner}>{banner}</div> : null}

      <main className={styles.content}>
        <Outlet context={{ ...outletContext, status, onRefresh }} />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
