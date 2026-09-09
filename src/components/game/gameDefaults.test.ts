import { describe, expect, it } from "vitest";

import { ALL_BOARD_SIZES, DEFAULT_SETTINGS } from "@/lib/gomoku/gomoku.constants";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";

import {
  DEFAULT_GAME_DEFAULTS,
  boardSettingsFrom,
  cleanGameDefaults,
  gameDefaultsFrom,
} from "./gameDefaults";

/**
 * Where a new game starts for a member.
 *
 * Stored as JSON, so it comes back as whatever is in the column: a board size
 * retired between releases, a clock that no longer exists, a row somebody
 * edited. Each field is checked on its own, because one bad value must not
 * throw away the other five choices somebody made.
 *
 * The other thing held here is what these are *not*. They are a starting
 * point; a game already under way is never touched by them.
 */
describe("reading a member's starting point", () => {
  it("keeps every choice that names something this site offers", () => {
    const stored = {
      size: 19,
      allowUndo: false,
      allowSkip: true,
      allowSwap: true,
      allowResize: true,
      drawLimit: "half",
      timeControl: "rapid",
      moveTimeMs: MOVE_TIME_OPTIONS[2],
      rated: false,
    };
    expect(cleanGameDefaults(stored)).toEqual(stored);
  });

  it("drops one bad field and keeps the rest", () => {
    expect(cleanGameDefaults({ size: 12, timeControl: "blitz" })).toEqual({ timeControl: "blitz" });
  });

  it("refuses anything that is not a set of defaults at all", () => {
    for (const stored of [null, undefined, 9, "19", [], [{ size: 19 }]]) {
      expect(cleanGameDefaults(stored)).toEqual({});
    }
  });

  it("refuses a switch that is not a switch", () => {
    expect(cleanGameDefaults({ allowUndo: "yes", rated: 1 })).toEqual({});
  });

  it("will not be talked into a clock by prototype", () => {
    expect(cleanGameDefaults({ timeControl: "toString", drawLimit: "constructor" })).toEqual({});
  });

  it("takes no clock as a real answer, not a missing one", () => {
    // null means "no clock", which is different from saying nothing.
    expect(cleanGameDefaults({ moveTimeMs: null })).toEqual({ moveTimeMs: null });
    expect(cleanGameDefaults({ moveTimeMs: 7 })).toEqual({});
  });

  it("offers only board sizes the site really has", () => {
    for (const size of ALL_BOARD_SIZES) {
      expect(cleanGameDefaults({ size })).toEqual({ size });
    }
    for (const size of [0, 2, 12, 14, 20, 100]) {
      expect(cleanGameDefaults({ size }), `${size}`).toEqual({});
    }
  });

  it("falls back field by field, not all or nothing", () => {
    const whole = gameDefaultsFrom({ size: 19, timeControl: "nonsense" });
    expect(whole.size).toBe(19);
    expect(whole.timeControl).toBe(DEFAULT_GAME_DEFAULTS.timeControl);
  });

  it("gives the ordinary starting point when nothing was ever chosen", () => {
    expect(gameDefaultsFrom(null)).toEqual(DEFAULT_GAME_DEFAULTS);
  });

  it("starts from the same place a game with no member does", () => {
    // Somebody signed out and somebody who has never chosen get the same
    // board, which is what makes this a preference rather than a change.
    expect(DEFAULT_GAME_DEFAULTS.size).toBe(DEFAULT_SETTINGS.size);
    expect(DEFAULT_GAME_DEFAULTS.allowUndo).toBe(DEFAULT_SETTINGS.allowUndo);
    expect(DEFAULT_GAME_DEFAULTS.allowSkip).toBe(DEFAULT_SETTINGS.allowSkip);
    expect(DEFAULT_GAME_DEFAULTS.allowSwap).toBe(DEFAULT_SETTINGS.allowSwap);
    expect(DEFAULT_GAME_DEFAULTS.allowResize).toBe(DEFAULT_SETTINGS.allowResize);
    expect(DEFAULT_GAME_DEFAULTS.drawLimit).toBe(DEFAULT_SETTINGS.drawLimit);
  });
});

describe("what a new board is started from", () => {
  it("carries only the rules of the board, not the clock or the rating", () => {
    // A shared game's clock and whether it counts are asked for where a
    // shared game is started; they are not part of a board.
    const board = boardSettingsFrom({ ...DEFAULT_GAME_DEFAULTS, size: 19, rated: false });
    expect(board).toEqual({
      size: 19,
      allowUndo: DEFAULT_GAME_DEFAULTS.allowUndo,
      allowSkip: DEFAULT_GAME_DEFAULTS.allowSkip,
      allowSwap: DEFAULT_GAME_DEFAULTS.allowSwap,
      allowResize: DEFAULT_GAME_DEFAULTS.allowResize,
      drawLimit: DEFAULT_GAME_DEFAULTS.drawLimit,
    });
    expect(board).not.toHaveProperty("rated");
    expect(board).not.toHaveProperty("timeControl");
    expect(board).not.toHaveProperty("moveTimeMs");
  });

  it("never carries a variant, so an address always names the game", () => {
    // /games/hex is Hex whatever anybody's standing choices say.
    expect(boardSettingsFrom(DEFAULT_GAME_DEFAULTS)).not.toHaveProperty("variant");
  });
});
