// Relative, not `@/`: `families.ts` imports this, the browser specs import that, and Playwright resolves no alias.
import { RULE_VARIANT_LIST } from "../gomoku/gomoku.constants";
import type { RuleVariant } from "../gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY, type VariantCopy } from "../gomoku/variants.constants";
import { PARTY_DISPLAY, PARTY_KIND_LIST } from "../party/party.constants";
import type { PartyKind } from "../party/party.types";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST } from "../puzzles/puzzles.constants";
import type { PuzzleKind } from "../puzzles/puzzles.types";

/**
 * A game in the catalogue is one of three things: a rule variant the engine
 * plays between two colours, a puzzle one person solves, or a party game a
 * table of people plays round one device.
 *
 * The three are kept as three kinds rather than one stretched one (see
 * docs/plans/numbers/README.md for the puzzles and
 * docs/plans/party-games/README.md for the party games), and this is where
 * they meet: a family holds `GameKey`s, a name or a picture is asked for by
 * `GameKey`, and the few places that only make sense for one kind — the
 * two-player set-up, a ladder, a record, a solve — ask `isRuleVariant`,
 * `isPuzzleKind` or `isPartyKind` and say what they skip.
 */
export type GameKey = RuleVariant | PuzzleKind | PartyKind;

const VARIANTS = new Set<string>(RULE_VARIANT_LIST);
const PUZZLES = new Set<string>(PUZZLE_KIND_LIST);
const PARTIES = new Set<string>(PARTY_KIND_LIST);

export function isPuzzleKind(key: string): key is PuzzleKind {
  return PUZZLES.has(key);
}

/** A party game: played round one device, kept only in that browser, never rated or recorded. */
export function isPartyKind(key: string): key is PartyKind {
  return PARTIES.has(key);
}

/**
 * A game the engine plays between two colours: what a ladder, a record, the
 * two-player set-up and the bots are for. Asked by name rather than as "not a
 * puzzle", which stopped being the same question the day a third kind arrived.
 */
export function isRuleVariant(key: string): key is RuleVariant {
  return VARIANTS.has(key);
}

/** Every game, puzzle and party game, in that order: the whole catalogue, what the cards and the lists show. */
export const EVERY_GAME_KEY: readonly GameKey[] = [...RULE_VARIANT_LIST, ...PUZZLE_KIND_LIST, ...PARTY_KIND_LIST];

/**
 * THE GAMES THIS SITE KEEPS A RECORD OF: the rule variants and the puzzles,
 * whose games and solves are rows a member earns by. A party game is played
 * and kept in one browser and never reaches the server, so it can never be
 * counted towards anything — `everyVariantPlayed` counts these, and a game
 * nobody could ever be seen to play would make it a prize nobody could finish.
 */
export const RECORDED_GAME_KEYS: readonly GameKey[] = [...RULE_VARIANT_LIST, ...PUZZLE_KIND_LIST];

/** What a game, a puzzle or a party game is called and how it is described, whichever kind it is. */
export function gameCopyFor(key: GameKey): VariantCopy {
  if (isPuzzleKind(key)) return PUZZLE_DISPLAY[key];
  if (isPartyKind(key)) return PARTY_DISPLAY[key];
  return RULE_VARIANT_DISPLAY[key];
}

/** The copy for a key read off a stored row or an address, or null for one this deploy has not got. */
export function gameCopyOf(key: string): VariantCopy | null {
  if (isPuzzleKind(key)) return PUZZLE_DISPLAY[key];
  if (isPartyKind(key)) return PARTY_DISPLAY[key];
  if (key in RULE_VARIANT_DISPLAY) return RULE_VARIANT_DISPLAY[key as RuleVariant];
  return null;
}
