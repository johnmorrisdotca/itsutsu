import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { MEIKYUU_MAZE_LEVELS } from "@johnmorrisdotca/meikyuu/levels";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { MEIKYUU_LEVELS_A_SIZE, meikyuuLevelBand } from "../src/lib/puzzles/meikyuu/levelCounts";
import { drawThrough, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * FINISHING A SIZE. John, 2026-10-02: "are any levels locked? I like the small levels being all playable I think but
 * encouraging people to finish them all." Nothing is locked; what there is instead is how many of each size are solved,
 * on the set-up and the front door, and a mark and a line of cheer, never a window, when a size is whole.
 *
 * Each case is a member of its own, made for it, with the solves it needs written to the database as the site writes them,
 * and taken away after (the solves too: a solve has no relation to its member, so nothing else would).
 */
const prisma = new PrismaClient();
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;
const SMALL = MEIKYUU_MAZE_LEVELS.filter((level) => level.size === "small");

async function aMember(browser: Browser, baseURL: string | undefined, tag: string): Promise<{ context: BrowserContext; page: Page; email: string; id: string }> {
  const email = `meikyuu-progress-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Progress" }, { viewport: { width: 1280, height: 1100 } });
  const row = await prisma.member.findUniqueOrThrow({ where: { email }, select: { id: true } });
  return { context, page: await context.newPage(), email, id: row.id };
}

async function away(email: string, id: string): Promise<void> {
  await prisma.puzzleSolve.deleteMany({ where: { memberId: id } });
  await removeMember(email);
}

/** The progress rows on show, by size: what they say and whether they are whole. */
async function rows(page: Page, within = page.getByTestId("meikyuu-progress").first()) {
  const found = await within.getByTestId("meikyuu-progress-row").evaluateAll((items) =>
    items.map((item) => ({ size: item.getAttribute("data-size"), solved: item.getAttribute("data-solved"), complete: item.getAttribute("data-complete"), text: item.querySelector('[data-testid="meikyuu-progress-figure"]')!.textContent!.trim() })),
  );
  return found;
}

async function solveOne(page: Page, size: number, level: number, band: string) {
  await page.goto(`${AT}/play?size=${size}&level=${band}&seed=${level}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
  const placed = await placedMaze(page);
  await drawThrough(page, placed, wayThrough(placed));
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
}

test.describe("how many of each size are solved", () => {
  test("is on the set-up and the front door for every size, at nought for a new member, and one more for a level solved", async ({ browser, baseURL }) => {
    const { context, page, email, id } = await aMember(browser, baseURL, "count");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      // Four sizes on show, none solved, none whole: an empty table is data.
      await expect.poll(async () => (await rows(page)).map((row) => row.size)).toEqual(["1", "2", "3", "4"]);
      expect((await rows(page)).map((row) => row.text)).toEqual(Array(4).fill(`0 of ${MEIKYUU_LEVELS_A_SIZE}`));
      await expect(page.getByTestId("meikyuu-levels-caption")).toHaveAttribute("data-complete", "false");

      await solveOne(page, 1, 2, "easy");
      await page.getByTestId("puzzle-all-levels").click();
      await ready(page, "puzzle-set-up");
      await expect.poll(async () => (await rows(page))[0]!.text, "the level just solved is not counted").toBe(`1 of ${MEIKYUU_LEVELS_A_SIZE}`);
      expect((await rows(page)).map((row) => row.complete)).toEqual(["false", "false", "false", "false"]);
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Small: 1 of ${MEIKYUU_LEVELS_A_SIZE} solved.`);

      // The tall sizes are rows of their own once Tall is chosen: six sizes, a shelf of four at a time.
      await page.getByTestId("meikyuu-shape-tall").click();
      await expect.poll(async () => (await rows(page)).map((row) => row.size)).toEqual(["609", "812", "1015", "1218"]);
      expect((await rows(page)).map((row) => row.solved)).toEqual(["0", "0", "0", "0"]);

      // The front door has every size's, the account's count read once for the page.
      await page.goto(AT);
      const door = page.getByTestId("meikyuu-front-progress");
      await expect(door).toBeVisible();
      await expect.poll(async () => (await rows(page, door.getByTestId("meikyuu-progress").first())).map((row) => row.text)[0]).toBe(`1 of ${MEIKYUU_LEVELS_A_SIZE}`);
      expect((await rows(page, door.getByTestId("meikyuu-progress").last())).map((row) => row.size)).toEqual(["609", "812", "1015", "1218", "1624", "2030"]);
    } finally {
      await context.close();
      await away(email, id);
    }
  });

  test("a size whose every level is solved is marked, cheered in a line, and the last solve says so", async ({ browser, baseURL }) => {
    const { context, page, email, id } = await aMember(browser, baseURL, "whole");
    try {
      // Every small level but the last that is drawn from a start to a goal (a keys level needs a detour for each key): written as the site writes a solve.
      const last = SMALL.findLastIndex((level) => level.recipe.mode !== "keys") + 1;
      expect(last).toBeGreaterThan(MEIKYUU_LEVELS_A_SIZE - 40);
      await prisma.puzzleSolve.createMany({
        data: SMALL.flatMap((level, at) =>
          at + 1 === last ? [] : [{ memberId: id, kind: "meikyuu", size: 1, level: meikyuuLevelBand(1, at + 1), givens: level.code, elapsedMs: 30_000 + at, points: 0, solved: true, clock: "none" }],
        ),
      });
      await page.goto(`${AT}/new?size=1`);
      await ready(page, "puzzle-set-up");
      await expect.poll(async () => (await rows(page))[0]!.text).toBe(`${MEIKYUU_LEVELS_A_SIZE - 1} of ${MEIKYUU_LEVELS_A_SIZE}`);
      expect((await rows(page))[0]!.complete).toBe("false");
      // Start plays the one level left.
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", String(last));

      await solveOne(page, 1, last, meikyuuLevelBand(1, last));
      const cheer = page.getByTestId("meikyuu-size-done");
      await expect(cheer).toContainText(`all ${MEIKYUU_LEVELS_A_SIZE} small levels are solved`);
      // Nothing next to play at this size, and no window in the way: the board of levels is the way on.
      await expect(page.getByTestId("puzzle-next-level")).toHaveCount(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await page.getByTestId("puzzle-all-levels").click();
      await ready(page, "puzzle-set-up");
      await expect.poll(async () => (await rows(page))[0]!.complete).toBe("true");
      await expect(page.getByTestId("meikyuu-progress-whole")).toHaveCount(1);
      await expect(page.getByTestId("meikyuu-levels-caption")).toHaveAttribute("data-complete", "true");
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Every small level is solved: all ${MEIKYUU_LEVELS_A_SIZE}`);
      // Every level is still open, and a solved one can be chosen and looked at again.
      await page.locator('[data-testid="meikyuu-level"][data-level="3"]').click();
      await expect(page.getByTestId("meikyuu-preview")).toHaveAttribute("data-state", "solved");
    } finally {
      await context.close();
      await away(email, id);
    }
  });

  test("a reader with no account sees the rows at nought, and this browser's own solves counted once it has them", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 1100 } });
    try {
      const page = await context.newPage();
      await page.goto(AT);
      const door = page.getByTestId("meikyuu-front-progress");
      await expect(door).toBeVisible();
      expect((await rows(page, door.getByTestId("meikyuu-progress").first())).map((row) => row.text)).toEqual(Array(4).fill(`0 of ${MEIKYUU_LEVELS_A_SIZE}`));
      // A solve kept in this browser, by its maze: the first small level's.
      await page.evaluate((code) => window.localStorage.setItem("itsutsu.meikyuu.solved", JSON.stringify({ [code]: 20_000 })), SMALL[0]!.code);
      await page.goto(AT);
      await expect.poll(async () => (await rows(page, page.getByTestId("meikyuu-front-progress").getByTestId("meikyuu-progress").first())).map((row) => row.text)[0], "this browser's solve is not counted").toBe(`1 of ${MEIKYUU_LEVELS_A_SIZE}`);
    } finally {
      await context.close();
    }
  });
});
