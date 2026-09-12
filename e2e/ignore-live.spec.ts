import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * Ignoring somebody means ignoring them everywhere.
 *
 * Their opponent stopped hearing them, because the muting was worked out
 * inside a block that only runs for somebody holding a seat. Anybody else who
 * had ignored that player and opened the game to watch it heard every word.
 * The ignore list is a rule about who may reach you, not about which chair you
 * are sitting in.
 */
test.describe("ignoring somebody, in a live game", () => {
  async function noisyGame(browser: import("@playwright/test").Browser, baseURL: string) {
    const stamp = Date.now().toString(36);
    const loud = { email: `loud-${stamp}@example.com`, name: `Loud ${stamp}` };
    const quiet = { email: `quiet-${stamp}@example.com`, name: `Quiet ${stamp}` };
    const theirs = await memberContext(browser, baseURL, loud);
    const mine = await memberContext(browser, baseURL, quiet);

    /*
     * Challenged first, ignored afterwards. That is the real order — you fall
     * out with somebody you are already playing — and it has to be: the ignore
     * list refuses the challenge outright, which is its other half working.
     */
    const started = await theirs.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, challenge: quiet.email, moveTimeMs: null },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    /*
     * ACCEPTED, because a challenge is an OFFER now: one seat bound, one
     * offered, and no move and no word from either of them until it is
     * answered. Accepted BEFORE the ignoring, which keeps this file's own
     * order — you fall out with somebody you are already playing.
     */
    const accepted = await mine.request.post(`/api/games/${game.id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);

    await mine.request.post("/api/ignores", { data: { email: loud.email } });
    await theirs.request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(
      (
        await theirs.request.post(`/api/games/${game.id}/reactions`, {
          data: { token: game.blackToken, emoji: "👏", text: "Loud and unwelcome", moveNumber: 1 },
        })
      ).status(),
    ).toBe(201);
    return { game, mine, loud, browser, baseURL };
  }

  test("their opponent does not hear them", async ({ browser, baseURL }) => {
    const { game, mine } = await noisyGame(browser, baseURL!);
    const page = await mine.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.getByText("Loud and unwelcome")).toHaveCount(0);
  });

  test("and neither does somebody watching who has ignored them", async ({ browser, baseURL }) => {
    const { game, loud } = await noisyGame(browser, baseURL!);
    const stamp = Date.now().toString(36);
    const watcher = { email: `watcher-${stamp}@example.com`, name: `Watcher ${stamp}` };
    const theirs = await memberContext(browser, baseURL!, watcher);
    await theirs.request.post("/api/ignores", { data: { email: loud.email } });

    const page = await theirs.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    // No seat here, and it makes no difference: they asked not to hear them.
    await expect(page.getByText("Loud and unwelcome")).toHaveCount(0);
  });

  test("somebody who has not ignored them hears them as usual", async ({ browser, baseURL }) => {
    const { game } = await noisyGame(browser, baseURL!);
    const stamp = Date.now().toString(36);
    const bystander = { email: `bystander-${stamp}@example.com`, name: `Bystander ${stamp}` };
    const theirs = await memberContext(browser, baseURL!, bystander);

    const page = await theirs.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    // The negative case that keeps the others honest: nothing is hidden from
    // everybody, only from the people who asked.
    await expect(page.getByText("Loud and unwelcome").first()).toBeVisible({ timeout: 10_000 });
  });
});
