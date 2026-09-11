import {
  LINE_RULES,
  PLACEMENTS,
  VARIANT_SPECS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { gameArtPath } from "@/lib/gomoku/artwork";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { aliasesFor } from "@/lib/legacy/gameAliases";

import { type Origin, originFor, wikipediaUrl } from "./origins";
import { FORBIDDEN_PATTERN_DISPLAY, OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
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
  /** The game this is our version of, if it is a clone; see VariantCopy. */
  inspiredBy?: string;
  /** Every other name this game goes by, ours excluded. Empty when it goes by only one. */
  alsoKnownAs: string[];
  /** The country it comes from, with its flag, or null for a game we invented. */
  from: Origin | null;
  /** The Wikipedia article that explains it, as a full address, or null. */
  wikipedia: string | null;
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

/**
 * Every other name a game answers to, from the two places names are kept.
 *
 * `VariantCopy.alsoKnownAs` holds the names the game is published under in
 * the world; `gameAliases.ts` holds the names the play-by-mail sites gave it,
 * which are there to match imported records and happen to be the same fact.
 * Keeping one list in each place and joining them here means neither has to
 * be maintained twice, and a player searching for either kind lands right.
 *
 * Our own label is dropped, and so is any repeat that differs only in how it
 * is written. The old sites' table is a set of match keys, not prose, so it
 * holds "Go-Moku" and "Go Moku" as separate rows on purpose; printed side by
 * side in a sentence the pair reads like a mistake, and the first spelling
 * wins.
 */
function sameName(name: string): string {
  const folded = name.toLowerCase();
  // A name written in another script has no letters to fold, and folding it
  // to nothing would make every such name look like every other one.
  return folded.replace(/[^a-z0-9]/g, "") || folded;
}

function namesFor(variant: RuleVariant, label: string): string[] {
  const seen = new Set([sameName(label)]);
  const names: string[] = [];
  for (const name of [...(RULE_VARIANT_DISPLAY[variant].alsoKnownAs ?? []), ...aliasesFor(variant)]) {
    const key = sameName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

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
  if (spec.connects) {
    object.push("Join your own two sides of the board with an unbroken chain of your stones: Black the top and bottom, White the left and right.");
    object.push("A full board always has exactly one winner, so a draw is impossible — that is a fact about the shape of the board, not a rule anybody wrote.");
  } else if (spec.camps) {
    object.push("Be the first to fill the far corner camp with your pieces. Nothing is captured and no line counts for anything.");
    object.push("A side that keeps pieces at home to block still loses once every other square of its camp is taken.");
  } else if (spec.chineseCheckers) {
    object.push("Be the first to fill the point of the star directly opposite yours with your own pieces. Nothing is captured and no line counts for anything.");
    object.push("A side that keeps pieces at home to block still loses once every other cell of the far point is taken.");
  } else if (spec.flips) {
    object.push(
      spec.misere
        ? "Finish with fewer discs than the other colour. Everything turns as usual; the object is upside down."
        : "Finish with more discs than the other colour.",
    );
    object.push("The game ends when neither colour has a legal move — usually a full board. Equal counts are a draw.");
  } else if (spec.checkers) {
    object.push("Leave the other side with no piece that can move: jump theirs off the board until none is left, or shut in whatever remains.");
    object.push("No lines and nothing placed after the start: every piece is down from the first move, and the whole game is in how they step and jump.");
  } else if (spec.go) {
    object.push("Surround more of the board than the other colour. Stones never move once placed, and no line ever wins anything.");
    object.push("A connected group of one colour with no empty point touching it anywhere is captured whole, off the board at once.");
  } else if (spec.makerBreaker) {
    object.push(`Black is the Maker and wins if any ${length} in a row of one colour appears, whoever placed it. White is the Breaker and wins if the board fills with no such line.`);
  } else if (spec.misere) {
    object.push(`Avoid making ${length} in a row: the player who makes it loses.`);
  } else if (spec.loseLength !== null) {
    object.push(`Make ${length} in a row and win, without ever making exactly ${spec.loseLength}, which loses.`);
  } else {
    object.push(`Be the first to make a line: ${lineWording(spec.lineRule.black, length)}.`);
  }
  if (spec.lineRule.black !== spec.lineRule.white) {
    object.push(`For white, ${lineWording(spec.lineRule.white, length)}.`);
  }
  if (spec.captures) {
    object.push(
      `Capturing ${spec.capturesToWin} enemy stones also wins${spec.captureSizes.length > 1 ? ", taken in pairs and triples" : ", five pairs"}.`,
    );
  }
  if (spec.anyColour && !spec.makerBreaker) object.push("A line of either colour wins for the player who completed it.");
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
  if (spec.wrap === "columns") {
    board.push("The left and right edges join, so a line may run off one side and onto the other.");
  }
  if (spec.wrap === "both") {
    board.push(
      "Every edge joins its opposite: left to right and top to bottom. A line running off any side continues from the far one, so the board has a middle everywhere and a corner nowhere.",
    );
  }
  if (spec.wormholes > 0) board.push("Two squares, chosen at random when the game starts, are the mouths of a wormhole. Nothing can land on a mouth, and a line that reaches one continues from the other in the same direction.");
  if (spec.pieces !== null) board.push(`Each player has ${spec.pieces} pieces.`);
  if (spec.connects) {
    board.push("A rhombus of hexagons, eleven a side by default. Black owns the top and bottom edges, marked dark; White owns the left and right, marked pale. The two corners between a dark edge and a pale one belong to both.");
  }
  if (spec.camps) {
    board.push("Each side's pieces start filling a camp in one corner, black top-left and white bottom-right: nineteen on 16×16, thirteen on 10×10, ten on 8×8. The camps are shaded on the board.");
  }
  if (spec.checkers) {
    board.push("Played on the dark squares only, thirty-two of the sixty-four. Each side starts with twelve men filling its own three rows.");
  }
  if (spec.chineseCheckers) {
    board.push("A hexagram: a centre hexagon with six triangular points, 121 cells in all. Each side's ten pieces start filling one point, black at the top and white at the bottom, shaded on the board; the far point is the one to fill.");
  }
  if (spec.go) {
    board.push("Stones sit on the intersections of the lines, not in the squares between them, so the board has one more point on a side than it has squares. The star points mark the traditional handicap spots.");
  }
  if (spec.queue !== null) {
    board.push(
      spec.queue === "domino"
        ? "A shared queue of dominoes: two stones each, black-black, white-white, black-white or white-black, drawn at random from the game's seed. Both players draw the same run and see the next three."
        : "A shared queue of the seven four-square shapes, each holding two black and two white stones, drawn at random from the game's seed. Both players draw the same run and see the next three.",
    );
  }

  const play: string[] = [];
  if (spec.connects) {
    play.push("Players take turns placing one stone on any empty cell. Nothing ever moves and nothing is ever taken.");
    play.push("The board is a rhombus of hexagons, so a cell touches six others: the four beside it, and two of the corners — the ones along the board's own slant.");
    play.push("The game ends the moment one colour's chain reaches from one of their sides to the other.");
  } else if (spec.camps) {
    play.push("A turn moves one piece. It may step to any neighbouring empty square, in any of the eight directions.");
    play.push("Or it may jump: over an adjacent piece of either colour, into the empty square straight beyond it. From there it may jump again, and again, turning corners as it likes, so long as each jump crosses a piece. A move may stop after any jump.");
    play.push("A piece jumped over is not taken; it stays where it is.");
    play.push("The game ends the moment a move fills the far camp.");
  } else if (spec.chineseCheckers) {
    play.push("A turn moves one piece. It may step to any neighbouring empty cell, in any of the six directions the board's own lattice touches.");
    play.push("Or it may jump: over an adjacent piece of either colour, into the empty cell straight beyond it. From there it may jump again, and again, turning corners as it likes, so long as each jump crosses a piece. A move may stop after any jump.");
    play.push("A piece jumped over is not taken; it stays where it is.");
    play.push("The game ends the moment a move fills the point directly opposite yours.");
  } else if (spec.flips) {
    play.push(
      spec.startingDiscs === "laid"
        ? "The board starts empty. The first four discs are laid in the centre four squares, one a turn, turning nothing."
        : "The centre four squares start with two discs of each colour, on the diagonals.",
    );
    play.push("The set-up lets a game start the other way: centre discs placed, or laid by the players.");
    play.push("A disc goes only where it brackets one or more of the other colour in a straight run — any direction — with one of your own at the far end. Every bracketed run turns to your colour.");
    play.push("A colour with nowhere to go passes, and the other colour plays again. You may not pass while you have a move.");
    play.push("When neither colour can move, the discs are counted.");
  } else if (spec.queue !== null) {
    play.push("Each turn you lay the next piece in the queue, turned or flipped as you like, on empty points.");
    if (spec.singles > 0) play.push(`Instead of a piece you may lay a single stone of your own colour; each player has ${spec.singles} for the game.`);
    play.push("A piece carries both colours, so it can finish a line for either side; the line's owner wins whoever laid it, and a line for each at once is a draw.");
    play.push("If nothing fits, the turn passes; two passes in a row end the game as a draw.");
  } else if (spec.checkers) {
    play.push("A turn moves one piece: a man steps one square diagonally forward, onto an empty square.");
    play.push("Capturing is a jump over an adjacent enemy piece into the empty square beyond, and it is forced: if any of your pieces can capture, you must play a capture rather than a step, though you may choose which one.");
    play.push("A piece that captures and can capture again from where it lands keeps jumping in the same move. A man crowned partway through always stops there — only a king may carry a chain on, and only on a later move.");
    play.push("A man reaching the far row is crowned a king, and may then step and capture backward as well as forward.");
    play.push("The game ends the moment a colour has no piece that can move: none left, or every one shut in.");
  } else if (spec.go) {
    play.push("Players take turns placing one stone on any empty intersection. Black opens; stones never move once played.");
    play.push("A stone touches its four orthogonal neighbours, not the diagonals. Play a stone that leaves an adjacent enemy group with no liberty left anywhere and the whole group comes off the board at once.");
    play.push("You may not play into your own group's last liberty unless the same move captures an enemy group and so opens one. You may not immediately retake the single stone a capture just lifted — the ko rule — though playing anywhere else first, even a pass, clears it.");
    play.push("Either side may pass instead of playing. Two passes in a row end the game and it is counted: every stone on the board plus every empty point surrounded by one colour alone, with a fixed 6.5-point bonus for white.");
  } else if (spec.pieces !== null) {
    play.push(`Players first place their ${spec.pieces} pieces, one a turn. Then a turn moves one of your pieces a single step to an adjacent empty point, in any direction.`);
  } else {
    play.push(
      spec.stonesPerTurn > 1
        ? `Black opens with ${spec.firstTurnStones} stone; after that each player places ${spec.stonesPerTurn} stones a turn.`
        : "Players take turns placing one stone on an empty point.",
    );
  }
  if (spec.singleColour) play.push("Every stone is black, whoever places it.");
  else if (spec.anyColour) play.push("On your turn you choose which colour to place.");
  if (spec.placement === PLACEMENTS.drop) play.push("A stone played anywhere in a column falls to the lowest empty point in it.");
  if (spec.placement === PLACEMENTS.edge) play.push("A stone may only be placed on an edge of the board or directly beside a stone already there: above, below, left or right.");
  if (spec.quadrantSize !== null) play.push("After placing, turn any one quadrant a quarter, either way. The whole board is then read for lines, for both colours.");
  if (spec.captures) {
    play.push(
      spec.captureSizes.length > 1
        ? "Flanking exactly two or exactly three enemy stones in a line, with your stone at each end, captures them. Only the closing stone captures; moving into a flanked position is safe."
        : "Flanking exactly two enemy stones in a line, with your stone at each end, captures the pair. Only the closing stone captures; moving into a flanked position is safe.",
    );
  }
  if (spec.lineClear) play.push("When the bottom row is full it disappears and every stone above drops one row.");
  if (spec.flips || spec.camps || spec.connects || spec.checkers || spec.chineseCheckers || spec.go) {
    // Said above; a full board is only the usual way for both to be stuck, a race has no full board, checkers ends with pieces gone, and Go ends on two passes, not a full board.
  } else if (spec.misere) {
    if (spec.placement === PLACEMENTS.drop) play.push("You may not play directly on top of the opponent's last stone while any other column has room.");
    play.push("A full board is a win for the player who opened.");
  } else if (spec.makerBreaker) play.push("A full board with no line is the Breaker's win.");
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
  house.push(
    spec.analysis
      ? "The threat reading, hints and the chance-of-winning bar apply."
      : spec.flips
        ? "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines to read here, only discs to count."
        : spec.camps || spec.chineseCheckers
          ? "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only distance to cover."
        : spec.connects
          ? "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only whether your two sides are joined."
        : spec.checkers
          ? "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only pieces jumping."
        : spec.go
          ? "The threat reading, hints and the chance-of-winning bar are switched off: there are no lines here, only groups, liberties and territory."
        : "The threat reading, hints and the chance-of-winning bar are switched off: stones move after they are placed, so a line-by-line reading says nothing true.",
  );
  house.push(copy.board);

  return {
    variant,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: namesFor(variant, copy.label),
    from: originFor(copy.country),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(variant),
  };
}
