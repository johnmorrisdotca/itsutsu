import { describe, expect, it } from "vitest";

import { oneOfEachKind } from "./openGames";
import type { GameSummary } from "./gameHistory.types";

/**
 * What the "start a game" sentence may offer.
 *
 * The sentence matches a waiting seat on exactly three things — the game, the
 * pace and the board — so a second seat asking for the same three is one it
 * can never offer. Keeping one of each is what makes the list it reads short
 * enough to be complete.
 *
 * Every case here is about order or about what has already been taken out,
 * because both of those have gone wrong once each and neither is visible in
 * the shape of the answer.
 */

const seat = (over: Partial<GameSummary>): GameSummary =>
  ({ id: "x", variant: "freestyle", size: 9, moveTimeMs: null, blackName: "", whiteName: "", ...over }) as GameSummary;

describe("one seat of each kind", () => {
  it("keeps the first of a kind and drops the rest", () => {
    const seats = [
      seat({ id: "newest", blackName: "Newest" }),
      seat({ id: "older", blackName: "Older" }),
    ];
    expect(oneOfEachKind(seats).map((one) => one.id)).toEqual(["newest"]);
  });

  it("tells the three things apart that the sentence tells apart", () => {
    const seats = [
      seat({ id: "a" }),
      seat({ id: "b", size: 15 }),
      seat({ id: "c", moveTimeMs: 86_400_000 }),
      seat({ id: "d", variant: "renju" }),
    ];
    expect(oneOfEachKind(seats)).toHaveLength(4);
  });

  it("keeps the order it was given, which is the order the sentence reads", () => {
    /*
     * The board the sentence suggests follows whichever seat somebody is
     * already waiting on, so this list arriving newest-first is not a
     * presentation detail. Sorting it by board size instead — which a
     * database `distinct` wants — quietly made the suggested board the
     * smallest one waiting, and three specs about choosing a board failed for
     * a reason that had nothing to do with boards.
     */
    const seats = [seat({ id: "big", size: 19 }), seat({ id: "small", size: 9 })];
    expect(oneOfEachKind(seats).map((one) => one.id)).toEqual(["big", "small"]);
  });

  it("offers a stranger's seat when mine was the newer of the two", () => {
    /*
     * The case that makes this a function taking an already-narrowed list
     * rather than one that narrows. If the seats nobody can sit in are
     * dropped afterwards, a kind whose newest seat is my own loses the whole
     * kind, and a stranger's identical seat standing right behind it is never
     * offered.
     */
    const mine = seat({ id: "mine", blackMemberId: "me" } as Partial<GameSummary>);
    const theirs = seat({ id: "theirs", blackMemberId: "them" } as Partial<GameSummary>);
    const usable = [mine, theirs].filter((one) => (one as { blackMemberId?: string }).blackMemberId !== "me");
    expect(oneOfEachKind(usable).map((one) => one.id)).toEqual(["theirs"]);
  });

  it("has nothing to say about an empty board", () => {
    expect(oneOfEachKind([])).toEqual([]);
  });
});
