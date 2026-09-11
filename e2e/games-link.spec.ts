import { expect, test } from "@playwright/test";

import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { RULE_VARIANT_DISPLAY } from "../src/lib/gomoku/variants.constants";
import { slugFor } from "../src/lib/gomoku/slugs";

/**
 * Every game's name on the site leads to that game.
 *
 * The twin of "every person's name leads to their page", and the same kind of
 * rule: obeyed in one list, forgotten in the next list somebody writes. The
 * games index printed all thirty-nine names as plain words with a small
 * "rules" beside each, and the record list named the game of every match and
 * led nowhere at all.
 *
 * Written to fail when the next game ships unlinked rather than to check the
 * ones that exist today: the index is counted against the families, so a game
 * added to `GAME_FAMILIES` without a link fails here instead of appearing as
 * plain words nobody can follow.
 */

const EVERY_GAME = GAME_FAMILIES.flatMap((family) => family.games);

test.describe("a game's name leads to that game", () => {
  test("on the games index, every one of them, counted from the families", async ({ page }) => {
    await page.goto("/games");
    /*
     * Counted inside the index rather than across the page. The lobby above
     * it names a game on every open seat and on every game somebody has
     * going, and those names are links too — the rule kept in more places, not
     * fewer. Counting the whole page would make this test fail the day the
     * lobby obeys the rule, which is backwards.
     */
    const index = page.getByTestId("lobby-family");
    const names = index.getByTestId("game-name");
    await expect(names).toHaveCount(EVERY_GAME.length);

    /*
     * By the address rather than by eye: the families are folded shut on this
     * page, so a game inside a closed one is in the page and not on screen.
     * The rule is about where the name goes, and asking for its href asks
     * exactly that without also asking which family a reader has opened.
     */
    for (const variant of EVERY_GAME) {
      const named = index.locator(`[data-testid="game-name"][data-variant="${variant}"]`);
      await expect(named, `${variant} is not linked on the games index`).toHaveAttribute(
        "href",
        `/rules/${slugFor(variant)}`,
      );
    }

    // The first family stands open, so some of them really are on screen: a
    // link nobody can reach is not a link.
    const open = page.getByTestId("lobby-family").first();
    await expect(open.getByTestId("game-name").first()).toBeVisible();

    // And a folded one opens to show its own.
    const folded = page.getByTestId("lobby-family").nth(1);
    await expect(folded.getByTestId("game-name").first()).toBeHidden();
    await folded.locator("summary").click();
    await expect(folded.getByTestId("game-name").first()).toBeVisible();

    /*
     * And nothing else on this page names a game and stops there. This is what
     * the page-wide count above used to be standing in for, said directly:
     * every name the lobby prints is a link to that game's rules, however many
     * open seats and running games there happen to be today.
     */
    const everywhere = page.getByTestId("game-name");
    for (let i = 0; i < (await everywhere.count()); i += 1) {
      const one = everywhere.nth(i);
      await expect(one, "a game is named here and leads nowhere").toHaveAttribute(
        "href",
        /^\/rules\//,
      );
    }

    // And the first one really arrives at that game rather than at a page
    // that happens to mention it.
    const first = names.first();
    const variant = await first.getAttribute("data-variant");
    await first.click();
    await expect(page).toHaveURL(new RegExp(`/rules/${slugFor(variant ?? "")}$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      RULE_VARIANT_DISPLAY[variant as keyof typeof RULE_VARIANT_DISPLAY].label,
    );
  });

  test("on the record, where every row names the game it was", async ({ page }) => {
    await page.goto("/history");
    const rows = page.getByTestId("history-list").getByRole("listitem");
    const count = await rows.count();
    test.skip(count === 0, "no finished games on this database");

    /*
     * The row is one big stretched link into the replay, so a link inside it
     * has to sit above that one to be clickable at all — the same trick the
     * player names beside it use. Clicking is the assertion: a link that is
     * underneath the row's own link renders perfectly and does nothing.
     */
    const named = rows.first().getByTestId("game-name");
    await expect(named).toHaveCount(1);
    const variant = await named.getAttribute("data-variant");
    await named.click();
    await expect(page).toHaveURL(new RegExp(`/rules/${slugFor(variant ?? "")}$`));
  });

  test("a rules page shows the games people have played of it", async ({ page, request }) => {
    /*
     * John, standing on /rules/tic-tac-toe: "where are the played games????"
     * There were four of them, filed, one click away and invisible — the page
     * had a staged screenshot and the real games were a small text link below
     * four blocks of rules.
     */
    const made = await request.post("/api/games/live", {
      data: {
        variant: "tictactoe",
        size: 3,
        blackName: "Aki",
        whiteName: "Bo",
        opener: "black",
        rated: false,
      },
    });
    expect(made.status(), await made.text()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
    for (const [i, [row, col]] of ([[0, 0], [1, 1], [0, 1], [2, 2], [0, 2]] as [number, number][]).entries()) {
      await request.post(`/api/games/${game.id}/moves`, {
        data: { token: i % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
      });
    }

    await page.goto("/rules/tic-tac-toe");
    const panel = page.getByTestId("rules-played-here");
    await expect(panel, "a rules page shows no games of the game it explains").toBeVisible();
    // And every line of it leads somewhere: the count to all of them, a game
    // to its own replay.
    const links = panel.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await links.count()); i += 1) {
      await expect(links.nth(i)).toHaveAttribute("href", /\/(history|players)\//);
    }
  });

  test("on a game's own record page, in the heading", async ({ page }) => {
    await page.goto("/history/gomoku");
    const named = page.getByTestId("record-game").getByTestId("game-name");
    await expect(named).toHaveAttribute("href", "/rules/gomoku");
  });

  test("in the prose that names one, not only in lists", async ({ page }) => {
    // The champions page explains itself by naming two games. A name in a
    // sentence is as much a name as a name in a table.
    await page.goto("/champions");
    const named = page.getByRole("paragraph").getByTestId("game-name");
    await expect(named.first()).toHaveAttribute("href", /^\/rules\//);
  });

  test("but a game named inside another link is left as words", async ({ page }) => {
    /*
     * The honest exception, and the reason this is a rule about names rather
     * than about text. A guide card on /learn is itself one link to the
     * guide, and it lists the games that guide covers; a link inside a link
     * is not a thing HTML has. The guide's own page links every one of them,
     * which is where somebody following the card ends up anyway.
     */
    await page.goto("/learn");
    await expect(page.getByTestId("game-name")).toHaveCount(0);
    const card = page.getByRole("listitem").first().getByRole("link");
    await card.click();
    await expect(page).toHaveURL(/\/learn\/.+/);
    const covered = page.getByRole("link").filter({ hasText: RULE_VARIANT_DISPLAY.freestyle.label });
    await expect(covered.first()).toHaveAttribute("href", /^\/rules\//);
  });
});
