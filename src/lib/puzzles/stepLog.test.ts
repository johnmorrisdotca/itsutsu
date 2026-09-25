import { describe, expect, it } from "vitest";

import { decodeStepLog, encodeStepLog, STEPS_KEPT } from "./stepLog";

describe("the steps of a kept puzzle", () => {
  it("reads back every grid it was given, the first whole and each after as its changes", () => {
    const codes = ["......", "b.....", "bw....", "bw..b.", "b...b."];
    const log = encodeStepLog(codes);
    expect(log).toBe("......~00b~01w~04b~01.");
    expect(decodeStepLog(log, 6)).toEqual(codes);
  });

  it("keeps a step that changed several cells, and one that changed none", () => {
    const codes = ["..", "ab", "ab"];
    expect(decodeStepLog(encodeStepLog(codes), 2)).toEqual(codes);
  });

  it("keeps only the newest steps, so the log has a ceiling", () => {
    const codes = Array.from({ length: STEPS_KEPT + 50 }, (_, at) => (at % 2 === 0 ? "a." : "ab"));
    const read = decodeStepLog(encodeStepLog(codes), 2)!;
    expect(read).toHaveLength(STEPS_KEPT);
    expect(read.at(-1)).toBe(codes.at(-1));
  });

  it("refuses a log that does not fit the grid rather than drawing a wrong one", () => {
    expect(decodeStepLog("", 6)).toBeNull();
    expect(decodeStepLog("....", 6)).toBeNull();
    expect(decodeStepLog("......~0zb", 6)).toBeNull();
    expect(decodeStepLog("......~00", 6)).toBeNull();
  });
});
