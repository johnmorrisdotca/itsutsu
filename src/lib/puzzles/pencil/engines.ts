import { akari } from "./akari";
import { fillomino } from "./fillomino";
import { hitori } from "./hitori";
import { kakuro } from "./kakuro";
import type { PencilEngine, PencilKind } from "./pencil.types";
import { shikaku } from "./shikaku";
import { slitherlink } from "./slitherlink";

const ENGINES: Record<PencilKind, PencilEngine> = { shikaku, akari, slitherlink, hitori, fillomino, kakuro };

/** The engine of a pencil puzzle: how it is made, read, checked and solved. */
export function pencilEngine(kind: PencilKind): PencilEngine {
  return ENGINES[kind];
}
