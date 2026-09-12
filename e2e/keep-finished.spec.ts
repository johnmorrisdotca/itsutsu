import { expect, test } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import { memberContext, removeMember, removePlayedUnder } from "./members";
import { gamesMade } from "./tidy";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

/**
 * How long a finished game stays in your own list.
 *
 * The list is a working queue, and every finished game staying in it for
 * ever turns it into an archive. What is checked here is the promise the
 * setting makes and the promise it does not: the game leaves the queue, and
 * the record still has it.
 */
test.describe("keeping finished games in your own list", () => {
  /* The games this file makes, taken away when it finishes. See `gamesMade`. */
  const tidyAway = gamesMade();

  /** One game's row in the queue, wherever it has been sorted to. */
  function row(page: import("@playwright/test").Page, id: string) {
    return page.locator(`[data-testid="my-game"][data-id="${id}"]`);
  }

  test("is set on the profile, and offers keeping everything", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `keeper-${stamp}@example.test`,
      name: `Keeper ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/me?view=profile");

    const choice = page.getByTestId("keep-finished-days");
    await expect(choice).toBeVisible();
    // Everybody starts keeping everything: nothing disappears unless asked.
    await expect(choice).toHaveValue("0");

    await choice.selectOption("14");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // It survives a reload, which is the whole point of it being on the
    // account rather than in this browser.
    await page.reload();
    await expect(page.getByTestId("keep-finished-days")).toHaveValue("14");

    await context.close();
  });

  test("hides nothing from the record, whatever it is set to", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `keeper2-${stamp}@example.test`, name: `Sweeper ${stamp}` };
    const opponent = `Broom ${stamp}`;

    const started = await request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: opponent, size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // The shortest window there is. The game was finished seconds ago, so it
    // is still inside it — the setting is about age, not about hiding.
    await page.goto("/me?view=profile");
    await page.getByTestId("keep-finished-days").selectOption("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // Still in the record, which keeps everything however the queue is set.
    await page.goto(`/history?search=${encodeURIComponent(stamp)}`);
    await expect(page.getByTestId("history-list")).toContainText(shownName(me.name));

    await context.close();
  });

  test("lets go of a game older than the window, and only from the list", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    // Unique in the first word, which is the part a list prints.
    const me = { email: `keeper3-${stamp}@example.test`, name: `Duster${stamp} Tester` };

    const started = await request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: `Cloth${stamp} Tester`, size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Claim the black seat for this member, then age the game a month. The
    // clock is the only thing a test cannot wait for.
    const prisma = new PrismaClient();
    try {
      const old = new Date(Date.now() - 30 * 86_400_000);
      const mine = await prisma.member.findUnique({ where: { email: me.email }, select: { id: true } });
      await prisma.game.update({
        where: { id: game.id },
        data: { blackMemberId: mine!.id, playedAt: old, lastMoveAt: old },
      });
    } finally {
      await prisma.$disconnect();
    }

    // Keeping everything: it is in the list.
    await page.goto("/play");
    await expect(page.getByTestId("my-games-finished")).toContainText(shownName(`Cloth${stamp} Tester`));

    await page.goto("/me?view=profile");
    await page.getByTestId("keep-finished-days").selectOption("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // A month old, a week's window: gone from the queue.
    await page.goto("/play");
    await expect(page.getByTestId("my-games-finished")).toHaveCount(0);

    // And still in the record, which keeps everything.
    await page.goto(`/history?search=${encodeURIComponent(stamp)}`);
    await expect(page.getByTestId("history-list")).toContainText(shownName(me.name));

    await context.close();
  });

  /**
   * BOTH HALVES ON ONE PAGE — one finished game inside the window and one past
   * it, for the same member, at the same moment.
   *
   * The case above says the old game goes, and that was the whole of the claim
   * while the window was applied in JavaScript AFTER the read: every game the
   * member had ever sat in came back and most were thrown away. The window is a
   * bound in the query now (`myListWindow`), and the failure THAT can cause is
   * not "the old one is still here" — it is the recent one going with it, on a
   * page that then looks perfectly tidy and is missing a game.
   *
   * So the presence is asserted first and the absence stands beside it. An
   * absence on its own is true for a moment on every page, and "nothing is
   * listed" would satisfy a spec that only looked for the old game to be gone.
   */
  test("keeps the game inside the window while letting go of the one past it", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `keeper4-${stamp}@example.test`, name: `Keeps${stamp} Tester` };
    const against = { lately: `Fresh${stamp} Tester`, ancient: `Stale${stamp} Tester` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    /**
     * One finished game of this member's own, made the way a player makes one:
     * created, the seat taken BY ITS LINK — which is what binds an account to a
     * seat, since a private game binds nobody when it is written — and then
     * given up from that seat.
     */
    async function finished(opponent: string): Promise<string> {
      const started = await context.request.post("/api/games/live", {
        data: { blackName: me.name, whiteName: opponent, size: 9 },
      });
      expect(started.status()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string };
      tidyAway(game.id);
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      const over = await context.request.post(`/api/games/${game.id}/resign`, {
        data: { token: game.blackToken },
      });
      expect(over.status()).toBe(200);
      return game.id;
    }

    const lately = await finished(against.lately);
    const ancient = await finished(against.ancient);

    // A month onto one of them, and onto nothing else: the clock is the one
    // thing a test cannot wait for, and this row is this spec's own.
    const prisma = new PrismaClient();
    try {
      const old = new Date(Date.now() - 30 * 86_400_000);
      await prisma.game.update({ where: { id: ancient }, data: { playedAt: old, lastMoveAt: old } });
    } finally {
      await prisma.$disconnect();
    }

    /*
     * Keeping everything, which is where everybody starts: BOTH are listed.
     * This is the half that makes the rest mean anything — without it, "gone"
     * below could as easily be "never arrived".
     */
    await page.goto("/play");
    await expect(page.getByTestId("my-games-finished")).toBeVisible();
    await expect(row(page, lately)).toBeVisible();
    await expect(row(page, ancient)).toBeVisible();

    await page.goto("/me?view=profile");
    await page.getByTestId("keep-finished-days").selectOption("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // A week's window: the game from a month ago is not listed, and the one
    // from a moment ago still is — waited for before anything is called absent.
    await page.goto("/play");
    await expect(page.getByTestId("my-games-finished")).toBeVisible();
    await expect(row(page, lately)).toBeVisible();
    await expect(row(page, ancient)).toHaveCount(0);

    // And the game itself is untouched. The window hides a row from ONE list;
    // a bound that had dropped the game would look identical on the page.
    expect((await context.request.get(`/api/games/${ancient}`)).status()).toBe(200);

    await context.close();
    await removeMember(me.email);
    await removePlayedUnder([me.name, against.lately, against.ancient]);
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * MORE FINISHED GAMES THAN ONE PAGE HOLDS
   * ───────────────────────────────────────────────────────────────────────────
   *
   * The window above bounds the read for a member who has CHOSEN one. It cannot
   * bound the default, "keep for ever", because there is no date to bound with —
   * so the finished group pages instead, and this is the case that walks it.
   *
   * THREE PROMISES, AND ALL THREE ARE ASSERTED HERE, because each of them fails
   * in a way that looks like the page working:
   *
   *  - THE COUNT IS TRUE. The heading says how many there are, not how many are
   *    on screen. "Lately finished 5" over a bucket of twenty-three is the fault
   *    `shownGroup` was written against, and a PAGE hands it a fresh way in:
   *    counting the rows in hand gives the cap every time.
   *  - THE LINK KEEPS THE PROMISE THE COUNT MADE. A number that refers to games
   *    leads to those games — all of them — which for a paged list means the
   *    pages between here and the end actually exist and hold the rest.
   *  - THE PAGES DO NOT OVERLAP OR SKIP. Asserted over the union of two pages
   *    rather than page by page, because a repeat and a gap are two halves of one
   *    fault and a per-page check can miss either.
   *
   * AND IT CLICKS, rather than typing the addresses. A test that reaches its
   * subject by a route no reader takes proves nothing about the route they do
   * take, and this project has the language picker to show what that costs.
   * There is no hydration window to race here — every control is a plain link,
   * so a press before React attaches follows the href to the same address — but
   * clicking is what a reader does, so clicking is what this does.
   *
   * IT BRINGS ITS OWN WORLD. Its member is made by this spec and its games are
   * this spec's, so the counts below are statements about what it created and not
   * about what four hundred other tests left on this machine. Both go away at the
   * end.
   */
  test("pages the finished games, says how many there are, and leads to the rest", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `keeper5-${stamp}@example.test`, name: `Pager${stamp} Tester` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    /*
     * TWENTY-THREE, which is the number that makes this case say something. The
     * closed panel shows five and the opened one twenty, so anything up to twenty
     * would open in full and never turn a page — the cursor would be built, be
     * correct, and go untested.
     */
    const HOW_MANY = 23;
    const CLOSED = 5;
    const OPENED = 20;

    const made: string[] = [];
    const prisma = new PrismaClient();
    try {
      const mine = await prisma.member.findUnique({
        where: { email: me.email },
        select: { id: true },
      });
      expect(mine).not.toBeNull();
      for (let n = 0; n < HOW_MANY; n += 1) {
        /*
         * Filed rows rather than games played through the API: this case is about
         * the ORDER and the COUNT of a list, and playing twenty-three games would
         * be seventy requests to arrange rows whose shape is the whole point.
         * `e2e/xp-history.spec.ts` seeds a finished game the same way.
         *
         * `lastMoveAt` an hour apart and DESCENDING with the index, so the order
         * the page must draw is known before the page is opened — and `rated:
         * false`, because nothing here should move a rating on a shared database.
         */
        const when = new Date(Date.now() - (n + 1) * 3_600_000);
        const row = await prisma.game.create({
          data: {
            id: `${stamp.slice(-4)}-${String(n).padStart(3, "0")}z`,
            status: "finished",
            result: "black",
            winner: "black",
            moveCount: 9,
            rated: false,
            size: 9,
            winLength: 5,
            variant: "freestyle",
            obstacles: "none",
            opener: "black",
            blackName: me.name,
            whiteName: `Turned${stamp} Tester`,
            blackMemberId: mine!.id,
            playedAt: when,
            lastMoveAt: when,
          },
          select: { id: true },
        });
        made.push(row.id);
        tidyAway(row.id);
      }
    } finally {
      await prisma.$disconnect();
    }

    const panel = page.getByTestId("my-games-finished");
    const count = page.getByTestId("my-games-finished-count");
    const rows = panel.locator('[data-testid="my-game"]');

    // ── The closed panel: five of twenty-three, and it says so. ──────────────
    await page.goto("/play");
    await expect(panel).toBeVisible();
    await expect(rows).toHaveCount(CLOSED);
    await expect(count).toHaveText(`${HOW_MANY} · showing ${CLOSED}`);
    // Newest first, oldest last — the order `lastMoveAt ?? playedAt` puts them in.
    await expect(rows.first()).toHaveAttribute("data-id", made[0]);
    await expect(rows.nth(CLOSED - 1)).toHaveAttribute("data-id", made[CLOSED - 1]);

    /*
     * The rest are not on this page — asserted AFTER the five above, so it is a
     * statement about a rendered page rather than about the speed of a request.
     */
    await expect(row(page, made[CLOSED])).toHaveCount(0);

    // ── The link the count promised, clicked. ────────────────────────────────
    await page.getByTestId("my-games-finished-all").click();
    await expect(page).toHaveURL(/\?all=finished$/);
    await expect(rows).toHaveCount(OPENED);
    // Still the TRUE number over a page of twenty, not the page's own length.
    await expect(count).toHaveText(`${HOW_MANY} · showing ${OPENED}`);
    const first = await rows.evaluateAll((seen) =>
      seen.map((one) => one.getAttribute("data-id") ?? ""),
    );

    // ── And the page after it, which is where the cursor is. ─────────────────
    const older = page.getByTestId("my-games-finished-older");
    await expect(older).toBeVisible();
    await older.click();
    await expect(page).toHaveURL(/cursor=/);
    await expect(panel).toBeVisible();
    await expect(rows).toHaveCount(HOW_MANY - OPENED);
    const second = await rows.evaluateAll((seen) =>
      seen.map((one) => one.getAttribute("data-id") ?? ""),
    );

    /*
     * NO REPEATS AND NO GAPS. Over the union of the two pages, because that is
     * the only assertion a plausible wrong answer cannot satisfy: a cursor that
     * repeated a row would make the set smaller than the count, and one that
     * skipped a row would leave a game this spec created on no page at all.
     */
    expect(new Set([...first, ...second]).size).toBe(HOW_MANY);
    expect([...first, ...second]).toEqual(made);

    // That was the last page, so there is nowhere further to go.
    await expect(older).toHaveCount(0);

    // ── The way back, which is the half a one-directional test never finds. ──
    await page.getByTestId("my-games-finished-fewer").click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(rows).toHaveCount(CLOSED);
    await expect(count).toHaveText(`${HOW_MANY} · showing ${CLOSED}`);

    await context.close();
    await removeMember(me.email);
    await removePlayedUnder([me.name, `Turned${stamp} Tester`]);
  });
});
