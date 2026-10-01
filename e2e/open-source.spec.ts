import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { GAME_SLUGS, PARTY_SLUGS, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs.data";

/**
 * A GAME SAYS WHAT IT RUNS ON: under the board of a puzzle, a party table and
 * a board game, and on a rules page, the open-source package and the version
 * this build carries, leading to its repository. The version is read from the
 * site's package.json here too, so a bump never leaves this test behind.
 */
const pinned = JSON.parse(readFileSync("package.json", "utf8")).dependencies as Record<string, string>;
const credit = (page: import("@playwright/test").Page) => page.getByTestId("open-source");

for (const [where, path, pkg, name] of [
  ["a puzzle's play page", `/games/${PUZZLE_SLUGS.cube}/play?size=3&level=easy&seed=7`, "kyuubu", "Kyuubu"],
  ["a party table", `/games/${PARTY_SLUGS.mexicanTrain}/pass-and-play`, "domino", "Domino"],
  ["a board game's play page", `/games/${GAME_SLUGS.freestyle}/play`, "narabe", "Narabe"],
  ["a rules page", `/games/${PARTY_SLUGS.hearts}/rules`, "toranpu", "Toranpu"],
] as const) {
  test(`${where} names its package and the version it runs`, async ({ page }) => {
    await page.goto(path);
    const version = pinned[`@johnmorrisdotca/${pkg}`]!;
    await expect(credit(page)).toHaveAttribute("data-package", pkg);
    await expect(credit(page)).toContainText(`Runs on ${name} ${version}, open source.`);
    await expect(credit(page).getByRole("link")).toHaveAttribute("href", `https://github.com/johnmorrisdotca/${pkg}`);
  });
}

test("a game whose rules are this site's own names no package", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/rules`);
  await expect(page.getByTestId("rules-learn").or(page.locator("main"))).toBeVisible();
  await expect(page.locator("aside")).toBeVisible();
  await expect(credit(page)).toHaveCount(0);
});
