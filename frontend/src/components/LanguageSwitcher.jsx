import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './LanguageSwitcher.module.css';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

const normalize = (code) => code.split('-')[0].toLowerCase();

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const activeCode = useMemo(
    () => normalize(i18n.language || i18n.resolvedLanguage || 'en'),
    [i18n.language, i18n.resolvedLanguage]
  );

  const handleChange = useCallback(
    (event) => {
      const next = event.target.value;
      if (!next || next === activeCode) return;
      i18n.changeLanguage(next);
    },
    [i18n, activeCode]
  );

  return (
    <label className={styles.switcher} aria-label={t('nav.languageLabel')}>
      <span className={styles.srOnly}>{t('nav.languageLabel')}</span>
      <select className={styles.select} value={activeCode} onChange={handleChange}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.icon ? `${language.icon} ` : ''}
            {t(language.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
