import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "./puzzles.constants";
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
export function puzzleRulesPage(kind: PuzzleKind): RulesPage {
  const copy = PUZZLE_DISPLAY[kind];
  const spec = PUZZLE_SPECS[kind];
  const sizes = spec.sizes.map((size) => `${size}×${size}`).join(", ");
  const levels = spec.levels.map((level) => `${PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()} (${PUZZLE_LEVEL_DISPLAY[level].blurb.toLowerCase()})`);

  const object = [copy.tagline, copy.rules[0]];
  const board = [
    `Sizes: ${sizes}. ${copy.board}`,
    "Every puzzle has exactly one answer. The browser that makes it checks that before you see it, so there is never a grid with two answers or none.",
  ];
  const play = [
    ...copy.rules.slice(1),
    `Levels: ${levels.join("; ")}.`,
    "Solving is for one person, in one sitting, in your own browser: nothing about a puzzle is sent anywhere until it is done.",
  ];
  const house = [
    "A finished puzzle is checked by the site — every row, column and box, and every given left where it was — and a member is paid XP for a grid that is right, once per grid.",
    "A puzzle you did not finish is not kept. Come back to the same address and the same givens are there; the clock starts again.",
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
  };
}
