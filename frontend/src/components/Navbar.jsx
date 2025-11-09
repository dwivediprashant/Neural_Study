import { useEffect, useId, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import styles from "./Navbar.module.css";

const Navbar = ({ navItems, actions = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const panelId = useId();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const navItemsWithIcons = useMemo(
    () =>
      navItems?.map((item) => ({
        icon: undefined,
        ...item,
      })) ?? [],
    [navItems]
  );

  return (
    <header
      className={styles.navbar}
      role="banner"
      aria-label="Primary navigation"
    >
      <div className={styles.background} aria-hidden="true">
        <svg
          className={styles.svg}
          viewBox="0 0 1200 160"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="navbarGradient" x1="0" x2="1">
              <stop offset="0" stopColor="rgba(67, 160, 71, 0.35)" />
              <stop offset="1" stopColor="rgba(96, 165, 250, 0.35)" />
            </linearGradient>
            <filter id="navbarBlur">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <g
            stroke="url(#navbarGradient)"
            strokeWidth="1.6"
            fill="none"
            filter="url(#navbarBlur)"
          >
            <path d="M0,120 C150,60 350,160 500,100 C650,40 850,140 1200,80" />
            <path d="M0,60 C200,20 370,120 520,70 C690,10 880,110 1200,50" />
          </g>

          <g fill="#a78bfa" opacity="0.9">
            <circle cx="80" cy="110" r="4" className={styles.node} />
            <circle cx="220" cy="75" r="4" className={styles.node} />
            <circle cx="360" cy="135" r="4" className={styles.node} />
            <circle cx="520" cy="90" r="4" className={styles.node} />
            <circle cx="700" cy="45" r="4" className={styles.node} />
            <circle cx="920" cy="130" r="4" className={styles.node} />
            <circle cx="1100" cy="85" r="4" className={styles.node} />
          </g>
        </svg>
      </div>

      <div className={styles.inner}>
        <div className={styles.brandRow}>
          <Link to="/" className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              <img src="/logo.svg" alt="Neural Study logo" />
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>Neural Study</span>
              <span className={styles.brandTagline}>Offline Learning Hub</span>
            </span>
          </Link>

          <button
            type="button"
            className={`${styles.toggle} ${isOpen ? styles.toggleOpen : ""}`}
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label="Toggle navigation menu"
          >
            <span className={styles.toggleBar} />
            <span className={styles.toggleBar} />
            <span className={styles.toggleBar} />
          </button>
        </div>

        <div
          className={`${styles.collapsible} ${
            isOpen ? styles.collapsibleOpen : ""
          }`}
          id={panelId}
        >
          <nav className={styles.nav} aria-label="Primary">
            <ul className={styles.navLinks}>
              {navItemsWithIcons.map((item) => (
                <li key={item.to} className={styles.navItem}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      isActive
                        ? `${styles.navLink} ${styles.navLinkActive}`
                        : styles.navLink
                    }
                  >
                    {item.icon ? (
                      <span className={styles.icon}>{item.icon}</span>
                    ) : null}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
