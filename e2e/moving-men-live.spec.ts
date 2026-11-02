import { expect, test, type Browser, type Page } from "@playwright/test";

import { createGame, inMovePhase, legalPoints, movePiece, pieceMoves, playMove, pointOf } from "../src/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import type { GameState, Point, RuleVariant } from "../src/lib/gomoku/gomoku.types";
import { seededRandom } from "../src/lib/gomoku/rules/random";
import { aComputerOpponent, chooseOpponent, openSetUpPage, startAndBegin, submitIfPending } from "./support";
import { gamesMade } from "./tidy";

/**
 * THE TWO-PART TURNS ON A REAL GAME, between two seats, through the moves route. A queen's move and its arrow, and a mill and the man it takes, are
 * two requests: the first must leave the turn where it is, keep the player on the board rather than carry them on to the next game, and the
 * server must hold the second to the rule as the browser does. And a game of each of the moving kinds is played through the route to its end.
 */
const tidyAway = gamesMade();

type Made = { id: string; blackToken: string; whiteToken: string };

const name = (size: number, point: Point) => `${String.fromCharCode(65 + point.col)}${size - point.row}`;
const square = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label},`) });

async function makeGame(page: Page, variant: RuleVariant, size: number): Promise<Made> {
  const made = await page.request.post("/api/games/live", { data: { variant, size, moveTimeMs: null } });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as Made;
  tidyAway(game.id);
  return game;
}

async function post(page: Page, game: Made, token: string, body: object) {
  const answer = await page.request.post(`/api/games/${game.id}/moves`, { data: { token, ...body } });
  expect(answer.status(), await answer.text()).toBe(201);
}

async function secondSeat(browser: Browser, address: string) {
  const context = await browser.newContext({ storageState: ".auth/player.json" });
  const page = await context.newPage();
  await page.goto(address);
  return { context, page };
}

test.describe("a real game of Amazons", () => {
  test("the queen and the arrow are each sent, the turn stays until the arrow lands, and the other seat sees both", async ({ page, browser }) => {
    const game = await makeGame(page, RULE_VARIANTS.amazons, 10);
    await page.goto(`/games/amazons/match/${game.id}/seat/${game.whiteToken}`);
    await square(page, "D1").click();
    await square(page, "D5").click();
    await submitIfPending(page);
    // Still on this board, and the page asks for the arrow.
    await expect(page.getByTestId("turn-owed")).toContainText("Now shoot an arrow");
    await expect(page).toHaveURL(new RegExp(game.id));

    // The server holds the arrow to the rule as the board does: off the queen's lines, it is refused.
    const refused = await page.request.post(`/api/games/${game.id}/moves`, { data: { token: game.whiteToken, row: 3, col: 4 } });
    expect(refused.ok()).toBe(false);

    await square(page, "G5").click();
    await submitIfPending(page);
    await expect(page.getByTestId("turn-owed")).toHaveCount(0);

    const black = await secondSeat(browser, `/games/amazons/match/${game.id}/seat/${game.blackToken}`);
    await expect(square(black.page, "D5")).toHaveAccessibleName(/White stone/);
    await square(black.page, "G10").click();
    await square(black.page, "G6").click();
    await submitIfPending(black.page);
    await expect(black.page.getByTestId("turn-owed")).toContainText("Now shoot an arrow");
    await square(black.page, "B6").click();
    await submitIfPending(black.page);
    await black.context.close();
  });
});

test.describe("a program in the other seat", () => {
  test("shoots its own arrow, in this browser, and the game goes back to the player", async ({ page }) => {
    test.setTimeout(120_000);
    await openSetUpPage(page, "amazons");
    await chooseOpponent(page, await aComputerOpponent(page));
    await startAndBegin(page);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move", { timeout: 60_000 });
    await expect(page.getByTestId("turn-owed")).toHaveCount(0);
    const empties = () => page.getByRole("button", { name: /, empty/ }).count();
    const before = await empties();
    const mine = (await page.getByTestId("turn-banner").innerText()).includes("you are White") ? "White" : "Black";
    await page.getByRole("button", { name: new RegExp(`, ${mine} stone`) }).first().click();
    await page.locator('button[aria-label*=", empty"]:enabled').first().click();
    await submitIfPending(page);
    await expect(page.getByTestId("turn-owed")).toContainText("Now shoot an arrow");
    await page.locator('button[aria-label*=", empty"]:enabled').first().click();
    await submitIfPending(page);
    // Two arrows have landed, the player's and the program's: every other square a queen left, another one took.
    await expect.poll(empties, { timeout: 60_000 }).toBe(before - 2);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move", { timeout: 60_000 });
  });
});

test.describe("a real game of Nine Men's Morris", () => {
  test("a mill keeps the turn, the man is pressed and sent, and the server refuses one that may not be taken", async ({ page }) => {
    const game = await makeGame(page, RULE_VARIANTS.nineMensMorris, 7);
    await post(page, game, game.blackToken, { row: 0, col: 0 });
    await post(page, game, game.whiteToken, { row: 6, col: 0 });
    await post(page, game, game.blackToken, { row: 0, col: 3 });
    await post(page, game, game.whiteToken, { row: 6, col: 3 });
    await page.goto(`/games/nine-mens-morris/match/${game.id}/seat/${game.blackToken}`);
    await square(page, "G7").click();
    await submitIfPending(page);
    await expect(page.getByTestId("turn-owed")).toContainText("Take one of your opponent's men");
    await expect(page).toHaveURL(new RegExp(game.id));

    // Black's own man is no man to take.
    const refused = await page.request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 0, col: 0 } });
    expect(refused.ok()).toBe(false);

    await square(page, "A1").click();
    await submitIfPending(page);
    await expect(square(page, "A1")).toHaveAccessibleName(/empty/);
    await expect(page.getByTestId("turn-owed")).toHaveCount(0);
  });
});

/** A whole game from a seed, as the bodies the route takes: black pushes on or joins up as `score` says, and white plays at random. */
function wholeGame(variant: RuleVariant, size: number, seed: number, score: (state: GameState) => number) {
  const random = seededRandom(seed);
  let state: GameState = createGame({ variant, size });
  const bodies: { stone: string; body: object }[] = [];
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
  for (let turn = 0; turn < 400 && state.status === GAME_STATUS.playing; turn += 1) {
    if (!inMovePhase(state)) {
      const point = pick(legalPoints(state));
      bodies.push({ stone: state.toPlay, body: { row: point.row, col: point.col } });
      state = playMove(state, point);
      continue;
    }
    const own = state.board.flatMap((cell, index) => (cell === state.toPlay ? [pointOf(size, index)] : []));
    const tried = own.flatMap((from) => pieceMoves(state, from).map((to) => ({ from, to, after: movePiece(state, from, to) })));
    const lowest = Math.min(...tried.map((each) => score(each.after)));
    const chosen = state.toPlay === "black" ? pick(tried.filter((each) => score(each.after) === lowest)) : pick(tried);
    bodies.push({ stone: state.toPlay, body: { row: chosen.to.row, col: chosen.to.col, from: chosen.from } });
    state = chosen.after;
  }
  return { state, bodies };
}

const furthestBlack = (state: GameState) => Math.min(...state.board.flatMap((cell, index) => (cell === "black" ? [pointOf(8, index).row] : [8])));

test.describe("played through the moves route", () => {
  test("Breakthrough ends on the far row, and the finished page says so", async ({ page }) => {
    let game = wholeGame(RULE_VARIANTS.breakthrough, 8, 1, furthestBlack);
    for (let seed = 2; game.state.winBy !== "reached"; seed += 1) game = wholeGame(RULE_VARIANTS.breakthrough, 8, seed, furthestBlack);
    const made = await makeGame(page, RULE_VARIANTS.breakthrough, 8);
    for (const each of game.bodies.slice(0, -1)) await post(page, made, each.stone === "black" ? made.blackToken : made.whiteToken, each.body);
    // The last move is pressed, by whoever made it, and the page says what happened.
    const last = game.bodies.at(-1)!;
    const move = last.body as { row: number; col: number; from: Point };
    await page.goto(`/games/breakthrough/match/${made.id}/seat/${last.stone === "black" ? made.blackToken : made.whiteToken}`);
    await square(page, name(8, move.from)).click();
    await square(page, name(8, move)).click();
    await submitIfPending(page);
    await expect(page.locator("main")).toContainText("reached the far row");
    // And the finished game, opened again, says the same.
    await page.goto(`/games/breakthrough/match/${made.id}`);
    await expect(page.locator("main")).toContainText("reached the far row");
  });
});
