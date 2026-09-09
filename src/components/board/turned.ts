/**
 * One game's board turned round, for this reader, in this browser.
 *
 * The standing preference lives on the account, in `Appearance`, and says
 * which way up you like a board generally. This is the override for a single
 * game: you play Halma from the far corner this once, turn that board round,
 * and every other board is left alone.
 *
 * Three states, not two. Unset is not "the right way up" — it means this game
 * has no view of its own and the account's preference stands, so changing the
 * standing preference still moves every board you have not spoken about.
 *
 * Kept in this browser rather than against the account, because it belongs to
 * the sitting rather than to the player, and because it must never reach the
 * other seat. It is the same shape as the per-game mute next to it.
 */

const KEY = (id: string) => `itsutsu.turned.${id}`;
const EVENT = "itsutsu:turned";

/**
 * How this game is being read, or null when nothing has been said about it.
 *
 * Storage can be unavailable — a private window, a browser set to refuse it —
 * and a reading preference is not worth an error, so a read that fails says
 * nothing and a write that fails is simply not remembered.
 */
export function readTurned(id: string): boolean | null {
  try {
    const stored = window.localStorage.getItem(KEY(id));
    return stored === null ? null : stored === "1";
  } catch {
    return null;
  }
}

/** Passing null forgets this game's view, so the account's preference stands again. */
export function writeTurned(id: string, turned: boolean | null): void {
  try {
    if (turned === null) window.localStorage.removeItem(KEY(id));
    else window.localStorage.setItem(KEY(id), turned ? "1" : "0");
  } catch {
    // Not remembered, then.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTurned(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Which way this board is read: the game's own view if it has one, else the account's. */
export function turnedFor(override: boolean | null, standing: boolean): boolean {
  return override ?? standing;
}
