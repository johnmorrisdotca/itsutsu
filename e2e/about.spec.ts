import { expect, test } from "@playwright/test";

import { ready } from "./support";

/**
 * Which chapter holds what, as a reader reaches it. The first is the bare
 * /about, so an ordinary link to the page still lands on its opening.
 */
const CHAPTERS: Record<string, readonly string[]> = {
  story: ["Where this comes from", "Sites worth knowing"],
  games: ["What is on the board here"],
  roots: ["Five stones, and where they came from", "Othello", "Famous openings"],
  japan: ["The Japanese thread", "Go, the board underneath"],
  numbers: ["Ladders, ratings and tournaments", "Ratings, in numbers", "How a move is written down"],
  programs: ["The players that are not people"],
};

/**
 * The About page.
 *
 * It had no test at all, which is how a page of prose quietly stops
 * rendering: nothing here is typed strictly enough for the compiler to catch
 * a section that throws, and nobody reloads the About page. These walk the
 * two things that are easy to get wrong — that every game named in the prose
 * is a working link to that game, and that the figures are really drawn — and
 * one of them clicks through to prove a link is not merely present.
 */
test.describe("about", () => {
  /*
   * THE PAGE READS A CHAPTER AT A TIME. It was one scroll of eleven sections,
   * 28,589 pixels on a phone — thirty-four screens — so the last of them were
   * written for readers who would never reach them. Each section still exists;
   * this walks the chapters to prove none was lost in the tabbing, which is
   * the failure the change could have.
   */
  test("renders every section across its chapters, including go and the notation", async ({ page }) => {
    for (const [view, headings] of Object.entries(CHAPTERS)) {
      await page.goto(view === "story" ? "/about" : `/about?view=${view}`);
      await expect(page.getByRole("heading", { name: "About", exact: false }).first()).toBeVisible();
      for (const heading of headings) {
        await expect(page.getByRole("heading", { name: heading }), `${heading} is missing from ${view}`).toBeVisible();
      }
    }
  });

  /*
   * And reached by PRESSING a tab, not by typing its address — the rule the
   * language picker earned: a feature reached by a route no reader takes
   * proves nothing about the route they do take.
   */
  test("a tab is pressed, and the page changes under it", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "Where this comes from" })).toBeVisible();
    await ready(page, "tabs");
    await page.getByRole("link", { name: /The programs/ }).click();
    await expect(page.getByRole("heading", { name: "The players that are not people" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where this comes from" })).toHaveCount(0);
  });

  /*
   * THE COUNTS ARE READ, NOT TYPED, and this is the browser half of
   * `about.coverage.test.ts`. That test says the source does not contain a
   * hand-written count; this one says the number a reader actually sees is the
   * number of games the site actually has. The page said "about 35" for long
   * enough to be ten games short, and neither a compiler nor a reviewer had
   * any way to notice.
   */
  test("counts the games it really has, and lists every family", async ({ page }) => {
    const { RULE_VARIANT_LIST } = await import("../src/lib/gomoku/gomoku.constants");
    const { GAME_FAMILIES } = await import("../src/lib/gomoku/families");

    await page.goto("/about?view=games");
    const section = page
      .getByTestId("about-section")
      .filter({ has: page.getByRole("heading", { name: "What is on the board here" }) });
    await expect(section).toContainText(`There are ${RULE_VARIANT_LIST.length} games here`);
    await expect(section).toContainText(`in ${GAME_FAMILIES.length} families`);

    // One row per family, each leading to that family's page. Looked for
    // inside the table rather than in the section, because the prose above it
    // names five in a row too and that link goes to the GAME, not the family.
    const rows = section.getByTestId("about-table").first().locator("tbody tr");
    await expect(rows).toHaveCount(GAME_FAMILIES.length);
    for (const family of GAME_FAMILIES) {
      const link = rows.getByRole("link", { name: family.title, exact: true });
      await expect(link).toHaveAttribute("href", /\/games\/[a-z0-9-]+\/family$/);
    }
  });

  test("says what the computer players do, and what the measurement showed", async ({ page }) => {
    await page.goto("/about?view=programs");
    const section = page
      .getByTestId("about-section")
      .filter({ has: page.getByRole("heading", { name: "The players that are not people" }) });

    // The five grades, gentlest first, read from the same rows the chooser draws.
    for (const grade of ["Razryad", "Kyu", "Dan", "Meijin", "Guoshou"]) {
      await expect(section.getByText(grade, { exact: false }).first()).toBeVisible();
    }
    // The finding, which is the reason the section exists.
    await expect(section).toContainText("the top two grades are the same player");
    await expect(section).toContainText("thinks in your browser");
  });

  /*
   * THE GRAPH, and the thing about it that is easy to get wrong.
   *
   * John asked for graphs as well as paragraphs. Its first draft drew every
   * pairing in one list, so "Kyu over Razryad" appeared twice with nothing to
   * say which game each was — and its caption asserted the top two grades come
   * out level, which is true of the live move budget and is NOT what these
   * bars show. A figure that disagrees with its own caption is worse than none,
   * so the sentence is computed from the bars and this is what says so.
   */
  test("draws each step of the computer ladder, and says nothing its own bars deny", async ({ page }) => {
    await page.goto("/about?view=programs");
    const graph = page.getByTestId("about-grade-ladder");
    await expect(graph).toBeVisible();

    // Every bar belongs to a named game, so two readings of one pairing can be told apart.
    const games = await graph.locator("text").filter({ hasText: /^(Checkers|Reversi|Hex|Go|Halma)$/ }).count();
    expect(games, "no game is named above its bars").toBeGreaterThan(0);

    /*
     * A percentage on every bar, and the half line it is read against.
     *
     * The half line found as the AXIS'S mark, not as the text "50%". It was the
     * text, and that stopped naming one thing on 2026-09-22 when the ladder was
     * measured across twelve boards: three pairings came out level, each bar
     * labelled "50%", and the spec failed in strict mode over four matches on a
     * page that was drawing exactly what it should.
     */
    await expect(graph.locator('text[data-axis-mark="0.5"]')).toHaveText("50%");
    await expect(graph).toContainText("%");

    /*
     * The caption names the CLOSEST step by its real number. Whatever the
     * measurement says, the sentence has to be about these bars — so it is
     * checked for a figure rather than for a phrase.
     */
    await expect(graph.locator("figcaption")).toContainText(/\d+%/);
    await expect(graph.locator("figcaption")).toContainText("measured games");
  });

  test("a game named in the prose links to that game", async ({ page }) => {
    // The histories chapter, which is where the games are named and compared.
    await page.goto("/about?view=roots");
    // The names, and the page each one has to reach. Checked on the first
    // occurrence: a name that appears twice need only be a link once.
    const named: [string, string][] = [
      ["Othello", "/games/reversi"],
      ["Pente", "/games/ninuki"],
      ["Connect Four", "/games/drop-four"],
      ["gomoku", "/games/gomoku"],
      ["Reversi", "/games/classic-reversi"],
    ];
    for (const [name, path] of named) {
      const link = page.getByRole("link", { name, exact: true }).first();
      await expect(link, `"${name}" should be a link`).toBeVisible();
      await expect(link, `"${name}" should point at ${path}`).toHaveAttribute("href", path);
    }
  });

  test("a linked game name really goes to the game", async ({ page }) => {
    await page.goto("/about?view=roots");
    await page.getByRole("link", { name: "Pente", exact: true }).first().click();
    await expect(page).toHaveURL(/\/games\/ninuki$/);
  });

  test("go is explained, with its diagrams and its numbers", async ({ page }) => {
    await page.goto("/about?view=japan");
    const go = page.getByTestId("about-section").filter({ hasText: "Go, the board underneath" });
    await expect(go).toHaveCount(1);
    // Liberties and a capture, then two eyes.
    await expect(go.getByTestId("about-diagram")).toHaveCount(2);
    // The size of the game, beside the games this site does play.
    await expect(go.getByTestId("about-table")).toHaveCount(1);
    await expect(go).toContainText("2.08 × 10¹⁷⁰");
    // It does not pretend go is playable here.
    await expect(go).toContainText("cannot play go here yet");
  });

  test("the ratings section keeps our rules and another site's apart", async ({ page }) => {
    await page.goto("/about?view=numbers");
    const ratings = page.getByTestId("about-section").filter({ hasText: "Ratings, in numbers" });
    await expect(ratings).toHaveCount(1);
    // The rule that is ours and was never written down: no farming beginners.
    await expect(ratings).toContainText("gains nothing at all from winning");
    // What is quoted from elsewhere is named as theirs, not stated as ours.
    await expect(ratings).toContainText("Pente.org");
    const tables = ratings.getByTestId("about-table");
    // The example ladder, and ours beside theirs.
    await expect(tables).toHaveCount(2);
    await expect(tables.nth(1)).toContainText("200 below your best");
  });

  test.describe("bringing a record over", () => {
    // The people this line is for have no account here yet, so it is checked
    // with no session at all: a line only a member can read reaches nobody it
    // was written for.
    test.use({ storageState: { cookies: [], origins: [] } });

    test("a signed-out reader is told where to write, and what is and is not promised", async ({ page }) => {
      const response = await page.goto("/about");
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/\/about$/);

      const sites = page.getByTestId("about-section").filter({ hasText: "Sites worth knowing" });
      await expect(sites).toHaveCount(1);
      const write = sites.getByRole("link", { name: "hello@itsutsu.com", exact: true });
      await expect(write).toBeVisible();
      await expect(write).toHaveAttribute("href", "mailto:hello@itsutsu.com");

      // Done by hand, once: a snapshot, not a feed.
      await expect(sites).toContainText("copied over by hand");
      await expect(sites).toContainText("It is a snapshot, copied once");
      // A record adds up across sites; a rating never does.
      await expect(sites).toContainText("a combined record, never a combined rating");
    });
  });

  test("the notation section says how a move is written, and names SGF", async ({ page }) => {
    await page.goto("/about?view=numbers");
    const notation = page.getByTestId("about-section").filter({ hasText: "How a move is written down" });
    await expect(notation).toHaveCount(1);
    await expect(notation).toContainText("There is no column I");
    await expect(notation).toContainText("Smart Game Format");
    // The two schemes side by side: our H8 is SGF's hh.
    const table = notation.getByTestId("about-table");
    await expect(table).toHaveCount(1);
    await expect(table).toContainText("H8");
    await expect(table).toContainText("hh");
  });
});
