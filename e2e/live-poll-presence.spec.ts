import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { memberContext, removeMember, removeMemberById } from "./members";
import { playAt, ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * TWO PEOPLE AT TWO PHONES, AND THE MOVE ARRIVING QUICKLY.
 *
 * John, 2026-09-26, playing a friend phone to phone: "Waiting 15 seconds is too
 * long." So a board asks every three seconds while the player it waits on has
 * been on the site in the last two minutes, and every fifteen otherwise
 * (`POLL_FAST_MS`, `PRESENT_WITHIN_MS`). The choice between them is held by
 * `pollCadence.test.ts`; this holds that it is REACHED — that presence travels
 * from a real page load, through the game's version, to the other board.
 *
 * TWO IDENTITIES, neither the operator: black is a member made for this file,
 * white is a browser that redeemed an invite the operator minted here, which
 * is how somebody handed a code arrives. Never a copy of one state: a "two
 * player" case over one account is one person.
 *
 * UNDER THE SUITE'S RELIEF BOTH CADENCES ARE THE FLOOR (two and a half
 * seconds), so the time a move takes to arrive cannot show which cadence the
 * board chose. The board says which, on `data-poll-hurrying`, and that is what
 * is asserted beside the timing — which is still asserted, because the time a
 * person waits is the point.
 *
 * LEAVING IS MADE, NOT WAITED FOR. Two real minutes would be paid on every
 * deploy; the page is closed and the member's `lastSeenAt` is put back ten
 * minutes, which is the state the site would reach by itself. The way back is
 * a real page load.
 */

const tidyAway = gamesMade();
const under = namesPlayedUnder();
const SIZE = 9;
/** A move must reach the other board within this, at either cadence the suite runs at. */
const ARRIVES_WITHIN_MS = 5_000;

type Here = { black: boolean; white: boolean };

function database(): PrismaClient | null {
  if (process.env.DATABASE_URL === undefined) process.loadEnvFile(".env");
  return isLocalDatabase(process.env.DATABASE_URL) ? new PrismaClient() : null;
}

/** Waits for the board's own next ask to come back saying who is here, and returns what it said. */
async function nextAnswer(page: Page, gameId: string): Promise<Here> {
  const response = await page.waitForResponse(
    (answer) => answer.request().method() === "GET" && new URL(answer.url()).pathname === `/api/games/${gameId}` && answer.status() === 200,
  );
  return ((await response.json()) as { here: Here }).here;
}

/** Plays a stone on one board and times it onto the other. */
async function arrives(from: Page, to: Page, row: number, col: number, name: string): Promise<number> {
  await playAt(from, SIZE, row, col);
  const sent = Date.now();
  await expect(to.getByRole("button", { name })).toBeVisible({ timeout: ARRIVES_WITHIN_MS });
  return Date.now() - sent;
}

test("a move reaches the other player's board within seconds while both are on the site, and the board slows when one leaves", async ({
  browser,
  baseURL,
  request,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const kuro = { email: `presence-black-${stamp}@example.test`, name: under(`Kuro${stamp} Presence`) };
  const black = await memberContext(browser, baseURL!, kuro);

  // White: an invite, redeemed by a browser of its own, which makes it a member of its own.
  const minted = await request.post("/api/invites", { data: { note: "playwright presence" } });
  expect(minted.status(), await minted.text()).toBe(201);
  const { code } = (await minted.json()) as { code: string };
  const white = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const redeemed = await white.request.post("/api/session", { data: { kind: "invite", code } });
  expect(redeemed.ok(), `invite redemption answered ${redeemed.status()}`).toBe(true);

  let whiteMemberId: string | null = null;
  try {
    const made = await black.request.post("/api/games/live", {
      data: { variant: "freestyle", size: SIZE, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: under(`Shiro${stamp} Presence`) },
    });
    expect(made.status(), await made.text()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);

    const blackPage = await black.newPage();
    await blackPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await ready(blackPage, "shared-game");
    const whitePage = await white.newPage();
    await whitePage.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
    await ready(whitePage, "shared-game");

    // Both seats are held by members, and each has just loaded a page.
    const row = (await (await black.request.get(`/api/games/${game.id}`)).json()) as { blackMemberId: string | null; whiteMemberId: string | null; here: Here };
    expect(row.blackMemberId, "black's seat has no member").not.toBeNull();
    expect(row.whiteMemberId, "white's seat has no member").not.toBeNull();
    expect(row.whiteMemberId).not.toBe(row.blackMemberId);
    whiteMemberId = row.whiteMemberId;
    expect(row.here).toEqual({ black: true, white: true });

    // Black to move: white's board waits on somebody here and hurries; black's own does not.
    await expect(whitePage.getByTestId("shared-game")).toHaveAttribute("data-poll-hurrying", "true");
    await expect(blackPage.getByTestId("shared-game")).toHaveAttribute("data-poll-hurrying", "false");

    const toWhite = await arrives(blackPage, whitePage, 4, 4, "E5, Black stone");
    // And now black's board is the one waiting, on a player who is here.
    await expect(blackPage.getByTestId("shared-game")).toHaveAttribute("data-poll-hurrying", "true");
    const toBlack = await arrives(whitePage, blackPage, 3, 3, "D6, White stone");
    console.log(`[presence] a move reached the other board in ${toWhite} ms and ${toBlack} ms`);

    /*
     * WHITE LEAVES: the page is shut, and the site's record of white is ten
     * minutes old. Black moves, so black's board is waiting on white — and the
     * next answer it gets must say white is not here, whereupon it slows.
     */
    await whitePage.close();
    const prisma = database();
    test.skip(prisma === null, "Not a database on this machine, so the spec will not write a member's last-seen time.");
    try {
      await prisma!.member.update({ where: { id: whiteMemberId! }, data: { lastSeenAt: new Date(Date.now() - 10 * 60_000) } });
    } finally {
      await prisma!.$disconnect();
    }
    const said = nextAnswer(blackPage, game.id);
    await playAt(blackPage, SIZE, 5, 5);
    expect(await said).toEqual({ black: true, white: false });
    await expect(blackPage.getByTestId("shared-game")).toHaveAttribute("data-poll-hurrying", "false");

    // THE WAY BACK: white loads a page, and black's board hurries again.
    const back = await white.newPage();
    await back.goto(`/games/gomoku/match/${game.id}`);
    await expect.poll(() => nextAnswer(blackPage, game.id)).toEqual({ black: true, white: true });
    await expect(blackPage.getByTestId("shared-game")).toHaveAttribute("data-poll-hurrying", "true");
  } finally {
    await black.close();
    await white.close();
    await removeMember(kuro.email);
    if (whiteMemberId !== null) await removeMemberById(whiteMemberId);
  }
});
