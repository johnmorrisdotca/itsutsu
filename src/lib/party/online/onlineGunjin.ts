import { GUNJIN_SIZES, GUNJIN_SEATS } from "../gunjin/gunjin.constants";
import { gunjinOver, gunjinToPlay, gunjinWinners, playGunjin, startGunjin } from "../gunjin/gunjin";
import { decodeGunjin, decodeGunjinSeen, encodeGunjin, encodeGunjinSeen } from "../gunjin/gunjinCodec";
import type { GunjinGame, GunjinMove, GunjinPlacement, GunjinSquare } from "../gunjin/gunjin.types";

import type { OnlineRules } from "./online.types";

/**
 * GUNJIN AT A TABLE ON TWO DEVICES (docs/plans/party-games/README.md, Gunjin):
 * the same rules the table on one device plays (`playGunjin`), the same text it
 * keeps a game as (`encodeGunjin`: the board, the names, the arrangements and
 * the moves), and one thing no other game here has — a seat is never sent that
 * text. It holds both sides' secret arrangements, so the server keeps it and
 * sends each seat the game as that seat may see it (`seatState`,
 * `encodeGunjinSeen`): the seat's own ranks and the other side as pieces with
 * no rank, no id and no arrangement. A seat that reads everything it is sent
 * therefore still learns nothing of the other side but where its pieces stand
 * and what the public record says, which is the whole of what the game shows.
 *
 * NO HAND-OVER HERE. The package's device pass exists for one phone between two
 * people; with a phone each it is a move nobody needs to make, so the table
 * takes it itself the moment it comes up (`handedOn`), and a move a browser
 * sends is only ever an arrangement or a piece moved. Each side arranges when
 * it is its turn to, the other waiting on it, as the seats are told.
 *
 * ENDING IT is the table's own End, as every table on several devices has; there
 * is no Resign at a table on two devices (the engine's resignation is a move a
 * person at one phone makes for whoever holds it).
 */

/** After a move the engine asks for the device to be passed on; nobody passes a phone here, so it is passed at once. */
function handedOn(game: GunjinGame | null): GunjinGame | null {
  return game !== null && game.match.phase === "pass" ? playGunjin(game, { kind: "hand" }) : game;
}

function isSquare(value: unknown): value is GunjinSquare {
  const square = value as { x?: unknown; y?: unknown } | null;
  return typeof square === "object" && square !== null && Number.isInteger(square.x) && Number.isInteger(square.y) && (square.x as number) >= 0 && (square.x as number) <= 9 && (square.y as number) >= 0 && (square.y as number) <= 9;
}

/** A move as a browser sent it: an arrangement, or a piece moved. Never the device handed on, and never more than a board's pieces. */
function readMove(sent: unknown): GunjinMove | null {
  if (typeof sent !== "object" || sent === null) return null;
  const move = sent as { kind?: unknown; placements?: unknown; from?: unknown; to?: unknown };
  if (move.kind === "move") return isSquare(move.from) && isSquare(move.to) ? { kind: "move", from: { x: move.from.x, y: move.from.y }, to: { x: move.to.x, y: move.to.y } } : null;
  if (move.kind !== "setup" || !Array.isArray(move.placements) || move.placements.length > 40) return null;
  const placements: GunjinPlacement[] = [];
  for (const one of move.placements as unknown[]) {
    const placement = one as { kind?: unknown; x?: unknown; y?: unknown } | null;
    if (typeof placement !== "object" || placement === null || typeof placement.kind !== "string" || !/^[a-z][a-z-]{0,24}$/.test(placement.kind) || !isSquare({ x: placement.x, y: placement.y })) return null;
    placements.push({ kind: placement.kind, x: placement.x as number, y: placement.y as number });
  }
  return { kind: "setup", placements };
}

export const GUNJIN_ONLINE: OnlineRules<GunjinGame, GunjinMove> = {
  sizes: GUNJIN_SIZES,
  counts: [GUNJIN_SEATS],
  // A table of blank names: the names are the seats', written in for a page by `named`.
  start: (size, count) => (count !== GUNJIN_SEATS ? null : startGunjin(size, ["", ""])),
  encode: encodeGunjin,
  // The stored text on the server; on a browser, the text the seat was sent (the server never decodes that one).
  decode: (text) => decodeGunjin(text) ?? decodeGunjinSeen(text),
  toPlay: gunjinToPlay,
  winners: gunjinWinners,
  moveCount: (game) => game.moves.length,
  // An arrangement is about forty squares, 28 characters apiece.
  moveLongest: 1600,
  readMove,
  play: (game, move) => (gunjinOver(game) ? null : handedOn(playGunjin(game, move))),
  named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
  seatState: (state, seat) => {
    const game = decodeGunjin(state);
    return game === null ? "" : encodeGunjinSeen(game, seat);
  },
};
