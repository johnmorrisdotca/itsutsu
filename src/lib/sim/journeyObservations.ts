import type { JourneySimResult, RoleSummary } from "./journeys.types";

function summaryOf(result: JourneySimResult, key: string): RoleSummary | undefined {
  return result.roles.find((r) => r.role.key === key);
}

function roleName(result: JourneySimResult, key: string): string {
  return summaryOf(result, key)?.role.name ?? key;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** "a" or "an", read off the word that follows — every role name here is plain English, never a proper noun needing its own rule. */
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

/**
 * FIVE TO EIGHT HONEST SENTENCES, read off the actual run rather than typed
 * as prose that could drift from the model. Every number here comes from
 * `result` itself, so a future change to `journeyRoles.constants.ts` changes
 * what this says along with it, rather than leaving a stale claim on the page
 * — the same reasoning `xp.constants.ts` gives for counting games in words
 * instead of writing "forty-four".
 */
export function journeyObservations(result: JourneySimResult): string[] {
  const out: string[] = [];

  const ipLeader = result.ipTop10ThisMonth[0];
  const xpLeader = result.xpTop10ThisMonth[0];
  if (ipLeader !== undefined && xpLeader !== undefined) {
    out.push(
      ipLeader.index === xpLeader.index
        ? `This month, the same simulated player (${roleName(result, ipLeader.roleKey)}) leads both the IP and the XP board — the exception rather than the rule; see the next points.`
        : `This month's IP leader is ${article(roleName(result, ipLeader.roleKey))} ${roleName(result, ipLeader.roleKey)} and the XP leader is ${article(roleName(result, xpLeader.roleKey))} ${roleName(result, xpLeader.roleKey)} — two different people. The two boards really do measure different things.`,
    );
  }

  const grinderOnIpBoard = result.ipTop10ThisMonth.some((row) => row.roleKey === "grinder");
  out.push(
    grinderOnIpBoard
      ? "A Grinder does reach this month's IP top 10 in this run — an unusually strong run of results, since Grinder plays the site's two lowest-value games."
      : "No Grinder reaches this month's IP top 10, even though Grinder plays more games than any other role: tic-tac-toe and Drop Four are priced at a tenth to two-thirds of Gomoku, so volume alone cannot buy a place on the IP board.",
  );

  const eliteXpTop = result.xpTop10.some((row) => row.roleKey === "elite");
  out.push(
    eliteXpTop
      ? "Elite players do appear on the all-time XP board, not only the IP one: playing widely and rarely missing a day pays in both currencies at once."
      : "No Elite player reaches the all-time XP top 10: playing fewer, harder games caps how much XP even a highly active Elite player can rack up compared to a high-volume role.",
  );

  const lowVolumeKeys = ["occasional", "newcomer"];
  const lowVolumeOnAnyBoard = [...result.ipTop10ThisMonth, ...result.xpTop10ThisMonth, ...result.ipTop10, ...result.xpTop10].some((row) =>
    lowVolumeKeys.includes(row.roleKey),
  );
  out.push(
    lowVolumeOnAnyBoard
      ? "An Occasional or Newcomer player does turn up on a top-10 board somewhere in this run — a reminder that a lucky run of results can carry even an infrequent player onto a leaderboard."
      : "No Occasional or Newcomer player reaches any top-10 board, this month or all time: showing up once or twice a month, or joining half the year late, is not enough volume to compete with daily play, whatever the result.",
  );

  const butterfly = summaryOf(result, "socialButterfly");
  const boardOnly = summaryOf(result, "boardGamesOnly");
  if (butterfly !== undefined && boardOnly !== undefined) {
    out.push(
      `Social Butterfly's XP-to-IP ratio (${butterfly.medianXpToIpRatio.toFixed(1)}) is well above Board Games Only's (${boardOnly.medianXpToIpRatio.toFixed(1)}): buddies, applause and game offers pay real XP for a role that plays comparatively few games, exactly as XP is meant to reward more than results.`,
    );
  }

  const grinder = summaryOf(result, "grinder");
  const goPlayer = summaryOf(result, "goPlayer");
  if (grinder !== undefined && goPlayer !== undefined) {
    out.push(
      `Grinder's XP-to-IP ratio (${grinder.medianXpToIpRatio.toFixed(1)}) is the highest of all eighteen roles, well past Social Butterfly's — not from being sociable, but because the win-count milestones (ten wins, a hundred wins…) are priced flat per game and do not discount for a cheap game the way IP does. Go Player's ratio (${goPlayer.medianXpToIpRatio.toFixed(1)}) is the lowest, for the mirror reason: Go pays the most IP per game of anything modelled, so its XP and IP climb together instead of one running away from the other.`,
    );
  }

  const fullParticipant = summaryOf(result, "fullParticipant");
  const gomokuOnly = summaryOf(result, "gomokuOnly");
  if (fullParticipant !== undefined && gomokuOnly !== undefined) {
    const fpXp = fullParticipant.atMonth[12].xp.p50;
    const goXp = gomokuOnly.atMonth[12].xp.p50;
    const fpIp = fullParticipant.atMonth[12].ip.p50;
    const goIp = gomokuOnly.atMonth[12].ip.p50;
    out.push(
      `At twelve months, Full Participant's median XP (${fmt(fpXp)}) is ${fpXp > goXp ? "ahead of" : "behind"} Gomoku Only's (${fmt(goXp)}) — playing every family adds up — but its median IP (${fmt(fpIp)}) is ${fpIp > goIp ? "still ahead of" : "not ahead of"} Gomoku Only's (${fmt(goIp)}): spreading across eight games thins out how often any one of them is played.`,
    );
  }

  const puzzleOnly = ["wordGamesOnly", "numbersSolver"].map((key) => summaryOf(result, key)).filter((s): s is RoleSummary => s !== undefined);
  if (puzzleOnly.length === 2) {
    out.push(
      `Neither puzzle-only role ever appears on a game's own IP board, because neither plays a two-player game — their IP comes entirely from ${roleName(result, "wordGamesOnly")}'s word puzzle and ${roleName(result, "numbersSolver")}'s number grids, which is exactly the separation the games-vs-puzzles IP design intends.`,
    );
  }

  return out;
}
