import { expect, test, type Page } from "@playwright/test";

import { COLUMN_LETTERS } from "../src/lib/gomoku/gomoku.constants";
import { memberContext, memberIdFor, removeMember, seatTokensFor, seedMember } from "./members";
import { chosenOpponent, openAdvanced, openMoreSettings, openSetup, playAt, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A HEAD START FOR THE WEAKER PLAYER, ONE CASE PER KIND, EACH SHOWN ON THE BOARD.
 *
 * John chose "Free moves + traditional": turns in hand at the start for every
 * game, and each game's own custom where it has one — Go's handicap stones on the
 * star points, Othello's corners, draughts' odds of a man.
 *
 * Free turns are driven the whole way a reader takes them: chosen on the set-up
 * screen, kept in its address, stated on the doorstep, played on a live board —
 * where each free turn is the other side's pass — and named afterwards on the
 * game page, the result card and the history. The three traditional head starts
 * are driven on the practice board, where choosing one sets it out at once.
 */

/** A point's accessible name, as the board spells it: column letter, then the row counted from the bottom. */
function pointName(size: number, row: number, col: number): string {
  return `${COLUMN_LETTERS[col]}${size - row}`;
}

function stoneAt(page: Page, name: string, what: string) {
  return page.getByRole("button", { name: new RegExp(`^${name}, ${what}$`) });
}

test("free turns: chosen on the set-up screen, played on a live board as the other side's passes, and named everywhere after", async ({
  browser,
  baseURL,
}) => {
  const stamp = Date.now().toString(36);
  const me = { email: `head-start-giver-${stamp}@example.test`, name: `Giver ${stamp}` };
  const them = { email: `head-start-taker-${stamp}@example.test`, name: `Taker ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL!, me);
  const theirId = await memberIdFor(them.email);
  const page = await context.newPage();

  try {
    await page.goto(`/games/gomoku/new?against=${theirId}`);
    await ready(page, "set-up-game");
    await openMoreSettings(page);
    await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", `m:${theirId}`);

    // The challenger sits as Black; the player being helped, White, is given two free turns.
    await page.getByTestId("set-up-head-start-stone").selectOption("white");
    await page.getByTestId("set-up-head-start-turns").selectOption("2");
    await expect(page.getByTestId("set-up-summary")).toContainText("White head start: 2 free turns");
    // A head start is a handicap to the rating, and the screen says so where the choice would be.
    await expect(page.getByTestId("set-up-rated-fact")).toHaveAttribute("data-refused", "head-start");
    // Kept in the address, as every choice on this screen is.
    await expect(page).toHaveURL(/head-start=white-2-turns/);

    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    await expect(page.getByTestId("rules-statement")).toContainText("Will not count — a head start");
    await page.getByTestId("doorstep-begin").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const made = await context.request.get(`/api/games/${id}`);
    expect(made.status()).toBe(200);
    const game = (await made.json()) as { size: number; rated: boolean; headStart: unknown };
    expect(game.headStart, "the head start it was set up with").toEqual({ stone: "white", freeTurns: 2, traditional: 0 });
    expect(game.rated, "stored as a game that does not count").toBe(false);

    const theirs = await memberContext(browser, baseURL!, them);
    const accepted = await theirs.request.post(`/api/games/${id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);
    await theirs.close();

    const tokens = await seatTokensFor(id);
    const play = async (token: string, row: number, col: number) => {
      const played = await context.request.post(`/api/games/${id}/moves`, { data: { token, row, col } });
      expect(played.status(), await played.text()).toBe(201);
    };

    // Black opens; White answers, and then plays twice more with nothing from Black between.
    await play(tokens.blackToken, 9, 9);
    await play(tokens.whiteToken, 6, 6);
    await play(tokens.whiteToken, 6, 5);

    // On the board: White's three stones, and the turn that passed said to be the head start's.
    await page.goto(`/games/gomoku/match/${id}`);
    const size = game.size;
    for (const col of [6, 5]) await expect(stoneAt(page, pointName(size, 6, col), "White stone")).toBeVisible();
    await expect(page.getByTestId("turn-passed")).toContainText("White's head start: free turn 2 of 2");
    await expect(page.getByTestId("shared-rules-line")).toContainText("White head start: 2 free turns");

    // The last free turn, then an ordinary game: White makes five along row 6.
    await play(tokens.whiteToken, 6, 4);
    await play(tokens.blackToken, 10, 10);
    await play(tokens.whiteToken, 6, 3);
    await play(tokens.blackToken, 11, 11);
    await play(tokens.whiteToken, 6, 2);

    // The finished game names its head start: on the result card, in why it did not count, and in the history.
    await page.goto(`/games/gomoku/match/${id}`);
    await expect(page.getByTestId("result-card-head-start")).toContainText("White head start: 2 free turns");
    await expect(page.getByTestId("record-unrated")).toContainText("head start");
    await page.goto(`/history?search=${stamp}`);
    // The row for THIS game, found by the replay link it carries: a listing prints names shortened.
    const row = page.getByTestId("history-row").filter({ has: page.locator(`a[href$="/match/${id}"]`) });
    await expect(row.getByTestId("history-head-start")).toHaveText("Head start");
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});

test("handicap stones: Go's head start sets them on the star points, and White moves first", async ({ page }) => {
  await page.goto("/games/go/play");
  await openSetup(page);
  await page.getByTestId("board-size").selectOption("19");
  await openAdvanced(page);
  await page.getByTestId("practice-head-start-stone").selectOption("black");
  await page.getByTestId("practice-head-start-traditional").selectOption("4");
  await page.getByTestId("practice-head-start-turns").selectOption("0");

  // The four corner star points, in the customary order: upper right and lower left first.
  for (const name of ["Q16", "D4", "Q4", "D16"]) await expect(stoneAt(page, name, "Black stone")).toBeVisible();
  await expect(page.getByTestId("variant-line")).toContainText("Black head start: 4 handicap stones");

  // The stones are Black's opening, so the first stone played is White's.
  await playAt(page, 19, 9, 9);
  await expect(stoneAt(page, "K10", "White stone")).toBeVisible();
});

test("corners: Othello's head start gives the colour its corners before the first move", async ({ page }) => {
  await page.goto("/games/reversi/play");
  await openAdvanced(page);
  await page.getByTestId("practice-head-start-stone").selectOption("white");
  // Othello offers no free turns — one would take the other side's last disc — so its corners are the whole choice.
  await page.getByTestId("practice-head-start-traditional").selectOption("2");

  await expect(stoneAt(page, "A8", "White stone")).toBeVisible();
  await expect(page.getByTestId("practice-head-start-turns")).toHaveCount(0);
  await expect(stoneAt(page, "H1", "White stone")).toBeVisible();
  await expect(stoneAt(page, "H8", "empty")).toBeVisible();
  // Two in the centre and two in the corners.
  await expect(page.getByTestId("disc-count")).toContainText("○ 4");
});

test("men off: draughts odds take men off the stronger side's back row", async ({ page }) => {
  await page.goto("/games/checkers/play");
  await openAdvanced(page);
  // Black is the player being helped, so White gives the men — from its own back row, at its left.
  await page.getByTestId("practice-head-start-stone").selectOption("black");
  await page.getByTestId("practice-head-start-traditional").selectOption("2");
  await page.getByTestId("practice-head-start-turns").selectOption("0");

  await expect(stoneAt(page, "A1", "empty")).toBeVisible();
  await expect(stoneAt(page, "C1", "empty")).toBeVisible();
  await expect(stoneAt(page, "E1", "White stone")).toBeVisible();
  await expect(stoneAt(page, "B8", "Black stone")).toBeVisible();
  await expect(page.getByTestId("variant-line")).toContainText("Black head start: 2 men off the other side");
});
