import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * A TENKA GAME KEPT BEFORE THE MAPS CHANGED (Tenka 2.0.0, 2026-10-02) IS
 * REFUSED CLEANLY, in all three places the site holds one: this browser's own
 * game, a game filed from a device (History), and a table on several devices.
 *
 * Each is text the rules can no longer play out, because the territories it
 * names are not the ones dealt now. None may crash, show a blank board, or be
 * offered as a game to carry on with; each says what happened in plain words,
 * and the record (who sat where, how it stood) stays true.
 *
 * The spec brings its own world: a member, the rows it writes straight into
 * the database to stand in for what an earlier version stored (nothing in the
 * site can write that text any more), and takes all of it away afterwards.
 */

process.loadEnvFile(".env");

const prisma = new PrismaClient();
const stamp = Date.now().toString(36);
const member = { email: `tenka-old-${stamp}@example.test`, name: `Rin-${stamp}` };
const KEPT = "itsutsu.tenka";
const TABLE = `old-${stamp.slice(-4).padStart(4, "0")}`;
const DEVICE = `dev-${stamp.slice(-4).padStart(4, "0")}`;
const made: string[] = [];

/** What 1.x wrote for a game of three, a move in. */
const OLD = JSON.stringify({ v: 1, seed: 20260930, players: ["Rin", "Ben", "Cy"], rounds: 60, placing: "auto", moves: [["p", 3, 2]] });

test.afterAll(async () => {
  await removeTables(made);
  await removeMember(member.email);
  await prisma.$disconnect();
});

test("a game kept in this browser by the old rules says so on the set-up, is not listed on My games, and a new game starts clean", async ({ browser, baseURL }) => {
  const context = await memberContext(browser, baseURL!, member);
  const page = await context.newPage();
  await page.goto("/games/tenka");
  await page.evaluate(([key, text, record]) => {
    window.localStorage.setItem(key, text);
    // The record of that game, as the store files it, still going.
    window.localStorage.setItem(`${key}:record`, record);
  }, [KEPT, OLD, JSON.stringify({ id: "old-record-id", over: false })]);

  // The table: the set-up, and why, never a blank board.
  await page.goto("/games/tenka/pass-and-play");
  await ready(page, "tenka-set-up");
  await expect(page.getByTestId("tenka-old-save")).toContainText("cannot be continued");
  await expect(page.getByTestId("tenka-set-up")).toBeVisible();

  // Not a game to carry on with: no card on My games, and the front door says Play.
  await page.goto("/play/pass-and-play");
  await expect(page.locator('[data-testid="party-game"][data-variant="tenka"]')).toHaveCount(0);
  await page.goto("/games/tenka");
  await ready(page, "party-kind-offer");
  await expect(page.getByTestId("game-set-up")).toHaveText("Play →");

  // A new game starts, and the notice goes with the old one.
  await page.goto("/games/tenka/pass-and-play");
  await ready(page, "tenka-set-up");
  await page.getByTestId("tenka-start").click();
  await ready(page, "tenka-game");
  await expect(page.getByTestId("tenka-territory")).toHaveCount(42);
  await expect(page.getByTestId("tenka-old-save")).toHaveCount(0);
  // And it is filed as a game of its own, not over the old one's record.
  const slot = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(`${key}:record`) ?? "null") as { id: string } | null, KEPT);
  expect(slot?.id).toBeTruthy();
  expect(slot?.id).not.toBe("old-record-id");
  await context.close();
});

test("a game filed from a device by the old rules is shown ended in History, as it stood, with nothing to carry on; a finished one keeps its result", async ({ browser, baseURL }) => {
  const context = await memberContext(browser, baseURL!, member);
  const page = await context.newPage();
  const me = await memberIdFor(member.email);
  const finished = `${DEVICE}-f`;
  const going = `${DEVICE}-g`;
  made.push(finished, going);
  const seats = {
    create: [
      { seat: 0, kind: "member", memberId: me, name: member.name },
      { seat: 1, kind: "guest", name: "Ben" },
      { seat: 2, kind: "guest", name: "Cy" },
    ],
  };
  await prisma.partyTable.create({ data: { id: going, game: "tenka", state: OLD, status: "keptPlaying", hostMemberId: me, seats } });
  await prisma.partyTable.create({ data: { id: finished, game: "tenka", state: OLD, status: "keptFinished", winners: [1], hostMemberId: me, finishedAt: new Date(), seats } });

  // The going one: said to be left, the record kept, no button that would fail.
  await page.goto(`/games/tenka/kept/${going}`);
  await expect(page.getByTestId("kept-game")).toHaveAttribute("data-state", "left");
  await expect(page.getByTestId("kept-seats")).toContainText("Ben");
  await expect(page.getByText("has since changed")).toBeVisible();
  await expect(page.getByTestId("kept-open")).toHaveCount(0);

  // The finished one: its result stands (Ben won), and it is not offered back either.
  await page.goto(`/games/tenka/kept/${finished}`);
  await expect(page.getByTestId("kept-game")).toHaveAttribute("data-state", "lost");
  await expect(page.getByTestId("kept-open")).toHaveCount(0);
  await expect(page.getByTestId("kept-back")).toBeVisible();

  // History: the going one reads as left unfinished, the finished one keeps its result.
  await page.goto("/play/history");
  const entry = (id: string) => page.getByTestId("history-entry").filter({ has: page.locator(`a[href$="/kept/${id}"]`) });
  await expect(entry(going)).toHaveAttribute("data-state", "left");
  await expect(entry(finished)).toHaveAttribute("data-state", "lost");
  await context.close();
});

test("a table on several devices started by the old rules says so, is not a move waiting on anybody, and refuses a move with words", async ({ browser, baseURL }) => {
  const context = await memberContext(browser, baseURL!, member);
  const page = await context.newPage();
  const me = await memberIdFor(member.email);
  made.push(TABLE);
  await prisma.partyTable.create({
    data: {
      id: TABLE,
      game: "tenka",
      size: 60,
      state: OLD,
      status: "playing",
      toPlay: 0,
      moveCount: 1,
      hostMemberId: me,
      seats: {
        create: [
          { seat: 0, kind: "member", memberId: me, name: member.name },
          { seat: 1, kind: "computer", name: "Computer" },
        ],
      },
    },
  });

  // The table page: the seats and the way out, and why there is no board.
  await page.goto(`/games/tenka/tables/${TABLE}`);
  await ready(page, "online-table");
  await expect(page.getByTestId("online-retired")).toContainText("has since changed");
  await expect(page.getByTestId("tenka-game")).toHaveCount(0);
  await expect(page.getByTestId("online-end")).toBeVisible();

  // My games: listed, but not as a move waiting on the reader.
  await page.goto("/play");
  const row = page.locator(`[data-testid="my-table"][data-table="${TABLE}"]`);
  await expect(row).toHaveCount(1);
  await expect(row).not.toHaveAttribute("data-your-move", "true");
  await expect(row.getByTestId("my-table-state")).toContainText("older version");

  // History: it ended with the old rules.
  await page.goto("/play/history");
  await expect(page.getByTestId("history-entry").filter({ has: page.locator(`a[href$="/tables/${TABLE}"]`) })).toHaveAttribute("data-state", "ended");

  // A move is refused in words, not with a server error.
  const answer = await context.request.post(`/api/tables/${TABLE}/moves`, { data: { moves: 1, seat: 0, move: [["e"]] } });
  expect(answer.status()).toBe(409);
  expect(JSON.stringify(await answer.json())).toContain("has since changed");

  // And it can be ended, which is all anybody can do with it.
  await page.goto(`/games/tenka/tables/${TABLE}`);
  await ready(page, "online-table");
  await page.getByTestId("online-end").click();
  await page.getByTestId("online-confirm-yes").click();
  await expect(page.getByTestId("online-status")).toContainText("ended this table");
  await context.close();
});
