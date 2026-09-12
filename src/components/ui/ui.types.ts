import type { ASKING } from "./ui.constants";

/**
 * What a `ConfirmButton`'s question is doing: on the screen, waved away, or
 * answered.
 *
 * Shared, because the control that asks and the thing that has to hold still
 * while it is asked live in different component groups. See `ASKING` for why
 * there are three of these rather than two.
 */
export type Asking = (typeof ASKING)[keyof typeof ASKING];
