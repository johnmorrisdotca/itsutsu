import type { Speaker } from "../i18n/i18n";
import { blend, distance, shade } from "./colourMath";

/**
 * THE COLOURS A PLAYER MAY GIVE THEIR OWN PIECES.
 *
 * John, 2026-09-29: "just like other sites, we should allow the changing of
 * colors after start of game… allow people to select their Marble colour when
 * they lay their first move, or at Options setup… unlike IYT, we just do
 * colours, nice colours, and no patterns for now. I like Deep Red, Blue,
 * green, etc... colours that work in the boards and should be optional
 * completely."
 *
 * Solid colours only, each a stone shaded the way the board's own stones are
 * (light at the top left, dark at the rim), with its name, its kanji, the ink a
 * move number or a letter is written in on it, and one letter of its own for a
 * party marble, so a player who cannot tell two colours apart can still read
 * whose piece is whose.
 *
 * EVERY PIECE IN THIS PALETTE CARRIES AN EDGE: a thin ring in its own ink,
 * part-transparent, inside the stone. It is what lets a Deep Red stone stand on
 * the red felt, a Green one on the green felt, Ink on the sumi board and Shell
 * on the puzzles' paper — the colour alone would sink into those, and
 * `pieceColours.test.ts` measures every colour against every surface on the
 * site, and every two colours against each other.
 *
 * Optional, completely: a seat with no colour chosen is drawn exactly as it
 * always was, in the reader's own stone set.
 */
export const PIECE_COLOURS = {
  red: { label: "Deep Red", kanji: "深紅", flat: "#b3202e", ink: "#ffffff", letter: "R" },
  vermilion: { label: "Vermilion", kanji: "朱", flat: "#e8612a", ink: "#1a1a1a", letter: "V" },
  amber: { label: "Amber", kanji: "琥珀", flat: "#e0a020", ink: "#1a1a1a", letter: "A" },
  green: { label: "Green", kanji: "緑", flat: "#257a42", ink: "#ffffff", letter: "G" },
  teal: { label: "Teal", kanji: "青緑", flat: "#0f7878", ink: "#ffffff", letter: "T" },
  blue: { label: "Blue", kanji: "瑠璃", flat: "#2456b5", ink: "#ffffff", letter: "B" },
  plum: { label: "Plum", kanji: "紫", flat: "#7a2f82", ink: "#ffffff", letter: "P" },
  ink: { label: "Ink Black", kanji: "墨", flat: "#1c1c22", ink: "#ffffff", letter: "K" },
  shell: { label: "Shell White", kanji: "胡粉", flat: "#f4f1e8", ink: "#1a1a1a", letter: "W" },
} as const satisfies Record<string, { label: string; kanji: string; flat: string; ink: string; letter: string }>;

export type PieceColour = keyof typeof PIECE_COLOURS;

export const PIECE_COLOUR_LIST = Object.keys(PIECE_COLOURS) as PieceColour[];

/** What the preferences registry keeps for a member's own pieces: a colour, or `none` for the game's own look. */
export const PIECE_COLOUR_PREFERENCES = ["none", ...PIECE_COLOUR_LIST] as readonly ("none" | PieceColour)[];

/** A kept preference as a colour, or null for "none". */
export function preferredColour(value: "none" | PieceColour | undefined): PieceColour | null {
  return value === undefined || value === "none" ? null : value;
}

export function isPieceColour(value: unknown): value is PieceColour {
  return typeof value === "string" && Object.hasOwn(PIECE_COLOURS, value);
}

/** How strongly the edge ring shows: its ink laid over the stone at this opacity. */
export const PIECE_EDGE_ALPHA = 0.8;

/** And the hairline outside it, dark on every colour, so a piece also stands off a ground its own tone. */
export const PIECE_OUTLINE = "#1a1a1a";
export const PIECE_OUTLINE_ALPHA = 0.6;

/** The edge ring's colour as it is seen: the ink laid over the stone's own colour. */
export function edgeOf(colour: PieceColour): string {
  const { ink, flat } = PIECE_COLOURS[colour];
  return blend(ink, flat, PIECE_EDGE_ALPHA);
}

/** The hairline's colour as it is seen, laid over the stone's own colour. */
export function outlineOf(colour: PieceColour): string {
  return blend(PIECE_OUTLINE, PIECE_COLOURS[colour].flat, PIECE_OUTLINE_ALPHA);
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The stone itself, as a CSS background: a dark hairline at the rim, the edge
 * ring in its own ink inside it, over a shaded disc. Drawn on any round box —
 * a stone, a disc, a marble in its hole, a chip in a turn line — which is what
 * lets one palette dress every game's pieces.
 */
export function pieceFace(colour: PieceColour): string {
  const { ink, flat } = PIECE_COLOURS[colour];
  return [
    `radial-gradient(circle closest-side, transparent 0 93%, ${rgba(PIECE_OUTLINE, PIECE_OUTLINE_ALPHA)} 94% 100%, transparent 100%)`,
    `radial-gradient(circle closest-side, transparent 0 84%, ${rgba(ink, PIECE_EDGE_ALPHA)} 85% 93%, transparent 94%)`,
    `radial-gradient(circle at 35% 30%, ${shade(flat, 0.38)} 0%, ${flat} 45%, ${shade(flat, -0.35)} 100%)`,
  ].join(", ");
}

/**
 * UNDER THIS DISTANCE, TWO PIECES ARE TOO ALIKE to share a board: at a glance
 * across a position, a player could not say whose stone is whose. Every two
 * colours in the palette are further apart than this (the test says so), so
 * inside the palette only the same colour twice is refused; the rule bites
 * where a seat left at the game's own look meets a colour like it — Ink Black
 * against the ordinary black stones, Shell White against the white.
 */
export const TOO_ALIKE = 25;

/** Whether two pieces, as `#rrggbb`, would be too alike on one board. */
export function tooAlike(a: string, b: string): boolean {
  return distance(a, b) < TOO_ALIKE;
}

/**
 * The first colour from `wanted` on round the palette that is not too alike
 * any of `others` — what a seat is offered when the colour it asked for is
 * already the other seat's. Null when none is free, which nine colours and at
 * most six seats cannot reach.
 */
export function nextFreeColour(wanted: PieceColour, others: readonly string[]): PieceColour | null {
  const start = PIECE_COLOUR_LIST.indexOf(wanted);
  for (let step = 0; step < PIECE_COLOUR_LIST.length; step += 1) {
    const colour = PIECE_COLOUR_LIST[(start + step) % PIECE_COLOUR_LIST.length]!;
    if (!others.some((other) => tooAlike(PIECE_COLOURS[colour].flat, other))) return colour;
  }
  return null;
}

/**
 * "<colour> is free.", said after a refusal: the colour by its English label, or
 * by its kanji, which is its name to a Japanese reader. English joins a second
 * sentence with a space and Japanese does not.
 */
export function offerWords(colour: PieceColour, say: Speaker): string {
  const name = say.pairName(PIECE_COLOURS[colour].label, PIECE_COLOURS[colour].kanji).text;
  return `${say.locale === "ja" ? "" : " "}${say.say("pieces.refusal.free", { colour: name })}`;
}
