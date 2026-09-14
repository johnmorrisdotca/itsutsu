import { addUp } from "@/lib/rating/figures";
import type { LegacyGameRecord, LegacyPlayer, LegacySource } from "@/lib/legacy/legacyPlayers.types";

import { IMPORTED_CLASS_KINDS, IMPORTED_XP_EVENTS, importedTwinFor } from "./importedXp.constants";
import {
  IMPORTED_SKIP_REASONS,
  type HeldImported,
  type ImportedClaim,
  type ImportedClassKind,
  type ImportedPayment,
  type ImportedPlan,
  type ImportedSkip,
  type ImportedXpReckoning,
  type ImportedXpRules,
} from "./importedXp.types";
import { XP_EVENT_SPECS, XP_RESULT_MILESTONES, XP_YEAR_AWARDS, wholeYearsBetween } from "./xp.constants";

/**
 * WHAT A KEPT RECORD FROM ANOTHER SITE IS WORTH IN EXPERIENCE, WORKED OUT
 * WITHOUT A DATABASE.
 *
 * Pure for the reason `backfillXp.ts` is: the one thing this has to be is
 * checkable against a table of cases, and a rule whose answer depends on a row
 * cannot be. `importedXpPay.ts` is the half that reads the ledger and writes it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY IT IS A SUM AND NOT A REPLAY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The site's own backfill replays games oldest first, because firsts and
 * streaks are ordered facts. A kept record has no games to replay: per site and
 * per class of play it holds four totals — won, lost, drawn — a by-game
 * breakdown where one was copied down, and the dates the person joined and was
 * last seen. So everything here is a count times a price, and nothing that needs
 * an order, a day or an opponent is attempted.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * GAMES FROM THE CLASS RECORDS; MILESTONES FROM THE DETAIL ROWS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A class's `record` is the site's own total, and games and wins are paid from
 * it — the figures `figuresForPlayer` shows. Its `detail` rows are the by-game
 * breakdown "as far as it was recorded", which is the only place a count per
 * game exists, so the milestones at one game read those. Chibi's ItsYourTurn
 * regular games say `detailComplete: false` — the detail sums to less than the
 * record — so his milestones are UNDERSTATED, never overstated: the safe
 * direction, and the only one a partial breakdown allows.
 */

/**
 * WHO EARNS IMPORTED EXPERIENCE. ONE FUNCTION, AND THE RULE IS WRITTEN HERE.
 *
 * John, 2026-09-14: "if you are verified... all people on the site right now
 * are verified."
 *
 * There is no verification anywhere in this code — no column, no flag, no claim
 * flow. What there is, is curation: every kept record is transcribed by hand
 * into `legacyPlayers.data.ts`, from the source site's own pages, and reaches
 * the site only through a reviewed commit. That review IS the verification this
 * site has, so every record in the file is eligible, which is what John said is
 * true today. If a real verification step is ever added, this is the one place
 * it is asked.
 *
 * A record with no games at all earns nothing because it claims nothing — not
 * because it is refused.
 */
export function importedXpEligible(legacy: LegacyPlayer): boolean {
  return legacy.sources.length > 0;
}

/** The kind of play a class of games is, or null for a class this site has not priced. */
export function classKindOf(className: string): ImportedClassKind | null {
  return Object.hasOwn(IMPORTED_CLASS_KINDS, className) ? IMPORTED_CLASS_KINDS[className] : null;
}

/** What one site's classes add up to, by kind. */
type SiteTally = {
  games: Record<ImportedClassKind, number>;
  wins: Record<ImportedClassKind, number>;
  /** Every game at the site, whatever its class — what the years guard counts. */
  allGames: number;
  years: number | null;
  unknown: string[];
};

function tallySite(sources: readonly LegacySource[]): SiteTally {
  const tally: SiteTally = {
    games: { ordinary: 0, tournament: 0 },
    wins: { ordinary: 0, tournament: 0 },
    allGames: 0,
    years: null,
    unknown: [],
  };
  for (const source of sources) {
    for (const row of source.summary) {
      const { won, lost, drawn } = addUp([row.record]);
      tally.allGames += won + lost + drawn;
      const kind = classKindOf(row.class);
      if (kind === null) {
        tally.unknown.push(row.class);
        continue;
      }
      tally.games[kind] += won + lost + drawn;
      tally.wins[kind] += won;
    }
    /* One person with two records at the same site is not a case the data
       holds; if it ever does, the longer span is the true one and the years
       are not added twice. */
    const years = wholeYearsBetween(source.joined, source.lastActive);
    if (years !== null) tally.years = Math.max(tally.years ?? 0, years);
  }
  return tally;
}

/** Every site one person played on, each once, in the order the records first name them. */
function sitesOf(legacies: readonly LegacyPlayer[]): Map<string, LegacySource[]> {
  const sites = new Map<string, LegacySource[]>();
  for (const legacy of legacies) {
    if (!importedXpEligible(legacy)) continue;
    for (const source of legacy.sources) sites.set(source.site, [...(sites.get(source.site) ?? []), source]);
  }
  return sites;
}

/**
 * One person's results per game, as the source sites named the games, across
 * every site and every class — the by-game detail rows, added up by name.
 *
 * By the site's own name, not only where it maps onto one of this site's games:
 * a thousand wins at Backgammon is a thousand wins, whether or not Itsutsu has
 * Backgammon. Two sites calling one game by one name are counted together, and
 * "Backgammon (3 Point)" is not "Backgammon", because the sites said so.
 */
export function resultsPerGame(legacies: readonly LegacyPlayer[]): Map<string, { won: number; lost: number; drawn: number }> {
  const games = new Map<string, { won: number; lost: number; drawn: number }>();
  const add = (row: LegacyGameRecord) => {
    const held = games.get(row.game) ?? { won: 0, lost: 0, drawn: 0 };
    games.set(row.game, { won: held.won + row.won, lost: held.lost + row.lost, drawn: held.drawn + row.drawn });
  };
  for (const sources of sitesOf(legacies).values()) {
    for (const source of sources) {
      for (const row of source.summary) for (const detail of row.detail ?? []) add(detail);
    }
  }
  return games;
}

/** What a count of an outcome reads off one game's results. */
const COUNT_OF = { win: "won", loss: "lost", draw: "drawn" } as const;

/**
 * What one person's kept records come to under a setting.
 *
 * A claim is only made where it comes to something: a setting that pays no
 * years makes no year claims, rather than claims for nought that a ledger would
 * have to decide what to do with.
 *
 * A TOURNAMENT AT 1.5 TIMES IS 37.5 A GAME, and the ledger holds whole points —
 * so the multiple is applied to the whole claim and rounded once, half up, per
 * site. Rounding per game would round 1,025 halves 1,025 times.
 */
export function importedXpFor(legacies: readonly LegacyPlayer[], rules: ImportedXpRules): ImportedXpReckoning {
  const claims: ImportedClaim[] = [];
  const unknownClasses: { site: string; className: string }[] = [];
  const claim = (one: ImportedClaim) => {
    if (one.points > 0) claims.push(one);
  };
  const price = (type: keyof typeof XP_EVENT_SPECS) => XP_EVENT_SPECS[type].points;

  for (const [site, sources] of sitesOf(legacies)) {
    const tally = tallySite(sources);
    for (const className of tally.unknown) unknownClasses.push({ site, className });

    claim({ type: IMPORTED_XP_EVENTS.importedGames, stake: site, figure: tally.games.ordinary, points: tally.games.ordinary * rules.game });
    claim({ type: IMPORTED_XP_EVENTS.importedWins, stake: site, figure: tally.wins.ordinary, points: tally.wins.ordinary * rules.win });
    claim({
      type: IMPORTED_XP_EVENTS.importedTournamentGames,
      stake: site,
      figure: tally.games.tournament,
      points: Math.round(tally.games.tournament * rules.game * rules.tournamentMultiple),
    });
    claim({
      type: IMPORTED_XP_EVENTS.importedTournamentWins,
      stake: site,
      figure: tally.wins.tournament,
      points: Math.round(tally.wins.tournament * rules.win * rules.tournamentMultiple),
    });

    /* Years only where they can be measured AND the person really played there. */
    if (rules.years && tally.years !== null && tally.allGames >= XP_YEAR_AWARDS.needGames) {
      const years = tally.years;
      claim({ type: IMPORTED_XP_EVENTS.importedYears, stake: site, figure: years, points: years * price(XP_YEAR_AWARDS.year) });
      for (const milestone of XP_YEAR_AWARDS.milestones) {
        const twin = importedTwinFor(milestone.type);
        if (twin !== null && years >= milestone.years) {
          claim({ type: twin, stake: site, figure: milestone.years, points: price(milestone.type) });
        }
      }
    }
  }

  if (rules.gameMilestones) {
    for (const [game, results] of resultsPerGame(legacies)) {
      for (const milestone of XP_RESULT_MILESTONES) {
        const twin = importedTwinFor(milestone.type);
        /* At least, not exactly: a kept record is a total, not a game arriving. */
        if (twin !== null && results[COUNT_OF[milestone.outcome]] >= milestone.count) {
          claim({ type: twin, stake: game, figure: milestone.count, points: price(milestone.type) });
        }
      }
    }
  }

  return { claims, total: claims.reduce((sum, one) => sum + one.points, 0), unknownClasses };
}

/**
 * The subject a payment is written under: the stake, the figure and the total
 * it pays up to.
 *
 * All three, because the unique index on `(memberId, type, subject)` is what
 * makes a second run pay nothing — and a subject naming only the stake would
 * refuse the difference owed when a record's figures grow, while one naming only
 * the figure would refuse the difference when a setting changes. With both, the
 * same claim twice is one row, and a changed claim is a new row carrying only
 * what it adds.
 */
export function importedSubject(claim: Pick<ImportedClaim, "stake" | "figure" | "points">): string {
  return `${claim.stake}@${claim.figure}=${claim.points}`;
}

/** The stake an imported row's subject names, or null for a subject not written by `importedSubject`. */
export function stakeOfImportedSubject(subject: string): string | null {
  const at = subject.lastIndexOf("@");
  return at <= 0 ? null : subject.slice(0, at);
}

/**
 * What to write, given what is already on the ledger: for each claim, the
 * difference between what it comes to and what that type at that stake has
 * been paid.
 *
 * Pure, and the database's unique index still has the last word — a row the
 * planner thinks is owed and the index refuses is not paid. This only says what
 * a dry run should print and what the payer should ask for.
 */
export function planImportedPay(claims: readonly ImportedClaim[], held: readonly HeldImported[]): ImportedPlan {
  const paying: ImportedPayment[] = [];
  const skipped: ImportedSkip[] = [];

  for (const claim of claims) {
    const paid = held
      .filter((row) => row.type === claim.type && stakeOfImportedSubject(row.subject) === claim.stake)
      .reduce((sum, row) => sum + row.points, 0);
    const owed = claim.points - paid;
    if (owed > 0) {
      paying.push({ type: claim.type, stake: claim.stake, subject: importedSubject(claim), points: owed });
    } else {
      skipped.push({
        type: claim.type,
        stake: claim.stake,
        reason: owed === 0 ? IMPORTED_SKIP_REASONS.alreadyPaid : IMPORTED_SKIP_REASONS.neverTakenBack,
        paid,
        target: claim.points,
      });
    }
  }

  return { paying, skipped, points: paying.reduce((sum, one) => sum + one.points, 0) };
}

/**
 * A site as a sentence names it: "ItsYourTurn.com" reads as "ItsYourTurn".
 * John's own words for them, and the domain adds nothing a reader needs.
 */
export function siteShortName(site: string): string {
  return site.replace(/\.com$/i, "");
}

/**
 * What a justification line says about a person's imported experience: the
 * sites it came from and how many games stand behind it.
 *
 * Read from the kept records rather than the ledger, because the ledger's rows
 * say what was PAID and a reader wants to know what was PLAYED. Sites with no
 * games are left out, the way `wholeRecord` leaves them out.
 */
export function importedPlayedOn(legacies: readonly LegacyPlayer[]): { sites: string[]; games: number } {
  const sites: string[] = [];
  let games = 0;
  for (const [site, sources] of sitesOf(legacies)) {
    const played = tallySite(sources).allGames;
    if (played === 0) continue;
    sites.push(siteShortName(site));
    games += played;
  }
  return { sites, games };
}
