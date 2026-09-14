import { describe, expect, it } from "vitest";

import { xpLevelName } from "./levelNames";
import { flashAboutGame, toToasts, type XpFlashToShow } from "./xpFlash";

/**
 * THE RESULT CARD SAYS A GAME-END BATCH, NOT A GUESS AT ONE.
 *
 * The card over a finished game stands in for the toasts that batch would have
 * stacked over the board, so what it says has to be exactly what they would have
 * said: the same awards summed, and the same level note.
 */

const AT = "2026-09-14T10:00:00.000Z";

function flash(about: string | null, level?: { level: number; reached: boolean }): XpFlashToShow {
  const stored = {
    at: AT,
    awards: [
      { type: "gameFinished", points: 25 },
      { type: "gameWon", points: 50 },
    ],
    ...(level === undefined ? {} : { level }),
  };
  return { at: AT, about, toasts: toToasts(stored) };
}

describe("the XP a game-end batch paid, as the result card says it", () => {
  it("is the batch's toasts summed, and names the stamp they are held by", () => {
    const shown = flash("g1");
    expect(flashAboutGame(shown, "g1")).toEqual({
      points: shown.toasts.reduce((total, toast) => total + toast.points, 0),
      level: null,
      heldFlashAt: AT,
    });
    expect(flashAboutGame(shown, "g1")?.points).toBe(75);
  });

  it("carries the level the toasts would have mentioned, reached or next", () => {
    expect(flashAboutGame(flash("g1", { level: 2, reached: true }), "g1")?.level).toEqual({
      name: xpLevelName(2),
      reached: true,
    });
    expect(flashAboutGame(flash("g1", { level: 9, reached: false }), "g1")?.level).toEqual({
      name: xpLevelName(9),
      reached: false,
    });
  });

  it("says nothing for a batch about another game, about no game, or no flash at all", () => {
    expect(flashAboutGame(flash("g2"), "g1")).toBeNull();
    expect(flashAboutGame(flash(null), "g1")).toBeNull();
    expect(flashAboutGame(null, "g1")).toBeNull();
  });
});
