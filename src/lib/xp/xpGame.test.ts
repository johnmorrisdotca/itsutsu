import { describe, expect, it } from "vitest";

import { GAME_FAMILIES, familyKeyOf } from "@/lib/gomoku/families";
import { RULE_VARIANTS, RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { BOT_SPECIALIST_LIST, BOT_TIERS, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { STREAK_KINDS, type Streak } from "@/lib/rating/streak";

import { XP_LONG_GAME_MOVES, XP_WIN_STREAK_MILESTONES } from "./xp.constants";
import {
  NO_OPPONENT,
  XP_GRADES_TO_BEAT,
  XP_VARIANTS_TO_PLAY,
  gameAwards,
  otherSeat,
  variantOf,
  type Opponent,
  type PlayedSideFacts,
} from "./xpGame";

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

/**
 * Nobody in the other seat: an unbound chair, or a member playing themselves.
 *
 * Midweek, too. `weekendWeek` is null in every case except the weekend's own,
 * so no case here can pay a weekend award by accident — a fixture that left it
 * to the calendar would pass or fail by the day of the week the suite ran.
 */
const alone: PlayedSideFacts = {
  outcome: STREAK_KINDS.win,
  run: null,
  opponent: NO_OPPONENT,
  weekendWeek: null,
};
/** A person, known not to be a buddy and known never to have won before. */
const person: Opponent = { id: "m-they", tier: null, buddy: false, beatenMeBefore: false };

const won: PlayedSideFacts = { ...alone, outcome: STREAK_KINDS.win };
const lost: PlayedSideFacts = { ...alone, outcome: STREAK_KINDS.loss };
const drawn: PlayedSideFacts = { ...alone, outcome: STREAK_KINDS.draw };

/** A win over somebody, with whatever is known about them laid over the default. */
function beat(over: Partial<Opponent> = {}, run: Streak | null = null): PlayedSideFacts {
  return { ...alone, run, opponent: { ...person, ...over } };
}

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

  it("adds the win on top, and changes nothing a finish paid", () => {
    // A win is everything a finish pays plus what winning pays, in that order —
    // never a different list. Alone in the other seat there is nobody to have
    // beaten, so it is the win and the first win at this game and no more.
    expect(types(won)).toEqual([...types(lost), "gameWon", "firstWinAtVariant"]);
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

describe("a game at the weekend", () => {
  it("pays for the week it names, and for nothing when there is no week", () => {
    const week = { ...won, weekendWeek: "2026-W37" };
    const awards = gameAwards(game, week);
    expect(awards.find((award) => award.type === "weekendGame")?.subject).toBe("2026-W37");
    // Once a WEEKEND, so the subject is the week and never the game: two games
    // on one Saturday write one row.
    expect(types(won)).not.toContain("weekendGame");
  });

  it("pays nothing for a week that is not one", () => {
    // An empty subject would mean "once ever" — the shape a caller with nothing
    // to say must not be read as. Belt and braces over the type, because the
    // caller computes this from a zone and a clock.
    expect(types({ ...won, weekendWeek: "" })).not.toContain("weekendGame");
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

describe("winning against somebody", () => {
  it("pays for the person, and for the buddy on top of that", () => {
    expect(types(beat())).toContain("wonVsPerson");
    expect(types(beat())).not.toContain("wonVsBuddy");
    expect(types(beat({ buddy: true }))).toContain("wonVsBuddy");
  });

  it("pays neither against a program", () => {
    // A grade is beaten, not a person. `gradeBeaten` is what pays for it, and
    // paying `wonVsPerson` as well would make the bots the cheapest people on
    // the site to beat.
    const meijin = types(beat({ tier: BOT_TIERS.meijin }));
    expect(meijin).not.toContain("wonVsPerson");
    expect(meijin).not.toContain("wonVsBuddy");
    expect(meijin).toContain("gradeBeaten");
  });

  it("pays neither when the other seat is nobody", () => {
    // An unbound seat, or a member playing themselves. John has played himself;
    // that game is a win over nobody.
    expect(types(won)).not.toContain("wonVsPerson");
    expect(types(beat({ id: null }))).not.toContain("wonVsPerson");
  });

  it("says nothing about a buddy list it could not read", () => {
    // Null is "could not be asked" — a member with no address, or a read that
    // failed — and it must not be read as "not a buddy", nor as one.
    expect(types(beat({ buddy: null }))).not.toContain("wonVsBuddy");
    expect(types(beat({ buddy: null }))).toContain("wonVsPerson");
  });
});

describe("the turn-around", () => {
  it("pays once for beating somebody who had beaten you", () => {
    const awards = gameAwards(game, beat({ beatenMeBefore: true }));
    const revenge = awards.find((award) => award.type === "revengeWin");
    // Once per rivalry PER GAME: the opponent and the variant, so turning it
    // around at Reversi and at Hex are two different turn-arounds, and the
    // second win at Reversi is neither.
    expect(revenge?.subject).toBe("m-they:reversi");
  });

  it("stays silent where it was not established", () => {
    expect(types(beat({ beatenMeBefore: false }))).not.toContain("revengeWin");
    // The dangerous one: a history that could not be read must not pay. Treating
    // null as true would pay 30 XP on every win, for a turn-around that never
    // happened, and nothing would report it.
    expect(types(beat({ beatenMeBefore: null }))).not.toContain("revengeWin");
  });

  it("is never paid against a computer, however often it has won", () => {
    expect(types(beat({ tier: BOT_TIERS.kyu, beatenMeBefore: true }))).not.toContain("revengeWin");
  });
});

describe("a run of wins", () => {
  it("pays at three, five and ten, and at nothing else", () => {
    for (const { wins, type } of XP_WIN_STREAK_MILESTONES) {
      expect(types(beat({}, { kind: "win", count: wins })), `${wins}`).toContain(type);
    }
    for (const count of [1, 2, 4, 6, 9, 11, 30]) {
      const asked = types(beat({}, { kind: "win", count }));
      expect(asked.filter((type) => type.startsWith("winStreak")), `${count}`).toEqual([]);
    }
  });

  it("keys it on the game that completed it, so a later run pays again", () => {
    const awards = gameAwards(game, beat({}, { kind: "win", count: 3 }));
    expect(awards.find((award) => award.type === "winStreak3")?.subject).toBe("k3m9-p2qx");
  });

  it("pays nothing for a run of losses or draws, or for no run at all", () => {
    // A draw is its own streak here, as `streak.ts` decides, so a run of three
    // draws is a real run and is not three wins.
    expect(types(beat({}, { kind: "loss", count: 5 }))).not.toContain("winStreak5");
    expect(types(beat({}, { kind: "draw", count: 3 }))).not.toContain("winStreak3");
    expect(types(beat({}, null)).filter((type) => type.startsWith("winStreak"))).toEqual([]);
  });
});

describe("the computer ladder", () => {
  it("pays a grade for each of the five", () => {
    for (const tier of BOT_TIER_LIST) {
      const awards = gameAwards(game, beat({ tier }));
      expect(awards.find((award) => award.type === "gradeBeaten")?.subject, tier).toBe(tier);
    }
    expect(XP_GRADES_TO_BEAT).toBe(5);
  });

  it("pays a specialist rather than a grade for the two off the ladder", () => {
    for (const tier of BOT_SPECIALIST_LIST) {
      const asked = types(beat({ tier }));
      expect(asked, tier).toContain("specialistBeaten");
      expect(asked, tier).not.toContain("gradeBeaten");
    }
    expect(BOT_SPECIALIST_LIST.length).toBe(2);
  });

  it("pays nothing for a grade it does not know", () => {
    // A tier retired, or a row written by a later deploy. An award keyed on a
    // string that is not a grade would sit in the ledger unable to explain
    // itself.
    const asked = types(beat({ tier: "sensei" }));
    expect(asked).not.toContain("gradeBeaten");
    expect(asked).not.toContain("specialistBeaten");
  });
});

describe("who was in the other seat", () => {
  it("is the other id, and nobody for a game against yourself", () => {
    expect(otherSeat({ blackMemberId: "me", whiteMemberId: "them" }, "me")).toBe("them");
    expect(otherSeat({ blackMemberId: "them", whiteMemberId: "me" }, "me")).toBe("them");
    // Not "me", which is what `rematch.ts`'s opponentOf answers here — it is
    // asking a different question, about whom a rematch would be against.
    expect(otherSeat({ blackMemberId: "me", whiteMemberId: "me" }, "me")).toBeNull();
  });

  it("is nobody for an unbound seat, and for a member who was not in the game", () => {
    expect(otherSeat({ blackMemberId: "me", whiteMemberId: null }, "me")).toBeNull();
    expect(otherSeat({ blackMemberId: "a", whiteMemberId: "b" }, "me")).toBeNull();
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
