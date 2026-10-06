import { gameArtPath } from "@/lib/gomoku/artwork";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE, type PhraseKey } from "@/lib/i18n/i18n.constants";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { GAME_SETTINGS, WORD_LANGUAGE_DISPLAY, WORD_LIST_DISPLAY, listedGameOf, settingsOf } from "@/lib/catalogue/gameSettings";

import { futagoRule } from "./gomoji/futago";
import { yotsugoRule } from "./gomoji/yotsugo";
import { dodgeRule } from "./gomoji/dodgeWords";
import { offersDodge } from "./gomoji/dodgeSeed";
import { backwardsRule } from "./gomoji/backwardsWords";
import { layoutFor } from "@johnmorrisdotca/jarajara";
import { PUZZLE_SIZE_NAMES, PUZZLE_SPECS, sizesOffered } from "./puzzles.constants";
import { cardSizeWords, levelBlurbIn, levelName, puzzleCopy } from "./puzzleCopy";
import { colonOf, joinedWith, semicolonOf, stopOf, withNote } from "./puzzleText";
import type { PuzzleKind } from "./puzzles.types";

/**
 * A puzzle's rules page, in the game template: Object, Board, Play, House.
 *
 * The same `RulesPage` shape a game builds from its spec, so the one rules
 * page draws both and a reader who has read one has read them all. The
 * facts come from the puzzle's spec and its copy, never from a second
 * description that could drift: the sizes are `PUZZLE_SPECS`'s, the levels
 * are `PUZZLE_LEVEL_DISPLAY`'s words.
 */
/**
 * THE OTHER LANGUAGES AND WORD LISTS of a game with settings, a section each,
 * on the one rules page (`gameSettings.ts`): where the words come from, and
 * whatever plays differently there — kana's arrows and yellow, French's folded
 * accents, German's Ä, Ö and Ü, Pop culture's categories. Only on the game's
 * own page; a setting's rules are its game's.
 */
function settingSections(kind: PuzzleKind, say: Speaker): { id: string; heading: string; kanji: string; lines: string[] }[] {
  if (listedGameOf(kind) !== kind) return [];
  const own = puzzleCopy(kind, say.locale);
  return settingsOf(kind)
    .filter((each) => each !== kind)
    .map((each) => {
      const setting = GAME_SETTINGS[each]!;
      const copy = puzzleCopy(each, say.locale);
      const named = setting.list === "everyday" ? WORD_LANGUAGE_DISPLAY[setting.language] : { label: WORD_LIST_DISPLAY[setting.list].label, kanji: WORD_LIST_DISPLAY[setting.list].kanji, english: WORD_LIST_DISPLAY[setting.list].label };
      const heading = named.english === named.label ? named.label : `${named.label} · ${named.english}`;
      // What this setting says that the game as it comes does not: its own rules, never the shared ones twice.
      const differs = copy.rules.filter((line) => !own.rules.includes(line));
      return { id: `setting-${setting.language}-${setting.list}`, heading, kanji: named.kanji, lines: [copy.tagline, copy.board, ...differs] };
    });
}

export function puzzleRulesPage(kind: PuzzleKind, say: Speaker = speaker(DEFAULT_LOCALE)): RulesPage {
  const copy = puzzleCopy(kind, say.locale);
  const spec = PUZZLE_SPECS[kind];
  // A tile game's size is the hand it opens with (`PuzzleSpec.tiles`), not the side of a grid.
  // A Suido's rules page names the boards made from a seed here, and its levels in its own rules (`PUZZLE_DISPLAY.suido`).
  const sizes = joinedWith(say, sizesOffered(kind).map((size) => sizeText(kind, size, say)));
  const levels = spec.levels
    .map((level) => withNote(say, levelName(level, say.locale), levelBlurbIn(kind, level, say.locale).toLowerCase()))
    .join(semicolonOf(say));
  const word = (key: PhraseKey, vars?: Record<string, string>) => say.say(key, vars);

  const object = [copy.tagline, copy.rules[0]!];
  const heading = cardSizeWords(say.locale)[kind]?.heading ?? word(kind === "suido" ? "puzzle.rules.boardsYouMake" : "puzzle.rules.sizes");
  const proof: PhraseKey =
    kind === "suido"
      ? "puzzle.rules.proofSuido"
      : kind === "tobiishi"
        ? "puzzle.rules.proofTobiishi"
        : kind === "meikyuu"
          ? "puzzle.rules.proofMeikyuu"
          : spec.fixedLevels === true
            ? "puzzle.rules.proofLevels"
            : spec.cards === true && kind !== "solitaire"
              ? "puzzle.rules.proofDeal"
              : spec.cards === true
                ? "puzzle.rules.proofWinnable"
                : spec.cube === true
                  ? "puzzle.rules.proofCube"
                  : spec.layouts === true
                    ? "puzzle.rules.proofLayout"
                    : spec.tiles === true
                      ? "puzzle.rules.proofTiles"
                      : "puzzle.rules.proofGrid";
  const board = [`${heading}${colonOf(say)}${sizes}${stopOf(say)}${say.locale === "ja" ? "" : " "}${copy.board}`, word(proof)];
  const play = [
    ...copy.rules.slice(1),
    ...(spec.wordGrid === undefined
      ? []
      : [futagoRule(spec.wordGrid, say), yotsugoRule(spec.wordGrid, say), ...(offersDodge(kind) ? [dodgeRule(spec.wordGrid, say), backwardsRule(spec.wordGrid, say)] : [])]),
    // A Suido's levels are numbered fixed boards (its rules say so): easy, medium and hard are what a made board is asked for.
    word(kind === "suido" ? "puzzle.rules.madeLevelsLine" : "puzzle.rules.levelsLine", { list: levels }),
    word(spec.cards === true ? "puzzle.rules.aloneGame" : "puzzle.rules.aloneSolve"),
  ];
  const house = [
    word(spec.cube === true ? "puzzle.rules.paidCube" : spec.cards === true ? "puzzle.rules.paidCards" : "puzzle.rules.paidGrid"),
    word(kind === "suido" ? "puzzle.rules.keptSuido" : spec.fixedLevels === true ? "puzzle.rules.keptLevels" : "puzzle.rules.keptPuzzle"),
    word("puzzle.rules.notRated"),
  ];

  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: [...(copy.alsoKnownAs ?? [])],
    from: originFor(copy.country, say.locale),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(kind),
    ...(settingSections(kind, say).length === 0 ? {} : { settings: settingSections(kind, say) }),
  };
}

/**
 * A size as a rules page says it: a grid's side, a tile game's hand, a
 * layout's name and how many tiles it holds (`PuzzleSpec.layouts`), or how
 * what a card game's size tiles choose (`CARD_SIZE_WORDS`).
 */
function sizeText(kind: PuzzleKind, size: number, say: Speaker): string {
  const spec = PUZZLE_SPECS[kind];
  const cards = cardSizeWords(say.locale)[kind];
  if (cards !== undefined) return cards.word(size);
  if (spec.layouts === true) {
    const named = PUZZLE_SIZE_NAMES[kind][size];
    return say.say("puzzle.rules.layoutSize", { name: named === undefined ? String(size) : say.locale === "ja" ? named.kanji : named.label, count: String(layoutFor(size)?.slots.length ?? 0) });
  }
  return spec.tiles === true ? say.say("puzzle.rules.tilesInHand", { count: String(size) }) : `${size}×${size}`;
}
