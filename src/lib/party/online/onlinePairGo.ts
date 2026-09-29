import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { botTierFor } from "@/lib/bots/bots";
import { GAME_STATUS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { tiersFor } from "@/lib/gomoku/expert/experts";
import { chooseTurn } from "@/lib/gomoku/opponent";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { BROWSER_MOVE_MILLIS } from "@/lib/gomoku/botWorker.constants";
import {
  PAIR_GO_SIZES,
  decodePairGo,
  encodePairGo,
  pairPass,
  pairPlay,
  pairPlayerToMove,
  pairResign,
  startPairGo,
} from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";

import { readPoint } from "./onlinePoints";
import type { OnlineRules } from "./online.types";

/**
 * PAIR GO ON SEVERAL DEVICES: the engine's own Go for two teams of two
 * (`pairGo.ts`), each of the four on their own device — or a seat given to
 * one of the site's Go programs, whose move is worked out in a browser at the
 * table by the same chooser the live board's computer players use
 * (`chooseTurn`, on the browser's budget), and checked by the server like
 * anybody's.
 *
 * A SEAT IS A PLACE IN THE ORDER ROUND THE TABLE: seat 1 is Black's first
 * player, seat 2 White's first, seat 3 Black's second and seat 4 White's
 * second — `turnOrder` in `pairGo.ts`, since Black opens. Only the four
 * players count.
 */

/** A move at Pair Go: a stone on a point, a pass, or the team to move resigning. */
export type PairGoMove = { kind: "stone"; row: number; col: number } | { kind: "pass" } | { kind: "resign" };

/** Four players, always. */
const PAIR_GO_PLAYERS = 4;

/** The colour a seat plays: Black at seats 1 and 3, White at 2 and 4. */
export function pairSeatStone(seat: number): Stone {
  return seat % 2 === 0 ? STONES.black : STONES.white;
}

/** The Go programs a seat may be given: the site's ladder, as Go's own set-up offers it (`tiersFor`). */
const GO_LEVELS: readonly BotTier[] = tiersFor(RULE_VARIANTS.go);

export const PAIR_GO_ONLINE: OnlineRules<PairGoGame, PairGoMove> = {
  sizes: PAIR_GO_SIZES,
  counts: [PAIR_GO_PLAYERS],
  start: (size, count) => (count === PAIR_GO_PLAYERS && PAIR_GO_SIZES.includes(size) ? startPairGo(size, { black: ["", ""], white: ["", ""] }) : null),
  encode: encodePairGo,
  decode: (text) => decodePairGo(text),
  toPlay: (game) => pairPlayerToMove(game)?.turnOrder ?? null,
  // The winning team's two seats; a count that comes out level names nobody.
  winners: (game) => {
    const { winner, status } = game.state;
    if (status !== GAME_STATUS.won || winner === null) return [];
    return [0, 1, 2, 3].filter((seat) => pairSeatStone(seat) === winner);
  },
  moveCount: (game) => game.state.moves.length + (game.resigned === null ? 0 : 1),
  readMove: (sent) => {
    if (typeof sent !== "object" || sent === null) return null;
    const { kind } = sent as { kind?: unknown };
    if (kind === "pass" || kind === "resign") return { kind };
    if (kind !== "stone") return null;
    const point = readPoint(sent, Math.max(...PAIR_GO_SIZES));
    return point === null ? null : { kind, row: point.row, col: point.col };
  },
  play: (game, move) => {
    if (move.kind === "pass") return pairPass(game);
    if (move.kind === "resign") return pairResign(game);
    if (move.row >= game.state.settings.size || move.col >= game.state.settings.size) return null;
    return pairPlay(game, { row: move.row, col: move.col });
  },
  // Black 1, White 1, Black 2, White 2: the teams read from the seats in turn order.
  named: (game, names) => ({
    ...game,
    teams: {
      black: [names[0] ?? game.teams.black[0], names[2] ?? game.teams.black[1]],
      white: [names[1] ?? game.teams.white[0], names[3] ?? game.teams.white[1]],
    },
  }),
  computers: {
    levels: GO_LEVELS,
    seat: (level) => {
      const bot = BOT_MEMBERS[level as BotTier];
      return { memberId: bot.id, name: bot.name };
    },
    levelOf: (seat) => {
      const tier = botTierFor(seat.memberId);
      return tier !== null && GO_LEVELS.includes(tier) ? tier : null;
    },
    /*
     * The ladder's chooser, on the browser's budget. It plays the colour the
     * engine has to move, which is this seat's; a program with nothing to
     * play passes, as the live board's does.
     */
    move: (game, _seat, level) => {
      const turn = chooseTurn(game.state, level as BotTier, Math.random, { millis: BROWSER_MOVE_MILLIS });
      if (turn === null || turn.kind === "pass") return { kind: "pass" };
      return turn.kind === "place" ? { kind: "stone", row: turn.row, col: turn.col } : { kind: "pass" };
    },
  },
};
