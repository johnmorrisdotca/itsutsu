import { describe, expect, it } from "vitest";

import { GAME_ADDED } from "./gameAdded.data";
import { EVERY_GAME_KEY } from "./gameKeys";

/**
 * THE NEW-GAMES GATE: every game says the day it arrived.
 *
 * The Everyone feed announces a day's new games (John, 2026-09-26: "post a
 * message when a new game is introduced to the site"), and it can only
 * announce a game that is dated. A game added without a date would arrive in
 * silence — the one game the line exists for — so a missing date fails the
 * build. The fix is one command, which reads the date from git:
 *
 *   pnpm games:added
 */
describe("the day every game arrived", () => {
  it("is written down for every game and puzzle in the catalogue", () => {
    const missing = EVERY_GAME_KEY.filter((key) => !(key in GAME_ADDED));
    expect(missing, "run `pnpm games:added` to date these").toEqual([]);
  });

  it("names nothing that is not in the catalogue", () => {
    const known = new Set<string>(EVERY_GAME_KEY);
    expect(Object.keys(GAME_ADDED).filter((key) => !known.has(key))).toEqual([]);
  });

  it("is a real calendar day, written YYYY-MM-DD", () => {
    for (const [key, day] of Object.entries(GAME_ADDED)) {
      expect(day, key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10), key).toBe(day);
    }
  });

  it("is never a day that has not happened yet", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    for (const [key, day] of Object.entries(GAME_ADDED)) expect(day <= tomorrow, `${key} is dated ${day}`).toBe(true);
  });
});
