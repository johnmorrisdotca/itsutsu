import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { ready } from "./support";

/**
 * A NOTE GOES WITH THE MOVE — John, 2026-09-16, after ItsYourTurn's message
 * box on the move screen: offered where the move is sent, not further down the
 * page. Driven as a player would: place the stone, open the note, pick an
 * emoji, type a line, Submit — and the other player's board shows it.
 *
 * IT BRINGS ITS OWN WORLD: two members nobody else has met, and one game.
 */
test.describe("a note with the move", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  test("is written beside Submit and reaches the other player with the move", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `note-black-${stamp}@example.test`, name: under(`Kuro${stamp} Note`) };
    const shiro = { email: `note-white-${stamp}@example.test`, name: under(`Shiro${stamp} Note`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const whiteContext = await memberContext(browser, baseURL!, shiro);

    try {
      const black = await blackContext.newPage();
      const white = await whiteContext.newPage();
      const started = await black.request.post("/api/games/live", {
        data: { variant: "freestyle", size: 9, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: shiro.name },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      await black.goto(`/games/freestyle/match/${game.id}/seat/${game.blackToken}`);
      await ready(black, "shared-game");
      const board = black.getByTestId("shared-game");
      await board.getByRole("button", { name: /^E5, empty$/ }).click();
      await expect(board.getByTestId("pending-move")).toBeVisible();

      await board.getByTestId("move-note-open").click();
      await board.getByTestId("move-note-emoji").first().click();
      await board.getByTestId("move-note-text").fill("Your move, friend");
      await board.getByTestId("pending-move-submit").click();
      await expect(board.getByTestId("pending-move")).toHaveCount(0);

      // White's own board: the stone, and the note that came with it.
      await white.goto(`/games/freestyle/match/${game.id}/seat/${game.whiteToken}`);
      await ready(white, "shared-game");
      const theirs = white.getByTestId("shared-game");
      await expect(theirs.page().getByTestId("live-moves")).toContainText("E5");
      await expect(theirs.getByTestId("reaction-theirs").first()).toContainText("Your move, friend");
    } finally {
      await blackContext.close();
      await whiteContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });

  test("is not offered against the computer, which cannot read it", async ({ page }) => {
    // The operator's own game against a program: the move bar has Submit and no note.
    const response = await page.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null, challengeId: "kyu", botReply: true },
    });
    expect(response.status(), await response.text()).toBe(201);
    const { id } = (await response.json()) as { id: string };
    mine(id);
    await page.goto(`/games/freestyle/match/${id}`);
    await ready(page, "shared-game");
    const board = page.getByTestId("shared-game");
    await board.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(board.getByTestId("pending-move-submit")).toBeVisible();
    await expect(board.getByTestId("move-note-open")).toHaveCount(0);
  });
});
