import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { startHitotsu } from "../src/lib/party/hitotsu/hitotsu";
import { encodeHitotsu } from "../src/lib/party/hitotsu/hitotsuRules";
import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * HITOTSU, the colour-card game (`PartyKind` "hitotsu", docs/plans/hitotsu/),
 * at home in the Colour cards family: round one device with a computer in any seat,
 * or on several devices.
 *
 * Driven as a table drives it: set up from the game's own page, a card tapped
 * and played, a wild's colour called, a draw where nothing goes. The rule a
 * wild shows is reached from a known deal made by the same rules the page
 * plays and kept where the table keeps a game. The table on one device lives
 * in this browser only; the table on several is this spec's own, taken away
 * at the end.
 */
const KEPT = "itsutsu.hitotsu";
const AT = "/games/hitotsu";
const PHONE = { width: 390, height: 844 };

const game = (page: Page) => page.getByTestId("hitotsu-game");

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

/**
 * The whole of one seat's turn: a card that goes, played (its colour called
 * where it is a wild, the call made where the rules ask), else a draw, and
 * the card drawn kept where it does not go. A card is tapped at its left
 * edge, the part of it a fanned hand always shows.
 */
async function takeTurn(page: Page, seat: number) {
  const before = await game(page).getAttribute("data-moves");
  const card = page.locator('[data-testid="hitotsu-hand-card"][data-goes="true"]').first();
  if ((await card.count()) > 0) {
    await card.click({ position: { x: 6, y: 24 } });
    await expect(card).toHaveAttribute("aria-pressed", "true");
    const call = page.getByTestId("hitotsu-call");
    if ((await call.count()) > 0 && (await call.getAttribute("aria-pressed")) === "false") await call.click();
    const colour = page.locator('[data-testid^="hitotsu-colour-"]').first();
    const swap = page.locator('[data-testid^="hitotsu-swap-"]').first();
    if ((await colour.count()) > 0) await colour.click();
    else if ((await swap.count()) > 0) await swap.click();
    else await page.getByTestId("hitotsu-play").click();
  } else if ((await page.getByTestId("hitotsu-take").count()) > 0) {
    await page.getByTestId("hitotsu-take").click();
  } else {
    await page.getByTestId("hitotsu-draw").click();
    await expect(game(page)).not.toHaveAttribute("data-moves", before!);
    // The card drawn goes or it does not: played where it goes, kept where it does not.
    if ((await game(page).getAttribute("data-to-play")) === String(seat) && (await page.getByTestId("hitotsu-pass").count()) > 0) await page.getByTestId("hitotsu-pass").click();
    return;
  }
  await expect(game(page)).not.toHaveAttribute("data-moves", before!);
}

test.describe("Hitotsu, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Hitotsu/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Colour cards");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/hitotsu\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("Hitotsu!");
    await expect(page.getByTestId("rules-page")).toContainText("Jump-in");
    await page.goto("/games/colour-cards");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Colour cards");
    await expect(page.locator('[data-testid="family-mark"][data-family="Colour cards"]').first()).toBeVisible();
    await expect(page.locator("main")).toContainText("Hitotsu");
    // Crazy Eights, at home in Cards, is shown here beside the game that grew out of it.
    await expect(page.locator("main")).toContainText("Crazy Eights");
  });
});

test.describe("Hitotsu, round one device", () => {
  test("one person and two computers: a card played, the computers answer, kept, and waiting on My games", async ({ page }) => {
    await clearKept(page);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "hitotsu-set-up");
    await expect(page.getByTestId("hitotsu-set-up")).toHaveAttribute("data-mode", "classic");
    await page.locator('[data-testid="hitotsu-count"][data-count="3"]').click();
    await page.getByTestId("hitotsu-name").first().fill("Ann");
    await expect(page.getByTestId("hitotsu-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("hitotsu-start").click();

    await ready(page, "hitotsu-game");
    await expect(game(page)).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("hitotsu-pass-device")).toHaveCount(0);
    await expect(page.getByTestId("hitotsu-hand-card")).toHaveCount(7);
    // Everybody else is a row over the table, holding seven cards, face down.
    await expect(page.getByTestId("hitotsu-seat")).toHaveCount(2);

    for (let turn = 0; turn < 3; turn += 1) {
      await expect(game(page)).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
      await takeTurn(page, 0);
    }
    await expect(game(page)).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
    expect(Number(await game(page).getAttribute("data-moves"))).toBeGreaterThanOrEqual(5);

    const moves = await game(page).getAttribute("data-moves");
    await page.reload();
    await ready(page, "hitotsu-game");
    await expect(game(page)).toHaveAttribute("data-moves", moves!);
    await page.goto("/play/pass-and-play");
    const waiting = page.locator('[data-testid="party-game"][data-variant="hitotsu"]');
    await expect(waiting).toContainText("Ann to play");
    await waiting.getByTestId("party-game-continue").click();
    await ready(page, "hitotsu-game");
    await page.getByTestId("hitotsu-new").click();
    await page.getByTestId("hitotsu-new-yes").click();
    await ready(page, "hitotsu-set-up");
  });

  test("a wild played from a known deal: its colour called, and the table follows it", async ({ page }) => {
    // The first seed whose deal puts a plain wild in Ann's hand on her turn.
    let dealt = null;
    for (let seed = 1; dealt === null; seed += 1) {
      const one = startHitotsu(500, ["Ann", "Ben"], seed, undefined, [false, true])!;
      if (one.toPlay === 0 && one.hands[0]!.some((card) => card.startsWith("WW")) && one.colour !== "G") dealt = one;
    }
    await clearKept(page);
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [KEPT, encodeHitotsu(dealt)] as const);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "hitotsu-game");
    const wild = page.locator('[data-testid="hitotsu-hand-card"][data-card^="WW"]').first();
    await expect(wild).toHaveAttribute("data-goes", "true");
    await wild.click({ position: { x: 6, y: 24 } });
    await expect(page.getByTestId("hitotsu-colour-R")).toBeVisible();
    await page.getByTestId("hitotsu-colour-G").click();
    await expect(page.getByTestId("hitotsu-discard")).toHaveAttribute("data-card", /^WW/);
    await expect(page.getByTestId("hitotsu-colour")).toHaveAttribute("data-colour", "G");
    await expect(game(page)).toHaveAttribute("data-moves", "1");
  });

  test("Party mode opens on one short hand with the party rules; jump-in is for one person, and two pass a cover", async ({ page }) => {
    await clearKept(page);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "hitotsu-set-up");
    await page.locator('[data-testid="hitotsu-mode"][data-value="party"]').click();
    await expect(page.locator('[data-testid="hitotsu-length"][data-size="1"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("hitotsu-stacking")).toHaveAttribute("data-value", "any");
    await expect(page.getByTestId("hitotsu-seven-zero")).toHaveAttribute("data-value", "on");
    await expect(page.getByTestId("hitotsu-jump-in")).toHaveAttribute("data-value", "on");

    // A second person at the table: jumping in is not offered, and says why.
    await page.locator('[data-testid="hitotsu-count"][data-count="2"]').click();
    await page.getByTestId("hitotsu-computer").nth(1).click();
    await expect(page.getByTestId("hitotsu-jump-in")).toHaveAttribute("data-value", "off");
    await expect(page.getByTestId("hitotsu-jump-in")).toContainText("one person");
    await page.getByTestId("hitotsu-start").click();

    await ready(page, "hitotsu-game");
    await expect(page.getByTestId("hitotsu-hand-card")).toHaveCount(0);
    await expect(page.getByTestId("hitotsu-pass-device")).toBeVisible();
    await page.getByTestId("hitotsu-ready").click();
    await expect(page.getByTestId("hitotsu-hand-card")).toHaveCount(5);
    const first = await game(page).getAttribute("data-to-play");
    await takeTurn(page, Number(first));
    // The other player's turn: covered again, until they say they have the device.
    if ((await game(page).getAttribute("data-to-play")) !== first) {
      await expect(page.getByTestId("hitotsu-pass-device")).toBeVisible();
      await expect(page.getByTestId("hitotsu-hand-card")).toHaveCount(0);
    }
  });
});

test.describe("Hitotsu on several devices", () => {
  const stamp = Date.now().toString(36);
  const host = { email: `hitotsu-host-${stamp}@example.test`, name: `Ada-${stamp}` };
  const guest = { email: `hitotsu-guest-${stamp}@example.test`, name: `Bo-${stamp}` };
  const made: string[] = [];

  test.afterAll(async () => {
    await removeTables(made);
    for (const member of [host, guest]) await removeMember(member.email);
  });

  async function phone(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }): Promise<{ context: BrowserContext; page: Page }> {
    const context = await memberContext(browser, baseURL, member, { viewport: PHONE });
    return { context, page: await context.newPage() };
  }

  test("two members and a computer: each hand only on its own device, a turn from each and the computer's seen on both", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const guestId = await memberIdFor(guest.email);
    expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

    await a.page.goto(`${AT}/pass-and-play`);
    await ready(a.page, "hitotsu-set-up");
    await a.page.locator('[data-testid="hitotsu-count"][data-count="3"]').click();
    await a.page.getByTestId("online-where-several").click();
    // No jumping in on several devices.
    await expect(a.page.getByTestId("hitotsu-jump-in")).toHaveAttribute("data-value", "off");
    await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
    await a.page.locator('[data-testid="online-seat-choice"][data-seat="2"]').selectOption("computer:computer");
    await a.page.getByTestId("hitotsu-start").click();
    await expect(a.page).toHaveURL(/\/games\/hitotsu\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
    const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
    made.push(id);
    await ready(a.page, "online-table");
    await expect(game(a.page)).toHaveAttribute("data-state", "playing");

    await b.page.goto(`${AT}/tables/${id}`);
    await ready(b.page, "online-table");
    await expect(a.page.getByTestId("hitotsu-desk")).toHaveAttribute("data-seat", "0");
    await expect(b.page.getByTestId("hitotsu-desk")).toHaveAttribute("data-seat", "1");
    await expect(a.page.getByTestId("hitotsu-desk")).toHaveCount(1);

    // The server refuses Bo a move for another seat.
    const wrong = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 0, seat: 0, move: { draw: true } } });
    expect(wrong.status()).toBe(403);

    // Whoever the deal leads takes their turn on their own device, then the other; the computer plays in between.
    for (let turns = 0; turns < 2; turns += 1) {
      await expect.poll(async () => game(a.page).getAttribute("data-to-play"), { timeout: 30_000 }).not.toBe("2");
      const seat = await game(a.page).getAttribute("data-to-play");
      const page = seat === "0" ? a.page : b.page;
      await expect(game(page)).toHaveAttribute("data-to-play", seat!, { timeout: 20_000 });
      await expect(page.getByTestId("online-status")).toHaveText("Your turn.", { timeout: 30_000 });
      await takeTurn(page, Number(seat));
      const after = await game(page).getAttribute("data-moves");
      const other = page === a.page ? b.page : a.page;
      await expect.poll(async () => Number(await game(other).getAttribute("data-moves")), { timeout: 20_000 }).toBeGreaterThanOrEqual(Number(after));
    }
    await expect(a.page.locator('[data-testid="online-seat"][data-seat="2"]')).toContainText("Computer");
    const wide = await a.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);

    await a.context.close();
    await b.context.close();
  });
});
