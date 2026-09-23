/**
 * HOW BIG THE BOARD IS DRAWN ON A DESK.
 *
 * John, 2026-09-22: "If someones on a computer with big screen, we should allow
 * them to use that space and have a larger board. is that done by detecting and
 * showing a larger borad, or having buttons to show a S M L version of the
 * board… and have memory /preferences that detect this and preserve on other
 * devices? Of course, they might have Mobile and esktop and should show
 * approprialy on both."
 *
 * Both, and not as equals. `fit` is the default and is the detecting: as large
 * as the screen's HEIGHT allows, because on a desk height is the limit and
 * width is not. S, M and L are for the person who wants something other than
 * what fit picked — a smaller board with the move list beside it in view, or
 * the biggest one the page can hold.
 *
 * FIT IS ITS OWN VALUE, NOT WHICHEVER OF THE THREE IT HAPPENS TO MATCH. A
 * stored `medium` that meant "I chose this" and one that meant "nobody has
 * touched this" could not be told apart, so nobody who had never chosen could
 * be given a better fit later — the `flipped: false` trap AGENTS.md records.
 *
 * A DESK SETTING, READ ONLY ON A DESK. A phone's board already fills the phone,
 * so on one there is nothing to choose between; the setting is kept on the
 * account and simply not applied below a laptop's width. That is what "show
 * appropriately on both" comes to: the phone keeps fitting, and the size chosen
 * at one desk is the size at the next.
 */
export const BOARD_SIZES = {
  fit: "fit",
  small: "small",
  medium: "medium",
  large: "large",
} as const;

export const BOARD_SIZE_LIST = [BOARD_SIZES.fit, BOARD_SIZES.small, BOARD_SIZES.medium, BOARD_SIZES.large] as const;

export type BoardSize = (typeof BOARD_SIZE_LIST)[number];
