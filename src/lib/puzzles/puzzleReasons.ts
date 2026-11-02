import { english } from "@/lib/api/refusal";
import type { RefusalCode, RefusalValue, RefusalValues } from "@/lib/api/refusal.types";

/**
 * Why a puzzle's check will not take an answer (ENJA-13).
 *
 * A check runs on the server before it pays and in the browser before it says "done", so what it returns is a KEY and
 * the values that fill it, and each reader is told in their own language by the page (`refusalText.ts`). `reason` is
 * the same clause in English, which every caller that is not a page reads (a log line, a test, a script), and which a
 * check from a package, that has no key, gives alone.
 */
export type PuzzleReason = { reason: string; code?: RefusalCode; values?: RefusalValues };

/** A reason, from its key and values. */
export function why(code: RefusalCode, values?: RefusalValues): PuzzleReason {
  return values === undefined ? { reason: english(code), code } : { reason: english(code, values), code, values };
}

/** A check's refusal: `{ ok: false }` and the reason. */
export function no(code: RefusalCode, values?: RefusalValues): { ok: false } & PuzzleReason {
  return { ok: false, ...why(code, values) };
}

/** The reason as a value that fills a gap in another refusal ("Not solved: {reason}"): keyed where it has a key, English where a package gave only that. */
export function reasonValue(given: PuzzleReason): RefusalValue {
  return given.code === undefined ? given.reason : given.values === undefined ? { code: given.code } : { code: given.code, values: given.values };
}
