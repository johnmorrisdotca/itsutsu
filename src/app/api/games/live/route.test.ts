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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findUnique: async () => ORIGIN },
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
});

describe("POST /api/games/live — rated", () => {
  it("a hot-seat board that says nothing about rated is not rated", async () => {
    const response = await post({ hotSeat: true, open: false });

    expect(response.status).toBe(201);
    expect(createLiveGame).toHaveBeenCalledTimes(1);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  it("a hot-seat board that explicitly asks to be rated stays rated", async () => {
    await post({ hotSeat: true, open: false, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
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

  it("yields the pace to a caller that has settled one", async () => {
    await post({ ...fork, moveTimeMs: 5 * 60_000, timeoutPenalty: "turn", allowResign: true, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [
      { moveTimeMs: number | null; timeoutPenalty: string; allowResign: boolean; rated: boolean },
    ];
    expect(input.moveTimeMs, "the pace the setup screen settled").toBe(5 * 60_000);
    expect(input.timeoutPenalty).toBe("turn");
    expect(input.allowResign).toBe(true);
    expect(input.rated).toBe(true);
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
