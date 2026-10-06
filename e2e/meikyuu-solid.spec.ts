import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { solidLevelOf } from "@johnmorrisdotca/meikyuu/3d/levels";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { meikyuuLevelBand } from "../src/lib/puzzles/meikyuu/levelCounts";
import { meikyuuSolidSize, type MeikyuuSolidKind, type MeikyuuSolidStep } from "../src/lib/puzzles/meikyuu/sizes";
import { askBoard, followWay, fingerOn, placeOf, solidOnScreen } from "./meikyuu-solid";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU OVER A SOLID: a maze over the whole surface of a cube, a sphere, an octahedron or an icosahedron, turned to follow the line round (package 2.2).
 *
 * Held here, as a player meets it: the fourth shape of the set-up with a tile for each solid and its three sizes under the tiles, none of it moving the
 * screen; the live solid in the preview; the solid turned by a drag away from the line, by the arrows and by Face me; a line drawn from the start across the
 * edges from one face to the next in ONE stroke, the solid turning by itself, with a mouse on a desk and with a real touch on a phone; the server
 * accepting the line (the answer is the list of cells, the same however the solid is turned); a run kept half way with its stones; and a solved
 * level opening on its finished solid. Each case is a member of its own, made for it and taken away after.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, view: { width: number; height: number }, touch = false): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-solid-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Solid Player" }, { viewport: view, hasTouch: touch, isMobile: touch });
  return { context, page: await context.newPage(), email };
}

const levelUrl = (kind: MeikyuuSolidKind, step: MeikyuuSolidStep, level: number) => `${AT}/play?size=${kind}-${step}&level=${meikyuuLevelBand(meikyuuSolidSize(kind, step), level)}&seed=${level}`;

async function openLevel(page: Page, kind: MeikyuuSolidKind, step: MeikyuuSolidStep, level: number) {
  await page.goto(levelUrl(kind, step, level));
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("canvas.mk-solid")).toBeVisible();
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", solidLevelOf(kind, step, level)!.code);
}

const viewOf = (page: Page) => askBoard<{ q: number[]; zoom: number }>(page, "return s.view();");

for (const width of [390, 1280]) {
  test(`the set-up has a 3D shape with the four solids as tiles and their three sizes under them, and choosing moves nothing, ${width}px wide`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, `setup-${width}`, { width, height: 900 });
    try {
      await page.goto(`${AT}/new?size=cube-medium`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-shape-solid")).toHaveAttribute("data-chosen", "true");
      const tiles = page.getByTestId("set-up-size");
      await expect(tiles).toHaveCount(4);
      expect(await tiles.evaluateAll((all) => all.map((tile) => tile.getAttribute("data-size")))).toEqual(["7002", "7012", "7022", "7032"]);
      await expect(page.getByTestId("meikyuu-step-medium")).toHaveAttribute("data-chosen", "true");
      const preview = page.getByTestId("meikyuu-preview");
      await expect(preview).toHaveAttribute("data-size", "7002");
      await expect(preview).toHaveAttribute("data-drawn", "true");
      // The preview is the live solid, a picture that takes no input, so the page scrolls over it.
      await expect(preview.locator("canvas.mk-solid")).toBeVisible();
      await expect(preview.locator('.mk-box[data-still="true"]')).toHaveCount(1);
      await expect(page.getByTestId("meikyuu-chip-shape")).toContainText("Cube");
      await expect(page.getByTestId("meikyuu-chip-cells")).toContainText(`${solidLevelOf("cube", "medium", 1)!.cells} cells`);
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText("Medium cube: 0 of 64 solved.");
      // Four rows of progress, one a solid, each of its 64 levels.
      const rows = page.getByTestId("meikyuu-progress-row");
      await expect(rows).toHaveCount(4);
      await expect(rows.first()).toContainText("0 of 64");

      const reading = async () =>
        page.evaluate(() => {
          const box = document.querySelector('[data-testid="meikyuu-preview"] > div')!.getBoundingClientRect();
          const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
          const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
          const tile = document.querySelector('[data-testid="set-up-size"]')!.getBoundingClientRect();
          return { box: `${Math.round(box.width)}×${Math.round(box.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top), tile: `${Math.round(tile.width)}×${Math.round(tile.height)}` };
        });
      const first = await reading();
      await page.getByTestId("meikyuu-step-large").click();
      await expect(preview).toHaveAttribute("data-size", "7003");
      expect(await tiles.evaluateAll((all) => all.map((tile) => tile.getAttribute("data-size")))).toEqual(["7003", "7013", "7023", "7033"]);
      expect(await reading(), "after the large step").toEqual(first);
      for (const [size, solid] of [["7013", "Sphere"], ["7033", "Icosahedron"], ["7023", "Octahedron"], ["7003", "Cube"]] as const) {
        await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
        await expect(preview).toHaveAttribute("data-size", size);
        await expect(preview).toHaveAttribute("data-drawn", "true");
        await expect(page.getByTestId("meikyuu-chip-shape")).toContainText(solid);
        expect(await reading(), `after choosing ${solid}`).toEqual(first);
      }
      // Another shape and back leaves the solid where it was, and no shape moves the screen.
      for (const shape of ["square", "tall", "colossal", "solid"]) {
        await page.getByTestId(`meikyuu-shape-${shape}`).click();
        await expect(page.getByTestId(`meikyuu-shape-${shape}`)).toHaveAttribute("data-chosen", "true");
        await expect(preview).toHaveAttribute("data-drawn", "true");
        expect(await reading(), `on the ${shape} shape`).toEqual(first);
      }
      await expect(preview).toHaveAttribute("data-size", "7003");
      await page.getByTestId("meikyuu-block-on").click();
      await page.locator('[data-testid="meikyuu-level"][data-level="20"]').click();
      await expect(preview).toHaveAttribute("data-level", "20");
      await expect(preview).toHaveAttribute("data-maze", solidLevelOf("cube", "large", 20)!.code);
      expect(await reading()).toEqual(first);
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=cube-large&level=\w+&seed=20$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText("Large cube · Level 20 of 64");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}

test("a drag away from the line turns the solid and draws nothing; the arrows, Face me, Turn only and the zoom turn and size it", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "turn", { width: 1280, height: 1100 });
  try {
    await openLevel(page, "cube", "medium", 4);
    await expect(page.getByTestId("meikyuu-said")).toContainText("Press the green start");
    const finger = await fingerOn(page, false);
    const before = await viewOf(page);
    // From the corner of the box, where there is no solid: the solid is turned like a ball in the hand.
    await finger.down(8, 8);
    for (let i = 1; i <= 14; i += 1) await finger.move(8 + i * 14, 8 + i * 9);
    await finger.up();
    const dragged = await viewOf(page);
    expect(dragged.q).not.toEqual(before.q);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "0");
    // The four arrows.
    for (const by of ["left", "up", "down", "right"]) {
      const was = await viewOf(page);
      await page.getByTestId(`meikyuu-turn-${by}`).click();
      await expect.poll(async () => (await viewOf(page)).q, { message: `turn ${by}` }).not.toEqual(was.q);
      await page.waitForTimeout(350);
    }
    // Face me brings the start (there is no line yet) round to the front.
    const start = (await solidOnScreen(page)).maze.start;
    await page.getByTestId("meikyuu-face-me").click();
    await expect.poll(async () => (await placeOf(page, start)).facing).toBeGreaterThan(0.5);
    expect((await placeOf(page, start)).visible).toBe(true);
    // The zoom pad sizes the solid, and Fit puts it back.
    await page.getByTestId("meikyuu-zoom-in").click();
    await expect.poll(async () => (await viewOf(page)).zoom).toBeGreaterThan(1.2);
    await page.getByTestId("meikyuu-fit").click();
    await expect.poll(async () => (await viewOf(page)).zoom).toBeCloseTo(1, 2);
    // Turn only: a press on the start turns the solid instead of drawing.
    await page.getByTestId("meikyuu-turn-only").click();
    await expect(page.getByTestId("meikyuu-turn-only")).toHaveAttribute("data-moving", "true");
    const there = await placeOf(page, start);
    const was = await viewOf(page);
    await finger.down(there.x, there.y);
    for (let i = 1; i <= 8; i += 1) await finger.move(there.x + i * 12, there.y + i * 6);
    await finger.up();
    expect((await viewOf(page)).q).not.toEqual(was.q);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "0");
  } finally {
    await context.close();
    await removeMember(email);
  }
});

const SOLVES: readonly (readonly [MeikyuuSolidKind, MeikyuuSolidStep, number, "mouse" | "touch"])[] = [
  ["cube", "small", 3, "mouse"],
  ["sphere", "small", 5, "touch"],
  ["octahedron", "small", 2, "mouse"],
  ["icosahedron", "small", 4, "touch"],
];

for (const [kind, step, level, how] of SOLVES) {
  test(`${kind}: level ${level} is solved in one stroke across the edges with ${how === "mouse" ? "a mouse at 1280" : "a touch at 390"}, the server pays it, and it opens on its finished solid`, async ({ browser, baseURL }) => {
    const touch = how === "touch";
    const { context, page, email } = await aMember(browser, baseURL, `${kind}-${how}`, touch ? { width: 390, height: 844 } : { width: 1280, height: 1100 }, touch);
    try {
      await openLevel(page, kind, step, level);
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Small ${kind} · Level ${level} of 64`);
      await expect(page.getByTestId("puzzle-hint")).toHaveCount(0);
      await expect(page.getByTestId("meikyuu-undo")).toBeDisabled();
      const { maze, way } = await solidOnScreen(page);
      const faces = new Set(way.map((cell) => maze.grid.faceOf[cell]));
      if (kind !== "sphere") expect(faces.size, "the way crosses from one face to another").toBeGreaterThan(1);
      const finger = await fingerOn(page, touch);
      await followWay(page, finger, way);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(way.length));
      await expect(page.getByTestId("meikyuu-level-fastest")).toContainText(`Fastest on level ${level}`);
      // The board of levels shows it solved, the solid's row counting it.
      await page.getByTestId("puzzle-all-levels").click();
      await ready(page, "puzzle-set-up");
      const tile = page.locator(`[data-testid="meikyuu-level"][data-level="${level}"]`);
      await expect(tile).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Small ${kind}: 1 of 64 solved.`);
      // Opened again, a solved level shows the solid as it was won, and only Play it again starts it over.
      await tile.click();
      await expect(page.getByTestId("meikyuu-preview")).toHaveAttribute("data-state", "solved");
      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("meikyuu-solved-view")).toContainText("Solved, best");
      await expect(page.getByTestId("meikyuu-still").locator("canvas.mk-solid")).toBeVisible();
      await page.getByTestId("meikyuu-play-again").click();
      await expect(page.getByTestId("meikyuu-board").locator("canvas.mk-solid")).toBeVisible();
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "0");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}

test("a run left half way comes back with its line and its stones, and the same text however the solid is turned", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "run", { width: 1280, height: 1100 });
  try {
    await openLevel(page, "octahedron", "medium", 6);
    const { maze, way } = await solidOnScreen(page);
    const finger = await fingerOn(page, false);
    await followWay(page, finger, way, { stopAt: Math.floor(way.length / 2) });
    // A stone beside the line, laid by the Stone press and a click on the cell.
    const beside = way.slice(0, 6).flatMap((cell) => maze.links[cell]!).find((cell) => !way.includes(cell));
    expect(beside).toBeDefined();
    await page.getByTestId("meikyuu-stone").click();
    const where = await placeOf(page, beside!);
    if (!where.visible || where.facing < 0.3) {
      await askBoard(page, "s.faceMe(argument);", beside);
      await page.waitForTimeout(400);
    }
    const spot = await placeOf(page, beside!);
    await page.mouse.click((await page.locator('[data-testid="meikyuu-board"] .mk-box').boundingBox())!.x + spot.x, (await page.locator('[data-testid="meikyuu-board"] .mk-box').boundingBox())!.y + spot.y);
    await expect(page.getByTestId("meikyuu-stones-left")).toHaveAttribute("data-stones", "1");
    await page.getByTestId("meikyuu-stone").click();
    const run = await askBoard<string>(page, "return s.run();");
    expect(run).toContain("~");
    // Turned every which way: the same text.
    await askBoard(page, "s.view({ q: [0.4, -0.3, 0.2, 0.8], zoom: 1.5 });");
    expect(await askBoard<string>(page, "return s.run();")).toBe(run);
    await page.waitForTimeout(600);
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("meikyuu-board").locator("canvas.mk-solid")).toBeVisible();
    await expect.poll(() => askBoard<string>(page, "return s.run();")).toBe(run);
    await expect(page.getByTestId("meikyuu-stones-left")).toHaveAttribute("data-stones", "1");
  } finally {
    await context.close();
    await removeMember(email);
  }
});
