import { XP_EVENTS, XP_EVENT_SPECS } from "./xp.constants";
import type { XpEventType } from "./xp.types";
import type { ImportedClassKind, ImportedXpRules, ImportedXpType } from "./importedXp.types";

/**
 * WHAT IMPORTED EXPERIENCE IS WORTH — APPROVED BY JOHN, 2026-09-14.
 *
 * John, on the XP board: "people that are imported from other sites should get
 * that XP! ... another reason to use ITS site since we give you credit for other
 * experience." On the amounts: "if we don't have tournament points, add
 * categories for that... they are worth more points perhaps... and every year on
 * a site gives you something like 1000? with a 5 year membership bonus 10000? and
 * a 10 year membership 25000?" And on the package the controller put to him:
 * "If the numbers seem like a good balance, then yes... Tournaments should be 1.5
 * or 2x" — 1.5 is enough, so 1.5 is the setting.
 *
 * APPROVED is the amounts. Paying them on production is a separate word from
 * John, and nothing here does it.
 *
 * Every price is a row of `XP_EVENT_SPECS`, the site's one table of prices; what
 * is here is only what is peculiar to importing. `IMPORTED_XP_CANDIDATES` keeps
 * the settings John chose between, so a change of mind is a one-line change to
 * `IMPORTED_XP_SETTING`, and re-running the payer pays only what the new one adds
 * — it can never take back what an earlier one paid. The per-person figures for
 * every row are printed by `importedXpOptions.play.test.ts`.
 */

/** The type keys, for a caller that must not spell one as a literal. */
export const IMPORTED_XP_EVENTS = {
  importedGames: "importedGames",
  importedWins: "importedWins",
  importedTournamentGames: "importedTournamentGames",
  importedTournamentWins: "importedTournamentWins",
  importedYears: "importedYears",
  importedYears5: "importedYears5",
  importedYears10: "importedYears10",
  importedWins10: "importedWins10",
  importedWins100: "importedWins100",
  importedWins250: "importedWins250",
  importedWins500: "importedWins500",
  importedWins1000: "importedWins1000",
  importedLosses10: "importedLosses10",
  importedLosses50: "importedLosses50",
  importedLosses100: "importedLosses100",
  importedLosses250: "importedLosses250",
  importedLosses500: "importedLosses500",
  importedLosses1000: "importedLosses1000",
  importedDraws10: "importedDraws10",
} as const satisfies Record<ImportedXpType, ImportedXpType>;

/** Every imported type, for a query that has to keep them apart from the Itsutsu ledger. */
export const IMPORTED_XP_TYPES: readonly ImportedXpType[] = Object.values(IMPORTED_XP_EVENTS);

/** Whether a ledger row's type is imported experience rather than experience earned here. */
export function isImportedXpType(type: string): type is ImportedXpType {
  return (IMPORTED_XP_TYPES as readonly string[]).includes(type);
}

/**
 * The Itsutsu award each imported award is the twin of, and takes its price
 * from. The four about game volume have no twin — the site pays a game per game
 * id, and a kept record has no game ids — so their prices are the setting's.
 */
export const IMPORTED_TWIN_OF: Partial<Record<ImportedXpType, XpEventType>> = {
  importedYears: XP_EVENTS.yearHere,
  importedYears5: XP_EVENTS.yearsHere5,
  importedYears10: XP_EVENTS.yearsHere10,
  importedWins10: XP_EVENTS.wins10,
  importedWins100: XP_EVENTS.wins100,
  importedWins250: XP_EVENTS.wins250,
  importedWins500: XP_EVENTS.wins500,
  importedWins1000: XP_EVENTS.wins1000,
  importedLosses10: XP_EVENTS.losses10,
  importedLosses50: XP_EVENTS.losses50,
  importedLosses100: XP_EVENTS.losses100,
  importedLosses250: XP_EVENTS.losses250,
  importedLosses500: XP_EVENTS.losses500,
  importedLosses1000: XP_EVENTS.losses1000,
  importedDraws10: XP_EVENTS.draws10,
};

/** The imported twin of an Itsutsu award, or null for one with none. */
export function importedTwinFor(type: XpEventType): ImportedXpType | null {
  const found = (Object.entries(IMPORTED_TWIN_OF) as [ImportedXpType, XpEventType][]).find(([, twin]) => twin === type);
  return found === undefined ? null : found[0];
}

/** What a member reads about one kind in their history. */
export type ImportedXpSpec = { label: string; kanji: string; blurb: string };

const VOLUME_SPECS: Record<"importedGames" | "importedWins" | "importedTournamentGames" | "importedTournamentWins", ImportedXpSpec> = {
  importedGames: {
    label: "Games played elsewhere",
    kanji: "他局",
    blurb: "Credit for games finished on another site, from the record kept of them here.",
  },
  importedWins: {
    label: "Games won elsewhere",
    kanji: "他勝",
    blurb: "Credit for games won on another site, on top of finishing them.",
  },
  importedTournamentGames: {
    label: "Tournament games elsewhere",
    kanji: "大会",
    blurb: "Credit for tournament games finished on another site, worth more than ordinary play.",
  },
  importedTournamentWins: {
    label: "Tournament wins elsewhere",
    kanji: "大会勝",
    blurb: "Credit for tournament games won on another site.",
  },
};

/**
 * What a member reads about each kind in their history: the four above, and a
 * twin reading as its Itsutsu award does with "elsewhere" beside it — a table
 * of its own, so an imported award can never be looked up as an Itsutsu one.
 * `importedXp.test.ts` checks every type has a row.
 */
export const IMPORTED_XP_SPECS = Object.fromEntries(
  IMPORTED_XP_TYPES.map((type): [ImportedXpType, ImportedXpSpec] => {
    const twin = IMPORTED_TWIN_OF[type];
    if (twin === undefined) return [type, VOLUME_SPECS[type as keyof typeof VOLUME_SPECS]];
    const spec = XP_EVENT_SPECS[twin];
    return [
      type,
      {
        label: `${spec.label}, elsewhere`,
        kanji: spec.kanji,
        blurb: `Counted from a record kept from another site: ${spec.label.toLowerCase()}, there rather than here.`,
      },
    ];
  }),
) as Record<ImportedXpType, ImportedXpSpec>;

/**
 * Which kind of play a source site's class of games is.
 *
 * Every class name in the kept records, and no pattern: a class this table does
 * not name is priced as nothing and listed by the dry run, rather than being
 * matched loosely onto a kind it may not be. `importedXp.test.ts` fails when a
 * kept record carries a class that is not here.
 */
export const IMPORTED_CLASS_KINDS: Record<string, ImportedClassKind> = {
  "Regular games": "ordinary",
  "Friendly games": "ordinary",
  "Ladder games": "ordinary",
  "Tournament games": "tournament",
};

/** The site's own prices for a finish and a win. */
const SITE_GAME = XP_EVENT_SPECS.gameFinished.points;
const SITE_WIN = XP_EVENT_SPECS.gameWon.points;

/**
 * THE SETTINGS JOHN CHOSE BETWEEN, AND THE ONE HE CHOSE.
 *
 * - `approved`: ordinary games at the site's rates with no daily cap, tournaments
 *   at 1.5 times, years on a site, and the milestones at one game.
 * - `tournamentsOnce` and `tournamentsTwice`: the same at 1 and 2 times, the
 *   two ends of what he said, so the knock-on of his choice is visible.
 * - `siteRatesOnly`: games and wins at the site's rates and nothing else — the
 *   baseline he first asked about, "what Chibi and Kyokosan would be under our
 *   current rules".
 */
export const IMPORTED_XP_CANDIDATES = {
  approved: { game: SITE_GAME, win: SITE_WIN, tournamentMultiple: 1.5, years: true, gameMilestones: true },
  tournamentsOnce: { game: SITE_GAME, win: SITE_WIN, tournamentMultiple: 1, years: true, gameMilestones: true },
  tournamentsTwice: { game: SITE_GAME, win: SITE_WIN, tournamentMultiple: 2, years: true, gameMilestones: true },
  siteRatesOnly: { game: SITE_GAME, win: SITE_WIN, tournamentMultiple: 1, years: false, gameMilestones: false },
} as const satisfies Record<string, ImportedXpRules>;

export type ImportedXpCandidate = keyof typeof IMPORTED_XP_CANDIDATES;

/** The setting in force: John's, approved 2026-09-14. */
export const IMPORTED_XP_SETTING: ImportedXpCandidate = "approved";

export const IMPORTED_XP_RULES: ImportedXpRules = IMPORTED_XP_CANDIDATES[IMPORTED_XP_SETTING];
