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
 * It is a vitest file because a plain script cannot resolve the app's own `@/`
 * paths, and it does nothing at all unless BOT_GAMES=1 — which `pnpm bots:play`
 * sets, along with the flag that stops vitest swallowing its output.
 *
 * Nothing is written without BOT_GAMES_RUN=1.
 */
import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { playBotTurns } from "@/lib/bots/botPlay";
import { createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";
import { BOT_ALL_TIERS, BOT_TIERS, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { boardSizesFor, DEFAULT_SETTINGS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { variantFor } from "@/lib/gomoku/slugs";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const ASKED = process.env.BOT_GAMES === "1";
const run = process.env.BOT_GAMES_RUN === "1";
const all = process.env.BOT_GAMES_ALL === "1";
/** How many games each pairing plays. Colours alternate, so an even count is fairest. */
const each = Math.max(1, Number(process.env.BOT_GAMES_EACH ?? "1"));

/**
 * Which players, and which boards. Both are options; both have a default that
 * is a considered answer rather than a placeholder.
 *
 * The default ladder is the five grades in order. The default boards are three
 * deliberately unalike games: the ladder report measured that Gomoku separates
 * the lower grades and flattens at the top, Reversi INVERTS — the grades that
 * search lose — and Connect Four separates cleanly. One game repeated would
 * show one of those three behaviours and imply it was all of them.
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
    /*
     * Rated, because an unrated game is invisible to the thing this exists to
     * fill. `liveGame.ts` only calls `recordResult` when the row says rated,
     * so a batch of these written unrated plays out perfectly, files perfectly
     * — and leaves the computer ladder exactly as empty as it found it. That
     * was the first version, and it would have been a hundred and sixty games
     * played to prove nothing.
     *
     * Safe because the pool is decided by the seats, not by this flag: two
     * programs make a computer-pool game, so these move the ratings the
     * computer ladder reads and can never touch where a person stands among
     * people. That separation is the whole point of `poolFor`.
     */
    rated: true,
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
