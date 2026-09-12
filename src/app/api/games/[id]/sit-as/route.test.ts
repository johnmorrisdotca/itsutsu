import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Claiming a seat with four words, on a device somebody else is signed in on.
 *
 * The seat work itself is tested in `src/lib/phrase/standInSeat.test.ts` and the
 * words in `phraseStore.test.ts`. What is tested HERE is only what a route can
 * get wrong, and each of these has a reason:
 *
 *  - the guessing limit is asked FIRST, before the expensive hash;
 *  - every refusal that could be somebody guessing says the SAME thing;
 *  - the words never come back in the answer, and never reach a log;
 *  - the seat's token reaches the browser, so the board is actually playable;
 *  - and there is a way BACK, because a tablet gets handed over all evening.
 */

/** Her member id, which is what a tap on her name carries. */
const HER_ID = "h4n4k0jdxxxxxxxx";

type Claimant = { memberId: string } | { name: string };
type Claim = { ok: true; memberId: string; name: string; bound: boolean } | { ok: false };
const CLAIMED = { ok: true, memberId: HER_ID, name: "Hanako Morris", bound: false } as const;
const verifyPhraseFor = vi.fn<(who: Claimant, words: readonly string[]) => Promise<Claim>>(async () => CLAIMED);

const seatStandIn = vi.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>(async () => ({
  ok: true,
  seat: "white",
  token: "white-token",
  variant: "freestyle",
}));

const overLimit = vi.fn<(request: Request, scope: string, config?: unknown) => unknown>(() => null);

vi.mock("@/lib/api/rateLimit", () => ({
  overLimit: (request: Request, scope: string, config?: unknown) => overLimit(request, scope, config),
  RATE_LIMITS: {
    phraseEntry: { windowMs: 60_000, maxRequests: 5, strict: true },
    write: { windowMs: 60_000, maxRequests: 60 },
  },
}));
vi.mock("@/lib/phrase/phraseStore", () => ({
  claimOrVerifyPhraseFor: (who: Claimant, words: readonly string[]) => verifyPhraseFor(who, words),
}));
// Arguments forwarded, because what the route passes ON is part of what it gets right.
vi.mock("@/lib/phrase/standInSeat", () => ({
  seatStandIn: (...args: unknown[]) => seatStandIn(...args),
}));

const { DELETE, POST } = await import("./route");

const WORDS = ["acid", "zebra", "mango", "flock"];

function sitAs(body: unknown, id = "k3m9-p2qx") {
  return POST(
    new Request(`http://localhost/api/games/${id}/sit-as`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  verifyPhraseFor.mockClear();
  verifyPhraseFor.mockResolvedValue({ ...CLAIMED });
  seatStandIn.mockClear();
  seatStandIn.mockResolvedValue({ ok: true, seat: "white", token: "white-token", variant: "freestyle" });
  overLimit.mockClear();
  overLimit.mockReturnValue(null);
});

describe("POST /api/games/[id]/sit-as", () => {
  it("seats her and says where the board is", async () => {
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ seat: "white" });
  });

  it("puts the seat's token in this browser's cookie, so the board is hers to play", async () => {
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    const cookie = response.cookies.get("seat_k3m9-p2qx");
    expect(cookie?.value).toBe("white-token");
    // A credential, so no script on the page may read it.
    expect(cookie?.httpOnly).toBe(true);
  });

  /*
   * The limit is counted before the hash, not after. scrypt is deliberately slow
   * — that is the point of it — so a limiter that ran afterwards would let an
   * attacker spend the server's CPU as fast as they could ask.
   */
  it("asks the guessing limit before doing any work", async () => {
    overLimit.mockReturnValue(new Response(null, { status: 429 }));
    await sitAs({ memberId: HER_ID, words: WORDS });
    expect(overLimit).toHaveBeenCalled();
    expect(verifyPhraseFor).not.toHaveBeenCalled();
    expect(seatStandIn).not.toHaveBeenCalled();
  });

  it("counts against the strict limit, which the test suite's relief cannot loosen", async () => {
    await sitAs({ memberId: HER_ID, words: WORDS });
    const [, scope, config] = overLimit.mock.calls[0];
    expect(scope).toBe("phrase-entry");
    expect(config).toMatchObject({ strict: true, maxRequests: 5 });
  });

  it("says when the four words were bound to the account just now, so the screen can say so", async () => {
    verifyPhraseFor.mockResolvedValue({ ...CLAIMED, bound: true });
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(200);
    expect(((await response.json()) as { bound?: boolean }).bound).toBe(true);
  });

  it("refuses wrong words", async () => {
    verifyPhraseFor.mockResolvedValue({ ok: false });
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(401);
    expect(seatStandIn).not.toHaveBeenCalled();
  });

  /*
   * One wording for every way this can fail, so the route cannot be used to find
   * out which names hold accounts here. A different message for "no such name"
   * would answer that question for free.
   */
  it("says the same thing for wrong words, an unknown member, and a malformed body", async () => {
    verifyPhraseFor.mockResolvedValue({ ok: false });
    const wrongWords = await (await sitAs({ memberId: HER_ID, words: WORDS })).json();
    const unknownMember = await (await sitAs({ memberId: "nobodyatallxxxxx", words: WORDS })).json();
    const malformed = await (await sitAs({ memberId: "", words: [] })).json();
    expect(wrongWords.error).toBe(unknownMember.error);
    expect(malformed.error).toBe(wrongWords.error);
  });

  it("answers 401 for a malformed body too, rather than explaining the shape", async () => {
    expect((await sitAs({ nonsense: true })).status).toBe(401);
    expect((await sitAs({ memberId: HER_ID })).status).toBe(401);
  });

  /*
   * WHO IS AN ID, AND ONLY AN ID. Nothing types a name here any more — the panel
   * offers a list to tap and a tap carries the row it meant — so a body carrying
   * a name is not an older client being accommodated, it is a request this route
   * cannot honestly answer: a display name names however many members happen to
   * be called that. Refused without reaching the store, and refused in the one
   * wording everything else uses.
   */
  it("refuses a body that says a name instead of a member, without going near the words", async () => {
    const response = await sitAs({ name: "Hanako Morris", words: WORDS });
    expect(response.status).toBe(401);
    expect(verifyPhraseFor).not.toHaveBeenCalled();
    expect(seatStandIn).not.toHaveBeenCalled();
  });

  it("refuses anything that is not a member id, whatever it looks like", async () => {
    for (const memberId of ["Hanako M.", "no", "UPPER1234567890x", "two--hyphens", "-leading"]) {
      expect((await sitAs({ memberId, words: WORDS })).status, memberId).toBe(401);
    }
    expect(verifyPhraseFor).not.toHaveBeenCalled();
  });

  /*
   * THE POINT OF THE WHOLE CHANGE, at the level a route can get it wrong: the id
   * a person tapped is what asks the question. Passing the printed name on would
   * be asking which of the members called that it meant, which is the question
   * that has no answer.
   */
  it("asks about the member by id, never by the name that was printed", async () => {
    await sitAs({ memberId: HER_ID, words: WORDS });
    expect(verifyPhraseFor).toHaveBeenCalledWith({ memberId: HER_ID }, WORDS);
  });

  /*
   * And the seat is stamped with the name ON THE ACCOUNT, handed back by the
   * claim. The rating is filed against the seat's name, so a seat carrying
   * anything else files somebody's win under nobody.
   */
  it("stamps the seat with the account's own name, not one from the request", async () => {
    await sitAs({ memberId: HER_ID, words: WORDS });
    const [gameId, memberId, name] = seatStandIn.mock.calls[0] ?? [];
    expect(gameId).toBe("k3m9-p2qx");
    expect(memberId).toBe(HER_ID);
    expect(name).toBe("Hanako Morris");
  });

  /*
   * A full name reaches the seat and must not reach the SCREEN. John had the
   * site changed to print a first name and an initial because his daughter plays
   * here, and this answer is rendered on a device signed in as somebody else.
   */
  it("says who sat down by their shown name, never the full one", async () => {
    const said = (await (await sitAs({ memberId: HER_ID, words: WORDS })).json()) as { name?: string };
    expect(said.name).toBe("Hanako M.");
  });

  it("never says the words back, in the answer or in a cookie", async () => {
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    const said = JSON.stringify(await response.json()) + JSON.stringify([...response.cookies.getAll()]);
    for (const word of WORDS) expect(said).not.toContain(word);
  });

  it("refuses to hash a novel — a phrase is four short words", async () => {
    const response = await sitAs({ memberId: HER_ID, words: ["a".repeat(500), "b", "c", "d"] });
    expect(response.status).toBe(401);
    expect(verifyPhraseFor).not.toHaveBeenCalled();
  });

  it("passes on which seat was asked for", async () => {
    await sitAs({ memberId: HER_ID, words: WORDS, seat: "black" });
    expect(seatStandIn).toHaveBeenCalled();
  });

  it("refuses a seat colour that is not a colour", async () => {
    expect((await sitAs({ memberId: HER_ID, words: WORDS, seat: "purple" })).status).toBe(401);
  });

  it("asks which seat, rather than choosing, when both are free", async () => {
    seatStandIn.mockResolvedValue({ ok: false, reason: "which-seat" });
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/which/i) });
  });

  it("says so when the seat went to somebody else", async () => {
    seatStandIn.mockResolvedValue({ ok: false, reason: "no-free-seat" });
    expect((await sitAs({ memberId: HER_ID, words: WORDS })).status).toBe(409);
  });

  it("says so when she is already sitting at this board", async () => {
    seatStandIn.mockResolvedValue({ ok: false, reason: "already-seated" });
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ reason: "already-seated" });
  });

  it("carries the active-game refusal through with its count in it", async () => {
    seatStandIn.mockResolvedValue({
      ok: false,
      reason: "over-limit",
      said: "You have 20 games on the go, and 20 at once is the limit here.",
    });
    const response = await sitAs({ memberId: HER_ID, words: WORDS });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/20/) });
  });

  it("is 404 for a game that is not there", async () => {
    seatStandIn.mockResolvedValue({ ok: false, reason: "no-game" });
    expect((await sitAs({ memberId: HER_ID, words: WORDS })).status).toBe(404);
  });
});

describe("DELETE /api/games/[id]/sit-as", () => {
  /*
   * The way back. A tablet is passed between two people all evening, and a
   * feature that can be entered and not left is one nobody uses twice.
   */
  it("clears the seat cookie, handing the board back to whoever is signed in", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/games/k3m9-p2qx/sit-as", { method: "DELETE" }),
      { params: Promise.resolve({ id: "k3m9-p2qx" }) },
    );
    expect(response.status).toBe(200);
    const cookie = response.cookies.get("seat_k3m9-p2qx");
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });

  it("asks no credential to hand a tablet back", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/games/k3m9-p2qx/sit-as", { method: "DELETE" }),
      { params: Promise.resolve({ id: "k3m9-p2qx" }) },
    );
    expect(response.status).toBe(200);
    expect(verifyPhraseFor).not.toHaveBeenCalled();
  });
});
