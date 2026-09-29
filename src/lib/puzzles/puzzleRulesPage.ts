import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { GAME_SETTINGS, WORD_LANGUAGE_DISPLAY, WORD_LIST_DISPLAY, listedGameOf, settingsOf } from "@/lib/catalogue/gameSettings";

import { futagoRule } from "./gomoji/futago";
import { yotsugoRule } from "./gomoji/yotsugo";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS, levelBlurb, sizesOffered } from "./puzzles.constants";
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
  // A card game's is how many cards the stock turns (`PuzzleSpec.cards`).
  const sizes = sizesOffered(kind).map((size) => (spec.tiles === true ? `${size} tiles in hand` : spec.cards === true ? `draw ${size}` : `${size}×${size}`)).join(", ");
  const levels = spec.levels.map((level) => `${PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()} (${levelBlurb(kind, level).toLowerCase()})`);

  const object = [copy.tagline, copy.rules[0]];
  const board = [
    `${spec.cards === true ? "Draws" : "Sizes"}: ${sizes}. ${copy.board}`,
    spec.fixedLevels === true
      ? "Every level has exactly one answer. The site's own solver proved it when the levels were made, and proves it again every time the site is built, so there is never a board with two answers or none."
      : spec.cards === true
      ? "Every winnable deal can be won: the browser that deals it has already played it out to the last card, and a deal is only called winnable once it has. Any deal is the shuffle as it falls, and some of those cannot be won."
      : spec.tiles === true
      ? "Every bag can be finished: the browser that deals it lays its tiles out as one crossword first, and any other crossword of the same tiles counts as well."
      : "Every puzzle has exactly one answer. The browser that makes it checks that before you see it, so there is never a grid with two answers or none.",
  ];
  const play = [
    ...copy.rules.slice(1),
    ...(spec.wordGrid === undefined ? [] : [futagoRule(spec.wordGrid), yotsugoRule(spec.wordGrid)]),
    `Levels: ${levels.join("; ")}.`,
    spec.cards === true
      ? "A game is for one person, in your own browser: the deal is shuffled and every move is checked there, and nothing is sent anywhere until the last card is home."
      : "Solving is for one person, in one sitting, in your own browser: nothing about a puzzle is sent anywhere until it is done.",
  ];
  const house = [
    spec.cards === true
      ? "A won game is checked by the site, move by move from the deal, and a member is paid XP for it, once per deal."
      : "A finished puzzle is checked by the site against every rule above, and a member is paid XP for a grid that is right, once per grid.",
    spec.fixedLevels === true
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
