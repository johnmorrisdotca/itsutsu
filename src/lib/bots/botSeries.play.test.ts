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
 * RATED, and that is the point rather than a detail. `liveGame.ts` only records
 * a result when the row says rated, so an unrated batch plays out perfectly,
 * files perfectly, and leaves the computer ladder exactly as empty as it found
 * it. It is safe because the pool is decided by the SEATS: two programs make a
 * computer-pool game, which moves the ratings the computer ladder reads and can
 * never touch where a person stands among people.
 *
 * It writes to whatever database it is pointed at, so it reports and changes
 * nothing until it is asked twice, and it prints how many games that database
 * already holds before writing a single one.
 *
 * A TOOL RATHER THAN A ONE-OFF. Everything about a run is an option, so
 * answering a new question is a different command rather than a different
 * file:
 *
 *   pnpm bots:play                                  report only
 *   BOT_GAMES_RUN=1 pnpm bots:play                  play them
 *   BOT_GAMES_ALL=1                                 every pairing, not just the specialists
 *   BOT_GAMES_EACH=4                                games per pairing; colours alternate,
 *                                                   so an even number is the fair one
 *   BOT_GAMES_TIERS=kyu,dan,meijin                  who plays; default is the five grades
 *   BOT_GAMES_BOARDS=freestyle:15,reversi:8         which boards; a size may be left off
 *                                                   and the game's own is used
 *   DATABASE_URL=postgres://…                       which database
 *
 *   BOT_GAMES_MIX=1                                 a mixed plan instead: every game with no
 *                                                   finished games, one or two games each,
 *                                                   and every undefeated computer player sent
 *                                                   away from home — drawn at random from all
 *                                                   seven players. See `botMix.ts`.
 *   BOT_GAMES_SEED=20260914                         the mixed plan's seed; drawn and printed
 *                                                   when not given, so a report-only run and
 *                                                   the writing run can play the same plan
 *   BOT_GAMES_UNDEFEATED=3                          away games per undefeated player
 *   BOT_GAMES_LIMIT=5                               play only the first N of the printed plan
 *
 * It is a vitest file because a plain script cannot resolve the app's own `@/`
 * paths, and it does nothing at all unless BOT_GAMES=1 — which `pnpm bots:play`
 * sets, along with the flag that stops vitest swallowing its output.
 *
 * Nothing is written without BOT_GAMES_RUN=1.
 */
import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { runMix } from "@/lib/bots/botMixRun";
import { RATED_WORD, createSeriesGame, playOut } from "@/lib/bots/botSeriesGame";
import { prisma } from "@/lib/prisma";
import { BOT_ALL_TIERS, BOT_TIERS, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { boardSizesFor, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { matchPath, variantFor } from "@/lib/gomoku/slugs";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const ASKED = process.env.BOT_GAMES === "1";
const run = process.env.BOT_GAMES_RUN === "1";
const all = process.env.BOT_GAMES_ALL === "1";
/** How many games each pairing plays. Colours alternate, so an even count is fairest. */
const each = Math.max(1, Number(process.env.BOT_GAMES_EACH ?? "1"));

/**
 * THE MIXED PLAN, instead of the round-robins: `BOT_GAMES_MIX=1`.
 *
 *   BOT_GAMES_SEED=123456        the plan's randomness; drawn and printed when not given
 *   BOT_GAMES_UNDEFEATED=3       games each undefeated computer player is sent to
 *   BOT_GAMES_LIMIT=5            play only the first N of the printed plan (a rehearsal)
 *   BOT_GAMES_TIERS=…            who may be drawn; default is all seven
 *
 * Every game nobody here has finished gets one or two games between two
 * computer players drawn at random, and every undefeated computer player is
 * sent to a few games away from home. `botMix.ts` decides the plan from the
 * database's own counts and the seed; `botMixRun.ts` prints it and plays it.
 * The games are written by the same `createSeriesGame` and played by the same
 * `playOut` as the round-robins below.
 */
const mix = process.env.BOT_GAMES_MIX === "1";

/** A whole-number option, or undefined when not given. A value that is given and unreadable stops the run. */
function wholeNumber(name: string, least: number): number | undefined {
  const text = process.env[name];
  if (text === undefined || text.trim() === "") return undefined;
  const value = Number(text.trim());
  if (!Number.isInteger(value) || value < least) {
    throw new Error(`${name} must be a whole number of at least ${least}, not "${text}".`);
  }
  return value;
}

/*
 * What every game in a batch is — rated, no clock, nobody posted — lives in
 * `botSeriesGame.ts` as `SERIES`, with the reasoning, because the mixed plan
 * writes its games through the same door.
 */

/**
 * Which players, and which boards. Both are options; both have a default that
 * is a considered answer rather than a placeholder.
 *
 * The default ladder is the five grades in order. The default boards are three
 * deliberately unalike games: the ladder report measured that Gomoku separates
 * the lower grades and flattens at the top, Connect Four separates cleanly, and
 * Reversi is where the order was measured BACKWARDS until 0.149.0 — the grades
 * that search lost, because nothing searched a flipping board at all. It no
 * longer inverts (段 0-30 名人, see `ladder.order.test.ts`), and it is still the
 * board that is thinnest at both ends: 名人 and 国手 finish the same depth
 * inside the look-ahead's budget and are one player there, and the three
 * grades that do not search are told apart only by their noise and blunders,
 * which a series of two games a pairing cannot see. One game repeated would
 * show one of those behaviours and imply it was all of them.
 *
 * A bad name in either list stops the run before it writes anything. Silently
 * dropping an unrecognised tier would play a smaller series than was asked for
 * and report it as the one that was asked for, which is the sort of answer
 * that is worse than an error.
 */
const DEFAULT_LADDER: BotTier[] = [
  BOT_TIERS.razryad,
  BOT_TIERS.kyu,
  BOT_TIERS.dan,
  BOT_TIERS.meijin,
  BOT_TIERS.guoshou,
];

const DEFAULT_BOARDS = "freestyle:15,reversi:8,dropFour:7";

/** A comma-separated option, with the empty string meaning "not given". */
function listed(value: string | undefined): string[] {
  return (value ?? "").split(",").map((one) => one.trim()).filter((one) => one !== "");
}

function tiersAsked(): BotTier[] {
  const asked = listed(process.env.BOT_GAMES_TIERS);
  if (asked.length === 0) return DEFAULT_LADDER;
  const known = new Set<string>(BOT_ALL_TIERS);
  const wrong = asked.filter((one) => !known.has(one));
  if (wrong.length > 0) {
    throw new Error(
      `BOT_GAMES_TIERS names nobody this site plays as: ${wrong.join(", ")}. Known: ${[...known].join(", ")}`,
    );
  }
  return asked as BotTier[];
}

function boardsAsked(): { variant: RuleVariant; size: number }[] {
  return listed(process.env.BOT_GAMES_BOARDS ?? DEFAULT_BOARDS).map((one) => {
    const [name, size] = one.split(":");
    // A game may be named by its key or by its address slug, because both are
    // written down elsewhere and nobody should have to know which is which.
    const variant = (name in VARIANT_SPECS ? (name as RuleVariant) : variantFor(name));
    if (variant === null || variant === undefined) {
      throw new Error(`BOT_GAMES_BOARDS names a game this site does not have: ${name}`);
    }
    const sizes = boardSizesFor(variant);
    if (size === undefined) return { variant, size: sizes[Math.floor(sizes.length / 2)] };
    const wanted = Number(size);
    if (!sizes.includes(wanted)) {
      throw new Error(`${name} is not played on ${size}×${size}. It plays on: ${sizes.join(", ")}`);
    }
    return { variant, size: wanted };
  });
}

/** Whether the tiers were named, which decides whether the specialists are assumed. */
const TIERS_GIVEN = listed(process.env.BOT_GAMES_TIERS).length > 0;

const LADDER = tiersAsked();
const LADDER_BOARDS = boardsAsked();

type Match = { variant: RuleVariant; size: number; black: BotTier; white: BotTier };

function specialistMatches(): Match[] {
  const out: Match[] = [];
  /*
   * The specialists are assumed unless somebody has said who plays. Naming
   * tiers has to mean ONLY those tiers, or "just kyu against dan" quietly
   * plays two other players as well and the answer is about a different
   * series from the one that was asked for.
   */
  const specialists = [BOT_TIERS.tamenoki, BOT_TIERS.meritalu].filter(
    (one) => !TIERS_GIVEN || LADDER.includes(one),
  );
  for (const specialist of specialists) {
    const studied = TIER_SPECS[specialist].expertise;
    const board = LADDER_BOARDS.find((b) => playsAsExpert(studied, b.variant));
    if (board === undefined) continue;
    for (const other of LADDER.filter((one) => one !== specialist)) {
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
  it.skipIf(!ASKED || !mix)(
    "plays a mixed plan",
    async () => {
      const outcome = await runMix({
        run,
        seedText: process.env.BOT_GAMES_SEED,
        // Named tiers mean ONLY those tiers, as they do for the round-robins.
        players: TIERS_GIVEN ? LADDER : undefined,
        undefeatedGames: wholeNumber("BOT_GAMES_UNDEFEATED", 0),
        limit: wholeNumber("BOT_GAMES_LIMIT", 1),
      });
      await prisma.$disconnect();
      expect(outcome.played).toBe(run ? Math.min(outcome.planned, wholeNumber("BOT_GAMES_LIMIT", 1) ?? outcome.planned) : 0);
    },
    // A live plan is hours, not minutes, and a timeout mid-game strands a row.
    24 * 3_600_000,
  );

  it.skipIf(!ASKED || mix)("plays them", async () => {
    console.log(`${matches.length} ${RATED_WORD} game(s) to play${all ? "" : " (specialists only — set BOT_GAMES_ALL=1 for every pairing)"}.`);
for (const m of matches) {
  console.log(`  ${m.variant} ${m.size}x${m.size}: ${BOT_MEMBERS[m.black].name} (black) vs ${BOT_MEMBERS[m.white].name}`);
}

    if (!run) {
      console.log("\nReport only — nothing written. Set BOT_GAMES_RUN=1 to play them.");
      await prisma.$disconnect();
      return;
    }

    /*
     * Which database this is about to write to, said out loud before it does.
     *
     * `.env` has silently overridden an inline DATABASE_URL in this project
     * before, and the two databases are not close in size — so one count
     * settles what no amount of reading the command line can. Printed rather
     * than asserted: the runner cannot know which one was intended, only the
     * person reading it can, and it stops on nothing.
     */
    const already = await prisma.game.count();
    console.log(`\nConnected to a database holding ${already} game(s). If that is not the one you meant, stop now.\n`);

    await ensureBotMembers();

let played = 0;
for (const m of matches) {
  const black = BOT_MEMBERS[m.black];
  const white = BOT_MEMBERS[m.white];
  // Written and played through `botSeriesGame.ts`, the one door every batch uses.
  const created = await createSeriesGame(m);
  const outcome = await playOut(created.id);
  played += 1;
  console.log(`  ${matchPath(m.variant, created.id)}  ${black.name} vs ${white.name} — ${outcome.detail}`);
}

    console.log(`\nPlayed ${played} game(s), all ${RATED_WORD}. Open one at an address above.`);
    expect(played).toBe(matches.length);
    await prisma.$disconnect();
  }, 3_600_000);
});
