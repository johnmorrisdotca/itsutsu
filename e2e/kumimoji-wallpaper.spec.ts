import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { encodeGrid, squareAt } from "../src/lib/puzzles/kumimoji/grid";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * A MEMBER'S FINISHED CROSSWORDS, AS ONE WALLPAPER.
 *
 * John, 2026-09-28: "every single game you play is saved and so you can have a
 * history of all the nice cool maps that you made… a wallpaper of all the cool
 * games you've played, similar to the other games where you have wallpapers."
 *
 * Driven as a member would: the Kumimoji record, the press, the picture, the
 * other shape, the download — and read back from the file what was saved.
 * Each case brings its own member, so the count it asserts is only ever the
 * rows it made: three of the member's own finished crosswords, beside one
 * unfinished and one of somebody else's that must never be in the picture.
 */
const prisma = new PrismaClient();
const HISTORY = `/games/${PUZZLE_SLUGS.kumimoji}/history`;
const PHONE = { width: 390, height: 844 };

/** A word laid across from the top-left square. */
function across(word: string): Map<string, string> {
  return new Map([...word].map((letter, col) => [squareAt(0, col), letter]));
}

/** The three crosswords the member finished: a word, a cross with a wild in it, and a block. */
const THEIRS = [
  encodeGrid(across("wallpaper")),
  encodeGrid(new Map([[squareAt(0, 1), "c"], [squareAt(1, 0), "o"], [squareAt(1, 1), "A"], [squareAt(1, 2), "t"], [squareAt(2, 1), "*"]])),
  "cat/ooo/wed",
];

/** A PNG's width and height, from its header. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** A fresh member of this case's own, signed in, with the age question already answered. */
async function member(browser: Browser, baseURL: string, tag: string, options?: Parameters<Browser["newContext"]>[0]) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const who = { email: `wallpaper-${stamp}@example.test`, name: `Wall ${stamp}` };
  const context = await memberContext(browser, baseURL, who, options);
  const row = await prisma.member.update({ where: { email: who.email }, data: { ageBand: "18_plus" }, select: { id: true } });
  return { context, email: who.email, id: row.id };
}

/** Finished Kumimoji rows for a member, a day apart, newest first. */
async function seedSolves(memberId: string, answers: readonly string[], solved = true) {
  await prisma.puzzleSolve.createMany({
    data: answers.map((answer, i) => ({
      memberId,
      kind: "kumimoji",
      size: 11,
      level: "medium",
      givens: `wallpaper-spec-${i}`,
      answer,
      solved,
      elapsedMs: 120_000,
      points: 0,
      finishedAt: new Date(Date.now() - i * 86_400_000),
    })),
  });
}

async function openWallpaper(page: Page) {
  await page.goto(HISTORY);
  await ready(page, "open-kumimoji-wallpaper");
  await page.getByTestId("open-kumimoji-wallpaper").click();
  await expect(page.getByTestId("mosaic-dialog")).toBeVisible();
}

/** Nothing on the page is wider than the screen. */
async function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

test.describe("Kumimoji wallpaper", () => {
  test("draws the member's own finished crosswords, in both shapes, and saves the picture at its full size", async ({ browser, baseURL }) => {
    const me = await member(browser, baseURL!, "own", { viewport: { width: 1440, height: 900 } });
    const other = await member(browser, baseURL!, "other");
    try {
      await seedSolves(me.id, THEIRS);
      await seedSolves(me.id, ["dog"], false);
      await seedSolves(other.id, ["zzz"]);
      await other.context.close();

      const page = await me.context.newPage();
      await openWallpaper(page);
      const wallpaper = page.getByTestId("kumimoji-wallpaper");
      await expect(wallpaper).toHaveAttribute("data-state", "ready");
      // Only this member's three finished crosswords: not the unfinished one, not the other member's.
      await expect(wallpaper).toHaveAttribute("data-count", "3");
      await expect(page.getByTestId("mosaic-game-name")).toHaveText("Kumimoji · 3 crosswords");

      const picture = page.getByTestId("mosaic-picture");
      await expect(picture).toHaveAttribute("data-shape", "landscape");
      const drawn = await picture.evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }));
      expect(drawn.width).toBeGreaterThan(0);
      expect(drawn.width).toBeGreaterThan(drawn.height);

      await page.getByTestId("mosaic-shape-portrait").check();
      await expect(picture).toHaveAttribute("data-shape", "portrait");
      const tall = await picture.evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }));
      expect(tall.height).toBeGreaterThan(tall.width);

      const [portrait] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-mosaic").click()]);
      expect(portrait.suggestedFilename()).toBe("itsutsu-kumimoji-wallpaper.png");
      expect(pngSize((await portrait.path())!)).toEqual({ width: 1170, height: 2532 });

      // And back the other way, which is a different file.
      await page.getByTestId("mosaic-shape-landscape").check();
      await expect(picture).toHaveAttribute("data-shape", "landscape");
      const [landscape] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-mosaic").click()]);
      expect(pngSize((await landscape.path())!)).toEqual({ width: 1920, height: 1080 });

      // Closed and opened again, it is drawn again from what was already fetched.
      await page.getByTestId("close-mosaic").click();
      await expect(page.getByTestId("mosaic-dialog")).toHaveCount(0);
      await page.getByTestId("open-kumimoji-wallpaper").click();
      await expect(page.getByTestId("kumimoji-wallpaper")).toHaveAttribute("data-count", "3");
      await expect(page.getByTestId("mosaic-picture")).toBeVisible();
    } finally {
      await prisma.puzzleSolve.deleteMany({ where: { memberId: { in: [me.id, other.id] } } });
      await me.context.close();
      await removeMember(me.email);
      await removeMember(other.email);
    }
  });

  test("tells a member with no finished crossword so, with the way to build one, rather than hiding the press", async ({ browser, baseURL }) => {
    const me = await member(browser, baseURL!, "none");
    try {
      const page = await me.context.newPage();
      await openWallpaper(page);
      await expect(page.getByTestId("kumimoji-wallpaper")).toHaveAttribute("data-state", "ready");
      await expect(page.getByTestId("kumimoji-wallpaper-empty")).toContainText("not finished a crossword yet");
      await expect(page.getByTestId("kumimoji-wallpaper-empty").getByRole("link")).toHaveAttribute("href", `/games/${PUZZLE_SLUGS.kumimoji}/new`);
      await expect(page.getByTestId("mosaic-picture")).toHaveCount(0);
    } finally {
      await me.context.close();
      await removeMember(me.email);
    }
  });

  test("fits a phone: the press, the window and the picture, with nothing scrolling sideways", async ({ browser, baseURL }) => {
    const me = await member(browser, baseURL!, "phone", { viewport: PHONE, isMobile: true, hasTouch: true });
    try {
      await seedSolves(me.id, THEIRS);
      const page = await me.context.newPage();
      await page.goto(HISTORY);
      await ready(page, "open-kumimoji-wallpaper");
      expect(await scrollsSideways(page)).toBe(false);
      await page.getByTestId("open-kumimoji-wallpaper").click();
      const picture = page.getByTestId("mosaic-picture");
      // A phone held upright starts on the portrait shape.
      await expect(picture).toHaveAttribute("data-shape", "portrait");
      const box = (await picture.boundingBox())!;
      expect(box.width).toBeGreaterThan(0);
      expect(box.x + box.width).toBeLessThanOrEqual(PHONE.width);
      expect(await scrollsSideways(page)).toBe(false);
    } finally {
      await prisma.puzzleSolve.deleteMany({ where: { memberId: me.id } });
      await me.context.close();
      await removeMember(me.email);
    }
  });
});
