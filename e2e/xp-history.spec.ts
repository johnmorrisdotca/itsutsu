import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { xpLevelFor } from "../src/lib/xp/xpCurve";
import { xpLevelName } from "../src/lib/xp/levelNames";
import { memberContext } from "./members";

/**
 * A MEMBER'S OWN XP LEDGER, DRIVEN THE WAY A MEMBER REACHES IT.
 *
 * The tab is CLICKED rather than navigated to by address, which is the lesson
 * AGENTS.md draws from the language picker: choosing a language was verified
 * thoroughly and every verification reached the feature by typing an address or
 * sending a header, while a reader reaches it by clicking — and clicking was the
 * whole bug. `next/link` makes a tab a client-side navigation and the App Router
 * answers out of its own cache, so a spec that only ever `goto`s the tab proves
 * the server can render it and nothing about the way in.
 *
 * Nothing here reloads, for the same reason.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EVERY CASE BRINGS ITS OWN WORLD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each test seeds its own member, its own ledger and its own game, and takes all
 * three away again. The first draft shared one member across four cases and the
 * later ones failed with an empty ledger — because another session's suite was
 * running against the same local database and `clearSeededMembers` takes every
 * row stamped `invitedWith: "playwright"`, which is every row this helper makes.
 * The member came back on the next `seedMember`, with `xp` at 0 and no events,
 * and the failure read exactly like a paging bug.
 *
 * That is AGENTS.md's rule arriving the expensive way: **a spec must not assert
 * anything about a row it did not itself create** — and a row an EARLIER TEST
 * created is a row this test did not. The window is now one test long.
 *
 * **The operator's address is never touched.** `/me` for the stored admin
 * session is a real person's real row on a developer's machine, and a spec that
 * read it would be asserting about whatever John happened to have earned that
 * week.
 */

/*
 * BEFORE the client is constructed, not in a `beforeAll`. Prisma reads
 * `DATABASE_URL` at construction and this module's client is built as the file
 * loads, so a hook that loads the environment afterwards runs too late and every
 * query fails with "Environment variable not found" rather than with anything
 * about the test. The dev server loads its own; this process has to be told.
 */
process.loadEnvFile(".env");

const prisma = new PrismaClient();

/** Nothing else on this machine could be holding these, which is the point. */
const STAMP = `xp${Date.now().toString(36)}`;

/**
 * A dozen awards, oldest first, with a level-up inside them.
 *
 * `everyGradeBeaten` at 250 is what carries the total clear of the flat early
 * ramp, so the standing line has a real level and a real distance to the next
 * one rather than "Level 1, 20 to go" — which would satisfy every assertion
 * below while showing nobody a ladder.
 *
 * Every subject is the real shape the awarder writes: a game id for a match, a
 * variant key for a first play, a family TITLE (which is a family's only
 * identity — `GAME_FAMILIES` has no key), a bot tier, and a day.
 */
function ledgerFor(memberId: string, gameId: string) {
  const awards: { type: string; points: number; subject: string; day: string }[] = [
    { type: "joined", points: 25, subject: "", day: "2026-09-01" },
    { type: "dailyVisit", points: 5, subject: "2026-09-01", day: "2026-09-01" },
    { type: "firstGameEver", points: 50, subject: "", day: "2026-09-02" },
    { type: "gameFinished", points: 10, subject: gameId, day: "2026-09-02" },
    { type: "gameWon", points: 20, subject: gameId, day: "2026-09-02" },
    { type: "firstOfVariant", points: 25, subject: "renju", day: "2026-09-03" },
    { type: "firstWinAtVariant", points: 20, subject: "renju", day: "2026-09-03" },
    { type: "firstOfFamily", points: 50, subject: "Five in a row", day: "2026-09-04" },
    { type: "gradeBeaten", points: 40, subject: "meijin", day: "2026-09-05" },
    { type: "everyGradeBeaten", points: 250, subject: "", day: "2026-09-06" },
    // A match no page can reach: no Game row is written for this id.
    { type: "longGame", points: 10, subject: `${gameId}-gone`, day: "2026-09-07" },
    { type: "dailyVisit", points: 5, subject: "2026-09-08", day: "2026-09-08" },
  ];
  return awards.map((award, index) => ({
    memberId,
    type: award.type,
    points: award.points,
    subject: award.subject,
    dayKey: award.day,
    createdAt: new Date(Date.UTC(2026, 8, 1, 0, index)),
  }));
}

type Seeded = { context: BrowserContext; email: string; memberId: string; gameId: string; total: number };

/**
 * A member with a ledger, signed in, made here and nowhere else.
 *
 * `who` distinguishes one case's member from another's, so two cases running in
 * either order cannot see each other's rows — and cannot delete them either.
 */
async function withLedger(browser: Browser, baseURL: string, who: string): Promise<Seeded> {
  const email = `${STAMP}-${who}@example.test`;
  const gameId = `${STAMP}-${who}`;
  const context = await memberContext(browser, baseURL, {
    email,
    name: `Ledger ${who} ${STAMP.slice(-4)}`,
    timeZone: "Asia/Tokyo",
  });

  const member = await prisma.member.findUnique({ where: { email }, select: { id: true } });
  if (member === null) throw new Error("seedMember did not make a row");

  /*
   * A real, FINISHED game with this member on a seat, for one of the two
   * match-keyed awards. Finished and seated so neither sweep in `e2e/tidy.ts`
   * can take it mid-test: `clearAnonymousGames` only takes active games with
   * nobody on either seat.
   */
  await prisma.game.create({
    data: {
      id: gameId,
      variant: "renju",
      size: 15,
      winLength: 5,
      obstacles: "none",
      opener: "black",
      result: "black",
      winner: "black",
      moveCount: 9,
      status: "finished",
      rated: false,
      blackMemberId: member.id,
    },
  });

  const rows = ledgerFor(member.id, gameId);
  await prisma.xpEvent.createMany({ data: rows, skipDuplicates: true });
  const total = rows.reduce((sum, row) => sum + row.points, 0);
  await prisma.member.update({ where: { id: member.id }, data: { xp: total } });

  return { context, email, memberId: member.id, gameId, total };
}

/** Everything that world was made of, gone. Nothing sweeps XpEvent but this. */
async function clearLedger(seeded: Seeded): Promise<void> {
  await seeded.context.close();
  await prisma.xpEvent.deleteMany({ where: { memberId: seeded.memberId } });
  await prisma.game.deleteMany({ where: { id: seeded.gameId } });
  await prisma.member.deleteMany({ where: { email: seeded.email } });
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("a member's own XP", () => {
  test("the ledger is on a tab of /me, newest first, with the thing behind every row", async ({
    browser,
    baseURL,
  }) => {
    const seeded = await withLedger(browser, baseURL ?? "", "rows");
    const page = await seeded.context.newPage();
    try {
      // ── The way in is a click, not an address ────────────────────────────
      await page.goto("/me");
      await expect(page.getByTestId("my-record")).toBeVisible();
      await page.getByTestId("tab").filter({ hasText: "XP" }).click();

      const ledger = page.getByTestId("my-xp-ledger");
      await expect(ledger).toBeVisible();

      // The standing, off the Member row, with a level worth having.
      await expect(page.getByTestId("my-xp-total")).toHaveText(
        `${seeded.total.toLocaleString("en-US")} XP`,
      );
      /*
       * THE LEVEL'S NAME, NOT `Level 7`. The seeded total is a sum of catalogue
       * constants, so the rung it lands on cannot be written down here as a
       * literal — `xpLevelName` is asked for it. That alone would be the
       * feature calling itself back, so the line below pins what actually
       * changed and cannot be satisfied by the old code: the floor form is what
       * this panel used to print, and seeing it again means the swap came
       * undone.
       */
      const level = xpLevelFor(seeded.total);
      await expect(page.getByTestId("my-xp-level")).toHaveText(xpLevelName(level));
      await expect(page.getByTestId("my-xp-level")).not.toHaveText(/^Level \d+$/);
      await expect(page.getByTestId("my-xp-next")).toContainText(`to ${xpLevelName(level + 1)}`);

      // Twelve awards, newest first: the last one seeded is the first one read.
      const rows = page.getByTestId("my-xp-award");
      await expect(rows).toHaveCount(12);
      await expect(rows.first()).toContainText("+5");
      await expect(rows.last()).toContainText("+25");
      // Each says what it was for, in the catalogue's own words.
      await expect(rows.last()).toContainText("For being here at all");

      /*
       * NOTHING IS A DEAD END. The game's name leads to the game, the match to
       * the match, the family to the family's page, and the computer player to
       * theirs. Checked by the address each link actually produces rather than
       * by its words, because the words would pass over a link to anywhere.
       *
       * `:visible` because the About column is drawn twice — once in its own
       * column and once folded into the row for a phone, one of the two always
       * `display: none`. Without it `.first()` picks whichever copy comes first
       * in the markup, which at this viewport is the hidden one, and the spec
       * fails on a link that is present and correct.
       */
      const linkTo = (href: string) => ledger.locator(`a[href="${href}"]:visible`).first();
      await expect(linkTo("/games/renju")).toBeVisible();
      await expect(linkTo(`/games/renju/match/${seeded.gameId}`)).toBeVisible();
      await expect(linkTo("/games/gomoku/family")).toBeVisible();
      await expect(linkTo("/players/meijin")).toBeVisible();

      // And the row whose match was never kept says so, rather than linking to
      // a board that is not there.
      await expect(ledger).toContainText("a match no longer kept");

      /*
       * THE PHONE SEES THE SAME ROWS, with the About folded into each one. A
       * layout that appears below `sm` is a layout nothing had looked at, and
       * the fold exists because four columns at 390 crushed the sentence into a
       * two-word ribbon. Driven by resizing rather than by a second address,
       * because that is what a reader on a phone does: arrive narrow.
       */
      await page.setViewportSize({ width: 390, height: 900 });
      await expect(rows).toHaveCount(12);
      await expect(linkTo(`/games/renju/match/${seeded.gameId}`)).toBeVisible();
      // The heading folds away with its column, so nothing labels an empty space.
      await expect(page.getByRole("columnheader", { name: "About" })).toBeHidden();
      // And the sentence is still there, which is what the fold was for.
      await expect(ledger).toContainText("For being here at all");
    } finally {
      await clearLedger(seeded);
    }
  });

  test("the ledger pages by cursor, with no row twice and none missed", async ({
    browser,
    baseURL,
  }) => {
    const seeded = await withLedger(browser, baseURL ?? "", "paging");
    const page = await seeded.context.newPage();
    try {
      // Five at a time, so a dozen awards is three pages.
      await page.goto("/me?view=xp&limit=5");
      const rows = page.getByTestId("my-xp-award");
      // `toHaveCount` retries; `allInnerTexts` does not, and a count taken
      // before the page has answered is a count of nothing that reads as a bug.
      await expect(rows).toHaveCount(5);
      const first = await rows.allInnerTexts();

      /*
       * TWO WAYS THIS WAIT WAS ALREADY TRUE, AND BOTH LOOKED LIKE A PAGING BUG.
       *
       * Every page of this ledger but the last holds five rows, so `toHaveCount(5)`
       * after a click is already true of the page STILL ON SCREEN: it passes
       * before the navigation lands and `allInnerTexts` reads page one a second
       * time. The spec then reports page two repeating every row of page one —
       * the exact fault cursors exist to prevent, while the cursor works
       * perfectly. That cost one run.
       *
       * The obvious repair cost another: waiting for the top row to stop being
       * the text it was, as `not.toHaveText(await first.innerText())`.
       * `toHaveText` compares NORMALISED text and `innerText` returns the cells
       * tab-separated, so the two can never be equal and the negative passes
       * instantly — an assertion that is true of every page, phrased as a wait.
       *
       * So the wait names the row that could only be on the page being waited
       * for, by a date this test itself seeded. It cannot be vacuously true, and
       * it says out loud which page is expected next.
       */
      const advanceTo = async (topDay: string) => {
        await page.getByTestId("my-xp-more").click();
        await expect(rows.first()).toContainText(topDay);
      };

      // Twelve awards, newest first, five at a time: the second page opens on
      // the sixth of them, which is the first win at a variant on 2026-09-03.
      await advanceTo("2026-09-03");
      await expect(rows).toHaveCount(5);
      const second = await rows.allInnerTexts();
      // No row on page two was already on page one.
      expect(second.filter((row) => first.includes(row))).toEqual([]);

      await advanceTo("2026-09-01");
      await expect(rows).toHaveCount(2);
      const third = await rows.allInnerTexts();
      expect(third.filter((row) => [...first, ...second].includes(row))).toEqual([]);
      // And nothing was missed: five, five and two is every award seeded.
      expect(first.length + second.length + third.length).toBe(12);
      /*
       * And that is the end. Asserted only after the rows above it have been
       * WAITED FOR: `toHaveCount(0)` passes the instant it is asked, so it
       * cannot tell "nothing more is offered" from "I asked too early" unless
       * something that IS on the page has already arrived.
       */
      await expect(page.getByTestId("my-xp-more")).toHaveCount(0);
    } finally {
      await clearLedger(seeded);
    }
  });

  test("an empty ledger shows its headings and the way to earn something", async ({
    browser,
    baseURL,
  }) => {
    /*
     * John's rule: "empty tables are fine! show the table. Show nothing has been
     * played yet… and that's a change to have a link saying - be the first to
     * play!" Every member on the site has an empty ledger today, so this is the
     * state the tab is in for almost everybody who opens it.
     */
    const email = `${STAMP}-new@example.test`;
    const context = await memberContext(browser, baseURL ?? "", {
      email,
      name: `New ${STAMP.slice(-4)}`,
    });
    const page = await context.newPage();
    try {
      await page.goto("/me");
      await page.getByTestId("tab").filter({ hasText: "XP" }).click();

      // The table, with its headings, and not a hidden panel.
      await expect(page.getByTestId("my-xp-ledger")).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Earned" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "About" })).toBeVisible();
      /*
       * The level-1 standing is still a standing, and it is shown — by the
       * catalogue's name for the bottom rung, pinned as a literal because a
       * member with nought XP is always on it. "Insert Coin" rather than
       * `xpLevelName(1)`, so a catalogue edit that renamed the rung every new
       * member meets has to be looked at rather than absorbed.
       */
      await expect(page.getByTestId("my-xp-level")).toHaveText("Insert Coin");
      // And the way in, as a link.
      await expect(page.getByTestId("my-xp-empty").getByRole("link")).toHaveAttribute(
        "href",
        "/games",
      );
      // Not an apology: no row of awards, having waited for the table itself.
      await expect(page.getByTestId("my-xp-award")).toHaveCount(0);
    } finally {
      await context.close();
      await prisma.member.deleteMany({ where: { email } });
    }
  });

  test("a sort this list does not have is refused by name, not answered", async ({
    browser,
    baseURL,
  }) => {
    // Answering with the default order would tell a reader their sort worked.
    const email = `${STAMP}-sort@example.test`;
    const context = await memberContext(browser, baseURL ?? "", {
      email,
      name: `Sorter ${STAMP.slice(-4)}`,
    });
    const page = await context.newPage();
    try {
      await page.goto("/me?view=xp&sort=points");
      await expect(page.getByTestId("my-xp-refused")).toContainText("points");
      // The standing above it is still true, so it is still shown.
      await expect(page.getByTestId("my-xp-standing")).toBeVisible();
      // And the way back to a list that works is offered.
      await expect(page.getByTestId("my-xp-refused").getByRole("link")).toHaveAttribute(
        "href",
        "/me?view=xp",
      );
    } finally {
      await context.close();
      await prisma.member.deleteMany({ where: { email } });
    }
  });
});
