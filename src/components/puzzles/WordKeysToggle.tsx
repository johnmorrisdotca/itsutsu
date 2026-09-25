"use client";

import { useCallback, useEffect, useState } from "react";

/** Where this device's answer is kept: a phone and a laptop answer differently, so it is the browser's, not the account's. */
const KEPT = "itsutsu.wordKeys";

/**
 * WHETHER THE LETTER KEYS UNDER A WORDDROP GRID ARE SHOWN. John, 2026-09-25:
 * "allow user to toggle the keyboard… Mention you can use your computer
 * keyboard. default ON for mobile, off for computer."
 *
 * Until the player says, the device decides, in CSS: shown where the pointer
 * is a finger (`pointer-coarse`), hidden where it is a mouse. So the page is
 * drawn right the first time on both, with nothing moving once it hydrates.
 * A press says otherwise and is kept in this browser (a per-device answer,
 * which is what the default is too); a browser that keeps nothing asks again.
 *
 * `shown` is null while the device decides.
 */
export function useWordKeys(): { shown: boolean | null; toggle: () => void } {
  const [shown, setShown] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const kept = window.localStorage.getItem(KEPT);
      // Read once after hydration: the server cannot know this browser's answer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (kept === "on" || kept === "off") setShown(kept === "on");
    } catch {
      // Nothing kept: the device decides.
    }
  }, []);
  const toggle = useCallback(() => {
    setShown((was) => {
      const now = !(was ?? window.matchMedia("(pointer: coarse)").matches);
      try {
        window.localStorage.setItem(KEPT, now ? "on" : "off");
      } catch {
        // Kept for this page only.
      }
      return now;
    });
  }, []);
  return { shown, toggle };
}

/** The classes that show or hide the keys: the device's answer while `shown` is null, the player's after. */
export function wordKeysClass(shown: boolean | null): string {
  if (shown === null) return "hidden pointer-coarse:flex";
  return shown ? "flex" : "hidden";
}

/** The press that shows or hides the keys, and the line saying the desk's keyboard works. */
export function WordKeysToggle({ shown, onToggle }: { shown: boolean | null; onToggle: () => void }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <span className={`text-xs text-muted ${shown === null ? "pointer-coarse:hidden" : shown ? "hidden" : ""}`} data-testid="word-keys-note">
        Or type on your keyboard.
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={shown ?? undefined}
        className="min-h-9 rounded-full border border-rule-strong/80 bg-ivory/80 px-3 text-xs font-semibold text-ink-soft transition-colors hover:bg-rule/60 focus-visible:ring-2 focus-visible:ring-moss"
        data-testid="word-keys-toggle"
        data-shown={shown === null ? "device" : shown ? "on" : "off"}
      >
        <span aria-hidden="true">⌨ </span>
        {shown === null ? (
          <>
            <span className="pointer-coarse:hidden">Show keys</span>
            <span className="hidden pointer-coarse:inline">Hide keys</span>
          </>
        ) : shown ? (
          "Hide keys"
        ) : (
          "Show keys"
        )}
      </button>
    </div>
  );
}
