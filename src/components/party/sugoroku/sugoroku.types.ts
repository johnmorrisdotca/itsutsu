import type { Side } from "@johnmorrisdotca/sugoroku";

/** The dice on the board: whose half they are on, their faces, and which are used up. */
export type SugorokuShownDice = { side: Side; values: readonly number[]; spent?: readonly boolean[] };

/** What the board lights: the checker picked up, where it may go, and the places a checker could be picked up from, in the mover's own numbering. */
export type SugorokuHighlight = { side: Side; from?: number | null; targets?: readonly number[]; movable?: readonly number[] };
