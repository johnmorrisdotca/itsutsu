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
import { replayGame } from "@/lib/gomoku/replay";
import { startingDiscs } from "@/lib/gomoku/rules/flips";
import { scoreArea } from "@/lib/gomoku/rules/go";
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
    if (move.kind === MOVE_KINDS.pass) continue;
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
    const margin = spec.komi === null ? "" : areaMargin(game, game.result, spec.komi);
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
function commentFor(game: SgfSource, spec: SgfTypeSpec, unwrittenPasses: number): string[] {
  const lines: string[] = [];
  if (spec.rulesComment !== null) lines.push(spec.rulesComment);
  if (game.opening !== OPENING_RULES.free) {
    const opening = OPENING_DISPLAY[game.opening as OpeningRule];
    lines.push(`Opening: ${opening.label}. ${opening.tagline}`);
  }
  const handicap = handicapLine(game.handicap);
  if (handicap !== null) lines.push(handicap);
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
  return lines;
}

function nodeFor(move: GameMove, spec: SgfTypeSpec): string | null {
  const who = colour(move.stone);
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
  if (spec.komi !== null) props.push(`KM[${spec.komi}]`);

  const unwrittenPasses = spec.passes === "unwritable" ? game.moves.filter((move) => move.kind === MOVE_KINDS.pass).length : 0;
  const comment = commentFor(game, spec, unwrittenPasses);
  if (comment.length > 0) props.push(`GC[${text(comment.join("\n"))}]`);
  if (game.opener === STONES.white) props.push("PL[W]");

  if (spec.startingDiscs) {
    const discs = startingDiscs({ ...DEFAULT_SETTINGS, variant: game.variant as RuleVariant, size: game.size });
    const of = (stone: Stone) => discs.filter((disc) => disc.stone === stone).map((disc) => `[${pointFor(spec, disc.point)}]`).join("");
    props.push(`AB${of(STONES.black)}`, `AW${of(STONES.white)}`);
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
