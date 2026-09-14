import { expect, test } from "@playwright/test";

import { removeMember, seedMember } from "./members";
import { RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import { gamePath } from "../src/lib/gomoku/slugs";

/**
 * An imported record names our games as links, and only our games.
 *
 * John, with a screenshot of his ItsYourTurn REGULAR GAMES table where
 * Anti-Checkers, Backgammon, Checkers, Crowded Checkers and Halma 10x10 were
 * all italic and unlinked: "why does our site not have links for
 * Anti-Checkers, Checkers, Halma 10x10, crowded, etc?" Checkers and Halma had
 * been games here for releases; nothing had told the alias table.
 *
 * THE RECORD IS CODE, NOT A ROW. A kept record is a transcription in
 * `legacyPlayers.data.ts` — there is no table to write one into, so there is
 * no record for a spec to make and take away. What this brings is the member
 * the page is served for, at a test address, made here and removed here (the
 * same address `legacy.spec.ts` seeds); the table it reads is fixed in the
 * repository, not left behind by a database.
 *
 * Reached the way a reader reaches it: the player's page, then the site's tab.
 */
test.describe("an imported record's game names", () => {
  const member = { email: "john-morris-live@example.test", name: "John Morris" };

  test.beforeEach(async () => {
    await seedMember(member);
  });

  test.afterEach(async () => {
    await removeMember(member.email);
  });

  test("Checkers leads to our Checkers; Backgammon stays plain words", async ({ page }) => {
    await page.goto("/players/john-morris");
    const siteTab = page.getByTestId("tab").filter({ hasText: "ItsYourTurn.com" });
    await siteTab.click();
    await expect(siteTab).toHaveAttribute("data-open", "true");

    const detail = page.getByTestId("legacy-detail").first();

    // The table has rendered once the row we came for is there.
    const checkers = detail.getByRole("link", { name: "Checkers", exact: true });
    await expect(checkers).toBeVisible();
    await expect(checkers).toHaveAttribute("href", gamePath(RULE_VARIANTS.checkers));

    // Only the name leads anywhere: the counts beside it are another site's figures.
    // `has` is resolved inside each row, so it is given unscoped rather than through `detail`.
    const checkersRow = detail.locator("tr").filter({ has: page.getByRole("link", { name: "Checkers", exact: true }) });
    await expect(checkersRow.getByRole("link")).toHaveCount(1);

    // Halma 10x10 is our Halma, which has a 10×10 board; the name stays as written.
    await expect(detail.getByRole("link", { name: "Halma 10x10", exact: true })).toHaveAttribute(
      "href",
      gamePath(RULE_VARIANTS.halma),
    );

    // Backgammon is on the rendered table as words, and is not a link.
    const backgammon = detail.getByTestId("game-not-here").filter({ hasText: /^Backgammon$/ });
    await expect(backgammon).toBeVisible();
    await expect(detail.getByRole("link", { name: "Backgammon", exact: true })).toHaveCount(0);

    // And the checkers games we do not have stay plain beside the one we do.
    for (const name of ["Anti-Checkers", "Crowded Checkers"]) {
      await expect(detail.getByTestId("game-not-here").filter({ hasText: name })).toBeVisible();
      await expect(detail.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
  });
});
