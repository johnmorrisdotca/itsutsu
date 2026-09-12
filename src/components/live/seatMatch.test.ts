import { describe, expect, it } from "vitest";

import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import type { RulesDraft } from "./rulesDraft";
import { matchSeat } from "./seatMatch";

const WEEK = 7 * 24 * 60 * 60_000;

const rules: RulesDraft = {
  variant: "freestyle",
  size: 15,
  obstacles: "none",
  opening: "free",
  moveTimeMs: WEEK,
  timeoutPenalty: "turn",
  clockMode: "move",
  rated: true,
  allowResign: true,
  open: true,
  handicap: NO_HANDICAP,
};

const seat = (over: Partial<SeatOnBoard> = {}): SeatOnBoard => ({
  id: "seat-1",
  variant: "freestyle",
  size: 9,
  moveTimeMs: WEEK,
  who: "Kyoko",
  ...over,
});

/** The ordinary ask — a game for anybody, nothing chosen — with one thing changed. */
const ask = (over: Partial<Parameters<typeof matchSeat>[0]> = {}) =>
  matchSeat({ rules, seats: [], posting: true, boardChosen: null, matchable: true, ...over });

describe("sitting down at a seat somebody is already asking from", () => {
  it("posts a seat of its own when nobody is asking", () => {
    const { waiting, settled } = ask();
    expect(waiting).toBeUndefined();
    expect(settled.size, "and stays on the board the screen opened at").toBe(15);
  });

  /*
   * THE REGRESSION THIS RULE EXISTS FOR. Every seat on the noticeboard was
   * posted at some size, so a screen that always opened at the member's own
   * favourite would post a SECOND seat beside the one already waiting, and
   * neither would ever be filled.
   */
  it("follows the board of the one seat waiting at this game and pace", () => {
    const { settled, waiting } = ask({ seats: [seat()] });
    expect(settled.size, "the board follows the seat that is waiting").toBe(9);
    expect(waiting?.who).toBe("Kyoko");
  });

  it("follows nothing when two seats disagree about the board", () => {
    const { settled, waiting } = ask({
      seats: [seat({ id: "a", size: 9 }), seat({ id: "b", size: 19 })],
    });
    expect(settled.size, "two answers is no answer; the screen keeps its own").toBe(15);
    expect(waiting, "and matches neither of them").toBeUndefined();
  });

  /*
   * A CHOSEN BOARD IS NOT A DEFAULT, so it stops the following. Somebody who
   * asked for 19×19 has said something, and a seat waiting at 9×9 is not it.
   */
  it("stops following once somebody chooses a board", () => {
    const { settled, waiting } = ask({ seats: [seat()], boardChosen: 19 });
    expect(settled.size).toBe(19);
    expect(waiting, "and does not sit down at a board nobody asked for").toBeUndefined();
  });

  /* A chosen board the current game cannot use is remembered, not applied. */
  it("ignores a chosen board this game is not played on", () => {
    const { settled } = ask({ rules: { ...rules, variant: "reversi", size: 8 }, boardChosen: 19 });
    expect(settled.size, "Reversi is 8×8 and nothing else").toBe(8);
  });

  it("matches on the pace as well as the game and the board", () => {
    const { waiting } = ask({
      rules: { ...rules, size: 9 },
      seats: [seat({ moveTimeMs: 300_000 })],
    });
    expect(waiting, "a seat at another pace is not this game").toBeUndefined();
  });

  it("matches on the game, so another game's seats are not offered", () => {
    const { waiting } = ask({ rules: { ...rules, size: 9 }, seats: [seat({ variant: "renju" })] });
    expect(waiting).toBeUndefined();
  });

  /*
   * NOBODY IS MATCHED WHEN SOMEBODY IN PARTICULAR IS BEING ASKED. The wish this
   * rule serves is "a game, with anybody"; naming a person is a different wish.
   */
  it("never sits down at a stranger's seat when a person has been named", () => {
    const { waiting, settled } = ask({ seats: [seat()], posting: false });
    expect(waiting).toBeUndefined();
    expect(settled.size, "and the board does not follow one either").toBe(15);
  });

  /*
   * AND NEVER FOR A REMATCH OR A FORK, which is the case that makes this a
   * parameter rather than a reading of `posting`. A fork of a 9×9 position
   * following somebody's 19×19 seat would not be a preference — the copied moves
   * would not fit the board.
   */
  it("never matches a game that came out of another game", () => {
    const { waiting, settled } = ask({ seats: [seat()], matchable: false });
    expect(waiting).toBeUndefined();
    expect(settled.size).toBe(15);
  });

  it("leaves the draft it was given untouched", () => {
    const given = { ...rules };
    ask({ seats: [seat()] });
    expect(given).toEqual(rules);
  });
});
