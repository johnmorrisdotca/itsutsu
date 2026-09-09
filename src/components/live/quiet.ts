/**
 * One opponent's messages, silenced for one game, in this browser.
 *
 * Not the ignore list, which is an account saying it will not hear from
 * another account anywhere on the site. This is narrower and lighter: a
 * player is being noisy in this one game and you would like some quiet until
 * it is over. It travels no further than the browser it was set in, and the
 * other seat is never told.
 *
 * Lifted out of SharedGame when it grew past the file-size gate. It is the
 * same shape as the per-game board flip in components/board/turned.ts, and
 * the two are the whole of what a browser remembers about a single game.
 */

const KEY = (id: string) => `itsutsu.mute.${id}`;
const EVENT = "itsutsu:mute";

/**
 * Storage can be unavailable — a private window, a browser set to refuse it —
 * and a listening preference is not worth an error, so a read that fails says
 * no and a write that fails is simply not remembered.
 */
export function readQuiet(id: string): boolean {
  try {
    return window.localStorage.getItem(KEY(id)) === "1";
  } catch {
    return false;
  }
}

export function writeQuiet(id: string, quiet: boolean): void {
  try {
    if (quiet) window.localStorage.setItem(KEY(id), "1");
    else window.localStorage.removeItem(KEY(id));
  } catch {
    // Not remembered, then.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeQuiet(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
