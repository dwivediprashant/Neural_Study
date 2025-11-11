import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@locales/en/translation.json';
import hi from '@locales/hi/translation.json';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'common.english', icon: '🇺🇸' },
  { code: 'hi', labelKey: 'common.hindi', icon: '🇮🇳' },
];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.code),
      defaultNS: 'translation',
      detection: {
        order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'neuralstudy_language',
      },
      interpolation: {
        escapeValue: false,
      },
      returnEmptyString: false,
    });

  const updateDocumentLanguage = (lng) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  };

  updateDocumentLanguage(i18n.language);
  i18n.on('languageChanged', (lng) => {
    try {
      localStorage.setItem('neuralstudy_language', lng);
    } catch (error) {
      console.warn('Unable to persist language selection', error);
    }
    updateDocumentLanguage(lng);
  });
}

export default i18n;
