/**
 * Picks the right URLs for the current environment from ONE env file (frontend/.env):
 *
 *   NEXT_PUBLIC_BACKEND_API_URL_LOCAL=http://localhost:5001/api/v1
 *   NEXT_PUBLIC_BACKEND_API_URL_PRODUCTION=https://api.buydenmed.com/api/v1
 *
 * `npm run dev` (NODE_ENV=development) → *_LOCAL
 * `npm run build` / `npm start` (NODE_ENV=production) → *_PRODUCTION
 * Optional: NEXT_PUBLIC_BACKEND_API_URL overrides both (e.g. testing a staging API).
 *
 * The variables are written out literally so Next.js can inline them into the browser bundle.
 */

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const trim = (url?: string) => (url || '').trim().replace(/\/+$/, '');

const LOCAL_API = trim(process.env.NEXT_PUBLIC_BACKEND_API_URL_LOCAL) || 'http://localhost:5001/api/v1';
const RAW_PROD = trim(process.env.NEXT_PUBLIC_BACKEND_API_URL_PRODUCTION);
const OVERRIDE_API = trim(process.env.NEXT_PUBLIC_BACKEND_API_URL);

// Enforce https on production api.buydenmed.com URL to prevent Mixed Content blocking
const PRODUCTION_API = RAW_PROD
  ? (RAW_PROD.startsWith('http://api.buydenmed.com') ? RAW_PROD.replace('http://', 'https://') : RAW_PROD)
  : 'https://api.buydenmed.com/api/v1';

if (IS_PRODUCTION && !OVERRIDE_API && !PRODUCTION_API) {
  throw new Error('Set NEXT_PUBLIC_BACKEND_API_URL_PRODUCTION in frontend/.env before building for production.');
}

const baseRaw = OVERRIDE_API || (IS_PRODUCTION ? PRODUCTION_API : LOCAL_API);

export function getResolvedBackendUrl(): string {
  let url = baseRaw;
  // If the browser page was loaded over HTTPS, never allow insecure HTTP API calls (except localhost)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = url.replace('http://', 'https://');
    }
  }
  return url;
}

/** Express API base, e.g. https://api.buydenmed.com/api/v1 */
export const BACKEND_API_URL = baseRaw.startsWith('http://api.buydenmed.com')
  ? baseRaw.replace('http://', 'https://')
  : baseRaw;
