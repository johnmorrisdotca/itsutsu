import { PUZZLE_SPECS, isCheckAllowance, levelsFor } from "./puzzles.constants";
import type { PuzzleClock, PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { clockFor } from "./puzzleClock";
import { isSeed } from "./random";
import { hadHeadStart, offersHeadStart } from "./gomoji/headStart";
import type { WordCount } from "./gomoji/words.types";
import { wordCountOfSeed } from "./gomoji/wordsSeed";
import { isDodgeSeed, offersDodge } from "./gomoji/dodgeSeed";
import { isBackwardsSeed } from "./gomoji/backwardsSeed";
import { isTsunagiLevel, tsunagiBand } from "./tsunagi/levels";
import type { KumimojiLanguage, KumimojiLength } from "./kumimoji/kumimoji.types";
import { partyPlayersAsked } from "./kumimoji/party";
import { isAnyDeal } from "./solitaire/rules";
import { bonusRuleOfSeed } from "./mahjong/generate";
import { suidoKindOfSeed } from "./suido/seed";
import type { Kind as SuidoKind } from "@johnmorrisdotca/suido";
import type { MahjongBonusRule } from "@johnmorrisdotca/jarajara";
import { tablePlayersAsked } from "@johnmorrisdotca/jarajara/table";

/**
 * What a solve's address says: `/games/<slug>/play?size=9&level=medium&seed=…`.
 *
 * Identity in the path, the choice in the query, as every address here is
 * built. The seed is what makes the address a puzzle rather than a request
 * for one — the same seed is the same grid tomorrow, on another phone, or
 * in the other seat of a race — and it is left out only until the browser
 * has drawn one, which it then writes back into the address.
 */
export type PuzzleAsked = {
  size: number;
  level: PuzzleLevel;
  seed: number | null;
  /** How many times Check may be pressed; null, and left out of the address, for no limit. */
  checks?: number | null;
  /** Whether Hint may be pressed; false, and left out of the address, by default. */
  hints?: boolean;
  /**
   * Gomoji's Strict: every letter found must be played again, a green one in
   * its place. A set-up choice at any level (John, 2026-09-25: "have an option
   * strict mode… right now there are no real options for the game"); false,
   * and left out of the address, by default.
   */
  strict?: boolean;
  /**
   * Gomoji's Head start: keys greyed before the first guess (`headStart.ts`).
   * Easy only; false, and left out of the address, by default and at any
   * other level, whatever the address asked.
   */
  headStart?: boolean;
  /**
   * How many words a Gomoji hides: one, a Futago's two (`futago.ts`, `twins=1`
   * in the address) or a Yotsugo's four (`yotsugo.ts`, `quadruplets=1`).
   * Asked for by the address until a seed is drawn, and from then said by the
   * seed itself (`wordCountOfSeed`), whatever the address says; 1, and left
   * out of the address, for one word and for any puzzle that is not a word.
   */
  words?: WordCount;
  /** Kumimoji's game length; Short is the default. */
  gameLength?: KumimojiLength;
  /** Kumimoji's language; English is the default. */
  language?: KumimojiLanguage;
  /** Kumimoji's second English tile set. */
  doubleSet?: boolean;
  /** Kumimoji's Diagonals: its diagonal runs of three or more are read too (`KumimojiOptions`); false, and left out of the address, by default. */
  diagonals?: boolean;
  /**
   * Kumimoji's pass and play: two to eight people round this device
   * (`party.ts`). Left out, and 1, for the solo game. The names are never in
   * the address: they are typed on the play page and stay in the browser.
   */
  players?: number;
  /**
   * The countdown (`puzzleClock.ts`): "none", and left out of the address, by
   * default and for a puzzle that offers none (`offersClock`), whatever the
   * address asked. Part of the puzzle's identity, so Continue, Another and a
   * reload keep it.
   */
  clock?: PuzzleClock;
  /**
   * Solitaire's kind of deal: any deal, the shuffle as it falls, rather than
   * one the solver has won (`solitaire/generate.ts`). Asked for by the address
   * (`deal=any`) until a seed is drawn, and from then said by the seed itself
   * (`isAnyDeal`), whatever the address says; false, and left out, for a
   * winnable deal and for any puzzle that is not Solitaire.
   */
  anyDeal?: boolean;
  /**
   * Mahjong's flowers and seasons: the usual rule, or Identical. Asked for by
   * the address (`flowers=same`) until a seed is drawn, and from then said by
   * the seed itself (`bonusRuleOfSeed`), as a Futago's word count is.
   */
  bonus?: MahjongBonusRule;
  /**
   * Suido's kind of board: drains (every drain reached, spares allowed) or a
   * network (every piece wet). Asked for by the address (`pipes=network`)
   * until a seed is drawn, and from then said by the seed itself
   * (`suidoKindOfSeed`), as Mahjong's flowers are.
   */
  pipes?: SuidoKind;
  /**
   * A Gomoji's Nige 逃げ: the word that dodges (`gomoji/dodge.ts`). Asked for
   * by the address until a seed is drawn, and from then said by the seed
   * itself (`isDodgeSeed`), whatever the address says; false, and left out of
   * the address, for a word that sits still and for any puzzle not a word.
   */
  dodge?: boolean;
  /**
   * A Gomoji's Sakasa 逆さ, played backwards (`gomoji/backwards.ts`). Asked
   * for by the address until a seed is drawn, and from then said by the seed
   * itself (`isBackwardsSeed`), whatever the address says; left out of the
   * address for a Gomoji played the ordinary way and any puzzle not a word.
   * One word, never with a Nige.
   */
  backwards?: boolean;
};

export const PUZZLE_PARAMS = { size: "size", level: "level", seed: "seed", checks: "checks", hints: "hints", strict: "strict", headStart: "head-start", twins: "twins", quadruplets: "quadruplets", gameLength: "length", language: "language", doubleSet: "double", diagonals: "diagonals", players: "players", clock: "clock", bonus: "flowers", deal: "deal", dodge: "nige", backwards: "sakasa", pipes: "pipes" } as const;

/** The size and level a query asks for, or the kind's defaults where it asks for nothing usable. */
export function puzzleAsked(kind: PuzzleKind, query: Record<string, string | string[] | undefined>): PuzzleAsked {
  const spec = PUZZLE_SPECS[kind];
  const one = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const sizeAsked = Number(one(PUZZLE_PARAMS.size));
  const size = spec.sizes.includes(sizeAsked) ? sizeAsked : spec.defaultSize;
  const levelAsked = one(PUZZLE_PARAMS.level) as PuzzleLevel | undefined;
  // A level this size cannot be made at (a 4×4 Hidden Stones is easy only) is the first one it can.
  const levels = levelsFor(kind, size);
  const level = levelAsked !== undefined && levels.includes(levelAsked) ? levelAsked : levels.includes(spec.defaultLevel) ? spec.defaultLevel : levels[0]!;
  const seedAsked = Number(one(PUZZLE_PARAMS.seed));
  /* A fixed level's seed is its number, and its band follows from it, whatever the address said (`tsunagi/levels.ts`). */
  if (spec.fixedLevels === true) {
    const number = isTsunagiLevel(size, seedAsked) ? seedAsked : null;
    return { size, level: number === null ? spec.defaultLevel : tsunagiBand(size, number), seed: number, checks: null, hints: false, strict: false, clock: "none" };
  }
  const seed = isSeed(seedAsked) ? seedAsked : null;
  const checksAsked = Number(one(PUZZLE_PARAMS.checks));
  const checks = one(PUZZLE_PARAMS.checks) !== undefined && isCheckAllowance(checksAsked) ? checksAsked : null;
  const hints = one(PUZZLE_PARAMS.hints) === "1";
  const strict = one(PUZZLE_PARAMS.strict) === "1";
  const asked: WordCount = one(PUZZLE_PARAMS.quadruplets) === "1" ? 4 : one(PUZZLE_PARAMS.twins) === "1" ? 2 : 1;
  // A Nige hides one word that is not there yet: never two or four, and from a seed, the seed says it.
  const dodge = offersDodge(kind) && (seed === null ? one(PUZZLE_PARAMS.dodge) === "1" && asked === 1 : isDodgeSeed(seed));
  // A Sakasa hides one word and is won by never typing it: one word, never a Nige too.
  const backwards = offersDodge(kind) && !dodge && (seed === null ? one(PUZZLE_PARAMS.backwards) === "1" && asked === 1 : isBackwardsSeed(seed));
  const words: WordCount = spec.wordGrid === undefined || dodge || backwards ? 1 : seed === null ? asked : wordCountOfSeed(seed);
  // A dodger hides nothing, so there is nothing a head start could grey; a Sakasa is all grey words already.
  const headStart = one(PUZZLE_PARAMS.headStart) === "1" && offersHeadStart(kind, level) && !dodge && !backwards;
  const requestedLength = one(PUZZLE_PARAMS.gameLength);
  const gameLength: KumimojiLength = requestedLength === "medium" || requestedLength === "full" ? requestedLength : "short";
  const requestedLanguage = one(PUZZLE_PARAMS.language);
  const language: KumimojiLanguage = requestedLanguage === "japanese" ? "japanese" : "english";
  const doubleSet = one(PUZZLE_PARAMS.doubleSet) === "1";
  const diagonals = one(PUZZLE_PARAMS.diagonals) === "1";
  const players = partyPlayersAsked(one(PUZZLE_PARAMS.players));
  const clock = clockFor(kind, one(PUZZLE_PARAMS.clock));
  if (kind === "mahjong") {
    const tablePlayers = tablePlayersAsked(one(PUZZLE_PARAMS.players));
    const bonus: MahjongBonusRule = seed === null ? (one(PUZZLE_PARAMS.bonus) === "same" ? "same" : "group") : bonusRuleOfSeed(seed);
    return { size, level, seed, checks: null, hints, strict: false, headStart: false, words: 1, clock, bonus, ...(tablePlayers > 1 ? { players: tablePlayers } : {}) };
  }
  if (kind === "suido") {
    const pipes: SuidoKind = seed === null ? (one(PUZZLE_PARAMS.pipes) === "network" ? "network" : "drains") : suidoKindOfSeed(seed);
    return { size, level, seed, checks: null, hints, strict: false, headStart: false, words: 1, clock, pipes };
  }
  const anyDeal = kind === "solitaire" && (seed === null ? one(PUZZLE_PARAMS.deal) === "any" : isAnyDeal(seed));
  return { size, level, seed, checks, hints, strict, headStart, words, clock, ...(dodge ? { dodge } : {}), ...(backwards ? { backwards } : {}), ...(anyDeal ? { anyDeal } : {}), ...(kind === "kumimoji" ? { gameLength, language, doubleSet: language === "english" && doubleSet, diagonals, ...(players > 1 ? { players } : {}) } : {}) };
}

/** The query for a solve, as `?size=…&level=…&seed=…&checks=…`, the seed left off while there is none and the checks while there is no limit. */
export function puzzleQuery(asked: PuzzleAsked): string {
  const params = new URLSearchParams({ [PUZZLE_PARAMS.size]: String(asked.size), [PUZZLE_PARAMS.level]: asked.level });
  if (asked.seed !== null) params.set(PUZZLE_PARAMS.seed, String(asked.seed));
  if (asked.checks !== undefined && asked.checks !== null) params.set(PUZZLE_PARAMS.checks, String(asked.checks));
  if (asked.hints === true) params.set(PUZZLE_PARAMS.hints, "1");
  if (asked.strict === true) params.set(PUZZLE_PARAMS.strict, "1");
  if (asked.headStart === true && asked.level === "easy" && asked.dodge !== true && asked.backwards !== true) params.set(PUZZLE_PARAMS.headStart, "1");
  if (asked.dodge === true) params.set(PUZZLE_PARAMS.dodge, "1");
  if (asked.backwards === true) params.set(PUZZLE_PARAMS.backwards, "1");
  if (asked.words === 2) params.set(PUZZLE_PARAMS.twins, "1");
  if (asked.words === 4) params.set(PUZZLE_PARAMS.quadruplets, "1");
  if (asked.doubleSet === true) params.set(PUZZLE_PARAMS.doubleSet, "1");
  if (asked.diagonals === true) params.set(PUZZLE_PARAMS.diagonals, "1");
  if (asked.gameLength !== undefined && asked.gameLength !== "short") params.set(PUZZLE_PARAMS.gameLength, asked.gameLength);
  if (asked.language === "japanese") params.set(PUZZLE_PARAMS.language, asked.language);
  if (asked.players !== undefined && asked.players > 1) params.set(PUZZLE_PARAMS.players, String(asked.players));
  if (asked.clock !== undefined && asked.clock !== "none") params.set(PUZZLE_PARAMS.clock, asked.clock);
  // Only while there is no seed to say it: a seed in the any-deal block is any deal already.
  if (asked.anyDeal === true && asked.seed === null) params.set(PUZZLE_PARAMS.deal, "any");
  // Only until a seed is drawn: from then the seed says it.
  if (asked.bonus === "same" && asked.seed === null) params.set(PUZZLE_PARAMS.bonus, asked.bonus);
  if (asked.pipes === "network" && asked.seed === null) params.set(PUZZLE_PARAMS.pipes, asked.pipes);
  return `?${params.toString()}`;
}

/** What a kept run was asked as, for Continue and Resume, its Head start read back from where it is kept (`hadHeadStart`). */
export function keptRunAsked(
  kind: PuzzleKind,
  run: { size: number; level: string; seed: number; checksAllowed: number | null; hintsAllowed: boolean; strict: boolean; language?: string; gameLength?: string; doubleSet?: boolean; diagonals?: boolean; clock?: string },
): PuzzleAsked {
  const headStart = hadHeadStart(kind, run.level, run.hintsAllowed);
  return {
    size: run.size,
    level: run.level as PuzzleLevel,
    seed: run.seed,
    checks: run.checksAllowed,
    hints: headStart ? false : run.hintsAllowed,
    strict: run.strict,
    headStart,
    words: wordCountOfSeed(run.seed),
    clock: clockFor(kind, run.clock),
    ...(kind === "kumimoji" ? { gameLength: run.gameLength === "medium" || run.gameLength === "full" ? run.gameLength : "short", language: run.language === "japanese" ? "japanese" : "english", doubleSet: run.language !== "japanese" && (run.doubleSet ?? false), diagonals: run.diagonals === true } : {}),
    ...(kind === "suido" ? { pipes: suidoKindOfSeed(run.seed) } : {}),
    ...(offersDodge(kind) && isDodgeSeed(run.seed) ? { dodge: true } : {}),
    ...(offersDodge(kind) && isBackwardsSeed(run.seed) ? { backwards: true } : {}),
  };
}
