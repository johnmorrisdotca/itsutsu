// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { gunjinMoves, playGunjin, randomArrangement, seededRandom, startGunjin } from "./gunjin";
import type { GunjinGame, GunjinMove, GunjinSquare } from "./gunjin.types";

/**
 * A GAME OF GUNJIN SHOGI SET UP FOR ONE THING: Blue's flag stands in the corner
 * of the board, Red's aircraft (which may attack any piece directly) stands
 * somewhere on Red's side, and it is Red's move. The move that takes the flag is
 * returned with it. For the specs that ask what the site does when a flag is
 * taken, which is the engine's rule and nothing of the site's.
 */
export function flagWithinReach(): { game: GunjinGame; move: GunjinMove; from: GunjinSquare; flag: GunjinSquare } {
  let game = startGunjin(81, ["Ann", "Ben"])!;
  game = playGunjin(game, { kind: "setup", placements: randomArrangement(game, seededRandom(11)) })!;
  game = playGunjin(game, { kind: "hand" })!;
  // Blue's arrangement, with the flag put in the corner (A9 at the top left, not a headquarters) by swapping with whatever stands there.
  const blue = randomArrangement(game, seededRandom(12)).map((piece) => ({ ...piece }));
  const flag = blue.find((piece) => piece.kind === "flag")!;
  const corner = blue.find((piece) => piece.x === 0 && piece.y === 0);
  if (corner !== undefined && corner !== flag) [corner.x, corner.y, flag.x, flag.y] = [flag.x, flag.y, corner.x, corner.y];
  else if (corner === undefined) [flag.x, flag.y] = [0, 0];
  game = playGunjin(game, { kind: "setup", placements: blue })!;
  game = playGunjin(game, { kind: "hand" })!;
  const red = game.match.pieces.find((piece) => piece.owner === 0 && piece.kind === "aircraft")!;
  const from = { x: red.x, y: red.y };
  const flagAt = { x: 0, y: 0 };
  const move: GunjinMove = { kind: "move", from, to: flagAt };
  if (!gunjinMoves(game).some((one) => JSON.stringify(one) === JSON.stringify(move))) throw new Error("the aircraft cannot reach the flag");
  return { game, move, from, flag: flagAt };
}
