// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { GUNJIN_SAVE_VERSION } from "./gunjin.constants";
import { matchSeenBy, replayGunjin } from "./gunjin";
import { gunjinBoardOf } from "./gunjin.constants";
import type { GunjinGame, GunjinMatch, GunjinMove, GunjinPlacement } from "./gunjin.types";

/**
 * A GAME OF GUNJIN AS TEXT, and back: the board, the two names and the moves,
 * never the engine's match, which the moves make again (`replayGunjin`), so a
 * kept game is exactly the game its moves play out or none.
 *
 * Moves are separated by spaces. `H` is the device handed on. `M` and four
 * digits is a piece moved from a square to a square, each a column then a
 * row. `S` and then, for each kind of piece in the arrangement, its name, `@`
 * and its squares as two digits each, kinds separated by `;`
 * (`S mine@35,45;flag@41`). The text holds both sides' secret arrangements,
 * which is what a table round one device must keep to be a game at all:
 * docs/plans/party-games/README.md (Gunjin) says who can read it, and where it is never sent.
 */

/** An arrangement as text, kind by kind: the order `canonicalPlacements` keeps it in, so reading it back gives the same list. */
function placementsText(placements: readonly GunjinPlacement[]): string {
  const byKind = new Map<string, string[]>();
  for (const { kind, x, y } of placements) byKind.set(kind, [...(byKind.get(kind) ?? []), `${x}${y}`]);
  return [...byKind].map(([kind, squares]) => `${kind}@${squares.join(",")}`).join(";");
}

function moveText(move: GunjinMove): string {
  if (move.kind === "hand") return "H";
  if (move.kind === "move") return `M${move.from.x}${move.from.y}${move.to.x}${move.to.y}`;
  return `S${placementsText(move.placements)}`;
}

const SQUARE = /^\d\d$/;
const KIND = /^[a-z][a-z-]*$/;

function placementsOf(text: string): GunjinPlacement[] | null {
  const placements: GunjinPlacement[] = [];
  for (const group of text.split(";")) {
    const [kind, squares] = group.split("@");
    if (kind === undefined || squares === undefined || !KIND.test(kind)) return null;
    for (const square of squares.split(",")) {
      if (!SQUARE.test(square)) return null;
      placements.push({ kind, x: Number(square[0]), y: Number(square[1]) });
    }
  }
  return placements;
}

function moveOf(text: string): GunjinMove | null {
  if (text === "H") return { kind: "hand" };
  if (text.startsWith("M")) {
    const digits = /^M(\d)(\d)(\d)(\d)$/.exec(text);
    return digits === null ? null : { kind: "move", from: { x: Number(digits[1]), y: Number(digits[2]) }, to: { x: Number(digits[3]), y: Number(digits[4]) } };
  }
  if (text.startsWith("S")) {
    const placements = placementsOf(text.slice(1));
    return placements === null ? null : { kind: "setup", placements };
  }
  return null;
}

export function encodeGunjin(game: GunjinGame): string {
  return JSON.stringify({ v: GUNJIN_SAVE_VERSION, size: game.size, players: game.players, moves: game.moves.map(moveText).join(" ") });
}

const isString = (value: unknown): value is string => typeof value === "string";

/** A kept game read back, or null for nothing kept or anything these rules cannot play out again. */
export function decodeGunjin(text: string | null): GunjinGame | null {
  if (text === null) return null;
  let kept: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    kept = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const { v, size, players, moves } = kept;
  if (v !== GUNJIN_SAVE_VERSION || typeof size !== "number" || !Array.isArray(players) || !players.every(isString) || !isString(moves)) return null;
  const parsed = moves === "" ? [] : moves.split(" ").map(moveOf);
  if (parsed.some((move) => move === null)) return null;
  return replayGunjin(size, players, parsed as GunjinMove[]);
}

/**
 * A GAME AS ONE SEAT MAY SEE IT, as text: the board, the names and the match
 * with the other side's ranks and arrangement taken out (`matchSeenBy`). This
 * is what a table on two devices sends a seat in place of the stored text,
 * which holds both sides' secrets; it is not a game to be played from, only to
 * be drawn and its legal moves read, and `decodeGunjinSeen` gives it back as
 * a game with no moves of its own.
 */
export function encodeGunjinSeen(game: GunjinGame, seat: number): string {
  return JSON.stringify({ v: GUNJIN_SAVE_VERSION, seen: seat, size: game.size, players: game.players, match: matchSeenBy(game.match, seat) });
}

const PHASES: readonly string[] = ["setup", "pass", "play", "finished"];

/** Whether a value is a match of this board, in the shape the engine's own functions read. */
function isMatch(value: unknown, size: number): value is GunjinMatch {
  const board = gunjinBoardOf(size);
  if (board === null || typeof value !== "object" || value === null) return false;
  const match = value as Record<string, unknown>;
  const piece = (one: unknown) => {
    const it = one as Record<string, unknown> | null;
    return typeof it === "object" && it !== null && typeof it.id === "string" && typeof it.kind === "string" && (it.owner === 0 || it.owner === 1) && Number.isInteger(it.x) && Number.isInteger(it.y);
  };
  return (
    match.mode === board.mode &&
    match.width === board.width &&
    match.height === board.height &&
    typeof match.phase === "string" &&
    PHASES.includes(match.phase) &&
    (match.currentPlayer === 0 || match.currentPlayer === 1) &&
    Number.isInteger(match.turn) &&
    Number.isInteger(match.setupStep) &&
    Array.isArray(match.pieces) &&
    match.pieces.every(piece) &&
    Array.isArray(match.privateSetups) &&
    match.privateSetups.length === 2 &&
    match.privateSetups.every((side) => Array.isArray(side) && side.every(piece)) &&
    Array.isArray(match.log)
  );
}

/** A game as a seat was sent it, or null for anything that is not one. */
export function decodeGunjinSeen(text: string | null): GunjinGame | null {
  if (text === null) return null;
  try {
    const kept = JSON.parse(text) as Record<string, unknown>;
    const { v, seen, size, players, match } = kept;
    if (v !== GUNJIN_SAVE_VERSION || (seen !== 0 && seen !== 1) || typeof size !== "number" || !Array.isArray(players) || !players.every(isString) || !isMatch(match, size)) return null;
    return { size, players, moves: [], match };
  } catch {
    return null;
  }
}
