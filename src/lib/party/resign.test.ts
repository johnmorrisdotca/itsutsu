import { describe, expect, it } from "vitest";

import { PARTY_RULES } from "./partyRules";
import { PARTY_SPECS } from "./party.constants";
import { resignedBy, resignWinners, resigning, splitResignation, withResignation } from "./resign";
import { resignDiceWar, resignDots, resignGhost, resignHitotsu, resignMancala, resignPachisi, resignTenka, resignTrain, resignYacht } from "./resignTables";
import type { PartyKind } from "./party.types";

const start = (kind: PartyKind, seats: number) => {
  const rules = PARTY_RULES[kind] as unknown as { start: (...args: unknown[]) => unknown };
  const names = ["Ann", "Ben", "Cy", "Dee"].slice(0, seats);
  return rules.start(PARTY_SPECS[kind].defaultSize, names, "english", 7, names.map(() => false)) as { players: string[] };
};

describe("resigning at a table round one device", () => {
  it("names the other seat the winner at two and nobody at more", () => {
    expect(resignWinners(2, 0)).toEqual([1]);
    expect(resignWinners(2, 1)).toEqual([0]);
    expect(resignWinners(3, 1)).toEqual([]);
    expect(resignWinners(6, 5)).toEqual([]);
  });

  it("is written after a game's own text and read back from it", () => {
    const game = resigning({ players: ["Ann", "Ben"] }, 1, {});
    const text = withResignation('{"v":1}', game);
    expect(text).toBe('{"v":1}\n~resigned:1');
    expect(splitResignation(text)).toEqual({ text: '{"v":1}', seat: 1 });
    expect(splitResignation('{"v":1}')).toEqual({ text: '{"v":1}', seat: null });
    expect(splitResignation(null)).toEqual({ text: null, seat: null });
    expect(withResignation("plain", { players: [] })).toBe("plain");
    expect(resignedBy(game)).toBe(1);
    expect(resignedBy({})).toBeNull();
  });

  it("ends each engine's game in its own terms, with the other seat the winner at two", () => {
    const cases: [PartyKind, (game: never, seat: number) => { winners?: readonly number[] }][] = [
      ["dotsAndBoxes", resignDots as never],
      ["superghost", resignGhost as never],
      ["mancala", resignMancala as never],
      ["tenka", resignTenka as never],
      ["mexicanTrain", resignTrain as never],
      ["yacht", resignYacht as never],
      ["pachisi", resignPachisi as never],
    ];
    for (const [kind, resign] of cases) {
      const rules = PARTY_RULES[kind] as unknown as { over: (game: unknown) => boolean };
      const game = start(kind, 2) as never;
      expect(rules.over(game), `${kind} starts going`).toBe(false);
      const ended = resign(game, 0);
      expect(rules.over(ended), `${kind} is over once Ann resigns`).toBe(true);
      expect(ended.winners, `${kind}: Ben wins`).toEqual([1]);
    }
    // Hitotsu and Dice War score their own winners; theirs are ended and the table says who.
    for (const [kind, resign] of [["hitotsu", resignHitotsu], ["diceWar", resignDiceWar]] as const) {
      const rules = PARTY_RULES[kind] as unknown as { over: (game: unknown) => boolean };
      expect(rules.over((resign as (game: never, seat: number) => unknown)(start(kind, 2) as never, 0))).toBe(true);
    }
  });

  it("leaves nobody the winner at a bigger table", () => {
    expect(resignDots(start("dotsAndBoxes", 3) as never, 1).winners).toEqual([]);
    expect(resignTenka(start("tenka", 3) as never, 2).winners).toEqual([]);
  });
});
