import { expect, test, type BrowserContext, type Page, type Response } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import { gunjinMoves, playGunjin, startGunjin } from "../src/lib/party/gunjin/gunjin";
import { flagWithinReach } from "../src/lib/party/gunjin/gunjinFlag";
import { encodeGunjin } from "../src/lib/party/gunjin/gunjinCodec";
import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * GUNJIN ON TWO DEVICES: a table the server keeps, each player on their own
 * phone. What this is about is the one thing no other table here has to do —
 * the server holds BOTH sides' secret arrangements and must never send a seat
 * the other's. So it reads what each phone is actually sent: every answer from
 * the table's own address, and the page the server rendered, and checks that
 * the other side's ranks, ids and arrangement are in none of them, while the
 * game still plays: both arrange, each in turn, and a move on one phone is
 * seen, as a piece with no rank, on the other.
 *
 * A move is also sent by hand from the guest's own browser, the way a cheat
 * would: a hand-over it is not allowed to make, a piece that is not theirs,
 * another seat's turn.
 */
const AT = "/games/gunjin";
const PHONE = { width: 390, height: 844 };

type Seen = { url: string; body: string };

/** Every body the server sends this page from the table's address, read as it arrives. */
function listen(page: Page, seen: Seen[]) {
  page.on("response", (response: Response) => {
    const url = response.url();
    if (!/\/api\/tables\/[a-z0-9-]+$/.test(url) && !/\/api\/tables\/[a-z0-9-]+\/moves$/.test(url)) return;
    void response.text().then((body) => seen.push({ url, body }), () => undefined);
  });
}

test.describe("Gunjin on several devices", () => {
  const stamp = Date.now().toString(36);
  const host = { email: `gunjin-host-${stamp}@example.test`, name: `Ada-${stamp}` };
  const guest = { email: `gunjin-guest-${stamp}@example.test`, name: `Bo-${stamp}` };
  const made: string[] = [];

  test.afterAll(async () => {
    await removeTables(made);
    for (const member of [host, guest]) await removeMember(member.email);
  });

  async function phone(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }): Promise<{ context: BrowserContext; page: Page }> {
    const context = await memberContext(browser, baseURL, member, { viewport: PHONE });
    return { context, page: await context.newPage() };
  }

  test("each side arranges on its own phone, and the server sends neither the other's ranks", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const guestId = await memberIdFor(guest.email);
    expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);
    const toGuest: Seen[] = [];
    const toHost: Seen[] = [];
    listen(b.page, toGuest);
    listen(a.page, toHost);

    // The host sets up a table for two devices with the guest in the second seat.
    await a.page.goto(`${AT}/pass-and-play`);
    await ready(a.page, "gunjin-set-up");
    await a.page.getByTestId("online-where-several").click();
    await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
    await a.page.getByTestId("gunjin-start").click();
    await expect(a.page).toHaveURL(/\/games\/gunjin\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
    const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
    made.push(id);
    await ready(a.page, "online-table");

    // Seat 0 arranges first; the guest, who has not, is told they are waiting and sees an empty board.
    await b.page.goto(`${AT}/tables/${id}`);
    await ready(b.page, "online-table");
    await expect(a.page.getByTestId("gunjin-arrange")).toHaveAttribute("data-seat", "0");
    await expect(a.page.getByTestId("gunjin-arrange-board-drawing").locator('[data-owner="0"][data-kind]')).toHaveCount(31);
    await expect(b.page.getByTestId("gunjin-waiting-note")).toContainText("is arranging");
    await expect(b.page.getByTestId("gunjin-waiting-board-drawing").locator("[data-kind]")).toHaveCount(0);
    await a.page.getByTestId("gunjin-finish").click();

    // The host's arrangement is placed and hidden from the guest, whose turn it now is.
    await expect(b.page.getByTestId("gunjin-arrange")).toHaveAttribute("data-seat", "1", { timeout: 30_000 });
    await expect(b.page.getByTestId("gunjin-arrange-board-drawing").locator('[data-owner="1"][data-kind]')).toHaveCount(31);
    await expect(b.page.getByTestId("gunjin-arrange-board-drawing").locator('[data-owner="0"]')).toHaveCount(0);
    await expect(a.page.getByTestId("gunjin-waiting-note")).toContainText("is arranging");
    // The host, waiting, sees their own arrangement drawn as the draft and none of the guest's.
    await expect(a.page.getByTestId("gunjin-waiting-board-drawing").locator('[data-owner="0"][data-kind]')).toHaveCount(31);
    await b.page.getByTestId("gunjin-finish").click();

    // Both arranged: the board opens on the host's move. Each sees their own ranks and the other side as backs.
    await expect(a.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "true", { timeout: 30_000 });
    await expect(b.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "false", { timeout: 30_000 });
    const ownA = a.page.getByTestId("gunjin-board-drawing");
    const ownB = b.page.getByTestId("gunjin-board-drawing");
    await expect(ownA.locator('[data-owner="0"][data-kind]')).toHaveCount(31);
    await expect(ownA.locator('[data-owner="1"][data-hidden="true"]')).toHaveCount(31);
    await expect(ownA.locator('[data-owner="1"][data-kind]')).toHaveCount(0);
    await expect(ownB.locator('[data-owner="1"][data-kind]')).toHaveCount(31);
    await expect(ownB.locator('[data-owner="0"][data-hidden="true"]')).toHaveCount(31);
    await expect(ownB.locator('[data-owner="0"][data-kind]')).toHaveCount(0);

    // A move on the host's phone, and the guest sees where it went.
    let moved = false;
    for (let x = 0; x < 9 && !moved; x += 1) {
      // Not an aircraft: it may attack any square, and its first square could hold the flag, which ends the game.
      if (((await a.page.getByTestId("gunjin-board").locator(`[data-square="${x},5"]`).getAttribute("aria-label")) ?? "").endsWith(", Aircraft")) continue;
      await a.page.getByTestId("gunjin-board").locator(`[data-square="${x},5"]`).click();
      const lit = (await a.page.getByTestId("gunjin-board").getAttribute("data-targets")) ?? "";
      if (lit !== "") {
        const [tx, ty] = lit.split(" ")[0]!.split(",");
        await a.page.getByTestId("gunjin-board").locator(`[data-square="${tx},${ty}"]`).click();
        moved = true;
      }
    }
    expect(moved).toBe(true);
    await expect(b.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "true", { timeout: 30_000 });
    await expect(b.page.getByTestId("gunjin-board").locator('[data-last="true"]')).toHaveCount(2);
    await expect(b.page.getByTestId("gunjin-hint")).toContainText("Choose one of your pieces");

    // WHAT EACH PHONE WAS SENT. The stored game is both sides' secrets; every answer to the guest has the host's pieces as
    // pieces with no rank, no id and no arrangement, and the same the other way round.
    await b.page.reload();
    await ready(b.page, "online-table");
    const sentTo = async (seen: Seen[], page: Page, other: 0 | 1) => {
      const html = await page.content();
      const bodies = [...seen.map((one) => one.body), html];
      let checked = 0;
      let withPieces = 0;
      for (const body of seen.map((one) => one.body)) {
        const view = JSON.parse(body) as { state?: string };
        if (view.state === undefined || view.state === "") continue;
        const kept = JSON.parse(view.state) as { seen?: number; match: { pieces: { owner: number; kind: string; id: string }[]; privateSetups: unknown[][] } };
        expect(kept.seen, "the text made for this seat, not the stored game").toBe(other === 0 ? 1 : 0);
        const theirs = kept.match.pieces.filter((piece) => piece.owner === other);
        withPieces += theirs.length > 0 ? 1 : 0;
        for (const piece of theirs) {
          expect(piece.kind).toBe("hidden");
          expect(piece.id).toMatch(/^hidden:/);
        }
        expect(kept.match.privateSetups[other], "the other side's arrangement is not sent").toEqual([]);
        checked += 1;
      }
      expect(checked, "at least one table answer was read").toBeGreaterThan(0);
      expect(withPieces, "and at least one had the other side's pieces in it, to be looked at").toBeGreaterThan(0);
      // And nowhere in any answer, or in the page itself, is a piece of the other side named by the engine's id.
      for (const body of bodies) expect(body).not.toContain(`gunjin-shogi:${other}:`);
    };
    await sentTo(toGuest, b.page, 0);
    await sentTo(toHost, a.page, 1);

    // Cheats, sent by hand from the guest's browser: the device handed on, a piece that is not theirs, another seat.
    const post = (move: unknown, seat = 1, moves?: number) => b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: moves ?? 0, seat, move } });
    const table = (await (await b.context.request.get(`/api/tables/${id}`)).json()) as { moveCount: number };
    expect((await post({ kind: "hand" }, 1, table.moveCount)).status(), "a hand-over is not a move a browser sends").toBe(400);
    expect((await post({ kind: "move", from: { x: 4, y: 8 }, to: { x: 4, y: 7 } }, 1, table.moveCount)).status(), "a square holding the other side's piece, not theirs").toBe(422);
    expect((await post({ kind: "move", from: { x: 0, y: 5 }, to: { x: 0, y: 4 } }, 0, table.moveCount)).status(), "another seat's move").toBe(403);

    const wide = await a.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
    await a.context.close();
    await b.context.close();
  });

  test("taking the flag ends the table with the capturer the winner, on both phones", async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    process.loadEnvFile(".env");
    const prisma = new PrismaClient();
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const [hostId, guestId] = [await memberIdFor(host.email), await memberIdFor(guest.email)];
    const { game, from, flag } = flagWithinReach();
    const id = `flg-${stamp.slice(-4).padStart(4, "0")}`;
    made.push(id);
    try {
      // A table written straight to the database at the move before the flag is taken (nothing in the site can arrange where a flag stands).
      await prisma.partyTable.create({
        data: {
          id,
          game: "gunjin",
          size: 81,
          state: encodeGunjin(game),
          status: "playing",
          toPlay: 0,
          moveCount: game.moves.length,
          hostMemberId: hostId,
          seats: {
            create: [
              { seat: 0, kind: "member", memberId: hostId, name: host.name },
              { seat: 1, kind: "member", memberId: guestId, name: guest.name },
            ],
          },
        },
      });
      await a.page.goto(`${AT}/tables/${id}`);
      await b.page.goto(`${AT}/tables/${id}`);
      await ready(a.page, "online-table");
      await ready(b.page, "online-table");
      await expect(a.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "true");
      await a.page.getByTestId("gunjin-board").locator(`[data-square="${from.x},${from.y}"]`).click();
      await a.page.getByTestId("gunjin-board").locator(`[data-square="${flag.x},${flag.y}"]`).click();
      for (const page of [a.page, b.page]) {
        await expect(page.getByTestId("online-table")).toHaveAttribute("data-state", "finished", { timeout: 30_000 });
        await expect(page.getByTestId("win-cover")).toContainText(page === a.page ? "You" : host.name.split("-")[0]!);
        await page.getByTestId("win-cover-see-board").click();
        // Nothing is hidden once it is over: both sides' ranks are on both phones.
        await expect(page.getByTestId("gunjin-board-drawing").locator("[data-hidden='true']")).toHaveCount(0);
      }
    } finally {
      await prisma.$disconnect();
      await a.context.close();
      await b.context.close();
    }
  });
  /** A table written straight to the database with both sides arranged and the first move to the host: what the presses under test start from. */
  async function arrangedTable(prisma: PrismaClient, id: string) {
    let game = startGunjin(81, ["", ""])!;
    for (let step = 0; step < 4; step += 1) game = playGunjin(game, gunjinMoves(game)[0]!)!;
    const [hostId, guestId] = [await memberIdFor(host.email), await memberIdFor(guest.email)];
    await prisma.partyTable.create({
      data: {
        id,
        game: "gunjin",
        size: 81,
        state: encodeGunjin(game),
        status: "playing",
        toPlay: 0,
        moveCount: game.moves.length,
        hostMemberId: hostId,
        seats: {
          create: [
            { seat: 0, kind: "member", memberId: hostId, name: host.name },
            { seat: 1, kind: "member", memberId: guestId, name: guest.name },
          ],
        },
      },
    });
  }

  test("a draw is offered, declined, offered back and agreed, and a resignation gives the table away, on both phones", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    process.loadEnvFile(".env");
    const prisma = new PrismaClient();
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const drawId = `drw-${stamp.slice(-4).padStart(4, "0")}`;
    const resignId = `rsn-${stamp.slice(-4).padStart(4, "0")}`;
    made.push(drawId, resignId);
    try {
      await arrangedTable(prisma, drawId);
      await arrangedTable(prisma, resignId);
      await a.page.goto(`${AT}/tables/${drawId}`);
      await b.page.goto(`${AT}/tables/${drawId}`);
      await ready(a.page, "online-table");
      await ready(b.page, "online-table");
      await expect(a.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "true");

      // Only the seat to move has the presses; the other, who waits, has none.
      await expect(a.page.getByTestId("gunjin-draw-offer")).toBeVisible();
      await expect(a.page.getByTestId("gunjin-resign")).toBeVisible();
      await expect(b.page.getByTestId("gunjin-draw-offer")).toHaveCount(0);
      await expect(b.page.getByTestId("gunjin-resign")).toHaveCount(0);

      // The host offers: asked first, and then the guest is asked on the guest's own phone while the host is told it waits.
      await a.page.getByTestId("gunjin-draw-offer").click();
      await a.page.getByTestId("gunjin-draw-offer-yes").click();
      await expect(a.page.getByTestId("gunjin-draw-waiting")).toContainText(guest.name.split("-")[0]!);
      await expect(a.page.getByTestId("gunjin-draw-offer")).toHaveCount(0);
      await expect(b.page.getByTestId("gunjin-draw-answer")).toBeVisible({ timeout: 30_000 });
      await expect(b.page.getByTestId("gunjin-draw-offer")).toHaveCount(0);

      // The guest declines and goes on: the offer is gone from both phones, and it is the guest's move.
      await b.page.getByTestId("gunjin-draw-decline").click();
      await expect(b.page.getByTestId("gunjin-draw-answer")).toHaveCount(0);
      await expect(b.page.getByTestId("gunjin-moving")).toHaveAttribute("data-active", "true");
      await expect(a.page.getByTestId("gunjin-draw-waiting")).toHaveCount(0, { timeout: 30_000 });

      // The guest offers one back, and the host agrees: both phones show it drawn, with nobody the winner.
      await b.page.getByTestId("gunjin-draw-offer").click();
      await b.page.getByTestId("gunjin-draw-offer-yes").click();
      await expect(a.page.getByTestId("gunjin-draw-answer")).toBeVisible({ timeout: 30_000 });
      await a.page.getByTestId("gunjin-draw-accept").click();
      for (const page of [a.page, b.page]) {
        await expect(page.getByTestId("online-table")).toHaveAttribute("data-state", "finished", { timeout: 30_000 });
        await expect(page.getByTestId("gunjin-result")).toContainText("Drawn: a draw was agreed");
        await expect(page.getByTestId("gunjin-board-drawing").locator("[data-hidden='true']")).toHaveCount(0);
      }

      // A resignation, on another table: the seat to move gives up, and the other wins, said on both phones.
      await a.page.goto(`${AT}/tables/${resignId}`);
      await b.page.goto(`${AT}/tables/${resignId}`);
      await ready(a.page, "online-table");
      await ready(b.page, "online-table");
      await a.page.getByTestId("gunjin-resign").click();
      await a.page.getByTestId("gunjin-resign-yes").click();
      for (const page of [a.page, b.page]) {
        await expect(page.getByTestId("online-table")).toHaveAttribute("data-state", "finished", { timeout: 30_000 });
        await expect(page.getByTestId("gunjin-result")).toContainText(`${host.name} resigned. ${guest.name} wins.`);
      }
      await expect(b.page.getByTestId("win-cover")).toContainText("You");

      // The sideways check, at 390px, on the table with the offer panels' words in it.
      const wide = await a.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
    } finally {
      await prisma.$disconnect();
      await a.context.close();
      await b.context.close();
    }
  });
});
