// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { Point } from "../../gomoku/gomoku.types";
import { PARTY_CHECKERS_RULES } from "../../gomoku/party/partyCheckers";
import { PARTY_HALMA_RULES } from "../../gomoku/party/partyHalma";
import { PARTY_STATUS } from "../../gomoku/party/partyRace";
import type { PartyRaceRules, PartyRaceState } from "../../gomoku/party/partyRace.types";
import type { PartyCheckersState } from "../../gomoku/party/partyCheckers.types";
import type { PartyHalmaState } from "../../gomoku/party/partyHalma.types";
import type { PairGoGame } from "../../gomoku/party/pairGo.types";
import type { PartyGame } from "../../puzzles/kumimoji/party.types";
import type { MancalaGame } from "../mancala/mancala.types";
import type { GhostGame } from "../superghost/superghost.types";
import { BLOCKS_PARTY_PLAYERS, BLOCKS_PARTY_SIZE, BLOCKS_PIECES } from "../../gomoku/party/partyBlocks.constants";
import { BLOCKS_STATUS, blocksLeaders, decodeBlocksParty, encodeBlocksParty, layBlocks, startBlocksParty } from "../../gomoku/party/partyBlocks";
import type { BlocksPieceKey, PartyBlocksState } from "../../gomoku/party/partyBlocks.types";
import { DOTS_RULES, DOTS_STATUS } from "../dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "../dotsAndBoxes/dotsAndBoxes.types";
import { PARTY_SPECS } from "../party.constants";

import type { OnlineGameKey, OnlineRules } from "./online.types";
import { fromPartyRules } from "./onlineGames.parts";
import { KUMIMOJI_ONLINE, type KumimojiMove } from "./onlineKumimoji";
import { MANCALA_ONLINE, SUPERGHOST_ONLINE, type GhostTableMove } from "./onlineWordGames";

export { fromPartyRules };
import { PAIR_GO_ONLINE, type PairGoMove } from "./onlinePairGo";
import { readPoint } from "./onlinePoints";

export { readPoint };

/**
 * EVERY GAME THAT CAN BE PLAYED ON SEVERAL DEVICES, and the rules each is
 * played by there: the SAME pure rules its table on one device plays, wrapped
 * as `OnlineRules` so the server can check a move a browser sent with nothing
 * but them (docs/plans/party-online/README.md).
 *
 * A `Record` over `OnlineGameKey`, so a key without its rules does not
 * compile. Pair Go's seats may be given to the site's Go programs
 * (`onlinePairGo.ts`); no other game here has a computer player for a table,
 * so none other offers a computer seat. Pair Go's row reads the ladder, which
 * is written with the site's aliases, so a browser spec imports the rules it
 * needs from the games' own modules rather than from here.
 */

/** A move on a race board: a piece from one point to another, both on the board. */
export type RaceMove = { from: Point; to: Point };

/** A piece laid at Block Five: which, and the squares it covers. */
export type BlocksLay = { piece: BlocksPieceKey; cells: readonly Point[] };

/** Every count from the fewest to the most. */
function countsBetween(fewest: number, most: number): number[] {
  return Array.from({ length: most - fewest + 1 }, (_, index) => fewest + index);
}

const DOTS_SPEC = PARTY_SPECS.dotsAndBoxes;

/** Dots and Boxes: a move is a line's number. */
const DOTS_ONLINE: OnlineRules<DotsGame, number> = fromPartyRules(
  DOTS_RULES,
  { sizes: DOTS_SPEC.sizes, counts: countsBetween(DOTS_SPEC.fewestPlayers, DOTS_SPEC.mostPlayers) },
  {
    toPlay: (game) => (game.status === DOTS_STATUS.playing ? game.toPlay : null),
    moveCount: (game) => game.lines.length,
    readMove: (sent) => (Number.isInteger(sent) ? (sent as number) : null),
    named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
  },
);

/** A race round the star or the square, from its pass-and-play rules: a move is a piece from a point to a point. */
function raceOnline<S extends PartyRaceState, C extends number>(rules: PartyRaceRules<S, C>): OnlineRules<S, RaceMove> {
  const counts: readonly number[] = rules.counts;
  return {
    sizes: [],
    counts,
    start: (_size, count) => (counts.includes(count) ? rules.start(count as C) : null),
    encode: rules.encode,
    decode: (text) => rules.decode(text),
    toPlay: (game) => (game.status === PARTY_STATUS.playing ? game.toPlay : null),
    winners: (game) => (game.status === PARTY_STATUS.won && game.winner !== null ? [game.winner] : []),
    moveCount: (game) => game.moves.length,
    readMove: (sent) => {
      if (typeof sent !== "object" || sent === null) return null;
      const from = readPoint((sent as { from?: unknown }).from, rules.size);
      const to = readPoint((sent as { to?: unknown }).to, rules.size);
      return from === null || to === null ? null : { from, to };
    },
    play: (game, move) => rules.move(game, move.from, move.to),
    named: (game, names) => ({ ...game, players: game.players.map((player, seat) => ({ ...player, name: names[seat] ?? player.name })) }),
  };
}

/** Block Five for four: a move is a piece and the squares it covers. */
const BLOCKS_ONLINE: OnlineRules<PartyBlocksState, BlocksLay> = {
  sizes: [],
  counts: [BLOCKS_PARTY_PLAYERS],
  start: (_size, count) => (count === BLOCKS_PARTY_PLAYERS ? startBlocksParty() : null),
  encode: encodeBlocksParty,
  decode: (text) => decodeBlocksParty(text),
  toPlay: (game) => (game.status === BLOCKS_STATUS.playing ? game.toPlay : null),
  winners: (game) => (game.status === BLOCKS_STATUS.over ? blocksLeaders(game) : []),
  moveCount: (game) => game.moves.length,
  readMove: (sent) => {
    if (typeof sent !== "object" || sent === null) return null;
    const { piece, cells } = sent as { piece?: unknown; cells?: unknown };
    if (typeof piece !== "string" || !Object.hasOwn(BLOCKS_PIECES, piece) || !Array.isArray(cells) || cells.length > 5) return null;
    const points = cells.map((cell) => readPoint(cell, BLOCKS_PARTY_SIZE));
    return points.every((point) => point !== null) ? { piece: piece as BlocksPieceKey, cells: points as Point[] } : null;
  },
  play: (game, move) => layBlocks(game, move.piece, move.cells),
  named: (game, names) => ({ ...game, players: game.players.map((player, seat) => ({ ...player, name: names[seat] ?? player.name })) }),
};

/** Each game's own game and move, so its row is typed as it is written. */
type OnlinePlays = {
  dotsAndBoxes: { game: DotsGame; move: number };
  chineseCheckers: { game: PartyCheckersState; move: RaceMove };
  halma: { game: PartyHalmaState; move: RaceMove };
  blockFive: { game: PartyBlocksState; move: BlocksLay };
  go: { game: PairGoGame; move: PairGoMove };
  kumimoji: { game: PartyGame; move: KumimojiMove };
  superghost: { game: GhostGame; move: GhostTableMove };
  mancala: { game: MancalaGame; move: number };
};

/** A table's rules, by game: a mapped type over `OnlineGameKey`, so a game added there does not compile without its row. */
export const ONLINE_GAMES: { [K in OnlineGameKey]: OnlineRules<OnlinePlays[K]["game"], OnlinePlays[K]["move"]> } = {
  dotsAndBoxes: DOTS_ONLINE,
  chineseCheckers: raceOnline(PARTY_CHECKERS_RULES),
  halma: raceOnline(PARTY_HALMA_RULES),
  blockFive: BLOCKS_ONLINE,
  go: PAIR_GO_ONLINE,
  kumimoji: KUMIMOJI_ONLINE,
  superghost: SUPERGHOST_ONLINE,
  mancala: MANCALA_ONLINE,
};

/**
 * One game's rules, for code that handles every game alike — the routes, the
 * poll, the table page. Its game and move are opaque there: whatever `decode`
 * or `readMove` hands out is only ever handed back to the same row, so the
 * types each row was written with still hold.
 */
export function onlineRulesOf(key: OnlineGameKey): OnlineRules<unknown, unknown> {
  return ONLINE_GAMES[key] as unknown as OnlineRules<unknown, unknown>;
}

/** The games in the order the rollout reached them. */
export const ONLINE_GAME_LIST = Object.keys(ONLINE_GAMES) as OnlineGameKey[];

/** Whether a key names a game that can be played on several devices. */
export function isOnlineGame(key: string): key is OnlineGameKey {
  return Object.hasOwn(ONLINE_GAMES, key);
}

/** Whether a game has a computer player a seat can be given to. */
export function hasComputer(key: OnlineGameKey): boolean {
  return onlineRulesOf(key).computers !== undefined;
}
