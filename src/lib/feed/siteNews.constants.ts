/**
 * THE SITE'S NEWS: the kinds of thing worth telling everybody, as they are
 * stored on `SiteNews.kind`. Compared through these, never through a literal —
 * the column is a string, and this map is what keeps it honest, as
 * `XP_EVENTS` does for the ledger.
 *
 * John, 2026-09-26: "announce when a game has its first player, or someone
 * beats the others and gets first place, or a hard bot gets beaten, a first
 * loss, a first win, etc... for all users. Best time, new records being broken
 * on the site. Buddies are people you know, but everyone allows you to learn
 * about people you don't know."
 *
 * Each is written ONCE, at the moment it happens, riding a write that was
 * already happening (a game ending, a result being rated, a solve being kept).
 * What makes each one once is its unique key, explained on the model.
 */
export const SITE_NEWS = {
  /** The first finished game of a game on the site, with a person in it. */
  firstGameOfGame: "firstGameOfGame",
  /** A rated result put a member at the top of that game's ladder of people. */
  tookFirstPlace: "tookFirstPlace",
  /** The first person here to beat one of the top two grades, or a specialist, at a game. */
  hardBotBeaten: "hardBotBeaten",
  /** A member's first finished win here. */
  firstWin: "firstWin",
  /** A member's first finished loss here. */
  firstLoss: "firstLoss",
  /** A puzzle solved faster than every earlier solve of its kind, size and level. */
  bestTime: "bestTime",
} as const;

export type SiteNewsKind = (typeof SITE_NEWS)[keyof typeof SITE_NEWS];

export const SITE_NEWS_LIST: readonly SiteNewsKind[] = Object.values(SITE_NEWS);

/** Whether a stored string is a kind this deploy knows. A row written by a later version is left out, never guessed at. */
export function isSiteNewsKind(kind: string): kind is SiteNewsKind {
  return (SITE_NEWS_LIST as readonly string[]).includes(kind);
}
