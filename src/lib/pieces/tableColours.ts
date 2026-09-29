import { PIECE_COLOURS, TOO_ALIKE, isPieceColour, nextFreeColour, type PieceColour } from "./pieceColours";
import { distance } from "./colourMath";

/**
 * THE COLOURS AT A TABLE OF MANY — a party game's seats, two to eight round one
 * device or several — each seat's own, by its place at the table. A place that
 * chose nothing keeps its table colour (the party marbles: Player 1 red, 2 blue
 * and so on), exactly as before.
 */
export type TableColours = readonly (PieceColour | null)[];

/** One place's marble as the table shows it: its name, its letter, its colour and the ink on it. */
export type TableMarble = { label: string; letter: string; fill: string; ink: string };

/** The table's marbles with each place's own colour over its default, place by place. */
export function tableMarbles<M extends TableMarble>(defaults: readonly M[], colours: TableColours): TableMarble[] {
  return defaults.map((marble, seat) => {
    const chosen = colours[seat] ?? null;
    if (chosen === null) return marble;
    const { label, letter, flat, ink } = PIECE_COLOURS[chosen];
    return { label, letter, fill: flat, ink };
  });
}

/** A table's colours out of whatever storage held: only palette colours survive, one a place. */
export function tableColoursFrom(stored: unknown, seats: number): TableColours {
  const list = Array.isArray(stored) ? stored : [];
  return Array.from({ length: seats }, (_, seat) => (isPieceColour(list[seat]) ? list[seat] : null));
}

export type TableColourRefusal = { reason: "same" | "alike" | "letter"; offer: PieceColour | null };

/**
 * Whether the place `seat` may take `wanted` among the `playing` places at the
 * table, and if not why, with the next colour it could have. Every other place
 * in play is judged as it is SEEN — its chosen colour or its table colour — so
 * a colour too like somebody's default marble is refused as surely as one they
 * chose; and no two marbles may carry one letter, because the letter is how a
 * player who cannot tell two colours apart reads whose piece is whose.
 */
export function tableColourRefusal(
  seat: number,
  wanted: PieceColour | null,
  marbles: readonly TableMarble[],
  playing: number,
): TableColourRefusal | null {
  if (wanted === null) return null;
  const others = marbles.slice(0, playing).filter((_, at) => at !== seat);
  const mine = PIECE_COLOURS[wanted];
  const clash = others.find((other) => other.fill === mine.flat)
    ? "same"
    : others.some((other) => distance(other.fill, mine.flat) < TOO_ALIKE)
      ? "alike"
      : others.some((other) => other.letter === mine.letter)
        ? "letter"
        : null;
  if (clash === null) return null;
  const taken = others.map((other) => other.fill);
  const letters = new Set(others.map((other) => other.letter));
  let offer = nextFreeColour(wanted, taken);
  // The next free colour must carry a free letter too.
  for (let tries = 0; offer !== null && letters.has(PIECE_COLOURS[offer].letter) && tries < 10; tries += 1) {
    const after = nextFreeColour(offer, [...taken, PIECE_COLOURS[offer].flat]);
    offer = after === offer ? null : after;
  }
  return { reason: clash, offer };
}

/** What a table's refusal says, beside the chooser. */
export function tableRefusalWords(refusal: TableColourRefusal): string {
  const offer = refusal.offer === null ? "" : ` ${PIECE_COLOURS[refusal.offer].label} is free.`;
  if (refusal.reason === "same") return `Another player at the table has that colour.${offer}`;
  if (refusal.reason === "letter") return `Another player's marble carries that colour's letter.${offer}`;
  return `That colour is too like another player's marbles to tell apart.${offer}`;
}
