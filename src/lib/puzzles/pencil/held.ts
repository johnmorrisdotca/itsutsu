import { akari } from "./akari";
import { hitori } from "./hitori";
import type { HeldPencilKind, PencilEngine } from "./pencil.types";
import { slitherlink } from "./slitherlink";

/**
 * THE ENGINES OF THE PENCIL PUZZLES THE SITE HOLDS BACK, and the one place that names them: see
 * `held.constants.ts` for why, the board rows that bring them back, and the list of what to move to bring one.
 * Nothing the site runs imports this file; `held.test.ts` does, so they stay as sound as the day they were held.
 */
export const HELD_ENGINES: Record<HeldPencilKind, PencilEngine> = { akari, slitherlink, hitori };
