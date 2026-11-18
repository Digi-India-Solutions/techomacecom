import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` on the server and during the first (hydration) render, `true` afterwards.
 *
 * The cart / wishlist / user stores are persisted to localStorage, which the server
 * can't read. Render a skeleton until this is `true` so the server HTML and the first
 * client render match (no hydration errors, no "empty cart" flash).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
