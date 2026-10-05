import { describe, expect, it } from "vitest";

import { GUNJIN_BOARDS, GUNJIN_SIZES } from "../gunjin/gunjin.constants";
import { gunjinMoves, matchSeenBy, seededRandom } from "../gunjin/gunjin";
import { decodeGunjinSeen, encodeGunjin } from "../gunjin/gunjinCodec";
import { gunjinSeatView } from "../gunjin/gunjinView";
import type { GunjinGame, GunjinMove } from "../gunjin/gunjin.types";
import { standingOf } from "./onlineSeats";
import { GUNJIN_ONLINE } from "./onlineGunjin";
import { viewOf } from "./server/tableRead";

/**
 * GUNJIN ON TWO DEVICES, as the server asks it: start, read a move as a
 * browser sent it, play it with no hand-over, and say what each seat is sent.
 * The last is the point: the stored game holds both sides' arrangements, and
 * a seat is only ever sent its own view of it.
 */
const rules = GUNJIN_ONLINE;

/** A move as a browser sends it and the server reads it: through JSON, then `readMove`. */
function sent(move: GunjinMove): GunjinMove | null {
  return rules.readMove(JSON.parse(JSON.stringify(move)));
}

/** Plays a whole table out as two browsers would, the server taking every move, until it is over or `most` moves. */
function playedOut(size: number, seed: number, most: number): GunjinGame {
  const random = seededRandom(seed);
  let game = rules.start(size, 2)!;
  for (let at = 0; at < most && rules.toPlay(game) !== null; at += 1) {
    const offered = gunjinMoves(game).filter((move) => move.kind !== "hand");
    const move = sent(offered[Math.floor(random() * offered.length)]!);
    expect(move).not.toBeNull();
    game = rules.play(game, move!)!;
    expect(game, "the server never rests on the cover").not.toBeNull();
    expect(game.match.phase, "the device is handed on at once").not.toBe("pass");
  }
  return game;
}

describe("Gunjin on several devices", () => {
  it("starts at every board for two and no other table, and keeps a game it can read back", () => {
    expect(rules.sizes).toEqual(GUNJIN_SIZES);
    expect(rules.counts).toEqual([2]);
    for (const size of GUNJIN_SIZES) {
      const game = rules.start(size, 2)!;
      expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
      expect(rules.toPlay(game)).toBe(0);
      expect(rules.moveCount(game)).toBe(0);
      expect(standingOf(rules, game)).toEqual({ status: "playing", toPlay: 0, winners: [], moveCount: 0 });
    }
    expect(rules.start(81, 3)).toBeNull();
    expect(rules.start(64, 2)).toBeNull();
  });

  it("reads an arrangement or a piece moved, and never the device handed on or anything else", () => {
    const game = rules.start(81, 2)!;
    const arrangement = gunjinMoves(game)[0]!;
    expect(sent(arrangement)).toEqual(arrangement);
    expect(rules.readMove({ kind: "hand" })).toBeNull();
    expect(rules.readMove({ kind: "move", from: { x: 0, y: 0 }, to: { x: 0, y: 99 } })).toBeNull();
    expect(rules.readMove({ kind: "move", from: { x: 0.5, y: 0 }, to: { x: 0, y: 1 } })).toBeNull();
    expect(rules.readMove({ kind: "setup", placements: "all" })).toBeNull();
    expect(rules.readMove({ kind: "setup", placements: Array.from({ length: 41 }, () => ({ kind: "mine", x: 0, y: 0 })) })).toBeNull();
    expect(rules.readMove({ kind: "setup", placements: [{ kind: "Mine; DROP", x: 0, y: 0 }] })).toBeNull();
    // An arrangement is read for its shape only: whether it is allowed is the rules'.
    const odd = rules.readMove({ kind: "setup", placements: [{ kind: "mine", x: 0, y: 0 }] })!;
    expect(rules.play(game, odd)).toBeNull();
    expect(JSON.stringify(arrangement).length).toBeLessThan(rules.moveLongest!);
  });

  it("hands the device on by itself, so the table rests on the next side's turn", () => {
    for (const size of GUNJIN_SIZES) {
      let game = rules.start(size, 2)!;
      game = rules.play(game, sent(gunjinMoves(game)[0]!)!)!;
      expect(game.match.phase).toBe("setup");
      expect(rules.toPlay(game)).toBe(1);
      game = rules.play(game, sent(gunjinMoves(game)[0]!)!)!;
      expect(game.match.phase).toBe("play");
      expect(rules.toPlay(game)).toBe(0);
    }
  });

  it("plays whole tables out and names the winner of each", () => {
    for (const size of GUNJIN_SIZES) {
      const game = playedOut(size, size, 8000);
      expect(rules.toPlay(game), `${GUNJIN_BOARDS[size]!.name} ends`).toBeNull();
      expect(rules.winners(game).length).toBe(1);
      expect(standingOf(rules, game).status).toBe("finished");
    }
  });

  it("sends each seat the game as that seat sees it, and the stored game to nobody", () => {
    for (const size of GUNJIN_SIZES) {
      const game = playedOut(size, 7, 90);
      const stored = encodeGunjin(game);
      for (const seat of [0, 1] as const) {
        const text = rules.seatState!(stored, seat);
        expect(text).not.toBe(stored);
        for (const piece of game.match.pieces.filter((one) => one.owner !== seat)) expect(text).not.toContain(piece.id);
        const read = rules.decode(text)!;
        expect(read, "a browser reads what it was sent with the same rules").not.toBeNull();
        expect(gunjinSeatView(read, seat)).toEqual(gunjinSeatView(game, seat));
        // And the other seat's text is a different one.
        expect(rules.seatState!(stored, seat === 0 ? 1 : 0)).not.toBe(text);
      }
    }
    // Something the rules cannot read is sent as nothing, never whole.
    expect(rules.seatState!("not a game", 0)).toBe("");
    expect(rules.decode("")).toBeNull();
    expect(rules.decode("{}")).toBeNull();
  });

  it("writes the seats' names into a game for a page, and never into what is kept", () => {
    const game = rules.start(81, 2)!;
    const named = rules.named(game, ["Aiko", "Ben"]);
    expect(named.players).toEqual(["Aiko", "Ben"]);
    expect(rules.encode(game)).not.toContain("Aiko");
    expect(decodeGunjinSeen(rules.seatState!(rules.encode(named), 0))?.players).toEqual(["Aiko", "Ben"]);
  });

  it("shows a finished table whole to both seats: nothing is hidden once the game is over", () => {
    const game = playedOut(56, 3, 8000);
    expect(rules.toPlay(game)).toBeNull();
    expect(matchSeenBy(game.match, 0)).toEqual(game.match);
    const seenBy1 = rules.decode(rules.seatState!(rules.encode(game), 1))!;
    expect(seenBy1.match.pieces.every((piece) => piece.kind !== "hidden")).toBe(true);
  });
});

describe("what the table sends a reader of Gunjin", () => {
  const AT = new Date("2026-10-05T12:00:00Z");
  const seat = (at: number, member: string) => ({ tableId: "abcd-efgh", seat: at, kind: "member", memberId: member, name: at === 0 ? "Aiko" : "Ben Hayashi", token: null, joinedAt: AT, colour: null });

  it("is the text made for the reader's own seat, never the stored game", () => {
    const game = playedOut(81, 11, 120);
    const state = rules.encode(game);
    const row = {
      id: "abcd-efgh",
      game: "gunjin",
      size: 81,
      state,
      version: 9,
      status: "playing",
      toPlay: rules.toPlay(game),
      winners: [] as number[],
      moveCount: rules.moveCount(game),
      movedAt: AT,
      hostMemberId: "m0",
      endedByMemberId: null as string | null,
      createdAt: AT,
      updatedAt: AT,
      finishedAt: null,
      lastMoverId: "m0",
      seats: [seat(0, "m0"), seat(1, "m1")],
    };
    for (const [member, mine] of [["m0", 0], ["m1", 1]] as const) {
      const view = viewOf(row, member, false, AT)!;
      expect(view.mySeat).toBe(mine);
      expect(view.state).toBe(rules.seatState!(state, mine));
      expect(view.state).not.toBe(state);
      for (const piece of game.match.pieces.filter((one) => one.owner !== mine)) expect(JSON.stringify(view)).not.toContain(piece.id);
    }
  });
});
