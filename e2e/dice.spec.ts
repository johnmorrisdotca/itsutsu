import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * The dice roller, Korokoro: reached from the games page's tabs, thrown by
 * tapping the felt, and read back as a total, a history, stats and odds. Every
 * roll here happens in the browser; nothing about it reaches the server.
 */

async function openRoller(page: Page) {
  await ready(page, "dice-roller");
  await expect(page.getByTestId("kk-tray")).toBeVisible();
}

/**
 * A throw, as a person makes one: a tap on the felt beside the dice. Once the
 * dice have been thrown they lie on the felt, and a tap on a die holds it
 * rather than throwing, so the tap goes to the felt's corner, where no die is.
 */
async function throwDice(page: Page) {
  await page.getByTestId("kk-tray").click({ position: { x: 12, y: 12 } });
}

/** The faces showing, read off the dice themselves. */
async function faces(page: Page): Promise<number[]> {
  return (await page.getByTestId("kk-die").evaluateAll((dice) => dice.map((d) => Number(d.getAttribute("data-face")))));
}

test("tapping the felt throws the chosen dice, and the history, stats and odds follow", async ({ page }) => {
  await page.goto("/games");
  await page.getByTestId("tabs").locator('[data-testid="tab"][data-tab="dice"]').click();
  await expect(page).toHaveURL(/\/dice$/);
  await openRoller(page);

  await page.getByTestId("kk-count").getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByTestId("kk-die")).toHaveCount(3);
  await throwDice(page);
  await expect(page.getByTestId("kk-history-row")).toHaveCount(1);
  const thrown = await faces(page);
  expect(thrown).toHaveLength(3);
  for (const face of thrown) expect(face >= 1 && face <= 6).toBe(true);
  await expect(page.getByTestId("kk-total")).toContainText(String(thrown.reduce((a, b) => a + b, 0)));

  await throwDice(page);
  await expect(page.getByTestId("kk-history-row")).toHaveCount(2);

  await page.getByTestId("kk-tab-stats").click();
  await expect(page.getByTestId("kk-stat-rolls")).toContainText("2");

  // Dice notation, as a character sheet writes it: advantage and a bonus.
  const notation = page.getByTestId("kk-notation");
  await notation.fill("2d20kh1+5");
  await notation.press("Enter");
  await expect(page.getByTestId("kk-mod")).toHaveText("+5");
  await expect(page.getByTestId("kk-keep").getByRole("button", { name: "Highest" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("kk-die")).toHaveCount(2);

  await page.getByTestId("kk-tab-odds").click();
  const target = page.getByTestId("kk-target");
  await target.fill("15");
  // Needing 10 on the better of two d20: 1 - (9/20)^2.
  await expect(page.getByTestId("kk-chance")).toHaveText("80%");
});

test("the history is kept on this device, and clearing it asks first", async ({ page }) => {
  await page.goto("/dice");
  await openRoller(page);
  await throwDice(page);
  await expect(page.getByTestId("kk-history-row")).toHaveCount(1);

  // Coming back is the subject here, so this reload is the test rather than a shortcut past it.
  await page.reload();
  await openRoller(page);
  await expect(page.getByTestId("kk-history-row")).toHaveCount(1);

  const clear = page.getByTestId("kk-clear");
  await clear.click();
  await expect(clear).toContainText("Clear all 1 rolls?");
  await expect(page.getByTestId("kk-history-row")).toHaveCount(1);
  await clear.click();
  await expect(page.getByTestId("kk-history-empty")).toBeVisible();
});

test.describe("with no invite", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a stranger can roll, and a shared roll shows exactly what was thrown", async ({ page }) => {
    await page.goto("/dice?roll=2d6&faces=3,4&at=0");
    await expect(page).toHaveURL(/\/dice/);
    await openRoller(page);
    await expect(page.getByTestId("kk-total")).toContainText("7");
    await expect(page.getByTestId("kk-result")).toContainText("A roll somebody shared");
    expect(await faces(page)).toEqual([3, 4]);
    await expect(page.getByTestId("kk-history-empty")).toBeVisible();

    await throwDice(page);
    await expect(page.getByTestId("kk-history-row")).toHaveCount(1);
  });
});
