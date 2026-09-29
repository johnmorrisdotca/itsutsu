import { expect, test, type Locator, type Page } from "@playwright/test";

import { TENKA_PHASES } from "../src/lib/party/tenka/tenka.constants";
import type { TenkaGame } from "../src/lib/party/tenka/tenka.types";
import { decodeTenka } from "../src/lib/party/tenka/tenkaKeep";
import { TENKA_TERRITORIES, tenkaNeighbours } from "../src/lib/party/tenka/tenkaMap";
import { ready } from "./support";

/**
 * A WIDE GAME ON A DESK. John, 2026-09-29, at Tenka at a desk and in its "Just
 * the board": "some games on desktop should have full width/height option.
 * where once play starts the map/board can be wider/bigger… I don't think we
 * need some stuff like the Colour picker once the game has started… notice in
 * Modal mode it also doesn't even make sense to have the empty space."
 *
 * So, measured the way a reader would see it, at a laptop's window and a big
 * monitor's:
 *
 * - in play, the map is as wide as the page, with nothing beside it: whose
 *   turn is above it, the step and the dice just under it, and the hand and
 *   the players under those;
 * - the colour is one small control, closed, and opens its picker on request
 *   (and closes again, both ways);
 * - just the board is as wide as the map: no empty column beside it, the whole
 *   world in view at Fit, and nothing to scroll — even at the tallest step of
 *   a turn, a throw with its dice.
 *
 * The game lives in this browser only, so each case clears this browser's
 * kept game first and nothing here writes to the database.
 */

const KEPT = "itsutsu.tenka";
const LAPTOP = { width: 1280, height: 800 };
const MONITOR = { width: 1920, height: 1080 };

/** The map at Regular spans the page's column (1024 wide, less the wood's frame); a column beside it left it 690. */
const LEAST_MAP_PX = 960;

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "the thing measured is not drawn").not.toBeNull();
  return box!;
}

async function kept(page: Page): Promise<TenkaGame> {
  const read = decodeTenka(await page.evaluate((key) => window.localStorage.getItem(key), KEPT));
  if (read === null) throw new Error("no game kept");
  return read;
}

/** A fresh game of three, handed to the first player. */
async function startTenka(page: Page) {
  await page.goto("/games/tenka");
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
  await page.goto("/games/tenka/pass-and-play");
  await ready(page, "tenka-set-up");
  await page.locator('[data-testid="tenka-count"][data-value="3"]').click();
  await page.getByTestId("tenka-start").click();
  await ready(page, "tenka-game");
  await page.getByTestId("tenka-ready").click();
  await expect(page.getByTestId("tenka-game")).toHaveAttribute("data-handed", "true");
  await ready(page, "board-scaling");
  await expect(page.getByTestId("board-scaling")).toHaveAttribute("data-scale-settled", "true");
}

/** Every territory drawn inside the map's box: the whole world, not cropped at an edge. */
async function wholeWorldIn(page: Page) {
  const map = page.getByTestId("tenka-map");
  await expect(map).toHaveAttribute("data-fitted", "true");
  const outside = await map.evaluate((box) => {
    const edge = box.getBoundingClientRect();
    return [...box.querySelectorAll('[data-testid="tenka-land"]')]
      .map((land) => ({ key: land.getAttribute("data-territory"), rect: land.getBoundingClientRect() }))
      .filter(({ rect }) => rect.left < edge.left - 1 || rect.right > edge.right + 1 || rect.top < edge.top - 1 || rect.bottom > edge.bottom + 1)
      .map(({ key }) => key);
  });
  expect(outside, "territories cut off at the map's edge at Fit").toEqual([]);
  await expect(page.getByTestId("tenka-land")).toHaveCount(TENKA_TERRITORIES.length);
}

/** Nothing on the page scrolls sideways, and just the board's window does not scroll at all. */
async function nothingScrolls(page: Page, what: string) {
  const { across, down } = await page.evaluate(() => {
    const frame = document.querySelector("[data-bare-frame]") as HTMLElement;
    return { across: document.documentElement.scrollWidth - document.documentElement.clientWidth, down: frame.scrollHeight - frame.clientHeight };
  });
  expect(across, `${what}: the page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(down, `${what}: just the board scrolls`).toBeLessThanOrEqual(1);
}

/**
 * Onto the tallest step of a turn: every army placed on one territory next to
 * somebody else's, that territory chosen to attack from, a neighbour chosen,
 * and one throw — the step with the most buttons, and the dice beside them.
 */
async function throwOnce(page: Page) {
  const start = await kept(page);
  const from = start.owners.findIndex((owner, territory) => owner === start.toPlay && tenkaNeighbours(territory).some((next) => start.owners[next] !== start.toPlay));
  const to = tenkaNeighbours(from).find((next) => start.owners[next] !== start.toPlay)!;
  const chip = (territory: number) => page.locator(`[data-testid="tenka-territory"][data-territory="${TENKA_TERRITORIES[territory].key}"]`);
  await chip(from).click();
  await page.getByTestId("tenka-place-all").click();
  await expect(page.getByTestId("tenka-game")).toHaveAttribute("data-phase", TENKA_PHASES.attack);
  await chip(from).click();
  await chip(to).click();
  await expect(chip(to)).toHaveAttribute("data-target", "true");
  await page.getByTestId("tenka-roll").first().click();
  await expect(page.getByTestId("tenka-bar-dice")).toHaveAttribute("data-rolled", "true");
}

for (const viewport of [LAPTOP, MONITOR]) {
  test.describe(`Tenka at ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("in play, the map takes the page's width with nothing beside it, and the colour is a small control until asked for", async ({ page }) => {
      await startTenka(page);
      await expect(page.getByTestId("board-scaling")).toHaveAttribute("data-board-scale", "regular");
      const main = await boxOf(page.locator("main[data-strippable]"));
      const map = await boxOf(page.getByTestId("tenka-map"));
      expect(map.width, "the map is not as wide as the page").toBeGreaterThanOrEqual(LEAST_MAP_PX);
      expect(map.width, "the map is narrower than the page's column").toBeGreaterThanOrEqual(main.width - 20);
      await wholeWorldIn(page);

      // Whose turn is above the map; the step, the dice, the hand and the players are under it, never beside it.
      expect((await boxOf(page.getByTestId("tenka-turn"))).y + 10).toBeLessThan(map.y);
      for (const id of ["tenka-bar", "tenka-dice", "tenka-hand", "tenka-players"]) {
        expect((await boxOf(page.getByTestId(id))).y, `${id} sits beside the map rather than under it`).toBeGreaterThanOrEqual(map.y + map.height);
      }
      // And one row of three under them, not a column.
      const [hand, players] = [await boxOf(page.getByTestId("tenka-hand")), await boxOf(page.getByTestId("tenka-players"))];
      expect(Math.abs(hand.y - players.y), "the hand and the players are not side by side").toBeLessThan(2);

      // THE COLOUR: one small control on the turn line, closed; the picker opens when asked, and closes on a choice.
      const colour = page.getByTestId("party-seat-colour");
      await expect(colour).toHaveAttribute("data-open", "false");
      await expect(page.getByTestId("party-seat-colour-picker")).toHaveCount(0);
      expect((await boxOf(colour)).height, "the colour is a panel, not a small control").toBeLessThanOrEqual(48);
      const turn = await boxOf(page.getByTestId("tenka-turn"));
      const control = await boxOf(colour);
      expect(control.y >= turn.y && control.y + control.height <= turn.y + turn.height, "the colour control is not on the turn line").toBe(true);
      await colour.getByTestId("party-seat-colour-toggle").click();
      await expect(colour).toHaveAttribute("data-open", "true");
      const picker = page.getByTestId("party-seat-colour-picker");
      await expect(picker).toBeVisible();
      // Esc closes the picker and nothing else.
      await page.keyboard.press("Escape");
      await expect(picker).toHaveCount(0);
      await colour.getByTestId("party-seat-colour-toggle").click();
      await picker.locator('[data-colour="teal"]').click();
      await expect(colour).toHaveAttribute("data-colour", "teal");
      await expect(colour).toHaveAttribute("data-open", "false");
      await expect(page.getByTestId("tenka-turn")).toContainText("Teal");
      // And back to the table's own, so the next case finds the table as it was.
      await colour.getByTestId("party-seat-colour-toggle").click();
      await picker.locator('[data-colour="usual"]').click();
      await expect(colour).toHaveAttribute("data-colour", "usual");

      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page scrolls sideways").toBeLessThanOrEqual(0);
    });

    test("just the board is as wide as the map: no empty column, the whole world at Fit, and nothing to scroll", async ({ page }) => {
      await startTenka(page);
      await page.getByTestId("bare-board-toggle").click();
      await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
      const panel = page.locator("main[data-strippable]");
      await expect(panel).toHaveAttribute("role", "dialog");

      // What plays the map stays; the hand, the players and the colour go.
      for (const id of ["tenka-turn", "tenka-map", "tenka-regions", "tenka-bar"]) await expect(page.getByTestId(id)).toBeVisible();
      for (const id of ["tenka-hand", "tenka-players", "party-seat-colour", "tenka-dice"]) await expect(page.getByTestId(id)).toBeHidden();

      // No dead column: the map spans the modal's content, and so does the bar under it.
      const room = await panel.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { left: rect.left + parseFloat(style.paddingLeft), right: rect.right - parseFloat(style.paddingRight) };
      });
      const content = room.right - room.left;
      const map = await boxOf(page.getByTestId("tenka-map"));
      expect(content - map.width, "the modal is wider than the map it holds").toBeLessThanOrEqual(16);
      expect(map.x - room.left, "the map does not start at the modal's edge").toBeLessThanOrEqual(10);
      const bar = await boxOf(page.getByTestId("tenka-bar"));
      expect(content - bar.width, "the phase bar leaves an empty column beside it").toBeLessThanOrEqual(2);
      // As large as the window lets it be: most of the window's width, or most of its height.
      expect(map.width >= viewport.width * 0.6 || map.height >= viewport.height * 0.5, "the map is small in a window with room for it").toBe(true);

      // The whole world at Fit, the places to look at on one line, and nothing to scroll.
      await wholeWorldIn(page);
      const tops = await page.getByTestId("tenka-region").evaluateAll((chips) => chips.map((chip) => Math.round(chip.getBoundingClientRect().top)));
      expect(new Set(tops).size, "the places to look at wrapped to a second line").toBe(1);
      await nothingScrolls(page, "at the place step");

      // At the tallest step — a throw's buttons and its dice — still nothing to scroll, and the dice are in the bar.
      await throwOnce(page);
      await expect(page.getByTestId("tenka-bar-dice")).toBeVisible();
      await nothingScrolls(page, "after a throw");
      const after = await boxOf(page.getByTestId("tenka-bar"));
      expect(after.y + after.height, "the phase bar runs off the bottom of the window").toBeLessThanOrEqual(viewport.height);

      // And out, by Esc, to the page as it was.
      await page.keyboard.press("Escape");
      await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
      await expect(page.getByTestId("tenka-players")).toBeVisible();
    });
  });
}

test.describe("Tenka on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("is the column it always was, and its colour is the same small control", async ({ page }) => {
    await startTenka(page);
    const map = await boxOf(page.getByTestId("tenka-map"));
    // Four by three on a phone, as before; the bar and the hand under it.
    expect(Math.abs(map.width / map.height - 4 / 3)).toBeLessThan(0.05);
    expect((await boxOf(page.getByTestId("tenka-hand"))).y).toBeGreaterThan(map.y + map.height);
    const colour = page.getByTestId("party-seat-colour");
    await expect(colour).toHaveAttribute("data-open", "false");
    await colour.getByTestId("party-seat-colour-toggle").tap();
    const picker = await boxOf(page.getByTestId("party-seat-colour-panel"));
    expect(picker.x, "the picker opens off the left of the phone").toBeGreaterThanOrEqual(0);
    expect(picker.x + picker.width, "the picker opens off the right of the phone").toBeLessThanOrEqual(390);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("party-seat-colour-picker")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
