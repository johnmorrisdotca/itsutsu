// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { splitResignation } from "../resign";

/**
 * A GAME OF TENKA KEPT BY AN EARLIER VERSION OF THE RULES. Tenka 2.0.0 (2026-10-02)
 * made both maps the classic boards': the territories, their numbers and the
 * seeds that deal them all changed, so a game kept at version 1 cannot be played
 * out again and `decodeTenka` answers null for it, as it does for any text it
 * cannot read. This tells that case from the others (nothing kept, or text that
 * is not a game at all), so the site can say what happened to the player who
 * had one going, instead of showing them an empty set-up and no reason.
 *
 * Pure and free of the package, so the pages that only need to ask can import
 * it without carrying the rules. A resignation written after the game's own text
 * (`withResignation`) is looked past.
 */

/** The version of the text `encodeTenka` writes today (`KEPT_VERSION` in the package, held equal by `tenkaOldSave.test.ts`). */
export const TENKA_SAVE_VERSION = 2;

/** Whether this kept text is a Tenka game written at an earlier version than the rules read now. */
export function isOldTenkaSave(text: string | null | undefined): boolean {
  if (typeof text !== "string") return false;
  const own = splitResignation(text).text;
  if (own === null) return false;
  try {
    const kept = JSON.parse(own) as unknown;
    if (typeof kept !== "object" || kept === null) return false;
    const { v } = kept as { v?: unknown };
    return typeof v === "number" && v < TENKA_SAVE_VERSION;
  } catch {
    return false;
  }
}
