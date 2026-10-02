import { expect, test, type Page } from "@playwright/test";
import { encodeDiceWar, playDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";

import { ready } from "./support";

/**
 * DICE WAR, THE DICE GAME: a party game (`PartyKind` "diceWar") at home in the
 * Dice family, for two to eight round one device, a computer in any seat. The
 * rules are Korokoro's; the dice on the table are Korokoro's own.
 *
 * Driven as a table drives it: set up from the game's own page (how many dice,
 * how many sides, what to play to), the dice thrown by Roll, a war played, a
 * game carried to its end, and kept where the table keeps a game. A war is
 * reached from a known position made by the same rules the page plays. Nothing
 * here writes to the database.
 */
const KEPT = "itsutsu.diceWar";
const AT = "/games/dice-war";

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

/** Opens the table from the game's own page, set up and ready to fill in. */
async function openSetUp(page: Page) {
  await clearKept(page);
  await page.goto(AT);
  await ready(page, "party-kind-offer");
  await page.getByTestId("game-set-up").click();
  await expect(page).toHaveURL(/\/games\/dice-war\/pass-and-play$/);
  await ready(page, "dicewar-set-up");
}

/** Each seat's dice as the table shows them: a list of faces a seat. */
async function facesBySeat(page: Page): Promise<number[][]> {
  return page.getByTestId("dicewar-seat").evaluateAll((rows) => rows.map((row) => [...row.querySelectorAll('[data-testid="dicewar-die"]')].map((die) => Number(die.getAttribute("data-face")))));
}

test.describe("Dice War, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Dice War/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/party");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/dice-war\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("tie for the highest");

    await page.goto("/games/party");
    await expect(page.locator("main")).toContainText("Dice War");

    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Dice War, pass and play", () => {
  test("a person and a computer: choose two dice of twenty sides to five points, roll, and play it to the end; kept, and waiting on My games", async ({ page }) => {
    await openSetUp(page);
    // The odds line follows the choice: two d6 dice are rarely a tie, one d6 often is.
    const odds = page.getByTestId("dicewar-odds");
    await expect(odds).toContainText("83%");
    await page.locator('[data-testid="dicewar-dice-count"][data-dice="2"]').click();
    await page.locator('[data-testid="dicewar-sides"][data-sides="20"]').click();
    await expect(odds).not.toContainText("83%");
    await page.locator('[data-testid="dicewar-goal"][data-goal="points"][data-to="5"]').click();
    // The preview is the table: two seats, two empty places for dice each.
    await expect(page.getByTestId("dicewar-preview").getByTestId("dicewar-seat")).toHaveCount(2);
    await page.getByTestId("dicewar-name").first().fill("Ann");
    // The second seat opens as a computer.
    await expect(page.getByTestId("dicewar-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("dicewar-start").click();

    await ready(page, "dicewar-game");
    const table = page.getByTestId("dicewar-game");
    await expect(table).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("dicewar-status")).toContainText("Round 1, first to 5 points");

    await page.getByTestId("dicewar-roll").click();
    await expect(table).toHaveAttribute("data-throws", "1");
    // Two dice a player, each a face of a twenty-sided die, and the totals add up.
    const faces = await facesBySeat(page);
    expect(faces.map((seat) => seat.length)).toEqual([2, 2]);
    for (const face of faces.flat()) expect(face >= 1 && face <= 20).toBe(true);
    const totals = await page.getByTestId("dicewar-total").allTextContents();
    expect(totals).toEqual(faces.map((seat) => `total ${seat.reduce((sum, face) => sum + face, 0)}`));

    // Kept in this browser: a reload opens the same throw, and My games lists it.
    await page.reload();
    await ready(page, "dicewar-game");
    await expect(table).toHaveAttribute("data-throws", "1");
    expect(await facesBySeat(page)).toEqual(faces);
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="diceWar"]');
    await expect(card).toContainText("Round");
    await card.getByTestId("party-game-continue").click();
    await expect(page).toHaveURL(/\/games\/dice-war\/pass-and-play$/);
    await ready(page, "dicewar-game");

    // Carried to the end: press Roll while the game goes on (a war among computers is thrown for them).
    for (let turn = 0; turn < 200; turn += 1) {
      if ((await table.getAttribute("data-state")) === "finished") break;
      const roll = page.getByTestId("dicewar-roll");
      if (await roll.isEnabled()) await roll.click();
      else await page.waitForTimeout(150);
    }
    await expect(table).toHaveAttribute("data-state", "finished", { timeout: 30_000 });
    await expect(page.getByTestId("dicewar-status")).toContainText("Game over");
    await expect(page.getByTestId("win-cover-detail")).toContainText("reached 5 points");
    // Play again at the same table starts from nothing.
    await page.getByTestId("win-cover-next").click();
    await expect(table).toHaveAttribute("data-state", "playing");
    await expect(table).toHaveAttribute("data-throws", "0");
    await expect(page.locator('[data-testid="dicewar-score"]')).toHaveText(["0", "0"]);
  });

  test("a tie for the highest is war: those who tied are marked, the stake grows, and the press rolls only them", async ({ page }) => {
    // Three people; two tie on the first throw. Made by the rules the page plays, kept where the table keeps a game.
    let game = startDiceWar({ players: ["Ann", "Ben", "Cy"], computers: [false, false, false], seed: "war-spec", to: 5 })!;
    game = playDiceWar(game, { faces: { "0": [4], "1": [4], "2": [1] } })!;
    await clearKept(page);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodeDiceWar(game)] as const);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "dicewar-game");
    const table = page.getByTestId("dicewar-game");
    // Nothing is hidden at Dice War: three people at one device are never asked to pass it.
    await expect(page.getByTestId("dicewar-seat")).toHaveCount(3);
    await expect(table).toHaveAttribute("data-war", "1");
    await expect(page.getByTestId("dicewar-stake")).toContainText("2 points at stake");
    await expect(page.locator('[data-testid="dicewar-seat"][data-tied="true"]')).toHaveCount(2);
    await expect(page.getByTestId("dicewar-said")).toContainText("Ann and Ben tied with 4: war!");
    await expect(page.getByTestId("dicewar-next")).toContainText("Ann and Ben roll again");

    await page.getByTestId("dicewar-roll").click();
    await expect(table).toHaveAttribute("data-throws", "2");
    // Only the tied players threw: Cy is out of the war, with no dice shown.
    await expect(page.getByTestId("dicewar-seat").nth(2).getByTestId("dicewar-die")).toHaveCount(0);
    await expect(page.getByTestId("dicewar-seat").nth(2)).toContainText("not in this war");
    await expect(page.getByTestId("dicewar-seat").nth(0).getByTestId("dicewar-die")).toHaveCount(1);
  });
});
