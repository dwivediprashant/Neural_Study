import { initI18n, i18nMiddleware } from '../i18n/config.js';

export const attachI18n = async (app) => {
  await initI18n();
  app.use(i18nMiddleware);
};
