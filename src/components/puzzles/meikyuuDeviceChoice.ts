import { useSyncExternalStore } from "react";

/**
 * A SMALL CHOICE KEPT ON THIS DEVICE ONLY, readable by anything that draws a Meikyuu board and writable by the one control
 * that offers it: which way up a tall maze is shown (`meikyuuWayUpStore.ts`) and whether a line drawn to the edge of a
 * zoomed board slides the view (`meikyuuEdgeStore.ts`). Both are facts about a screen and a hand, so they do not follow a
 * member to another device the way their colours do.
 *
 * Every read and write of storage is guarded: a private window and the server read the default and a choice made then
 * lives for the page. The server's snapshot is the default, so nothing a server draws differs and a stored choice arrives
 * after hydration, never as a mismatch.
 */
export function deviceChoice<T extends string>(key: string, fallback: T, parse: (word: string | null) => T | null) {
  let current: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = (): void => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const stored = parse(window.localStorage.getItem(key));
      if (stored !== null) current = stored;
    } catch {
      // Storage refused: the default.
    }
  };
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const snapshot = (): T => {
    load();
    return current;
  };
  const serverSnapshot = (): T => fallback;

  /** A choice made: drawn at once and kept on this device (the default is kept as nothing at all). */
  const choose = (next: T): void => {
    load();
    if (next === current) return;
    current = next;
    try {
      if (next === fallback) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, next);
    } catch {
      // Not kept on this device; still the page's.
    }
    for (const listener of listeners) listener();
  };

  /** The choice now. */
  const use = (): T => useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return { use, choose };
}
