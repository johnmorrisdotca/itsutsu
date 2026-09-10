import { describe, expect, it } from "vitest";

import { boardStartsFlipped, homeRowOf } from "./orientation";
import { createGame } from "./engine";
import { DEFAULT_SETTINGS, RULE_VARIANT_LIST, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { layoutOrder } from "@/components/board/flip";
import type { GameSettings, Stone } from "./gomoku.types";

/**
 * A board is drawn from the side of the person looking at it.
 *
 * John, opening Halma: the board feels backwards. It was — his camp was the
 * far corner, because every board was drawn the same way round for everybody
 * regardless of which seat they were in.
 *
 * The tests that matter here are the last two. The first few name games and
 * would keep passing if the rule were a table of variants somebody wrote out;
 * the property tests ask the thing actually promised — that whoever you are,
 * your own men start nearest you, and that the two players see the same board
 * from opposite ends.
 */
function settingsFor(variant: (typeof RULE_VARIANT_LIST)[number]): GameSettings {
  const sizes = VARIANT_SPECS[variant].boardSizes;
  return { ...DEFAULT_SETTINGS, variant, size: sizes === null ? DEFAULT_SETTINGS.size : sizes[0] };
}

/** The row a stored row is drawn at, once the board has been turned or not. */
function drawnRow(size: number, row: number, flipped: boolean): number {
  return layoutOrder(size, flipped).indexOf(row);
}

/** Where a colour's men average once drawn, as a fraction down the board. */
function drawnHome(settings: GameSettings, stone: Stone, flipped: boolean): number | null {
  const home = homeRowOf(settings, stone);
  return home === null ? null : drawnRow(settings.size, Math.round(home), flipped);
}

describe("which way round a board is drawn", () => {
  it("turns Halma round for the player whose camp is the far corner", () => {
    // The game John was looking at. Black's camp is the first rows; white's is
    // mirrored into the last, so only one of them was ever facing it right.
    const halma = settingsFor("halma");
    expect(boardStartsFlipped(halma, STONES.black)).toBe(true);
    expect(boardStartsFlipped(halma, STONES.white)).toBe(false);
  });

  it("does the same in checkers, which sets out the same way", () => {
    const checkers = settingsFor("checkers");
    expect(boardStartsFlipped(checkers, STONES.black)).toBe(true);
    expect(boardStartsFlipped(checkers, STONES.white)).toBe(false);
  });

  it("leaves a game that starts empty exactly as it was", () => {
    // Gomoku, Go and Hex have no sides before anybody plays, so there is
    // nothing to face and nothing should move.
    for (const variant of ["freestyle", "go", "hex"] as const) {
      const settings = settingsFor(variant);
      expect(homeRowOf(settings, STONES.black), `${variant} has a home row`).toBeNull();
      expect(boardStartsFlipped(settings, STONES.black), variant).toBe(false);
      expect(boardStartsFlipped(settings, STONES.white), variant).toBe(false);
    }
  });

  it("leaves Reversi alone, because its four discs share the middle", () => {
    // Both colours average the exact centre row: neither is behind the other,
    // so neither board is turned. Dead centre is not a side.
    const reversi = settingsFor("reversi");
    expect(homeRowOf(reversi, STONES.black)).toBe((reversi.size - 1) / 2);
    expect(boardStartsFlipped(reversi, STONES.black)).toBe(false);
    expect(boardStartsFlipped(reversi, STONES.white)).toBe(false);
  });

  it("does not turn a board for somebody who is not sitting at it", () => {
    // A watcher, an embed, a replay: no seat, so no side.
    expect(boardStartsFlipped(settingsFor("halma"), null)).toBe(false);
  });

  it("puts your own men nearest you, in every game that sets men out", () => {
    /*
     * The promise itself, asked of every variant rather than of the two that
     * were named. A variant added tomorrow is covered the day it lands, and a
     * variant that put white at the top would pass this without anybody
     * having to remember to add it to a list.
     */
    const checked: string[] = [];
    for (const variant of RULE_VARIANT_LIST) {
      const settings = settingsFor(variant);
      const middle = (settings.size - 1) / 2;
      for (const stone of [STONES.black, STONES.white]) {
        const home = homeRowOf(settings, stone);
        // Nothing set out, or set out dead centre: no side to face.
        if (home === null || home === middle) continue;
        const drawn = drawnHome(settings, stone, boardStartsFlipped(settings, stone));
        expect(drawn, `${variant}: ${stone} does not start nearest itself`).toBeGreaterThan(middle);
        checked.push(`${variant}/${stone}`);
      }
    }
    // The sweep has to have found something, or it proves nothing at all.
    expect(checked.length, "no variant sets men out on a side").toBeGreaterThan(3);
  });

  it("shows the two players the same board from opposite ends", () => {
    // Mirrored, which is what makes it first-person for both at once rather
    // than for whoever the site happened to favour.
    for (const variant of RULE_VARIANT_LIST) {
      const settings = settingsFor(variant);
      const black = homeRowOf(settings, STONES.black);
      const white = homeRowOf(settings, STONES.white);
      if (black === null || white === null || black === white) continue;
      expect(
        boardStartsFlipped(settings, STONES.black),
        `${variant}: both seats are drawn the same way up`,
      ).not.toBe(boardStartsFlipped(settings, STONES.white));
    }
  });

  it("reads the position rather than a list of variants", () => {
    // createGame is what actually lays a board out, so if these two ever
    // disagreed the rule would be reading something that is not the game.
    const halma = settingsFor("halma");
    const started = createGame(halma);
    const rows = started.board
      .map((cell, index) => (cell === STONES.black ? Math.floor(index / halma.size) : null))
      .filter((row): row is number => row !== null);
    const mean = rows.reduce((a, b) => a + b, 0) / rows.length;
    expect(homeRowOf(halma, STONES.black)).toBe(mean);
  });
});
