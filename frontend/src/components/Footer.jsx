import { useTranslation } from "react-i18next";

import styles from "./Footer.module.css";

const SOCIAL_LINKS = [
  { id: "youtube", href: "https://github.com/dwivediprashant", icon: "▶" },
  {
    id: "telegram",
    href: "https://dwivediprashant.github.io/portfolio/",
    icon: "✉",
  },
  {
    id: "linkedin",
    href: "https://dwivediprashant.github.io/portfolio/",
    icon: "in",
  },
];

const BADGE_KEYS = ["lowBandwidth", "sync"];

const LINK_GROUPS = [
  {
    id: "offline",
    links: [
      { key: "courses", href: "#courses" },
      { key: "resources", href: "#study-material" },
      { key: "sync", href: "#sync" },
    ],
  },
  {
    id: "support",
    links: [
      { key: "email", href: "mailto:support@neuralstudy.com" },
      { key: "helpline", href: "tel:+919876543210" },
      { key: "faq", href: "#faq" },
    ],
  },
  {
    id: "community",
    links: [
      { key: "updates", href: "#updates" },
      { key: "events", href: "#events" },
      { key: "volunteer", href: "#volunteer" },
    ],
  },
];

const BOTTOM_LINKS = [
  { key: "terms", href: "#terms" },
  { key: "privacy", href: "#privacy" },
  { key: "contact", href: "#contact" },
];

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} aria-label={t("footer.ariaLabel")}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <section className={styles.brandBlock}>
            <div className={styles.brandRow}>
              <img
                src="/logo.svg"
                alt={t("common.logoAlt")}
                className={styles.logo}
              />
              <div>
                <p className={styles.brandName}>{t("common.appName")}</p>
                <p className={styles.brandTagline}>
                  {t("footer.brand.tagline")}
                </p>
              </div>
            </div>

            <p className={styles.description}>
              {t("footer.brand.description")}
            </p>

            <div className={styles.badgeRow}>
              {BADGE_KEYS.map((badgeKey) => (
                <div key={badgeKey} className={styles.badge}>
                  {t(`footer.brand.badges.${badgeKey}`)}
                </div>
              ))}
            </div>

            <div className={styles.socialBlock}>
              <p className={styles.sectionTitle}>
                {t("footer.brand.social.title")}
              </p>
              <div className={styles.socialIcons}>
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    aria-label={t(`footer.brand.social.items.${link.id}`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{link.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section
            className={styles.linksGrid}
            aria-label={t("footer.links.aria")}
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.id}>
                <h6 className={styles.sectionTitle}>
                  {t(`footer.links.groups.${group.id}.title`)}
                </h6>
                <ul className={styles.linkList}>
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <a href={link.href}>
                        {t(`footer.links.groups.${group.id}.items.${link.key}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className={styles.bottomBar}>
          <small>{t("footer.bottom.copyright", { year })}</small>
          <div className={styles.bottomLinks}>
            {BOTTOM_LINKS.map((link) => (
              <a key={link.key} href={link.href}>
                {t(`footer.bottom.links.${link.key}`)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
