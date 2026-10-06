import { describe, expect, it } from "vitest";

import { HOUSEKI_KIND_LIST, HOUSEKI_SPECS } from "./houseki.constants";
import { housekiQuery, housekiRequestKey, housekiRequestOf } from "./housekiAddress";
import type { HousekiRequest } from "./houseki.types";

describe("what a play address asks for", () => {
  it("reads a level, and the campaign of one", () => {
    expect(housekiRequestOf("fallingTriplets", { level: "7" })).toEqual({ kind: "level", campaign: "classic", number: 7 });
    expect(housekiRequestOf("colourChains", { campaign: "shizen", level: "12" })).toEqual({ kind: "level", campaign: "shizen", number: 12 });
  });

  it("is never a board that does not exist: what it cannot read, or the game does not have, is the first level", () => {
    const first = { kind: "level", campaign: "classic", number: 1 };
    expect(housekiRequestOf("gemSwap", {})).toEqual(first);
    expect(housekiRequestOf("gemSwap", { level: "51" })).toEqual(first);
    expect(housekiRequestOf("gemSwap", { level: "0" })).toEqual(first);
    expect(housekiRequestOf("gemSwap", { level: "abc" })).toEqual(first);
    expect(housekiRequestOf("gemSwap", { level: "1e3" })).toEqual(first);
    expect(housekiRequestOf("fallingTriplets", { campaign: "arashi", level: "3" })).toEqual({ kind: "level", campaign: "classic", number: 3 });
    expect(housekiRequestOf("stoneCollapse", { lesson: "4" })).toEqual(first);
    expect(housekiRequestOf("magneticBlocks", { daily: "1" })).toEqual(first);
  });

  it("reads a lesson, the Daily where the game has one, and a free game with a size it offers", () => {
    expect(housekiRequestOf("stoneCollapse", { lesson: "2" })).toEqual({ kind: "lesson", number: 2 });
    expect(housekiRequestOf("stoneCollapse", { daily: "1" })).toEqual({ kind: "daily" });
    expect(housekiRequestOf("fallingTriplets", { free: "1", size: "wide", colours: "6", mode: "arcade" })).toEqual({ kind: "free", size: "wide", colours: 6, arcade: true });
    // An Arcade game of a game with no clock is Relaxed, and a size or colours it does not offer is the first it does.
    expect(housekiRequestOf("gemSwap", { free: "1", size: "enormous", colours: "9", mode: "arcade" })).toEqual({ kind: "free", size: "standard", colours: 5, arcade: false });
  });

  it("is spelled the same way it is read, for every kind of thing asked", () => {
    for (const kind of HOUSEKI_KIND_LIST) {
      const spec = HOUSEKI_SPECS[kind];
      const asked: HousekiRequest[] = [
        { kind: "level", campaign: "classic", number: 2 },
        { kind: "lesson", number: 1 },
        ...(spec.daily ? ([{ kind: "daily" }] as const) : []),
        ...spec.sizes.map((size) => ({ kind: "free", size: size.id, colours: spec.colours[0]!, arcade: spec.arcade }) as HousekiRequest),
      ];
      for (const request of asked) {
        const query = Object.fromEntries(new URLSearchParams(housekiQuery(request).slice(1)));
        expect(housekiRequestOf(kind, query), `${kind} ${housekiRequestKey(request)}`).toEqual(request);
      }
    }
    expect(new Set(["level:classic:1", "level:shizen:1", "lesson:1", "daily"]).size).toBe(4);
    expect(housekiRequestKey({ kind: "level", campaign: "shizen", number: 1 })).not.toBe(housekiRequestKey({ kind: "level", campaign: "classic", number: 1 }));
  });
});
