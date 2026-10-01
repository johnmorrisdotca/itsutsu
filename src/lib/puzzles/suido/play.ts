import { decodeLayout, flowOf, quartersBetween, turnAt, type Flow, type Game, type Kind } from "@johnmorrisdotca/suido";

/**
 * A half-played board opened again: the board as it is dealt, with every piece
 * facing as the kept code says (`gameCode`). The quarters are the fewest
 * clockwise turns from the dealt facing, which is all a drawing needs to show
 * the piece where it was left; how many times it was turned on the way is not
 * kept, and nothing reads it. Null for a code that is not this board's: any
 * piece that is not the dealt piece turned, or a pump or drain moved.
 */
export function resumedGame(start: Game, progress: string): Game | null {
  const kept = decodeLayout(progress);
  const dealt = start.start;
  if (kept === null || kept.width !== dealt.width || kept.height !== dealt.height || kept.kind !== dealt.kind || kept.wrap !== dealt.wrap) return null;
  if (kept.sources.join() !== dealt.sources.join() || kept.drains.join() !== dealt.drains.join()) return null;
  // A level's locked pieces and walls are the board's own: a kept board that has moved either is another board.
  if ((kept.locked ?? []).join() !== (dealt.locked ?? []).join() || (kept.walls ?? []).join() !== (dealt.walls ?? []).join()) return null;
  // A locked piece stays as dealt, whatever the code says.
  if ((dealt.locked ?? []).some((cell) => kept.cells[cell] !== dealt.cells[cell])) return null;
  const quarters: number[] = [];
  for (let cell = 0; cell < dealt.cells.length; cell += 1) {
    const turned = quartersBetween(dealt.cells[cell]!, kept.cells[cell]!);
    if (turned === null) return null;
    quarters.push(turned);
  }
  return { start: dealt, masks: kept.cells, quarters, turns: 0 };
}

/** The piece at `cell` turned clockwise as many quarters as it takes to face as `answer` says: what a Hint does. */
export function turnedToFace(game: Game, cell: number, answer: readonly number[]): Game {
  let next = game;
  const quarters = quartersBetween(game.masks[cell]!, answer[cell]!) ?? 0;
  for (let each = 0; each < quarters; each += 1) next = turnAt(next, cell, 1);
  return next;
}

/** What the water has done, in the words the line under the board says (`suidoStatus`). */
export type SuidoReading = { solved: boolean; reached: number; wanted: number; leaks: number; kind: Kind };

/** The water on a board read as what the solver wants to be told: how much of what the kind asks is reached, and how many open ends leak. */
export function suidoReading(game: Game, flow: Flow = flowOf(game.start, game.masks)): SuidoReading {
  const drains = game.start.kind === "drains";
  /* An inlet-to-outlet board is read by how far the water has run (its wet pieces): there is one outlet, and "0 of 1 drain" would say less than the water does. */
  return { solved: flow.solved, reached: drains ? flow.wetDrains : flow.wetPieces, wanted: drains ? flow.drains : flow.pieces, leaks: flow.spills.length, kind: game.start.kind };
}
