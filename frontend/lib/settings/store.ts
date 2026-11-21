'use client';

import { createContext, useContext } from 'react';
import { create } from 'zustand';
import { DEFAULT_SITE_SETTINGS } from './defaults';
import type { SiteSettings } from './types';

/**
 * Store settings on the client.
 *
 * Components read them with useSiteSettings(), which uses React context so the
 * server-rendered HTML already contains the admin's values (a zustand hook would
 * render its initial defaults on the server and only switch after hydration).
 *
 * A plain zustand store mirrors the same object for non-React code — e.g. the cart
 * store's shipping / GST maths — via getSiteSettingsSnapshot().
 */
export const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const useSiteSettingsStore = create<{ settings: SiteSettings }>(() => ({ settings: DEFAULT_SITE_SETTINGS }));

export const getSiteSettingsSnapshot = () => useSiteSettingsStore.getState().settings;
