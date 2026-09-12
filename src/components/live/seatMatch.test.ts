import { describe, expect, it } from "vitest";

import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import type { RulesDraft } from "./rulesDraft";
import { matchSeat } from "./seatMatch";
import { boardAsked, readSetUpAsked } from "./setUpAsked";

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

/**
 * A BOARD IN AN ADDRESS IS A CHOSEN BOARD, and this is the join that was broken.
 *
 * Every branch above was already right. What was wrong was upstream of it: the
 * screen seeded `boardChosen` with null whatever the address said, so `?board=19`
 * arrived as a size in the draft and nothing else — and the branch that moves a
 * DEFAULT board onto a waiting seat could not tell it from one nobody had
 * touched. A single 9×9 seat on the noticeboard then decided the board for
 * somebody who had followed a 19×19 link.
 *
 * It is tested by composing the two pure halves, because that is the whole of
 * the rule: what the address settled (`boardAsked`) and what the screen shows
 * (`matchSeat`). And it only ever went wrong with EXACTLY ONE matching seat,
 * which is why it was green on a busy database and red on a fresh one — so both
 * counts are here.
 */
describe("a board the address settled is not the noticeboard's to move", () => {
  const showing = (query: Record<string, string>, seats: readonly SeatOnBoard[]) =>
    matchSeat({
      rules,
      seats,
      posting: true,
      boardChosen: boardAsked(readSetUpAsked(query), rules.variant as RuleVariant),
      matchable: true,
    });

  it("keeps the asked board when one seat is waiting at another", () => {
    const { settled, waiting } = showing({ board: "19" }, [seat({ size: 9 })]);
    expect(settled.size, "the link said 19×19 and the screen says 19×19").toBe(19);
    expect(waiting, "and does not sit down at a 9×9 board nobody asked for").toBeUndefined();
  });

  it("keeps it when two seats are waiting, which is the case that always passed", () => {
    const { settled } = showing({ board: "19" }, [
      seat({ id: "a", size: 9 }),
      seat({ id: "b", size: 9 }),
    ]);
    expect(settled.size).toBe(19);
  });

  /*
   * AND STILL FOLLOWS WHERE NOBODY HAS SAID ANYTHING — a challenge, a player's
   * Play button, a family card. Those name a game and no board, and the rule
   * this module exists for is theirs.
   */
  it("still follows a lone seat when the address named no board", () => {
    const { settled, waiting } = showing({ against: "mem_1" }, [seat({ size: 9 })]);
    expect(settled.size).toBe(9);
    expect(waiting?.who).toBe("Kyoko");
  });

  /*
   * A board the address named that this game does not have is silence, not a
   * choice — so the following is still allowed to answer.
   */
  it("follows a lone seat when the address named a board this game has not", () => {
    const { settled } = showing({ board: "12" }, [seat({ size: 9 })]);
    expect(settled.size).toBe(9);
  });
});
