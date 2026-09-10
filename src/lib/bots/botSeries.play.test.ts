/**
 * Plays computer against computer, as real games somebody can open and watch.
 *
 * Every measured table of bot strength so far — the ladder report, the
 * specialists' own series — was played in memory inside a test and thrown
 * away. The numbers were real and the games were not: there was nothing to
 * click into, nothing to step through, and no way to see WHY one player beats
 * another. John asked three times for the games themselves.
 *
 * So these are ordinary rows. They are created the way a live game is created,
 * played by the same code that answers a real request, and read afterwards by
 * the same history pages as anybody's game.
 *
 * UNRATED, DELIBERATELY. `rated: false` means liveGame never records a result
 * against the ladder, so none of this touches the rating pools. That is the
 * whole reason it can run without settling the question of what a computer's
 * rating should mean once computers play each other: there are nineteen real
 * games on this site, and a few dozen of these would not join the computer
 * pool so much as become it. Rating them is an additive decision to make on
 * purpose, later, if it is wanted at all.
 *
 * It writes to the real site, so it reports and changes nothing until it is
 * given --run:
 *
 * Without BOT_GAMES_ALL it plays the specialists at their own boards, which is
 * the small first batch: enough to check the records open and read properly
 * before writing the rest.
 *
 * RUN THE WAY THIS REPO RUNS ON-DEMAND BOT WORK. A plain script cannot reach
 * the app's own modules — node does not resolve the `@/` paths — so this is a
 * vitest file that does nothing at all unless it is asked for, the same shape
 * as the specialists' own match series:
 *
 *   BOT_GAMES=1 pnpm test:unit src/lib/bots/botSeries.play.test.ts
 *   BOT_GAMES=1 BOT_GAMES_RUN=1 pnpm test:unit src/lib/bots/botSeries.play.test.ts
 *   BOT_GAMES=1 BOT_GAMES_RUN=1 BOT_GAMES_ALL=1 pnpm test:unit ...
 *
 * The first reports what it would play. Only the second writes anything.
 */
import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { playBotTurns } from "@/lib/bots/botPlay";
import { createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";
import { BOT_TIERS, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { DEFAULT_SETTINGS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const ASKED = process.env.BOT_GAMES === "1";
const run = process.env.BOT_GAMES_RUN === "1";
const all = process.env.BOT_GAMES_ALL === "1";
/** How many games each pairing plays. Colours alternate, so an even count is fairest. */
const each = Math.max(1, Number(process.env.BOT_GAMES_EACH ?? "1"));

const LADDER: BotTier[] = [BOT_TIERS.razryad, BOT_TIERS.kyu, BOT_TIERS.dan, BOT_TIERS.meijin, BOT_TIERS.guoshou];

/**
 * Which boards a pairing is played on.
 *
 * The specialists only mean anything at their own game — away from it they are
 * 国手 under another name, so a Tamenoki game of Halma would be the same player
 * twice. For the ladder, three unalike boards: the ladder report measured that
 * Gomoku separates the lower grades and flattens at the top, Reversi inverts,
 * and Connect Four separates cleanly. One game repeated would show one of those
 * and imply it was all of them.
 */
const LADDER_BOARDS: { variant: RuleVariant; size: number }[] = [
  { variant: "freestyle" as RuleVariant, size: 15 },
  { variant: "reversi" as RuleVariant, size: 8 },
  { variant: "dropFour" as RuleVariant, size: 7 },
];

type Match = { variant: RuleVariant; size: number; black: BotTier; white: BotTier };

function specialistMatches(): Match[] {
  const out: Match[] = [];
  for (const specialist of [BOT_TIERS.tamenoki, BOT_TIERS.meritalu]) {
    const studied = TIER_SPECS[specialist].expertise;
    const board = LADDER_BOARDS.find((b) => playsAsExpert(studied, b.variant));
    if (board === undefined) continue;
    for (const other of LADDER) {
      /*
       * Colours alternate down the run. The first move is worth something, and
       * a set of records that only ever shows the specialist as black is half
       * an answer — five games as one colour would say more about who opened
       * than about who is stronger.
       */
      for (let n = 0; n < each; n += 1) {
        const specialistIsBlack = n % 2 === 0;
        out.push({
          ...board,
          black: specialistIsBlack ? specialist : other,
          white: specialistIsBlack ? other : specialist,
        });
      }
    }
  }
  return out;
}

function ladderMatches(): Match[] {
  const out: Match[] = [];
  for (const board of LADDER_BOARDS) {
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

const matches = all ? [...specialistMatches(), ...ladderMatches()] : specialistMatches();

describe("computers playing computers, for somebody to watch", () => {
  it.skipIf(!ASKED)("plays them", async () => {
    console.log(`${matches.length} game(s) to play${all ? "" : " (specialists only — set BOT_GAMES_ALL=1 for every pairing)"}.`);
for (const m of matches) {
  console.log(`  ${m.variant} ${m.size}x${m.size}: ${BOT_MEMBERS[m.black].name} (black) vs ${BOT_MEMBERS[m.white].name}`);
}

    if (!run) {
      console.log("\nReport only — nothing written. Set BOT_GAMES_RUN=1 to play them.");
      await prisma.$disconnect();
      return;
    }

    await ensureBotMembers();

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

let played = 0;
for (const m of matches) {
  const black = BOT_MEMBERS[m.black];
  const white = BOT_MEMBERS[m.white];
  const spec = VARIANT_SPECS[m.variant];
  /*
   * Only the fields a live game actually stores. Spreading the engine's
   * DEFAULT_SETTINGS here passed capturesToWin, firstPlayer and the rest,
   * which the row has no columns for — the two types describe different
   * things, and one is not a superset of the other.
   */
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
    rated: false,
    // Nobody can be late and nobody will resign, so these carry the ordinary
    // answers rather than anything special.
    timeoutPenalty: "turn",
    allowResign: true,
  });
  const outcome = await playOut(created.id);
  played += 1;
  console.log(`  /games/${m.variant}/${created.id}  ${black.name} vs ${white.name} — ${outcome}`);
}

    console.log(`\nPlayed ${played} game(s), all unrated. Open one at /games/<variant>/<id>.`);
    expect(played).toBe(matches.length);
    await prisma.$disconnect();
  }, 3_600_000);
});
