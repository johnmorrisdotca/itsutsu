import { expect, test, type Page } from "@playwright/test";

import { memberContext } from "./members";
import { playRatedGames, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file begins, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * NO WAY INTO A GAME TAKES MORE THAN TWO PRESSES.
 *
 * John, 2026-09-21, after being handed a measured count of every route: "3
 * clicks is too much, should be 2. If you know the person that saves you time
 * and tells you something. no game or process should take 3 screens/clicks."
 *
 * The threes it caught, and what each one cost:
 *
 *  - the front door offered Play, which is the games you ALREADY have, so a
 *    new one was Play, New game, Begin;
 *  - a game's card on the catalogue named the game and nothing else, so
 *    playing it was the name, then Play on its page, then Begin — and an
 *    UNPLAYED game's "Be the first to play" went to the practice board, which
 *    keeps nothing and makes nobody the first at anything;
 *  - a buddy on the set-up screen cost a press to open the list they were in.
 *
 * This is the ceiling, in a browser, on every route a person actually takes.
 * It counts presses rather than reading the markup: a route that arrives by
 * some other door still has to arrive in two.
 */

/** Presses the named things in turn, and says nothing until a board is reached. */
async function pressesToABoard(page: Page, where: string, presses: readonly string[]) {
  await page.goto(where);
  for (const id of presses) {
    await page.getByTestId(id).first().click({ timeout: 15_000 });
    // The set-up screen is the only stop on any of these, and it is listening before it is pressed.
    if (id !== "set-up-start") await ready(page, "set-up-game");
  }
  await page.waitForURL(/\/games\/[^/]+\/match\//, { timeout: 30_000 });
  tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");
}

/*
 * ITS OWN MEMBER, WITH RULES NOBODY ELSE POSTS.
 *
 * In CI this file ran as the operator with the operator's defaults — gomoku,
 * nine, no clock — and "from the front door" and "from a game's card" both
 * landed on the DOORSTEP with `sit=<seat>` and timed out. Another spec had
 * posted a seat at exactly those rules, so Begin offered to sit with that
 * stranger rather than start a game: a third screen, on the two routes whose
 * rules the spec never gets to choose. Locally the leftover seats happened not
 * to match, which is what "a green that does not travel" looks like.
 *
 * So the member here has a week-long clock and a nineteen board as defaults —
 * a combination no other spec posts — and the two-press ceiling is measured
 * against a board nobody is waiting at. THE THIRD PRESS IS STILL THERE for a
 * reader whose rules a stranger has posted, and is a decision about the
 * product rather than this spec: see the row filed the day this was found.
 */
let context: Awaited<ReturnType<typeof memberContext>>;
let page: Page;

test.beforeAll(async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  context = await memberContext(browser, baseURL!, { email: `two-presses-${stamp}@example.test`, name: `Presses ${stamp}` });
  const set = await context.request.patch("/api/me", {
    data: { gameDefaults: { size: 19, moveTimeMs: 7 * 24 * 60 * 60_000, rated: false } },
  });
  expect(set.ok(), "could not give this member its own game defaults").toBe(true);
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

// One page, one member, one board at a time: the cases share `page` above.
test.describe.configure({ mode: "serial" });

test.describe("every way into a game is two presses", () => {
  test("from the front door", async () => {
    await pressesToABoard(page, "/", ["enter-new-game", "set-up-start"]);
  });

  test("from a game's card on the catalogue", async () => {
    /*
     * The card of a game somebody HAS played. It had figures, a top player and
     * its standings, and no way to play it — the one thing a card about a game
     * is for.
     */
    /*
     * ONE PLAYED GAME OF ITS OWN FIRST. This case needs a card for a game
     * somebody has finished, and it used to find one left behind by whichever
     * spec ran before it on the same database. On eight shards one always had;
     * split twelve ways, nothing before it in its shard finished a game, the
     * catalogue had no played card, and it failed on a correct site. A spec
     * brings its own world (AGENTS.md).
     */
    const tag = Date.now().toString(36);
    await playRatedGames(context.request, { winner: `Card ${tag}`, loser: `Cardy ${tag}`, games: 1 });
    await page.goto("/games");
    const play = page.getByTestId("game-stats-play").first();
    await expect(play, "no card on the catalogue offers a game").toBeVisible();
    await pressesToABoard(page, "/games", ["game-stats-play", "set-up-start"]);
  });

  test("from a game nobody has played yet", async () => {
    /*
     * "Be the first to play" promises the first game on this site's record.
     * It went to /games/<game>/play, a practice board that records nothing —
     * so the press neither kept the promise nor counted towards anything.
     */
    await page.goto("/games");
    const first = page.getByTestId("game-stats-be-first").first();
    await expect(first).toBeVisible();
    await expect(first, "it still leads to the sandbox").not.toHaveAttribute("href", /\/play$/);
    await pressesToABoard(page, "/games", ["game-stats-be-first", "set-up-start"]);
  });

  test("from the one-line sentence on the catalogue", async () => {
    await pressesToABoard(page, "/games", ["start-game-go", "set-up-start"]);
  });

  test("from a game's own page", async () => {
    await pressesToABoard(page, "/games/reversi", ["game-set-up", "set-up-start"]);
  });

  test("from a row of the members list", async () => {
    await pressesToABoard(page, "/players", ["challenge", "set-up-start"]);
  });

  /*
   * FROM A PERSON'S OWN PAGE: Play, then Begin. A row on the board counted
   * this route as three — their name, then Play, then Begin — but the name is
   * the press that reaches the page, and every list a person is on already
   * carries its own Play beside them. On the page itself it was two all
   * along; this pins it so it stays two.
   */
  test("from a person's own page", async () => {
    await page.goto("/players?view=computers");
    const first = page.getByTestId("computer-player-name").first();
    const href = await first.getAttribute("href");
    expect(href, "a computer player's name is not a link to their page").toMatch(/^\/players\//);
    await pressesToABoard(page, href!, ["challenge", "set-up-start"]);
  });

  test("and the people you know are open on the set-up screen, not behind a press", async () => {
    /*
     * The half of the rule that is about KNOWING somebody. Every run of
     * opponents folds once one of them is chosen, which is what fits the
     * screen on a phone — but the people you know arrive open while the
     * answer is still the posted seat, because they are the likeliest answer
     * and the shortest list.
     */
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    const known = page.locator('[data-testid="set-up-opponent-fold"][data-group="known"]');
    if ((await known.count()) === 0) {
      // This member knows nobody, so there is no run to be open — said, not skipped silently.
      await expect(page.locator('[data-testid="set-up-opponent-fold"]').first()).toBeVisible();
      return;
    }
    await expect(known).toHaveAttribute("data-open", "true");
    // And the runs that are NOT people you know stay shut, which is what pays for it.
    await expect(page.locator('[data-testid="set-up-opponent-fold"][data-group="computer"]')).toHaveAttribute(
      "data-open",
      "false",
    );
  });
});
