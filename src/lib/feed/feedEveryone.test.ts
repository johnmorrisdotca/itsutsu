import { describe, expect, it } from "vitest";

import { AGE_BANDS } from "@/lib/social/ageBand.constants";

import { everyoneMayShow, mayBeNamed } from "./feedEveryone";

const adult = { ageBand: AGE_BANDS.adult, botTier: null };
const teen = { ageBand: AGE_BANDS.teen, botTier: null };
const child = { ageBand: AGE_BANDS.under13, botTier: null };
const neverAsked = { ageBand: null, botTier: null };
const program = { ageBand: null, botTier: "novice" };

describe("a game on the Everyone tab", () => {
  it("is shown between two adults", () => {
    expect(everyoneMayShow([adult, adult])).toBe(true);
  });

  it("is shown between an adult and a program", () => {
    expect(everyoneMayShow([adult, program])).toBe(true);
    expect(everyoneMayShow([program, adult])).toBe(true);
  });

  it("is never shown with a member under 13 in it", () => {
    expect(everyoneMayShow([adult, child])).toBe(false);
    expect(everyoneMayShow([child, program])).toBe(false);
  });

  it("is never shown with a member aged 13 to 17 in it", () => {
    expect(everyoneMayShow([teen, adult])).toBe(false);
    expect(everyoneMayShow([program, teen])).toBe(false);
  });

  it("is never shown with a member who has not said their age: null is not a band", () => {
    expect(everyoneMayShow([adult, neverAsked])).toBe(false);
    expect(everyoneMayShow([neverAsked, program])).toBe(false);
  });

  it("is never shown with a seat nobody is behind", () => {
    expect(everyoneMayShow([adult, null])).toBe(false);
    expect(everyoneMayShow([null, null])).toBe(false);
  });

  it("is not shown with only programs in it: a bot series is nobody's game", () => {
    expect(everyoneMayShow([program, program])).toBe(false);
  });

  it("is not shown with no seats to judge", () => {
    expect(everyoneMayShow([])).toBe(false);
  });

  it("reads a band it does not know as not adult", () => {
    expect(everyoneMayShow([adult, { ageBand: "18+", botTier: null }])).toBe(false);
    expect(everyoneMayShow([adult, { ageBand: "", botTier: null }])).toBe(false);
  });

  it("does not let an empty bot tier pass for a program", () => {
    expect(everyoneMayShow([adult, { ageBand: null, botTier: "" }])).toBe(false);
  });
});

describe("naming one person on the Everyone tab", () => {
  it("names an adult and a program", () => {
    expect(mayBeNamed(adult)).toBe(true);
    expect(mayBeNamed(program)).toBe(true);
  });

  it("never names a member under 18, one never asked, or a seat nobody is behind", () => {
    expect(mayBeNamed(child)).toBe(false);
    expect(mayBeNamed(teen)).toBe(false);
    expect(mayBeNamed(neverAsked)).toBe(false);
    expect(mayBeNamed(null)).toBe(false);
  });

  it("reads an unknown band as not adult, and an empty tier as no program", () => {
    expect(mayBeNamed({ ageBand: "18+", botTier: null })).toBe(false);
    expect(mayBeNamed({ ageBand: null, botTier: "" })).toBe(false);
  });
});
