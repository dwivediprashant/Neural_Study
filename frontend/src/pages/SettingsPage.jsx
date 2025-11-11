import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import styles from './SettingsPage.module.css';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

const SettingsPage = () => {
  const { status = {}, onRefresh } = useOutletContext() ?? {};
  const isOffline = status?.isOffline ?? false;
  const isSyncing = status?.loading ?? false;
  const lastSyncLabel = status?.lastSync
    ? new Date(status.lastSync).toLocaleString()
    : null;

  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const { t, i18n } = useTranslation();

  const activeLanguage = useMemo(() => {
    const raw = i18n.language || i18n.resolvedLanguage || 'en';
    return raw.split('-')[0].toLowerCase();
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleLanguageSelect = useCallback(
    (code) => {
      if (!code || code === activeLanguage) return;
      i18n.changeLanguage(code);
    },
    [i18n, activeLanguage]
  );

  return (
    <section className={styles.wrapper}>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <span
            className={`${styles.statusBadge} ${isOffline ? styles.statusOffline : styles.statusOnline}`}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            {isOffline ? t('settings.offlineBadge') : t('settings.onlineBadge')}
          </span>
          <p className={styles.statusTimestamp}>
            {t('settings.lastSync', {
              timestamp: lastSyncLabel ?? t('settings.lastSyncNever'),
            })}
          </p>
        </div>
        <button
          type="button"
          className={styles.syncButton}
          onClick={onRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? t('settings.syncing') : t('settings.syncNow')}
        </button>
      </div>

      <h2 className={styles.heading}>{t('settings.appPreferences')}</h2>
      <p className={styles.subheading}>{t('settings.configureHelp')}</p>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t('settings.sync')}</h3>
        <div className={styles.row}>
          <div>
            <p className={styles.label}>{t('settings.syncWifiOnlyLabel')}</p>
            <p className={styles.description}>{t('settings.syncWifiOnlyHint')}</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={wifiOnly} onChange={() => setWifiOnly((v) => !v)} />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.row}>
          <div>
            <p className={styles.label}>{t('settings.autoSyncLabel')}</p>
            <p className={styles.description}>{t('settings.autoSyncHint')}</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={autoSync} onChange={() => setAutoSync((v) => !v)} />
            <span className={styles.slider} />
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t('settings.languageHeading')}</h3>
        <div className={styles.languagePicker}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = activeLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                className={isActive ? styles.languageButtonActive : styles.languageButton}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span aria-hidden="true">{lang.icon ? `${lang.icon} ` : ''}</span>
                {t(lang.labelKey)}
              </button>
            );
          })}
        </div>
        <p className={styles.description}>{t('settings.moreLanguagesNote')}</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t('settings.supportHeading')}</h3>
        <p className={styles.description}>{t('settings.supportHint')}</p>
      </div>
    </section>
  );
};

export default SettingsPage;
