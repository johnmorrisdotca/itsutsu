import { FACE_LAYOUT } from "./Cards.constants";
import type { PileCard, PileSpread } from "./cards.types";

/** The steps a pile uses when a game names none: a face-down card shows a sliver, a face-up one its top strip. */
export const DEFAULT_STEP = { faceDown: 0.12, faceUp: FACE_LAYOUT.strip } as const;

/** The least a squeezed face-up step may be, just past the rank's foot: less and a rank is covered, so a long column grows instead. */
export const LEAST_FACE_UP = 0.265;

/**
 * WHERE EACH CARD OF A PILE SITS, as a multiple of a card's height (`down`) or
 * width (`right`) from the first, and how far past one card the pile reaches.
 * Pure, so the layout is tested without a browser.
 *
 * `room` caps a `down` pile's height in card heights: its steps shrink, the
 * face-down ones first, and never below the strip a face-up rank needs.
 * `showLast` spreads only the last few of a `right` pile (a waste turned three
 * at a time); the rest lie squared up under the first of them.
 */
export function pileLayout({
  cards,
  spread,
  step = DEFAULT_STEP,
  room,
  showLast,
}: {
  cards: readonly PileCard[];
  spread: PileSpread;
  step?: { faceDown: number; faceUp: number };
  room?: number;
  showLast?: number;
}): { offsets: number[]; extent: number } {
  if (spread === "stack" || cards.length === 0) return { offsets: cards.map(() => 0), extent: 0 };
  if (spread === "right") {
    const shown = showLast ?? cards.length;
    const firstSpread = Math.max(0, cards.length - shown);
    const offsets = cards.map((_, at) => Math.max(0, at - firstSpread) * step.faceUp);
    // A waste reserves its whole width whatever it holds, so the table does not move as it fills.
    return { offsets, extent: Math.max(0, shown - 1) * step.faceUp };
  }
  const gaps = cards.slice(0, -1).map((pile) => (pile.faceUp ? "up" : "down"));
  const downs = gaps.filter((gap) => gap === "down").length;
  const ups = gaps.length - downs;
  let faceDown = step.faceDown;
  let faceUp = step.faceUp;
  if (room !== undefined) {
    const allowed = Math.max(0, room - 1);
    const need = downs * faceDown + ups * faceUp;
    if (need > allowed) {
      // Face-down cards give up their room first, to a quarter of their step; then the face-up ones, to the least that shows a rank.
      faceDown = Math.max(faceDown / 4, downs === 0 ? faceDown : (allowed - ups * faceUp) / downs);
      if (downs * faceDown + ups * faceUp > allowed && ups > 0) faceUp = Math.max(LEAST_FACE_UP, (allowed - downs * faceDown) / ups);
    }
  }
  const offsets: number[] = [];
  let at = 0;
  cards.forEach((_, index) => {
    offsets.push(at);
    at += gaps[index] === "up" ? faceUp : gaps[index] === "down" ? faceDown : 0;
  });
  return { offsets, extent: offsets[offsets.length - 1] };
}
