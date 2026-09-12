import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Whether a game this route creates is rated, when the request does not say.
 *
 * A hot-seat board is somebody trying a board out at one screen: nobody
 * asked for a rated game, and `useMatchMirror` now says `rated: false`
 * outright — but the schema used to default an absent field to `true`,
 * which is how a scratch board reached a real ladder with neither player
 * having asked for a rated game. See AGENTS.md, "A board you were only
 * trying out creates a rated game".
 *
 * `createLiveGame` is mocked so these read what the route actually decided,
 * the same shape as `sit/route.test.ts` next door.
 */

const createLiveGame = vi.fn<
  (input: Record<string, unknown>) => Promise<{ id: string; blackToken: string; whiteToken: string }>
>(async () => ({
  id: "game-1",
  blackToken: "black-token",
  whiteToken: "white-token",
}));

vi.mock("@/lib/history/liveGame", () => ({
  createLiveGame: (input: Record<string, unknown>) => createLiveGame(input),
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { createGame: {} } }));
vi.mock("@/lib/history/activeGames", () => ({
  memberOverActiveLimit: async () => null,
  activeLimitRefusal: () => "",
}));
vi.mock("@/lib/auth/currentSession", () => ({
  currentMemberId: async () => null,
  currentSession: async () => null,
}));
vi.mock("@/lib/social/ignores", () => ({ isIgnoring: async () => false }));
vi.mock("@/lib/bots/botMembers", () => ({ ensureBotMembers: async () => {} }));
vi.mock("@/lib/bots/bots", () => ({ isBotId: () => false }));
vi.mock("@/lib/bots/botPlay", () => ({ playBotTurns: async () => {} }));

/**
 * The game a fork is taken out of.
 *
 * Deliberately unlike every default: a three-day clock, a nine-by-nine board,
 * three in a row to win, resigning off, unrated. A fork that came back on the
 * defaults would then be visible rather than plausible — which is the whole
 * reason the clock was made to travel with a fork in the first place, after a
 * three-day-a-move game forked into a five-minute one.
 */
const ORIGIN = {
  id: "origin-1",
  status: "finished",
  size: 9,
  variant: "freestyle",
  obstacles: "none",
  opening: "free",
  handicap: null,
  seed: 4242,
  opener: "black",
  winLength: 3,
  drawLimit: "none",
  moveTimeMs: 3 * 24 * 60 * 60_000,
  clockMode: "move",
  timeoutPenalty: "game",
  allowResign: false,
  rated: false,
  moveCount: 4,
  blackName: "One",
  whiteName: "Two",
  blackMemberId: null,
  whiteMemberId: null,
};

/**
 * The origin a fork or a rematch reads, which one case below replaces.
 *
 * Mutable because the interesting fork is out of a RATED game, and the row
 * that matters is one whose `rated` column says true for a game that could
 * never have counted — see `ratedButRefused.ts`. Reset before every case, so
 * nothing leaks between them.
 */
let origin: Record<string, unknown> = { ...ORIGIN };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findUnique: async () => origin },
    member: { findUnique: async () => null, findMany: async () => [] },
  },
}));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/games/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  createLiveGame.mockClear();
  origin = { ...ORIGIN };
});

describe("POST /api/games/live — rated", () => {
  it("a hot-seat board that says nothing about rated is not rated", async () => {
    const response = await post({ hotSeat: true, open: false });

    expect(response.status).toBe(201);
    expect(createLiveGame).toHaveBeenCalledTimes(1);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  /*
   * IT USED TO. The route honoured an explicit `rated: true` on a hot-seat
   * board, and storing it was a claim the site can never keep: every write
   * path — `appendMove`, `settleEnded`, `claimTimeout`, `resignGame` — checks
   * `isHotSeat` before `recordResult`, and a game's two tokens are written
   * once and never rewritten, so a hot-seat game can never move a rating at
   * any point in its life. Twelve finished production rows carried that claim
   * and their pages showed a rated result; see `ratedButRefused.ts`.
   */
  it("a hot-seat board cannot be rated even by asking outright", async () => {
    await post({ hotSeat: true, open: false, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  it("a hot-seat board that explicitly declines rating stays unrated", async () => {
    await post({ hotSeat: true, open: false, rated: false });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  /*
   * `StartGame` posts a seat with `{ variant, size, moveTimeMs, open: true }`
   * and never sends `hotSeat` or `rated` — this is that shape. It has to go
   * on creating a rated game exactly as it always has: it is one of the two
   * callers a hot-seat-only default was chosen specifically so as not to
   * disturb, because neither lives on a path this fix was free to edit.
   */
  it("a posted seat that says nothing about rated is still rated, as it always was", async () => {
    const response = await post({ open: true });

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
  });

  /*
   * `ChallengeButton` posts `{ challenge, challengeId, variant, from,
   * rematch }` and never sends `hotSeat` or `rated` either. Neither
   * `challenge` nor `challengeId` is set here — an anonymous caller cannot
   * challenge anybody — so this exercises the same "ordinary, non-hot-seat
   * creation" branch that one relies on, without needing a signed-in
   * session or a member row.
   */
  it("an ordinary board that says nothing about rated or hotSeat is still rated", async () => {
    const response = await post({});

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
  });

  /*
   * THE DOOR A BAD ROW USED TO MAKE ANOTHER BAD ROW THROUGH.
   *
   * A fork with nobody to challenge becomes a hot-seat game — there is no
   * second player to send it to — and `source.rated` was spread over the
   * decision afterwards. So forking any RATED game whose opponent has no
   * address minted a fresh `rated: true` hot-seat row: exactly the shape of
   * the twelve production rows found on 2026-09-11, made by the site, today,
   * with the write-path fix of 0.145.2 in place.
   *
   * Nobody is signed in here, so `currentMemberId` is null and the origin's
   * seats hold no member ids — which is precisely the case that finds no
   * opponent and falls through to one screen.
   */
  it("a fork that becomes a hot-seat game does not inherit the source's rating", async () => {
    origin = { ...ORIGIN, rated: true };

    const response = await post({ from: { id: "origin-1", move: 2 } });

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean; hotSeat?: boolean }];
    expect(input.hotSeat).toBe(true);
    expect(input.rated).toBe(false);
  });

  /*
   * AND ASKING FOR IT ON THE WAY THROUGH THE FORK DOES NOT HELP EITHER.
   *
   * A fork whose caller names `rated` has that field deleted from `source`
   * (see `FORK_PACE_SETTINGS` — the pace is the caller's to settle, unlike the
   * position), so this is the request speaking with nothing carried over it.
   * It still lands unrated, because the game is being played at one screen
   * and nothing about a request can change that.
   */
  it("a hot-seat fork cannot be rated by asking on the way through", async () => {
    origin = { ...ORIGIN, rated: true };

    await post({ from: { id: "origin-1", move: 2 }, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean; hotSeat?: boolean }];
    expect(input.hotSeat).toBe(true);
    expect(input.rated).toBe(false);
  });

  /*
   * THE ORDERING THE FIX MUST NOT DISTURB, checked where it is visible: the
   * source's other pace settings still travel with a fork, so `rated` is not
   * being lifted out of `source` by some looser rule that took the rest with
   * it. A three-day-a-move game once forked into a five-minute one, which is
   * why any of this is spread at all.
   */
  it("still carries everything else the forked game was played under", async () => {
    origin = { ...ORIGIN, rated: true };

    await post({ from: { id: "origin-1", move: 2 } });

    const [input] = createLiveGame.mock.calls[0] as [
      { moveTimeMs: number | null; timeoutPenalty: string; allowResign: boolean; winLength: number },
    ];
    expect(input.moveTimeMs).toBe(ORIGIN.moveTimeMs);
    expect(input.timeoutPenalty).toBe(ORIGIN.timeoutPenalty);
    expect(input.allowResign).toBe(ORIGIN.allowResign);
    expect(input.winLength).toBe(ORIGIN.winLength);
  });
});

/**
 * WHAT THE SETUP SCREEN SENDS, ACCEPTED.
 *
 * Every way into a game now posts from that one screen, so the shape it sends is
 * the shape this route has to take — and the way for that to go wrong is a 422
 * on one field, which would refuse every game on the site with a message about
 * the whole request. The handicap is the field at risk: it is the one thing the
 * screen learned to ask for, and nothing anywhere had ever sent one before.
 */
describe("POST /api/games/live — the body the setup screen sends", () => {
  /** Exactly what `creationFor` builds for a seat posted for anyone. */
  const draft = {
    variant: "freestyle",
    size: 15,
    obstacles: "none",
    opening: "free",
    moveTimeMs: null,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: true,
    allowResign: true,
    open: true,
    handicap: {
      stone: null,
      doubleThree: false,
      doubleFour: false,
      overline: false,
      exactLine: false,
      openLine: false,
      longerLine: false,
      singleStone: false,
      noCaptures: false,
      secondStoneExclusion: 0,
    },
  };

  it("takes the whole settled draft, plain handicap and all", async () => {
    const response = await post(draft);

    expect(response.status, await response.text()).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ handicap: { stone: string | null } }];
    expect(input.handicap.stone, "no handicap is a handicap for nobody").toBeNull();
  });

  /*
   * And a handicap somebody chose reaches the game. John: "you're playing
   * someone who's not very strong — you want to, in the settings page, give
   * yourself a handicap to help them out." The engine has had handicaps all
   * along and no screen could ask for one, so this is the first request in the
   * site's history to carry one.
   */
  it("carries a handicap somebody chose on the way in", async () => {
    await post({ ...draft, handicap: { ...draft.handicap, stone: "black", doubleThree: true } });

    const [input] = createLiveGame.mock.calls[0] as [
      { handicap: { stone: string | null; doubleThree: boolean } },
    ];
    expect(input.handicap.stone).toBe("black");
    expect(input.handicap.doubleThree).toBe(true);
  });
});

/**
 * A FORK CARRIES ITS POSITION, AND YIELDS THE PACE TO WHOEVER ASKED.
 *
 * The two halves pull against each other and both matter. Everything the
 * position depends on comes from the game being forked, because replaying the
 * copied moves onto any other board would not be the same position. The pace is
 * about the moves still to come, so the setup screen settles it — and a control
 * whose answer the server throws away is worse than no control.
 *
 * The fallback is the half that is easy to break while fixing the other: a
 * caller that says nothing must still get the origin's clock, which is what
 * stopped a three-day-a-move game forking into a five-minute one.
 */
describe("POST /api/games/live — a fork", () => {
  const fork = { from: { id: ORIGIN.id, move: 1 } };

  it("takes the game's own clock when the caller says nothing, as it has since that was fixed", async () => {
    const response = await post(fork);

    expect(response.status, await response.text()).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [
      { moveTimeMs: number | null; timeoutPenalty: string; allowResign: boolean; rated: boolean },
    ];
    expect(input.moveTimeMs).toBe(ORIGIN.moveTimeMs);
    expect(input.timeoutPenalty).toBe(ORIGIN.timeoutPenalty);
    expect(input.allowResign).toBe(ORIGIN.allowResign);
    expect(input.rated).toBe(ORIGIN.rated);
  });

  /*
   * `rated` IS THE ONE PACE SETTING A HOT-SEAT FORK CANNOT YIELD, and it is
   * asserted here rather than left to the case further up, because this is the
   * test somebody reads to learn what a fork honours.
   *
   * Nobody is signed in in these cases, and the origin's seats hold no member
   * ids, so there is nobody to challenge and the fork becomes a game at one
   * screen. A hot-seat game can never move a rating — every write path checks
   * `isHotSeat` before `recordResult`, and a game's tokens are written once —
   * so storing `rated: true` would be a claim the site cannot keep. It is the
   * shape of the twelve rows found on production on 2026-09-11.
   *
   * The clock, the penalty and resigning are untouched: those the caller
   * settles, and the server honours.
   */
  it("yields the pace to a caller that has settled one, bar a rating it cannot give", async () => {
    await post({ ...fork, moveTimeMs: 5 * 60_000, timeoutPenalty: "turn", allowResign: true, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [
      { moveTimeMs: number | null; timeoutPenalty: string; allowResign: boolean; rated: boolean; hotSeat?: boolean },
    ];
    expect(input.moveTimeMs, "the pace the setup screen settled").toBe(5 * 60_000);
    expect(input.timeoutPenalty).toBe("turn");
    expect(input.allowResign).toBe(true);
    expect(input.hotSeat, "nobody to challenge, so it is one screen").toBe(true);
    expect(input.rated, "a game at one screen cannot be rated, however it is asked for").toBe(false);
  });

  /*
   * And the position's own rules still come from the position, whatever is sent.
   * The setup screen does not offer these for a fork — it shows them as settled
   * — but the route is the thing that has to be right, because a control being
   * absent from one page is not a rule.
   */
  it("never lets a caller move the board or the game the position was played on", async () => {
    await post({ ...fork, size: 19, variant: "reversi", opening: "pro", seed: 1 });

    const [input] = createLiveGame.mock.calls[0] as [
      { size: number; variant: string; opening: string; seed: number; winLength: number },
    ];
    expect(input.size).toBe(ORIGIN.size);
    expect(input.variant).toBe(ORIGIN.variant);
    expect(input.opening).toBe(ORIGIN.opening);
    expect(input.seed, "the seed that scatters a variant's obstacles").toBe(ORIGIN.seed);
    expect(input.winLength, "and the line length the position was played to").toBe(ORIGIN.winLength);
  });

  /*
   * AND THE ANSWER SAYS THE SAME GAME THE ROW DOES.
   *
   * The 201's `Location` is where the caller is told the game is, and it was
   * built from the variant the REQUEST sent while the row was written with the
   * position's — so the request in the case above, which the route is right to
   * overrule, was answered `/games/reversi/match/game-1` for a row played as
   * gomoku. Both now come off the one value `createLiveGame` was handed, which
   * is what makes them unable to disagree rather than merely agreed today.
   *
   * Asserted THROUGH THE ROUTE rather than on `createdResponse` alone: the unit
   * beside `liveResponse.ts` proves the header follows the played settings, and
   * this proves the route is what hands them over. See AGENTS.md, "A Merge
   * Cannot Conflict With A File That No Longer Exists" — present and reached
   * are two claims.
   */
  it("tells the caller where the game is under the name the row was written as", async () => {
    const response = await post({ ...fork, variant: "reversi" });

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ variant: string }];
    expect(input.variant, "the row").toBe(ORIGIN.variant);
    // Freestyle gomoku lives at /games/gomoku — the slugs are a table, see `slugs.ts`.
    expect(response.headers.get("Location"), "the header, off the same value").toBe(
      "/games/gomoku/match/game-1",
    );
  });

  it("carries the position itself, as many moves as were asked for", async () => {
    await post({ from: { id: ORIGIN.id, move: 3 } });

    const [input] = createLiveGame.mock.calls[0] as [{ from?: { id: string; moves: number } }];
    expect(input.from).toEqual({ id: ORIGIN.id, moves: 3 });
  });

  it("still refuses a position the game never reached", async () => {
    const response = await post({ from: { id: ORIGIN.id, move: ORIGIN.moveCount + 1 } });
    expect(response.status).toBe(400);
    expect(createLiveGame).not.toHaveBeenCalled();
  });
});
