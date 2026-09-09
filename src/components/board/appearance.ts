import { BOARD_THEMES, DEFAULT_APPEARANCE, GRID_STYLES, STONE_SETS } from "./Board.constants";
import type { Appearance } from "./board.types";

/**
 * How a board is dressed, as it crosses the database.
 *
 * The choice belongs to the member rather than to the browser, so it is
 * stored on the account and comes back as a column of JSON — which means it
 * arrives as whatever happens to be in that column, not as an `Appearance`.
 * A theme that has since been removed, a hand-edited row, a value written by
 * a version that offered something this one does not: all of them are a board
 * that cannot be drawn if they are believed.
 *
 * So nothing here trusts the stored value. Each field is checked against the
 * list of what actually exists, and anything unrecognised is simply left out,
 * falling back to the default for that one field rather than throwing away
 * every other choice the member made.
 */

/*
 * `Object.hasOwn`, not `in`: `in` walks the prototype chain, so a stored
 * theme of "toString" would pass and then be read back as a function. The
 * value in that column is not ours, and every object has a toString.
 */
function knownKey<T extends object>(table: T, value: unknown): keyof T | undefined {
  return typeof value === "string" && Object.hasOwn(table, value) ? (value as keyof T) : undefined;
}

function knownFlag(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** The parts of a stored appearance that name something this site still has. */
export function cleanAppearance(stored: unknown): Partial<Appearance> {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
  const row = stored as Record<string, unknown>;
  const clean: Partial<Appearance> = {};

  const boardTheme = knownKey(BOARD_THEMES, row.boardTheme);
  if (boardTheme !== undefined) clean.boardTheme = boardTheme;

  const stoneSet = knownKey(STONE_SETS, row.stoneSet);
  if (stoneSet !== undefined) clean.stoneSet = stoneSet;

  const grid = knownKey(GRID_STYLES, row.grid);
  if (grid !== undefined) clean.grid = grid;

  const showCoordinates = knownFlag(row.showCoordinates);
  if (showCoordinates !== undefined) clean.showCoordinates = showCoordinates;

  const showMoveNumbers = knownFlag(row.showMoveNumbers);
  if (showMoveNumbers !== undefined) clean.showMoveNumbers = showMoveNumbers;

  // Through the same validator as every other flag, not beside it.
  const flipped = knownFlag(row.flipped);
  if (flipped !== undefined) clean.flipped = flipped;

  return clean;
}

/** A whole appearance from a stored one: every field, defaults where it said nothing usable. */
export function appearanceFrom(stored: unknown): Appearance {
  return { ...DEFAULT_APPEARANCE, ...cleanAppearance(stored) };
}

/**
 * Whether two appearances differ, so a board being redrawn does not write to
 * the account for saying the same thing again.
 */
export function sameAppearance(a: Appearance, b: Appearance): boolean {
  return (
    a.boardTheme === b.boardTheme &&
    a.stoneSet === b.stoneSet &&
    a.grid === b.grid &&
    a.showCoordinates === b.showCoordinates &&
    a.showMoveNumbers === b.showMoveNumbers &&
    a.flipped === b.flipped
  );
}
