/**
 * CSS the puzzle screens paint with, built from colours: gradients and the selectors that find what a
 * press landed on. Code that reads as words to a scanner (a gradient says "at"; a selector says "a"), never
 * drawn as text, so it is kept apart in a file the i18n gate allows (`ALLOWED_FILES`).
 */

/** A Meikyuu frame's surface: lit at one corner, shaded at the rim. */
export const frameSurface = (light: string, base: string, deep: string): string => `radial-gradient(120% 90% at 20% 0%, ${light} 0%, ${base} 45%, ${deep} 100%)`;

/** A swatch of a maze ink: the line's colour in the middle, the wall's round it. */
export const inkSwatch = (trail: string, wall: string): string => `radial-gradient(circle at 50% 50%, ${trail} 0 28%, ${wall} 31% 100%)`;

/** What a press on a control lands on: it keeps Space and Enter for itself. */
export const CONTROL_SELECTOR = "button, a, input, select, textarea";

/** What a press on a link lands on. */
export const LINK_SELECTOR = "a[href]";

/** Why a puzzle's page keeps its column the width it does: read by the page-width gate, never drawn. */
export const PUZZLE_WIDTH_REASON = "a puzzle grid wider than a hand is a grid nobody can reach across, until the reader asks for a bigger one";
