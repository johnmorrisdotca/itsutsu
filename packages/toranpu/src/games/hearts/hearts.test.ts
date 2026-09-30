import { describe, expect, it } from "vitest";

import { choosePass, heartsComputer, heartsView } from "./heartsComputer.ts";
import { HEARTS_ALL_POINTS, QUEEN_OF_SPADES, TWO_OF_CLUBS, heartsMoves, heartsPlayable, passOffset, playHearts, startHearts, trickWinner } from "./hearts.ts";
import { HEARTS_RULES, decodeHearts, encodeHearts } from "./heartsRules.ts";
import type { HeartsGame } from "./hearts.types.ts";

const FOUR = ["Ann", "Ben", "Cy", "Di"];

function started(seed = 7, players = FOUR): HeartsGame {
  const game = startHearts(100, players, undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

/** Plays every seat's pass with the computer, to reach the first trick. */
function passed(game: HeartsGame): HeartsGame {
  let at = game;
  while (at.phase === "passing") at = playHearts(at, heartsComputer(at))!;
  return at;
}

/** A game in play with these hands, as a test sets one up: first trick done, hearts as given. */
function withHands(hands: string[][], extra: Partial<HeartsGame> = {}): HeartsGame {
  const game = passed(started());
  return { ...game, hands, trick: [], played: ["2C", "3C", "4C", "5C"], toPlay: 0, ...extra };
}

describe("hearts", () => {
  it("deals thirteen each to four and seventeen each to three, without the two of diamonds", () => {
    expect(started().hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    const three = started(7, ["A", "B", "C"]);
    expect(three.hands.map((hand) => hand.length)).toEqual([17, 17, 17]);
    expect(three.hands.flat()).not.toContain("2D");
  });

  it("refuses a table it does not offer", () => {
    expect(startHearts(100, ["A", "B"])).toBeNull();
    expect(startHearts(60, FOUR)).toBeNull();
  });

  it("deals the same cards from the same seed, and other cards from another", () => {
    expect(started(5).hands).toEqual(started(5).hands);
    expect(started(5).hands).not.toEqual(started(6).hands);
  });

  it("passes left, right, across, then holds, with four at the table", () => {
    expect([0, 1, 2, 3, 4].map((deal) => passOffset(deal, 4))).toEqual([1, 3, 2, 0, 1]);
    expect([0, 1, 2].map((deal) => passOffset(deal, 3))).toEqual([1, 2, 0]);
  });

  it("hands three cards to the left once everybody has chosen, and the two of clubs leads", () => {
    const game = started();
    const chosen = game.hands.map((hand) => hand.slice(0, 3));
    let at = game;
    for (let seat = 0; seat < 4; seat += 1) {
      expect(at.toPlay).toBe(seat);
      at = playHearts(at, { pass: chosen[seat] })!;
    }
    expect(at.phase).toBe("playing");
    expect(at.received[1]).toEqual(chosen[0]);
    for (const card of chosen[0]) expect(at.hands[1]).toContain(card);
    expect(at.hands[at.toPlay!]).toContain(TWO_OF_CLUBS);
    expect(heartsPlayable(at)).toEqual([TWO_OF_CLUBS]);
  });

  it("refuses a pass of the wrong size or of a card not held", () => {
    const game = started();
    expect(playHearts(game, { pass: game.hands[0].slice(0, 2) })).toBeNull();
    expect(playHearts(game, { pass: [...game.hands[0].slice(0, 2), game.hands[1][0]] })).toBeNull();
  });

  it("makes a player follow suit, and keeps hearts from being led until one is thrown", () => {
    const game = withHands([["3H", "4D", "KS"], ["5D", "6H", "2S"], ["7D", "8H", "3S"], ["9D", "TH", "4S"]]);
    expect(heartsPlayable(game)).toEqual(["4D", "KS"]);
    const led = playHearts(game, { play: "4D" })!;
    expect(heartsPlayable(led)).toEqual(["5D"]);
    expect(playHearts(led, { play: "6H" })).toBeNull();
    expect(heartsPlayable({ ...game, heartsBroken: true })).toEqual(["3H", "4D", "KS"]);
  });

  it("lets nobody throw a point on the first trick unless they hold nothing else", () => {
    const game = passed(started());
    const leader = game.toPlay!;
    const next = playHearts(game, { play: TWO_OF_CLUBS })!;
    const seat = next.toPlay!;
    const noClubs = { ...next, hands: next.hands.map((hand, at) => (at === seat ? ["QS", "5H", "9D"] : hand)) };
    expect(heartsPlayable(noClubs)).toEqual(["9D"]);
    const onlyPoints = { ...next, hands: next.hands.map((hand, at) => (at === seat ? ["QS", "5H"] : hand)) };
    expect(heartsPlayable(onlyPoints)).toEqual(["QS", "5H"]);
    expect(leader).not.toBe(seat);
  });

  it("gives the trick to the highest card of the suit led, ace high", () => {
    expect(trickWinner([{ seat: 2, card: "5D" }, { seat: 3, card: "AD" }, { seat: 0, card: "KS" }, { seat: 1, card: "QD" }])).toBe(3);
  });

  it("scores a heart one and the queen thirteen, and shooting the moon gives everybody else twenty-six", () => {
    const last = withHands([["AH"], ["2H"], ["3H"], ["QS"]], { heartsBroken: true, played: ["x"] });
    const end = ["AH", "2H", "3H", "QS"].reduce<HeartsGame>((at, card) => playHearts(at, { play: card })!, last);
    expect(end.dealScores[0]).toEqual([16, 0, 0, 0]);
    const moon = withHands([["AH"], ["2H"], ["3H"], ["4H"]], { heartsBroken: true, points: [HEARTS_ALL_POINTS - 4, 0, 0, 0], played: ["x"] });
    const shot = ["AH", "2H", "3H", "4H"].reduce<HeartsGame>((at, card) => playHearts(at, { play: card })!, moon);
    expect(shot.dealScores[0]).toEqual([0, 26, 26, 26]);
    expect(shot.moon).toBe(0);
  });

  it("ends when somebody reaches the game's size, and the lowest score wins", () => {
    const near = withHands([["AH"], ["2H"], ["3H"], ["4H"]], { heartsBroken: true, scores: [96, 50, 40, 60], played: ["x"] });
    const end = ["AH", "2H", "3H", "4H"].reduce<HeartsGame>((at, card) => playHearts(at, { play: card })!, near);
    expect(end.phase).toBe("over");
    expect(HEARTS_RULES.over(end)).toBe(true);
    expect(HEARTS_RULES.winners(end)).toEqual([2]);
    expect(heartsMoves(end)).toEqual([]);
  });

  it("is kept as its seed and moves and read back exactly", () => {
    let game = started(11);
    for (let step = 0; step < 30; step += 1) game = playHearts(game, heartsComputer(game))!;
    expect(decodeHearts(encodeHearts(game))).toEqual(game);
    expect(decodeHearts(encodeHearts(game).replace('"g":"hearts"', '"g":"goFish"'))).toBeNull();
  });

  it("the computer passes the queen of spades when it cannot guard her, and keeps her behind five spades", () => {
    expect(choosePass(["QS", "AS", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "TC", "JC", "2D"])).toContain("QS");
    expect(choosePass(["QS", "2S", "3S", "4S", "5S", "6C", "7C", "8C", "9C", "TC", "JC", "QC", "2D"])).not.toContain("QS");
  });

  it("the computer dumps the queen on a trick the king of spades is winning", () => {
    const game = withHands([["KS", "2D"], ["QS", "3S", "4D"], ["5S"], ["6S"]], { toPlay: 1, trick: [{ seat: 0, card: "KS" }] });
    expect(heartsComputer(game)).toEqual({ play: QUEEN_OF_SPADES });
  });

  it("the computer ducks under the trick when it can", () => {
    const game = withHands([["TD"], ["3D", "9D", "KD"], ["5S"], ["6S"]], { toPlay: 1, trick: [{ seat: 0, card: "TD" }] });
    expect(heartsComputer(game)).toEqual({ play: "9D" });
  });

  it("the computer sees only its own hand", () => {
    const game = passed(started(3));
    const shuffledOthers = { ...game, hands: game.hands.map((hand, seat) => (seat === game.toPlay ? hand : [...hand].reverse())) };
    expect(heartsView(shuffledOthers)).toEqual(heartsView(game));
  });
});
