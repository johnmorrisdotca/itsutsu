import { expect, test } from "@playwright/test";

import { removeGame } from "./tidy";

/**
 * A seat posted for anyone reads as waiting, not as a game under way.
 *
 * John posted a seat meaning to wait, and the board told him "Your move — you
 * are Black" against an opponent who did not exist yet. Everything about it
 * was true and none of it was what was happening.
 *
 * The board stays playable: opening before your opponent arrives is how the
 * elder turn-based sites worked, and the open-seat clock already handles a
 * first move with nobody opposite. It is offered rather than announced.
 */
test.describe("a seat posted for anyone", () => {
  test("says it is waiting, and says the first move is optional", async ({ page }) => {
    const started = await page.request.post("/api/games/live", {
      data: { blackName: "Waiting Poster", variant: "freestyle", size: 9, open: true, moveTimeMs: null },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };

    try {
      await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
      const banner = page.getByTestId("turn-banner");
      await expect(banner).toHaveAttribute("data-awaiting", "true");
      await expect(banner).toContainText("waiting for somebody");
      // Not the sentence that made it look like a game already in progress.
      await expect(banner).not.toContainText("Your move");

      // The seat link is on screen, which is the point of the page.
      await expect(page.getByTestId("seat-invite")).toHaveAttribute("data-stone", "white");

      // And the board is still playable, because that is a deliberate choice.
      await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeEnabled();
    } finally {
      await removeGame(game.id);
    }
  });

  test("goes back to saying whose move it is once somebody sits down", async ({ page, browser, baseURL }) => {
    const started = await page.request.post("/api/games/live", {
      data: { blackName: "Answered Poster", variant: "freestyle", size: 9, open: true, moveTimeMs: null },
    });
    const game = (await started.json()) as { id: string; blackToken: string };

    try {
      const { memberContext } = await import("./members");
      const stamp = Date.now().toString(36);
      const other = await memberContext(browser, baseURL ?? "http://localhost:6600", {
        email: `waiting-answerer-${stamp}@example.com`,
        name: `Waiting Answerer ${stamp}`,
      });
      const sat = await other.request.post(`/api/games/${game.id}/sit`, { data: {} });
      expect(sat.status(), await sat.text()).toBeLessThan(400);
      await other.close();

      await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
      const banner = page.getByTestId("turn-banner");
      await expect(banner).not.toHaveAttribute("data-awaiting", "true");
      await expect(banner).toContainText("Your move");
    } finally {
      await removeGame(game.id);
    }
  });
});
