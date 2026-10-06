import { expect, test, type Page } from "@playwright/test";
import * as chains from "@johnmorrisdotca/houseki/colour-chains";
import * as triplets from "@johnmorrisdotca/houseki/falling-triplets";
import * as swap from "@johnmorrisdotca/houseki/gem-swap";
import * as blocks from "@johnmorrisdotca/houseki/magnetic-blocks";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";

import { HOUSEKI_STORAGE_KEY } from "../src/lib/houseki/housekiProgress";
import { housekiPrice } from "../src/lib/points/housekiLadder";
import { marksOf } from "../src/lib/houseki/housekiMarks.data";
import { housekiQuery } from "../src/lib/houseki/housekiAddress";
import { housekiPlayPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * EVERY HOUSEKI GAME, WON AT ITS FIRST LEVEL THE WAY A READER WINS IT: from the
 * game's own play address, with the keys and the presses its page has, to the
 * result under the board and the points the site says it counted.
 *
 * The moves are the package's own recorded winning plan for the level
 * (`witness`), played through the page and never into the engine: each is a key
 * or a press on the board, with a frame between so that the page's scheduler
 * reads each as its own. So the level is won by the real thing, the server plays
 * the game again from its save, and what comes back is a price on the ladder.
 *
 * It signs in as the suite's operator and clears what the page keeps in the
 * browser first; the win it makes is a row of the operator's own.
 */
const VIEWPORTS = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a desk", width: 1280, height: 900, touch: false },
] as const;

/** A frame or two of the page's own loop, so that two presses are two ticks. */
const frames = (page: Page, count = 2) => page.evaluate((n) => new Promise<void>((done) => { let left = n; const step = () => (--left <= 0 ? done() : requestAnimationFrame(step)); requestAnimationFrame(step); }), count);

const root = (page: Page, game: "falling" | "full") => page.locator(`[data-testid="houseki-${game}"]`);

/** What the page complains of, collected from before it loads. */
function listen(page: Page): string[] {
  const complaints: string[] = [];
  page.on("pageerror", (error) => complaints.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) complaints.push(message.text());
  });
  return complaints;
}

/** Waits until the board's count of pieces or moves has gone past `was` and it is waiting for the next, or the level is over. */
async function after(page: Page, game: "falling" | "full", was: number) {
  await expect(async () => {
    const progress = Number(await root(page, game).getAttribute("data-progress"));
    const phase = await root(page, game).getAttribute("data-phase");
    const result = await page.locator('[data-testid="houseki-result"]').count();
    expect(result > 0 || (progress > was && ["falling", "ready"].includes(phase ?? ""))).toBe(true);
  }).toPass({ timeout: 20_000 });
}

/** A key pressed once, each as its own tick. */
async function key(page: Page, name: string, times = 1) {
  for (let at = 0; at < times; at += 1) {
    await page.keyboard.press(name);
    await frames(page);
  }
}

async function playTriplets(page: Page) {
  const level = triplets.levelManifest[0]!;
  let state = triplets.createLevel(level.id);
  for (const step of level.witness) {
    const was = Number(await root(page, "falling").getAttribute("data-progress"));
    const from = state.active!.x;
    if (step.x !== from) await key(page, step.x < from ? "ArrowLeft" : "ArrowRight", Math.abs(step.x - from));
    await key(page, "x", step.orientation);
    await key(page, "Space");
    for (let at = 0; at < step.orientation; at += 1) state = triplets.applyAction(state, { kind: "cycle-forward" }).state;
    const lateral = step.x < from ? "left" : "right";
    for (let at = 0; at < Math.abs(step.x - from); at += 1) state = triplets.applyAction(state, { kind: lateral }).state;
    state = triplets.advanceTicks(triplets.applyAction(state, { kind: "hard-drop" }).state, 240).state;
    await after(page, "falling", was);
  }
}

async function playChains(page: Page) {
  const level = chains.levelManifest[0]!;
  let state = chains.createLevel(level.id);
  const turns = { up: 0, right: 1, down: 2, left: 3 } as const;
  for (const step of level.witness) {
    const was = Number(await root(page, "falling").getAttribute("data-progress"));
    const from = state.active!.pivot.x;
    if (step.pivotX !== from) await key(page, step.pivotX < from ? "ArrowLeft" : "ArrowRight", Math.abs(step.pivotX - from));
    await key(page, "x", turns[step.orientation]);
    await key(page, "Space");
    const lateral = step.pivotX < from ? "left" : "right";
    for (let at = 0; at < Math.abs(step.pivotX - from); at += 1) state = chains.applyAction(state, { kind: lateral }).state;
    for (let at = 0; at < turns[step.orientation]; at += 1) state = chains.applyAction(state, { kind: "rotate-clockwise" }).state;
    state = chains.advanceTicks(chains.applyAction(state, { kind: "hard-drop" }).state, 240).state;
    await after(page, "falling", was);
  }
}

async function playStones(page: Page) {
  const level = stones.levelManifest[0]!;
  let state = stones.createLevel(level.id);
  for (const ids of level.witness) {
    const was = Number(await root(page, "full").getAttribute("data-progress"));
    const cell = state.board.findIndex((stone) => stone?.id === ids[0]);
    await page.locator(`[data-testid="houseki-well"] [data-cell="${cell}"]`).click();
    await page.locator('[data-testid="houseki-take"]').click();
    state = stones.advanceTicks(stones.applyAction(stones.applyAction(state, { kind: "select", stoneId: ids[0]! }).state, { kind: "confirm" }).state, 240).state;
    await after(page, "full", was);
  }
}

async function playSwap(page: Page) {
  const level = swap.GEM_SWAP_CAMPAIGN[0]!;
  for (const operation of level.witness) {
    if (operation.kind !== "action" || operation.action.kind !== "swap") continue;
    const was = Number(await root(page, "full").getAttribute("data-progress"));
    await page.locator(`[data-testid="houseki-well"] [data-cell="${operation.action.from}"]`).click();
    await page.locator(`[data-testid="houseki-well"] [data-cell="${operation.action.to}"]`).click();
    await after(page, "full", was);
  }
}

async function playBlocks(page: Page) {
  const level = blocks.levelManifest[0]!;
  for (const action of level.witness) {
    const was = Number(await root(page, "falling").getAttribute("data-progress"));
    const press: Record<string, string> = { left: "houseki-left-button", right: "houseki-right-button", "rotate-clockwise": "houseki-turn-right", "rotate-anticlockwise": "houseki-turn-left", land: "houseki-place", "hard-drop": "houseki-drop" };
    if (action.kind === "set-floor-override") await page.locator(`[data-testid="houseki-floor-${action.floor}"]`).click();
    else if (action.kind === "cancel-floor-override") await page.locator('[data-testid="houseki-floor-cancel"]').click();
    else await page.locator(`[data-testid="${press[action.kind]}"]`).click();
    if (action.kind === "land" || action.kind === "hard-drop") await after(page, "falling", was);
  }
}

const GAMES = [
  { kind: "fallingTriplets", slug: "falling-triplets", play: playTriplets },
  { kind: "colourChains", slug: "colour-chains", play: playChains },
  { kind: "stoneCollapse", slug: "stone-collapse", play: playStones },
  { kind: "gemSwap", slug: "gem-swap", play: playSwap },
  { kind: "magneticBlocks", slug: "magnetic-blocks", play: playBlocks },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`on ${viewport.name}, ${viewport.width} px wide`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch, isMobile: viewport.touch });

    for (const game of GAMES) {
      test(`${game.kind}: level 1 is won with the page's own presses, counted by the server, and kept won`, async ({ page }) => {
        const complaints = listen(page);
        await page.addInitScript((storage) => {
          if (!sessionStorage.getItem("houseki-test-started")) {
            sessionStorage.setItem("houseki-test-started", "1");
            localStorage.removeItem(storage);
          }
        }, HOUSEKI_STORAGE_KEY);
        await page.goto(housekiPlayPath(game.kind, housekiQuery({ kind: "level", campaign: "classic", number: 1 })));
        await ready(page, "houseki-game");
        await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();
        await game.play(page);
        await expect(page.locator('[data-testid="houseki-result"][data-result="won"]')).toBeVisible({ timeout: 20_000 });
        // Counted by the server, at the price the ladder gives a level of these marks.
        const points = page.locator('[data-testid="houseki-points"]');
        await expect(points).toHaveAttribute("data-counting", "counted", { timeout: 20_000 });
        await expect(points).toHaveAttribute("data-ip", String(housekiPrice("classic", marksOf(game.kind, "classic", 1)!)));
        // Every press is disabled once it is over, and the level is kept as won.
        await expect(page.locator('[data-testid="houseki-controls"] button:not([disabled])')).toHaveCount(0);
        // And it is won on the set-up and waiting nowhere in My games.
        await page.goto(`/games/${game.slug}/new`);
        await ready(page, "houseki-set-up");
        await expect(page.locator('[data-testid="houseki-level"][data-level="1"]')).toHaveAttribute("data-state", "won");
        expect(complaints).toEqual([]);
      });
    }
  });
}
