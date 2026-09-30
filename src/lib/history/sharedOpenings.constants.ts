import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";

/**
 * The openings a shared game may use. A seat token is a colour, and the swap
 * protocols move colours between players, so those cannot be played across
 * two devices.
 *
 * Beside the request schemas and not in them (`gameSettingsSchema.ts`
 * re-exports it), as the clock's values are (`moveTime.constants.ts`): the
 * set-up screen and the board name these in the browser, and through the
 * schema module all of zod rode with them — into the browser's scripts, and
 * into the pages' server function a second time (`listTracing.coverage.test.ts`).
 */
export const SHARED_OPENINGS: readonly OpeningRule[] = [
  OPENING_RULES.free,
  OPENING_RULES.pro,
  OPENING_RULES.longPro,
];
