import { describe, expect, it } from "vitest";

import { GAME_FAMILIES, familyKeyOf } from "@/lib/gomoku/families";
import { RULE_VARIANTS, RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { STREAK_KINDS } from "@/lib/rating/streak";

import { XP_LONG_GAME_MOVES } from "./xp.constants";
import { XP_VARIANTS_TO_PLAY, gameAwards, variantOf } from "./xpGame";

/**
 * What a finished game pays, as a table of cases rather than as a database.
 *
 * The subjects are the half worth testing hardest. A `firstOfVariant` awarded
 * with the game id instead of the variant key would pay thirty-nine times over,
 * and nothing about it would look wrong: the row is valid, the total moves, the
 * toast reads properly. Only the subject says how often an award may happen, so
 * every case below asserts the subject and not merely the type.
 */

const game = { id: "k3m9-p2qx", variant: RULE_VARIANTS.reversi as string, moveCount: 12 };
const won = { outcome: STREAK_KINDS.win } as const;
const lost = { outcome: STREAK_KINDS.loss } as const;
const drawn = { outcome: STREAK_KINDS.draw } as const;

/** The types a call asked for, in order. */
function types(input: Parameters<typeof gameAwards>[1], one = game): string[] {
  return gameAwards(one, input).map((award) => award.type);
}

describe("what finishing a game pays", () => {
  it("pays the finish, the first game ever, and the tour — won or lost", () => {
    // A lost game still pays. Seeing a game through is the courtesy
    // correspondence play depends on, and a ladder that only paid winners would
    // be a second rating wearing a different name.
    expect(types(lost)).toEqual([
      "gameFinished",
      "firstGameEver",
      "firstOfVariant",
      "firstOfFamily",
    ]);
    expect(types(drawn)).toEqual(types(lost));
  });

  it("adds the win on top, and nothing else changes", () => {
    expect(types(won)).toEqual([...types(lost), "gameWon"]);
  });

  it("keys the finish on the game and the tour on the game's own name", () => {
    const awards = gameAwards(game, won);
    const subjectOf = (type: string) => awards.find((award) => award.type === type)?.subject;

    expect(subjectOf("gameFinished")).toBe("k3m9-p2qx");
    expect(subjectOf("gameWon")).toBe("k3m9-p2qx");
    expect(subjectOf("firstOfVariant")).toBe("reversi");
    expect(subjectOf("firstOfFamily")).toBe("flips");
    // Once ever, about nobody but the member: the subject is left off, and
    // `awardXp` writes `""`. Never null, however it is spelled — Postgres does
    // not consider two nulls equal, so a null subject would let a once-ever
    // award be paid twice with the index present and doing nothing. The stored
    // form is asserted at the writer, in `xpGameServer.test.ts`.
    expect(awards.some((award) => award.type === "firstGameEver")).toBe(true);
    expect(subjectOf("firstGameEver")).toBeUndefined();
  });

  it("puts the finish first, because the allowance is walked in order", () => {
    // `withinAllowance` decides an award marked `ridesAllowance` against
    // whether the finish AHEAD of it was paid. A long game listed before the
    // finish would be decided against a question nobody had answered yet.
    const long = gameAwards({ ...game, moveCount: XP_LONG_GAME_MOVES }, won);
    expect(long[0].type).toBe("gameFinished");
    expect(long.findIndex((award) => award.type === "longGame")).toBeGreaterThan(0);
  });
});

describe("a long game", () => {
  it("pays past the distance and not before it", () => {
    expect(types(won, { ...game, moveCount: XP_LONG_GAME_MOVES - 1 })).not.toContain("longGame");
    expect(types(won, { ...game, moveCount: XP_LONG_GAME_MOVES })).toContain("longGame");
    expect(types(won, { ...game, moveCount: 300 })).toContain("longGame");
  });

  it("keys it on the game, so one long game pays once however it ended", () => {
    const awards = gameAwards({ ...game, moveCount: 90 }, lost);
    expect(awards.find((award) => award.type === "longGame")?.subject).toBe("k3m9-p2qx");
  });
});

describe("a variant the deploy does not know", () => {
  it("pays the finish and says nothing about a tour it cannot read", () => {
    // `Game.variant` is a plain string column. A row naming something this
    // deploy has never heard of must pay nothing for a first game of it rather
    // than pay under a key that is not a game — a rule that cannot measure
    // must not fire.
    expect(variantOf({ ...game, variant: "shogi" })).toBeNull();
    expect(types(won, { ...game, variant: "shogi" })).toEqual(["gameFinished", "firstGameEver", "gameWon"]);
    expect(types(won, { ...game, variant: "" })).not.toContain("firstOfVariant");
  });
});

describe("the tour covers the site", () => {
  it("names a family for every game, so no game pays a first-of-family of null", () => {
    for (const variant of RULE_VARIANT_LIST) {
      expect(familyKeyOf(variant), variant).not.toBeNull();
    }
  });

  it("counts the games and the families the bonuses are measured against", () => {
    // The two "all of them" awards are counted against these numbers, so a new
    // game or a new family moves the target rather than leaving somebody holding
    // a set that is complete and unpaid.
    expect(XP_VARIANTS_TO_PLAY).toBe(RULE_VARIANT_LIST.length);
    expect(XP_VARIANTS_TO_PLAY).toBe(39);
    expect(GAME_FAMILIES.length).toBe(11);
  });

  it("gives every family a key nothing else has, and one that is not its title", () => {
    // The key is what the ledger stores. Two families sharing one would make the
    // second family a family somebody had already met; a key that is the title
    // would re-award 50 XP to everybody the day a family is reworded.
    const keys = GAME_FAMILIES.map((family) => family.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const family of GAME_FAMILIES) {
      expect(family.key).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(family.key).not.toBe(family.title);
    }
  });
});
