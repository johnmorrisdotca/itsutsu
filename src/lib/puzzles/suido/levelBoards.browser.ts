import { SUIDO_LEVEL_BOARDS } from "./levelBoards.data";
import type { SuidoLevelBoards } from "./levelBoards.types";

/** What a browser build gets in place of `levelBoards.ts`: the boards' hashes as the data module holds them, with no file to read. */
export function suidoLevelBoards(): SuidoLevelBoards {
  return SUIDO_LEVEL_BOARDS;
}
