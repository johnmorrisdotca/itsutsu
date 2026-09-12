import type { RuleVariant } from "./gomoku.types";

/**
 * Every game's place in the site's paths.
 *
 * A game is a resource at /games/<slug>, and everything about it — its rules,
 * its record, its ladder, its matches — is a facet underneath that one
 * address. The slugs are a table rather than a transform of the
 * variant key, so that a name can be chosen for how it reads in an address
 * bar — /games/gomoku, not /games/freestyle — and so that renaming a variant
 * key can never silently move a page that people have linked to.
 */
export const GAME_SLUGS: Record<RuleVariant, string> = {
  freestyle: "gomoku",
  standard: "standard",
  renju: "renju",
  omok: "omok",
  caro: "caro",
  ninuki: "ninuki",
  sannuki: "sannuki",
  misereFive: "misere-five",
  makerBreaker: "maker-breaker",
  wildTicTacToe: "wild-tic-tac-toe",
  notakto: "notakto",
  connect6: "connect-six",
  toroidalFive: "toroidal-five",
  obstacleFive: "obstacle-five",
  dropFour: "drop-four",
  dominoFive: "domino-five",
  blockFive: "block-five",
  ringDrop: "ring-drop",
  holeDrop: "hole-drop",
  hotDrop: "hot-drop",
  clearDrop: "clear-drop",
  giveawayDrop: "giveaway-drop",
  wormDrop: "wormhole-drop",
  edgeDrop: "edge-drop",
  twistFive: "twist-five",
  twistFour: "twist-four",
  trapThree: "trap-three",
  squareFour: "square-four",
  tictactoe: "tic-tac-toe",
  reversi: "reversi",
  classicReversi: "classic-reversi",
  antiReversi: "anti-reversi",
  miniReversi: "mini-reversi",
  grandReversi: "grand-reversi",
  halma: "halma",
  hex: "hex",
  checkers: "checkers",
  chineseCheckers: "chinese-checkers",
  go: "go",
};

const VARIANT_BY_SLUG = new Map<string, RuleVariant>(
  (Object.entries(GAME_SLUGS) as [RuleVariant, string][]).map(([variant, slug]) => [slug, variant]),
);

/**
 * The slug for a variant. A stored game carries its variant as a string, and a
 * record from before a game was renamed still needs an address, so an unknown
 * key falls back to itself rather than throwing a whole page away.
 */
export function slugFor(variant: string): string {
  return GAME_SLUGS[variant as RuleVariant] ?? variant;
}

/** The variant a slug names, or null for an address that names nothing. */
export function variantFor(slug: string): RuleVariant | null {
  return VARIANT_BY_SLUG.get(slug) ?? null;
}

/**
 * A game is ONE address, and everything about it hangs underneath.
 *
 * /games/<slug> is the game itself — its front door, the page every name on
 * this site leads to. Under it sit the facets: what it is, who plays it, what
 * has been played, and the matches themselves. The slug is in the path
 * because it is identity; anything that narrows a facet is a filter and lives
 * in the query.
 *
 * This replaced three parallel namespaces. /rules/<slug>, /history/<slug> and
 * /champions/<slug> were three addresses for three halves of one subject,
 * each with its own index, and a reader who arrived at any of them had to
 * know the other two existed to finish an errand about one game.
 */

/** /games/<slug> — the game. The front door, and where every game's name leads. */
export function gamePath(variant: string): string {
  return `/games/${slugFor(variant)}`;
}

/** /games/<slug>/rules — what it is and how a turn goes. */
export function rulesPath(variant: string): string {
  return `${gamePath(variant)}/rules`;
}

/** /games/<slug>/history — every finished game of it, by everybody. */
export function historyPath(variant: string): string {
  return `${gamePath(variant)}/history`;
}

/** /games/<slug>/me — the reader's own games of it. */
export function myGamePath(variant: string): string {
  return `${gamePath(variant)}/me`;
}

/** /games/<slug>/standings — this game's own ladder, in full. */
export function standingsPath(variant: string): string {
  return `${gamePath(variant)}/standings`;
}

/** /games/<slug>/family — the family it belongs to, and its siblings. */
export function familyPath(variant: string): string {
  return `${gamePath(variant)}/family`;
}

/** /games/<slug>/background — the art. A place kept, whether or not there is a picture in it yet. */
export function backgroundPath(variant: string): string {
  return `${gamePath(variant)}/background`;
}

/** /games/<slug>/play — a board, now, in this browser. */
export function playPath(variant: string): string {
  return `${gamePath(variant)}/play`;
}

/** /games/<slug>/new — setting a shared game up, before it exists. */
export function setUpPath(variant: string): string {
  return `${gamePath(variant)}/new`;
}

/**
 * /games/<slug>/match/<id> — one match, and with a move number, the position
 * after that move. A stored game is a move list, so a position is addressable
 * by counting: /games/gomoku/match/abc/12 is the board after the twelfth
 * stone.
 *
 * One address whether the match is being played or has been filed. It was two
 * — a live one here and a replay under /history — which meant every link to a
 * game changed the day it finished, and the two pages spent a redirect each
 * handing readers back and forth.
 */
export function matchPath(variant: string, id: string, move?: number): string {
  const base = `${gamePath(variant)}/match/${id}`;
  return move === undefined ? base : `${base}/${move}`;
}

/** The link that claims a seat. It carries a credential, so it is handed out, never listed. */
export function seatPath(variant: string, id: string, token: string): string {
  return `${matchPath(variant, id)}/seat/${token}`;
}

/**
 * WHAT IS ALREADY DECIDED, ON THE WAY TO THE SCREEN THAT DECIDES THE REST.
 *
 * Every way of starting a game on this site now leads to the setup screen
 * rather than to a board, and each of them arrives knowing something
 * different: a player's page knows the opponent, a finished game knows the
 * opponent and the rules and the colours, a fork knows a position as well, the
 * one-line sentence knows the game and the board and the pace. The screen is
 * the same screen; only how much of it is already filled in changes.
 *
 * THOSE FACTS TRAVEL IN THE QUERY, AND NOWHERE ELSE. Not a cookie, not a
 * store: a pre-filled setup screen is then a plain address — it can be linked,
 * sent to somebody, opened in a second tab, and read by a person before they
 * press anything. A cookie would make the same screen mean different things to
 * two readers and leave nothing for a spec to name. The game itself stays in
 * the PATH, because that is identity and this site puts identity in the path;
 * everything here narrows what the screen starts from, which is a filter.
 *
 * The names are a table rather than string literals at a dozen call sites, so
 * the links that write them and the pages that read them cannot come to
 * disagree about one.
 */
export const SET_UP_PARAMS = {
  /**
   * The opponent, by member id.
   *
   * An id rather than an address, for two reasons that point the same way: a
   * computer player has no address at all, because it never signs in, and a
   * member's address in a query string is a member's address in a browser
   * history, a referrer header and anything they paste to a friend. An id is
   * opaque and already appears in this site's addresses.
   */
  against: "against",
  /** A finished game to play again: its rules, its opponent, its colours swapped. */
  rematch: "rematch",
  /** A game to carry a position out of, with `move` saying how far. */
  from: "from",
  move: "move",
  /** A board and a pace already asked for, so the screen does not ask twice. */
  board: "board",
  pace: "pace",
} as const;

/**
 * A game with no clock, said out loud.
 *
 * "No clock" and "nothing was said about the clock" are different answers and
 * an absent parameter can only mean the second. A pace of `none` is somebody
 * choosing to play without one, which the screen must keep rather than replace
 * with the member's usual.
 */
export const NO_PACE = "none";

/** The most moves an address may name, matching the route's own ceiling. */
const MOVE_CEILING = 4096;

/**
 * The way to the setup screen, carrying whatever is already known.
 *
 * With no `variant` it is /games/new, where the game is still to choose — which
 * is what a rematch wants, so that "play Bob again, but let us try the variant"
 * is a choice the screen actually offers. With one it is /games/<slug>/new, and
 * the game is settled because the address says so: a fork's position belongs to
 * its game, and the sentence on the lobby has already named one.
 */
export function setUpLink(known: {
  variant?: string;
  against?: string;
  rematch?: string;
  from?: { id: string; move: number };
  board?: number;
  /** `NO_PACE` for a game with no clock; omitted when nobody has said. */
  pace?: number | typeof NO_PACE;
}): string {
  const base = known.variant === undefined ? "/games/new" : setUpPath(known.variant);
  const query = new URLSearchParams();
  if (known.against !== undefined && known.against !== "") {
    query.set(SET_UP_PARAMS.against, known.against);
  }
  if (known.rematch !== undefined && known.rematch !== "") {
    query.set(SET_UP_PARAMS.rematch, known.rematch);
  }
  if (known.from !== undefined) {
    query.set(SET_UP_PARAMS.from, known.from.id);
    /*
     * Clamped rather than trusted, and to an integer. The move is read off a
     * page that is counting stones, so it is a number here — but it lands in
     * an address, and an address that cannot be parsed by the page it points
     * at is a link to a refusal.
     */
    const move = Math.min(Math.max(0, Math.trunc(known.from.move)), MOVE_CEILING);
    query.set(SET_UP_PARAMS.move, String(move));
  }
  if (known.board !== undefined) query.set(SET_UP_PARAMS.board, String(known.board));
  if (known.pace !== undefined) query.set(SET_UP_PARAMS.pace, String(known.pace));
  const asked = query.toString();
  return asked === "" ? base : `${base}?${asked}`;
}
