import { expect, test, type Page } from "@playwright/test";

import { CARD_GAME_DISPLAY } from "../src/lib/cardGames/cardGames.copy";
import { CARD_GAME_LIST, type CardGameKind } from "../src/lib/cardGames/cardGames.constants";
import { GAME_FAMILIES } from "../src/lib/gomoku/families.data";
import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * THE FAMILY CARD GAMES: Hearts, Big Two, President, Go Fish and Crazy
 * Eights, round one device, with a computer in any empty seat.
 *
 * Each is played as a person plays it — cards tapped and a press, a card
 * dragged onto the table, a player chosen to ask — against computers that
 * play their own seats in this browser. And the table keeps hands hidden:
 * with two people at it, it covers every hand and asks for the device to be
 * passed on by name.
 */
const at = (kind: CardGameKind) => `/games/${PARTY_SLUGS[kind]}`;

async function clearKept(page: Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("itsutsu.cards.")) window.localStorage.removeItem(key);
  });
}

/** The set-up, filled and started: `people` of the seats are people, the first ones, and the rest computers. */
async function start(page: Page, kind: CardGameKind, players?: number, people = 1) {
  await page.goto(`${at(kind)}/pass-and-play`);
  await clearKept(page);
  await page.reload();
  await ready(page, "cards-set-up");
  if (players !== undefined) await page.locator(`[data-testid="cards-count"][data-count="${players}"]`).click();
  for (let seat = 1; seat < people; seat += 1) await page.locator('[data-testid="cards-computer"]').nth(seat).click();
  await page.getByTestId("cards-start").click();
  await ready(page, "cards-game");
}

/** Waits until it is the turn of whoever holds the device, or the game is over. */
async function myTurn(page: Page) {
  const game = page.getByTestId("cards-game");
  await expect
    .poll(async () => {
      if ((await game.getAttribute("data-state")) === "finished") return true;
      const toPlay = await game.getAttribute("data-to-play");
      return toPlay !== null && toPlay === (await game.getAttribute("data-viewer"));
    }, { timeout: 30_000 })
    .toBe(true);
}

function handCards(page: Page) {
  return page.locator('[data-card-pile="hand"] button[data-card-index]');
}

async function movesMade(page: Page): Promise<number> {
  return Number(await page.getByTestId("cards-game").getAttribute("data-moves"));
}

/** Tries each card of the hand on its own until the press asked for can be made with it; true when one could. */
async function playOneCard(page: Page, press: string): Promise<boolean> {
  const cards = handCards(page);
  const count = await cards.count();
  for (let at = 0; at < count; at += 1) {
    await cards.nth(at).click({ position: { x: 8, y: 12 } });
    const button = page.getByTestId(press);
    if (await button.isEnabled()) {
      const before = await movesMade(page);
      await button.click();
      await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
      return true;
    }
    // Put it back before trying the next.
    await page.waitForTimeout(400);
    await cards.nth(at).click({ position: { x: 8, y: 12 } });
  }
  return false;
}

test.describe("the card games, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("every one has an open front door and rules, in its family", async ({ page }) => {
    for (const kind of CARD_GAME_LIST) {
      await page.goto(at(kind));
      await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(CARD_GAME_DISPLAY[kind].label);
      await page.goto(`${at(kind)}/rules`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(CARD_GAME_DISPLAY[kind].label);
    }
  });
});

test.describe("the card games at the table", () => {
  test("Hearts: three cards passed, then a card played to a trick against three computers", async ({ page }) => {
    await start(page, "hearts");
    await myTurn(page);
    const cards = handCards(page);
    for (const at of [0, 1, 2]) await cards.nth(at).click({ position: { x: 8, y: 12 } });
    await expect(page.getByTestId("cards-pass")).toBeEnabled();
    await page.getByTestId("cards-pass").click();
    // The computers pass, the two of clubs leads, and the play comes round.
    await myTurn(page);
    expect(await playOneCard(page, "cards-play")).toBe(true);
    await expect(page.getByTestId("cards-trick-card").first()).toBeVisible();
  });

  test("Spades: a bid pressed, then a card played to a trick against three computers", async ({ page }) => {
    await start(page, "spades");
    await myTurn(page);
    // The bids go round from the dealer's left, the first seat dealing: Ann bids last, once the table has said its three.
    await expect(page.getByTestId("cards-bids")).toContainText("Bids:");
    const before = await movesMade(page);
    await page.getByTestId("cards-bid-3").click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
    await myTurn(page);
    expect(await playOneCard(page, "cards-play")).toBe(true);
    await expect(page.getByTestId("cards-trick-card").first()).toBeVisible();
    await expect(page.getByTestId("cards-score-row").first()).toContainText("bid 3");
    await clearKept(page);
  });

  test("two people at a table: every hand is covered, and the device is asked for by name", async ({ page }) => {
    await start(page, "hearts", 4, 2);
    // Two people: even the first hand waits for its player to say they have the device.
    await expect(page.getByTestId("cards-pass-device")).toContainText("Player 1");
    await expect(page.getByTestId("cards-hand-panel")).toHaveCount(0);
    await page.getByTestId("cards-ready").click();
    await myTurn(page);
    const cards = handCards(page);
    for (const at of [0, 1, 2]) await cards.nth(at).click({ position: { x: 8, y: 12 } });
    await page.getByTestId("cards-pass").click();
    const game = page.getByTestId("cards-game");
    await expect(game).toHaveAttribute("data-covered", "true");
    await expect(page.getByTestId("cards-pass-device")).toContainText("Player 2");
    await expect(page.getByTestId("cards-hand-panel")).toHaveCount(0);
    await page.getByTestId("cards-ready").click();
    await expect(page.getByTestId("cards-hand-panel")).toHaveAttribute("data-seat", "1");
  });

  test("Big Two: a card played, or a pass, against computers", async ({ page }) => {
    await start(page, "bigTwo");
    await myTurn(page);
    const before = await movesMade(page);
    if (!(await playOneCard(page, "cards-play"))) await page.getByTestId("cards-pass").click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
  });

  test("President: a card played by a double tap, or a pass", async ({ page }) => {
    await start(page, "president");
    await myTurn(page);
    const before = await movesMade(page);
    const cards = handCards(page);
    const count = await cards.count();
    let played = false;
    for (let at = 0; at < count && !played; at += 1) {
      await cards.nth(at).dblclick({ position: { x: 8, y: 12 } });
      played = (await movesMade(page)) > before;
      if (!played) {
        await page.waitForTimeout(400);
        if ((await cards.nth(at).getAttribute("aria-pressed")) === "true") await cards.nth(at).click({ position: { x: 8, y: 12 } });
      }
    }
    if (!played) await page.getByTestId("cards-pass").click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
  });

  test("Go Fish: a card chosen for its rank and a player asked for it; kept, and waiting in My games", async ({ page }) => {
    await start(page, "goFish");
    await myTurn(page);
    const before = await movesMade(page);
    await handCards(page).first().click({ position: { x: 8, y: 12 } });
    await page.getByTestId("cards-seat-target").first().click();
    await expect(page.getByTestId("cards-ask")).toBeEnabled();
    await page.getByTestId("cards-ask").click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
    await expect(page.getByTestId("cards-said")).toContainText("asked");

    await page.goto("/play");
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="pass-and-play"]').click();
    const card = page.locator('[data-testid="party-game"][data-variant="goFish"]');
    await expect(card).toBeVisible();
    await card.getByTestId("party-game-continue").click();
    await ready(page, "cards-game");
    await expect(page.getByTestId("cards-game")).toHaveAttribute("data-kind", "goFish");
    await clearKept(page);
  });

  test("Crazy Eights: a card dragged onto the table, or a draw, against computers", async ({ page }) => {
    await start(page, "crazyEights");
    await myTurn(page);
    const before = await movesMade(page);
    const cards = handCards(page);
    const count = await cards.count();
    const table = (await page.getByTestId("cards-table").boundingBox())!;
    for (let at = 0; at < count && (await movesMade(page)) === before; at += 1) {
      const box = (await cards.nth(at).boundingBox())!;
      await page.mouse.move(box.x + 8, box.y + 12);
      await page.mouse.down();
      await page.mouse.move(table.x + table.width / 2, table.y + table.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    if ((await movesMade(page)) === before) {
      // Nothing but an eight could go, and an eight let go on the table waits, chosen, for its suit to be called.
      const call = page.locator('[data-testid^="cards-call-"]:enabled');
      const draw = page.getByTestId("cards-draw");
      await ((await call.count()) > 0 ? call.first() : (await draw.count()) > 0 ? draw : page.getByTestId("cards-pass")).click();
    }
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
    await clearKept(page);
  });

  test("Euchre: trumps made round the table, then a card played to a trick against three computers", async ({ page }) => {
    await start(page, "euchre");
    await myTurn(page);
    // The first seat deals, so Ann speaks last in the making: order the card up, or call a suit (a dealer must).
    // A computer may have ordered it up already, and then Ann's first turn is the dealer's discard.
    const game = page.getByTestId("cards-game");
    if ((await page.getByTestId("cards-discard-card").count()) === 0) {
      const before = await movesMade(page);
      if ((await page.getByTestId("cards-order").count()) > 0) await page.getByTestId("cards-order").click();
      else await page.locator('[data-testid^="cards-call-"]').first().click();
      await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
      await myTurn(page);
    }
    // Picked up as dealer: one card thrown away, by a double tap.
    if ((await page.getByTestId("cards-discard-card").count()) > 0) {
      await handCards(page).first().dblclick({ position: { x: 8, y: 12 } });
      await myTurn(page);
    }
    await expect(page.getByTestId("cards-trumps")).toBeVisible();
    await expect(game).toHaveAttribute("data-state", "playing");
    expect(await playOneCard(page, "cards-play")).toBe(true);
    await clearKept(page);
  });

  test("Gin Rummy: a card drawn, then one thrown by a double tap, against the computer", async ({ page }) => {
    await start(page, "ginRummy");
    await myTurn(page);
    await expect(page.getByTestId("cards-deadwood")).toContainText("Your deadwood");
    const before = await movesMade(page);
    await page.getByTestId("cards-draw-stock").click();
    await expect.poll(() => movesMade(page)).toBe(before + 1);
    // Eleven cards in hand: the one drawn is thrown back by tapping it twice.
    await expect(handCards(page)).toHaveCount(11);
    await handCards(page).last().dblclick({ position: { x: 8, y: 12 } });
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before + 1);
    await clearKept(page);
  });

  test("Cribbage: two cards laid to the crib, then a card pegged on the count, against the computer", async ({ page }) => {
    await start(page, "cribbage");
    await myTurn(page);
    // Ann deals the first hand, so the computer has laid away already: two cards chosen for her own crib.
    await expect(page.getByTestId("cards-crib-words")).toContainText("crib");
    await expect(page.getByTestId("cards-crib-lay")).toBeDisabled();
    await handCards(page).nth(0).click();
    await handCards(page).nth(1).click();
    const before = await movesMade(page);
    await page.getByTestId("cards-crib-lay").click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
    // The starter is cut, the computer leads, and Ann plays a card on the count.
    await myTurn(page);
    await expect(page.getByTestId("cards-starter")).toBeVisible();
    await expect(page.getByTestId("cards-peg-count")).toContainText("Count:");
    await expect(handCards(page)).toHaveCount(4);
    expect(await playOneCard(page, "cards-play")).toBe(true);
    await clearKept(page);
  });

  test("Oh Hell: the dealer's bid barred from making the tricks add up, then a card played, against three computers", async ({ page }) => {
    await start(page, "ohHell");
    await myTurn(page);
    // Ann deals the first hand of one card, and bids last: exactly one of nought and one is offered.
    await expect(page.getByTestId("cards-turned")).toBeVisible();
    await expect(page.getByTestId("cards-bids")).toContainText("1 card each");
    await expect(page.locator('[data-testid^="cards-bid-"]')).toHaveCount(1);
    const before = await movesMade(page);
    await page.locator('[data-testid^="cards-bid-"]').first().click();
    await expect.poll(() => movesMade(page)).toBeGreaterThan(before);
    await myTurn(page);
    expect(await playOneCard(page, "cards-play")).toBe(true);
    await clearKept(page);
  });

  test("every family card game is on its family's shelf: Cards beside Solitaire, or Tricks", async ({ page }) => {
    const home = (kind: CardGameKind) => GAME_FAMILIES.find((family) => (family.games as readonly string[]).includes(kind))!.key;
    for (const [family, address] of [["cards", "/games/solitaire/family"], ["tricks", "/games/tricks"]] as const) {
      await page.goto(address);
      const shelved = CARD_GAME_LIST.filter((kind) => home(kind) === family);
      expect(shelved.length, `no card game at home in ${family}`).toBeGreaterThan(0);
      for (const kind of shelved) await expect(page.getByTestId("family-games")).toContainText(CARD_GAME_DISPLAY[kind].label);
    }
  });
});
