import { MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { replayTimeline } from "@/lib/gomoku/replay";
import { isDarkSquare } from "@/lib/gomoku/rules/checkers";
import { slugFor } from "@/lib/gomoku/slugs";
import type { SgfSource } from "./sgf.types";

/**
 * A FINISHED DRAUGHTS GAME AS A .pdn FILE — Portable Draughts Notation, what
 * SGF is for go and PGN for chess. John, 2026-09-24, reading a vint.ee
 * replay: "I found out how they do their moves: for your info. do we use this
 * system?" SGF has no number for the draughts family (`sgf.ts` refuses it), so
 * until now a checkers game could not be taken away at all.
 *
 * WHAT EACH GAME IS CALLED IN A FILE: its PDN GameType number, and the
 * notation that number is read in. The numbered games name each dark square
 * 1, 2, 3… row by row from Black's side, left to right, as their diagrams
 * print them (English checkers 1–32, international 1–50, Canadian 1–72). The
 * Russian and Brazilian games are written in algebraic squares, a1 in White's
 * left corner, as Russian notation writes them.
 *
 * WHY THE NUMBERS CAN BE READ STRAIGHT OFF THIS BOARD: in every game of the
 * family here, Black's men start on the top rows and the bottom-left corner
 * is a dark square (`checkersStartingPieces`, `isDarkSquare`), which is the
 * standard board in each game's own diagrams. `pdn.test.ts` holds that by the
 * openings every textbook starts with: 11-15 in checkers, 32-28 in
 * international draughts.
 *
 * WHAT IS NOT CERTAIN, said rather than hidden: PDN writes the result White
 * first, as PGN does ("2-0" is White's win in the international family,
 * "1-0" in the English one), which is how this reads the standard; a reader
 * that counts the English games Black first would see the result reversed.
 * The moves and the position are unaffected either way.
 */
type PdnType = {
  /** PDN's GameType. */
  gameType: number;
  /** Squares as a1…h8 rather than as numbers. */
  algebraic: boolean;
  /** The result tokens: White won, Black won, drawn. */
  results: { white: string; black: string; draw: string };
};

const INTERNATIONAL_RESULTS = { white: "2-0", black: "0-2", draw: "1-1" } as const;
const ENGLISH_RESULTS = { white: "1-0", black: "0-1", draw: "1/2-1/2" } as const;

/** Every game this site plays that PDN has a type for; Halma and Chinese Checkers have none. */
export const PDN_TYPES: Partial<Record<RuleVariant, PdnType>> = {
  checkers: { gameType: 21, algebraic: false, results: ENGLISH_RESULTS },
  poolCheckers: { gameType: 23, algebraic: false, results: ENGLISH_RESULTS },
  internationalDraughts: { gameType: 20, algebraic: false, results: INTERNATIONAL_RESULTS },
  canadianCheckers: { gameType: 27, algebraic: false, results: INTERNATIONAL_RESULTS },
  russianDraughts: { gameType: 25, algebraic: true, results: INTERNATIONAL_RESULTS },
  brazilianDraughts: { gameType: 26, algebraic: true, results: INTERNATIONAL_RESULTS },
};

export const PDN_MIME = "application/x-draughts-pdn";

/** Whether a game can be written as PDN: one of the family's six. */
export function pdnOffered(variant: string): boolean {
  return PDN_TYPES[variant as RuleVariant] !== undefined;
}

/** A dark square's name in the game's notation: its number, or its algebraic square. */
export function pdnSquare(size: number, point: Point, algebraic: boolean): string {
  if (algebraic) return `${"abcdefghijkl"[point.col]}${size - point.row}`;
  return String(point.row * (size / 2) + Math.floor(point.col / 2) + 1);
}

/** The position before the first move, as PDN's FEN: whose turn, then White's men and kings, then Black's. */
function fenOf(state: GameState, algebraic: boolean): string {
  const { size } = state.settings;
  const squares = (stone: Stone) =>
    state.board.flatMap((cell, index) => {
      const point = { row: Math.floor(index / size), col: index % size };
      if (cell !== stone || !isDarkSquare(point)) return [];
      const king = state.kings.some((each) => each.row === point.row && each.col === point.col);
      return [`${king ? "K" : ""}${pdnSquare(size, point, algebraic)}`];
    });
  const side = state.toPlay === STONES.white ? "W" : "B";
  return `${side}:W${squares(STONES.white).join(",")}:B${squares(STONES.black).join(",")}`;
}

/** A tag's value, with the two characters a tag cannot hold taken out. */
function tagValue(text: string): string {
  return text.replace(/["\\]/g, "").trim();
}

export type PdnWritten = { kind: "written"; text: string } | { kind: "refused" };

/**
 * The file. `playedOn` is the reader's own calendar date (YYYY-MM-DD), as the
 * SGF download takes it; anything else writes PDN's unknown date.
 *
 * A capture's hops are one move in the file: the engine keeps a multi-jump as
 * one move a hop, and PDN writes the whole path, 15x24x31 (algebraic games
 * c3:e5:g7). A turn lost on time has no move in PDN, so it is said in a
 * comment and the other side is seen to move twice.
 */
export function writePdn(game: SgfSource, playedOn: string | null): PdnWritten {
  const type = PDN_TYPES[game.variant as RuleVariant];
  if (type === undefined) return { kind: "refused" };
  const timeline = replayTimeline(game);
  const start = timeline[0];
  const played = timeline[timeline.length - 1].moves;
  const { size } = game;
  const name = (point: Point) => pdnSquare(size, point, type.algebraic);
  const [step, take] = type.algebraic ? ["-", ":"] : ["-", "x"];

  // One entry a turn: a hop that carries a chain on joins the move before it.
  const turns: { stone: string; squares: string[]; capture: boolean }[] = [];
  let forfeits = 0;
  for (const move of played) {
    if (move.kind === MOVE_KINDS.forfeit) {
      forfeits += 1;
      continue;
    }
    if (move.kind !== MOVE_KINDS.move || move.from === undefined) continue;
    const capture = move.captured !== undefined && move.captured.length > 0;
    const last = turns[turns.length - 1];
    if (capture && move.continuedChain === true && last !== undefined && last.capture && last.stone === move.stone) {
      last.squares.push(name(move));
      continue;
    }
    turns.push({ stone: move.stone, squares: [name(move.from), name(move)], capture });
  }

  const result =
    game.result === STONES.white ? type.results.white : game.result === STONES.black ? type.results.black : game.result === "draw" ? type.results.draw : "*";
  const date = playedOn !== null && /^\d{4}-\d{2}-\d{2}$/.test(playedOn) ? playedOn.replace(/-/g, ".") : "????.??.??";
  const tags = [
    ["Event", "Itsutsu"],
    ["Site", "itsutsu.com"],
    ["Date", date],
    ["White", tagValue(game.whiteName) || "?"],
    ["Black", tagValue(game.blackName) || "?"],
    ["Result", result],
    ["GameType", String(type.gameType)],
    ["FEN", fenOf(start, type.algebraic)],
  ].map(([key, value]) => `[${key} "${value}"]`);

  // Numbered from the side that opened: "1. 11-15 23-19", and "1... 23-19" where a turn was lost before it.
  const words: string[] = [];
  if (forfeits > 0) words.push(`{${forfeits} ${forfeits === 1 ? "turn was" : "turns were"} lost on time; the other side moves twice running there.}`);
  let number = 0;
  let previous: string | null = null;
  for (const turn of turns) {
    if (turn.stone === start.toPlay) {
      number += 1;
      words.push(`${number}.`);
    } else if (previous !== start.toPlay) {
      // The opener's half of this move was lost on time: the reply stands alone, numbered on.
      number += 1;
      words.push(`${number}...`);
    }
    words.push(turn.squares.join(turn.capture ? take : step));
    previous = turn.stone;
  }
  words.push(result);

  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line !== "" && line.length + 1 + word.length > 79) {
      lines.push(line);
      line = word;
    } else line = line === "" ? word : `${line} ${word}`;
  }
  if (line !== "") lines.push(line);
  return { kind: "written", text: `${tags.join("\n")}\n\n${lines.join("\n")}\n` };
}

/** `checkers-Hanako-vs-Taro-2026-09-10.pdn`, in the SGF file's own shape. */
export function pdnFileName(game: Pick<SgfSource, "variant" | "blackName" | "whiteName">, playedOn: string | null): string {
  const word = (text: string) => text.replace(/[\\/:*?"<>|\p{Cc}]/gu, "").trim().replace(/\s+/g, "-");
  const black = word(game.blackName);
  const white = word(game.whiteName);
  const players = black !== "" && white !== "" ? `${black}-vs-${white}` : black || white;
  const date = playedOn !== null && /^\d{4}-\d{2}-\d{2}$/.test(playedOn) ? playedOn : "";
  return `${[slugFor(game.variant), players, date].filter((part) => part !== "").join("-")}.pdn`;
}
