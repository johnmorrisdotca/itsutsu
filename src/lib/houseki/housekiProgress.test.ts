import { describe, expect, it } from "vitest";

import { HOUSEKI_RUNS_MOST, decodeHouseki, dropRun, encodeHouseki, hasProgress, keepRun, latestRun, nextLevel, runFor, winRequest, wonCount, wonLevels, type HousekiRun } from "./housekiProgress";
import type { HousekiRequest } from "./houseki.types";

const level = (number: number, campaign: "classic" | "shizen" | "arashi" = "classic"): HousekiRequest => ({ kind: "level", campaign, number });
const run = (request: HousekiRequest, at: number): HousekiRun => ({ request, save: `save-${at}`, at });

describe("what a Houseki game remembers on the device", () => {
  it("keeps a won level once, in order, and a level won is not a game waiting", () => {
    let save = keepRun({}, "fallingTriplets", run(level(3), 1));
    expect(runFor(save, "fallingTriplets", level(3))?.save).toBe("save-1");
    save = winRequest(save, "fallingTriplets", level(3), "2026-10-06");
    save = winRequest(save, "fallingTriplets", level(1), "2026-10-06");
    save = winRequest(save, "fallingTriplets", level(3), "2026-10-06");
    expect(wonLevels(save, "fallingTriplets", "classic")).toEqual([1, 3]);
    expect(wonCount(save, "fallingTriplets")).toBe(2);
    expect(runFor(save, "fallingTriplets", level(3)), "the game won is no longer waiting").toBeNull();
    expect(nextLevel(save, "fallingTriplets", "classic")).toBe(2);
  });

  it("keeps the campaigns of Colour Chains apart", () => {
    const save = winRequest(winRequest({}, "colourChains", level(2, "shizen"), "2026-10-06"), "colourChains", level(2), "2026-10-06");
    expect(wonLevels(save, "colourChains", "shizen")).toEqual([2]);
    expect(wonLevels(save, "colourChains", "classic")).toEqual([2]);
    expect(wonLevels(save, "colourChains", "arashi")).toEqual([]);
    expect(wonCount(save, "colourChains")).toBe(2);
  });

  it("keeps one game for each thing asked for, the latest first, and only so many", () => {
    let save = {};
    for (let at = 1; at <= HOUSEKI_RUNS_MOST + 3; at += 1) save = keepRun(save, "stoneCollapse", run(level(at), at));
    expect(save).toHaveProperty("stoneCollapse.runs.length", HOUSEKI_RUNS_MOST);
    expect(latestRun(save, "stoneCollapse")?.request).toEqual(level(HOUSEKI_RUNS_MOST + 3));
    // A game put down again replaces its own earlier save and comes first, losing nobody else's.
    save = keepRun(save, "stoneCollapse", { request: level(5), save: "again", at: 99 });
    expect(latestRun(save, "stoneCollapse")?.save).toBe("again");
    expect(runFor(save, "stoneCollapse", level(6))).not.toBeNull();
    save = dropRun(save, "stoneCollapse", level(5));
    expect(runFor(save, "stoneCollapse", level(5))).toBeNull();
  });

  it("counts a Daily finished once a day, and the last thirty days", () => {
    let save = {};
    for (let day = 1; day <= 40; day += 1) save = winRequest(save, "gemSwap", { kind: "daily" }, `2026-09-${String(((day - 1) % 28) + 1).padStart(2, "0")}`);
    expect(save).toHaveProperty("gemSwap.dailies");
    expect((save as { gemSwap: { dailies: string[] } }).gemSwap.dailies.length).toBeLessThanOrEqual(30);
    expect(hasProgress(save, "gemSwap")).toBe(true);
  });

  it("is read back tolerantly: nothing a browser kept can break a page, and what makes no sense is left out", () => {
    expect(decodeHouseki(null)).toEqual({});
    expect(decodeHouseki("not json")).toEqual({});
    expect(decodeHouseki("[]")).toEqual({});
    const wild = JSON.stringify({
      fallingTriplets: { won: { classic: [1, 1, 0, 101, "x", 7], shizen: [1] }, dailies: ["2026-10-06", "yesterday"], runs: [{ request: { kind: "level", campaign: "classic", number: 999 }, save: "x", at: 1 }, { request: { kind: "level", campaign: "classic", number: 2 }, save: "ok", at: 5 }, { request: { kind: "lesson", number: 9 }, save: "x", at: 1 }] },
      magneticBlocks: { won: {}, dailies: ["2026-10-06"], runs: [{ request: { kind: "daily" }, save: "x", at: 1 }] },
      nothing: { won: { classic: [1] } },
    });
    const save = decodeHouseki(wild);
    expect(save.fallingTriplets?.won).toEqual({ classic: [1, 7] });
    expect(save.fallingTriplets?.dailies).toEqual(["2026-10-06"]);
    expect(save.fallingTriplets?.runs).toHaveLength(1);
    expect(save.fallingTriplets?.runs[0]?.request).toEqual(level(2));
    expect(save.magneticBlocks, "a Daily that game does not have, and nothing else: nothing is kept").toBeUndefined();
    expect(Object.keys(save)).toEqual(["fallingTriplets"]);
  });

  it("round-trips what it keeps", () => {
    const save = keepRun(winRequest({}, "gemSwap", level(4), "2026-10-06"), "gemSwap", run({ kind: "free", size: "wide", colours: 6, arcade: false }, 3));
    expect(decodeHouseki(encodeHouseki(save))).toEqual(save);
  });
});
