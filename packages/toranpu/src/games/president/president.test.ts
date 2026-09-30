import { describe, expect, it } from "vitest";

import { playPresident, presidentMayPlay, presidentMoves, presidentRank, presidentTitle, startPresident } from "./president.ts";
import { presidentComputer } from "./presidentComputer.ts";
import type { PresidentGame } from "./president.types.ts";

function started(players = 4, seed = 3): PresidentGame {
  return startPresident(3, new Array<string>(players).fill(""), undefined, seed)!;
}

function at(hands: string[][], extra: Partial<PresidentGame> = {}): PresidentGame {
  return { ...started(hands.length), hands, pile: null, passed: hands.map(() => false), toPlay: 0, out: [], ...extra };
}

/** Plays a round out with computers, to reach the next. */
function nextRound(game: PresidentGame): PresidentGame {
  let now = game;
  while (now.round === game.round && now.phase !== "over") now = playPresident(now, presidentComputer(now))!;
  return now;
}

describe("president", () => {
  it("ranks twos high and threes low, whatever the suit", () => {
    expect(presidentRank("2C")).toBeGreaterThan(presidentRank("AS"));
    expect(presidentRank("3S")).toBe(0);
  });

  it("deals every card round, and the three of clubs leads the first round", () => {
    const game = started(5);
    expect(game.hands.flat()).toHaveLength(52);
    expect(game.hands.map((hand) => hand.length).sort()).toEqual([10, 10, 10, 11, 11]);
    expect(game.hands[game.toPlay!]).toContain("3C");
    expect(game.phase).toBe("playing");
  });

  it("follows a pair only with a higher pair", () => {
    const game = at([["5C", "5D", "9S"], ["6C", "6D", "4S"], ["7H"], ["8H"]], { pile: { seat: 3, cards: ["4C", "4D"] } });
    expect(presidentMayPlay(game, ["5C", "5D"])).toBe(true);
    expect(presidentMayPlay(game, ["9S"])).toBe(false);
    expect(presidentMayPlay({ ...game, pile: { seat: 3, cards: ["5H", "5S"] } }, ["5C", "5D"])).toBe(false);
  });

  it("offers one move a rank and a count, and a pass when there is something to beat", () => {
    const game = at([["5C", "5D", "5H", "9S"], ["6C"], ["7H"], ["8H"]]);
    expect(presidentMoves(game)).toHaveLength(4);
    expect(presidentMoves({ ...game, pile: { seat: 3, cards: ["4C"] } })).toContainEqual({ pass: true });
  });

  it("names the first out President and the last the Beggar", () => {
    const end = at([["2C"], ["3C"], ["4C"], ["5C", "6C"]], { out: [] });
    let game = playPresident(end, { play: ["2C"] })!;
    expect(game.out).toEqual([0]);
    expect(game.toPlay).toBe(1);
    game = playPresident(game, { pass: true })!;
    game = playPresident(game, { pass: true })!;
    game = playPresident(game, { pass: true })!;
    // Nobody could beat the two: the next still in after the President leads.
    expect(game.toPlay).toBe(1);
    game = playPresident(game, { play: ["3C"] })!;
    game = playPresident(game, { play: ["4C"] })!;
    // Only seat 3 is left holding cards: the round is over.
    expect(game.rounds[0]).toEqual([0, 1, 2, 3]);
    expect(presidentTitle(game.rounds[0], 0)).toBe("president");
    expect(presidentTitle(game.rounds[0], 1)).toBe("vicePresident");
    expect(presidentTitle(game.rounds[0], 2)).toBe("viceBeggar");
    expect(presidentTitle(game.rounds[0], 3)).toBe("beggar");
    expect(game.scores).toEqual([3, 2, 1, 0]);
  });

  it("hands the Beggar's two best cards to the President, who chooses two to give back, and then the Beggar leads", () => {
    const second = nextRound(started(4, 8));
    expect(second.phase).toBe("exchange");
    const [president, vice] = second.titles!;
    const beggar = second.titles![3];
    const up = second.swaps[0];
    expect(up).toMatchObject({ from: beggar, to: president });
    expect(up.cards).toHaveLength(2);
    // The Beggar gave their best: nothing left in their hand outranks what went up.
    const lowestUp = Math.min(...up.cards.map(presidentRank));
    expect(second.hands[beggar].every((card) => presidentRank(card) <= lowestUp)).toBe(true);
    expect(second.toPlay).toBe(president);
    const back = second.hands[president].slice(0, 2);
    const after = playPresident(second, { give: back })!;
    expect(after.toPlay).toBe(vice);
    const done = playPresident(after, { give: after.hands[vice].slice(0, 1) })!;
    expect(done.phase).toBe("playing");
    expect(done.toPlay).toBe(beggar);
    for (const card of back) expect(done.hands[beggar]).toContain(card);
  });

  it("swaps one card, not two, with three at the table", () => {
    const second = nextRound(started(3, 4));
    expect(second.swaps[0].cards).toHaveLength(1);
    expect(second.owed).toHaveLength(1);
  });

  it("the computer gives back its lowest cards and keeps its twos while nobody is close to going out", () => {
    const giving = { ...at([["3C", "9D", "2S", "AH"], ["4C"], ["5C"], ["6C"]]), phase: "exchange" as const, owed: [{ from: 0, to: 3, count: 2 }] };
    expect(presidentComputer(giving)).toEqual({ give: ["3C", "9D"] });
    const holding = at([["2S", "4D", "5C", "6H", "8C", "9D"], ["3C", "3D", "3H"], ["4C", "4H", "4S"], ["5H", "5S", "6S"]], { pile: { seat: 3, cards: ["KS"] } });
    expect(presidentComputer(holding)).toEqual({ pass: true });
  });
});
