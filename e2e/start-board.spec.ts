import { expect, test, type Page } from "@playwright/test";

import {
  aComputerOpponent,
  chooseBoard,
  chooseGame,
  chooseOpponent,
  chosenBoard,
  openMoreSettings,
  openSetUpPage,
  startAndBegin,
} from "./support";
import { memberContext } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** And the names they were played under, which outlive the games. */
const under = namesPlayedUnder();

/**
 * The board is chosen before the game exists.
 *
 * This was "choosing the board in the sentence" and tested a control inside a
 * one-line form in the lobby. The sentence has gone; CHOOSING THE BOARD is
 * still an intention and is still tested, on the screen that replaced it.
 *
 * The control is only there where there is a choice. Most games are played on
 * one board and have nothing to ask.
 */
const WEEK = 604800000;

async function setUp(page: Page, variant: string) {
  await openSetUpPage(page);
  await chooseGame(page, variant);
}

/** What a reader reads under each board's big number: its name. */
const BOARD_NAMES: Record<number, string> = {
  8: "Eight",
  9: "Mini",
  13: "Medium",
  15: "Standard",
  19: "Go board",
};

/** The side every block's mark is drawn at — `BOARD_MARK_PX`. */
const BIG_MARK_PX = 70;

/**
 * The Board row holds exactly these blocks, and every one of them is drawn as
 * Checkers' lone block was: the big numbered picture, which names the size
 * for a screen reader, then the board's name, then the check — and NO
 * "N×N" line. The same helper for one block and for three is the claim.
 */
async function expectBlocks(page: Page, sizes: readonly number[]) {
  const blocks = page.getByTestId("set-up-size");
  await expect(blocks).toHaveCount(sizes.length);
  const heights = new Set<number>();
  for (const [at, size] of sizes.entries()) {
    const block = blocks.nth(at);
    await expect(block).toHaveAttribute("data-size", String(size));
    const mark = block.getByRole("img", { name: `${size} by ${size} board` });
    await expect(mark).toHaveText(String(size));
    const box = await mark.boundingBox();
    expect(box?.width, `${size}×${size}: the big mark`).toBe(BIG_MARK_PX);
    await expect(block.getByTestId("set-up-size-name")).toContainText(BOARD_NAMES[size]);
    // The radio is named by the mark first, so the size is heard once.
    await expect(block.getByRole("radio", { name: new RegExp(`^${size} by ${size} board`) })).toHaveCount(1);
    const order = await block.evaluate((el) =>
      Array.from(el.children)
        .map((child) => child.getAttribute("data-testid"))
        .filter((id) => id !== null),
    );
    expect(order, `${size}×${size}: picture, name, check`).toEqual(["board-size-mark", "set-up-size-name", "pick-mark"]);
    // Absent, asked only now that the block's picture and name have been read.
    await expect(block).not.toContainText("×");
    heights.add(Math.round((await block.boundingBox())?.height ?? 0));
  }
  expect([...heights], "every block the same height").toHaveLength(1);
}

test.describe("choosing the board before the game exists", () => {
  test("offers a board for a game that has more than one", async ({ page }) => {
    await setUp(page, "freestyle");
    const board = page.getByTestId("shared-rules-size");
    await expect(board).toBeVisible();
    /*
     * Big blocks with the numbers on them, in the order the boards grow. The
     * number is in the picture and nowhere else in the block.
     */
    await expectBlocks(page, [9, 13, 15, 19]);
  });

  test("shows a one-board game its board, chosen, as the only one", async ({ page }) => {
    await setUp(page, "reversi");
    /*
     * Reversi is 8×8 and nothing else, so there is no decision to put to
     * anybody — and since 0.158.7 the board is SHOWN rather than hidden, as one
     * block, checked like any chosen board. This case used to assert the
     * absence, which was the right claim when a one-option picker hid itself
     * and is the wrong one now: John's words were "the Reversi games don't
     * even have a board size… they should!"
     *
     * The two halves are separate assertions because they are separate facts:
     * the board is stated, and it is the only one.
     */
    await expect(page.getByTestId("more-settings-open")).toBeVisible();
    await expect(page.getByTestId("set-up-size")).toHaveCount(1);
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "8");
    await expect(chosenBoard(page)).toHaveAttribute("data-only", "true");
  });

  test("draws every board block as the big number, one board or three, there and back", async ({ page }) => {
    /*
     * John: "Remember I don't want the 9x9 size under every board... i want
     * consistency. Like checkers, just the big number now. easier to read"
     *
     * Every block — Reversi's one, Domino Five's three — is the big numbered
     * picture and the board's name, with no "N×N" line under it, and every
     * block is the same height.
     *
     * Driven the way a reader meets it: the generic set-up screen, waited on
     * through its ready marker, a game with one board, a game with three, and
     * back — by clicking the game picker each time and never reloading, since
     * the way back is where a block left drawn the other way would show.
     */
    await setUp(page, "reversi");
    await expectBlocks(page, [8]);

    await chooseGame(page, "dominoFive");
    await expectBlocks(page, [13, 15, 19]);

    await chooseGame(page, "reversi");
    await expectBlocks(page, [8]);
  });

  test("starts the game on the board that was chosen", async ({ page, request }) => {
    await setUp(page, "freestyle");
    await chooseBoard(page, 19);

    /*
     * Against a computer, so a game is certainly made and made on this board.
     * "For anyone" sits down at a matching posted seat when there is one,
     * which is right and is the wrong thing to assert a chosen board against
     * — the board would be the poster's rather than this one.
     */
    await openMoreSettings(page);
    await chooseOpponent(page, await aComputerOpponent(page));
    await startAndBegin(page);

    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9-]+/, { timeout: 30_000 });
    const id = page.url().split("/games/gomoku/match/")[1].split("/")[0];
    const made = await (await request.get(`/api/games/${id}`)).json();
    expect(made.size).toBe(19);
    expect(made.variant).toBe("freestyle");
  });

  test("opens on the board somebody is already waiting on", async ({ page, browser, baseURL }) => {
    /*
     * The regression this control could easily cause, and the reason it was
     * carried over from the sentence rather than left behind. Every seat on
     * the noticeboard was posted at some size, so a screen that always opened
     * at the member's own favourite would stop matching them — asking for a
     * game would post a SECOND seat beside the one already waiting and neither
     * would ever be filled. Following the waiting seat keeps it one press.
     */
    const stamp = Date.now().toString(36);
    // Somebody, and not this reader: their own seat is not offered back.
    const waiting = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-waiting@example.test",
      name: "Board Waiting",
    });
    const waited = await waiting.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: under(`Waiting ${stamp}`), moveTimeMs: WEEK, open: true },
    });
    tidyAway(((await waited.json()) as { id: string }).id);
    await waiting.close();

    await setUp(page, "freestyle");
    await openMoreSettings(page);
    await chooseOpponent(page, "anyone");
    await page.getByTestId("shared-rules-move-time").selectOption(String(WEEK));

    // Nobody has touched the board, and it has found them.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "9");
    await expect(page.getByTestId("set-up-start")).toContainText(/Sit down with/);
  });

  test("only offers a posted seat that is on the board being asked for", async ({ page, browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    // Somebody posts a 9×9 seat, at a pace nothing else here uses — and it has
    // to be somebody, since a seat is not offered back to its poster.
    const poster = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-poster@example.test",
      name: "Board Poster",
    });
    const posted = await poster.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: under(`Poster ${stamp}`), moveTimeMs: WEEK, open: true },
    });
    expect(posted.status()).toBe(201);
    tidyAway(((await posted.json()) as { id: string }).id);
    await poster.close();

    await setUp(page, "freestyle");
    await openMoreSettings(page);
    await chooseOpponent(page, "anyone");
    await page.getByTestId("shared-rules-move-time").selectOption(String(WEEK));

    // Asking for their board offers their seat…
    await chooseBoard(page, 9);
    await expect(page.getByTestId("set-up-start")).toContainText(/Sit down with/);

    // …and asking for a different one does not pretend it will do.
    await chooseBoard(page, 19);
    await expect(page.getByTestId("set-up-start")).not.toContainText(/Sit down with/);
  });

  test("keeps a chosen board across a game that cannot use it", async ({ page }) => {
    await setUp(page, "freestyle");
    await chooseBoard(page, 19);

    // Through a game with one fixed board, and back again. That game shows its
    // own board as the only block there is — see the case above — so what this
    // waits on is the row holding exactly one, rather than holding none.
    await chooseGame(page, "reversi");
    await expect(page.getByTestId("more-settings-open")).toBeVisible();
    await expect(page.getByTestId("set-up-size")).toHaveCount(1);
    await chooseGame(page, "freestyle");

    // Still 19×19: looking at another game does not quietly lose the choice.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "19");
  });
});
