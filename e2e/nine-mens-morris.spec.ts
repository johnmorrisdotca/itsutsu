import { expect, test, type Page } from "@playwright/test";

import { createGame, inMovePhase, legalPoints, movePiece, pieceMoves, playMove, pointOf } from "../src/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import type { GameState, Point } from "../src/lib/gomoku/gomoku.types";
import { seededRandom } from "../src/lib/gomoku/rules/random";

/**
 * NINE MEN'S MORRIS, on the practice board, played by pressing its points. Its own: three squares and no grid, three in a line
 * take a man, and the point pressed next is the man taken. A game played right through to a side's last men is made by the engine out of a
 * seed and then pressed through the page, so the ending read here is one a player reaches.
 */
const AT = "/games/nine-mens-morris/play";

/** How a screen reader, and so a spec, names a point: its column letter and its row counted from the bottom. */
const name = (point: Point) => `${String.fromCharCode(65 + point.col)}${7 - point.row}`;
const empty = (page: Page, point: Point) => page.getByRole("button", { name: new RegExp(`^${name(point)}, empty`) });
const stone = (page: Page, point: Point) => page.getByRole("button", { name: new RegExp(`^${name(point)}, (Black|White) stone`) });

async function open(page: Page) {
  await page.goto(AT);
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(AT);
  await expect(page.getByTestId("mill-lines")).toBeVisible();
}

const at = (row: number, col: number): Point => ({ row, col });

/** A whole game from a seed: black takes a mill wherever it can, and both otherwise move at random. */
function wholeGame(seed: number) {
  const random = seededRandom(seed);
  let state: GameState = createGame({ variant: RULE_VARIANTS.nineMensMorris, size: 7 });
  const presses: { kind: "point"; point: Point; takes: boolean; }[] = [];
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
  for (let step = 0; step < 900 && state.status === GAME_STATUS.playing; step += 1) {
    if (inMovePhase(state)) {
      const own = state.board.flatMap((cell, index) => (cell === state.toPlay ? [pointOf(7, index)] : []));
      const options = own.flatMap((from) => pieceMoves(state, from).map((to) => ({ from, to })));
      const tried = options.map((move) => ({ move, after: movePiece(state, move.from, move.to) }));
      const mills = tried.filter((each) => each.after.pendingRemoval);
      const chosen = state.toPlay === "black" && mills.length > 0 ? pick(mills) : pick(tried);
      presses.push({ kind: "point", point: chosen.move.from, takes: false }, { kind: "point", point: chosen.move.to, takes: false });
      state = chosen.after;
    } else {
      const legal = legalPoints(state);
      const tried = legal.map((point) => ({ point, after: playMove(state, point) }));
      const mills = tried.filter((each) => each.after.pendingRemoval);
      const taking = state.pendingRemoval;
      const chosen = state.toPlay === "black" && mills.length > 0 ? pick(mills) : pick(tried);
      presses.push({ kind: "point", point: chosen.point, takes: taking });
      state = chosen.after;
    }
  }
  return { state, presses };
}

test.describe("Nine Men's Morris, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, at home in Small boards, and say what a mill does", async ({ page }) => {
    await page.goto("/games/nine-mens-morris");
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Nine Men's Morris");
    await expect(page.getByTestId("game-family")).toContainText("Small boards");
    await page.goto("/games/nine-mens-morris/rules");
    await expect(page.locator("main")).toContainText("down to two men");
    await expect(page.locator("main")).toContainText("each mill takes one");
    await expect(page.locator("main")).not.toContainText("A full board");
  });
});

test.describe("Nine Men's Morris", () => {
  test("a man goes only on a point of the three squares", async ({ page }) => {
    await open(page);
    await expect(empty(page, at(0, 0))).toBeEnabled();
    // Off the lines there is nothing to press at all: the grid's other places are no part of this board.
    await expect(page.getByRole("button", { name: /^B7/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^D4/ })).toBeDisabled();
  });

  test("three in a line keep the turn, the page says to take a man, and the man pressed comes off", async ({ page }) => {
    await open(page);
    for (const point of [at(0, 0), at(6, 0), at(0, 3), at(6, 3)]) await empty(page, point).click();
    await expect(page.getByTestId("to-play")).toContainText("Black");
    await empty(page, at(0, 6)).click();
    // Black's turn still, and the board asks for a man.
    await expect(page.getByTestId("to-play")).toContainText("Black");
    await expect(page.getByTestId("variant-line")).toContainText("Take one of your opponent's men");
    // Black's own men and the empty points cannot be pressed now.
    await expect(stone(page, at(0, 0))).toBeDisabled();
    await expect(empty(page, at(3, 0))).toBeDisabled();
    await stone(page, at(6, 0)).click();
    await expect(empty(page, at(6, 0))).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
    await expect(page.getByText("Take one of your opponent's men")).toHaveCount(0);
  });

  test("played right through, a side brought down to two men has lost and the page says who won", async ({ page }) => {
    test.setTimeout(240_000);
    let game = wholeGame(1);
    for (let seed = 2; game.state.status !== GAME_STATUS.won || game.state.winBy !== "reduced" || game.presses.length > 160; seed += 1) game = wholeGame(seed);
    await open(page);
    for (const press of game.presses) {
      await page.getByRole("button", { name: new RegExp(`^${name(press.point)},`) }).click();
    }
    await expect(page.getByTestId("to-play").or(page.getByTestId("game-status")).first()).toBeVisible();
    await expect(page.locator("main")).toContainText("down to two men");
  });
});
