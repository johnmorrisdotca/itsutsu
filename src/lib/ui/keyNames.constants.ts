/**
 * The names `KeyboardEvent.key` reports for the keys a puzzle listens to, compared and never drawn. Single
 * words that are also words on a button ("Enter", "Delete", "Space"), so they are kept in one file the i18n
 * gate allows (`ALLOWED_FILES`) rather than allowed as terms everywhere, where they would hide a button
 * labelled "Delete". The arrows and Backspace are allowed as terms: no sentence says them.
 */
export const ENTER_KEY = "Enter";
export const DELETE_KEY = "Delete";
/** What `aria-keyshortcuts` calls the space bar. */
export const SPACE_KEY = "Space";
/** The start of every arrow key's name: `ArrowLeft`, `ArrowUp`. */
export const ARROW_KEY = "Arrow";
