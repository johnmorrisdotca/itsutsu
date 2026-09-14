import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST, SEED_RANGE, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import { BOT_TIERS, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import {
  MIX_ALL_PLAYERS,
  drawableSizes,
  homeGround,
  isUndefeated,
  mixSeedFrom,
  planMix,
  playableVariants,
} from "./botMix";
import type { MixFacts, MixOptions, MixRecord } from "./botMix.types";

const EMPTY: MixFacts = { finishedByVariant: {}, records: [] };

function options(overrides: Partial<MixOptions> = {}): MixOptions {
  return {
    seed: 1,
    players: MIX_ALL_PLAYERS,
    unplayedGames: { fewest: 1, most: 2 },
    undefeatedGames: 3,
    leftOut: [],
    sizeCaps: [],
    ...overrides,
  };
}

/** The live site as read on 2026-09-14: eleven games with finished games, the rest with none. */
const LIVE: MixFacts = {
  finishedByVariant: {
    reversi: 61,
    freestyle: 40,
    tictactoe: 5,
    halma: 3,
    standard: 2,
    hex: 1,
    checkers: 1,
    dominoFive: 1,
    dropFour: 1,
    wildTicTacToe: 1,
    notakto: 1,
  },
  records: [
    { tier: "tamenoki", ratedGames: 59, wins: 59, losses: 0, draws: 0, variants: ["reversi"] },
    { tier: "meritalu", ratedGames: 36, wins: 33, losses: 3, draws: 0, variants: ["freestyle"] },
    { tier: "dan", ratedGames: 12, wins: 5, losses: 7, draws: 0, variants: ["freestyle", "reversi"] },
  ],
};

const SEEDS = Array.from({ length: 25 }, (_, n) => n * 7919 + 3);

describe("the mixed plan: games nobody has played", () => {
  it("plans only games with no finished games", () => {
    for (const seed of SEEDS) {
      const plan = planMix(LIVE, options({ seed }));
      for (const match of plan.matches.filter((one) => one.why.kind === "unplayed")) {
        expect(LIVE.finishedByVariant[match.variant] ?? 0).toBe(0);
      }
    }
  });

  it("gives every unplayed game one or two games, and over many seeds both counts occur", () => {
    const seen = new Set<number>();
    const unplayed = RULE_VARIANT_LIST.filter((variant) => (LIVE.finishedByVariant[variant] ?? 0) === 0);
    expect(unplayed).toHaveLength(28);
    for (const seed of SEEDS) {
      const plan = planMix(LIVE, options({ seed }));
      for (const variant of unplayed) {
        const games = plan.matches.filter((one) => one.why.kind === "unplayed" && one.variant === variant).length;
        expect([1, 2]).toContain(games);
        seen.add(games);
      }
    }
    expect([...seen].sort()).toEqual([1, 2]);
  });

  it("plans every playable game on an empty database", () => {
    const leftOut = [{ variant: "go" as RuleVariant, reason: "a test reason" }];
    const plan = planMix(EMPTY, options({ leftOut }));
    const planned = new Set(plan.matches.map((one) => one.variant));
    expect([...planned].sort()).toEqual(RULE_VARIANT_LIST.filter((one) => one !== "go").sort());
    expect(plan.unplayed).toEqual(RULE_VARIANT_LIST);
  });

  it("never sits a computer player opposite itself", () => {
    for (const seed of SEEDS) {
      const plan = planMix({ ...LIVE, records: LIVE.records }, options({ seed }));
      for (const match of plan.matches) expect(match.black).not.toBe(match.white);
    }
  });

  it("draws from all seven, so each specialist sometimes plays and sometimes plays away from home", () => {
    const seated = new Set<string>();
    for (const seed of SEEDS) {
      for (const match of planMix(EMPTY, options({ seed })).matches) {
        seated.add(match.black);
        seated.add(match.white);
      }
    }
    expect([...seated].sort()).toEqual([...MIX_ALL_PLAYERS].sort());
  });

  it("draws both colours for a player, not always the same one", () => {
    const asBlack = new Set<boolean>();
    for (const seed of SEEDS) {
      for (const match of planMix(EMPTY, options({ seed })).matches) {
        if (match.black === BOT_TIERS.tamenoki) asBlack.add(true);
        if (match.white === BOT_TIERS.tamenoki) asBlack.add(false);
      }
    }
    expect([...asBlack].sort()).toEqual([false, true]);
  });

  it("only draws a size the game is played on, and never a capped one", () => {
    const sizeCaps = [{ variant: "go" as RuleVariant, size: 19, reason: "too slow" }];
    for (const seed of SEEDS) {
      for (const match of planMix(EMPTY, options({ seed, sizeCaps })).matches) {
        expect(boardSizesFor(match.variant)).toContain(match.size);
        expect(match.variant === "go" && match.size === 19).toBe(false);
      }
    }
    expect(drawableSizes("go", { sizeCaps })).toEqual([13, 9]);
  });

  it("leaves out a game it is told cannot be finished, and says why, rather than dropping it silently", () => {
    const leftOut = [{ variant: "chineseCheckers" as RuleVariant, reason: "never reaches its camp" }];
    const plan = planMix(LIVE, options({ leftOut }));
    expect(plan.matches.some((one) => one.variant === "chineseCheckers")).toBe(false);
    expect(plan.unplayedLeftOut).toEqual(leftOut);
    expect(playableVariants({ leftOut, sizeCaps: [] })).not.toContain("chineseCheckers");
  });

  it("leaves out a game whose every size is capped, with that as the reason", () => {
    const sizeCaps = [{ variant: "checkers" as RuleVariant, size: 8, reason: "too slow" }];
    const plan = planMix(EMPTY, options({ sizeCaps }));
    expect(plan.matches.some((one) => one.variant === "checkers")).toBe(false);
    expect(plan.unplayedLeftOut.map((one) => one.variant)).toEqual(["checkers"]);
    expect(plan.unplayedLeftOut[0].reason).toMatch(/capped/);
  });
});

describe("the mixed plan: undefeated computer players", () => {
  const tamenoki = LIVE.records[0];

  it("finds a player undefeated only with games played and none lost", () => {
    expect(isUndefeated(tamenoki)).toBe(true);
    expect(isUndefeated(LIVE.records[1])).toBe(false);
    expect(isUndefeated({ tier: "kyu", ratedGames: 0, wins: 0, losses: 0, draws: 0, variants: [] })).toBe(false);
    expect(isUndefeated({ tier: "kyu", ratedGames: 4, wins: 0, losses: 0, draws: 4, variants: ["tictactoe"] })).toBe(true);
  });

  it("sends an undefeated player to three different games, all away from its specialty and its record", () => {
    for (const seed of SEEDS) {
      const plan = planMix(LIVE, options({ seed }));
      const sent = plan.matches.filter((one) => one.why.kind === "undefeated");
      expect(sent).toHaveLength(3);
      expect(new Set(sent.map((one) => one.variant)).size).toBe(3);
      for (const match of sent) {
        expect([match.black, match.white]).toContain("tamenoki");
        expect(match.black).not.toBe(match.white);
        expect(match.variant).not.toBe("reversi");
        expect(playsAsExpert(TIER_SPECS.tamenoki.expertise, match.variant)).toBe(false);
      }
    }
  });

  it("counts a grade's home ground as the games it holds a record at", () => {
    const record: MixRecord = { tier: "kyu", ratedGames: 2, wins: 2, losses: 0, draws: 0, variants: ["tictactoe"] };
    expect(homeGround(record)).toEqual(["tictactoe"]);
    for (const seed of SEEDS) {
      const sent = planMix({ finishedByVariant: {}, records: [record] }, options({ seed })).matches.filter(
        (one) => one.why.kind === "undefeated",
      );
      expect(sent).toHaveLength(3);
      for (const match of sent) expect(match.variant).not.toBe("tictactoe");
    }
  });

  it("sends a player with a loss nowhere", () => {
    const plan = planMix({ ...LIVE, records: [LIVE.records[1], LIVE.records[2]] }, options());
    expect(plan.matches.filter((one) => one.why.kind === "undefeated")).toHaveLength(0);
    expect(plan.undefeated).toHaveLength(0);
  });

  it("never sends an undefeated player to a game that is left out", () => {
    const leftOut = RULE_VARIANT_LIST.filter((one) => !["go", "hex", "checkers", "halma"].includes(one)).map(
      (variant) => ({ variant, reason: "test" }),
    );
    for (const seed of SEEDS) {
      const plan = planMix({ finishedByVariant: {}, records: [tamenoki] }, options({ seed, leftOut }));
      const sent = plan.matches.filter((one) => one.why.kind === "undefeated").map((one) => one.variant);
      expect(sent).toHaveLength(3);
      for (const variant of sent) expect(["go", "hex", "checkers", "halma"]).toContain(variant);
    }
  });
});

describe("the mixed plan: the seed", () => {
  it("gives the same plan for the same seed", () => {
    expect(planMix(LIVE, options({ seed: 424242 }))).toEqual(planMix(LIVE, options({ seed: 424242 })));
  });

  it("gives a different plan for a different seed", () => {
    const plans = SEEDS.map((seed) => JSON.stringify(planMix(LIVE, options({ seed })).matches));
    expect(new Set(plans).size).toBe(SEEDS.length);
  });

  it("uses a seed it is given, draws one when it is not, and refuses one it cannot read", () => {
    expect(mixSeedFrom("12345", 0.9)).toBe(12345);
    expect(mixSeedFrom(undefined, 0.5)).toBe(Math.floor(0.5 * SEED_RANGE));
    expect(mixSeedFrom("  ", 0.25)).toBe(Math.floor(0.25 * SEED_RANGE));
    for (const bad of ["abc", "1.5", "-1", String(SEED_RANGE)]) {
      expect(() => mixSeedFrom(bad, 0.5)).toThrow(/BOT_GAMES_SEED/);
    }
  });

  it("refuses a plan it could not draw players for", () => {
    expect(() => planMix(EMPTY, options({ players: ["kyu"] }))).toThrow(/two computer players/);
    expect(() => planMix(EMPTY, options({ unplayedGames: { fewest: 2, most: 1 } }))).toThrow();
  });
});
