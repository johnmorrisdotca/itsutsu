import { describe, expect, it } from "vitest";

import { MEMBER_KINDS, MEMBER_KIND_DISPLAY, memberKind, worthShowing } from "./memberKind";
import { UNCLAIMABLE_REASONS } from "./memberId";

const ordinary = { email: "aki@example.com", unclaimableBecause: null };

describe("what kind of member somebody is", () => {
  it("is an ordinary member when nothing else is true", () => {
    expect(memberKind(ordinary)).toBe(MEMBER_KINDS.member);
  });

  it("is the operator when the deployment says so", () => {
    expect(memberKind({ ...ordinary, isOperator: true })).toBe(MEMBER_KINDS.operator);
  });

  it("tells the two sorts of kept record apart", () => {
    const kept = { email: null, unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord };
    expect(memberKind({ ...kept, legacyKind: "remembered" })).toBe(MEMBER_KINDS.remembered);
    expect(memberKind({ ...kept, legacyKind: "honorary" })).toBe(MEMBER_KINDS.honorary);
    // And says the general thing when the legacy data does not say which.
    expect(memberKind(kept)).toBe(MEMBER_KINDS.keptRecord);
  });

  it("knows a seeded row from a person", () => {
    expect(memberKind({ email: null, unclaimableBecause: UNCLAIMABLE_REASONS.seed })).toBe(MEMBER_KINDS.seed);
  });

  it("calls a program a robot before anything else", () => {
    // The computer players are members with no address and an unclaimable
    // reason, so without this they would read as kept records.
    expect(
      memberKind({ email: null, unclaimableBecause: UNCLAIMABLE_REASONS.seed, botTier: "meijin" }),
    ).toBe(MEMBER_KINDS.robot);
  });

  it("is not confused by an empty bot tier", () => {
    expect(memberKind({ ...ordinary, botTier: null })).toBe(MEMBER_KINDS.member);
    expect(memberKind({ ...ordinary, botTier: "" })).toBe(MEMBER_KINDS.member);
  });
});

describe("which kinds are drawn", () => {
  it("leaves an ordinary member unbadged, since a badge on every row is a badge on none", () => {
    expect(worthShowing(MEMBER_KINDS.member)).toBe(false);
  });

  it("draws every other kind", () => {
    for (const kind of Object.values(MEMBER_KINDS)) {
      if (kind !== MEMBER_KINDS.member) expect(worthShowing(kind), kind).toBe(true);
    }
  });
});

describe("the words for each kind", () => {
  it("names every kind there is, so a new one cannot ship unnamed", () => {
    for (const kind of Object.values(MEMBER_KINDS)) {
      const copy = MEMBER_KIND_DISPLAY[kind];
      expect(copy, kind).toBeDefined();
      expect(copy.label.length, kind).toBeGreaterThan(2);
      expect(copy.kanji.length, kind).toBeGreaterThan(0);
      expect(copy.note.length, kind).toBeGreaterThan(10);
    }
  });
});
