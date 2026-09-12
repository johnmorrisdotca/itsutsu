import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember } from "./members";
import { playAt, ready } from "./support";

/**
 * A GAME PROPOSED TO A PERSON IS AN OFFER UNTIL THEY ACCEPT IT.
 *
 * John, about a game forked out of a position — "PLAY FROM MOVE 26" — where the
 * other player is handed a board they never agreed to: "the opponent should get
 * the option to refuse the game… no penalties for refusing."
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS ITS OWN WORLD, AND IT IS TWO PEOPLE RATHER THAN ONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every case here needs TWO accounts, which is the thing this shape of spec has
 * got wrong before: `browser.newContext()` inherits the stored sign-in, so a
 * "two player" case written that way is one account playing itself, and the
 * whole of what it is testing — that one person may refuse another — cannot
 * happen. So both members are seeded with generated addresses and given their
 * own signed session by `memberContext`, and the file signs in as neither the
 * operator nor the stored player.
 *
 * Generated names, and every row removed afterwards: nothing here asserts
 * anything about a name, a count or a game it did not make. A `Player` row
 * keyed to a name outlives the games swept from under it, so the names carry
 * the run's own stamp.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND IT DRIVES THE CONTROLS, NOT THE MECHANISM
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Accept, Decline and Withdraw are CLICKED, on the queue and on the board,
 * because that is how a reader reaches them — and a test that posted to
 * `/api/games/[id]/offer/decline` would have tested the route and said nothing
 * about whether anybody can find it. The routes are exercised directly only
 * where a reader cannot be: a move on an offered game, and the offerer trying
 * to accept their own offer, are things the site offers no control for, and
 * "there is no button" is exactly why the route has to refuse.
 *
 * Every assertion about something NOT being on the page waits for a sibling
 * that IS first — `toHaveCount(0)` passes the instant it is asked, and an
 * offer's board is server-rendered, so the controls are real controls before
 * React attaches.
 */

/** This run's own stamp, so two runs cannot read each other's rows. */
const RUN = `off${Date.now().toString(36)}`;
const ASKER = { email: `${RUN}-asker@example.test`, name: `Asker ${RUN}` };
const ASKED = { email: `${RUN}-asked@example.test`, name: `Asked ${RUN}` };

let asker: BrowserContext;
let asked: BrowserContext;
let askerId = "";
let askedId = "";

/** The games this file made, so it can take them away again. */
const made: string[] = [];

function db(): PrismaClient {
  process.loadEnvFile(".env");
  return new PrismaClient();
}

test.beforeAll(async ({ browser, baseURL }) => {
  asker = await memberContext(browser, baseURL!, ASKER);
  asked = await memberContext(browser, baseURL!, ASKED);
  askerId = await memberIdFor(ASKER.email);
  askedId = await memberIdFor(ASKED.email);
});

test.afterAll(async () => {
  await asker?.close();
  await asked?.close();
  const prisma = db();
  try {
    // Moves first: a game's rows have a foreign key onto it.
    if (made.length > 0) {
      await prisma.move.deleteMany({ where: { gameId: { in: made } } });
      await prisma.game.deleteMany({ where: { id: { in: made } } });
    }
    /*
     * A `Player` row is keyed by the NAME a game was played under and outlives
     * the game, so a run that left one behind takes that name for ever — see
     * AGENTS.md on database litter. Nothing here should ever have written one,
     * which is a large part of what this file is checking, so removing them is
     * belt and braces rather than tidying.
     */
    await prisma.player.deleteMany({ where: { name: { in: [ASKER.name, ASKED.name] } } });
  } finally {
    await prisma.$disconnect();
  }
  await removeMember(ASKER.email);
  await removeMember(ASKED.email);
});

/** Asks the other member for a game, through the route the doorstep posts to. */
async function offerAGame(
  page: Page,
  body: Record<string, unknown> = {},
): Promise<string> {
  const response = await page.request.post("/api/games/live", {
    data: {
      variant: "freestyle",
      size: 9,
      winLength: 5,
      challengeId: askedId,
      moveTimeMs: null,
      ...body,
    },
  });
  /*
   * ENUMERATE WHAT IS TOLERATED, never what is rejected. A creation that
   * answers anything but 201 here means this spec never got far enough to look
   * at an offer — and the answer you forget to exclude is always "nothing
   * happened at all". AGENTS.md, "A Tolerant Assertion Enumerates What It
   * TOLERATES".
   */
  expect(response.status(), await response.text()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  made.push(id);
  return id;
}

/** The offer's row on /play, for whichever of the two people is looking. */
async function queueRow(context: BrowserContext, group: string, id: string) {
  const page = await context.newPage();
  await page.goto("/play");
  // The panel first, so an absence below is about a rendered page.
  await expect(page.getByTestId(`my-games-${group}`)).toBeVisible();
  return { page, row: page.getByTestId(`my-games-${group}`).locator(`[data-id="${id}"]`) };
}

test.describe("a game offered to somebody", () => {
  test("is not bound to them, and holds no seat token for anybody", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    const prisma = db();
    try {
      const row = await prisma.game.findUnique({ where: { id } });
      /*
       * THE MECHANISM, ASSERTED ONCE. Every rule in this file rests on the
       * other seat being UNBOUND: it is what keeps an offer out of the
       * active-game cap for the offeree, out of their record, and out of every
       * query on the site that means "a person is in this game".
       */
      expect(row?.blackMemberId).toBe(askerId);
      expect(row?.whiteMemberId).toBeNull();
      expect(row?.offeredToMemberId).toBe(askedId);
      expect(row?.offeredAt).not.toBeNull();
      expect(row?.status).toBe("active");
      // And no clock runs against a question: see `deadlineFor`.
      expect(row?.deadlineAt).toBeNull();
    } finally {
      await prisma.$disconnect();
    }
    await page.close();
  });

  test("hands the offerer nothing they could play the other seat with", async () => {
    const page = await asker.newPage();
    const response = await page.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, challengeId: askedId, moveTimeMs: null },
    });
    expect(response.status()).toBe(201);
    const body = (await response.json()) as Record<string, unknown>;
    made.push(body.id as string);
    /*
     * A token is the whole credential — whoever holds a seat's token can move,
     * resign and claim a timeout AS that seat. The offerer gets their own and
     * nothing else, and this is the assertion that says so rather than a shape
     * that happens to match: exactly one token, and it is not the offeree's.
     */
    const prisma = db();
    try {
      const row = await prisma.game.findUnique({ where: { id: body.id as string } });
      const sent = JSON.stringify(body);
      expect(sent).not.toContain(row!.whiteToken);
      expect(sent).toContain(row!.blackToken);
    } finally {
      await prisma.$disconnect();
    }
    await page.close();
  });

  test("shows the person asked an offer to answer, and the colour they would take", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await expect(row).toBeVisible();
    await expect(row.getByTestId("offer-accept")).toBeVisible();
    await expect(row.getByTestId("offer-decline")).toBeVisible();
    // "You WOULD be white": they are not in it yet, and the row must not pretend.
    await expect(row).toContainText("you would be");
    /*
     * AND NOTHING TO GIVE UP. An offer is answered, not resigned — the routes
     * refuse it, so a Resign button here would be one that does nothing. The
     * row itself is waited for above, so this absence is about a drawn page.
     */
    await expect(row.getByTestId("resign")).toHaveCount(0);
    await expect(row.getByTestId("cancel")).toHaveCount(0);
    await theirs.close();
  });

  test("shows the offerer their own offer, with a way to take it back", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: mine, row } = await queueRow(asker, "offerSent", id);
    await expect(row).toBeVisible();
    await expect(row.getByTestId("offer-withdraw")).toBeVisible();
    await expect(row.getByTestId("offer-accept")).toHaveCount(0);
    await mine.close();
  });

  test("counts in the badge beside Play, so nobody has to hunt for it", async () => {
    const page = await asker.newPage();
    await offerAGame(page);
    await page.close();

    const theirs = await asked.newPage();
    await theirs.goto("/games");
    // The slot is server-rendered and the count is not: wait for the mark.
    await ready(theirs, "your-turn-slot");
    const badge = theirs.getByTestId("your-turn-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute("title", /offer/);
    await theirs.close();
  });

  test("says on the board itself that it is an offer, and cannot be played", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const theirs = await asked.newPage();
    await theirs.goto(`/games/gomoku/match/${id}`);
    await ready(theirs, "shared-game");
    await expect(theirs.getByTestId("turn-banner")).toHaveAttribute("data-offer", "to-me");
    await expect(theirs.getByTestId("offer-panel")).toBeVisible();
    await expect(theirs.getByTestId("offer-panel")).toContainText(ASKER.name.split(" ")[0]);
    /*
     * AND NO WAY IN FOR ANYBODY ELSE. The offered seat is not free, so there is
     * no invite link on the board and no four-words panel offering it — an
     * offer mints a credential for nobody. Asserted after the panel above, so
     * the page has certainly rendered.
     */
    await expect(theirs.getByTestId("sit-as-closed")).toHaveCount(0);
    await expect(theirs.getByTestId("invite-panel")).toHaveCount(0);
    await theirs.close();
  });
});

test.describe("declining an offer", () => {
  test("costs nothing: no result, no record for either of them, no rating", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    // Clicked, on the queue, exactly as a reader would.
    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-decline").click();
    // Their whole offers panel goes with it: saying no makes it disappear.
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    const prisma = db();
    try {
      const row = await prisma.game.findUnique({ where: { id } });
      expect(row?.declinedAt).not.toBeNull();
      expect(row?.withdrawnAt).toBeNull();
      expect(row?.status).toBe("finished");
      // Not a finished game WITH a result: nobody won and nothing was decided.
      expect(row?.result).toBe("abandoned");
      expect(row?.winner).toBeNull();
      // And the seat stayed unbound, so it is in neither person's games.
      expect(row?.whiteMemberId).toBeNull();

      /*
       * THE PROMISE, CHECKED AT THE LADDER. `recordResult` keys a `Player` row
       * by the name a game was played under, so the absence of a row under
       * either name is the strongest statement available that no rating moved.
       */
      const players = await prisma.player.findMany({
        where: { name: { in: [ASKER.name, ASKED.name] } },
      });
      expect(players).toEqual([]);
    } finally {
      await prisma.$disconnect();
    }
  });

  test("tells the offerer, by name, and does not file it among their finished games", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-decline").click();
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    const { page: mine, row: mineRow } = await queueRow(asker, "offerSent", id);
    await expect(mineRow.getByTestId("offer-state")).toContainText("declined");
    await expect(mineRow.getByTestId("offer-state")).toContainText("nothing was rated");
    /*
     * AND NOT IN "LATELY FINISHED", whose own hint reads "Filed in the record".
     * A declined offer is in no record at all. The offers panel above is
     * rendered before this absence is asked about.
     */
    await expect(mine.getByTestId("my-games-finished").locator(`[data-id="${id}"]`)).toHaveCount(0);
    await mine.close();
  });

  test("leaves the board saying what happened rather than a game nobody played", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-decline").click();
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    /*
     * NOTHING IS A DEAD END, and this is the address the offerer's own link
     * goes to. Without its own page it fell through to the replay, which would
     * have drawn a board and a result line for a game that never started.
     */
    const mine = await asker.newPage();
    await mine.goto(`/games/gomoku/match/${id}`);
    const said = mine.getByTestId("refused-offer");
    await expect(said).toBeVisible();
    await expect(said).toContainText("declined");
    await expect(said).toContainText("nobody won");
    // And the two ways on, which is what keeps it from being a dead end.
    await expect(said.getByRole("link", { name: /your games/i })).toBeVisible();
    await mine.close();
  });

  test("keeps the declined offer out of the public record", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-decline").click();
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    /*
     * READ THROUGH THE API rather than off /history, so the assertion is about
     * the listing's own filter rather than about which page of it a row landed
     * on. Narrowed to this run's own player, which is the only honest way to
     * say "none of these" about a table with six thousand rows in it.
     */
    const mine = await asker.newPage();
    const listed = await mine.request.get(
      `/api/games?player=${encodeURIComponent(ASKER.name)}&limit=50`,
    );
    expect(listed.status()).toBe(200);
    const { items } = (await listed.json()) as { items: { id: string }[] };
    expect(items.map((one) => one.id)).not.toContain(id);
    await mine.close();
  });
});

test.describe("accepting an offer", () => {
  test("makes it an ordinary game, and a move lands", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-accept").click();
    // The offers panel goes; the game is theirs now.
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);

    const prisma = db();
    try {
      const after = await prisma.game.findUnique({ where: { id } });
      /*
       * BYTE FOR BYTE WHAT A BOUND GAME IS. The seat is bound and the offer is
       * CLEARED — which is the whole mechanism: from here every query on the
       * site reads this as an ordinary game without being told about offers.
       */
      expect(after?.whiteMemberId).toBe(askedId);
      expect(after?.offeredToMemberId).toBeNull();
      expect(after?.offeredAt).toBeNull();
      expect(after?.status).toBe("active");
    } finally {
      await prisma.$disconnect();
    }

    // And a stone goes down — driven on the board, as a player would.
    const board = await asker.newPage();
    await board.goto(`/games/gomoku/match/${id}`);
    await ready(board, "shared-game");
    await expect(board.getByTestId("offer-panel")).toHaveCount(0);
    // Driven the way a player drives it: the intersection by its own name.
    await playAt(board, 9, 4, 4);
    await expect(board.getByTestId("live-moves")).not.toContainText("Nothing played yet");
    await board.close();
    await theirs.close();
  });

  test("mints a seat token that did not exist while the game was a question", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const prisma = db();
    let before = "";
    try {
      before = (await prisma.game.findUnique({ where: { id } }))!.whiteToken;
    } finally {
      await prisma.$disconnect();
    }

    const { page: theirs, row } = await queueRow(asked, "offered", id);
    await row.getByTestId("offer-accept").click();
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    const after = db();
    try {
      const row = await after.game.findUnique({ where: { id } });
      /*
       * "TOKENLESS UNTIL ACCEPT", as far as a non-null column allows. The value
       * that existed while this was a question is discarded at the moment it
       * becomes an answer, so even a leaked one cannot play the seat.
       */
      expect(row?.whiteToken).not.toBe(before);
      expect(row?.whiteClaimedAt).not.toBeNull();
    } finally {
      await after.$disconnect();
    }
  });
});

test.describe("withdrawing an offer", () => {
  test("takes it back, costs nobody anything, and leaves both queues clean", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const { page: mine, row } = await queueRow(asker, "offerSent", id);
    await row.getByTestId("offer-withdraw").click();
    await expect(row.getByTestId("offer-state")).toContainText("withdrew");
    await mine.close();

    const prisma = db();
    try {
      const after = await prisma.game.findUnique({ where: { id } });
      expect(after?.withdrawnAt).not.toBeNull();
      expect(after?.declinedAt).toBeNull();
      expect(after?.status).toBe("finished");
      expect(after?.winner).toBeNull();
      const players = await prisma.player.findMany({
        where: { name: { in: [ASKER.name, ASKED.name] } },
      });
      expect(players).toEqual([]);
    } finally {
      await prisma.$disconnect();
    }

    // And it is gone from the offeree's list, who never agreed to anything.
    const theirs = await asked.newPage();
    await theirs.goto("/play");
    await expect(theirs.getByTestId("my-games").or(theirs.getByTestId("my-games-empty"))).toBeVisible();
    await expect(theirs.locator(`[data-id="${id}"]`)).toHaveCount(0);
    await theirs.close();
  });
});

test.describe("what an offer refuses", () => {
  test("takes no move from either of them while it stands", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    const prisma = db();
    let tokens = { blackToken: "", whiteToken: "" };
    try {
      const row = await prisma.game.findUnique({ where: { id } });
      tokens = { blackToken: row!.blackToken, whiteToken: row!.whiteToken };
    } finally {
      await prisma.$disconnect();
    }

    /*
     * DRIVEN AT THE ROUTE, and that is the point rather than a shortcut: there
     * is no control for this anywhere on the site, so "there is no button" is
     * exactly why the route has to say no. Both tokens, because the offerer
     * holds a real one for their own seat — and a fork offer would have stones
     * on the board and a colour to move.
     */
    for (const token of [tokens.blackToken, tokens.whiteToken]) {
      const played = await page.request.post(`/api/games/${id}/moves`, {
        data: { token, row: 4, col: 4 },
      });
      expect(played.status()).toBe(409);
      expect((await played.json()).reason).toBe("offered");
    }
    await page.close();
  });

  test("refuses to be resigned or called off, which would write a result", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    for (const door of ["resign", "cancel"]) {
      const tried = await page.request.post(`/api/games/${id}/${door}`, { data: {} });
      /*
       * THE DANGEROUS ONE IS `resign`: the offerer holds a real token for their
       * own seat, so without the guard they could write a rated LOSS for
       * themselves and a WIN, on a permanent public record, for somebody who
       * never agreed to play.
       */
      expect(tried.status(), door).toBe(409);
      expect((await tried.json()).reason, door).toBe("offered");
    }
    await page.close();
  });

  test("cannot be accepted by the person who made it", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    const tried = await page.request.post(`/api/games/${id}/offer/accept`, {});
    expect(tried.status()).toBe(409);
    expect((await tried.json()).reason).toBe("own-offer");
    await page.close();
  });

  test("cannot be answered twice, and says so rather than pretending it is gone", async () => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const theirs = await asked.newPage();
    expect((await theirs.request.post(`/api/games/${id}/offer/decline`, {})).status()).toBe(200);
    const again = await theirs.request.post(`/api/games/${id}/offer/decline`, {});
    // 409 rather than 404: a real row that has moved on, not a thing that never was.
    expect(again.status()).toBe(409);
    expect((await again.json()).reason).toBe("answered");
    await theirs.close();
  });

  test("tells a stranger nothing at all about it", async ({ browser, baseURL }) => {
    const page = await asker.newPage();
    const id = await offerAGame(page);
    await page.close();

    const stranger = await memberContext(browser, baseURL!, {
      email: `${RUN}-nobody@example.test`,
      name: `Nobody ${RUN}`,
    });
    const theirs = await stranger.newPage();
    /*
     * THE SAME 404 A GAME THAT IS NOT AN OFFER GETS. Any other answer would
     * make this route a way of asking which games on the site are offers and
     * who they were sent to.
     */
    for (const door of ["accept", "decline", "withdraw"]) {
      const tried = await theirs.request.post(`/api/games/${id}/offer/${door}`, {});
      expect(tried.status(), door).toBe(404);
    }
    await theirs.close();
    await stranger.close();
    await removeMember(`${RUN}-nobody@example.test`);
  });
});

test.describe("a game against a computer player", () => {
  /*
   * NOT AN OFFER, and this is the exception rather than an oversight: a program
   * has nothing to accept with, it never signs in, and a game waiting for it to
   * agree would wait for ever. Its seat binds exactly as it always has — which
   * is also the reason people choose one.
   */
  test("is seated rather than asked, and starts at once", async () => {
    const page = await asker.newPage();
    const prisma = db();
    let botId: string | null = null;
    try {
      const bot = await prisma.member.findFirst({
        where: { unclaimableBecause: "computer" },
        select: { id: true },
      });
      botId = bot?.id ?? null;
    } finally {
      await prisma.$disconnect();
    }
    /*
     * A SKIP IS AN ABSENCE TOO, so it says which it is. A development database
     * with no computer players in it cannot answer this, and reporting green
     * over that would be the quietest way for a test to say nothing.
     */
    test.skip(botId === null, "no computer players on this database to be seated");

    const response = await page.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, challengeId: botId, moveTimeMs: null },
    });
    expect(response.status()).toBe(201);
    const { id } = (await response.json()) as { id: string };
    made.push(id);

    const after = db();
    try {
      const row = await after.game.findUnique({ where: { id } });
      expect(row?.offeredToMemberId).toBeNull();
      expect(row?.offeredAt).toBeNull();
      // Both seats bound, which is what "there is nothing to accept" means here.
      expect(row?.blackMemberId).toBe(askerId);
      expect(row?.whiteMemberId).toBe(botId);
    } finally {
      await after.$disconnect();
    }
    await page.close();
  });
});

test.describe("a fork from a position", () => {
  /*
   * THE CASE JOHN RAISED — "PLAY FROM MOVE 26" — and the one that makes the
   * grouping rule more than tidiness: a fork copies moves across, so an offered
   * board has stones on it and a position with a real colour to move. Every
   * other rule in the queue would have called that "your move".
   */
  test("is an offer too, and never lands in the games waiting on a move", async () => {
    const page = await asker.newPage();
    // A game the two of them actually played, to fork out of.
    const first = await offerAGame(page);
    await page.close();

    const { page: theirs, row } = await queueRow(asked, "offered", first);
    await row.getByTestId("offer-accept").click();
    await expect(row, "the answered offer leaves this reader's list").toHaveCount(0);
    await theirs.close();

    const board = await asker.newPage();
    await board.goto(`/games/gomoku/match/${first}`);
    await ready(board, "shared-game");
    await playAt(board, 9, 4, 4);
    await expect(board.getByTestId("live-moves")).not.toContainText("Nothing played yet");

    // And now a second game out of that position, against the same person.
    const forked = await board.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, from: { id: first, move: 1 }, moveTimeMs: null },
    });
    expect(forked.status(), await forked.text()).toBe(201);
    const { id } = (await forked.json()) as { id: string };
    made.push(id);
    await board.close();

    const prisma = db();
    try {
      const stored = await prisma.game.findUnique({ where: { id } });
      expect(stored?.offeredToMemberId).toBe(askedId);
      // The position came with it, which is what makes the next assertion matter.
      expect(stored?.moveCount).toBe(1);
    } finally {
      await prisma.$disconnect();
    }

    const { page: mine, row: offered } = await queueRow(asked, "offered", id);
    await expect(offered).toBeVisible();
    await expect(offered.getByTestId("offer-accept")).toBeVisible();
    /*
     * NOT IN "YOUR MOVE", which is the bucket the advance to the next game
     * walks. An offer reaching it would carry somebody onto a board they had
     * never agreed to play. The offers panel above is rendered first, so this
     * absence is about a drawn page.
     */
    await expect(mine.getByTestId("my-games-yourMove").locator(`[data-id="${id}"]`)).toHaveCount(0);
    await mine.close();
  });
});
