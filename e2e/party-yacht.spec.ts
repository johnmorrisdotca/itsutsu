import { expect, test, type Page } from "@playwright/test";

import { playYacht, startYacht } from "../src/lib/party/yacht/yacht";
import { encodeYacht } from "../src/lib/party/yacht/yachtCodec";
import type { YachtGame } from "../src/lib/party/yacht/yacht.types";
import { ready } from "./support";

/**
 * YACHT, THE DICE GAME: a party game (`PartyKind` "yacht") at home in the Dice
 * family, for one alone or up to eight round one device, with a computer in
 * any seat.
 *
 * Driven as a table drives it: set up from the game's own page, the dice
 * thrown by Roll and by a tap on the tray, a die held by a tap, a box written
 * by a tap on the sheet. A game's end is reached from a known position made by
 * the same rules the page plays, kept where the table keeps a game. Nothing
 * here writes to the database.
 */
const KEPT = "itsutsu.yacht";
const AT = "/games/yacht";

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

/** The five dice as the tray says they lie. */
async function diceOf(page: Page): Promise<number[]> {
  return page.getByTestId("dice-die").evaluateAll((dice) => dice.map((die) => Number(die.getAttribute("data-value"))));
}

test.describe("Yacht, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Yacht/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/party");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/yacht\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("full house");

    await page.goto("/games/party");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Party games");
    await expect(page.locator('[data-testid="family-mark"][data-family="Party games"]').first()).toBeVisible();
    await expect(page.locator("main")).toContainText("Yacht");

    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Yacht, pass and play", () => {
  test("one person and a computer: roll, hold, roll by the tray, score a box; the computer answers; kept, and waiting on My games", async ({ page }) => {
    await clearKept(page);
    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/yacht\/pass-and-play$/);
    await ready(page, "yacht-set-up");
    await page.locator('[data-testid="yacht-count"][data-count="2"]').click();
    await page.getByTestId("yacht-name").first().fill("Ann");
    // The second seat opens as a computer.
    await expect(page.getByTestId("yacht-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("yacht-start").click();

    await ready(page, "yacht-game");
    const table = page.getByTestId("yacht-game");
    await expect(table).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("yacht-turn")).toContainText("Ann to roll");
    // Nothing thrown yet, so no box can be written.
    await expect(page.getByTestId("yacht-box")).toHaveCount(0);

    await page.getByTestId("yacht-roll").click();
    await expect(table).toHaveAttribute("data-rolls", "1");
    const first = await diceOf(page);
    expect(first.every((die) => die >= 1 && die <= 6)).toBe(true);

    // Hold the first die, and throw the rest by tapping the tray.
    await page.getByTestId("dice-die").first().click();
    await expect(page.getByTestId("dice-die").first()).toHaveAttribute("data-held", "true");
    await page.getByTestId("dice-tray-roll").click({ position: { x: 8, y: 8 } });
    await expect(table).toHaveAttribute("data-rolls", "2");
    expect((await diceOf(page))[0]).toBe(first[0]);
    await expect(page.getByTestId("dice-die").first()).toHaveAttribute("data-held", "true");

    // Every empty box says what it would score; write Chance, which is always the dice's sum.
    const sum = (await diceOf(page)).reduce((total, die) => total + die, 0);
    const chance = page.locator('[data-testid="yacht-box"][data-box="12"]');
    await expect(chance).toHaveAttribute("data-would", String(sum));
    await chance.click();
    await expect(page.locator('[data-testid="yacht-cell"][data-seat="0"][data-box="12"]')).toHaveAttribute("data-score", String(sum));

    // The computer takes its turn by itself, and it comes back round.
    await expect(page.getByTestId("yacht-turn")).toHaveAttribute("data-computer", "true");
    await expect(table).toHaveAttribute("data-to-play", "0", { timeout: 20_000 });
    await expect(page.locator('[data-testid="yacht-cell"][data-seat="1"][data-score]')).toHaveCount(1);

    // Kept in this browser: a reload opens the same sheet, and My games lists it.
    await page.reload();
    await ready(page, "yacht-game");
    await expect(page.locator('[data-testid="yacht-cell"][data-seat="0"][data-box="12"]')).toHaveAttribute("data-score", String(sum));
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="yacht"]');
    await expect(card).toContainText("Turn 2 of 13");
    await card.getByTestId("party-game-continue").click();
    await expect(page).toHaveURL(/\/games\/yacht\/pass-and-play$/);
    await ready(page, "yacht-game");
  });

  test("alone: the last box filled ends the game with the score, and Play again starts a fresh sheet", async ({ page }) => {
    // Twelve turns played by the rules, each writing its first roll into the next box; the thirteenth is left to the page.
    let game: YachtGame = startYacht(["Ann"], 20260930, [false])!;
    for (let box = 0; box < 12; box += 1) game = playYacht(playYacht(game, { kind: "roll", hold: 0 })!, { kind: "score", box })!;
    await clearKept(page);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodeYacht(game)] as const);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "yacht-game");
    await expect(page.getByTestId("yacht-sheet")).toContainText("fill the sheet");
    await page.getByTestId("yacht-roll").click();
    await page.locator('[data-testid="yacht-box"][data-box="12"]').click();
    await expect(page.getByTestId("yacht-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("win-cover-detail")).toContainText("Your sheet is full");
    await page.getByTestId("win-cover-next").click();
    await expect(page.getByTestId("yacht-game")).toHaveAttribute("data-state", "playing");
    await expect(page.locator('[data-testid="yacht-cell"][data-score]')).toHaveCount(0);
  });
});
