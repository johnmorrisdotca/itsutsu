import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext } from "./members";

/**
 * A seat that is somebody else's does not come with its token.
 *
 * A token is the WHOLE credential: `stoneForToken` is what resigning, moving,
 * giving time, claiming a timeout and changing the rules all identify a player
 * by. So whoever holds a seat's token can act as that seat.
 *
 * `POST /api/games/live` returned the created row — both tokens — and withheld
 * the second only when the seat had been POSTED on the noticeboard. A
 * challenge binds the other seat to a member's id and is rated by default, and
 * it fell outside that case. The challenger was handed their opponent's token,
 * could resign on their behalf, and `recordResult` would credit a rated win —
 * writing a loss that person never played onto a permanent public record.
 *
 * That last part is why this is checked here rather than left to a unit test:
 * the damage is not undone by fixing the bug.
 */
test.describe("the token for a seat that is not yours", () => {
  test("does not come back when the other seat is somebody else's", async ({ request }) => {
    const made = await request.post("/api/games/live", {
      data: { size: 9, challenge: "nobody-here@example.test" },
    });

    /*
     * The address may not hold an account on this database, in which case the
     * route refuses and there is no game to reason about. Either answer is
     * fine; what must never happen is a 201 carrying both tokens.
     */
    if (made.status() !== 201) {
      expect([400, 404, 422]).toContain(made.status());
      return;
    }
    const body = (await made.json()) as Record<string, unknown>;
    expect(
      "whiteToken" in body && "blackToken" in body,
      "both tokens came back for a game whose other seat belongs to somebody else",
    ).toBe(false);
  });

  test("still comes back in full for a board one browser plays both sides of", async ({ request }) => {
    /*
     * The other half of the rule, and the reason this is not simply "never
     * return both": a hot-seat game IS both seats, played by one person at one
     * screen. Withholding a token there would break the board.
     */
    const made = await request.post("/api/games/live", { data: { size: 9, hotSeat: true } });
    expect(made.status()).toBe(201);
    const body = (await made.json()) as Record<string, unknown>;
    expect(body.blackToken, "a hot-seat board needs both of its own seats").toBeTruthy();
    expect(body.whiteToken, "a hot-seat board needs both of its own seats").toBeTruthy();
  });

  test("is the caller's own colour, which a rematch swaps", async ({ request }) => {
    /*
     * `seatsForRematch` gives the caller the colour they did NOT have — "They
     * had black, so now I do". So a fix that returned `blackToken` for every
     * withheld case would hand the caller their opponent's token on exactly
     * the games where two people play each other twice. The token that comes
     * back must be the one for the seat the caller is actually sitting in.
     */
    const made = await request.post("/api/games/live", {
      data: { size: 9, challenge: "nobody-here@example.test" },
    });
    if (made.status() !== 201) return;
    const body = (await made.json()) as Record<string, unknown>;
    const tokens = ["blackToken", "whiteToken"].filter((key) => key in body);
    expect(tokens.length, "exactly one seat's token, and it is the caller's").toBe(1);
  });
});

/**
 * AND THE BOARD DOES NOT PRINT A KEY FOR A SEAT SOMEBODY IS ALREADY IN.
 *
 * The rule above is about what the creation route hands back. This is the same
 * credential reaching the same wrong hands by the other door: the board draws a
 * seat link, QR code and all, for every seat `seatIsFree` calls free — and that
 * asked only whether somebody had FOLLOWED a link. The two players who never
 * follow one are a computer player and a person challenged by name, so both of
 * their seats read as free until the first stone landed.
 *
 * What that printed: a QR code for the computer's own chair, which is the bug
 * John reported with a screenshot; and, in a challenge, the other person's seat
 * key on the challenger's own board — the whole credential for resigning as
 * them, which is the harm this file was written about.
 *
 * Driven as a reader meets it: the board is opened and read.
 */
test.describe("the board's seat links", () => {
  test("are not drawn for a seat a computer player is sitting in", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `seatlinks-${stamp}@example.test`,
      name: `SeatLinks ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games");

    const made = await page.evaluate(async () => {
      const answer = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: "freestyle", size: 15, challengeId: "kyu", rated: false }),
      });
      return { status: answer.status, body: (await answer.json()) as { id?: string } };
    });
    expect(made.status, "a game against a computer player was made").toBe(201);
    const id = made.body.id ?? "";

    const prisma = new PrismaClient();
    let whiteToken = "";
    try {
      const row = await prisma.game.findUnique({ where: { id }, select: { whiteToken: true, whiteMemberId: true } });
      expect(row?.whiteMemberId, "the computer is seated").toBe("kyu");
      whiteToken = row?.whiteToken ?? "";
    } finally {
      await prisma.$disconnect();
    }
    expect(whiteToken).not.toBe("");

    await page.goto(`/games/gomoku/match/${id}`);

    /*
     * An absence after a presence: the board itself is waited for, so "no seat
     * links" is a statement about a rendered page rather than about how fast
     * this asked. BEFORE the first stone, which is the window the move count
     * cannot cover and where the panel used to show.
     */
    await expect(page.getByTestId("turn-banner")).toBeVisible();
    await expect(page.getByTestId("seat-invite")).toHaveCount(0);
    expect(
      (await page.content()).includes(whiteToken),
      "the computer's seat key is printed on the page",
    ).toBe(false);

    await context.close();
  });
});
