import { sameAppearance } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";

/**
 * A BOARD CHOICE THE ACCOUNT HAS NOT YET CONFIRMED, KEPT BY THIS BROWSER.
 *
 * Saving on the way out of a page is not enough for a reload. A reload asks the
 * server for the new page before the old one is told it is going, so the save
 * sent then lands a moment AFTER the server has drawn the reloaded board from the
 * account — and the member sees the theme they had just moved off, even though
 * the account holds the new one a breath later. Measured: the page request
 * logged, then the save.
 *
 * So the choice is written here the moment it is made — a synchronous write,
 * which no exit can interrupt — and taken off only when the account says it has
 * it. A board opened while one is still here draws it in place of the account's,
 * and sends it again: whichever of the two requests the server finished first,
 * the member sees what they chose, and the account ends up holding it.
 *
 * It is only here between a choice and its confirmation, so it cannot hold a
 * member's board against a change they make later on another device beyond that
 * moment. Blocked or full storage leaves it out, and the board behaves as it did
 * before this existed.
 */
const KEY = "itsutsu.appearance.unsaved.v1";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Remembers a choice as not yet on the account. */
export function rememberUnsaved(appearance: Appearance): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(appearance));
  } catch {
    // A full or blocked store: the save still goes; only the reload guarantee is lost.
  }
}

/** The choice this browser made that the account has not yet confirmed, or null. */
export function unsavedAppearance(): Appearance | null {
  try {
    const raw = storage()?.getItem(KEY) ?? null;
    return raw === null ? null : (JSON.parse(raw) as Appearance);
  } catch {
    return null;
  }
}

/**
 * The account has this choice: forget it — but only if it is still the one
 * waiting. A later choice made while this one was in flight must survive this
 * one's confirmation, or a reload would draw the older theme.
 */
export function forgetUnsaved(confirmed: Appearance): void {
  try {
    const waiting = unsavedAppearance();
    if (waiting !== null && sameAppearance(waiting, confirmed)) storage()?.removeItem(KEY);
  } catch {
    // Nothing to do: the next confirmed choice clears it.
  }
}
