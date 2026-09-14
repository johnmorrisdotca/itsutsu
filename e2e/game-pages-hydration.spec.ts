import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { removeMember, seedMember } from "./members";
import { ADMIN_STATE, ready, watchForCrashes } from "./support";
import { namesPlayedUnder } from "./tidy";

/**
 * A GAME'S PAGES MUST NOT DISAGREE WITH THEMSELVES FOR A READER ELSEWHERE.
 *
 * Every moment a game page prints — when a move was made, when the game
 * started, when a clock runs out, when an opponent is back — used to be
 * formatted with `toLocaleString()` and no locale or zone, during the render
 * of a component the server draws first. The server answered in its own zone
 * and language, the browser in the reader's, and React threw the server's
 * markup away and redrew it: a mismatch, logged on every load, reported by
 * nothing.
 *
 * NOBODY HAD SEEN IT because the machine the site is developed on runs the
 * server and the browser in the same zone and the same language, which is
 * the one arrangement where the two answers agree. So every context here is
 * deliberately somewhere else: the server this suite runs against is expected
 * to be in UTC (production is), and each reader is not — one in Tokyo reading
 * Japanese, which differs in both, and one in Vancouver reading English, which
 * differs in the zone alone. A reader who only differs in zone is the owner.
 *
 * A FRESH DOCUMENT PER PAGE, as `profile.spec.ts` does for `/me`, because the
 * subject is the markup the server sends, and a client-side navigation renders
 * none. Each game is this spec's own — see AGENTS.md, "A Spec Should Bring Its
 * Own World" — and each check waits for the page's ready marker before reading
 * the log: a mismatch is reported when React hydrates, so a log read before
 * then says nothing.
 */

const READERS = [
  { where: "Tokyo, reading Japanese", locale: "ja-JP", timezoneId: "Asia/Tokyo" },
  { where: "Vancouver, reading English", locale: "en-US", timezoneId: "America/Vancouver" },
] as const;

type Reader = (typeof READERS)[number];
type Made = { id: string; blackToken: string; whiteToken: string };

/**
 * The names this file's games are played under, which outlive the games: most
 * of them are resigned, and a rated result writes a `Player` row keyed by each
 * seat's name. See `namesPlayedUnder`.
 */
const under = namesPlayedUnder();

async function makeGame(request: APIRequestContext, data: Record<string, unknown>): Promise<Made> {
  const made = await request.post("/api/games/live", { data: { size: 9, ...data } });
  expect(made.status(), await made.text()).toBe(201);
  return (await made.json()) as Made;
}

/** A game with a stone on the board, then given up: a filed game with times to print. */
async function finishedGame(request: APIRequestContext, names: { blackName: string; whiteName: string }) {
  const game = await makeGame(request, names);
  const played = await request.post(`/api/games/${game.id}/moves`, {
    data: { token: game.blackToken, row: 4, col: 4 },
  });
  expect(played.status(), await played.text()).toBe(201);
  const resigned = await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
  expect(resigned.status(), await resigned.text()).toBe(200);
  return game;
}

/** A browser somewhere other than the server, signed in as the suite's operator or as nobody. */
function readerContext(browser: Browser, reader: Reader, signedIn: boolean): Promise<BrowserContext> {
  return browser.newContext({
    storageState: signedIn ? ADMIN_STATE : { cookies: [], origins: [] },
    locale: reader.locale,
    timezoneId: reader.timezoneId,
  });
}

/**
 * Loads an address as a fresh document and says whether it hydrated cleanly.
 *
 * The watcher goes on before the navigation, since one attached after it can
 * miss the message. The round trip at the end is there because console events
 * reach this process asynchronously: anything the page logged before answering
 * it has been delivered by the time it answers.
 */
async function hydratesCleanly(
  context: BrowserContext,
  address: string,
  marker: string,
  what: string,
  presentFirst?: (page: Page) => Promise<void>,
): Promise<Page> {
  const page = await context.newPage();
  const crashes = watchForCrashes(page);
  await page.goto(address);
  await ready(page, marker);
  if (presentFirst !== undefined) await presentFirst(page);
  await expect(page.locator('[data-ready="false"]'), `something on ${what} never hydrated`).toHaveCount(0);
  await page.evaluate(() => document.readyState);
  expect(crashes, `${what} was drawn one way by the server and another by the browser`).toEqual([]);
  return page;
}

/*
 * One describe per reader rather than a loop inside each test, so a page that
 * disagrees for Tokyo does not stop the same page being asked about Vancouver:
 * the two readers differ in different ways, and each answer is its own.
 */
for (const reader of READERS) {
  test.describe(`a game's pages hydrate the same for a reader in ${reader.where}`, () => {
    test("a live match on a clock", async ({ browser, request }) => {
      const stamp = Date.now().toString(36);
      /*
       * Five minutes a move, so the countdown is in seconds: the server's
       * "4m 59s" and the browser's a second or two later are different text,
       * which a day-long clock would only show at a minute boundary.
       */
      const game = await makeGame(request, {
        blackName: under(`Clock ${stamp}`),
        whiteName: under(`Hand ${stamp}`),
        moveTimeMs: 5 * 60_000,
      });
      const context = await readerContext(browser, reader, true);
      try {
        const page = await hydratesCleanly(
          context,
          `/games/gomoku/match/${game.id}/seat/${game.blackToken}`,
          "shared-game",
          `a clocked match for a reader in ${reader.where}`,
          async (at) => {
            await expect(at.getByTestId("deadline")).toBeVisible();
            await expect(at.getByTestId("shared-times-line")).toBeAttached();
          },
        );
        // And once the browser has it, the countdown is counting.
        await expect(page.getByTestId("deadline-remaining")).toHaveText(/^\d+m \d{2}s$/);
      } finally {
        await context.close();
        await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
      }
    });

    test("a live match against somebody who is away", async ({ browser, request }) => {
      const stamp = Date.now().toString(36);
      const away = { email: `away-${stamp}@example.test`, name: `Away ${stamp}` };
      await seedMember(away);
      const prisma = new PrismaClient();
      const game = await makeGame(request, { blackName: under(`Stay ${stamp}`), whiteName: under(away.name) });
      const context = await readerContext(browser, reader, true);
      try {
        /*
         * Back at three in the morning UTC, three days from now: a moment
         * that is a different calendar day in Vancouver than in UTC, so even a
         * reader whose language the server happens to share is shown a
         * different date by a server that formats it in its own zone.
         */
        const clock = new Date();
        const back = new Date(
          Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate() + 3, 3),
        );
        const row = await prisma.member.update({
          where: { email: away.email },
          data: { awayFrom: new Date(clock.getTime() - 3_600_000), awayUntil: back },
        });
        // Planted rather than claimed: the seat's holder is the fixture here, not the subject.
        await prisma.game.update({ where: { id: game.id }, data: { whiteMemberId: row.id } });
        await hydratesCleanly(
          context,
          `/games/gomoku/match/${game.id}/seat/${game.blackToken}`,
          "shared-game",
          `a match against an away player for a reader in ${reader.where}`,
          (at) => expect(at.getByTestId("opponent-line")).toContainText("Away until"),
        );
      } finally {
        await context.close();
        await request.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } });
        await prisma.$disconnect();
        await removeMember(away.email);
      }
    });

    test("a finished game's replay, at its end and at its start", async ({ browser, request }) => {
      const stamp = Date.now().toString(36);
      const game = await finishedGame(request, { blackName: under(`Filed ${stamp}`), whiteName: under(`Kept ${stamp}`) });
      const context = await readerContext(browser, reader, true);
      try {
        const end = await hydratesCleanly(
          context,
          `/games/gomoku/match/${game.id}`,
          "game-replay",
          `a finished game at its last move for a reader in ${reader.where}`,
          (at) => expect(at.getByTestId("move-made-at")).toContainText("ended"),
        );
        /*
         * Agreeing is not enough: a page that printed UTC for ever would agree
         * too. Once the browser has it, the moment is in the reader's own
         * zone, in the site's language — which only the browser can work out,
         * so the expectation is asked of the browser.
         */
        const when = end.getByTestId("move-made-at").locator("time");
        const at = await when.getAttribute("datetime");
        expect(at, "the moment a move was made is not carried as a datetime").not.toBeNull();
        const theirs = await end.evaluate(
          (iso) =>
            new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(iso),
            ),
          at!,
        );
        await expect(when).toHaveText(theirs);

        await hydratesCleanly(
          context,
          `/games/gomoku/match/${game.id}/0`,
          "game-replay",
          `a finished game at move 0 for a reader in ${reader.where}`,
          (page) => expect(page.getByTestId("replay-started-at")).toContainText("started"),
        );
      } finally {
        await context.close();
      }
    });

    test("the record of games", async ({ browser, request }) => {
      const stamp = Date.now().toString(36);
      await finishedGame(request, { blackName: under(`Listed ${stamp}`), whiteName: under(`Rowed ${stamp}`) });
      const context = await readerContext(browser, reader, true);
      try {
        /*
         * A finished game reaches the record a moment after it ends, and a
         * page loaded before then has no row whose time could disagree — which
         * would be a green over nothing. So each try is a whole fresh
         * document, and only the one that shows the row counts.
         */
        await expect(async () => {
          const page = await hydratesCleanly(
            context,
            `/history?search=${stamp}`,
            "live-record",
            `the record for a reader in ${reader.where}`,
            (at) => expect(at.getByTestId("history-list").getByRole("listitem")).toHaveCount(1, { timeout: 2_000 }),
          );
          await page.close();
        }).toPass({ timeout: 30_000 });
      } finally {
        await context.close();
      }
    });

    test("an embed with its live figures", async ({ browser, request }) => {
      const minted = await request.post("/api/embed-tokens", {
        data: { label: "playwright-hydration", scope: "data" },
      });
      expect(minted.status()).toBe(201);
      const { token } = (await minted.json()) as { token: string };
      // Nobody signed in: the position a third-party iframe is in.
      const context = await readerContext(browser, reader, false);
      try {
        await hydratesCleanly(
          context,
          `/embed?token=${token}&stats=1`,
          "embed-board",
          `an embed for a reader in ${reader.where}`,
          (at) => expect(at.getByTestId("embed-stats")).toBeVisible(),
        );
      } finally {
        await context.close();
      }
    });
  });
}
