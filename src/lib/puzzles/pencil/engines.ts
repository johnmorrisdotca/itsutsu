import { fillomino } from "./fillomino";
import { kakuro } from "./kakuro";
import type { PencilEngine, PencilKind } from "./pencil.types";
import { shikaku } from "./shikaku";

// Cross Sums is Kakuro's engine and Regions Fillomino's: the site's names for what Kazu calls by the puzzles' own.
const ENGINES: Record<PencilKind, PencilEngine> = { shikaku, crossSums: kakuro, regions: fillomino };

/** The engine of a pencil puzzle: how it is made, read, checked and solved. */
export function pencilEngine(kind: PencilKind): PencilEngine {
  return ENGINES[kind];
}
