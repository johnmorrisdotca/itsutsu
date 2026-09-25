import { expect, test } from "@playwright/test";

import { playAt, ready } from "./support";

/**
 * THE RECORD IN EVERY FORMAT WE READ, CHOSEN ON THE RECORD AND KEPT.
 *
 * John, 2026-09-25: "IYT is 1. f6 g7 / 2. g6 h6… We should have a tertiary
 * button that offers to display in all the known formats we support. and save
 * to memory." Chosen by a press, seen on the record, still chosen on the next
 * visit — and switched back, because the suite's operator is shared.
 */
test("the record switches format, keeps the choice, and switches back", async ({ page }) => {
  await page.goto("/games/gomoku/play");
  await ready(page, "game-view");
  await page.getByRole("button", { name: "New game" }).click();
  // F9 then G8 on the fifteen board, in our notation.
  await playAt(page, 15, 6, 5);
  await playAt(page, 15, 7, 6);

  const record = page.getByTestId("move-history");
  await expect(record).toHaveAttribute("data-format", "itsutsu");
  await expect(record.locator("li")).toHaveCount(2);

  // ItsYourTurn's: two a line, lower case, "1." before them.
  const savedIyt = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await page.getByTestId("move-format-itsYourTurn").click();
  expect((await savedIyt).ok()).toBe(true);
  await expect(record).toHaveAttribute("data-format", "itsYourTurn");
  await expect(record.locator("li")).toHaveCount(1);
  await expect(record.locator("li").first()).toContainText("1.");
  await expect(record.locator("li").first()).toContainText("f9");
  await expect(record.locator("li").first()).toContainText("g8");

  // Kept on the account: a fresh visit opens in the same format.
  await page.goto("/games/gomoku/play");
  await ready(page, "game-view");
  await expect(page.getByTestId("move-format-itsYourTurn")).toHaveAttribute("aria-checked", "true");

  // And back to ours, which is also what the next spec expects to find.
  const savedOurs = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await page.getByTestId("move-format-itsutsu").click();
  expect((await savedOurs).ok()).toBe(true);
  await expect(page.getByTestId("move-format-itsutsu")).toHaveAttribute("aria-checked", "true");
  await page.goto("/games/gomoku/play");
  await ready(page, "game-view");
  await expect(page.getByTestId("move-format-itsutsu")).toHaveAttribute("aria-checked", "true");
});
