import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { solidLevelOf } from "@johnmorrisdotca/meikyuu/3d/levels/all";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { meikyuuLevelBand } from "../src/lib/puzzles/meikyuu/levelCounts";
import { meikyuuSolidSize, type MeikyuuSolidKind, type MeikyuuSolidStep } from "../src/lib/puzzles/meikyuu/sizes";
import { askBoard, followWay, fingerOn, placeOf, solidOnScreen } from "./meikyuu-solid";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU OVER A SOLID: a maze over the whole surface of a die or a shape (a cube, a sphere, an octahedron, an icosahedron, and from package 3.1 fourteen more), turned to follow the line round.
 *
 * Held here, as a player meets it: the fourth shape of the set-up with a tile for each solid on five shelves and its five sizes under the tiles, none of it moving the
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
  test(`the set-up has a 3D shape with four solids as tiles on five shelves and their five sizes under them, and choosing moves nothing, ${width}px wide`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, `setup-${width}`, { width, height: 900 });
    try {
      await page.goto(`${AT}/new?size=cube-medium`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-shape-solid")).toHaveAttribute("data-chosen", "true");
      const tiles = page.getByTestId("set-up-size");
      const sizesOf = () => tiles.evaluateAll((all) => all.map((tile) => tile.getAttribute("data-size")));
      const size = (kind: MeikyuuSolidKind, step: MeikyuuSolidStep) => String(meikyuuSolidSize(kind, step));
      await expect(tiles).toHaveCount(4);
      // The first shelf is the dice from the d3 to the d8, the cube among them.
      expect(await sizesOf()).toEqual([size("prism", "medium"), size("tetrahedron", "medium"), size("cube", "medium"), size("octahedron", "medium")]);
      // Five sizes under the tiles, the medium one chosen.
      const steps = page.getByTestId("meikyuu-steps").locator("button");
      await expect(steps).toHaveCount(5);
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
      // Four rows of progress on a full shelf, one a solid, each of its 64 levels at the size on show.
      const rows = page.getByTestId("meikyuu-progress-row");
      await expect(rows).toHaveCount(4);
      await expect(rows.first()).toContainText("0 of 64");

      const reading = async () =>
        page.evaluate(() => {
          const box = document.querySelector('[data-testid="meikyuu-preview"] > div')!.getBoundingClientRect();
          const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
          const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
          const tile = document.querySelector('[data-testid="set-up-size"]')!.getBoundingClientRect();
          const high = (id: string) => Math.round(document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().height);
          return { picker: high("meikyuu-more-sizes"), room: high("meikyuu-steps-room"), under: high("meikyuu-under-tiles"), box: `${Math.round(box.width)}×${Math.round(box.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top), tile: Math.round(tile.height) };
        });
      const first = await reading();
      // Every size, one after another: the same screen.
      for (const step of ["large", "huge", "colossal", "small", "medium"] as const) {
        await page.getByTestId(`meikyuu-step-${step}`).click();
        await expect(preview).toHaveAttribute("data-size", size("cube", step));
        expect(await sizesOf()).toEqual([size("prism", step), size("tetrahedron", step), size("cube", step), size("octahedron", step)]);
        expect(await reading(), `at the ${step} step`).toEqual(first);
      }
      await page.getByTestId("meikyuu-step-large").click();
      // The press turns the shelf: five of them, round and back to the first, none of them moving the screen, and a shelf of three leaves the fourth place empty.
      const shelves: string[][] = [];
      for (let turn = 0; turn < 5; turn += 1) {
        shelves.push(await sizesOf() as string[]);
        await page.getByTestId("meikyuu-more-sizes").click();
        await expect(page.getByTestId("meikyuu-more-sizes")).toHaveAttribute("data-shelf", String((turn + 1) % 5));
        await expect(preview).toHaveAttribute("data-drawn", "true");
        expect(await reading(), `on shelf ${turn + 1}`).toEqual(first);
      }
      expect(shelves.map((each) => each.length)).toEqual([4, 4, 3, 4, 3]);
      expect(shelves.flat()).toHaveLength(18);
      expect(shelves[4]).toEqual([size("torus", "large"), size("star", "large"), size("heart", "large")]);
      await expect(rows).toHaveCount(4);
      // Choosing a tile of another shelf: the sphere (shelf 3), then the heart (shelf 4), then back to a die.
      await page.getByTestId("meikyuu-more-sizes").click();
      await page.getByTestId("meikyuu-more-sizes").click();
      await page.getByTestId("meikyuu-more-sizes").click();
      for (const [kind, solid] of [["sphere", "Sphere"], ["box", "Box"], ["cross", "Cross"], ["ring", "Ring"]] as const) {
        await page.locator(`[data-testid="set-up-size"][data-size="${size(kind, "large")}"]`).click();
        await expect(preview).toHaveAttribute("data-size", size(kind, "large"));
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
      await expect(preview).toHaveAttribute("data-size", size("ring", "large"));
      await expect(page.getByTestId("meikyuu-more-sizes")).toHaveAttribute("data-shelf", "3");
      await page.getByTestId("meikyuu-block-on").click();
      await page.locator('[data-testid="meikyuu-level"][data-level="20"]').click();
      await expect(preview).toHaveAttribute("data-level", "20");
      await expect(preview).toHaveAttribute("data-maze", solidLevelOf("ring", "large", 20)!.code);
      expect(await reading()).toEqual(first);
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=ring-large&level=\w+&seed=20$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText("Large ring · Level 20 of 64");
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
  // The solids that came after the first four (package 3.1): a die, and the shapes whose parts hide parts, which turn to a cell a part hides.
  ["dodecahedron", "small", 3, "mouse"],
  ["torus", "small", 4, "touch"],
  ["heart", "small", 2, "mouse"],
  ["star", "small", 5, "touch"],
  ["cross", "small", 6, "mouse"],
];
/** The solids whose parts can hide parts, which turn to a cell a part hides, so the cell may face a little less squarely when the finger goes to it. */
const HIDING: readonly MeikyuuSolidKind[] = ["cross", "ring", "torus", "star", "heart"];

/* A finger that crosses a part that hides parts, on a phone, can be one cell short of the cell it was sent to when the machine is busy (a Linux run, one in a few): it is the run's timing and not the board's, so a solve may run twice. */
test.describe.configure({ retries: 1 });

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
      if (kind !== "sphere" && kind !== "torus") expect(faces.size, "the way crosses from one face to another").toBeGreaterThan(1);
      const finger = await fingerOn(page, touch);
      await followWay(page, finger, way, { leastFacing: HIDING.includes(kind) ? 0.25 : 0.4 });
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
