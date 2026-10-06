import {
  LINE_RULES,
  PLACEMENTS,
  VARIANT_SPECS,
  boardSizesFor,
  defaultBoardFor,
} from "@/lib/gomoku/gomoku.constants";
import { checkersBoardLine, checkersDrawLines, checkersPlayLines } from "./rulesPage.checkers";
import { hexagonCells, hexagonSide } from "@/lib/gomoku/rules/hexagon";
import { gameArtPath } from "@/lib/gomoku/artwork";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { variantCopy } from "@/lib/gomoku/variantCopy";
import { openingCopy } from "@/lib/gomoku/openingCopy";
import { aliasesFor } from "@/lib/legacy/gameAliases";
import { DEFAULT_LOCALE, type PhraseKey } from "@/lib/i18n/i18n.constants";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import type { Vars } from "@/lib/i18n/i18n.types";

import { type Origin, originFor, wikipediaUrl } from "./origins";
import type { ForbiddenPattern, RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameKey } from "@/lib/catalogue/gameKeys";

/** The separator a list of three or more is joined with in the reader's language. */
function separator(say: Speaker): string {
  return say.locale === "ja" ? "、" : ", ";
}

/** "a, b, c" — a list inside a sentence, joined the way the reader's language joins one. */
export function joined(say: Speaker, parts: readonly string[]): string {
  return parts.join(separator(say));
}

/** "a, b and c" — a list for a sentence rather than a table, with its last item joined by the reader's own "and". */
function listOf(say: Speaker, parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return say.say("rulespage.list.and", { head: joined(say, parts.slice(0, -1)), last: parts[parts.length - 1] as string });
}

/** The phrase that names each forbidden shape, with the kanji a player already knows it by. */
const PATTERN_PHRASE: Record<ForbiddenPattern, PhraseKey> = {
  doubleThree: "rulespage.pattern.doubleThree",
  doubleFour: "rulespage.pattern.doubleFour",
  overline: "rulespage.pattern.overline",
};

/**
 * A rules page in one template for every game — Object, Board, Play, House
 * rules — so a player who has read one has read them all. The facts come
 * from the variant's spec and its copy, never from a second description that
 * could drift.
 */
export type RulesPage = {
  /** The game or the puzzle this page is about: a puzzle builds one through `puzzleRulesPage`. */
  variant: GameKey;
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
  /**
   * A section for each setting of the game other than the one it comes as —
   * a Gomoji's languages and word lists (`gameSettings.ts`), each with where
   * its words come from and what plays differently. Absent for a game with none.
   */
  settings?: { id: string; heading: string; kanji: string; lines: string[] }[];
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

function lineWording(say: Speaker, rule: string, length: number): string {
  switch (rule) {
    case LINE_RULES.exact:
      return say.say("rulespage.object.ruleExact", { length: String(length) });
    case LINE_RULES.exactOpen:
      return say.say("rulespage.object.ruleExactOpen", { length: String(length) });
    default:
      return say.say("rulespage.object.ruleAtLeast", { length: String(length) });
  }
}

export function rulesPageFor(variant: RuleVariant, say: Speaker = speaker(DEFAULT_LOCALE)): RulesPage {
  const spec = VARIANT_SPECS[variant];
  const copy = variantCopy(variant, say.locale);
  const length = spec.winLength ?? 5;
  const sizes = boardSizesFor(variant);
  const word = (key: PhraseKey, vars?: Vars) => say.say(key, vars);

  const object: string[] = [];
  if (spec.connects) {
    object.push(word("rulespage.object.connectsJoin"));
    object.push(word("rulespage.object.connectsNoDraw"));
  } else if (spec.camps) {
    object.push(word("rulespage.object.campsFill"));
    object.push(word("rulespage.object.campsBlock"));
  } else if (spec.chineseCheckers) {
    object.push(word("rulespage.object.starFill"));
    object.push(word("rulespage.object.starBlock"));
  } else if (spec.flips) {
    object.push(spec.misere ? word("rulespage.object.flipsFewer") : word("rulespage.object.flipsMore"));
    object.push(word("rulespage.object.flipsEnd"));
  } else if (spec.checkers) {
    object.push(word("rulespage.object.checkersNoMove"));
    object.push(word("rulespage.object.checkersNoLines"));
  } else if (spec.go) {
    object.push(word("rulespage.object.goSurround"));
    object.push(word("rulespage.object.goCapture"));
  } else if (spec.makerBreaker) {
    object.push(word("rulespage.object.makerBreaker", { length: String(length) }));
  } else if (spec.misere) {
    object.push(word("rulespage.object.misere", { length: String(length) }));
  } else if (spec.loseLength !== null) {
    object.push(word("rulespage.object.loseLength", { length: String(length), lose: String(spec.loseLength) }));
  } else {
    object.push(word("rulespage.object.line", { rule: lineWording(say, spec.lineRule.black, length) }));
  }
  if (spec.lineRule.black !== spec.lineRule.white) {
    object.push(word("rulespage.object.lineWhite", { rule: lineWording(say, spec.lineRule.white, length) }));
  }
  if (spec.captures && spec.capturesToWin !== null) {
    object.push(
      word(spec.captureSizes.length > 1 ? "rulespage.object.capturesBoth" : "rulespage.object.capturesPairs", {
        stones: say.count("rulespage.count.enemyStone", spec.capturesToWin),
      }),
    );
  }
  if (spec.anyColour && !spec.makerBreaker) object.push(word("rulespage.object.anyColour"));
  if (spec.squareWins) object.push(word("rulespage.object.square"));

  // The honeycomb is not a square of anything, and says what it is below.
  // The board this game OPENS on, which is not the first of the list: the list
  // is in numerical order and the default is a decision — see `defaultBoardFor`.
  const opens = defaultBoardFor(variant);
  const board: string[] = spec.hexagon
    ? []
    : [
        sizes.length === 1
          ? word("rulespage.board.sizeOne", { size: String(sizes[0]) })
          : word("rulespage.board.sizeMany", { sizes: joined(say, sizes.map(String)), opens: String(opens) }),
      ];
  if (spec.quadrantSize !== null) {
    board.push(word("rulespage.board.quadrants", { size: String(spec.quadrantSize) }));
  }
  if (spec.rocks !== null && spec.rocks.arriveAfter !== null) {
    board.push(
      word("rulespage.board.rocksFall", {
        after: say.count("rulespage.count.stone", spec.rocks.arriveAfter),
        dead: say.count("rulespage.count.rock", spec.deadSquares),
        hot: say.count("rulespage.count.hotspot", spec.hotSquares),
      }),
    );
  } else if (spec.rocks !== null) {
    board.push(word("rulespage.board.rocks", { dead: say.count("rulespage.count.point", spec.deadSquares) }));
    board.push(word("rulespage.board.hotspots", { hot: String(spec.hotSquares) }));
  } else {
    if (spec.deadSquares > 0) {
      board.push(spec.deadSquares === 1 ? word("rulespage.board.deadOne") : word("rulespage.board.deadMany", { count: String(spec.deadSquares) }));
    }
    if (spec.hotSquares > 0) {
      board.push(spec.hotSquares === 1 ? word("rulespage.board.hotOne") : word("rulespage.board.hotMany", { count: String(spec.hotSquares) }));
    }
  }
  if (spec.wrap === "columns") board.push(word("rulespage.board.wrapColumns"));
  if (spec.wrap === "both") board.push(word("rulespage.board.wrapBoth"));
  if (spec.wormholes > 0) board.push(word("rulespage.board.wormholes"));
  if (spec.pieces !== null) board.push(word("rulespage.board.pieces", { pieces: say.count("rulespage.count.piece", spec.pieces) }));
  if (spec.connects) board.push(word("rulespage.board.connects"));
  if (spec.camps) board.push(word("rulespage.board.camps"));
  if (spec.checkers) board.push(checkersBoardLine(variant, opens, say));
  if (spec.hexagon) {
    /*
     * COUNTED, NOT LOOKED UP. This line used to read the two boards off a
     * pair of ternaries on `sizes[0] === 11`, which said 61 for every board
     * that was not the eleven-square — true while there were two boards and
     * false the moment a third was offered. `hexagonCells` works it out from
     * the radius, so the sentence is right at any size the game is given.
     *
     * The line game's own reading (no `flips`) leaves the centre open, and only
     * three of the six neighbour directions are lattice axes a line can run along.
     */
    const sealed = spec.flips;
    board.push(
      word(sealed ? "rulespage.board.hexFlips" : "rulespage.board.hexLines", {
        side: say.words(hexagonSide(opens)),
        cells: String(hexagonCells(opens)),
      }),
    );
    const others = sizes.filter((size) => size !== opens);
    if (others.length > 0) {
      board.push(
        word(sealed ? "rulespage.board.hexFlipsOthers" : "rulespage.board.hexLinesOthers", {
          boards: String(others.length + 1),
          list: listOf(
            say,
            others.map((size) => word("rulespage.board.hexOther", { cells: String(hexagonCells(size)), side: say.words(hexagonSide(size)) })),
          ),
        }),
      );
    }
  }
  if (spec.chineseCheckers) board.push(word("rulespage.board.star"));
  if (spec.go) board.push(word("rulespage.board.go"));
  if (spec.queue !== null) {
    board.push(word(spec.queue === "domino" ? "rulespage.board.queueDomino" : "rulespage.board.queueShapes"));
  }

  const play: string[] = [];
  if (spec.connects) {
    play.push(word("rulespage.play.connectsTurn"));
    play.push(word("rulespage.play.connectsLines"));
    play.push(word("rulespage.play.connectsEnd"));
  } else if (spec.camps) {
    play.push(word("rulespage.play.campsStep"));
    play.push(word("rulespage.play.campsJump"));
    play.push(word("rulespage.play.jumpedStays"));
    play.push(word("rulespage.play.campsEnd"));
  } else if (spec.chineseCheckers) {
    play.push(word("rulespage.play.starStep"));
    play.push(word("rulespage.play.starJump"));
    play.push(word("rulespage.play.jumpedStays"));
    play.push(word("rulespage.play.starEnd"));
  } else if (spec.flips && spec.hexagon) {
    play.push(word("rulespage.play.hexStart"));
    play.push(word("rulespage.play.hexBracket"));
    play.push(word("rulespage.play.hexPass"));
    play.push(word("rulespage.play.hexCount"));
  } else if (spec.queue !== null) {
    play.push(word("rulespage.play.queueLay"));
    if (spec.singles > 0) play.push(word("rulespage.play.queueSingles", { count: String(spec.singles) }));
    play.push(word("rulespage.play.queueLines"));
    play.push(word("rulespage.play.queuePass"));
  } else if (spec.checkers) {
    play.push(...checkersPlayLines(variant, say));
  } else if (spec.go) {
    play.push(word("rulespage.play.goTurn"));
    play.push(word("rulespage.play.goCapture"));
    play.push(word("rulespage.play.goKo"));
    play.push(word("rulespage.play.goPass"));
  } else if (spec.pieces !== null) {
    play.push(word("rulespage.play.pieces", { pieces: say.count("rulespage.count.piece", spec.pieces) }));
  } else {
    play.push(
      spec.stonesPerTurn > 1
        ? word("rulespage.play.stonesMany", {
            first: say.count("rulespage.count.stone", spec.firstTurnStones),
            per: say.count("rulespage.count.stone", spec.stonesPerTurn),
          })
        : word("rulespage.play.stoneOne"),
    );
  }
  if (spec.singleColour) play.push(word("rulespage.play.singleColour"));
  else if (spec.anyColour) play.push(word("rulespage.play.anyColour"));
  if (spec.placement === PLACEMENTS.drop) play.push(word("rulespage.play.drop"));
  if (spec.placement === PLACEMENTS.edge) play.push(word("rulespage.play.edge"));
  if (spec.quadrantSize !== null) play.push(word("rulespage.play.quadrant"));
  if (spec.captures) {
    play.push(word(spec.captureSizes.length > 1 ? "rulespage.play.capturesBoth" : "rulespage.play.capturesPair"));
  }
  if (spec.lineClear) play.push(word("rulespage.play.lineClear"));
  if (spec.flips || spec.camps || spec.connects || spec.checkers || spec.chineseCheckers || spec.go) {
    // Said above; a full board is only the usual way for both to be stuck, a race has no full board, checkers ends with pieces gone, and Go ends on two passes, not a full board.
  } else if (spec.misere) {
    if (spec.placement === PLACEMENTS.drop) play.push(word("rulespage.play.misereDrop"));
    play.push(word("rulespage.play.misereFull"));
  } else if (spec.makerBreaker) play.push(word("rulespage.play.makerFull"));
  else play.push(spec.quadrantSize !== null ? word("rulespage.play.drawQuadrant") : word("rulespage.play.drawFull"));

  const house: string[] = [];
  for (const stone of ["black", "white"] as const) {
    const patterns = spec.forbidden[stone];
    if (patterns.length > 0) {
      house.push(
        word("rulespage.house.forbidden", {
          stone: word(stone === "black" ? "rulespage.stone.black" : "rulespage.stone.white"),
          patterns: joined(say, patterns.map((pattern) => word(PATTERN_PHRASE[pattern]))),
        }),
      );
    }
  }
  house.push(
    spec.allowFirstPlayerChoice
      ? word("rulespage.house.chooseFirst")
      : word("rulespage.house.alwaysOpens", {
          stone: word(spec.firstStone === "black" ? "rulespage.stone.black" : "rulespage.stone.white"),
        }),
  );
  if (spec.checkers) house.push(...checkersDrawLines(variant, say));
  if (spec.openings.length > 1) {
    house.push(word("rulespage.house.openings", { names: joined(say, spec.openings.map((opening) => openingCopy(opening, say.locale).label)) }));
  }
  house.push(
    word(
      spec.analysis
        ? "rulespage.house.readingOn"
        : spec.flips
          ? "rulespage.house.readingOffFlips"
          : spec.camps || spec.chineseCheckers
            ? "rulespage.house.readingOffRace"
            : spec.connects
              ? "rulespage.house.readingOffConnects"
              : spec.checkers
                ? "rulespage.house.readingOffCheckers"
                : spec.go
                  ? "rulespage.house.readingOffGo"
                  : "rulespage.house.readingOffMoving",
    ),
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
    from: originFor(copy.country, say.locale),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(variant),
  };
}
