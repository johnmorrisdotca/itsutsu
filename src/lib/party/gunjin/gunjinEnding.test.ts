import { describe, expect, it } from "vitest";

import { GUNJIN_SIZES } from "./gunjin.constants";
import { gunjinDrawn, gunjinDrawOfferedBy, gunjinDrawOfferedTo, gunjinMoves, gunjinOver, gunjinToPlay, gunjinWinners, playGunjin, replayGunjin, startGunjin } from "./gunjin";
import { decodeGunjin, decodeGunjinSeen, encodeGunjin, encodeGunjinSeen } from "./gunjinCodec";
import { gunjinReason } from "./gunjinNews";
import type { GunjinGame, GunjinMove } from "./gunjin.types";
import { GUNJIN_ONLINE } from "../online/onlineGunjin";

/** A game of this board with both sides arranged and the device handed to red: ready for the first move. */
function begun(size: number): GunjinGame {
  let game = startGunjin(size, ["Ann", "Ben"])!;
  for (let step = 0; step < 4; step += 1) game = playGunjin(game, gunjinMoves(game)[0]!)!;
  return game;
}

const play = (game: GunjinGame, move: GunjinMove): GunjinGame => {
  const next = playGunjin(game, move);
  if (next === null) throw new Error(`refused ${move.kind}`);
  return next;
};

describe("Gunjin ends by a resignation or an agreed draw, on every board", () => {
  it("lets the side to move resign, and gives the game to the other", () => {
    for (const size of GUNJIN_SIZES) {
      const game = begun(size);
      expect(game.match.phase).toBe("play");
      const red = gunjinToPlay(game)!;
      const over = play(game, { kind: "resign" });
      expect(gunjinOver(over), `${size}`).toBe(true);
      expect(gunjinWinners(over)).toEqual([1 - red]);
      expect(gunjinDrawn(over)).toBe(false);
      expect(gunjinReason(over)).toBe("resigned");
      expect(gunjinToPlay(over)).toBeNull();
      // Nothing is played after it.
      expect(playGunjin(over, { kind: "resign" })).toBeNull();
    }
  });

  it("offers a draw, passes it on, and ends level when the other side accepts", () => {
    for (const size of GUNJIN_SIZES) {
      const game = begun(size);
      const offerer = gunjinToPlay(game)!;
      const offered = play(game, { kind: "offer-draw" });
      // On its way: the device is on the cover for the other side, who has not been asked yet.
      expect(offered.match.phase).toBe("pass");
      expect(gunjinDrawOfferedBy(offered)).toBe(offerer);
      expect(gunjinDrawOfferedTo(offered)).toBeNull();
      const asked = play(offered, { kind: "hand" });
      expect(gunjinToPlay(asked)).toBe(1 - offerer);
      expect(gunjinDrawOfferedTo(asked)).toBe(1 - offerer);
      const ended = play(asked, { kind: "accept-draw" });
      expect(gunjinOver(ended)).toBe(true);
      expect(gunjinDrawn(ended)).toBe(true);
      expect(gunjinWinners(ended)).toEqual([]);
      expect(gunjinReason(ended)).toBe("a draw was agreed");
    }
  });

  it("goes on when the draw is declined, with the turn the other side's still, and takes a move as a refusal", () => {
    const game = begun(81);
    const asked = play(play(game, { kind: "offer-draw" }), { kind: "hand" });
    const answerer = gunjinToPlay(asked)!;
    const declined = play(asked, { kind: "decline-draw" });
    expect(gunjinOver(declined)).toBe(false);
    expect(gunjinToPlay(declined)).toBe(answerer);
    expect(gunjinDrawOfferedBy(declined)).toBeNull();
    // A move instead of an answer declines it as well.
    const moved = play(asked, gunjinMoves(asked).find((move) => move.kind === "move")!);
    expect(gunjinDrawOfferedBy(moved)).toBeNull();
    expect(gunjinOver(moved)).toBe(false);
  });

  it("refuses what the engine refuses: an answer with nothing to answer, an offer over an offer, and any ending outside play", () => {
    const game = begun(72);
    expect(playGunjin(game, { kind: "accept-draw" })).toBeNull();
    expect(playGunjin(game, { kind: "decline-draw" })).toBeNull();
    const asked = play(play(game, { kind: "offer-draw" }), { kind: "hand" });
    // The side asked may not offer one back before it has answered; the one that offered is not to move.
    expect(playGunjin(asked, { kind: "offer-draw" })).toBeNull();
    // Arranging, and the device on its way, are no time to resign or to offer.
    const arranging = startGunjin(72, ["Ann", "Ben"])!;
    for (const kind of ["resign", "offer-draw", "accept-draw", "decline-draw"] as const) expect(playGunjin(arranging, { kind }), kind).toBeNull();
    const passing = play(game, gunjinMoves(game).find((move) => move.kind === "move")!);
    expect(passing.match.phase).toBe("pass");
    for (const kind of ["resign", "offer-draw"] as const) expect(playGunjin(passing, { kind }), kind).toBeNull();
  });

  it("keeps a game that ended either way, as its moves, and reads it back to the same end", () => {
    const resigned = play(begun(100), { kind: "resign" });
    const agreed = play(play(play(begun(56), { kind: "offer-draw" }), { kind: "hand" }), { kind: "accept-draw" });
    for (const game of [resigned, agreed]) {
      const text = encodeGunjin(game);
      const back = decodeGunjin(text)!;
      expect(back.moves).toEqual(game.moves);
      expect(back.match.result).toEqual(game.match.result);
      expect(replayGunjin(game.size, game.players, game.moves)!.match.result).toEqual(game.match.result);
    }
    expect(JSON.parse(encodeGunjin(resigned)).moves.endsWith(" R")).toBe(true);
    expect(JSON.parse(encodeGunjin(agreed)).moves.endsWith(" D H A")).toBe(true);
    // A word it does not know is a game it cannot read, not a game with a move missing.
    expect(decodeGunjin(encodeGunjin(resigned).replace(/ R"/, ' X"'))).toBeNull();
  });

  it("shows the other side an offer waiting in the game it is sent, and nothing else of the first side", () => {
    const asked = play(play(begun(81), { kind: "offer-draw" }), { kind: "hand" });
    for (const seat of [0, 1] as const) {
      const seen = decodeGunjinSeen(encodeGunjinSeen(asked, seat))!;
      expect(seen.match.drawOffer).toBe(asked.match.drawOffer);
      expect(gunjinDrawOfferedTo(seen)).toBe(1 - asked.match.drawOffer!);
    }
  });
});

describe("Gunjin at a table on two devices ends the same ways", () => {
  const table = (size: number) => {
    let game = GUNJIN_ONLINE.start(size, 2)!;
    for (let step = 0; step < 2; step += 1) game = GUNJIN_ONLINE.play(game, gunjinMoves(game)[0]!)!;
    return game;
  };

  it("reads the four presses as moves and nothing more than their kind", () => {
    for (const kind of ["resign", "offer-draw", "accept-draw", "decline-draw"]) expect(GUNJIN_ONLINE.readMove({ kind, from: { x: 1, y: 1 }, junk: "x" })).toEqual({ kind });
    expect(GUNJIN_ONLINE.readMove({ kind: "hand" })).toBeNull();
    expect(GUNJIN_ONLINE.readMove({ kind: "surrender" })).toBeNull();
  });

  it("takes the hand-over itself, so the other seat is asked at once, and a decline gives the turn back to it", () => {
    for (const size of GUNJIN_SIZES) {
      const game = table(size);
      expect(game.match.phase).toBe("play");
      const offerer = GUNJIN_ONLINE.toPlay(game)!;
      const asked = GUNJIN_ONLINE.play(game, { kind: "offer-draw" })!;
      expect(asked.match.phase).toBe("play");
      expect(GUNJIN_ONLINE.toPlay(asked)).toBe(1 - offerer);
      expect(gunjinDrawOfferedTo(asked)).toBe(1 - offerer);
      // The offerer, no longer to move, is told what it waits for; it cannot offer again or resign out of turn.
      expect(gunjinDrawOfferedBy(asked)).toBe(offerer);
      const declined = GUNJIN_ONLINE.play(asked, { kind: "decline-draw" })!;
      expect(GUNJIN_ONLINE.toPlay(declined)).toBe(1 - offerer);
      const ended = GUNJIN_ONLINE.play(asked, { kind: "accept-draw" })!;
      expect(GUNJIN_ONLINE.toPlay(ended)).toBeNull();
      expect(GUNJIN_ONLINE.winners(ended)).toEqual([]);
      expect(gunjinDrawn(ended)).toBe(true);
      const resigned = GUNJIN_ONLINE.play(game, { kind: "resign" })!;
      expect(GUNJIN_ONLINE.winners(resigned)).toEqual([1 - offerer]);
      // What the table keeps reads back to the same end.
      expect(GUNJIN_ONLINE.decode(GUNJIN_ONLINE.encode(ended))!.match.result).toEqual(ended.match.result);
    }
  });
});
