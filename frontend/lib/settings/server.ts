import { BACKEND_URL } from '@/lib/api/backend';
import { DEFAULT_SITE_SETTINGS } from './defaults';
import type { SiteSettings } from './types';

/**
 * Store settings for server components (root layout, metadata).
 * Cached by Next for 30 s, so an admin change is live on the website within ~30 seconds.
 * If the API is down the site keeps working with the defaults.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${BACKEND_URL}/settings/public`, { next: { revalidate: 30, tags: ['site-settings'] } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { success: boolean; data?: SiteSettings };
    if (!body.success || !body.data) throw new Error('Bad response');
    return body.data;
  } catch (error) {
    console.warn('[settings] using defaults —', (error as Error).message);
    return DEFAULT_SITE_SETTINGS;
  }
}
