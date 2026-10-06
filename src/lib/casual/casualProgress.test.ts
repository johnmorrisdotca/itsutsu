import { describe, expect, it } from "vitest";

import { CASUAL_KIND_LIST, CASUAL_SPECS } from "./casual.constants";
import { decodeCasual, encodeCasual, goingLevel, hasProgress, leaveLevel, nextLevel, startLevel, winLevel, wonLevels, type CasualSave } from "./casualProgress";

describe("what a casual game remembers", () => {
  it("starts with nothing, and a level begun is the one in progress", () => {
    const empty: CasualSave = {};
    expect(hasProgress(empty, "tubeSort")).toBe(false);
    expect(nextLevel(empty, "tubeSort")).toBe(1);
    const started = startLevel(empty, "tubeSort", 2);
    expect(goingLevel(started, "tubeSort")).toBe(2);
    expect(hasProgress(started, "tubeSort")).toBe(true);
    // Another game's progress is its own.
    expect(hasProgress(started, "gridEscape")).toBe(false);
  });

  it("a level won is won for good, in order, and leaves the player between levels", () => {
    let save: CasualSave = startLevel({}, "ropeCut", 3);
    save = winLevel(save, "ropeCut", 3);
    save = winLevel(save, "ropeCut", 1);
    expect(wonLevels(save, "ropeCut")).toEqual([1, 3]);
    expect(goingLevel(save, "ropeCut")).toBeNull();
    expect(nextLevel(save, "ropeCut")).toBe(2);
    // Winning twice is winning once, and starting a won level again does not un-win it.
    expect(wonLevels(winLevel(save, "ropeCut", 3), "ropeCut")).toEqual([1, 3]);
    expect(wonLevels(startLevel(save, "ropeCut", 3), "ropeCut")).toEqual([1, 3]);
    expect(goingLevel(startLevel(save, "ropeCut", 3), "ropeCut")).toBeNull();
  });

  it("giving up leaves a level unsolved and no longer in progress", () => {
    const save = leaveLevel(startLevel(winLevel({}, "pinRescue", 1), "pinRescue", 2), "pinRescue");
    expect(goingLevel(save, "pinRescue")).toBeNull();
    expect(wonLevels(save, "pinRescue")).toEqual([1]);
    expect(nextLevel(save, "pinRescue")).toBe(2);
  });

  it("offers the last level when every one is won", () => {
    let save: CasualSave = {};
    for (let level = 1; level <= CASUAL_SPECS.choiceStory.levels; level += 1) save = winLevel(save, "choiceStory", level);
    expect(nextLevel(save, "choiceStory")).toBe(CASUAL_SPECS.choiceStory.levels);
  });

  it("refuses a level the game does not have", () => {
    expect(startLevel({}, "choiceStory", 5)).toEqual({});
    expect(winLevel({}, "gridEscape", 0)).toEqual({});
    expect(winLevel({}, "gridEscape", 1.5)).toEqual({});
  });

  it("is kept and read back exactly", () => {
    let save: CasualSave = {};
    for (const kind of CASUAL_KIND_LIST) save = winLevel(startLevel(save, kind, 2), kind, 1);
    expect(decodeCasual(encodeCasual(save))).toEqual(save);
  });

  it("reads back whatever a browser kept, dropping what it cannot make sense of", () => {
    expect(decodeCasual(null)).toEqual({});
    expect(decodeCasual("not json")).toEqual({});
    expect(decodeCasual("[1,2]")).toEqual({});
    expect(decodeCasual('{"tubeSort":{"won":[2,"x",99,2,1,-1],"going":2}}')).toEqual({ tubeSort: { won: [1, 2], going: null } });
    expect(decodeCasual('{"tubeSort":{"won":[],"going":9}}')).toEqual({});
    expect(decodeCasual('{"notAGame":{"won":[1]}}')).toEqual({});
  });
});
