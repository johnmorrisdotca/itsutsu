import type { ResultMarkKind } from "./resultMark.types";

/** The three marks, named so a caller never writes the strings. */
export const RESULT_MARKS = { success: "success", failure: "failure", other: "other" } as const satisfies Record<ResultMarkKind, ResultMarkKind>;

/**
 * EACH MARK'S SHAPE AND COLOUR. The shape carries the meaning, so a reader who
 * cannot tell moss from vermilion still can: a tick, a cross, a level bar. The
 * colours are the site's own for a win and a loss (the result card's moss and
 * shu), and ink-soft for everything that is neither.
 */
export const RESULT_MARK_LOOK: Record<ResultMarkKind, { path: string; colour: string; name: string }> = {
  success: { path: "M7.2 12.4l3.2 3.2 6.4-7", colour: "text-moss", name: "tick" },
  failure: { path: "M8.5 8.5l7 7M15.5 8.5l-7 7", colour: "text-shu", name: "cross" },
  other: { path: "M7.5 12h9", colour: "text-ink-soft", name: "bar" },
};
