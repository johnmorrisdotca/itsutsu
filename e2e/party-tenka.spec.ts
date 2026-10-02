import { expect, test, type Page } from "@playwright/test";

import { TENKA_MOVES, TENKA_PHASES } from "../src/lib/party/tenka/tenka.constants";
import { playTenka } from "../src/lib/party/tenka/tenka";
import type { TenkaGame } from "../src/lib/party/tenka/tenka.types";
import { mostAttackDice } from "../src/lib/party/tenka/tenkaDice";
import { decodeTenka, encodeTenka } from "../src/lib/party/tenka/tenkaKeep";
import { TENKA_TERRITORIES, tenkaNeighbours } from "../src/lib/party/tenka/tenkaMap";
import { startTenka } from "../src/lib/party/tenka/tenkaStart";
import { tenkaPlayerName } from "../src/lib/party/tenka/tenkaTurn";
import { ready } from "./support";

/**
 * TENKA 天下, PASSED ROUND ONE DEVICE: world conquest for two to six, the
 * second party game of its own (`PartyKind`), at home on the Party games shelf.
 *
 * Driven as a table would drive it: from the game's own page, by pressing
 * Play, choosing how many and naming them, then tapping territories on the
 * map and pressing the phase bar's buttons. The game lives in this browser
 * only, so the case starts by clearing this browser's kept game; nothing here
 * writes to the database.
 *
 * THE DICE ARE THE GAME'S OWN, drawn from its seed, and the spec reads that
 * seed the way the page keeps it (this browser's storage) and plays the same
 * rules ahead in Node to find an attack that will take a territory — so a
 * conquest is shown every run, with nothing about the dice faked.
 */

const KEPT = "itsutsu.tenka";

const game = (page: Page) => page.getByTestId("tenka-game");
const chip = (page: Page, territory: number) => page.locator(`[data-testid="tenka-territory"][data-territory="${TENKA_TERRITORIES[territory].key}"]`);

/** The game this browser keeps, read back through the same rules the page uses. */
async function kept(page: Page): Promise<TenkaGame> {
  const text = await page.evaluate((key) => window.localStorage.getItem(key), KEPT);
  const read = decodeTenka(text);
  if (read === null) throw new Error("no game kept");
  return read;
}

/** Wait for the move just made to be kept: the table counts its moves. */
async function movesMade(page: Page, count: number) {
  await expect(game(page)).toHaveAttribute("data-moves", String(count));
}

/**
 * AN ATTACK THAT WILL TAKE A TERRITORY THIS TURN: every army placed on one
 * territory, then rolled from it into one neighbour with the most dice until
 * it falls — tried in Node, from the game's own seed, for each territory and
 * neighbour until one falls within a dozen throws. The dice each throw uses.
 */
function planConquest(start: TenkaGame): { from: number; to: number; dice: number[] } {
  const own = start.owners.flatMap((owner, territory) => (owner === start.toPlay ? [territory] : []));
  for (const from of own) {
    for (const to of tenkaNeighbours(from).filter((next) => start.owners[next] !== start.toPlay)) {
      let now = playTenka(start, { kind: TENKA_MOVES.place, territory: from, armies: start.reserve })!;
      const dice: number[] = [];
      while (now.phase === TENKA_PHASES.attack && now.armies[from] >= 2 && dice.length < 12) {
        const throwing = mostAttackDice(now.armies[from]);
        dice.push(throwing);
        now = playTenka(now, { kind: TENKA_MOVES.attack, from, to, dice: throwing })!;
      }
      // Taken with armies to spare, so that after moving in there is something to fortify back with.
      if (now.phase === TENKA_PHASES.occupy && now.armies[from] >= 3) return { from, to, dice };
    }
  }
  throw new Error("no attack takes a territory this turn");
}

test.describe("Tenka, read by anybody", () => {
  // Reading is open: the game's page and its rules name games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules open with no session, publish the world, and Play asks a stranger to join", async ({ page }) => {
    await page.goto("/games/tenka");
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Tenka/ })).toBeVisible();
    await expect(page.getByTestId("party-offered")).toContainText("2–6 players");
    await expect(page.getByTestId("party-offered")).toContainText("a map of the modern world");
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/party");

    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/tenka\/rules$/);
    const rules = page.getByTestId("rules-page");
    await expect(rules).toContainText("a tie goes to the defender");
    await expect(rules).toContainText("4, 6, 8, 10, 12, 15");
    // The continents and their bonuses, published.
    await expect(page.getByTestId("tenka-continent")).toHaveCount(6);
    await expect(page.locator('[data-testid="tenka-continent"][data-continent="asia"]')).toContainText("+7");
    await expect(page.getByTestId("tenka-world")).toContainText("Alaska (by sea: The Russian Far East)");

    const picture = page.locator('img[src="/art/games/tenka.jpg"]').first();
    await expect(picture).toBeVisible();
    expect(await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Playing is for members: a stranger pressing Play is asked for an invite.
    await page.goto("/games/tenka");
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Tenka, pass and play", () => {
  test("Europe is chosen on the set-up: the preview and the game are Europe's, with its eleven regions to look at", async ({ page }) => {
    await page.goto("/games/tenka");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
    await page.goto("/games/tenka/pass-and-play");
    await ready(page, "tenka-set-up");
    const preview = page.getByTestId("tenka-preview");
    await expect(preview.getByTestId("tenka-territory")).toHaveCount(42);

    await page.locator('[data-testid="tenka-map"][data-value="europe"]').click();
    await expect(page.locator('[data-testid="tenka-map"][data-value="europe"]')).toHaveAttribute("aria-checked", "true");
    await expect(preview.getByTestId("tenka-territory")).toHaveCount(37);
    await expect(preview.getByRole("group", { name: "Map of Europe" })).toBeVisible();
    await expect(page.locator('[data-testid="tenka-length"][data-value="60"]')).toHaveText("All of Europe");

    await page.getByTestId("tenka-start").click();
    await ready(page, "tenka-game");
    await expect(page.getByTestId("tenka-territory")).toHaveCount(37);
    await expect(page.locator('[data-testid="tenka-territory"][data-territory="greatBritain"]')).toHaveCount(1);
    const regions = page.getByTestId("tenka-region");
    await expect(regions).toHaveCount(12);
    await expect(regions.first()).toHaveText("Europe");
    await expect(page.locator('[data-testid="tenka-region"][data-region="scandinavia"]')).toHaveText("Nordic");
    // Europe has no edge to go off: none of the world's Bering Strait tags.
    await expect(page.locator('[data-testid="tenka-territory"][data-territory="alaska"]')).toHaveCount(0);
  });

  test("three players: armies placed by tapping, an attack thrown and a territory taken, a fortifying move, the turn passed by name, kept and found again", async ({ page }) => {
    await page.goto("/games/tenka");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);

    // From the front door, by the one big Play.
    await page.goto("/games/tenka");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Play →");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/tenka\/pass-and-play$/);
    await ready(page, "tenka-set-up");

    // Three at the table, the whole world, armies placed for us; the preview is the live map dealt for three.
    await page.locator('[data-testid="tenka-count"][data-value="3"]').click();
    await expect(page.locator('[data-testid="tenka-count"][data-value="3"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("tenka-preview").locator('[data-testid="tenka-territory"][data-owner="2"]')).toHaveCount(14);
    await page.getByTestId("tenka-name").nth(0).fill("Ann");
    await page.getByTestId("tenka-name").nth(1).fill("Ben");
    await page.getByTestId("tenka-start").click();
    await ready(page, "tenka-game");
    await expect(game(page)).toHaveAttribute("data-players", "3");
    await expect(game(page)).toHaveAttribute("data-phase", "reinforce");
    await expect(page.getByTestId("tenka-territory")).toHaveCount(42);

    const start = await kept(page);
    const mover = tenkaPlayerName(start, start.toPlay);
    const next = tenkaPlayerName(start, (start.toPlay + 1) % 3);
    await expect(page.getByTestId("tenka-turn-name")).toHaveText(mover);

    // The device is passed to the player named, and only then is anything theirs to press.
    await expect(page.getByTestId("tenka-pass-to")).toHaveText(`Pass to ${mover}`);
    await page.getByTestId("tenka-ready").click();
    await expect(game(page)).toHaveAttribute("data-handed", "true");

    // PLACE: tap a territory of their own, one army; then all the rest onto it.
    const plan = planConquest(start);
    const before = start.armies[plan.from];
    await chip(page, plan.from).click();
    await movesMade(page, 1);
    await expect(chip(page, plan.from)).toHaveAttribute("data-armies", String(before + 1));
    await page.getByTestId("tenka-place-all").click();
    await expect(game(page)).toHaveAttribute("data-phase", "attack");
    await expect(chip(page, plan.from)).toHaveAttribute("data-armies", String(before + start.reserve));

    // ATTACK: tap where from — its neighbours light up — then the target, and throw.
    await chip(page, plan.from).click();
    await expect(chip(page, plan.from)).toHaveAttribute("data-chosen", "true");
    await expect(chip(page, plan.to)).toHaveAttribute("data-reach", "true");
    await chip(page, plan.to).click();
    await expect(chip(page, plan.to)).toHaveAttribute("data-target", "true");
    for (const [thrown, dice] of plan.dice.entries()) {
      await page.locator(`[data-testid="tenka-roll"][data-dice="${dice}"]`).click();
      await movesMade(page, 3 + thrown);
      await expect(page.getByTestId("tenka-dice")).toHaveAttribute("data-rolled", "true");
      await expect(page.getByTestId("tenka-attack-dice").getByTestId("tenka-die")).toHaveCount(dice);
    }
    // Taken: said in words, and the territory is theirs, with armies to move in.
    await expect(page.getByTestId("tenka-took")).toContainText(`${mover} takes ${TENKA_TERRITORIES[plan.to].name}`);
    await expect(page.getByTestId("tenka-roll-words")).toContainText("threw");
    await expect(chip(page, plan.to)).toHaveAttribute("data-owner", String(start.toPlay));
    await expect(game(page)).toHaveAttribute("data-phase", "occupy");
    // Moving in is plainly a button to press, at the count offered: all but one.
    await expect(page.getByTestId("tenka-occupy")).toBeEnabled();
    await expect(page.getByTestId("tenka-occupy")).toHaveText(/^Move \d+ in$/);
    await page.getByTestId("tenka-occupy").click();
    await expect(game(page)).toHaveAttribute("data-phase", "attack");

    // FORTIFY: done attacking, then armies from the territory taken back to where they came from.
    await page.getByTestId("tenka-end-attack").click();
    await expect(game(page)).toHaveAttribute("data-phase", "fortify");
    const moving = Number(await chip(page, plan.to).getAttribute("data-armies"));
    await chip(page, plan.to).click();
    await expect(chip(page, plan.from)).toHaveAttribute("data-reach", "true");
    await chip(page, plan.from).click();
    await page.getByTestId("tenka-fortify").click();
    await expect(chip(page, plan.to)).toHaveAttribute("data-armies", "1");
    expect(moving).toBeGreaterThan(1);

    // The turn passes round the table, by name — with a card for the territory taken.
    await expect(page.getByTestId("tenka-turn-name")).toHaveText(next);
    await expect(page.getByTestId("tenka-pass-to")).toHaveText(`Pass to ${next}`);
    const afterTurn = await kept(page);
    expect(afterTurn.hands[start.toPlay].length).toBe(1);
    await expect(page.getByTestId("tenka-news")).toContainText(`${mover} took a card`);
    const made = afterTurn.moves.length;

    // Kept in this browser: a reload brings back the same world, the same dice, the same turn.
    await page.reload();
    await ready(page, "tenka-game");
    await expect(game(page)).toHaveAttribute("data-moves", String(made));
    await expect(page.getByTestId("tenka-pass-to")).toHaveText(`Pass to ${next}`);
    await expect(chip(page, plan.to)).toHaveAttribute("data-owner", String(start.toPlay));

    // And it waits on My games' Pass and play tab, with the way back.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="tenka"]');
    await expect(card).toContainText("3 players");
    await expect(card).toContainText(`${next} to play`);
    await card.getByTestId("party-game-continue").click();
    await ready(page, "tenka-game");
    await expect(game(page)).toHaveAttribute("data-moves", String(made));

    // The front door says Continue while it is going.
    await page.goto("/games/tenka");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Continue →");
    // And a New game beside it, saying what it does to the game going, and asking before it does it (`GameInProgressOffer`).
    await expect(page.getByTestId("game-new-note")).toHaveText("New game ends the one in progress here.");
    await page.getByTestId("game-new").click();
    await expect(page.getByTestId("game-new-confirm")).toContainText("The one in progress ends here and is not kept");
    await page.getByTestId("game-new-no").click();
    await expect(page.getByTestId("game-new-confirm")).toHaveCount(0);
    await page.getByTestId("game-set-up").click();
    await ready(page, "tenka-game");

    // On a desk and on a phone, the whole table fits the width of the glass, with nothing to scroll sideways.
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.getByTestId("tenka-map")).toBeVisible();
      await expect(page.getByTestId("tenka-bar")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }

    // At the table the same two words sit in one row: New game asks first, and a new game sets itself up.
    await expect(page.getByTestId("game-ending")).toContainText("New game");
    await page.getByTestId("tenka-new").click();
    await page.getByTestId("tenka-new-yes").click();
    await ready(page, "tenka-set-up");
  });
});

/** A game of two where the player to move holds the Russian Far East and somebody else Alaska, every army placed there and the attack begun: dealt in Node from the first seed that deals it. */
function acrossTheStrait(): TenkaGame {
  const alaska = TENKA_TERRITORIES.findIndex((territory) => territory.key === "alaska");
  const farEast = TENKA_TERRITORIES.findIndex((territory) => territory.key === "farEast");
  for (let seed = 1; seed < 10_000; seed += 1) {
    const start = startTenka(60, ["Ann", "Ben"], seed);
    if (start === null || start.owners[farEast] !== start.toPlay || start.owners[alaska] === start.toPlay) continue;
    const placed = playTenka(start, { kind: TENKA_MOVES.place, territory: farEast, armies: start.reserve });
    if (placed !== null && placed.phase === TENKA_PHASES.attack) return placed;
  }
  throw new Error("no seed deals the Far East to the player to move");
}

const CONTINENT_KEYS = ["northAmerica", "southAmerica", "europe", "africa", "asia", "oceania"] as const;

for (const width of [1280, 390]) {
  test.describe(`Tenka's map at ${width} pixels`, () => {
    test.use({ viewport: { width, height: 844 } });

    // John, 2026-09-29: N. America did nothing, Asia was not full width, and the ways round the world could not be seen.
    test("every Look at frames its continent whole and large, and the Bering Strait is crossed from a tag at the edge", async ({ page }) => {
      await page.goto("/games/tenka");
      await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodeTenka(acrossTheStrait())]);
      await page.goto("/games/tenka/pass-and-play");
      await ready(page, "tenka-game");
      await page.getByTestId("tenka-ready").click();
      const map = page.getByTestId("tenka-map");
      await expect(map).toHaveAttribute("data-fitted", "true");
      const world = Number(await map.getAttribute("data-scale"));
      const box = (await map.boundingBox())!;

      for (const key of CONTINENT_KEYS) {
        await page.locator(`[data-testid="tenka-region"][data-region="${key}"]`).click();
        await expect(map).toHaveAttribute("data-fitted", "false");
        // Closer than the whole world by half again, which the whole world framed again never is.
        await expect.poll(async () => Number(await map.getAttribute("data-scale"))).toBeGreaterThan(world * 1.5);
        const lands = map.locator('[data-testid="tenka-land"]');
        const members = TENKA_TERRITORIES.flatMap((territory) => (territory.continent === key ? [territory.key] : []));
        const rects = await lands.evaluateAll(
          (paths, keys) => paths.filter((path) => keys.includes(path.getAttribute("data-territory") ?? "")).map((path) => path.getBoundingClientRect().toJSON() as DOMRect),
          members,
        );
        expect(rects.length).toBe(members.length);
        // Every counter of the continent is inside the map's box.
        for (const member of members) {
          const counter = (await page.locator(`[data-testid="tenka-territory"][data-territory="${member}"]`).boundingBox())!;
          expect(counter.x, `${key}: ${member}`).toBeGreaterThanOrEqual(box.x - 1);
          expect(counter.x + counter.width, `${key}: ${member}`).toBeLessThanOrEqual(box.x + box.width + 1);
        }
        // And the continent fills the box across or down.
        const left = Math.min(...rects.map((rect) => rect.left));
        const right = Math.max(...rects.map((rect) => rect.right));
        const top = Math.min(...rects.map((rect) => rect.top));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        const across = (Math.min(right, box.x + box.width) - Math.max(left, box.x)) / box.width;
        const down = (Math.min(bottom, box.y + box.height) - Math.max(top, box.y)) / box.height;
        expect(Math.max(across, down), key).toBeGreaterThan(0.7);
      }

      // The whole world again: a tag at each edge names what is across the strait.
      await page.locator('[data-testid="tenka-region"][data-region="world"]').click();
      await expect(map).toHaveAttribute("data-fitted", "true");
      const toAlaska = page.locator('[data-testid="tenka-wrap"][data-edge="east"]');
      const toFarEast = page.locator('[data-testid="tenka-wrap"][data-edge="west"]');
      await expect(toAlaska).toHaveText("Alaska →");
      await expect(toFarEast).toHaveText("← Russian Far East");
      await expect(toAlaska).toHaveAttribute("data-lit", "false");

      // Attack from the Far East: Alaska is in reach, its tag lights, and a tap on the tag is a tap on Alaska.
      await chip(page, TENKA_TERRITORIES.findIndex((territory) => territory.key === "farEast")).click();
      const alaska = TENKA_TERRITORIES.findIndex((territory) => territory.key === "alaska");
      await expect(chip(page, alaska)).toHaveAttribute("data-reach", "true");
      if (width < 640) await page.locator('[data-testid="tenka-region"][data-region="world"]').click();
      await expect(toAlaska).toHaveAttribute("data-lit", "true");
      await toAlaska.click();
      await expect(chip(page, alaska)).toHaveAttribute("data-target", "true");
    });
  });
}

const EUROPE = ["britain", "nordic", "westernEurope", "centralEurope", "southernEurope", "easternEurope", "westernRussia"];

test.describe("Tenka on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("counters stay readable at the whole world, a continent is one tap away, and choosing where from brings it close", async ({ page }) => {
    await page.goto("/games/tenka");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
    await page.goto("/games/tenka/pass-and-play");
    await ready(page, "tenka-set-up");
    await page.getByTestId("tenka-start").tap();
    await ready(page, "tenka-game");
    await page.getByTestId("tenka-ready").tap();
    const map = page.getByTestId("tenka-map");
    await expect(map).toHaveAttribute("data-fitted", "true");

    // THE WHOLE WORLD: every counter drawn whole is seventeen pixels tall on the glass; the crowded ones wait as dots.
    const whole = page.locator('[data-testid="tenka-territory"]:not([data-dot])');
    expect(await whole.count()).toBeGreaterThan(20);
    for (const height of await whole.evaluateAll((chips) => chips.map((chip) => chip.getBoundingClientRect().height))) {
      expect(height).toBeGreaterThanOrEqual(15);
      expect(height).toBeLessThanOrEqual(20);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    // ONE TAP ON EUROPE: close enough that every European counter is drawn whole, and World goes back.
    await page.locator('[data-testid="tenka-region"][data-region="europe"]').tap();
    await expect(map).toHaveAttribute("data-readable", "true");
    for (const key of EUROPE) await expect(page.locator(`[data-testid="tenka-territory"][data-territory="${key}"]`)).not.toHaveAttribute("data-dot", "true");
    await page.locator('[data-testid="tenka-region"][data-region="world"]').tap();
    await expect(map).toHaveAttribute("data-fitted", "true");

    // CHOOSING WHERE FROM: place the turn's armies on one territory, then choose it to attack from; the map comes close.
    const start = await kept(page);
    const from = planConquest(start).from;
    await chip(page, from).tap();
    await page.getByTestId("tenka-place-all").tap();
    await expect(game(page)).toHaveAttribute("data-phase", "attack");
    await chip(page, from).tap();
    await expect(chip(page, from)).toHaveAttribute("data-chosen", "true");
    await expect(map).toHaveAttribute("data-readable", "true");
    await expect(map).toHaveAttribute("data-fitted", "false");
    // Every territory it can reach has its counter whole, to be tapped.
    const reach = page.locator('[data-testid="tenka-territory"][data-reach="true"]');
    expect(await reach.count()).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="tenka-territory"][data-reach="true"][data-dot="true"]')).toHaveCount(0);
    // At least one of them is on the glass without a pan (one across an ocean may need one); tap it.
    const box = (await map.boundingBox())!;
    const onScreen = await reach.evaluateAll(
      (chips, [left, top, right, bottom]) =>
        chips.map((chip) => chip.getBoundingClientRect()).map((rect) => rect.left >= left && rect.right <= right && rect.top >= top && rect.bottom <= bottom),
      [box.x, box.y, box.x + box.width, box.y + box.height],
    );
    // Or, from Alaska or the Far East, the lit tag at the map's edge naming the other side of the Bering Strait.
    const litWrap = page.locator('[data-testid="tenka-wrap"][data-lit="true"]');
    if (onScreen.includes(true)) await reach.nth(onScreen.indexOf(true)).tap();
    else {
      await expect(litWrap).toHaveCount(1);
      await litWrap.tap();
    }
    // And the dice of a throw are in the phase bar, where the thumb is.
    await page.getByTestId("tenka-roll").first().tap();
    await expect(page.getByTestId("tenka-bar-dice")).toHaveAttribute("data-rolled", "true");
    await expect(page.getByTestId("tenka-bar-dice").getByTestId("tenka-die").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("Tenka on the Party games shelf", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is at home there and leads to its own page", async ({ page }) => {
    await page.goto("/games/party");
    const card = page.getByTestId("family-game-tenka");
    await expect(card).toHaveAttribute("data-listed", "home");
    await card.getByRole("link", { name: /Tenka/ }).first().click();
    await expect(page).toHaveURL(/\/games\/tenka$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/tenka");
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
