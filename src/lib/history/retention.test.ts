import { describe, expect, it } from "vitest";

import {
  KEEP_FINISHED_DAYS,
  KEEP_FINISHED_DEFAULT,
  KEEP_FINISHED_DISPLAY,
  isKeepFinishedDays,
  staysInMyList,
} from "./retention";

/**
 * How long a finished game stays in a member's own list.
 *
 * The thing to be careful about here is what it does *not* do. It hides a
 * finished game from one list; the record keeps everything, the ratings are
 * untouched, and every game is still at its own address. A test that let
 * this quietly become "delete old games" would be the expensive kind of
 * mistake, so the default is checked as hard as the behaviour.
 */
const NOW = new Date("2026-09-09T12:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

describe("keeping a finished game in your own list", () => {
  it("keeps everything until somebody asks otherwise", () => {
    expect(KEEP_FINISHED_DEFAULT).toBe(0);
    expect(staysInMyList(daysAgo(4000), KEEP_FINISHED_DEFAULT, NOW)).toBe(true);
  });

  it("keeps a game inside the window", () => {
    expect(staysInMyList(daysAgo(1), 14, NOW)).toBe(true);
    expect(staysInMyList(daysAgo(13), 14, NOW)).toBe(true);
  });

  it("lets go of one past it", () => {
    expect(staysInMyList(daysAgo(15), 14, NOW)).toBe(false);
    expect(staysInMyList(daysAgo(400), 90, NOW)).toBe(false);
  });

  it("keeps a game on the very day the window ends", () => {
    // A fortnight means a fortnight, not thirteen days: the boundary belongs
    // to the player, since they are the one who chose the number.
    expect(staysInMyList(daysAgo(14), 14, NOW)).toBe(true);
  });

  it("keeps a game finished in the future rather than hiding it", () => {
    // Clocks disagree, and a row a second ahead of this server must not
    // vanish from somebody's list because of it.
    expect(staysInMyList(daysAgo(-1), 7, NOW)).toBe(true);
  });

  it("keeps everything when the stored number makes no sense", () => {
    // A hand-edited row, or a column read back as something unexpected. The
    // safe answer is always to show the game.
    expect(staysInMyList(daysAgo(999), Number.NaN, NOW)).toBe(true);
    expect(staysInMyList(daysAgo(999), -5, NOW)).toBe(true);
    expect(staysInMyList("not a date", 7, NOW)).toBe(true);
  });

  it("offers only windows it can name", () => {
    for (const days of KEEP_FINISHED_DAYS) {
      expect(KEEP_FINISHED_DISPLAY[days], `${days} has no words`).toBeDefined();
      expect(KEEP_FINISHED_DISPLAY[days].label.length).toBeGreaterThan(2);
      expect(KEEP_FINISHED_DISPLAY[days].kanji.length).toBeGreaterThan(0);
    }
  });

  it("refuses a window it never offered", () => {
    for (const days of KEEP_FINISHED_DAYS) expect(isKeepFinishedDays(days)).toBe(true);
    for (const days of [1, 13, 365, -7, 0.5]) expect(isKeepFinishedDays(days)).toBe(false);
  });

  it("offers keeping everything, so the setting can always be undone", () => {
    expect((KEEP_FINISHED_DAYS as readonly number[])).toContain(0);
  });
});
