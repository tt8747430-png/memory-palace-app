/**
 * Application version — single source of truth.
 *
 * Keep in sync with package.json `version` and sw.js `APP_VERSION`.
 * Displayed in the Statistics modal and used to derive CACHE_NAME
 * in the service worker.
 *
 * Guide §V (Build/Release/Run): Every release gets a unique ID.
 *
 * @type {string}
 */
export const APP_VERSION = '1.0.1';
