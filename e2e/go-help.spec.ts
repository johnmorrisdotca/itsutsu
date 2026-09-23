import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { ready } from "./support";

/**
 * GO SAYS WHAT A BEGINNER NEEDS TOLD — John, 2026-09-23, his first game.
 *
 * He was winning; the computer had passed; he played into his own group's eye
 * and lost it all with the next stone. Nothing on the board had said the game
 * could end, or that the stone was fatal. This drives the board a player uses:
 * the other side has passed, so the help says so; the player clicks a point
 * that leaves their stone one liberty, and the help warns before it is sent.
 *
 * IT BRINGS ITS OWN WORLD: two members nobody else has met and one game. The
 * stones before the subject are played through the move API with each seat's
 * token; the click that matters is clicked.
 */
test.describe("the Go help under the board", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  test("says the other side passed, and warns before a stone leaves its group in atari", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `go-help-black-${stamp}@example.test`, name: under(`Kuro${stamp} Help`) };
    const shiro = { email: `go-help-white-${stamp}@example.test`, name: under(`Shiro${stamp} Help`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const whiteContext = await memberContext(browser, baseURL!, shiro);

    try {
      const black = await blackContext.newPage();
      const white = await whiteContext.newPage();
      const started = await black.request.post("/api/games/live", {
        data: { variant: "go", size: 9, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: shiro.name },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      // White builds three sides of a box around E5 (row 4, col 4) while Black plays the corners; then White passes.
      const opening: ["black" | "white", number, number][] = [
        ["black", 0, 0],
        ["white", 3, 4],
        ["black", 0, 8],
        ["white", 5, 4],
        ["black", 8, 0],
        ["white", 4, 3],
        ["black", 8, 8],
      ];
      for (const [seat, row, col] of opening) {
        const request = seat === "black" ? black.request : white.request;
        const token = seat === "black" ? game.blackToken : game.whiteToken;
        const played = await request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
        expect(played.status(), await played.text()).toBe(201);
      }
      const passed = await white.request.post(`/api/games/${game.id}/moves`, { data: { token: game.whiteToken, pass: true } });
      expect(passed.status(), await passed.text()).toBe(201);

      await black.goto(`/games/go/match/${game.id}/seat/${game.blackToken}`);
      await ready(black, "shared-game");
      const board = black.getByTestId("shared-game");
      const help = board.getByTestId("go-help");
      await expect(help).toBeVisible();
      await expect(help.getByTestId("go-help-passed")).toContainText("White passed");

      // E5 is open on one side only: the stone would have one liberty left.
      await board.getByRole("button", { name: /^E5, empty$/ }).click();
      await expect(board.getByTestId("pending-move")).toBeVisible();
      await expect(help.getByTestId("go-help-risk")).toHaveAttribute("data-risk", "selfAtari");
      // And the way back: starting over takes the warning with the stone.
      await board.getByTestId("pending-move-start-over").click();
      await expect(board.getByTestId("pending-move")).toHaveCount(0);
      await expect(help.getByTestId("go-help-risk")).toHaveCount(0);
    } finally {
      await blackContext.close();
      await whiteContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });

  test("marks the point a stone may not go, and rings the last liberty of a group in atari", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `go-marks-black-${stamp}@example.test`, name: under(`Kuro${stamp} Marks`) };
    const shiro = { email: `go-marks-white-${stamp}@example.test`, name: under(`Shiro${stamp} Marks`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const whiteContext = await memberContext(browser, baseURL!, shiro);

    try {
      const black = await blackContext.newPage();
      const white = await whiteContext.newPage();
      const started = await black.request.post("/api/games/live", {
        data: { variant: "go", size: 9, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: shiro.name },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      /*
       * White walls off the top-right corner point J9 (0,8) — a black stone
       * there would have no liberty and take nothing — and then puts a stone
       * on E4 (5,4) that Black has surrounded on three sides, leaving it one
       * liberty at E5 (4,4).
       */
      const opening: ["black" | "white", number, number][] = [
        ["black", 6, 4],
        ["white", 0, 7],
        ["black", 5, 3],
        ["white", 1, 8],
        ["black", 5, 5],
        ["white", 5, 4],
      ];
      for (const [seat, row, col] of opening) {
        const request = seat === "black" ? black.request : white.request;
        const token = seat === "black" ? game.blackToken : game.whiteToken;
        const played = await request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
        expect(played.status(), await played.text()).toBe(201);
      }

      await black.goto(`/games/go/match/${game.id}/seat/${game.blackToken}`);
      await ready(black, "shared-game");
      const board = black.getByTestId("shared-game");
      await expect(board.getByTestId("go-help-atari")).toContainText("E5");
      // The ring on E5, where White's stone is taken; the cross on J9, where Black may not go.
      await expect(board.getByRole("button", { name: /^E5, empty/ }).locator('[data-mark="forced"]')).toHaveCount(1);
      await expect(board.getByRole("button", { name: /^J9/ }).locator('[data-mark="forbidden"]')).toHaveCount(1);
    } finally {
      await blackContext.close();
      await whiteContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });
});
