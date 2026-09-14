import type { WhenStyle } from "@/lib/ui/when.types";

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

/** A moment for `LocalTime` to show: an ISO string, and how much of it to say. */
export type LocalTimeProps = { at: string; style?: WhenStyle };
