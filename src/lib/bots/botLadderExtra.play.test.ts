/**
 * The graded ladder's round robin, played out on the two boards the first
 * batch (`botSeries.play.test.ts`) did not cover: Halma and Checkers. Same
 * shape, same machinery — `createLiveGame` and `playBotTurns` called in
 * process, exactly as AGENTS.md's "Bulk Play Runs Here, Never Through the
 * Site" describes — extended to a slice of variant coverage rather than a
 * rewrite of it.
 *
 * RATED, ON PURPOSE, WHICH IS THE OPPOSITE OF THE FIRST BATCH'S CHOICE —
 * and the reason is that the ground under that choice moved. `rated: false`
 * made sense before "a ladder for the programs" existed, when rating a
 * computer meant rating it somewhere: there was one ladder, and putting a
 * bot's game on it would have buried nineteen real games under a few dozen
 * exhibition ones. That is no longer the only ladder there is.
 *
 * `recordResult` (rating/players.ts) only ever runs when `row.rated` is
 * true — an unrated game updates no column, human or computer. And the pool
 * it writes into is `poolFor(hasBotSeat(row))`, where `hasBotSeat` is true
 * the moment EITHER seat is a bot (bots.ts) — so a bot-versus-bot game can
 * only ever be a `"computer"`-pool game. `poolWrite` (rating/pools.ts) then
 * only ever touches that pool's own columns — `computerRating`,
 * `computerRatedGames`, and so on, both in `Player` and per variant in
 * `PlayerVariantRating` via `recordVariantResult`. The human columns
 * (`rating`, `ratedGames`, ...) are a different set of columns that this
 * code path never names. So `rated: true` here is not a risk to the human
 * ladder — it is structurally incapable of reaching it — and it is the ONLY
 * way these games reach the "ladder for the programs" the site now has,
 * which was built to read exactly this: real bot-versus-bot results, kept in
 * their own pool.
 *
 * Reports and changes nothing until it is given --run:
 *
 *   BOT_LADDER_EXTRA=1 pnpm test:unit src/lib/bots/botLadderExtra.play.test.ts
 *   BOT_LADDER_EXTRA=1 BOT_LADDER_EXTRA_RUN=1 pnpm test:unit src/lib/bots/botLadderExtra.play.test.ts
 *
 * `BOT_LADDER_EXTRA_EACH` (default 4, matching the density the peer's own
 * batch used for Gomoku/Reversi/Connect Four) sets games per pairing,
 * colours swapped down the run the same way `botSeries.play.test.ts` does it.
 */
import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { playBotTurns } from "@/lib/bots/botPlay";
import { createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";
import { BOT_TIERS } from "@/lib/gomoku/opponent.constants";
import { DEFAULT_SETTINGS, STONES, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const ASKED = process.env.BOT_LADDER_EXTRA === "1";
const run = process.env.BOT_LADDER_EXTRA_RUN === "1";
/** How many games each pairing plays. Colours alternate, so an even count is fairest. */
const each = Math.max(1, Number(process.env.BOT_LADDER_EXTRA_EACH ?? "4"));

const LADDER: BotTier[] = [BOT_TIERS.razryad, BOT_TIERS.kyu, BOT_TIERS.dan, BOT_TIERS.meijin, BOT_TIERS.guoshou];

/**
 * Halma and Checkers only — no specialist plays either, the same reason
 * `botSeries.play.test.ts` keeps them off boards they have not studied: away
 * from Reversi or five in a row they are 国手 under another name, and a
 * second 国手 game tells nobody anything a first one did not.
 */
const BOARDS: { variant: RuleVariant; size: number }[] = [
  { variant: "halma" as RuleVariant, size: boardSizesFor("halma" as RuleVariant)[0] },
  { variant: "checkers" as RuleVariant, size: boardSizesFor("checkers" as RuleVariant)[0] },
];

type Match = { variant: RuleVariant; size: number; black: BotTier; white: BotTier };

function ladderMatches(): Match[] {
  const out: Match[] = [];
  for (const board of BOARDS) {
    for (let i = 0; i < LADDER.length; i += 1) {
      for (let j = i + 1; j < LADDER.length; j += 1) {
        for (let n = 0; n < each; n += 1) {
          const firstIsBlack = n % 2 === 0;
          out.push({
            ...board,
            black: firstIsBlack ? LADDER[i] : LADDER[j],
            white: firstIsBlack ? LADDER[j] : LADDER[i],
          });
        }
      }
    }
  }
  return out;
}

const matches = ladderMatches();

/** Calls the same turn-taker a live request does, until the game stops being active. */
async function playOut(id: string): Promise<string> {
  // Bounded: playBotTurns takes a limited number of turns per call by design,
  // so this asks repeatedly. A game that never settles is a bug, not a long
  // game, and the cap here says so rather than hanging.
  for (let pass = 0; pass < 400; pass += 1) {
    const row = await prisma.game.findUnique({ where: { id }, select: { status: true, moveCount: true } });
    if (row === null) return "vanished";
    if (row.status !== "active") return `${row.status} after ${row.moveCount} moves`;
    const before = row.moveCount;
    await playBotTurns(id);
    const after = await prisma.game.findUnique({ where: { id }, select: { status: true, moveCount: true } });
    if (after === null) return "vanished";
    if (after.status !== "active") return `${after.status} after ${after.moveCount} moves`;
    // Nothing moved: the players are refusing rather than thinking, and asking
    // again would spin for ever.
    if (after.moveCount === before) return `stuck at ${after.moveCount} moves`;
  }
  return "unfinished";
}

describe("the ladder's round robin, on the boards the first batch skipped", () => {
  it.skipIf(!ASKED)("plays them", async () => {
    console.log(`${matches.length} game(s) to play, rated into the computer pool only.`);
    for (const m of matches) {
      console.log(`  ${m.variant} ${m.size}x${m.size}: ${BOT_MEMBERS[m.black].name} (black) vs ${BOT_MEMBERS[m.white].name}`);
    }

    if (!run) {
      console.log("\nReport only — nothing written. Set BOT_LADDER_EXTRA_RUN=1 to play them.");
      await prisma.$disconnect();
      return;
    }

    await ensureBotMembers();

    let played = 0;
    for (const m of matches) {
      const black = BOT_MEMBERS[m.black];
      const white = BOT_MEMBERS[m.white];
      const spec = VARIANT_SPECS[m.variant];
      const created = await createLiveGame({
        variant: m.variant,
        size: m.size,
        winLength: spec.winLength ?? DEFAULT_SETTINGS.winLength,
        opener: STONES.black,
        blackName: black.name,
        whiteName: white.name,
        blackMemberId: black.id,
        whiteMemberId: white.id,
        obstacles: DEFAULT_SETTINGS.obstacles,
        opening: DEFAULT_SETTINGS.opening,
        handicap: DEFAULT_SETTINGS.handicap,
        drawLimit: DEFAULT_SETTINGS.drawLimit,
        // No clock: nobody is waiting, and a deadline would end these on time
        // rather than on the board.
        moveTimeMs: null,
        open: false,
        // See the file header: this can only ever move the computer pool.
        rated: true,
        timeoutPenalty: "turn",
        allowResign: true,
      });
      const outcome = await playOut(created.id);
      played += 1;
      console.log(`  /games/${m.variant}/${created.id}  ${black.name} vs ${white.name} — ${outcome}`);
    }

    console.log(`\nPlayed ${played} game(s), rated into the computer pool. Open one at /games/<variant>/<id>.`);
    expect(played).toBe(matches.length);
    await prisma.$disconnect();
  }, 3_600_000);
});
