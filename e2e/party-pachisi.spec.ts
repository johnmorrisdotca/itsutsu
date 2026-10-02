import { expect, test, type Page } from "@playwright/test";

import { pachisiMoves, playPachisi, startPachisi } from "../src/lib/party/pachisi/pachisi";
import { encodePachisi } from "../src/lib/party/pachisi/pachisiCodec";
import { pachisiComputerMove } from "../src/lib/party/pachisi/pachisiComputer";
import type { PachisiGame } from "../src/lib/party/pachisi/pachisi.types";
import { ready } from "./support";

/**
 * PACHISI, THE RACE GAME OF THE CROSS AND CIRCLE: a party game (`PartyKind`
 * "pachisi") at home in the Dice family, for two to four round one device,
 * with a computer in any seat.
 *
 * Driven as a table drives it: set up from the game's own page, the dice
 * thrown by Roll, a value chosen and a ringed pawn tapped. The dice are drawn
 * from the game's seed, so a spec that needs a throw with a move in it picks
 * its seed by the same rules the page plays, and keeps the game where the
 * table keeps one. Nothing here writes to the database.
 */
const KEPT = "itsutsu.pachisi";
const AT = "/games/pachisi";

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

async function keepGame(page: Page, game: PachisiGame) {
  await clearKept(page);
  await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodePachisi(game)] as const);
}

/** A person and a computer, on a seed whose first throw brings a pawn out: the person has something to move at once. */
function openingWithAMove(): PachisiGame {
  for (let seed = 1; ; seed += 1) {
    const game = startPachisi(["Ann", ""], seed, [false, true])!;
    const thrown = playPachisi(game, { kind: "roll" })!;
    if (thrown.phase === "move" && thrown.toPlay === 0) return game;
  }
}

test.describe("Pachisi, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Pachisi/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/pachisi\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("blockade");

    await page.goto("/games/party");
    await expect(page.locator("main")).toContainText("Pachisi");

    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Pachisi, pass and play", () => {
  test("the set-up seats a person and a computer and opens on the first throw", async ({ page }) => {
    await clearKept(page);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "pachisi-set-up");
    await page.locator('[data-testid="pachisi-count"][data-count="2"]').click();
    await page.getByTestId("pachisi-name").first().fill("Ann");
    await expect(page.getByTestId("pachisi-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("pachisi-start").click();
    await ready(page, "pachisi-game");
    await expect(page.getByTestId("pachisi-game")).toHaveAttribute("data-state", "roll");
    await expect(page.getByTestId("pachisi-turn")).toContainText("Ann to roll");
    await expect(page.getByTestId("pachisi-pawn")).toHaveCount(8);
  });

  test("throw, choose a value, move a ringed pawn; the computer answers; kept, and waiting on My games", async ({ page }) => {
    await keepGame(page, openingWithAMove());
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "pachisi-game");
    const table = page.getByTestId("pachisi-game");
    await page.getByTestId("pachisi-roll").click();
    await expect(table).toHaveAttribute("data-state", "move");
    await expect(page.getByTestId("pachisi-die").first()).not.toHaveAttribute("data-value", "0");

    // The first value that can move is chosen; a ringed pawn of Ann's moves by it.
    await expect(page.getByTestId("pachisi-value").first()).toHaveAttribute("aria-pressed", "true");
    const pawn = page.locator('[data-testid="pachisi-pawn"][data-seat="0"][data-movable="true"]').first();
    const which = await pawn.getAttribute("data-pawn");
    await pawn.click();
    await expect(page.locator(`[data-testid="pachisi-pawn"][data-seat="0"][data-pawn="${which}"]`)).not.toHaveAttribute("data-progress", "-1");

    // Whatever Ann has left, spend it (and throw again after doubles); then the computer plays by itself, and it comes back round.
    for (let step = 0; step < 16; step += 1) {
      const state = await table.getAttribute("data-state");
      if ((await table.getAttribute("data-to-play")) !== "0" || state === "finished") break;
      const before = (await table.getAttribute("data-moves"))!;
      if (state === "roll") await page.getByTestId("pachisi-roll").click();
      else await page.locator('[data-testid="pachisi-pawn"][data-seat="0"][data-movable="true"]').first().click();
      await expect(table).not.toHaveAttribute("data-moves", before);
    }
    await expect(table).toHaveAttribute("data-to-play", "1");
    await expect(table).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
    await expect(page.getByTestId("pachisi-last")).not.toHaveText("");

    // Kept in this browser: a reload opens the same board, and My games lists it.
    const moves = await table.getAttribute("data-moves");
    await page.reload();
    await ready(page, "pachisi-game");
    await expect(table).toHaveAttribute("data-moves", moves!);
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="pachisi"]');
    await expect(card).toContainText("Ann to play");
    await card.getByTestId("party-game-continue").click();
    await expect(page).toHaveURL(/\/games\/pachisi\/pass-and-play$/);
    await ready(page, "pachisi-game");
  });

  test("the last pawn home wins, and Play again sets the same table out afresh", async ({ page }) => {
    // Two people, played by the computer's rules until Ann's next move would bring her last pawn home; that move is left to the page.
    let game = startPachisi(["Ann", "Ben"], 20260930, [false, false])!;
    for (;;) {
      const move = pachisiComputerMove(game);
      const next = playPachisi(game, move)!;
      if (next.phase === "finished" && game.toPlay === 0) break;
      game = next.phase === "finished" ? startPachisi(["Ann", "Ben"], game.seed + 1, [false, false])! : next;
    }
    const finishing = pachisiMoves(game).find((move) => move.kind === "move" && playPachisi(game, move)!.phase === "finished") as { kind: "move"; pawn: number; use: number };
    await keepGame(page, game);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "pachisi-game");
    await page.locator(`[data-testid="pachisi-value"][data-use="${finishing.use}"]`).click();
    await page.locator(`[data-testid="pachisi-pawn"][data-seat="0"][data-pawn="${finishing.pawn}"]`).click();
    await expect(page.getByTestId("pachisi-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("win-cover")).toContainText("Ann");
    await page.getByTestId("win-cover-next").click();
    await expect(page.getByTestId("pachisi-game")).toHaveAttribute("data-state", "roll");
    await expect(page.locator('[data-testid="pachisi-pawn"][data-progress="-1"]')).toHaveCount(8);
  });
});
