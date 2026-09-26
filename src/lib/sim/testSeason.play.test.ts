/**
 * PLAYS A SEASON OF REAL GAMES BETWEEN THE TEST MEMBERS, in process, the same
 * way `botSeries.play.test.ts` plays bot against bot: `createLiveGame`
 * creates the row, the real move-choosing function decides every turn, and
 * `appendMove` writes it exactly as the site's own API would — so a test
 * member's rating, XP and IP come out of the same code a real game's do,
 * never a shortcut that writes plausible numbers directly.
 *
 * IT CANNOT SIMPLY CALL `playBotTurns` (`src/lib/bots/botPlay.ts`), which the
 * bot series does: that function only moves a seat whose member row has a
 * `botTier`, and a test member deliberately has none — it is not a robot, see
 * `docs/plans/test-mode/README.md`'s "why it cannot simply call playBotTurns".
 * So this drives its own loop over the same lower-level pieces
 * (`chooseTurn`, `appendMove`, `replay`), reading a strength for whichever
 * seat is due to move from a LOCAL map this file owns rather than from the
 * database — that strength is never written to a row, and a test member
 * still reads with no `botTier` when this is done.
 *
 * A `.play.test.ts`, run under vitest for the same reason every other one on
 * this site is (`@/` aliases, `server-only`), and it does nothing unless
 * asked:
 *
 *   pnpm exec vitest run src/lib/sim/testSeason.play.test.ts --disable-console-intercept
 *   TEST_SEASON_RUN=1 pnpm exec vitest run src/lib/sim/testSeason.play.test.ts --disable-console-intercept
 *   TEST_SEASON_RUN=1 TEST_SEASON_GAMES=2000 pnpm exec vitest run src/lib/sim/testSeason.play.test.ts --disable-console-intercept
 *
 * LOCAL ONLY, BY NAME, NEVER A FLAG — matching `bots:play` / `bots:play:prod`'s
 * own reasoning in AGENTS.md. There is no `:prod` variant in this file: one
 * would be a SEPARATE script, needing a Neon branch and a dump first, run
 * only by John on his own word, exactly as `bots:play:prod` and the imported-
 * XP payer's production runner already are. This file only ever reaches
 * whatever `DATABASE_URL` already points at, and prints the host before
 * writing a single move.
 *
 * NEVER through the site's own API — AGENTS.md's "Bulk Play Runs Here, Never
 * Through the Site", word for word: a season of games through the deployed
 * API is thousands of paid function invocations for an answer this produces
 * locally for nothing.
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import { chooseTurn } from "@/lib/gomoku/opponent";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { appendMove, GAME_ROW, replay, sameRecord } from "@/lib/history/liveGame";
import { createLiveGame } from "@/lib/history/liveGameCreate";
import type { MoveRequest } from "@/lib/history/liveGame.types";
import { settleEnded } from "@/lib/history/liveGameEndings";
import { isOffered } from "@/lib/history/offers";
import { seatMemberId } from "@/lib/bots/bots";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { prisma } from "@/lib/prisma";

import { mulberry32, uniformInt } from "./prng";

const ASKED = process.env.TEST_SEASON === "1" || process.env.TEST_SEASON_RUN === "1";
const run = process.env.TEST_SEASON_RUN === "1";
const SEED = Number(process.env.TEST_SEASON_SEED ?? "20260925");
const GAMES = Math.max(1, Number(process.env.TEST_SEASON_GAMES ?? "200"));

/*
 * A rehearsal plays fast, cheap games — `razryad` is the shallowest, quickest
 * tier the site has, the same one `chooseTurn` uses for the site's weakest
 * grade — over a small, quick-to-finish set of boards. A real season, once
 * this is proven, would map each test member's role
 * (`journeyRoles.constants.ts`'s `skill`) onto a tier band; that is future
 * work and is not needed to prove the mechanism.
 */
const TIER = "razryad" as const;
const BOARDS: { variant: RuleVariant; size: number; winLength: number }[] = [
  { variant: "tictactoe", size: 3, winLength: 3 },
  { variant: "dropFour", size: 7, winLength: 4 },
  { variant: "standard", size: 9, winLength: 5 },
];

const SEASON_SETTINGS = {
  moveTimeMs: null,
  open: false,
  rated: true,
  timeoutPenalty: "turn",
  allowResign: true,
} as const;

/** The move a turn takes, as the move endpoint speaks it — copied from `src/lib/bots/botPlay.ts`'s own `asRequests`, which is not exported. */
function asRequests(turn: BotTurn): MoveRequest[] {
  if (turn.kind === MOVE_KINDS.pass) return [{ kind: "pass" }];
  if (turn.kind === MOVE_KINDS.move) return [{ kind: "move", row: turn.row, col: turn.col, from: turn.from }];
  if (turn.kind === MOVE_KINDS.piece) return [{ kind: "piece", cells: turn.cells }];
  const place: MoveRequest = { kind: "place", row: turn.row, col: turn.col, ...(turn.stone === undefined ? {} : { stone: turn.stone }) };
  if (turn.twist === undefined) return [place];
  return [place, { kind: "twist", ...turn.twist }];
}

/**
 * Plays out every turn until the game stops being active, or a bound of
 * passes is hit — the same 400-pass bound `botSeriesGame.ts`'s `playOut`
 * uses, for the same reason: a game that never settles is a bug, not a long
 * game.
 */
async function playSeasonGame(id: string): Promise<{ finished: boolean; detail: string }> {
  let known: GameState | null = null;
  for (let pass = 0; pass < 400; pass += 1) {
    const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
    if (row === null) return { finished: false, detail: "vanished" };
    if (row.status !== "active") return { finished: row.status === "finished", detail: row.status };
    if (row.openSeat !== null) return { finished: false, detail: "open seat" };
    if (isOffered(row)) return { finished: false, detail: "offered" };

    const state: GameState = known !== null && sameRecord(known, row) ? known : replay(row);
    if (state.status !== GAME_STATUS.playing) {
      await settleEnded(id);
      return { finished: true, detail: "settled" };
    }

    // Whichever test member is due to move plays at the rehearsal's one tier.
    const mover = seatMemberId(row, state.toPlay);
    if (mover === null) return { finished: false, detail: "no mover" };

    const turn = chooseTurn(state, TIER, Math.random, { millis: 50 });
    if (turn === null) return { finished: false, detail: "no turn" };

    const token = state.toPlay === STONES.black ? row.blackToken : row.whiteToken;
    let position: GameState = state;
    for (const request of asRequests(turn)) {
      const outcome = await appendMove(id, token, request, { known: position });
      if (!outcome.ok) return { finished: false, detail: `refused: ${outcome.reason}` };
      position = outcome.state;
    }
    known = position;
  }
  return { finished: false, detail: "unfinished after 400 passes" };
}

describe.skipIf(!ASKED)("play a season between test members", () => {
  it(
    run ? "plays it" : "reports only",
    async () => {
    const host = new URL(process.env.DATABASE_URL ?? "postgresql://unknown").host;
    const roster = await prisma.member.findMany({ where: { unclaimableBecause: UNCLAIMABLE_REASONS.test }, select: { id: true, name: true } });
    console.log(`Database: ${host}. Test members available: ${roster.length}.`);
    expect(roster.length, "seed the test members first: TEST_MEMBERS_RUN=1 pnpm exec vitest run src/lib/sim/seedTestMembers.play.test.ts").toBeGreaterThan(1);

    if (!run) {
      console.log(`Report only. Would play ${GAMES} games (seed ${SEED}) among ${roster.length} test members. Set TEST_SEASON_RUN=1 to play.`);
      return;
    }

    const rng = mulberry32(SEED);
    let finished = 0;
    let unfinished = 0;
    const byBoard = new Map<string, number>();

    for (let g = 0; g < GAMES; g += 1) {
      const a = roster[uniformInt(rng, 0, roster.length - 1)];
      let b = roster[uniformInt(rng, 0, roster.length - 1)];
      // A game needs two different seats; redraw the once-in-a-thousand self-pairing.
      for (let attempt = 0; attempt < 5 && b.id === a.id; attempt += 1) b = roster[uniformInt(rng, 0, roster.length - 1)];
      if (b.id === a.id) continue;

      const board = BOARDS[uniformInt(rng, 0, BOARDS.length - 1)];
      const blackFirst = rng() < 0.5;
      const black = blackFirst ? a : b;
      const white = blackFirst ? b : a;

      const created = await createLiveGame({
        variant: board.variant,
        size: board.size,
        winLength: board.winLength,
        opener: STONES.black,
        blackName: black.name,
        whiteName: white.name,
        blackMemberId: black.id,
        whiteMemberId: white.id,
        obstacles: DEFAULT_SETTINGS.obstacles,
        opening: DEFAULT_SETTINGS.opening,
        handicap: DEFAULT_SETTINGS.handicap,
        headStart: DEFAULT_SETTINGS.headStart,
        drawLimit: DEFAULT_SETTINGS.drawLimit,
        ...SEASON_SETTINGS,
      });

      const played = await playSeasonGame(created.id);
      if (played.finished) finished += 1;
      else unfinished += 1;
      byBoard.set(board.variant, (byBoard.get(board.variant) ?? 0) + 1);

      if ((g + 1) % 200 === 0) console.log(`${g + 1}/${GAMES} played...`);
    }

    console.log(`Season done on ${host}: ${finished} finished, ${unfinished} unfinished, of ${GAMES} attempted.`);
    console.log(`By board: ${[...byBoard.entries()].map(([variant, count]) => `${variant}=${count}`).join(", ")}`);
    expect(finished).toBeGreaterThan(0);
    },
    // A season is minutes, not the default 60 seconds; a timeout mid-game strands a row.
    30 * 60_000,
  );
});
