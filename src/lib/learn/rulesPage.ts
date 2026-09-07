import {
  LINE_RULES,
  PLACEMENTS,
  VARIANT_SPECS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import {
  FORBIDDEN_PATTERN_DISPLAY,
  OPENING_DISPLAY,
  RULE_VARIANT_DISPLAY,
} from "@/lib/gomoku/variants.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * A rules page in one template for every game — Object, Board, Play, House
 * rules — so a player who has read one has read them all. The facts come
 * from the variant's spec and its copy, never from a second description that
 * could drift.
 */
export type RulesPage = {
  variant: RuleVariant;
  title: string;
  kanji: string;
  tagline: string;
  origin: string;
  /** What you are trying to do, in one or two sentences. */
  object: string[];
  /** The board and what is on it. */
  board: string[];
  /** How a turn goes and how the game ends. */
  play: string[];
  /** The details a rules lawyer wants: what does and does not count. */
  house: string[];
  /** The screenshot, if one has been taken for this game. */
  image: string;
};

function lineWording(rule: string, length: number): string {
  switch (rule) {
    case LINE_RULES.exact:
      return `exactly ${length} in a row wins; a longer line does not`;
    case LINE_RULES.exactOpen:
      return `exactly ${length} in a row wins, and not when an opponent's stone shuts it in at both ends`;
    default:
      return `${length} or more in a row wins`;
  }
}

export function rulesPageFor(variant: RuleVariant): RulesPage {
  const spec = VARIANT_SPECS[variant];
  const copy = RULE_VARIANT_DISPLAY[variant];
  const length = spec.winLength ?? 5;
  const sizes = boardSizesFor(variant);

  const object: string[] = [];
  if (spec.misere) {
    object.push(`Avoid making ${length} in a row: the player who makes it loses.`);
  } else if (spec.loseLength !== null) {
    object.push(`Make ${length} in a row and win, without ever making exactly ${spec.loseLength}, which loses.`);
  } else {
    object.push(`Be the first to make a line: ${lineWording(spec.lineRule.black, length)}.`);
  }
  if (spec.lineRule.black !== spec.lineRule.white) {
    object.push(`For white, ${lineWording(spec.lineRule.white, length)}.`);
  }
  if (spec.captures) object.push("Capturing five pairs of enemy stones also wins.");
  if (spec.squareWins) object.push("Four of your pieces in a 2×2 square also wins.");

  const board: string[] = [
    sizes.length === 1
      ? `A ${sizes[0]}×${sizes[0]} board.`
      : `A square board of ${sizes.join(", ")} lines; ${sizes[0]}×${sizes[0]} by default.`,
  ];
  if (spec.quadrantSize !== null) {
    board.push(`It is divided into four ${spec.quadrantSize}×${spec.quadrantSize} quadrants, each of which can be turned.`);
  }
  if (spec.deadSquares > 0) board.push(`${spec.deadSquares === 1 ? "One square" : `${spec.deadSquares} squares`}, chosen at random when the game starts, ${spec.deadSquares === 1 ? "is" : "are"} dead: nothing can land there and no line runs through.`);
  if (spec.hotSquares > 0) board.push(`${spec.hotSquares === 1 ? "One square" : `${spec.hotSquares} squares`}, chosen at random, ${spec.hotSquares === 1 ? "is" : "are"} a hotspot that counts as either colour's stone.`);
  if (spec.wrap) board.push("The left and right edges join, so a line may run off one side and onto the other.");
  if (spec.pieces !== null) board.push(`Each player has ${spec.pieces} pieces.`);
  if (spec.queue !== null) {
    board.push(
      spec.queue === "domino"
        ? "A shared queue of dominoes: two stones each, black-black, white-white, black-white or white-black, drawn at random from the game's seed. Both players draw the same run and see the next three."
        : "A shared queue of the seven four-square shapes, each holding two black and two white stones, drawn at random from the game's seed. Both players draw the same run and see the next three.",
    );
  }

  const play: string[] = [];
  if (spec.queue !== null) {
    play.push("Each turn you lay the next piece in the queue, turned or flipped as you like, on empty points.");
    if (spec.singles > 0) play.push(`Instead of a piece you may lay a single stone of your own colour; each player has ${spec.singles} for the game.`);
    play.push("A piece carries both colours, so it can finish a line for either side; the line's owner wins whoever laid it, and a line for each at once is a draw.");
    play.push("If nothing fits, the turn passes; two passes in a row end the game as a draw.");
  } else if (spec.pieces !== null) {
    play.push(`Players first place their ${spec.pieces} pieces, one a turn. Then a turn moves one of your pieces a single step to an adjacent empty point, in any direction.`);
  } else {
    play.push(
      spec.stonesPerTurn > 1
        ? `Black opens with ${spec.firstTurnStones} stone; after that each player places ${spec.stonesPerTurn} stones a turn.`
        : "Players take turns placing one stone on an empty point.",
    );
  }
  if (spec.placement === PLACEMENTS.drop) play.push("A stone played anywhere in a column falls to the lowest empty point in it.");
  if (spec.placement === PLACEMENTS.edge) play.push("A stone may only be placed on an edge of the board or directly beside a stone already there: above, below, left or right.");
  if (spec.quadrantSize !== null) play.push("After placing, turn any one quadrant a quarter, either way. The whole board is then read for lines, for both colours.");
  if (spec.captures) play.push("Flanking exactly two enemy stones in a line, with your stone at each end, captures the pair. Only the closing stone captures; moving into a flanked position is safe.");
  if (spec.lineClear) play.push("When the bottom row is full it disappears and every stone above drops one row.");
  if (spec.misere) play.push("You may not play directly on top of the opponent's last stone while any other column has room. A full board is a win for the player who opened.");
  else play.push(spec.quadrantSize !== null ? "A full board with no line, after its last turn, is a draw; a line for both colours at once is a draw." : "A full board with no line is a draw.");

  const house: string[] = [];
  for (const stone of ["black", "white"] as const) {
    const patterns = spec.forbidden[stone];
    if (patterns.length > 0) {
      house.push(
        `${stone === "black" ? "Black" : "White"} may not make ${patterns
          .map((pattern) => `a ${FORBIDDEN_PATTERN_DISPLAY[pattern].label} (${FORBIDDEN_PATTERN_DISPLAY[pattern].kanji})`)
          .join(", ")}. Those points are marked on the board and cannot be played. A five wins even when the same stone would make a forbidden shape.`,
      );
    }
  }
  house.push(spec.allowFirstPlayerChoice ? "Either colour may open, or the first stone may be drawn by lot." : "Black always opens.");
  if (spec.openings.length > 1) {
    house.push(`Openings on offer: ${spec.openings.map((opening) => OPENING_DISPLAY[opening].label).join(", ")}.`);
  }
  house.push(spec.analysis ? "The threat reading, hints and the chance-of-winning bar apply." : "The threat reading, hints and the chance-of-winning bar are switched off: stones move after they are placed, so a line-by-line reading says nothing true.");
  house.push(copy.board);

  return {
    variant,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    object,
    board,
    play,
    house,
    image: `/games/${variant}.jpg`,
  };
}
