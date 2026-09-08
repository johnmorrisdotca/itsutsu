import type { RuleVariant } from "./gomoku.types";

/**
 * Every game's place in the site's paths.
 *
 * A game is a resource at /games/<slug>, and a match of it is one underneath
 * at /games/<slug>/<id>. The slugs are a table rather than a transform of the
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

/** /games/<slug> — the game itself, ready to play. */
export function gamePath(variant: string): string {
  return `/games/${slugFor(variant)}`;
}

/**
 * /games/<slug>/<id> — one match, and with a move number, the position after
 * that move. A stored game is a move list, so a position is addressable by
 * counting: /games/gomoku/abc/12 is the board after the twelfth stone.
 */
export function matchPath(variant: string, id: string, move?: number): string {
  const base = `${gamePath(variant)}/${id}`;
  return move === undefined ? base : `${base}/${move}`;
}

/**
 * The record, by game. /history/<slug> is every finished game of one kind;
 * /history/<slug>/<id> is one of them, replayed; and with a move number,
 * /history/<slug>/<id>/5 is the board after the fifth stone — the address
 * to send someone who should see that moment. The same shape as /games, so
 * a game's name is in the address wherever the game is.
 */
export function recordPath(variant: string, id?: string, move?: number): string {
  const base = `/history/${slugFor(variant)}`;
  if (id === undefined) return base;
  return move === undefined ? `${base}/${id}` : `${base}/${id}/${move}`;
}

/** /rules/<slug> — a game's rules, under the same name as its board. */
export function rulesPath(variant: string): string {
  return `/rules/${slugFor(variant)}`;
}

/** The link that claims a seat. It carries a credential, so it is handed out, never listed. */
export function seatPath(variant: string, id: string, token: string): string {
  return `${matchPath(variant, id)}/seat/${token}`;
}
