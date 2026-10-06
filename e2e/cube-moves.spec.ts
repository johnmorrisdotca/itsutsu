import { expect, test, type Page } from "@playwright/test";

import { countsAsMove, decodeCubeMoves, moveName, moveNotation, movesNotation, turnAll } from "@johnmorrisdotca/kyuubu";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { freshPuzzleSeed, ready } from "./support";

/**
 * THE CUBE'S MOVES, said and listed and turned. A kept solve's replay names the move it stands at (its code in large
 * type, what it turns in words), lists the moves as buttons that follow it and take it anywhere, and turns the layers as
 * the scrubber moves, forwards and each undone going back. A cube dealt fresh is seen scrambling, and a drag on the
 * seam between two layers turns both.
 */
const KIND = "cube";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

async function typeMove(page: Page, written: string) {
  const [, depth, letter, amount] = /^(\d?)([A-Za-z])(['2]?)$/.exec(written)!;
  if (depth !== "") await page.keyboard.press(depth);
  const key = amount === "'" ? `Shift+${letter.toUpperCase()}` : letter.toLowerCase();
  await page.keyboard.press(key);
  if (amount === "2") {
    if (depth !== "") await page.keyboard.press(depth);
    await page.keyboard.press(key);
  }
}

const settled = (page: Page) => expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false");

/** A 2×2 played and solved by typing, then opened on its own page: the turns it was solved by, and the cube it began as. */
async function solvedAndKept(page: Page) {
  const seed = freshPuzzleSeed();
  await page.goto(`${AT}/play?size=2&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  const puzzle = generatePuzzle(KIND, 2, "easy", seed);
  await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
  await settled(page);
  for (const move of decodeCubeMoves(puzzle.solution)!) {
    await typeMove(page, moveNotation(move, 2));
    await settled(page);
  }
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
  const turns = decodeCubeMoves((await page.getByTestId("puzzle-play").getAttribute("data-moves"))!)!;
  await expect(page.getByTestId("puzzle-solved-line")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("puzzle-see-solve").click();
  await ready(page, "cube-replay");
  return { puzzle, turns };
}

const replay = (page: Page) => page.getByTestId("cube-replay");
const tokens = (page: Page) => replay(page).locator("[data-kyuubu-moves] button");
const marked = (page: Page) => replay(page).locator('[data-kyuubu-moves] button[aria-current="step"]');

test.describe("a kept cube's replay says and lists its moves", () => {
  test("the move is in large type and in words, the moves are buttons that follow it, and a press takes the replay there", async ({ page }) => {
    const { puzzle, turns } = await solvedAndKept(page);
    // The steps: every turn that counts, a turn of the whole cube riding with the one after it.
    const ends: number[] = [0];
    turns.forEach((move, index) => countsAsMove(move) && ends.push(index + 1));
    const last = ends.length - 1;
    const stepOf = (at: number) => turns.slice(ends[at - 1], ends[at]);
    const stateAt = (at: number) => turnAll(puzzle.givens, 2, turns.slice(0, ends[at]));

    await expect(tokens(page)).toHaveCount(last);
    // It opens at the end, as the game finished.
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${last} of ${last}`);
    await expect(page.getByTestId("cube-replay-turn")).toHaveText(movesNotation(stepOf(last), 2));
    const first = moveName(movesNotation([stepOf(last).at(-1)!], 2));
    await expect(page.getByTestId("cube-replay-says")).toContainText(first!);
    const size = await page.getByTestId("cube-replay-turn").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(28);
    await expect(marked(page)).toHaveAttribute("data-index", String(last - 1));

    // Each button is its move's code, named with its words and where it is.
    for (const at of [1, Math.ceil(last / 2), last]) {
      const step = stepOf(at);
      await expect(tokens(page).nth(at - 1)).toHaveText(movesNotation(step, 2));
      await expect(tokens(page).nth(at - 1)).toHaveAttribute("aria-label", new RegExp(`^${movesNotation(step, 2).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: .+\\. Move ${at} of ${last}$`));
    }

    // A press on a move takes the replay there: the cube is the cube after it, its code and words are the move's.
    const mid = Math.ceil(last / 2);
    await tokens(page).nth(mid - 1).click();
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${mid} of ${last}`);
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", stateAt(mid));
    await expect(page.getByTestId("cube-replay-turn")).toHaveText(movesNotation(stepOf(mid), 2));
    await expect(marked(page)).toHaveAttribute("data-index", String(mid - 1));

    // The keys: a move on and back, Home and End, with the focus going along.
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${mid + 1} of ${last}`);
    await expect(tokens(page).nth(mid)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${mid - 1} of ${last}`);
    await page.keyboard.press("End");
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${last} of ${last}`);
    await page.keyboard.press("Home");
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move 1 of ${last}`);
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", stateAt(1));
    // One Tab stop for the whole list.
    expect(await replay(page).locator("[data-kyuubu-moves] button[tabindex='0']").count()).toBe(1);
  });

  test("the scrubber turns the cube the way it goes: each move undone going back, forwards going on, and a long jump catches up", async ({ page }) => {
    const { puzzle, turns } = await solvedAndKept(page);
    const ends: number[] = [0];
    turns.forEach((move, index) => countsAsMove(move) && ends.push(index + 1));
    const last = ends.length - 1;
    const stateAt = (at: number) => turnAll(puzzle.givens, 2, turns.slice(0, ends[at]));
    await page.evaluate(() => {
      const cube = document.querySelector("[data-kyuubu]")!;
      const seen = { turning: 0, states: [] as string[] };
      (window as unknown as { __seen: typeof seen }).__seen = seen;
      new MutationObserver((records) => {
        for (const record of records) {
          if (record.attributeName === "data-turning" && cube.getAttribute("data-turning") === "true") seen.turning += 1;
          if (record.attributeName === "data-state") seen.states.push(cube.getAttribute("data-state")!);
        }
      }).observe(cube, { attributes: true, attributeFilter: ["data-turning", "data-state"] });
    });
    const seen = () => page.evaluate(() => (window as unknown as { __seen: { turning: number; states: string[] } }).__seen);
    const scrubber = page.getByTestId("cube-replay-scrubber");

    // Back by three: the cube goes through each cube between, last move first.
    await scrubber.fill(String(last - 3));
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${last - 3} of ${last}`);
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", stateAt(last - 3));
    const back = await seen();
    expect(back.turning).toBeGreaterThanOrEqual(1);
    for (const through of [last - 1, last - 2]) expect(back.states).toContain(stateAt(through));
    expect(back.states.indexOf(stateAt(last - 1))).toBeLessThan(back.states.indexOf(stateAt(last - 2)));

    // On again, each move turned.
    await scrubber.fill(String(last - 1));
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", stateAt(last - 1));
    expect((await seen()).states).toContain(stateAt(last - 2));

    // A long jump to the start catches up on its last few moves only, and ends on the same cube a jump shows.
    await page.evaluate(() => ((window as unknown as { __seen: { states: string[] } }).__seen.states.length = 0));
    await scrubber.fill("0");
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
    expect((await seen()).states.length).toBeLessThan(last);
    await expect(page.getByTestId("cube-replay-turn")).toHaveText("–");
  });

  test("a one-step Back turns the move undone, and the move said and listed follow", async ({ page }) => {
    const { puzzle, turns } = await solvedAndKept(page);
    const ends: number[] = [0];
    turns.forEach((move, index) => countsAsMove(move) && ends.push(index + 1));
    const last = ends.length - 1;
    await page.getByRole("button", { name: "One move back" }).click();
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${last - 1} of ${last}`);
    await settled(page);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", turnAll(puzzle.givens, 2, turns.slice(0, ends[last - 1])));
    await expect(marked(page)).toHaveAttribute("data-index", String(last - 2));
  });

  test("with the motion asked for off, the replay jumps and turns nothing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { puzzle, turns } = await solvedAndKept(page);
    const ends: number[] = [0];
    turns.forEach((move, index) => countsAsMove(move) && ends.push(index + 1));
    await page.getByTestId("cube-replay-scrubber").fill("0");
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
  });
});

test.describe("a cube dealt fresh", () => {
  test("is seen scrambling, quickly, and is the dealt cube when it stops", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.addInitScript(() => {
      const seen = { turning: 0, states: [] as string[] };
      (window as unknown as { __seen: typeof seen }).__seen = seen;
      document.addEventListener("DOMContentLoaded", () => {
        const watch = () => {
          const cube = document.querySelector("[data-kyuubu]");
          if (cube === null) return void requestAnimationFrame(watch);
          new MutationObserver((records) => {
            for (const record of records) {
              if (record.attributeName === "data-turning" && cube.getAttribute("data-turning") === "true") seen.turning += 1;
              if (record.attributeName === "data-state") seen.states.push(cube.getAttribute("data-state")!);
            }
          }).observe(cube, { attributes: true, attributeFilter: ["data-turning", "data-state"] });
        };
        watch();
      });
    });
    await page.goto(`${AT}/play?size=3&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const puzzle = generatePuzzle(KIND, 3, "medium", seed);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
    await settled(page);
    const seen = await page.evaluate(() => (window as unknown as { __seen: { turning: number; states: string[] } }).__seen);
    expect(seen.turning).toBeGreaterThanOrEqual(1);
    // The last ten turns were shown, one state each, and the rest were made at once.
    expect(seen.states.length).toBeGreaterThanOrEqual(8);
    expect(seen.states.length).toBeLessThanOrEqual(14);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-inspecting", "true");
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
  });

  test("with the motion asked for off it is dealt at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=3&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const puzzle = generatePuzzle(KIND, 3, "medium", seed);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false");
  });

  test("a drag that begins on the seam between two layers turns both, and one from the middle of a sticker turns one", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await settled(page);
    // Slots run U R F D L B, nine to a face: 22 is the front's centre and 23 the sticker to its right.
    const centre = (await page.locator('[data-kyuubu] [data-slot="22"]').boundingBox())!;
    const right = (await page.locator('[data-kyuubu] [data-slot="23"]').boundingBox())!;
    const [a, b] = [centre, right].map((box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 }));
    const drag = async (from: { x: number; y: number }) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let at = 4; at <= 90; at += 4) await page.mouse.move(from.x, from.y + at);
      await page.waitForTimeout(170);
      await page.mouse.up();
      await settled(page);
    };
    // On the seam between the centre column and the right-hand one: both turn, as a wide turn.
    await drag({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
    const made = decodeCubeMoves((await page.getByTestId("puzzle-play").getAttribute("data-moves"))!)!;
    expect(made).toHaveLength(2);
    expect(made[0].axis).toBe(made[1].axis);
    expect(made[0].turns).toBe(made[1].turns);
    expect(new Set(made.map((move) => move.layer))).toEqual(new Set([1, 2]));
    // From the middle of the right-hand sticker: the one layer.
    await page.getByTestId("cube-undo").click();
    await page.getByTestId("cube-undo").click();
    await settled(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    // The page moved under the press on Undo: the sticker is measured again.
    await page.locator('[data-kyuubu] [data-slot="23"]').scrollIntoViewIfNeeded();
    const again = (await page.locator('[data-kyuubu] [data-slot="23"]').boundingBox())!;
    await drag({ x: again.x + again.width / 2, y: again.y + again.height / 2 });
    await expect(page.getByTestId("cube-move-count")).toHaveText("1 move");
  });
});
