import { describe, expect, it } from "vitest";

import { KEPT_ID_PATTERN, KEPT_STATUS, isKeptStatus, makeKeptId } from "./kept.constants";
import { holderSeat, keptStatusOf, readKeptReport } from "./keptReport";

const seats = [
  { name: "John", computer: false },
  { name: "", computer: true },
  { name: "", computer: true },
  { name: "", computer: true },
];

describe("a game played on one device, as its browser files it", () => {
  it("reads a finished card game with its winner", () => {
    const read = readKeptReport({ game: "hearts", state: "{}", seats, over: true, winners: [2, 2] });
    expect(read).toEqual({ game: "hearts", state: "{}", seats, over: true, left: false, winners: [2] });
  });

  it("refuses a game not played on one device, and a winner who was not at the table", () => {
    expect(readKeptReport({ game: "reversi", state: "{}", seats, over: true, winners: [0] })).toHaveProperty("refused");
    expect(readKeptReport({ game: "hearts", state: "{}", seats, over: true, winners: [4] })).toHaveProperty("refused");
    expect(readKeptReport({ game: "hearts", state: "", seats, over: false, winners: [] })).toHaveProperty("refused");
  });

  it("says nobody won a game that is not over, and a game over is finished whatever else is said", () => {
    const going = readKeptReport({ game: "tenka", state: "x", seats, over: false, left: true, winners: [1] });
    expect(going).toMatchObject({ winners: [], left: true });
    expect(keptStatusOf({ over: true, left: true })).toBe(KEPT_STATUS.finished);
    expect(keptStatusOf({ over: false, left: true })).toBe(KEPT_STATUS.left);
    expect(keptStatusOf({ over: false, left: false })).toBe(KEPT_STATUS.playing);
  });

  it("files the device's holder at the first seat a person sat in", () => {
    expect(holderSeat(seats)).toBe(0);
    expect(holderSeat([{ name: "", computer: true }, { name: "Ann", computer: false }])).toBe(1);
    expect(holderSeat([{ name: "", computer: true }])).toBe(0);
  });

  it("names a kept game in a shape no table on several devices has, and never mistakes the statuses", () => {
    const id = makeKeptId((count) => Array.from({ length: count }, (_, at) => at * 7));
    expect(id).toMatch(KEPT_ID_PATTERN);
    expect("abcd-efgh").not.toMatch(KEPT_ID_PATTERN);
    expect(isKeptStatus(KEPT_STATUS.left)).toBe(true);
    expect(isKeptStatus("finished")).toBe(false);
  });
});
