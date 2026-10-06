import type { Speaker } from "../../i18n/i18n";

import { SUGOROKU_SEATS, sugorokuSeatName } from "./sugoroku.constants";
import type { SugorokuTable } from "./sugoroku.types";
import { sugorokuToPlay, viewOf } from "./sugorokuTable";

/**
 * WHAT A TABLE OF ONE OF THE SEVEN SAYS, in plain words: whose turn it is and
 * what they may do, the score, the cube, and the last thing that happened
 * (read from the end of the record), so nobody has to read the board to know.
 * Every line is built from the table and the seats' names and nothing else, so
 * the table on one device and the table on two say the same. Each is a phrase
 * (`party.sugoroku.*`), said in the speaker's language.
 */

/** "Single game" or "Match to 5". */
export function sugorokuLengthWords(points: number, say: Speaker): string {
  return points === 1 ? say.say("party.sugoroku.lengthSingle") : say.say("party.sugoroku.lengthMatch", { points: String(points) });
}

/** "1 point" or "4 points". */
function pointsWords(count: number, say: Speaker): string {
  return say.count("party.sugoroku.points", count);
}

/** The names of the two seats, as the table says them. */
export function sugorokuNames(table: SugorokuTable, say: Speaker): [string, string] {
  return [sugorokuSeatName(table.players, table.computers, 0, say), sugorokuSeatName(table.players, table.computers, 1, say)];
}

/** What the cube shows and who holds it: "Cube 2, Ann's", "Cube in the middle", or why there is none. */
export function sugorokuCubeWords(table: SugorokuTable, say: Speaker): string {
  const { settings, game } = viewOf(table);
  if (!settings.rules.cube) return say.say("party.sugoroku.cubeNone");
  if (game === null) return "";
  if (game.crawford) return say.say("party.sugoroku.cubeCrawford");
  const names = sugorokuNames(table, say);
  if (game.cube.owner === null) return say.say("party.sugoroku.cubeMiddle");
  return say.say("party.sugoroku.cubeHeld", { value: String(game.cube.value), name: names[game.cube.owner === "white" ? 0 : 1] });
}

/** "Match to 5: Ann 2, Ben 1", or just the length for a single game. */
export function sugorokuScoreWords(table: SugorokuTable, say: Speaker): string {
  const { match } = viewOf(table);
  const names = sugorokuNames(table, say);
  return table.points === 1
    ? sugorokuLengthWords(1, say)
    : say.say("party.sugoroku.scoreLine", { length: sugorokuLengthWords(table.points, say), a: names[0], x: String(match.score[0]), b: names[1], y: String(match.score[1]) });
}

/** What the table waits on, said for the seat to play: "Ann to play: roll the dice". */
export function sugorokuStatus(table: SugorokuTable, say: Speaker): string {
  const { game, match } = viewOf(table);
  const names = sugorokuNames(table, say);
  if (game === null) return match.winner === null ? say.say("party.sugoroku.matchDrawn") : say.say("party.sugoroku.matchWinner", { name: names[match.winner === "white" ? 0 : 1] });
  const seat = sugorokuToPlay(table);
  const name = seat === null ? "" : names[seat];
  if (game.phase === "double-offered") return say.say("party.sugoroku.doubleOffered", { offerer: names[game.offeredBy === "white" ? 0 : 1], value: String(game.cube.value * 2), name });
  if (game.phase === "playing") return say.say("party.sugoroku.openingRoll", { name });
  return say.say(viewOfCanDouble(table) ? "party.sugoroku.rollTurnDouble" : "party.sugoroku.rollTurn", { name });
}

/** Whether the seat to play may double now: the cube is in play and theirs or in the middle. */
function viewOfCanDouble(table: SugorokuTable): boolean {
  const { game, settings } = viewOf(table);
  if (game === null || game.phase !== "before-roll" || !settings.rules.cube || game.crawford) return false;
  return game.cube.owner === null || game.cube.owner === game.turn;
}

/** How a finished match is said: "Ann wins the match 5 to 3.", "Ann wins.", "Drawn." */
export function sugorokuEnding(table: SugorokuTable, say: Speaker): string {
  const { match, last } = viewOf(table);
  const names = sugorokuNames(table, say);
  if (!match.over) return "";
  if (match.winner === null) return say.say("party.sugoroku.matchDrawn");
  const winner = names[match.winner === "white" ? 0 : 1];
  if (table.points === 1) {
    const kind = last === null ? "single" : last.result.kind;
    const how = last?.result.how === "drop" ? say.say("party.sugoroku.howDrop") : last?.result.how === "concede" ? say.say("party.sugoroku.howConcede") : "";
    const withKind = kind === "gammon" ? say.say("party.sugoroku.kindGammon") : kind === "backgammon" ? say.say("party.sugoroku.kindBackgammon") : "";
    return say.say("party.sugoroku.endWins", { winner, how, kind: withKind });
  }
  const high = Math.max(match.score[0], match.score[1]);
  const low = Math.min(match.score[0], match.score[1]);
  return say.say("party.sugoroku.endMatchWins", { winner, high: String(high), low: String(low) });
}

/** What each seat has to show: its points in a match, or its checkers borne off in a single game. */
export function sugorokuStanding(table: SugorokuTable, seat: number, say: Speaker): string {
  const { match, game, last } = viewOf(table);
  if (table.points > 1) return pointsWords(match.score[seat] ?? 0, say);
  const position = game?.position ?? last?.position;
  return position === undefined ? "" : say.say("party.sugoroku.off", { count: String(position.off[seat] ?? 0) });
}

const SIDE_SEAT = { white: 0, black: 1 } as const;

/** The last thing that happened, as the record says it: "Ben rolled 6 4 and played 24/18 13/9", or how a game ended. */
export function sugorokuNews(table: SugorokuTable, say: Speaker): string {
  const names = sugorokuNames(table, say);
  const lines = table.text
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line !== "");
  let began = "";
  for (let at = lines.length - 1; at >= 0; at -= 1) {
    const line = lines[at];
    const game = /^game\s+(\d+)$/.exec(line);
    if (game !== null) {
      began = say.say("party.sugoroku.gameBegins", { n: game[1] });
      continue;
    }
    if (/^open\b/.test(line)) continue;
    const result = /^result\s+(white|black|none)\s+(\S+)\s+(\S+)\s+(\d+)$/.exec(line);
    if (result !== null) {
      if (result[1] === "none") return say.sentences([say.say("party.sugoroku.newsDrawn"), began].filter((part) => part !== ""));
      const winner = names[SIDE_SEAT[result[1] as "white" | "black"]];
      const points = pointsWords(Number(result[4]), say);
      const key =
        result[2] === "drop"
          ? "party.sugoroku.newsWonDrop"
          : result[2] === "concede"
            ? "party.sugoroku.newsWonConcede"
            : result[3] === "gammon"
              ? "party.sugoroku.newsWonGammon"
              : result[3] === "backgammon"
                ? "party.sugoroku.newsWonBackgammon"
                : "party.sugoroku.newsWon";
      return say.sentences([say.say(key, { winner, points }), began].filter((part) => part !== ""));
    }
    const sided = /^(white|black)\s+(.*)$/.exec(line);
    if (sided === null) return "";
    const name = names[SIDE_SEAT[sided[1] as "white" | "black"]];
    const rest = sided[2];
    if (rest === "doubles") return say.say("party.sugoroku.newsDoubled", { name });
    if (rest === "takes") return say.say("party.sugoroku.newsTook", { name });
    if (rest === "drops") return say.say("party.sugoroku.newsDropped", { name });
    if (/^concedes/.test(rest)) return say.say("party.sugoroku.newsConceded", { name });
    const turn = /^(\d{2,3}):\s*(.*)$/.exec(rest);
    if (turn === null) return "";
    const dice = [...turn[1]].join(" ");
    return turn[2] === "-" ? say.say("party.sugoroku.newsNoMove", { name, dice }) : say.say("party.sugoroku.newsPlayed", { name, dice, play: turn[2] });
  }
  return began;
}

/** The two seats' names under their colour, for a place at the table: "white" and "black" are the sides' own words. */
export function sugorokuSideName(seat: number, say: Speaker): string {
  return say.say(SUGOROKU_SEATS[seat] === "white" ? "party.sugoroku.sideWhite" : "party.sugoroku.sideBlack");
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
