import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { GAME_SETTINGS, WORD_LANGUAGE_DISPLAY, WORD_LIST_DISPLAY, listedGameOf, settingsOf } from "@/lib/catalogue/gameSettings";

import { futagoRule } from "./gomoji/futago";
import { yotsugoRule } from "./gomoji/yotsugo";
import { dodgeRule } from "./gomoji/dodgeWords";
import { offersDodge } from "./gomoji/dodgeSeed";
import { backwardsRule } from "./gomoji/backwardsWords";
import { layoutFor } from "@johnmorrisdotca/jarajara";
import { CARD_SIZE_WORDS, PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SIZE_NAMES, PUZZLE_SPECS, levelBlurb, sizesOffered } from "./puzzles.constants";
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
function settingSections(kind: PuzzleKind): { id: string; heading: string; kanji: string; lines: string[] }[] {
  if (listedGameOf(kind) !== kind) return [];
  const own = PUZZLE_DISPLAY[kind];
  return settingsOf(kind)
    .filter((each) => each !== kind)
    .map((each) => {
      const setting = GAME_SETTINGS[each]!;
      const copy = PUZZLE_DISPLAY[each];
      const named = setting.list === "everyday" ? WORD_LANGUAGE_DISPLAY[setting.language] : { label: WORD_LIST_DISPLAY[setting.list].label, kanji: WORD_LIST_DISPLAY[setting.list].kanji, english: WORD_LIST_DISPLAY[setting.list].label };
      const heading = named.english === named.label ? named.label : `${named.label} · ${named.english}`;
      // What this setting says that the game as it comes does not: its own rules, never the shared ones twice.
      const differs = copy.rules.filter((line) => !own.rules.includes(line));
      return { id: `setting-${setting.language}-${setting.list}`, heading, kanji: named.kanji, lines: [copy.tagline, copy.board, ...differs] };
    });
}

export function puzzleRulesPage(kind: PuzzleKind): RulesPage {
  const copy = PUZZLE_DISPLAY[kind];
  const spec = PUZZLE_SPECS[kind];
  // A tile game's size is the hand it opens with (`PuzzleSpec.tiles`), not the side of a grid.
  // A Suido's rules page names the boards made from a seed here, and its levels in its own rules (`PUZZLE_DISPLAY.suido`).
  const sizes = sizesOffered(kind).map((size) => sizeText(kind, size)).join(", ");
  const levels = spec.levels.map((level) => `${PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()} (${levelBlurb(kind, level).toLowerCase()})`);

  const object = [copy.tagline, copy.rules[0]];
  const board = [
    `${CARD_SIZE_WORDS[kind]?.heading ?? (kind === "suido" ? "Boards you make" : "Sizes")}: ${sizes}. ${copy.board}`,
    kind === "suido"
      ? "Every level and every board has exactly one answer. The levels were made once, and the package they come from proves every one of them again each time it is built; a board you make is checked in the same way before you see it. So there is never a board with two answers or none."
      : kind === "meikyuu"
      ? "Every maze has exactly one way through: the passages are carved so that there is one path between any two places, and the package they come from proves it again for every level each time it is built. So there is never a maze with two ways through, or none."
      : spec.fixedLevels === true
      ? "Every level has exactly one answer. The site's own solver proved it when the levels were made, and proves it again every time the site is built, so there is never a board with two answers or none."
      : spec.cards === true && kind !== "solitaire"
      ? "Every deal can be won: the browser that deals it has already played it out to the last card, and deals none it has not."
      : spec.cards === true
      ? "Every winnable deal can be won: the browser that deals it has already played it out to the last card, and a deal is only called winnable once it has. Any deal is the shuffle as it falls, and some of those cannot be won."
      : spec.cube === true
      ? "Every scramble can be solved: it is made by turning a solved cube, so turning back the way it came always solves it, and any other way to every face one colour counts as well."
      : spec.layouts === true
      ? "Every deal can be cleared: the browser that deals it lays the tiles out pair by pair in reverse first, so the order it laid them in clears it, and any other order that clears it counts as well."
      : spec.tiles === true
      ? "Every bag can be finished: the browser that deals it lays its tiles out as one crossword first, and any other crossword of the same tiles counts as well."
      : "Every puzzle has exactly one answer. The browser that makes it checks that before you see it, so there is never a grid with two answers or none.",
  ];
  const play = [
    ...copy.rules.slice(1),
    ...(spec.wordGrid === undefined ? [] : [futagoRule(spec.wordGrid), yotsugoRule(spec.wordGrid), ...(offersDodge(kind) ? [dodgeRule(spec.wordGrid), backwardsRule(spec.wordGrid)] : [])]),
    // A Suido's levels are numbered fixed boards (its rules say so): easy, medium and hard are what a made board is asked for.
    `${kind === "suido" ? "A board you make, at a level" : "Levels"}: ${levels.join("; ")}.`,
    spec.cards === true
      ? "A game is for one person, in your own browser: the deal is shuffled and every move is checked there, and nothing is sent anywhere until the last card is home."
      : "Solving is for one person, in one sitting, in your own browser: nothing about a puzzle is sent anywhere until it is done.",
  ];
  const house = [
    spec.cube === true
      ? "A solved cube is checked by the site, turn by turn from the scramble, and a member is paid XP for it, once per scramble."
      : spec.cards === true
      ? "A won game is checked by the site, move by move from the deal, and a member is paid XP for it, once per deal."
      : "A finished puzzle is checked by the site against every rule above, and a member is paid XP for a grid that is right, once per grid.",
    kind === "suido"
      ? "A level or a board left half turned is kept for a member and waits in My games, pieces and clock as they were. The levels you have solved are kept on your account, or in this browser without one."
      : spec.fixedLevels === true
      ? "A level left half drawn is kept for a member and waits in My games, lines and clock as they were. The levels you have solved are kept on your account, or in this browser without one."
      : "A puzzle left half done is kept for a member and waits in My games, as it was left, clock and all. Without an account nothing is kept: the same address brings back the same puzzle, and its clock starts again.",
    "Nothing is rated, nobody is beaten and no ladder counts a solve. A puzzle is a game in the catalogue and not a game between two players.",
  ];

  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: [...(copy.alsoKnownAs ?? [])],
    from: originFor(copy.country),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(kind),
    ...(settingSections(kind).length === 0 ? {} : { settings: settingSections(kind) }),
  };
}

/**
 * A size as a rules page says it: a grid's side, a tile game's hand, a
 * layout's name and how many tiles it holds (`PuzzleSpec.layouts`), or how
 * what a card game's size tiles choose (`CARD_SIZE_WORDS`).
 */
function sizeText(kind: PuzzleKind, size: number): string {
  const spec = PUZZLE_SPECS[kind];
  const cards = CARD_SIZE_WORDS[kind];
  if (cards !== undefined) return cards.word(size);
  if (spec.layouts === true) return `${PUZZLE_SIZE_NAMES[kind][size]?.label ?? size} (${layoutFor(size)?.slots.length ?? 0} tiles)`;
  return spec.tiles === true ? `${size} tiles in hand` : `${size}×${size}`;
}
