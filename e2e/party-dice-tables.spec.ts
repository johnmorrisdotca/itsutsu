import { expect, test, type Page } from "@playwright/test";

import { LIARS_RULES } from "../src/lib/party/liarsDice/liarsDice";
import type { LiarsGame } from "../src/lib/party/liarsDice/liarsDice.types";
import { PIG_RULES } from "../src/lib/party/pig/pig";
import type { PigGame } from "../src/lib/party/pig/pig.types";
import { SAYU_RULES } from "../src/lib/party/sayu/sayu";
import type { SayuGame } from "../src/lib/party/sayu/sayu.types";
import { TEN_THOUSAND_RULES } from "../src/lib/party/tenThousand/tenThousand";
import { scoringMasks } from "../src/lib/party/tenThousand/tenThousandScore";
import type { TenThousandGame } from "../src/lib/party/tenThousand/tenThousand.types";
import { ready } from "./support";

/**
 * THE PLAIN DICE GAMES ON ONE DEVICE: Pig, Ten Thousand, Liar's Dice and Sayu,
 * party games at home in the Dice family, one table for all four. Driven as a table
 * drives them: set up from the game's own page, thrown by Roll, played to an end
 * from a known position made by the same rules the page plays, kept where the table
 * keeps a game, and waiting on My games. Nothing here writes a game to the database
 * but the history each table files.
 */

const OF = { pig: "itsutsu.pig", tenThousand: "itsutsu.tenThousand", liarsDice: "itsutsu.liarsDice", sayu: "itsutsu.sayu" } as const;

async function keep(page: Page, at: string, key: string, text: string | null) {
  await page.goto(at);
  await page.evaluate(([where, value]) => (value === null ? window.localStorage.removeItem(where!) : window.localStorage.setItem(where!, value)), [key, text] as const);
}

async function openSetUp(page: Page, at: string, key: string) {
  await keep(page, at, key, null);
  await page.goto(at);
  await ready(page, "party-kind-offer");
  await page.getByTestId("game-set-up").click();
  await expect(page).toHaveURL(new RegExp(`${at}/pass-and-play$`));
  await ready(page, "dicetable-set-up");
}

const table = (page: Page) => page.getByTestId("dicetable-game");

async function fitsThePhone(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, "the page scrolls sideways").toBeLessThanOrEqual(0);
}

test.describe("the Dice family, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its page shows its games and its mark, each game's front door and rules open, and Play asks a stranger to join", async ({ page }) => {
    await page.goto("/games/dice");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dice");
    await expect(page.locator('[data-testid="family-mark"][data-family="Dice"]').first()).toBeVisible();
    for (const name of ["Yacht", "Pig", "Ten Thousand", "Liar's Dice", "Sayu", "Dice War", "Pachisi"]) await expect(page.locator("main")).toContainText(name);

    for (const [at, words] of [["/games/pig", "bank"], ["/games/ten-thousand", "hot dice"], ["/games/liars-dice", "wild"], ["/games/sayu", "counter"]] as const) {
      await page.goto(at);
      await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
      await expect(page.getByTestId("game-family")).toContainText("Dice");
      await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/dice");
      await page.getByTestId("game-rules-link").click();
      await expect(page.getByTestId("rules-page")).toContainText(words);
    }

    await page.goto("/games/pig");
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Pig", () => {
  test("set up against the computer, thrown, banked, left and found again on My games", async ({ page }) => {
    await openSetUp(page, "/games/pig", OF.pig);
    // A person and a computer is the table it opens on, to a hundred.
    await expect(page.getByTestId("dicetable-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("dicetable-name").first().fill("Ann");
    await page.locator('[data-testid="dicetable-size"][data-size="50"]').click();
    await page.getByTestId("dicetable-start").click();

    await ready(page, "dicetable-game");
    await expect(page.getByTestId("dicetable-bank")).toBeDisabled();
    // A throw: the die in the tray is the one the kept game says, and the game can be replayed to it.
    const board = page.getByTestId("pig-board");
    await page.getByTestId("dicetable-roll").click();
    await expect(board).toHaveAttribute("data-thrown", "1");
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), OF.pig);
    const game = PIG_RULES.decode(stored)!;
    await expect(page.getByTestId("dice-die").first()).toHaveAttribute("data-value", String(game.die));

    // The kept game reads back with the die it threw: a reload throws nothing new.
    await page.reload();
    await ready(page, "dicetable-game");
    await expect(page.getByTestId("pig-board")).toHaveAttribute("data-thrown", "1");
    await expect(page.getByTestId("dice-die").first()).toHaveAttribute("data-value", String(game.die));

    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="pig"]');
    await expect(card).toBeVisible();
    await card.getByTestId("party-game-continue").click();
    await expect(page).toHaveURL(/\/games\/pig\/pass-and-play$/);
    await ready(page, "dicetable-game");
  });

  test("the computer takes its turn in this browser, and the game is won and played again", async ({ page }) => {
    const start = PIG_RULES.start(50, ["Ann", ""], undefined, 20261031, [false, true])!;
    const close: PigGame = PIG_RULES.play(start, { kind: "roll" })!;
    const seeded = close.turnPoints > 0 ? close : PIG_RULES.play(PIG_RULES.play(start, { kind: "roll" })!, { kind: "roll" })!;
    await keep(page, "/games/pig", OF.pig, PIG_RULES.encode(seeded));
    await page.goto("/games/pig/pass-and-play");
    await ready(page, "dicetable-game");
    // Bank, and the computer's seat moves with nobody pressing anything.
    if (seeded.toPlay === 0 && seeded.turnPoints > 0) await page.getByTestId("dicetable-bank").click();
    await expect(async () => {
      const kept = PIG_RULES.decode(await page.evaluate((key) => window.localStorage.getItem(key), OF.pig))!;
      expect(kept.moves.length).toBeGreaterThan(seeded.moves.length + 1);
    }).toPass({ timeout: 15_000 });
  });

  test("a game reaching the score ends, says who won, and offers the table again", async ({ page }) => {
    // Twelve rounds of a known seed: a person who throws until the turn is worth banking gets there by the rules alone.
    let game: PigGame = PIG_RULES.start(50, ["Ann", "Ben"], undefined, 77, [false, false])!;
    while (game.phase === "playing" && !(game.toPlay === 0 && game.banked[0]! + game.turnPoints >= 50)) game = PIG_RULES.play(game, game.turnPoints >= 8 ? { kind: "bank" } : { kind: "roll" })!;
    await keep(page, "/games/pig", OF.pig, PIG_RULES.encode(game));
    await page.goto("/games/pig/pass-and-play");
    await ready(page, "dicetable-game");
    await page.getByTestId("dicetable-bank").click();
    await expect(table(page)).toHaveAttribute("data-state", "over");
    await expect(page.locator('[data-testid="dicetable-score"][data-won="true"]')).toHaveAttribute("data-seat", "0");
    await page.getByTestId("win-cover-see-board").click();
    await page.getByTestId("dicetable-again").click();
    await expect(table(page)).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("pig-board")).toHaveAttribute("data-thrown", "0");
  });
});

test.describe("Ten Thousand", () => {
  test("a throw is chosen from, set aside, thrown again and banked, at a phone's width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // A seed whose first throw scores and does not score with all six, so the choice is a real one.
    let seed = 1;
    let first: TenThousandGame;
    for (;;) {
      first = TEN_THOUSAND_RULES.play(TEN_THOUSAND_RULES.start(2000, ["Ann", "Ben"], undefined, seed, [false, false])!, { kind: "roll" })!;
      if (first.stage === "keep" && first.dice[0] === 1 && first.dice[1] !== 1 && first.dice[1] !== 5 && scoringMasks(first.dice.slice(1)).length > 0) break;
      seed += 1;
    }
    await keep(page, "/games/ten-thousand", OF.tenThousand, TEN_THOUSAND_RULES.encode(first));
    await page.goto("/games/ten-thousand/pass-and-play");
    await ready(page, "dicetable-game");
    const board = page.getByTestId("ten-thousand-board");
    await expect(board).toHaveAttribute("data-stage", "keep");
    await fitsThePhone(page);

    const keepPress = page.getByTestId("dicetable-keep");
    await expect(keepPress).toBeDisabled();
    await expect(keepPress).toContainText("Tap the dice");
    // A die that scores nothing with the 1: the press says so and will not go.
    await page.getByTestId("dice-die").nth(1).click();
    await expect(keepPress).toContainText("do not all score");
    await expect(keepPress).toBeDisabled();
    await page.getByTestId("dice-die").nth(1).click();
    await page.getByTestId("dice-die").nth(0).click();
    await expect(keepPress).toHaveAttribute("data-score", "100");
    await keepPress.click();
    await expect(board).toHaveAttribute("data-stage", "more");
    await expect(board).toHaveAttribute("data-turn-points", "100");
    await expect(page.getByTestId("ten-thousand-aside")).toHaveAttribute("data-dice", "1");
    await expect(page.getByTestId("dicetable-roll")).toContainText("5");
    await page.getByTestId("dicetable-bank").click();
    await expect(page.locator('[data-testid="dicetable-score"][data-seat="0"]')).toContainText("100");
    await expect(table(page)).toHaveAttribute("data-to-play", "1");
    await fitsThePhone(page);
  });

  test("a throw that scores nothing loses the turn, and says so", async ({ page }) => {
    let seed = 1;
    let bust: TenThousandGame;
    for (;;) {
      const start = TEN_THOUSAND_RULES.start(2000, ["Ann", "Ben"], undefined, seed, [false, false])!;
      bust = TEN_THOUSAND_RULES.play(start, { kind: "roll" })!;
      if (bust.stage === "roll") break;
      seed += 1;
    }
    const before = TEN_THOUSAND_RULES.start(2000, ["Ann", "Ben"], undefined, seed, [false, false])!;
    await keep(page, "/games/ten-thousand", OF.tenThousand, TEN_THOUSAND_RULES.encode(before));
    await page.goto("/games/ten-thousand/pass-and-play");
    await ready(page, "dicetable-game");
    await page.getByTestId("dicetable-roll").click();
    await expect(page.getByTestId("dicetable-news")).toContainText("Nothing scored");
    await expect(table(page)).toHaveAttribute("data-to-play", "1");
  });
});

test.describe("Liar's Dice", () => {
  test("two people at one device: the board is covered between them, a reload covers it again, and a call lifts every cup", async ({ page }) => {
    const start = LIARS_RULES.start(3, ["Ann", "Ben"], undefined, 20261031, [false, false])!;
    await keep(page, "/games/liars-dice", OF.liarsDice, LIARS_RULES.encode(start));
    await page.goto("/games/liars-dice/pass-and-play");
    await ready(page, "dicetable-game");

    // Covered, and nobody's dice are anywhere on the page.
    await expect(page.getByTestId("dicetable-pass-to")).toContainText("Ann");
    await expect(page.getByTestId("dice-die")).toHaveCount(0);
    await page.getByTestId("dicetable-pass-ready").click();
    const mine = await page.getByTestId("dice-die").evaluateAll((dice) => dice.map((die) => Number(die.getAttribute("data-value"))));
    expect(mine).toEqual([...start.cups[0]!]);

    await page.reload();
    await ready(page, "dicetable-game");
    await expect(page.getByTestId("dice-die")).toHaveCount(0);
    await page.getByTestId("dicetable-pass-ready").click();

    await page.getByTestId("liars-make-bid").click();
    // The move is made, and the board covers itself for the next person.
    await expect(page.getByTestId("dicetable-pass-to")).toContainText("Ben");
    await expect(page.getByTestId("dice-die")).toHaveCount(0);
    await page.getByTestId("dicetable-pass-ready").click();
    await expect(page.getByTestId("liars-bid")).toContainText("Ann");
    const hers = await page.getByTestId("dice-die").evaluateAll((dice) => dice.map((die) => Number(die.getAttribute("data-value"))));
    expect(hers).toEqual([...start.cups[1]!]);

    await page.getByTestId("liars-call").click();
    const after: LiarsGame = LIARS_RULES.decode(await page.evaluate((key) => window.localStorage.getItem(key), OF.liarsDice))!;
    expect(after.called).not.toBeNull();
    await page.getByTestId("dicetable-pass-ready").click();
    await expect(page.getByTestId("liars-called")).toHaveAttribute("data-loser", String(after.called!.loser));
    // Every cup, as it lay when the call was made.
    await expect(page.getByTestId("liars-lifted")).toHaveCount(2);
    await expect(page.getByTestId("liars-lifted").first()).toHaveAttribute("data-dice", start.cups[0]!.join(""));
  });

  test("one person against computers: no cover, their own dice shown, and a bid is answered by a computer in this browser", async ({ page }) => {
    await openSetUp(page, "/games/liars-dice", OF.liarsDice);
    await page.getByTestId("dicetable-name").first().fill("Ann");
    await page.getByTestId("dicetable-start").click();
    await ready(page, "dicetable-game");
    await expect(page.getByTestId("dicetable-pass")).toHaveCount(0);
    await expect(page.getByTestId("dice-die")).toHaveCount(5);
    await page.locator('[data-testid="liars-face"][data-face="4"]').click();
    await page.getByTestId("liars-more").click();
    await expect(page.getByTestId("liars-make-bid")).toHaveAttribute("data-count", "2");
    await page.getByTestId("liars-make-bid").click();
    await expect(async () => {
      const kept = LIARS_RULES.decode(await page.evaluate((key) => window.localStorage.getItem(key), OF.liarsDice))!;
      expect(kept.moves.length).toBeGreaterThan(1);
    }).toPass({ timeout: 15_000 });
    // Her dice are still hers, and no other cup is drawn while it is under a cup.
    await expect(page.getByTestId("liars-board")).toHaveAttribute("data-viewer", "0");
  });
});

test.describe("Sayu", () => {
  test("a throw says under each die where its counter went, counters are never lost, and the last holder wins the pot", async ({ page }) => {
    const start = SAYU_RULES.start(3, ["Ann", "Ben", "Cy"], undefined, 20261031, [false, false, false])!;
    await keep(page, "/games/sayu", OF.sayu, SAYU_RULES.encode(start));
    await page.goto("/games/sayu/pass-and-play");
    await ready(page, "dicetable-game");
    await page.getByTestId("dicetable-roll").click();
    const board = page.getByTestId("sayu-board");
    await expect(board).toHaveAttribute("data-thrown", "1");
    const after: SayuGame = SAYU_RULES.decode(await page.evaluate((key) => window.localStorage.getItem(key), OF.sayu))!;
    expect(after.counters.reduce((sum, held) => sum + held, after.pot)).toBe(9);
    const words = { 1: "Left", 2: "Right", 3: "Pot", 4: "Keep", 5: "Keep", 6: "Keep" } as Record<number, string>;
    for (const [at, die] of after.dice.entries()) await expect(page.getByTestId("dice-die").nth(at)).toContainText(words[die]!);
    await expect(page.getByTestId("dicetable-foot")).toContainText(String(after.pot));

    // Played on by the rules to the last throw, then pressed: the table ends and names the holder.
    let game = after;
    for (;;) {
      const next = SAYU_RULES.play(game, { kind: "roll" })!;
      if (next.phase === "over") break;
      game = next;
    }
    await keep(page, "/games/sayu", OF.sayu, SAYU_RULES.encode(game));
    await page.goto("/games/sayu/pass-and-play");
    await ready(page, "dicetable-game");
    await page.getByTestId("dicetable-roll").click();
    await expect(table(page)).toHaveAttribute("data-state", "over");
    await expect(page.locator('[data-testid="dicetable-score"][data-won="true"]')).toHaveCount(1);
  });
});
