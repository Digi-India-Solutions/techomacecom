'use client';

import { useState } from 'react';
import { SiteSettingsContext, useSiteSettingsStore } from '@/lib/settings/store';
import type { SiteSettings } from '@/lib/settings/types';

/**
 * Makes the settings fetched by the root layout available everywhere:
 *   • React context → useSiteSettings() (correct on the server and in the browser)
 *   • zustand mirror → getSiteSettingsSnapshot() for the cart maths
 * When an admin saves a change, the layout re-fetches (30 s cache) and passes new settings here.
 */
export default function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  // Keep the mirror in sync before children render (state set during render of this component only)
  const [mirrored, setMirrored] = useState<SiteSettings | null>(null);
  if (mirrored !== settings) {
    useSiteSettingsStore.setState({ settings });
    setMirrored(settings);
  }
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}
