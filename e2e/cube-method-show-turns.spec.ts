import { expect, test, type Locator, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * THE METHOD PAGE'S "SHOW THE TURNS", DRAWN ON THE CUBE (`/learn/cube`). John,
 * step 1 ("Hold it white side down"): "clicking Show the turns doesn't show
 * anything but the codes. No arrows explaining visually what to do." So the
 * next turn is drawn on the cube with Kyuubu's own guide (the layer lit and an
 * arrow the way to drag it; for a turn of the whole cube, an arrow across the
 * cube), said beside it in code and words, and moves on when the reader makes
 * it. The turns are made as a reader makes them, by key, never by setting state.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const AT = "/learn/cube";
const WIDTHS = [
  { name: "a phone", viewport: { width: 390, height: 844 } },
  { name: "a desk", viewport: { width: 1280, height: 800 } },
];

async function openStep(page: Page, stage: string): Promise<Locator> {
  await page.goto(AT);
  await ready(page, "cube-method");
  const step = page.locator(`[data-testid="cube-method-stage"][data-stage="${stage}"]`);
  await step.getByTestId("cube-method-practise").click();
  const practice = step.getByTestId("cube-practice");
  await expect(practice).toBeVisible();
  return practice;
}

const cubeOf = (practice: Locator) => practice.locator("[data-kyuubu]");
const stateOf = (practice: Locator) => cubeOf(practice).getAttribute("data-state");

/** The keys that make a turn written as the guide writes it: R, R', R2, x, z'. A half turn is two quarters the same way. */
function keysFor(code: string): string[] {
  const letter = code[0];
  if (code.endsWith("2")) return [letter, letter];
  return [code.endsWith("'") ? `Shift+${letter.toUpperCase()}` : letter];
}

/** Make the turn the guide asks for, with the keys a reader would use, and say what it was. */
async function followGuide(page: Page, practice: Locator) {
  const code = (await practice.getByTestId("cube-next-code").textContent())!.trim();
  for (const key of keysFor(code)) await page.keyboard.press(key);
  return code;
}

for (const { name, viewport } of WIDTHS) {
  test.describe(`Show the turns, on ${name}`, () => {
    test.use({ viewport });

    test("draws an arrow on the cube for a turn of one layer, says it, and moves on when it is made", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await practice.getByTestId("cube-practice-show").click();
      const cube = cubeOf(practice);
      const arrow = practice.locator("[data-hint-arrow]");
      // The layer is lit and the way to drag it is drawn on the cube.
      await expect(cube).toHaveAttribute("data-hint", "drag");
      await expect(arrow).toBeVisible();
      await expect(arrow).toHaveAttribute("data-drag", /^-?[\d.]+,-?[\d.]+$/);
      await expect(practice.locator("[data-hint-lit]")).toHaveCount(21);
      // And said beside it, in code and in words, and how to make it.
      const next = practice.getByTestId("cube-next");
      const total = Number((await practice.getByTestId("cube-next-at").textContent())!.match(/of (\d+)/)![1]);
      await expect(practice.getByTestId("cube-next-at")).toHaveText(`Move 1 of ${total}`);
      await expect(practice.getByTestId("cube-next-code")).toHaveText(/^[RLUDFB][2']?$/);
      await expect(practice.getByTestId("cube-next-says")).toContainText(/face|layer/i);
      await expect(practice.getByTestId("cube-next-how")).toContainText("arrow");
      // The list of the step's turns stays, by the algorithm's names.
      await expect(practice.getByTestId("cube-practice-turns")).toContainText("Sune");

      // Making the turn, by key, moves the guide on to the next, and the arrow with it.
      const first = (await next.getAttribute("data-turn"))!;
      const where = await arrow.getAttribute("style");
      const made = await followGuide(page, practice);
      expect(made).toBe(first);
      await expect(practice.getByTestId("cube-next-at")).toHaveText(`Move 2 of ${total}`);
      await expect(cube).toHaveAttribute("data-hint", /^(drag|look)$/);
      await expect(arrow).toBeVisible();
      await expect.poll(() => arrow.getAttribute("style")).not.toBe(where);
    });

    test("follows the whole step turn by turn, by hand, to the end", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await practice.getByTestId("cube-practice-show").click();
      const total = Number((await practice.getByTestId("cube-next-at").textContent())!.match(/of (\d+)/)![1]);
      for (let made = 1; made <= total; made += 1) {
        await expect(practice.getByTestId("cube-next-at")).toHaveText(`Move ${made} of ${total}`);
        await expect(practice.getByTestId("cube-next-code")).toHaveText(/^[RLUDFBxyz][2']?$/);
        // The move is a turn of the whole cube or of a layer, and either way it is drawn.
        await expect(cubeOf(practice)).toHaveAttribute("data-hint", /^(drag|whole|look)$/);
        await followGuide(page, practice);
      }
      await expect(practice).toHaveAttribute("data-done", "true");
      await expect(practice.getByTestId("cube-next")).toHaveAttribute("data-state", "done");
      await expect(cubeOf(practice)).not.toHaveAttribute("data-hint", /.+/);
    });

    test("draws an arrow across the cube for a turn of the whole cube, which no drag makes, and the button makes it", async ({ page }) => {
      const practice = await openStep(page, "hold");
      await practice.getByTestId("cube-practice-show").click();
      const cube = cubeOf(practice);
      await expect(cube).toHaveAttribute("data-hint", "whole");
      const arrow = practice.locator("[data-hint-arrow]");
      await expect(arrow).toBeVisible();
      // It is across the cube, not on one layer of it: nothing is lit or dimmed, and it is as wide as the cube is.
      await expect(practice.locator("[data-hint-lit]")).toHaveCount(0);
      const arrowBox = (await arrow.boundingBox())!;
      const cubeBox = (await cube.boundingBox())!;
      expect(arrowBox.width).toBeGreaterThan(cubeBox.width * 0.25);
      // Said in code and in words, with the key and the button, and that the arrow is the way it goes.
      await expect(practice.getByTestId("cube-next-code")).toHaveText(/^[xyz][2']?$/);
      await expect(practice.getByTestId("cube-next-says")).toContainText("Whole cube");
      await expect(practice.getByTestId("cube-next-how")).toContainText("press");
      await expect(practice.getByTestId("cube-next-how")).toContainText("Turn this one for me");
      const before = await stateOf(practice);
      await practice.getByTestId("cube-next-make").click();
      await expect.poll(() => stateOf(practice)).not.toBe(before);
      // That was the step's last turn.
      await expect(practice).toHaveAttribute("data-done", "true");
      await expect(practice.getByTestId("cube-next-says")).toBeVisible();
    });

    test("a wrong turn is allowed: it is said to be one and taken back, the arrow showing how", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await practice.getByTestId("cube-practice-show").click();
      const start = await stateOf(practice);
      const wanted = (await practice.getByTestId("cube-next-code").textContent())!.trim();
      // A face the step does not ask for.
      const wrong = wanted.startsWith("B") ? "f" : "b";
      await page.keyboard.press(wrong);
      await expect(practice.getByTestId("cube-next-off")).toBeVisible();
      await expect(practice.getByTestId("cube-next-off")).toContainText(wanted);
      await expect(cubeOf(practice)).toHaveAttribute("data-hint", /^(drag|look)$/);
      await expect.poll(() => stateOf(practice)).not.toBe(start);
      await practice.getByTestId("cube-next-takeback").click();
      await expect(practice.getByTestId("cube-next-off")).toHaveCount(0);
      await expect.poll(() => stateOf(practice)).toBe(start);
      await expect(practice.getByTestId("cube-next-code")).toHaveText(wanted);
      // And it goes on from there.
      await followGuide(page, practice);
      await expect(practice.getByTestId("cube-next-at")).toContainText("Move 2 of");
    });

    test("can be put away, and the arrow goes with it", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await practice.getByTestId("cube-practice-show").click();
      await expect(cubeOf(practice)).toHaveAttribute("data-hint", /.+/);
      await practice.getByTestId("cube-next-hide").click();
      await expect(practice.getByTestId("cube-next")).toHaveCount(0);
      await expect(cubeOf(practice)).not.toHaveAttribute("data-hint", /.+/);
      await expect(practice.getByTestId("cube-practice-show")).toBeVisible();
    });
  });
}
