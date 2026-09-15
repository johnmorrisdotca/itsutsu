import {
  DEFAULT_SETTINGS,
  DRAW_LIMITS,
  DRAW_LIMIT_DISPLAY,
  DRAW_LIMIT_LIST,
  GAME_STATUS,
  HANDICAP_RULES,
  MOVE_KINDS,
  OBSTACLE_LAYOUTS,
  OBSTACLE_LAYOUT_DISPLAY,
  OPENING_RULES,
  OPENING_RULE_LIST,
  RULE_VARIANT_LIST,
  STONES,
  STONE_DISPLAY,
  WIN_LENGTH,
  WIN_REASONS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import type { DrawLimit, Handicap, ObstacleLayout, OpeningRule, Point, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { HANDICAP_RULE_DISPLAY, OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import { describeHeadStart } from "@/lib/gomoku/headStartWords";
import { replayGame } from "@/lib/gomoku/replay";
import { startingDiscs } from "@/lib/gomoku/rules/flips";
import { headStartPieces, komiFor } from "@/lib/gomoku/rules/headStart";
import { scoreArea } from "@/lib/gomoku/rules/go";
import { leavesNoStone } from "@/lib/gomoku/rules/stoneless";
import { slugFor } from "@/lib/gomoku/slugs";
import type { GameMove } from "@/lib/history/gameHistory.types";
import {
  SGF_CALENDAR_DATE,
  SGF_MAX_SIZE,
  SGF_NODES_PER_LINE,
  SGF_POINT_LETTERS,
  SGF_REFUSALS,
  SGF_TYPES,
  SGF_TYPE_SPECS,
} from "./sgf.constants";
import type { SgfMappedRow, SgfRefusal, SgfSource, SgfTypeSpec, SgfWritten } from "./sgf.types";

/**
 * A filed game as an SGF file, or the reason it cannot be one.
 *
 * Pure: a game and a date in, text out. Nothing here reads a clock, a zone or
 * a request, so the file a reader downloads is the file the tests read.
 */

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

const OBSTACLE_LAYOUT_LIST = Object.values(OBSTACLE_LAYOUTS);

/** The type a stored variant is written as; null for a string that names no game here. */
export function sgfTypeFor(variant: string): SgfMappedRow | null {
  if (!isOneOf(RULE_VARIANT_LIST, variant)) return null;
  const row = SGF_TYPES[variant];
  return row.gm === null ? null : row;
}

function onBoard(size: number, point: Point): boolean {
  return Number.isInteger(point.row) && Number.isInteger(point.col) && point.row >= 0 && point.col >= 0 && point.row < size && point.col < size;
}

function placed(move: GameMove): boolean {
  return move.kind === MOVE_KINDS.place || move.kind === MOVE_KINDS.skip;
}

/** Every reason a game gets no file, checked in the order a reader would ask them. */
function checked(game: SgfSource): { refused: SgfRefusal } | { type: SgfMappedRow; spec: SgfTypeSpec } {
  const type = sgfTypeFor(game.variant);
  if (type === null) return { refused: SGF_REFUSALS.noType };
  if (game.status !== "finished") return { refused: SGF_REFUSALS.notFinished };
  const spec = SGF_TYPE_SPECS[type.gm];

  const sizes = boardSizesFor(game.variant as RuleVariant);
  if (game.size > SGF_MAX_SIZE || !sizes.includes(game.size)) return { refused: SGF_REFUSALS.boardSize };
  // Five in a row is what makes it Gomoku; freestyle lets players pick four or six.
  if (type.gm === 4 && game.winLength !== WIN_LENGTH) return { refused: SGF_REFUSALS.winLength };

  // A rule this code cannot name is a rule it cannot write down.
  if (!isOneOf(OPENING_RULE_LIST, game.opening) || !isOneOf(DRAW_LIMIT_LIST, game.drawLimit) || !isOneOf(OBSTACLE_LAYOUT_LIST, game.obstacles)) {
    return { refused: SGF_REFUSALS.rulesOutsideType };
  }
  if (
    (game.opening !== OPENING_RULES.free && !spec.carries.opening) ||
    (game.handicap.stone !== null && !spec.carries.handicap) ||
    (game.obstacles !== OBSTACLE_LAYOUTS.none && !spec.carries.obstacles)
  ) {
    return { refused: SGF_REFUSALS.rulesOutsideType };
  }

  for (const move of game.moves) {
    if (move.stone !== STONES.black && move.stone !== STONES.white) return { refused: SGF_REFUSALS.unreadableMove };
    // Neither a pass nor a turn lost on time has a point to check. See `nodeFor` for how each is written.
    if (leavesNoStone(move.kind)) continue;
    // A sliding piece, a laid domino or a twist is a move no type here can hold.
    if (!placed(move) || move.from !== undefined || move.cells !== undefined || move.twist !== undefined) {
      return { refused: SGF_REFUSALS.unreadableMove };
    }
    if (!onBoard(game.size, move)) return { refused: SGF_REFUSALS.unreadableMove };
  }
  return { type, spec };
}

/** Why this game gets no file, or null when it can have one. */
export function sgfRefusal(game: SgfSource): SgfRefusal | null {
  const result = checked(game);
  return "refused" in result ? result.refused : null;
}

/** One coordinate as SGF's point letter: a–z, then A–Z. Null past the 52nd. */
export function sgfLetter(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= SGF_MAX_SIZE) return null;
  return SGF_POINT_LETTERS[index] ?? null;
}

/** A Hex column: a–z, then aa, ab … as Hex's SGF definition counts past the alphabet. */
export function hexColumn(index: number): string {
  let rest = index + 1;
  let label = "";
  while (rest > 0) {
    const digit = (rest - 1) % 26;
    label = String.fromCharCode(97 + digit) + label;
    rest = Math.floor((rest - 1) / 26);
  }
  return label;
}

function letter(index: number): string {
  const found = sgfLetter(index);
  // Unreachable past `checked`, and a guess here would be a wrong point in a file that looks right.
  if (found === null) throw new Error(`No SGF letter for coordinate ${index}.`);
  return found;
}

function pointFor(spec: SgfTypeSpec, point: Point): string {
  return spec.points === "hex" ? `${hexColumn(point.col)}${point.row + 1}` : `${letter(point.col)}${letter(point.row)}`;
}

/** Text: a backslash and a closing bracket are the two characters SGF needs escaped. */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/]/g, "\\]");
}

/** SimpleText: the same, on one line. */
function simpleText(value: string): string {
  return text(value.replace(/\s+/g, " ").trim());
}

function colour(stone: string): "B" | "W" {
  return stone === STONES.black ? "B" : "W";
}

/**
 * Go's margin, when the board itself decided the game.
 *
 * Only when replaying the record ends in exactly the win the row reports, by
 * the count. A game given up or lost on time reaches no count, and inventing
 * one from the stones left standing would be a score nobody played for, so
 * that answers nothing and RE says only who won.
 */
function areaMargin(game: SgfSource, winner: Stone, komi: number): string {
  const final = replayGame(game);
  if (final.status !== GAME_STATUS.won || final.winBy !== WIN_REASONS.territory || final.winner !== winner) return "";
  const { black, white } = scoreArea(final.board, final.settings.size);
  return String(Math.abs(black - (white + komi)));
}

function resultFor(game: SgfSource, spec: SgfTypeSpec): string {
  if (game.result === STONES.black || game.result === STONES.white) {
    // The komi this game was counted with: less where handicap stones were given.
    const margin = spec.komi === null ? "" : areaMargin(game, game.result, komiFor(game));
    return `${colour(game.result)}+${margin}`;
  }
  // An unfinished game has no result, and SGF's word for that is Void.
  return game.result === "draw" ? "Draw" : "Void";
}

function handicapLine(handicap: Handicap): string | null {
  if (handicap.stone === null) return null;
  const rules: string[] = HANDICAP_RULES.filter((rule) => handicap[rule]).map((rule) => HANDICAP_RULE_DISPLAY[rule].label);
  if (handicap.secondStoneExclusion > 0) {
    const side = handicap.secondStoneExclusion * 2 + 1;
    rules.push(`second stone outside the central ${side}×${side}`);
  }
  if (rules.length === 0) return null;
  return `Handicap on ${STONE_DISPLAY[handicap.stone].label}: ${rules.join(", ")}.`;
}

/** What the game was played under that no SGF property can hold, in words. */
function commentFor(game: SgfSource, spec: SgfTypeSpec, unwrittenPasses: number, forfeits: number): string[] {
  const lines: string[] = [];
  if (spec.rulesComment !== null) lines.push(spec.rulesComment);
  if (game.opening !== OPENING_RULES.free) {
    const opening = OPENING_DISPLAY[game.opening as OpeningRule];
    lines.push(`Opening: ${opening.label}. ${opening.tagline}`);
  }
  const handicap = handicapLine(game.handicap);
  if (handicap !== null) lines.push(handicap);
  const headStart = describeHeadStart(game);
  if (headStart !== null) lines.push(`${headStart}.`);
  if (game.obstacles !== OBSTACLE_LAYOUTS.none) {
    const layout = OBSTACLE_LAYOUT_DISPLAY[game.obstacles as ObstacleLayout];
    lines.push(`${layout.label}: ${layout.description}`);
  }
  if (game.drawLimit !== DRAW_LIMITS.none) {
    const limit = DRAW_LIMIT_DISPLAY[game.drawLimit as DrawLimit];
    lines.push(`Length: ${limit.label}. ${limit.blurb}`);
  }
  if (unwrittenPasses > 0) {
    lines.push(
      `${unwrittenPasses} ${unwrittenPasses === 1 ? "turn" : "turns"} went by without a stone. ` +
        "SGF has no pass for this game, so none is written, and the colour that did not pass moves twice running.",
    );
  }
  if (forfeits > 0) {
    lines.push(
      `${forfeits} ${forfeits === 1 ? "turn was" : "turns were"} lost on time. ` +
        "SGF has no move for a turn lost on time, so none is written, and the other colour moves twice running.",
    );
  }
  return lines;
}

/**
 * One move as a node, or null for a turn the file says in its comment instead.
 *
 * WHAT SGF CAN SAY ABOUT A TURN LOST ON TIME: nothing, as a move. FF[4]'s
 * empty move (`B[]`, and Hex's `B[pass]`) is a PASS — a choice the rules
 * offered — and a reader replaying one in Go counts it towards the two passes
 * that end the game. BL, WL, OB and OW record time LEFT, not a turn taken
 * away, and RE's `+T` is a whole game lost on time. So a forfeit is never
 * written as a node: that would be a pass the player did not make, in a game
 * whose rules may not even have one. It is left out and counted in GC, the way
 * a pass the type cannot write already is, and the other colour's two stones
 * in a row are honest about what happened to the board.
 */
function nodeFor(move: GameMove, spec: SgfTypeSpec): string | null {
  const who = colour(move.stone);
  if (move.kind === MOVE_KINDS.forfeit) return null;
  if (move.kind !== MOVE_KINDS.pass) return `;${who}[${pointFor(spec, move)}]`;
  if (spec.passes === "empty") return `;${who}[]`;
  if (spec.passes === "word") return `;${who}[pass]`;
  return null;
}

/**
 * The file. `playedOn` is the date to write as DT, in the reader's own
 * calendar — the caller knows the zone and this does not; a date that is not
 * a whole date leaves DT out rather than writing something date-shaped.
 */
export function writeSgf(game: SgfSource, playedOn: string | null): SgfWritten {
  const result = checked(game);
  if ("refused" in result) return { kind: "refused", reason: result.refused };
  const { type, spec } = result;

  const props = ["FF[4]", `GM[${type.gm}]`, "CA[UTF-8]", `SZ[${game.size}]`];
  if (game.blackName.trim() !== "") props.push(`PB[${simpleText(game.blackName)}]`);
  if (game.whiteName.trim() !== "") props.push(`PW[${simpleText(game.whiteName)}]`);
  if (playedOn !== null && SGF_CALENDAR_DATE.test(playedOn)) props.push(`DT[${playedOn}]`);
  props.push(`RE[${resultFor(game, spec)}]`);
  if (type.rules !== null) props.push(`RU[${simpleText(type.rules)}]`);
  if (spec.komi !== null) props.push(`KM[${komiFor(game)}]`);

  const unwrittenPasses = spec.passes === "unwritable" ? game.moves.filter((move) => move.kind === MOVE_KINDS.pass).length : 0;
  const forfeits = game.moves.filter((move) => move.kind === MOVE_KINDS.forfeit).length;
  const comment = commentFor(game, spec, unwrittenPasses, forfeits);
  if (comment.length > 0) props.push(`GC[${text(comment.join("\n"))}]`);
  if (game.opener === STONES.white) props.push("PL[W]");

  /*
   * A head start's handicap stones and corners are part of the position the first
   * move is played on, so they are written as setup stones — beside Othello's
   * centre, or on their own with HA naming the handicap where the game is Go.
   */
  const given = headStartPieces({ ...DEFAULT_SETTINGS, variant: game.variant as RuleVariant, size: game.size, headStart: game.headStart });
  if (spec.startingDiscs) {
    const discs = [...startingDiscs({ ...DEFAULT_SETTINGS, variant: game.variant as RuleVariant, size: game.size }), ...given];
    const of = (stone: Stone) => discs.filter((disc) => disc.stone === stone).map((disc) => `[${pointFor(spec, disc.point)}]`).join("");
    props.push(`AB${of(STONES.black)}`, `AW${of(STONES.white)}`);
  } else if (given.length > 0) {
    if (spec.komi !== null) props.push(`HA[${given.length}]`);
    for (const stone of [STONES.black, STONES.white]) {
      const written = given.filter((piece) => piece.stone === stone).map((piece) => `[${pointFor(spec, piece.point)}]`).join("");
      if (written !== "") props.push(`${stone === STONES.black ? "AB" : "AW"}${written}`);
    }
  }

  const nodes = game.moves.map((move) => nodeFor(move, spec)).filter((node) => node !== null);
  const lines: string[] = [];
  for (let at = 0; at < nodes.length; at += SGF_NODES_PER_LINE) lines.push(nodes.slice(at, at + SGF_NODES_PER_LINE).join(""));

  const body = lines.length === 0 ? "" : `\n${lines.join("\n")}`;
  return { kind: "written", text: `(;${props.join("")}${body})\n` };
}

/** A name as it can stand in a file name: nothing a file system refuses, no spaces. */
function fileWord(name: string): string {
  return name.replace(/[\\/:*?"<>|\p{Cc}]/gu, "").trim().replace(/\s+/g, "-");
}

/** `renju-Hanako-vs-Taro-2026-09-10.sgf`: the game, the players, the day. A part nobody has is left out. */
export function sgfFileName(game: Pick<SgfSource, "variant" | "blackName" | "whiteName">, playedOn: string | null): string {
  const black = fileWord(game.blackName);
  const white = fileWord(game.whiteName);
  const players = black !== "" && white !== "" ? `${black}-vs-${white}` : black !== "" ? black : white;
  const date = playedOn !== null && SGF_CALENDAR_DATE.test(playedOn) ? playedOn : "";
  return `${[slugFor(game.variant), players, date].filter((part) => part !== "").join("-")}.sgf`;
}
