/**
 * A puzzle as a string: for an address, a POST body, and one day a column.
 *
 * Row-major, one character per cell: a digit for a value, `.` for an empty
 * cell. Past nine the values are letters, A for 10 up to G for 16, as a 16×16
 * Sudoku is printed (`symbolOf`), so one character is still one cell. Number Place and More or Less write their cells this way and so
 * does an answer to either; Hidden Stones writes its regions as letters and
 * its answer as the column of each row's stone (see `hiddenStones/`).
 * Nothing here knows a kind: it is the spelling, and `puzzleCheck.ts` is the
 * meaning. The spelling is Kazu's (`@johnmorrisdotca/kazu`), which writes the
 * Numbers family's grids; every kind that writes a grid of cells shares it.
 */

export { decodeCells, EMPTY_CELL, encodeCells, symbolOf, valueOfSymbol } from "@johnmorrisdotca/kazu";

/**
 * A short fingerprint of a puzzle's givens, for the XP subject: the same
 * puzzle solved twice pays once. FNV-1a over the string, as eight hex
 * characters (Kazu's `kazuHash`) — not a credential, so a collision costs a
 * member one award on one grid, which is the cheapest thing that can go wrong.
 */
export { kazuHash as puzzleHash } from "@johnmorrisdotca/kazu";
