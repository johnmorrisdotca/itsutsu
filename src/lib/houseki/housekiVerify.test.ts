import { describe, expect, it } from "vitest";
import * as chains from "@johnmorrisdotca/houseki/colour-chains";
import * as triplets from "@johnmorrisdotca/houseki/falling-triplets";
import * as swap from "@johnmorrisdotca/houseki/gem-swap";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";

import { HOUSEKI_KIND_LIST, HOUSEKI_SPECS } from "./houseki.constants";
import type { HousekiRequest } from "./houseki.types";
import { HOUSEKI_SAVE_LONGEST, verifyHousekiWin } from "./housekiVerify";
import { finishedDaily, winnerOf } from "./housekiWinner";

const TODAY = "2026-10-06";
const level = (number: number, campaign: "classic" | "shizen" | "arashi" = "classic"): HousekiRequest => ({ kind: "level", campaign, number });

describe("the server plays a win again before it counts", () => {
  it.each(HOUSEKI_KIND_LIST)("%s: the recorded plan of its first level is a win the server accepts, priced by the level's own marks", (kind) => {
    const verdict = verifyHousekiWin(kind, level(1), winnerOf(kind, "classic", 1), TODAY);
    expect(verdict.ok).toBe(true);
    if (verdict.ok) {
      expect(verdict.campaign).toBe("classic");
      expect(verdict.number).toBe(1);
      expect(verdict.marks).toBe(1);
      expect(verdict.score).toBeGreaterThan(0);
    }
  });

  it("accepts the other two campaigns of Colour Chains, under their own names", () => {
    for (const campaign of ["shizen", "arashi"] as const) {
      const verdict = verifyHousekiWin("colourChains", level(2, campaign), winnerOf("colourChains", campaign, 2), TODAY);
      expect(verdict, campaign).toMatchObject({ ok: true, campaign });
    }
  });

  it("refuses a win of another level than the one asked for", () => {
    const second = winnerOf("fallingTriplets", "classic", 2);
    expect(verifyHousekiWin("fallingTriplets", level(1), second, TODAY)).toEqual({ ok: false, why: "not-that-level" });
    expect(verifyHousekiWin("gemSwap", level(1), winnerOf("gemSwap", "classic", 2), TODAY)).toEqual({ ok: false, why: "not-that-level" });
    expect(verifyHousekiWin("stoneCollapse", level(1), winnerOf("stoneCollapse", "classic", 2), TODAY)).toEqual({ ok: false, why: "not-that-level" });
    expect(verifyHousekiWin("colourChains", level(1, "shizen"), winnerOf("colourChains", "classic", 1), TODAY)).toMatchObject({ ok: false });
  });

  it("refuses a game that is not won, and a save that is not a game", () => {
    const begun = triplets.encodeGame(triplets.createLevel(triplets.levelManifest[0]!.id));
    expect(verifyHousekiWin("fallingTriplets", level(1), begun, TODAY)).toEqual({ ok: false, why: "not-won" });
    expect(verifyHousekiWin("colourChains", level(1), chains.encodeGame(chains.createLevel(chains.levelManifest[0]!.id)), TODAY)).toEqual({ ok: false, why: "not-won" });
    expect(verifyHousekiWin("stoneCollapse", level(1), stones.encodeGame(stones.createLevel(stones.levelManifest[0]!.id)), TODAY)).toEqual({ ok: false, why: "not-won" });
    expect(verifyHousekiWin("gemSwap", level(1), swap.encodeGame(swap.createGame(swap.GEM_SWAP_CAMPAIGN[0]!.options)), TODAY)).toEqual({ ok: false, why: "not-won" });
    expect(verifyHousekiWin("fallingTriplets", level(1), "nonsense", TODAY)).toEqual({ ok: false, why: "would-not-replay" });
    expect(verifyHousekiWin("fallingTriplets", level(1), "", TODAY)).toEqual({ ok: false, why: "not-a-game" });
    expect(verifyHousekiWin("fallingTriplets", level(1), "x".repeat(HOUSEKI_SAVE_LONGEST + 1), TODAY)).toEqual({ ok: false, why: "not-a-game" });
  });

  it("refuses a save whose moves were changed after the win, which the package's own replay will not reach", () => {
    const text = winnerOf("stoneCollapse", "classic", 1);
    const forged = text.slice(0, -6) + (text.endsWith("AAAAAA") ? "BBBBBB" : "AAAAAA");
    expect(verifyHousekiWin("stoneCollapse", level(1), forged, TODAY).ok).toBe(false);
  });

  it("refuses what is not a level or a Daily, a level that is not there, and a Daily a game does not have", () => {
    const win = winnerOf("fallingTriplets", "classic", 1);
    expect(verifyHousekiWin("fallingTriplets", { kind: "lesson", number: 1 }, win, TODAY)).toEqual({ ok: false, why: "not-counted" });
    expect(verifyHousekiWin("fallingTriplets", { kind: "free", size: "standard", colours: 5, arcade: false }, win, TODAY)).toEqual({ ok: false, why: "not-counted" });
    expect(verifyHousekiWin("fallingTriplets", level(101), win, TODAY)).toEqual({ ok: false, why: "no-such-level" });
    expect(verifyHousekiWin("fallingTriplets", level(1, "shizen"), win, TODAY)).toEqual({ ok: false, why: "no-such-level" });
    expect(HOUSEKI_SPECS.magneticBlocks.daily).toBe(false);
    expect(verifyHousekiWin("magneticBlocks", { kind: "daily" }, win, TODAY)).toEqual({ ok: false, why: "no-daily" });
  });
});

describe("a Daily counts for the day it was made on", () => {
  it.each(["fallingTriplets", "colourChains", "stoneCollapse", "gemSwap"] as const)("%s: a finished Daily of today or the day before counts, and no other day", (kind) => {
    const finished = finishedDaily(kind, TODAY);
    expect(verifyHousekiWin(kind, { kind: "daily" }, finished, TODAY)).toMatchObject({ ok: true, campaign: "daily", levelKey: TODAY, marks: 0 });
    // Handed in a day later (the player's day had not ended where they were), it is still the day it was made on.
    expect(verifyHousekiWin(kind, { kind: "daily" }, finished, "2026-10-07")).toMatchObject({ ok: true, levelKey: TODAY });
    expect(verifyHousekiWin(kind, { kind: "daily" }, finished, "2026-10-09")).toEqual({ ok: false, why: "not-today" });
  });

  it("refuses a Daily that has not run to its end", () => {
    const begun = triplets.encodeGame(triplets.createGame({ mode: "daily", seed: TODAY }));
    expect(verifyHousekiWin("fallingTriplets", { kind: "daily" }, begun, TODAY)).toEqual({ ok: false, why: "daily-not-finished" });
  });

  it("refuses a free game handed in as the Daily", () => {
    const free = triplets.encodeGame(triplets.createGame({ mode: "arcade", seed: TODAY }));
    expect(verifyHousekiWin("fallingTriplets", { kind: "daily" }, free, TODAY)).toEqual({ ok: false, why: "not-today" });
  });
});
