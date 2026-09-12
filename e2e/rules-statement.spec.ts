import { expect, test } from "@playwright/test";
import { openBoardRules } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * The rules of a game being played are said, never offered.
 *
 * It used to be half true. The panel became a statement once a stone was down,
 * which fixed the worst of it — the form had been taking every answer with it
 * when it went, hardest on the player who was invited and never saw the settings
 * the game was started from. What was left was the other half: before that stone
 * the panel was still a FORM, so a board could be sat at with every rule of the
 * game still open beside it.
 *
 * Both halves are closed now, and by the same change. Every game is agreed on
 * the doorstep before it is written, so there is nothing left for a board to
 * ask — John's second sentence about the whole business was "we do not want to
 * see that Game board with all the settings on the side". The panel states, at
 * every stage, and folds what it states under a line saying what it is.
 */
test.describe("the rules beside a board", () => {
  async function game(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        blackName: `Kaya ${Date.now().toString(36)}`,
        whiteName: "Sumi",
        moveTimeMs: 300000,
        timeoutPenalty: "turn",
        allowResign: false,
        rated: false,
      },
    });
    expect(response.status()).toBe(201);
    const game = (await response.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    return game;
  }

  test("states them before the first stone, and offers no control", async ({ page, request }) => {
    /*
     * The half that was still a form. A seat holder at a game nobody has answered
     * used to get every rule as a select — the creator's chance to fix a clock
     * they got wrong, and also a window in which one seat could move what the
     * other had just agreed to. The doorstep is where a clock gets fixed now, and
     * a board with no stones on it can simply be cancelled and set up again.
     */
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);

    await openBoardRules(page);
    // The statement is waited FOR, by the helper, before any absence is asserted:
    // `toHaveCount(0)` passes the instant it is asked and would agree to anything.
    for (const control of ["shared-rules-opening", "shared-rules-size", "shared-rules-move-time"]) {
      await expect(page.getByTestId(control), control).toHaveCount(0);
    }
  });

  test("says what the form used to be holding, once a stone is down", async ({ page, request }) => {
    const live = await game(request);
    await request.post(`/api/games/${live.id}/moves`, {
      data: { token: live.blackToken, row: 4, col: 4 },
    });

    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.whiteToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);

    await openBoardRules(page);
    const said = page.getByTestId("rules-statement");
    await expect(said).toContainText("Opening");
    await expect(said).toContainText("Not allowed");
    await expect(said).toContainText("Friendly");
    await expect(said).toContainText("5 minutes a move");
    // The whole sentence, where there is room for it rather than in a control.
    await expect(said).toContainText("Three in a row lose the game");
  });

  test("says them to a watcher too, who never had the form at all", async ({ page, request }) => {
    const live = await game(request);
    await request.post(`/api/games/${live.id}/moves`, {
      data: { token: live.blackToken, row: 4, col: 4 },
    });
    await page.goto(`/games/gomoku/match/${live.id}`);
    await openBoardRules(page);
    await expect(page.getByTestId("rules-statement")).toContainText("Opening");
  });

  test("says the clock and the ratings in the line it folds under", async ({ page, request }) => {
    /*
     * The point of folding rather than hiding: a reader who has not opened the
     * drawer is still told the things that decide how a game feels. If the summary
     * stopped saying them, the fold would be a way of losing information rather
     * than of saving room.
     */
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}`);
    const summary = page.getByTestId("shared-rules").getByTestId("more-settings-summary");
    await expect(summary).toContainText("5 minutes a move");
    await expect(summary).toContainText("Friendly");
    await expect(summary).toContainText("No resigning");
  });

  test("nor on the panel that turns a local game into a shared one", async ({ page }) => {
    /*
     * The third place these settings are offered, and the one most easily
     * forgotten: it lives beside a local board rather than a shared one. It
     * had the same sentence-as-an-option and so the same overflow.
     */
    await page.goto("/games/gomoku/play");
    const penalty = page.getByTestId("shared-penalty");
    const time = page.getByTestId("shared-move-time");
    await expect(time).toBeVisible();
    await time.selectOption({ index: 1 });
    await expect(penalty).toBeVisible();

    const panel = penalty.locator("xpath=ancestor::*[contains(@class,'rounded')][1]");
    const outer = await panel.boundingBox();
    const inner = await penalty.boundingBox();
    expect(outer).not.toBeNull();
    expect(inner!.x + inner!.width).toBeLessThanOrEqual(outer!.x + outer!.width + 1);
  });

  test("nothing in the panel is wider than the panel", async ({ page, request }) => {
    /*
     * This used to measure three selects, one of whose options was a whole
     * sentence and pushed the control past the edge. Those selects have gone, and
     * the measurement is kept rather than deleted because the hazard has not: what
     * is in there now is a row of labelled sentences, and a sentence that will not
     * wrap overflows in exactly the same way.
     *
     * Measured on every row rather than on a list of named controls. A named list
     * is what made the old version able to go green having checked nothing — each
     * lookup was allowed to find no control and skip.
     */
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);
    await openBoardRules(page);

    const panel = page.getByTestId("shared-rules");
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    const rows = page.getByTestId("rules-statement").locator("dd");
    const many = await rows.count();
    expect(many, "the statement has no rows to measure").toBeGreaterThan(3);
    for (let at = 0; at < many; at += 1) {
      const inner = await rows.nth(at).boundingBox();
      expect(inner, `row ${at}`).not.toBeNull();
      expect(inner!.x + inner!.width, `row ${at}`).toBeLessThanOrEqual(box!.x + box!.width + 1);
    }
  });
});
