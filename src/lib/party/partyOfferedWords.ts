import { HITOTSU_ONE_HAND } from "@johnmorrisdotca/hitotsu";
import { trainSetLabel, trainSetName } from "@johnmorrisdotca/domino";

import type { Speaker } from "../i18n/i18n";

import { DICE_WAR_DICE, DICE_WAR_ROUND_GOALS, DICE_WAR_SIDES } from "./diceWar/diceWar.constants";
import { gunjinBoardOf } from "./gunjin/gunjin.constants";
import { mancalaBoardName } from "./mancala/mancala.constants";
import { PARTY_SPECS } from "./party.constants";
import type { PartyKind, PartyLanguage, PartySpec } from "./party.types";
import { SUGOROKU_KIND_LIST } from "./sugoroku/sugoroku.constants";
import { TENKA_WORLD_ROUNDS } from "./tenka/tenka.constants";

/**
 * WHAT A PARTY GAME'S SET-UP OFFERS, in the reader's words and from the game's own spec rather than a second
 * sentence that could drift: "2–6 players", and "on 3×3, 4×4, 5×5 and 6×6 boxes", "in English or Japanese,
 * where a word of 4 letters or more loses", "by Kalah (the default) or Oware rules". Each game says what its
 * sizes count: for Mancala, which rules it is played by (`MANCALA_BOARDS`).
 *
 * Every sentence is a phrase (`party.rules.*`), because the order of its parts and what joins them are the
 * language's: a Japanese reader gets "3×3、4×4、5×5、6×6マスの盤で", not the English with its words swapped.
 */

/** "2–6 players", "2人", from the game's own spec. */
export function partyPlayersWords(kind: PartyKind, say: Speaker): string {
  const spec = PARTY_SPECS[kind];
  return spec.fewestPlayers === spec.mostPlayers
    ? say.say("party.rules.playersSame", { count: String(spec.mostPlayers) })
    : say.say("party.rules.playersRange", { fewest: String(spec.fewestPlayers), most: String(spec.mostPlayers) });
}

/** A list of alternatives in the reader's words: "a", "a or b", "a, b or c". */
function orList(say: Speaker, items: readonly string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return say.say("party.rules.orTwo", { a: items[0], b: items[1] });
  return say.say("party.rules.or", { rest: say.joined(items.slice(0, -1)), last: items[items.length - 1] });
}

/** A game's sizes in words, the default one saying so: "50 or 100 (the usual game)". */
function defaulted(say: Speaker, spec: PartySpec, word: (size: number) => string): string {
  return orList(
    say,
    spec.sizes.map((size) => {
      const what = word(size);
      return size === spec.defaultSize && spec.sizes.length > 1 ? say.say("party.rules.usual", { what }) : what;
    }),
  );
}

const LANGUAGE_WORDS = { english: "party.rules.languageEnglish", japanese: "party.rules.languageJapanese" } as const satisfies Record<PartyLanguage, string>;

/** What each of the seven backgammon games is offered as: a single game, or the matches its spec lists. */
function sugorokuWords(say: Speaker, spec: PartySpec): string {
  const matches = spec.sizes.filter((size) => size > 1);
  return matches.length === 0 ? say.say("party.rules.offerSugorokuSingle") : say.say("party.rules.offerSugorokuMatch", { points: orList(say, matches.map(String)) });
}

const SUGOROKU_OFFERED = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, sugorokuWords])) as Record<(typeof SUGOROKU_KIND_LIST)[number], typeof sugorokuWords>;

const toPoints = (say: Speaker, spec: PartySpec) => say.say("party.rules.offerToPoints", { points: defaulted(say, spec, String) });
const overDeals = (say: Speaker, spec: PartySpec) => say.say("party.rules.offerOverDeals", { count: defaulted(say, spec, String) });

const OFFERED_WORDS: Record<PartyKind, (say: Speaker, spec: PartySpec) => string> = {
  dotsAndBoxes: (say, spec) => say.say("party.rules.offerDots", { sizes: say.list(spec.sizes.map((size) => `${size}×${size}`)) }),
  superghost: (say, spec) =>
    say.say("party.rules.offerGhost", {
      languages: orList(say, (spec.languages ?? []).map((language) => say.say(LANGUAGE_WORDS[language]))),
      lengths: orList(say, spec.sizes.map(String)),
    }),
  mancala: (say, spec) =>
    say.say("party.rules.offerMancala", {
      rules: orList(
        say,
        spec.sizes.map((size) => {
          const what = mancalaBoardName(size) ?? String(size);
          return size === spec.defaultSize ? say.say("party.rules.default", { what }) : what;
        }),
      ),
    }),
  tenka: (say, spec) =>
    say.say("party.rules.offerTenka", {
      rounds: orList(say, spec.sizes.map((rounds) => (rounds === TENKA_WORLD_ROUNDS ? say.say("party.rules.tenkaLast") : say.say("party.rules.tenkaRounds", { count: String(rounds) })))),
    }),
  mexicanTrain: (say, spec) =>
    say.say("party.rules.offerTrain", {
      sets: orList(
        say,
        spec.sizes.map((size) => {
          const what = say.locale === "ja" ? (trainSetLabel(size, "ja") ?? `${size}`) : (trainSetName(size) ?? `double-${size}`).toLowerCase();
          return size === spec.defaultSize ? say.say("party.rules.default", { what }) : what;
        }),
      ),
    }),
  diceWar: (say, spec) =>
    say.say("party.rules.offerDice", {
      dice: orList(say, DICE_WAR_DICE.map(String)),
      lowest: String(DICE_WAR_SIDES[0]),
      highest: String(DICE_WAR_SIDES[DICE_WAR_SIDES.length - 1]),
      points: defaulted(say, spec, String),
      rounds: orList(say, DICE_WAR_ROUND_GOALS.map(String)),
    }),
  yacht: (say) => say.say("party.rules.offerYacht"),
  pachisi: (say) => say.say("party.rules.offerPachisi"),
  hitotsu: (say, spec) =>
    say.say("party.rules.offerHitotsu", {
      list: defaulted(say, spec, (size) => (size === HITOTSU_ONE_HAND ? say.say("party.rules.hitotsuHand") : say.say("party.rules.hitotsuPoints", { points: String(size) }))),
    }),
  gunjin: (say, spec) =>
    say.say("party.rules.offerGunjin", {
      boards: orList(
        say,
        spec.sizes.map((size) => {
          const board = gunjinBoardOf(size);
          const what = board === null || board === undefined ? String(size) : say.pairName(board.name, board.kanji).text;
          return size === spec.defaultSize ? say.say("party.rules.default", { what }) : what;
        }),
      ),
    }),
  ...SUGOROKU_OFFERED,
  // The family card games: how long a game lasts, in each one's own terms.
  hearts: toPoints,
  bigTwo: overDeals,
  president: (say, spec) => say.say("party.rules.offerOverRounds", { count: defaulted(say, spec, String) }),
  goFish: (say) => say.say("party.rules.offerGoFish"),
  crazyEights: toPoints,
  spades: toPoints,
  ginRummy: toPoints,
  euchre: toPoints,
  cribbage: toPoints,
  ohHell: overDeals,
  war: (say, spec) => say.say("party.rules.offerWar", { count: defaulted(say, spec, String) }),
};

/** The boards, or the words, a party game's set-up offers: "on 3×3, 4×4, 5×5 and 6×6 boxes". */
export function partyBoardsWords(kind: PartyKind, say: Speaker): string {
  return OFFERED_WORDS[kind](say, PARTY_SPECS[kind]);
}
