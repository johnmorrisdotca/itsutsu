import { SUGOROKU_SEATS, sugorokuSeatName } from "./sugoroku.constants";
import type { SugorokuTable } from "./sugoroku.types";
import { sugorokuToPlay, viewOf } from "./sugorokuTable";

/**
 * WHAT A TABLE OF ONE OF THE SEVEN SAYS, in plain words: whose turn it is and
 * what they may do, the score, the cube, and the last thing that happened
 * (read from the end of the record), so nobody has to read the board to know.
 * Every line is built from the table and the seats' names and nothing else, so
 * the table on one device and the table on two say the same.
 */

/** "Single game" or "Match to 5". */
export function sugorokuLengthWords(points: number): string {
  return points === 1 ? "Single game" : `Match to ${points}`;
}

const KIND_WORDS = { single: "", gammon: " a gammon,", backgammon: " a backgammon," } as const;

/** "1 point" or "4 points". */
function pointsWords(count: number): string {
  return count === 1 ? "1 point" : `${count} points`;
}

/** The names of the two seats, as the table says them. */
export function sugorokuNames(table: SugorokuTable): [string, string] {
  return [sugorokuSeatName(table.players, table.computers, 0), sugorokuSeatName(table.players, table.computers, 1)];
}

/** What the cube shows and who holds it: "Cube 2, Ann's", "Cube in the middle", or why there is none. */
export function sugorokuCubeWords(table: SugorokuTable): string {
  const { settings, game } = viewOf(table);
  if (!settings.rules.cube) return "No cube";
  if (game === null) return "";
  if (game.crawford) return "Crawford game: no cube";
  const names = sugorokuNames(table);
  if (game.cube.owner === null) return "Cube in the middle";
  return `Cube ${game.cube.value}, ${names[game.cube.owner === "white" ? 0 : 1]}'s`;
}

/** "Match to 5: Ann 2, Ben 1", or just the length for a single game. */
export function sugorokuScoreWords(table: SugorokuTable): string {
  const { match } = viewOf(table);
  const names = sugorokuNames(table);
  return table.points === 1 ? sugorokuLengthWords(1) : `${sugorokuLengthWords(table.points)}: ${names[0]} ${match.score[0]}, ${names[1]} ${match.score[1]}`;
}

/** What the table waits on, said for the seat to play: "Ann to play: roll the dice". */
export function sugorokuStatus(table: SugorokuTable): string {
  const { game, match } = viewOf(table);
  const names = sugorokuNames(table);
  if (game === null) return match.winner === null ? "The match is drawn." : `${names[match.winner === "white" ? 0 : 1]} wins the match.`;
  const seat = sugorokuToPlay(table);
  const name = seat === null ? "" : names[seat];
  if (game.phase === "double-offered") return `${names[game.offeredBy === "white" ? 0 : 1]} doubles to ${game.cube.value * 2}. ${name}: take it or drop it?`;
  if (game.phase === "playing") return `${name} to play the opening roll.`;
  return `${name} to play: roll the dice${viewOfCanDouble(table) ? ", or double" : ""}.`;
}

/** Whether the seat to play may double now: the cube is in play and theirs or in the middle. */
function viewOfCanDouble(table: SugorokuTable): boolean {
  const { game, settings } = viewOf(table);
  if (game === null || game.phase !== "before-roll" || !settings.rules.cube || game.crawford) return false;
  return game.cube.owner === null || game.cube.owner === game.turn;
}

/** How a finished match is said: "Ann wins the match 5 to 3.", "Ann wins.", "Drawn." */
export function sugorokuEnding(table: SugorokuTable): string {
  const { match, last } = viewOf(table);
  const names = sugorokuNames(table);
  if (!match.over) return "";
  if (match.winner === null) return "The match is drawn.";
  const winner = names[match.winner === "white" ? 0 : 1];
  if (table.points === 1) {
    const kind = last === null ? "single" : last.result.kind;
    return `${winner} wins${last?.result.how === "drop" ? " (the double was dropped)" : last?.result.how === "concede" ? " (the other side gave up)" : ""}${kind === "gammon" ? " with a gammon" : kind === "backgammon" ? " with a backgammon" : ""}.`;
  }
  const high = Math.max(match.score[0], match.score[1]);
  const low = Math.min(match.score[0], match.score[1]);
  return `${winner} wins the match ${high} to ${low}.`;
}

/** What each seat has to show: its points in a match, or its checkers borne off in a single game. */
export function sugorokuStanding(table: SugorokuTable, seat: number): string {
  const { match, game, last } = viewOf(table);
  if (table.points > 1) return pointsWords(match.score[seat] ?? 0);
  const position = game?.position ?? last?.position;
  return position === undefined ? "" : `${position.off[seat] ?? 0} off`;
}

const SIDE_SEAT = { white: 0, black: 1 } as const;

/** The last thing that happened, as the record says it: "Ben rolled 6 4 and played 24/18 13/9", or how a game ended. */
export function sugorokuNews(table: SugorokuTable): string {
  const names = sugorokuNames(table);
  const lines = table.text
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line !== "");
  let began = "";
  for (let at = lines.length - 1; at >= 0; at -= 1) {
    const line = lines[at];
    const game = /^game\s+(\d+)$/.exec(line);
    if (game !== null) {
      began = ` Game ${game[1]} begins.`;
      continue;
    }
    if (/^open\b/.test(line)) continue;
    const result = /^result\s+(white|black|none)\s+(\S+)\s+(\S+)\s+(\d+)$/.exec(line);
    if (result !== null) {
      if (result[1] === "none") return `The game was drawn.${began}`;
      const winner = names[SIDE_SEAT[result[1] as "white" | "black"]];
      const how = result[2] === "drop" ? ", the double dropped," : result[2] === "concede" ? ", the other side gave up," : KIND_WORDS[result[3] as keyof typeof KIND_WORDS];
      return `${winner} won the game${how} for ${pointsWords(Number(result[4]))}.${began}`;
    }
    const sided = /^(white|black)\s+(.*)$/.exec(line);
    if (sided === null) return "";
    const name = names[SIDE_SEAT[sided[1] as "white" | "black"]];
    const rest = sided[2];
    if (rest === "doubles") return `${name} doubled.`;
    if (rest === "takes") return `${name} took the double.`;
    if (rest === "drops") return `${name} dropped the double.`;
    if (/^concedes/.test(rest)) return `${name} gave up the game.`;
    const turn = /^(\d{2,3}):\s*(.*)$/.exec(rest);
    if (turn === null) return "";
    const dice = [...turn[1]].join(" ");
    return turn[2] === "-" ? `${name} rolled ${dice} and could not move.` : `${name} rolled ${dice} and played ${turn[2]}.`;
  }
  return began === "" ? "" : began.trim();
}

/** The two seats' names under their colour, for a place at the table: "white" and "black" are the sides' own words. */
export function sugorokuSideName(seat: number): string {
  return SUGOROKU_SEATS[seat] === "white" ? "White" : "Black";
}

/** The dice of the turn just played, when the last thing the record says is a turn: so a table can show what the other side rolled, dimmed. */
export function sugorokuLastRoll(table: SugorokuTable): { side: "white" | "black"; values: number[] } | null {
  const lines = table.text
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line !== "");
  const last = lines.at(-1);
  const turn = last === undefined ? null : /^(white|black)\s+(\d{2,3}):/.exec(last);
  return turn === null ? null : { side: turn[1] as "white" | "black", values: [...turn[2]].map(Number) };
}
