import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * THE COLOUR OF A REVERSI BOARD. John, 2026-09-25: "All Reversi boards:
 * Introduce a beautiful colour patch row, where you can choose from all the
 * known variant colours of green, blue, red… on game creation and even mid-game
 * is OK."
 *
 * Chosen on the patches under the set-up screen's preview, kept on the
 * account, found on the board the game is played on, changed there mid-game,
 * and taken back to the reader's own wood. Signed in as a member of its own,
 * so the board under test is nobody else's; every choice is a click.
 */
const MEMBER = () => {
  const stamp = Date.now().toString(36);
  return { email: `felt-${stamp}@example.test`, name: `Felt ${stamp}` };
};

test("a Reversi board's felt is chosen at set-up, kept, and changed mid-game", async ({ browser, baseURL }) => {
  const member = MEMBER();
  const context = await memberContext(browser, baseURL!, member);
  try {
    const page = await context.newPage();
    await page.goto("/games/reversi/new");
    await ready(page, "set-up-game");
    const preview = page.getByTestId("board-preview");
    // Green until chosen otherwise.
    await expect(preview.getByTestId("board-surface")).toHaveAttribute("data-surface", "Green");
    await expect(preview.getByTestId("felt-green")).toHaveAttribute("aria-checked", "true");

    const saved = page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH");
    await preview.getByTestId("felt-blue").click();
    await expect(preview.getByTestId("board-surface")).toHaveAttribute("data-surface", "Blue");
    expect((await saved).ok()).toBe(true);

    // The practice board is the account's: blue.
    await page.goto("/games/reversi/play");
    await ready(page, "game-view");
    const board = page.getByTestId("game-view");
    await expect(board.getByTestId("board-surface").first()).toHaveAttribute("data-surface", "Blue");

    // Changed under the board mid-game, and back to the reader's own wood (the default kaya).
    await board.getByTestId("felt-patches").first().getByTestId("felt-red").click();
    await expect(board.getByTestId("board-surface").first()).toHaveAttribute("data-surface", "Red");
    // The practice board saves half a second after the last press (`useSavedAppearance`); the next page is read from the account, so wait for it.
    const woodSaved = page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH");
    await board.getByTestId("felt-patches").first().getByTestId("felt-wood").click();
    await expect(board.getByTestId("board-surface").first()).toHaveAttribute("data-surface", "Kaya");
    expect((await woodSaved).ok()).toBe(true);

    // A live game against another seat: the account's board (wood, from the last press), and felt chosen mid-game.
    const made = await context.request.post("/api/games/live", { data: { variant: "reversi", size: 8 } });
    expect(made.status(), await made.text()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };
    await page.goto(`/games/reversi/match/${game.id}/seat/${game.blackToken}`);
    await ready(page, "shared-game");
    const live = page.getByTestId("shared-game");
    await expect(live.getByTestId("board-surface")).toHaveAttribute("data-surface", "Kaya");
    await live.getByTestId("felt-green").click();
    await expect(live.getByTestId("board-surface")).toHaveAttribute("data-surface", "Green");

    // A game that is not Reversi offers no felt and keeps its wood.
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    await expect(page.getByTestId("board-preview").getByTestId("board-surface")).toHaveAttribute("data-surface", "Kaya");
    await expect(page.getByTestId("felt-patches")).toHaveCount(0);
  } finally {
    await context.close();
    await removeMember(member.email);
  }
});
