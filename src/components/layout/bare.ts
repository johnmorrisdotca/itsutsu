/**
 * Just the board.
 *
 * A way to strip a page back to the board and the moves — no masthead, no
 * side panels, no footer — and have it stay that way on the next game and the
 * next day. It is a reading preference and nothing more: it hides furniture
 * and changes no rule, no setting and nothing the other player can see.
 *
 * Kept in this browser rather than against the account, which is the request
 * as it was made: the choice has to survive the next visit, not follow you to
 * another device. That also keeps it out of a migration — and out of
 * `Appearance`, which is how a board is dressed and is a different question
 * from how much of the page is around it.
 *
 * Not to be confused with the mute in SharedGame, which is also stored per
 * browser and is about the other player's waves. That one is `itsutsu.mute.<id>`
 * and belongs to one game; this one is the whole site's furniture.
 */

const KEY = "itsutsu.bare";
const EVENT = "itsutsu:bare";

/** The attribute the stylesheet hangs off, set on the root element. */
export const BARE_ATTRIBUTE = "data-bare";

/**
 * Whether the board is being read bare, as far as this browser knows.
 *
 * Storage can be unavailable — a private window, a browser set to refuse it —
 * and a reading preference is not worth an error, so every read that fails
 * says no and every write that fails is simply not remembered.
 */
export function readBare(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBare(bare: boolean): void {
  try {
    if (bare) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Not remembered, then.
  }
  // The custom event carries the change to this tab; "storage" carries it to
  // the others, so two tabs of the same game agree.
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeBare(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The same decision, made in the document head before anything is painted.
 *
 * Without this the server sends a page with its furniture on, and the setting
 * is only read once React has hydrated — so a reader who asked for the board
 * alone gets the masthead flashing up and disappearing on every page. It is
 * the one place a blocking inline script earns its keep. Kept to one
 * expression, and it fails silently for the same reason the reads do.
 */
export const BARE_HEAD_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  KEY,
)})==="1")document.documentElement.setAttribute(${JSON.stringify(
  BARE_ATTRIBUTE,
)},"true")}catch(e){}`;
