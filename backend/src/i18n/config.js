import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, '../../locales');

export const availableLanguages = ['en', 'hi'];
export const defaultLanguage = 'en';

export const initI18n = async () => {
  if (i18next.isInitialized) {
    return i18next;
  }

  await i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: defaultLanguage,
      supportedLngs: availableLanguages,
      backend: {
        loadPath: path.join(localesDir, '{{lng}}/translation.json'),
      },
      detection: {
        order: ['path', 'cookie', 'header', 'querystring'],
        caches: ['cookie'],
        lookupCookie: 'neuralstudy_language',
        cookieSecure: false,
      },
      interpolation: {
        escapeValue: false,
      },
      returnEmptyString: false,
      preload: availableLanguages,
    });

  return i18next;
};

export const i18nMiddleware = middleware.handle(i18next, {
  removeLngFromUrl: false,
});
