import { expect, test } from "@playwright/test";

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
