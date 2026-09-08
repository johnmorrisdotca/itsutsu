import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { openSetup, playSequence } from "./support";
import { COLUMN_LETTERS } from "../src/lib/gomoku/board.constants";

/**
 * One screenshot per game, mid-play, into public/art/games/ for the rules pages.
 * Run on purpose with `pnpm screenshots:games`; it is not part of the
 * ordinary suite, because it writes files into the repo.
 */
const OUT = "public/art/games";

/** A short scripted position per game: enough stones to show what it looks like. */
const SCENES: Record<
  string,
  {
    size: number;
    moves: [number, number][];
    twists?: [number, boolean][];
    colours?: ("black" | "white")[];
    /** The race games: pieces already down, so the scene is a run of moves, black first. */
    slides?: [[number, number], [number, number]][];
  }
> = {
  freestyle: { size: 15, moves: [[7, 7], [7, 8], [8, 8], [6, 6], [6, 8], [8, 6], [9, 9], [5, 5]] },
  standard: { size: 15, moves: [[7, 7], [6, 8], [8, 6], [9, 5], [8, 8], [8, 7], [6, 6]] },
  renju: { size: 15, moves: [[7, 7], [7, 8], [8, 8], [6, 6], [9, 9], [10, 10], [6, 8]] },
  omok: { size: 15, moves: [[7, 7], [7, 8], [8, 8], [6, 6], [8, 6], [6, 8]] },
  caro: { size: 15, moves: [[7, 7], [7, 8], [8, 7], [9, 7], [8, 8], [6, 7], [9, 9]] },
  ninuki: { size: 19, moves: [[9, 9], [9, 10], [9, 11], [10, 10], [11, 11], [8, 8]] },
  connect6: { size: 19, moves: [[9, 9], [9, 10], [10, 10], [8, 8], [8, 10]] },
  dominoFive: { size: 15, moves: [[7, 7], [5, 5], [9, 9], [7, 3]] },
  blockFive: { size: 15, moves: [[6, 6], [9, 9], [3, 3]] },
  dropFour: { size: 7, moves: [[0, 3], [0, 3], [0, 2], [0, 4], [0, 2], [0, 1]] },
  ringDrop: { size: 7, moves: [[0, 0], [0, 6], [0, 1], [0, 5], [0, 0]] },
  holeDrop: { size: 7, moves: [[0, 3], [0, 2], [0, 4], [0, 3]] },
  hotDrop: { size: 7, moves: [[0, 3], [0, 2], [0, 4], [0, 3]] },
  clearDrop: { size: 7, moves: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
  giveawayDrop: { size: 7, moves: [[0, 1], [0, 5], [0, 2], [0, 4]] },
  edgeDrop: { size: 7, moves: [[0, 3], [6, 3], [1, 3], [5, 3], [0, 4]] },
  twistFive: { size: 6, moves: [[0, 0], [5, 5], [1, 1]], twists: [[0, true], [3, false], [1, true]] },
  twistFour: { size: 4, moves: [[0, 0], [3, 3]], twists: [[0, true], [3, true]] },
  trapThree: { size: 5, moves: [[1, 1], [3, 3], [1, 3], [3, 1]] },
  squareFour: { size: 5, moves: [[0, 0], [4, 4], [0, 1], [4, 3], [1, 0], [3, 4], [2, 2], [3, 0]] },
  tictactoe: { size: 3, moves: [[1, 1], [0, 0], [2, 2], [0, 2], [0, 1]] },
  sannuki: { size: 19, moves: [[9, 9], [9, 10], [9, 11], [9, 12], [10, 10], [8, 8], [9, 13]] },
  wormDrop: { size: 7, moves: [[0, 3], [0, 2], [0, 4], [0, 3], [0, 5]] },
  misereFive: { size: 15, moves: [[7, 7], [7, 8], [8, 8], [6, 6], [6, 8], [8, 6]] },
  makerBreaker: { size: 6, moves: [[2, 1], [2, 2], [3, 3], [2, 3], [1, 1], [4, 4]], colours: ["black", "black", "white", "black", "white", "white"] },
  wildTicTacToe: { size: 3, moves: [[1, 1], [0, 0], [2, 2]], colours: ["white", "black", "white"] },
  notakto: { size: 3, moves: [[1, 1], [0, 0], [2, 1]] },
  toroidalFive: { size: 15, moves: [[0, 7], [7, 0], [14, 8], [7, 14], [1, 6], [13, 9]] },
  obstacleFive: { size: 15, moves: [[7, 7], [7, 8], [8, 8], [6, 6], [6, 8], [8, 6]] },
  reversi: { size: 8, moves: [[2, 3], [2, 4], [2, 5], [4, 2], [5, 3]] },
  classicReversi: { size: 8, moves: [[3, 3], [3, 4], [4, 4], [4, 3], [2, 4], [2, 3], [2, 2]] },
  antiReversi: { size: 8, moves: [[2, 3], [2, 4], [2, 5], [4, 2], [5, 3]] },
  miniReversi: { size: 4, moves: [[0, 1], [0, 2], [0, 3]] },
  grandReversi: { size: 10, moves: [[3, 4], [3, 5], [3, 6], [5, 3], [6, 4]] },
  halma: {
    size: 16,
    moves: [],
    slides: [
      [[4, 1], [5, 2]], [[11, 14], [10, 13]], [[3, 2], [4, 3]], [[12, 13], [11, 12]],
      [[4, 0], [5, 1]], [[11, 15], [10, 14]], [[2, 3], [3, 3]], [[13, 12], [12, 12]],
    ],
  },
};

test.describe("game screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const [variant, scene] of Object.entries(SCENES)) {
    test(`${variant}`, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      await page.goto("/games/gomoku");
      await openSetup(page);
      await page.getByTestId("rules").selectOption(variant);
      // The piece games lay a piece per click; the rest a stone.
      for (const [index, [row, col]] of scene.moves.entries()) {
        const colour = scene.colours?.[index];
        if (colour !== undefined) await page.getByTestId(`place-${colour}`).click();
        await playSequence(page, scene.size, [[row, col]]).catch(() => {});
        const twist = scene.twists?.[index];
        if (twist !== undefined) {
          const control = page.getByTestId(`twist-${twist[0]}-${twist[1] ? "cw" : "ccw"}`);
          if (await control.count()) await control.click();
        }
      }
      for (const [index, [from, to]] of (scene.slides ?? []).entries()) {
        const colour = index % 2 === 0 ? "Black" : "White";
        await page.getByRole("button", { name: `${COLUMN_LETTERS[from[1]]}${scene.size - from[0]}, ${colour} stone` }).click();
        await page.getByRole("button", { name: new RegExp(`^${COLUMN_LETTERS[to[1]]}${scene.size - to[0]}, empty$`) }).click();
      }
      const board = page.locator(".aspect-square").first();
      await expect(board).toBeVisible();
      await board.screenshot({ path: `${OUT}/${variant}.jpg`, type: "jpeg", quality: 82 });
    });
  }
});
