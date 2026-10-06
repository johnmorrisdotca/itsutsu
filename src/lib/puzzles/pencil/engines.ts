import { akari } from "./akari";
import { regions } from "./regions";
import { hitori } from "./hitori";
import { crossSums } from "./crossSums";
import type { PencilEngine, PencilKind } from "./pencil.types";
import { shikaku } from "./shikaku";
import { loop } from "./loop";

// The site and Kazu 2.0.0 name the six alike: Loop, Cross Sums and Regions are Kazu's own, not the names other sites print.
const ENGINES: Record<PencilKind, PencilEngine> = { shikaku, akari, loop, hitori, crossSums, regions };

/** The engine of a pencil puzzle: how it is made, read, checked and solved. */
export function pencilEngine(kind: PencilKind): PencilEngine {
  return ENGINES[kind];
}
