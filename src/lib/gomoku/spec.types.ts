/**
 * The words a rule set is written in.
 *
 * `VariantSpec` (gomoku.types.ts) is a row of these: each is a closed set of
 * choices a game makes — where a stone lands, which edges join, what a line
 * must be, which shapes are forbidden, how the centre starts, and where the
 * stones sit when the game is drawn its own way. They live here rather than
 * with the spec because they depend on nothing — no stone, no point, no
 * state — and gomoku.types.ts is long enough holding the things that do.
 * It re-exports them, so they are still reached from there.
 */

/**
 * Where a stone goes when played. `free`: where it was put. `drop`: it slides
 * to the lowest empty cell of its column, as if the board were upright and
 * the stones were magnetic.
 */
export type Placement = "free" | "drop" | "edge";

/**
 * Where a game's stones sit when it is drawn the way it is traditionally
 * played: on the crossings of the lines, as in go and gomoku, or inside the
 * squares, as in tic-tac-toe, Othello and checkers.
 *
 * A fact about the game's custom, not its rules: the same points exist either
 * way, and the engine never reads it. It is on the spec all the same, because
 * it is a fact about the GAME, and the one thing a reader's own preference
 * cannot supply. Nothing infers it from the rules — tic-tac-toe and gomoku
 * have the same mechanics and are drawn differently by everybody who has ever
 * played them — so every row declares it, and a row that does not will not
 * compile.
 */
export type BoardGrid = "lines" | "cells";

/** Which edges of the board join up: a plane, a cylinder, or a torus. */
export type WrapMode = "none" | "columns" | "both";

/**
 * What a completed line has to look like to win.
 *
 * `atLeast`: `winLength` or longer.
 * `exact`: precisely `winLength`; an overline is not a win.
 * `exactOpen`: precisely `winLength`, and not shut in at both ends.
 */
export type LineRule = "atLeast" | "exact" | "exactOpen";

/** Shapes a colour may be forbidden from making. See `rules/forbidden.ts`. */
export type ForbiddenPattern = "doubleThree" | "doubleFour" | "overline";

/** How a flipping game begins: nothing, the fixed four, or four the players lay themselves. */
export type StartingDiscs = "none" | "fixed" | "laid";
