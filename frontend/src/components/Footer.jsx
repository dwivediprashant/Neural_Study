import styles from "./Footer.module.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} aria-labelledby="footerHeading">
      <div className={styles.container}>
        <div className={styles.topRow}>
          <section className={styles.brandBlock}>
            <div className={styles.brandRow}>
              <img src="/logo.svg" alt="Neural Study logo" className={styles.logo} />
              <div>
                <p className={styles.brandName}>Neural Study</p>
                <p className={styles.brandTagline}>Offline learning, always within reach</p>
              </div>
            </div>

            <p className={styles.description}>
              Download modules once, learn anywhere. Neural Study keeps lessons, quizzes, and progress available even when connectivity drops.
            </p>

            <div className={styles.badgeRow}>
              <div className={styles.badge}>Low bandwidth ready</div>
              <div className={styles.badge}>Sync on return online</div>
            </div>

            <div className={styles.socialBlock}>
              <p className={styles.sectionTitle}>Stay updated</p>
              <div className={styles.socialIcons}>
                <a href="https://www.youtube.com/" aria-label="YouTube" target="_blank" rel="noreferrer">
                  <span>▶</span>
                </a>
                <a href="https://t.me/" aria-label="Telegram" target="_blank" rel="noreferrer">
                  <span>✉</span>
                </a>
                <a href="https://www.linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
                  <span>in</span>
                </a>
              </div>
            </div>
          </section>

          <section className={styles.linksGrid} aria-label="Helpful links">
            <div>
              <h6 className={styles.sectionTitle}>Offline essentials</h6>
              <ul className={styles.linkList}>
                <li><a href="#courses">Download courses</a></li>
                <li><a href="#study-material">Saved resources</a></li>
                <li><a href="#sync">Sync preferences</a></li>
              </ul>
            </div>
            <div>
              <h6 className={styles.sectionTitle}>Support</h6>
              <ul className={styles.linkList}>
                <li><a href="mailto:support@neuralstudy.com">Email support</a></li>
                <li><a href="tel:+919876543210">Community helpline</a></li>
                <li><a href="#faq">Offline FAQ</a></li>
              </ul>
            </div>
            <div>
              <h6 className={styles.sectionTitle}>Community</h6>
              <ul className={styles.linkList}>
                <li><a href="#updates">Release notes</a></li>
                <li><a href="#events">Local meetups</a></li>
                <li><a href="#volunteer">Volunteer mentors</a></li>
              </ul>
            </div>
          </section>
        </div>

        <div className={styles.bottomBar}>
          <small>© {year} Neural Study. Offline-first education for all.</small>
          <div className={styles.bottomLinks}>
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
