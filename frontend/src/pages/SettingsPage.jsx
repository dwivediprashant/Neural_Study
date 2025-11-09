import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const { status = {}, onRefresh } = useOutletContext() ?? {};
  const isOffline = status?.isOffline ?? false;
  const isSyncing = status?.loading ?? false;
  const lastSyncLabel = status?.lastSync
    ? new Date(status.lastSync).toLocaleString()
    : 'No sync yet';

  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [language, setLanguage] = useState('EN');

  return (
    <section className={styles.wrapper}>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <span
            className={`${styles.statusBadge} ${isOffline ? styles.statusOffline : styles.statusOnline}`}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            {isOffline ? 'Offline mode' : 'Online'}
          </span>
          <p className={styles.statusTimestamp}>Last sync: {lastSyncLabel}</p>
        </div>
        <button
          type="button"
          className={styles.syncButton}
          onClick={onRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      <h2 className={styles.heading}>App preferences</h2>
      <p className={styles.subheading}>
        Configure how the web app handles sync, downloads, and language support.
      </p>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Sync</h3>
        <div className={styles.row}>
          <div>
            <p className={styles.label}>Sync on Wi-Fi only</p>
            <p className={styles.description}>Avoid large downloads when on metered connections.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={wifiOnly} onChange={() => setWifiOnly((v) => !v)} />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.row}>
          <div>
            <p className={styles.label}>Auto-sync when online</p>
            <p className={styles.description}>Automatically upload progress and fetch updates when connected.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={autoSync} onChange={() => setAutoSync((v) => !v)} />
            <span className={styles.slider} />
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Language</h3>
        <div className={styles.languagePicker}>
          <button
            type="button"
            className={language === 'EN' ? styles.languageButtonActive : styles.languageButton}
            onClick={() => setLanguage('EN')}
          >
            English
          </button>
          <button
            type="button"
            className={language === 'HI' ? styles.languageButtonActive : styles.languageButton}
            onClick={() => setLanguage('HI')}
          >
            हिंदी
          </button>
        </div>
        <p className={styles.description}>
          More regional languages (Odia, Marathi) will be added based on demand.
        </p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Support</h3>
        <p className={styles.description}>
          Need to sideload offline content bundles or distribute updates? Contact the institute admin team for the latest download packs.
        </p>
      </div>
    </section>
  );
};

export default SettingsPage;
