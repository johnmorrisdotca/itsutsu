import { expect, test, type Locator, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * THE METHOD PAGE'S "TURN IT FOR ME", AS A REPLAY (`/learn/cube`). John, on a
 * phone, at step 8: "it ends in like a second. It's completely useless because
 * I can't see what happens. I can't even step through." So it is played a turn
 * at a time at a pace that can be followed, and every control a reader would
 * reach for is driven here as they reach for it: pause, a move back, a move on,
 * the bar, the list of moves, how fast, from the start, and taking the cube
 * over. The cube's own state (`data-state`, the stickers as they are drawn) is
 * what says whether the cube really went back, never a count.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const AT = "/learn/cube";
const WIDTHS = [
  { name: "a phone", viewport: { width: 390, height: 844 } },
  { name: "a desk", viewport: { width: 1280, height: 800 } },
];

async function openStep(page: Page, stage: string, path = AT): Promise<Locator> {
  await page.goto(path);
  await ready(page, "cube-method");
  const step = page.locator(`[data-testid="cube-method-stage"][data-stage="${stage}"]`);
  await step.getByTestId("cube-method-practise").click();
  const practice = step.getByTestId("cube-practice");
  await expect(practice).toBeVisible();
  return practice;
}

const cubeOf = (practice: Locator) => practice.locator("[data-kyuubu]");
const stateOf = (practice: Locator) => cubeOf(practice).getAttribute("data-state");
const at = async (practice: Locator) => Number(await practice.getAttribute("data-lesson-at"));

/** The cube once it has stopped turning: not turning, and the same stickers a moment later (a jump of several moves catches up by turning the last few, one after another). */
async function settledState(practice: Locator) {
  for (let look = 0; look < 40; look += 1) {
    await expect(cubeOf(practice)).toHaveAttribute("data-turning", "false");
    const now = await stateOf(practice);
    await practice.page().waitForTimeout(300);
    if ((await cubeOf(practice).getAttribute("data-turning")) === "false" && (await stateOf(practice)) === now) return now;
  }
  throw new Error("the cube never stopped turning");
}

/** Where the cube is once it has gone somewhere other than `from` and stopped there. */
async function movedFrom(practice: Locator, from: string | null) {
  await expect.poll(() => stateOf(practice)).not.toBe(from);
  return settledState(practice);
}

/** Play the step slowly, so a pause asked for at a position lands there even on a busy machine. */
async function playSlowly(practice: Locator) {
  await practice.getByTestId("cube-practice-turn").click();
  await practice.getByTestId("cube-step-speed-slow").click();
}

/** Pause at a position of the lesson (it plays by itself), and say where it stopped. */
async function pauseAfter(practice: Locator, position: number) {
  await expect(practice).toHaveAttribute("data-lesson-at", String(position));
  await practice.getByTestId("cube-step-play").click();
  await expect(practice).toHaveAttribute("data-lesson", "paused");
  const stoppedAt = await at(practice);
  // The turn that was on its way finishes showing, and the cube stands there.
  await expect(cubeOf(practice)).toHaveAttribute("data-turning", "false");
  return stoppedAt;
}

for (const { name, viewport } of WIDTHS) {
  test.describe(`the step played as a replay, on ${name}`, () => {
    test.use({ viewport });

    test("does not finish at once: the turns are seen one at a time, each said in code and words", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await practice.getByTestId("cube-practice-turn").click();
      const last = Number(await practice.getAttribute("data-lesson-last"));
      expect(last).toBeGreaterThan(3);
      await expect(practice).toHaveAttribute("data-lesson", "playing");
      await expect(practice).toHaveAttribute("data-lesson-at", "1");
      // The turn just made is said big, with what it turns, and heard by a screen reader.
      await expect(practice.getByTestId("cube-replay-turn")).toHaveText(/^[RLUDFBxyz][2']?$/);
      await expect(practice.getByTestId("cube-replay-says")).toHaveAttribute("aria-live", "polite");
      await expect(practice.getByTestId("cube-replay-says")).toContainText(/face|cube|layer|slice/i);
      await expect(practice.getByTestId("cube-replay-at")).toHaveText(`Move 1 of ${last}`);
      await expect(practice).toHaveAttribute("data-done", "false");
      // And the next one, a beat later: it is a replay, not a jump to solved.
      await expect(practice).toHaveAttribute("data-lesson-at", "2");
      await expect(practice).toHaveAttribute("data-done", "false");
      await expect(practice.getByTestId("cube-replay-at")).toHaveText(`Move 2 of ${last}`);
    });

    test("Pause stops it where it is, and Play carries on from there", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await playSlowly(practice);
      const stoppedAt = await pauseAfter(practice, 1);
      const stoppedState = await stateOf(practice);
      // More than one turn's time passes and nothing moves: the clock is the subject here.
      await page.waitForTimeout(2200);
      expect(await at(practice)).toBe(stoppedAt);
      expect(await stateOf(practice)).toBe(stoppedState);
      await expect(practice.getByTestId("cube-step-play")).toHaveAttribute("data-playing", "false");
      await practice.getByTestId("cube-step-play").click();
      await expect(practice).toHaveAttribute("data-lesson-at", String(stoppedAt + 1));
    });

    test("Back undoes one move and the cube is as it was; Forward does it again; the bar and the list jump", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      const start = await stateOf(practice);
      await playSlowly(practice);
      const stoppedAt = await pauseAfter(practice, 2);
      const before = await stateOf(practice);
      expect(before).not.toBe(start);

      await practice.getByTestId("cube-step-on").click();
      await expect(practice).toHaveAttribute("data-lesson-at", String(stoppedAt + 1));
      const after = await movedFrom(practice, before);
      await practice.getByTestId("cube-step-back").click();
      await expect(practice).toHaveAttribute("data-lesson-at", String(stoppedAt));
      await expect.poll(() => stateOf(practice)).toBe(before);
      await practice.getByTestId("cube-step-on").click();
      await expect.poll(() => stateOf(practice)).toBe(after);

      // The bar goes anywhere, both ways, and every place is the same cube each time it is come to.
      const last = Number(await practice.getAttribute("data-lesson-last"));
      await practice.getByTestId("cube-replay-scrubber").fill(String(last));
      await expect(practice).toHaveAttribute("data-lesson-at", String(last));
      await expect(practice).toHaveAttribute("data-done", "true");
      const solved = await movedFrom(practice, after);
      await practice.getByTestId("cube-replay-scrubber").fill("0");
      await expect(practice).toHaveAttribute("data-lesson-at", "0");
      await expect.poll(() => stateOf(practice)).toBe(start);
      await expect(practice).toHaveAttribute("data-done", "false");
      await expect(practice.getByTestId("cube-replay-turn")).toHaveText("–");
      await practice.getByTestId("cube-replay-scrubber").fill(String(last));
      await expect.poll(() => stateOf(practice)).toBe(solved);

      // The list of moves marks the one it stands at, and a press on a move goes there.
      const moves = practice.locator(".kyuubu-moves button");
      await expect(moves).toHaveCount(last);
      await expect(moves.nth(last - 1)).toHaveAttribute("aria-current", "step");
      await moves.nth(3).click();
      await expect(practice).toHaveAttribute("data-lesson-at", "4");
      await expect(moves.nth(3)).toHaveAttribute("aria-current", "step");
      await expect(practice).toHaveAttribute("data-lesson", "paused");
    });

    test("stays usable when it ends: on the last move with every control, and Replay, Start again and Another cube work", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      const start = await stateOf(practice);
      await practice.getByTestId("cube-practice-turn").click();
      await practice.getByTestId("cube-step-speed-fast").click();
      const last = Number(await practice.getAttribute("data-lesson-last"));
      await expect(practice).toHaveAttribute("data-lesson", "paused", { timeout: 40_000 });
      await expect(practice).toHaveAttribute("data-lesson-at", String(last));
      await expect(practice).toHaveAttribute("data-done", "true");
      await expect(practice.getByTestId("cube-practice-said")).toContainText("Done: that step is finished");
      await expect(practice.getByTestId("cube-step-on")).toBeDisabled();
      await expect(practice.getByTestId("cube-step-back")).toBeEnabled();
      await expect(practice.getByTestId("cube-step-play")).toBeEnabled();
      await expect(practice.getByTestId("cube-practice-again")).toBeEnabled();
      await expect(practice.getByTestId("cube-practice-another")).toBeEnabled();

      // Back from the end, one move.
      await practice.getByTestId("cube-step-back").click();
      await expect(practice).toHaveAttribute("data-lesson-at", String(last - 1));
      await expect(practice).toHaveAttribute("data-done", "false");

      // Replay goes to the start of the step and plays it again.
      await practice.getByTestId("cube-step-replay").click();
      await expect(practice).toHaveAttribute("data-lesson", "playing");
      await expect(practice).toHaveAttribute("data-lesson-at", "1");

      // Start again puts the cube back as the step began, and the lesson away.
      await practice.getByTestId("cube-practice-again").click();
      await expect(practice).toHaveAttribute("data-lesson", "off");
      await expect(practice).toHaveAttribute("data-done", "false");
      await expect.poll(() => stateOf(practice)).toBe(start);
      await expect(practice.getByTestId("cube-practice-turn")).toBeVisible();

      // Another cube is a fresh one, with the step still to do.
      await practice.getByTestId("cube-practice-turn").click();
      await expect(practice).toHaveAttribute("data-lesson", "playing");
      await practice.getByTestId("cube-practice-another").click();
      await expect(practice).toHaveAttribute("data-lesson", "off");
      await expect.poll(() => stateOf(practice)).not.toBe(start);
    });

    test("the reader can take the cube at any point: a turn made after pausing carries on by hand from there", async ({ page }) => {
      const practice = await openStep(page, "yellowFace");
      await playSlowly(practice);
      await pauseAfter(practice, 2);
      const paused = await stateOf(practice);
      await page.keyboard.press("u");
      await expect(practice).toHaveAttribute("data-lesson", "off");
      await movedFrom(practice, paused);
      await expect(practice.getByTestId("cube-practice-said")).toContainText("Turn the cube until");
      // What was played stands: the cube is not put back to the start, and Start again is there.
      await expect(practice.getByTestId("cube-practice-again")).toBeEnabled();
      await expect(practice.getByTestId("cube-practice-show")).toBeVisible();
      // And it can be shown the rest from here.
      await practice.getByTestId("cube-practice-show").click();
      await expect(practice.getByTestId("cube-next-code")).toBeVisible();
    });
  });
}

test.describe("the replay's other conditions", () => {
  test("a reader who asks for reduced motion steps through it all the same, and it plays without turning layers", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const practice = await openStep(page, "yellowFace");
    const start = await stateOf(practice);
    await playSlowly(practice);
    await pauseAfter(practice, 1);
    const one = await stateOf(practice);
    expect(one).not.toBe(start);
    await practice.getByTestId("cube-step-on").click();
    await expect(practice).toHaveAttribute("data-lesson-at", "2");
    await movedFrom(practice, one);
    await practice.getByTestId("cube-step-back").click();
    await practice.getByTestId("cube-step-back").click();
    await expect(practice).toHaveAttribute("data-lesson-at", "0");
    await expect.poll(() => stateOf(practice)).toBe(start);
  });

  test("how fast is chosen once and kept for the next step", async ({ page }) => {
    const practice = await openStep(page, "yellowFace");
    await practice.getByTestId("cube-practice-turn").click();
    await expect(practice.getByTestId("cube-step-speed-normal")).toHaveAttribute("aria-pressed", "true");
    await practice.getByTestId("cube-step-speed-slow").click();
    await expect(practice.getByTestId("cube-step-speed-slow")).toHaveAttribute("aria-pressed", "true");
    const next = page.locator('[data-testid="cube-method-stage"][data-stage="yellowCorners"]');
    await next.getByTestId("cube-method-practise").click();
    await next.getByTestId("cube-practice-turn").click();
    await expect(next.getByTestId("cube-step-speed-slow")).toHaveAttribute("aria-pressed", "true");
  });

  test("a step that is only turns of the whole cube is a replay too", async ({ page }) => {
    const practice = await openStep(page, "hold");
    await practice.getByTestId("cube-practice-turn").click();
    await expect(practice).toHaveAttribute("data-lesson-last", /^[1-9]/);
    await expect(practice).toHaveAttribute("data-lesson-at", "1");
    await expect(practice.getByTestId("cube-replay-turn")).toHaveText(/^[xyz]/);
    await expect(practice.getByTestId("cube-replay-says")).toContainText("Whole cube");
  });

  test("is in Japanese for a reader of Japanese: the controls and the move are said in it", async ({ page }) => {
    const practice = await openStep(page, "yellowFace", `${AT}?lang=ja`);
    await practice.getByTestId("cube-practice-turn").click();
    await expect(practice).toHaveAttribute("data-lesson-at", "1");
    await expect(practice.getByTestId("cube-step-back")).toContainText("戻る");
    await expect(practice.getByTestId("cube-step-on")).toContainText("進む");
    await expect(practice.getByTestId("cube-step-speed-slow")).toHaveText("ゆっくり");
    await expect(practice.getByTestId("cube-replay-at")).toContainText("手");
    await expect(practice.getByTestId("cube-replay-says")).toContainText(/[面層]/);
    await expect(practice.getByTestId("cube-practice-said")).toContainText("回転を1手ずつ見ていきます");
  });
});
