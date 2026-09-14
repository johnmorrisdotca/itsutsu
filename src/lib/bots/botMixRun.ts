import "server-only";

import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { matchPath } from "@/lib/gomoku/slugs";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { MIX_ALL_PLAYERS, isUndefeated, mixSeedFrom, planMix } from "./botMix";
import type { MixFacts, MixMatch, MixPlan, MixRecord } from "./botMix.types";
import { ensureBotMembers } from "./botMembers";
import { RATED_WORD, createSeriesGame, playOut } from "./botSeriesGame";
import {
  BOT_MEMBERS,
  BOT_MEMBER_LIST,
  MIX_LEFT_OUT,
  MIX_SIZE_CAPS,
  MIX_UNDEFEATED_GAMES,
  MIX_UNPLAYED_GAMES,
} from "./bots.constants";

/**
 * The mixed plan's half that touches a database: read the facts, print the
 * plan, and — only when asked twice — play it. The plan itself is decided by
 * the pure `planMix`, so what this prints in report-only mode is exactly what
 * the writing run plays, given the same seed and the same database.
 */

const KNOWN = new Set<string>(RULE_VARIANT_LIST);

/** How many finished games each game has, and every computer player's rated record. */
export async function readMixFacts(): Promise<MixFacts> {
  const finished = await prisma.game.groupBy({
    by: ["variant"],
    // A declined or withdrawn offer is not a game anybody played, and must not hide an unplayed one.
    where: { status: "finished", ...NOT_A_REFUSED_OFFER },
    _count: { _all: true },
  });
  const finishedByVariant: Partial<Record<RuleVariant, number>> = {};
  for (const row of finished) {
    if (KNOWN.has(row.variant)) finishedByVariant[row.variant as RuleVariant] = row._count._all;
  }

  /*
   * A computer player's record hangs off its member id; the folded name is
   * asked as well, for a row written before the id was attached. Both pools
   * are summed, though a program only ever plays in the computer pool — a
   * figure in the other one would be a loss too, and must not be missed.
   */
  const ids = BOT_MEMBER_LIST.map((bot) => bot.id);
  const keys = BOT_MEMBER_LIST.map((bot) => playerKey(bot.name));
  const who = { OR: [{ memberId: { in: ids } }, { key: { in: keys } }] };
  const [players, standings] = await Promise.all([
    prisma.player.findMany({
      where: who,
      select: {
        key: true,
        memberId: true,
        ratedGames: true,
        wins: true,
        losses: true,
        draws: true,
        computerRatedGames: true,
        computerWins: true,
        computerLosses: true,
        computerDraws: true,
      },
    }),
    prisma.playerVariantRating.findMany({
      where: { AND: [who, { OR: [{ ratedGames: { gt: 0 } }, { computerRatedGames: { gt: 0 } }] }] },
      select: { key: true, memberId: true, variant: true },
    }),
  ]);

  const records: MixRecord[] = BOT_MEMBER_LIST.map((bot) => {
    const mine = (row: { key: string; memberId: string | null }) =>
      row.memberId === bot.id || row.key === playerKey(bot.name);
    const rows = players.filter(mine);
    const sum = (pick: (row: (typeof rows)[number]) => number) => rows.reduce((total, row) => total + pick(row), 0);
    const variants = [...new Set(standings.filter(mine).map((row) => row.variant))].filter((one) => KNOWN.has(one));
    return {
      tier: bot.tier,
      ratedGames: sum((row) => row.ratedGames + row.computerRatedGames),
      wins: sum((row) => row.wins + row.computerWins),
      losses: sum((row) => row.losses + row.computerLosses),
      draws: sum((row) => row.draws + row.computerDraws),
      variants: variants as RuleVariant[],
    };
  });
  return { finishedByVariant, records };
}

/**
 * The database actually reached, from the database itself.
 *
 * Asked of the server rather than read off the command line: `.env` has
 * silently overridden an inline DATABASE_URL in this project before, so the
 * environment is a claim and the connection is the fact.
 */
async function whereAmI(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ database: string; host: string | null; port: number | null }[]>`
    select current_database() as database, host(inet_server_addr()) as host, inet_server_port() as port`;
  let named = "";
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    named = ` (DATABASE_URL names ${url.hostname}${url.port === "" ? "" : `:${url.port}`})`;
  } catch {
    named = " (DATABASE_URL is not in this process's environment)";
  }
  return `database "${row.database}" at ${row.host ?? "a local socket"}:${row.port ?? "?"}${named}`;
}

function name(tier: BotTier): string {
  return BOT_MEMBERS[tier].name;
}

function record(one: MixRecord): string {
  return `${one.wins} won, ${one.losses} lost, ${one.draws} drawn`;
}

function describeMatch(m: MixMatch): string {
  const why = m.why.kind === "unplayed" ? "unplayed  " : `undefeated (${name(m.why.tier)})`;
  return `${m.variant} ${m.size}x${m.size}: ${name(m.black)} (black) vs ${name(m.white)} (white) — ${why}`;
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function printFacts(facts: MixFacts, plan: MixPlan): void {
  console.log("Finished games per game, as read:");
  const counts = RULE_VARIANT_LIST.map((variant) => `${variant} ${facts.finishedByVariant[variant] ?? 0}`);
  for (let at = 0; at < counts.length; at += 6) console.log(`  ${counts.slice(at, at + 6).join(" · ")}`);
  console.log(`\n${plan.unplayed.length} game(s) with no finished games: ${plan.unplayed.join(", ") || "none"}.`);
  for (const one of plan.unplayedLeftOut) console.log(`  LEFT OUT ${one.variant}: ${one.reason}`);
  for (const cap of MIX_SIZE_CAPS) {
    const whom = cap.tiers === undefined ? "for anybody" : `with ${cap.tiers.map(name).join(", ")} in either seat`;
    console.log(`  NOT DRAWN ${cap.variant} ${cap.size}x${cap.size} ${whom}: ${cap.reason}`);
  }

  console.log("\nComputer players' rated records, as read:");
  for (const one of facts.records) {
    const tag = isUndefeated(one) ? "  ← undefeated" : "";
    console.log(`  ${name(one.tier)}: ${record(one)}${tag}`);
  }
  for (const one of plan.undefeated) {
    console.log(
      `  ${name(one.record.tier)} is sent to ${one.sentTo} game(s) away from: ${one.awayFrom.join(", ") || "nothing"}`,
    );
  }
}

export type MixRunOptions = {
  run: boolean;
  seedText: string | undefined;
  /** Who may be drawn; the runner's BOT_GAMES_TIERS when given, else all seven. */
  players?: readonly BotTier[];
  undefeatedGames?: number;
  /** Play only the first N games of the plan — for a rehearsal, and said out loud. */
  limit?: number;
};

export async function runMix(options: MixRunOptions): Promise<{ planned: number; played: number; finished: number }> {
  const seed = mixSeedFrom(options.seedText, Math.random());
  const given = options.seedText !== undefined && options.seedText.trim() !== "";
  console.log(`\nMIXED PLAN — seed ${seed}${given ? " (as given)" : " (drawn now)"}. BOT_GAMES_SEED=${seed} plans exactly this again.`);

  const [where, held] = await Promise.all([whereAmI(), prisma.game.count()]);
  console.log(`Reached ${where}, holding ${held} game(s). If that is not the one you meant, stop now.\n`);

  const facts = await readMixFacts();
  const plan = planMix(facts, {
    seed,
    players: options.players ?? MIX_ALL_PLAYERS,
    unplayedGames: MIX_UNPLAYED_GAMES,
    undefeatedGames: options.undefeatedGames ?? MIX_UNDEFEATED_GAMES,
    leftOut: MIX_LEFT_OUT,
    sizeCaps: MIX_SIZE_CAPS,
  });
  printFacts(facts, plan);

  const limit = options.limit ?? plan.matches.length;
  const playing = plan.matches.slice(0, limit);
  console.log(`\nThe plan: ${plan.matches.length} ${RATED_WORD} game(s).`);
  plan.matches.forEach((m, at) => {
    const skipped = at >= limit ? "   [beyond BOT_GAMES_LIMIT, not played]" : "";
    console.log(`  ${String(at + 1).padStart(3)}. ${describeMatch(m)}${skipped}`);
  });

  if (!options.run) {
    console.log("\nReport only — nothing written. Set BOT_GAMES_RUN=1, with this seed, to play exactly this plan.");
    return { planned: plan.matches.length, played: 0, finished: 0 };
  }
  if (limit < plan.matches.length) {
    console.log(`\nBOT_GAMES_LIMIT=${limit}: playing the first ${limit} of ${plan.matches.length}.`);
  }

  await ensureBotMembers();
  const started = Date.now();
  const notFinished: string[] = [];
  const results: Record<string, number> = {};
  const away: Partial<Record<BotTier, { won: number; lost: number; drawn: number; open: number }>> = {};
  let played = 0;
  let finished = 0;
  console.log("");
  for (const [at, m] of playing.entries()) {
    const t0 = Date.now();
    let outcome: { finished: boolean; detail: string; result: string | null };
    let path = "(no game written)";
    try {
      const created = await createSeriesGame(m);
      path = matchPath(m.variant, created.id);
      outcome = await playOut(created.id);
    } catch (error) {
      outcome = { finished: false, detail: `failed: ${error instanceof Error ? error.message : String(error)}`, result: null };
    }
    played += 1;
    const took = Date.now() - t0;
    if (outcome.finished) {
      finished += 1;
      results[outcome.result ?? "?"] = (results[outcome.result ?? "?"] ?? 0) + 1;
    } else {
      notFinished.push(`${m.variant} ${m.size}x${m.size} ${path} — ${outcome.detail}`);
    }
    if (m.why.kind === "undefeated") {
      const tally = (away[m.why.tier] ??= { won: 0, lost: 0, drawn: 0, open: 0 });
      const seat = m.black === m.why.tier ? "black" : "white";
      if (!outcome.finished) tally.open += 1;
      else if (outcome.result === "draw") tally.drawn += 1;
      else if (outcome.result === seat) tally.won += 1;
      else tally.lost += 1;
    }
    const line = `  [${at + 1}/${playing.length}] ${path}  ${m.variant} ${m.size}x${m.size}  ${name(m.black)} vs ${name(m.white)} — ${outcome.detail}${outcome.result === null ? "" : `, ${outcome.result}`} (${seconds(took)})`;
    console.log(line);
  }

  const total = Date.now() - started;
  console.log(`\nSUMMARY — seed ${seed}`);
  console.log(`  planned ${plan.matches.length}, played ${played}, finished ${finished}, not finished ${played - finished}`);
  console.log(`  results: black ${results.black ?? 0}, white ${results.white ?? 0}, draw ${results.draw ?? 0}`);
  for (const reason of notFinished) console.log(`  NOT FINISHED ${reason}`);
  for (const [tier, tally] of Object.entries(away)) {
    console.log(
      `  ${name(tier as BotTier)} away from home: won ${tally.won}, lost ${tally.lost}, drawn ${tally.drawn}${tally.open > 0 ? `, unfinished ${tally.open}` : ""}`,
    );
  }
  console.log(`  took ${seconds(total)}, ${played === 0 ? "–" : seconds(total / played)} a game. All ${RATED_WORD}.`);
  return { planned: plan.matches.length, played, finished };
}
