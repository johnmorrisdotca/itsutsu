import { describe, expect, it } from "vitest";

import { BOARD_GRIDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { DEFAULT_APPEARANCE } from "./Board.constants";
import { appearanceFrom, cleanAppearance, gridFor, sameAppearance } from "./appearance";

/**
 * How a board is dressed, as it crosses the database.
 *
 * This comes back as a column of JSON, which means it comes back as whatever
 * is in that column — a theme that has since been removed, a row somebody
 * edited by hand, a value written by a version that offered something this
 * one does not. Every one of those is a board that cannot be drawn if it is
 * believed, so nothing here believes it.
 */
describe("reading a stored board", () => {
  it("keeps every choice that names something this site has", () => {
    expect(
      cleanAppearance({
        boardTheme: "sumi",
        stoneSet: "jade",
        grid: "lines",
        showCoordinates: false,
        showMoveNumbers: true,
      }),
    ).toEqual({
      boardTheme: "sumi",
      stoneSet: "jade",
      grid: "lines",
      showCoordinates: false,
      showMoveNumbers: true,
    });
  });

  it("drops one bad field and keeps the rest", () => {
    // The point of doing it field by field: a theme that no longer exists
    // must not throw away the stone set the member also chose.
    expect(cleanAppearance({ boardTheme: "mahogany", stoneSet: "sakura" })).toEqual({
      stoneSet: "sakura",
    });
  });

  it("refuses anything that is not an appearance at all", () => {
    for (const stored of [null, undefined, 7, "kaya", [], [{ boardTheme: "sumi" }]]) {
      expect(cleanAppearance(stored)).toEqual({});
    }
  });

  it("refuses a switch that is not a switch", () => {
    expect(cleanAppearance({ showCoordinates: "yes", showMoveNumbers: 1 })).toEqual({});
  });

  it("will not be talked into a theme by prototype", () => {
    // "toString" is in every object; it is not a board theme.
    expect(cleanAppearance({ boardTheme: "toString", stoneSet: "constructor" })).toEqual({});
  });

  it("falls back field by field, not all or nothing", () => {
    const whole = appearanceFrom({ boardTheme: "washi", stoneSet: "nonsense" });
    expect(whole.boardTheme).toBe("washi");
    expect(whole.stoneSet).toBe(DEFAULT_APPEARANCE.stoneSet);
    expect(whole.grid).toBe(DEFAULT_APPEARANCE.grid);
  });

  it("gives the ordinary board when the member has never chosen one", () => {
    expect(appearanceFrom(null)).toEqual(DEFAULT_APPEARANCE);
  });
});

describe("noticing a real change", () => {
  it("says nothing changed when nothing did", () => {
    expect(sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE })).toBe(true);
  });

  it("notices each field on its own", () => {
    // A board is redrawn constantly, and writing to the account on every
    // render is the shape of thing that has already cost this site a day.
    expect(sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, boardTheme: "sumi" })).toBe(false);
    expect(sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, stoneSet: "jade" })).toBe(false);
    expect(sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, grid: "cells" })).toBe(false);
    expect(
      sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, showCoordinates: !DEFAULT_APPEARANCE.showCoordinates }),
    ).toBe(false);
    expect(
      sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, showMoveNumbers: !DEFAULT_APPEARANCE.showMoveNumbers }),
    ).toBe(false);
  });
});

describe("where the stones sit", () => {
  /*
   * The traditional view reads the game's own row and works nothing out.
   * Tic-tac-toe is the case that used to go wrong: in its mechanics it is
   * gomoku on a small board, so an answer inferred from the rules put it on
   * the lines — and it is drawn in the squares by everybody who has ever
   * played it.
   */
  it("draws each game the way that game is drawn", () => {
    expect(gridFor(DEFAULT_APPEARANCE, VARIANT_SPECS.tictactoe)).toBe(BOARD_GRIDS.cells);
    expect(gridFor(DEFAULT_APPEARANCE, VARIANT_SPECS.freestyle)).toBe(BOARD_GRIDS.lines);
    expect(gridFor(DEFAULT_APPEARANCE, VARIANT_SPECS.reversi)).toBe(BOARD_GRIDS.cells);
    expect(gridFor(DEFAULT_APPEARANCE, VARIANT_SPECS.go)).toBe(BOARD_GRIDS.lines);
  });

  it("is the traditional view unless the member has chosen otherwise", () => {
    expect(DEFAULT_APPEARANCE.grid).toBe("auto");
  });

  it("puts every game on the crossings in the Itsutsu view, tic-tac-toe included", () => {
    const itsutsu = { ...DEFAULT_APPEARANCE, grid: BOARD_GRIDS.lines };
    expect(gridFor(itsutsu, VARIANT_SPECS.tictactoe)).toBe(BOARD_GRIDS.lines);
    expect(gridFor(itsutsu, VARIANT_SPECS.checkers)).toBe(BOARD_GRIDS.lines);
  });

  it("puts every game in the squares in the squares view, gomoku included", () => {
    const squares = { ...DEFAULT_APPEARANCE, grid: BOARD_GRIDS.cells };
    expect(gridFor(squares, VARIANT_SPECS.freestyle)).toBe(BOARD_GRIDS.cells);
    expect(gridFor(squares, VARIANT_SPECS.go)).toBe(BOARD_GRIDS.cells);
  });
});
