import { expect, test, type Page } from "@playwright/test";

import { createGame, inMovePhase, legalPoints, movePiece, pieceMoves, playMove, pointOf } from "../src/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import type { GameState, Point, RuleVariant } from "../src/lib/gomoku/gomoku.types";
import { seededRandom } from "../src/lib/gomoku/rules/random";

/**
 * BREAKTHROUGH, LINES OF ACTION AND AMAZONS, on the practice board, played by pressing their squares. Each game's own move is driven through the
 * page, and a whole game made by the engine from a seed is pressed through it, so the ending read here is one a player reaches.
 */
const name = (size: number, point: Point) => `${String.fromCharCode(65 + point.col)}${size - point.row}`;

const square = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label},`) });
const empty = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label}, empty`) });

async function open(page: Page, address: string) {
  await page.goto(`/games/${address}/play`);
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(`/games/${address}/play`);
  await expect(page.getByTestId("to-play")).toBeVisible();
}

/** Presses one man to another square. */
async function step(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

/** How many separate groups a colour's men are in, touching along sides or corners. */
function groups(state: GameState, stone: string, size: number) {
  const seen = new Set<number>();
  let count = 0;
  state.board.forEach((cell, index) => {
    if (cell !== stone || seen.has(index)) return;
    count += 1;
    const stack = [index];
    seen.add(index);
    while (stack.length > 0) {
      const { row, col } = pointOf(size, stack.pop()!);
      for (let r = row - 1; r <= row + 1; r += 1) {
        for (let c = col - 1; c <= col + 1; c += 1) {
          if (r < 0 || c < 0 || r >= size || c >= size) continue;
          const next = r * size + c;
          if (state.board[next] === stone && !seen.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
    }
  });
  return count;
}

/** A whole game from a seed, written as presses: the first player plays to `score` as low as it goes, and the other at random. */
function wholeGame(variant: RuleVariant, size: number, seed: number, score: (state: GameState, stone: string) => number) {
  const random = seededRandom(seed);
  let state: GameState = createGame({ variant, size });
  const first = state.toPlay;
  const presses: Point[] = [];
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
  const best = <T,>(list: readonly { move: T; after: GameState }[]) => {
    const scored = list.map((each) => ({ each, value: score(each.after, first) }));
    const lowest = Math.min(...scored.map((each) => each.value));
    return pick(scored.filter((each) => each.value === lowest)).each;
  };
  for (let turn = 0; turn < 600 && state.status === GAME_STATUS.playing; turn += 1) {
    if (inMovePhase(state)) {
      const own = state.board.flatMap((cell, index) => (cell === state.toPlay ? [pointOf(size, index)] : []));
      const tried = own.flatMap((from) => pieceMoves(state, from).map((to) => ({ move: { from, to }, after: movePiece(state, from, to) })));
      const chosen = state.toPlay === first ? best(tried) : pick(tried);
      presses.push(chosen.move.from, chosen.move.to);
      state = chosen.after;
    } else {
      const tried = legalPoints(state).map((point) => ({ move: point, after: playMove(state, point) }));
      const chosen = state.toPlay === first ? best(tried) : pick(tried);
      presses.push(chosen.move);
      state = chosen.after;
    }
  }
  return { state, presses };
}

for (const [address, title, says] of [
  ["breakthrough", "Breakthrough", "far row"],
  ["lines-of-action", "Lines of Action", "one group"],
  ["amazons", "Amazons", "arrow"],
] as const) {
  test.describe(`${title}, for a reader with no account`, () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("its front door and rules are open, at home in Territory and races, and say how it is won", async ({ page }) => {
      await page.goto(`/games/${address}`);
      await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(title);
      await expect(page.getByTestId("game-family")).toContainText("Territory and races");
      await page.goto(`/games/${address}/rules`);
      await expect(page.locator("main")).toContainText(says);
      await expect(page.locator("main")).not.toContainText("A full board");
      await expect(page.locator("main")).not.toContainText("in a row wins");
    });
  });
}

test.describe("Breakthrough", () => {
  test("a man steps forward, a man straight ahead blocks it, and it takes on the diagonal", async ({ page }) => {
    await open(page, "breakthrough");
    await step(page, "A2", "A3");
    await step(page, "A7", "A6");
    await step(page, "A3", "A4");
    await step(page, "A6", "A5");
    // Straight ahead is white, so the man may only go on the diagonal.
    await square(page, "A4").click();
    await expect(square(page, "A5")).toBeDisabled();
    await expect(empty(page, "B5")).toBeEnabled();
    await empty(page, "B5").click();
    await expect(page.getByRole("button", { name: /^B5, Black stone/ })).toBeVisible();
    await step(page, "A5", "A4");
    await step(page, "B2", "B3");
    await step(page, "C7", "C6");
    // B5 takes the man on C6 by stepping onto it, and a man is gone from white's count.
    await square(page, "B5").click();
    await square(page, "C6").click();
    await expect(page.getByRole("button", { name: /^C6, Black stone/ })).toBeVisible();
  });

  test("played right through, the first man on the far row wins and the page says so", async ({ page }) => {
    test.setTimeout(240_000);
    // Black pushes its furthest man on: the score falls as a black man nears the top.
    const furthest = (state: GameState, stone: string) => Math.min(...state.board.flatMap((cell, index) => (cell === stone ? [pointOf(8, index).row] : [])));
    let game = wholeGame(RULE_VARIANTS.breakthrough, 8, 1, furthest);
    for (let seed = 2; game.state.winBy !== "reached" || game.presses.length > 120; seed += 1) game = wholeGame(RULE_VARIANTS.breakthrough, 8, seed, furthest);
    await open(page, "breakthrough");
    for (const press of game.presses) await square(page, name(8, press)).click();
    await expect(page.locator("main")).toContainText("reaching the far row");
  });
});

test.describe("Lines of Action", () => {
  test("a man goes exactly as far as there are men on its line, and jumps only its own", async ({ page }) => {
    await open(page, "lines-of-action");
    // B8's column holds two men, so it goes two squares and no other number.
    await square(page, "B8").click();
    await expect(empty(page, "B6")).toBeEnabled();
    await expect(empty(page, "B7")).toBeDisabled();
    await expect(empty(page, "B5")).toBeDisabled();
    await empty(page, "B6").click();
    await expect(page.getByRole("button", { name: /^B6, Black stone/ })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
    // A6's row now holds three men, so three squares, and the black man on B6 stands in the way: it may not be jumped.
    await square(page, "A6").click();
    await expect(empty(page, "C6")).toBeDisabled();
    await expect(empty(page, "D6")).toBeDisabled();
    // A5's row still holds two, so that one goes two squares.
    await square(page, "A5").click();
    await expect(empty(page, "C5")).toBeEnabled();
    await empty(page, "C5").click();
    await expect(page.getByRole("button", { name: /^C5, White stone/ })).toBeVisible();
    // Black's own man on B6 can be jumped by another of its men: F8's diagonal, and D8 over nothing, say the count again.
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("played right through, joining all your men wins and the page says so", async ({ page }) => {
    test.setTimeout(240_000);
    let game = wholeGame(RULE_VARIANTS.linesOfAction, 8, 1, (state, stone) => groups(state, stone, 8));
    for (let seed = 2; game.state.winBy !== "joined" || game.presses.length > 160; seed += 1) game = wholeGame(RULE_VARIANTS.linesOfAction, 8, seed, (state, stone) => groups(state, stone, 8));
    await open(page, "lines-of-action");
    for (const press of game.presses) await square(page, name(8, press)).click();
    await expect(page.locator("main")).toContainText("joining all their men");
  });
});

test.describe("Amazons", () => {
  test("a turn is a queen's move and then an arrow, and the arrow's square is gone", async ({ page }) => {
    await open(page, "amazons");
    await expect(page.getByTestId("to-play")).toContainText("White");
    await step(page, "D1", "D5");
    // Still white's turn, and the page asks for the arrow.
    await expect(page.getByTestId("to-play")).toContainText("White");
    await expect(page.getByTestId("variant-line")).toContainText("Now shoot an arrow");
    // Only squares the queen reaches can be pressed: not one off her lines, and no other queen.
    await expect(empty(page, "E7")).toBeDisabled();
    await expect(square(page, "G1")).toBeDisabled();
    await empty(page, "G5").click();
    await expect(page.getByTestId("to-play")).toContainText("Black");
    await expect(page.getByText("Now shoot an arrow")).toHaveCount(0);
    // The arrow's square cannot be stopped on, and it stands in the way of a queen on its line.
    await square(page, "G10").click();
    await expect(empty(page, "G6")).toBeEnabled();
    await expect(square(page, "G5")).toBeDisabled();
    await expect(empty(page, "G4")).toBeDisabled();
  });

  test("the last arrow leaves a side no move, a kept game comes back with its arrows, and the page says who won", async ({ page }) => {
    // White keeps as many squares to go to as it can, and black plays at random. Pressing a whole game of a hundred-odd turns would cost every
    // release minutes, so the game is kept as the browser would keep it and only its last turn is pressed.
    const room = (state: GameState, stone: string) => -state.board.reduce((sum, cell, index) => (cell === stone ? sum + pieceMoves({ ...state, toPlay: stone as GameState["toPlay"], pendingShot: null }, pointOf(10, index)).length : sum), 0);
    const game = wholeGame(RULE_VARIANTS.amazons, 10, 3, room);
    expect(game.state.status).toBe(GAME_STATUS.won);
    await open(page, "amazons");
    await step(page, "D1", "D5");
    await empty(page, "G5").click();
    await expect(page.getByTestId("to-play")).toContainText("Black");
    const before = game.state.moves.slice(0, -2);
    await page.evaluate((moves) => {
      const kept = JSON.parse(window.localStorage.getItem("gomoku.session.v1")!);
      window.localStorage.setItem("gomoku.session.v1", JSON.stringify({ ...kept, moves }));
    }, before);
    await page.goto("/games/amazons/play");
    await expect(page.getByTestId("to-play")).toBeVisible();
    const left = game.presses.slice(-3);
    for (const press of left) await square(page, name(10, press)).click();
    await expect(page.getByTestId("to-play")).toContainText("no move");
  });
});

