import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgetRunOnDevice, furtherRun, keepRunOnDevice, runOnDevice } from "./runsOnDevice";

const puzzle = { kind: "numberPlace", size: 9, level: "easy", seed: 42 };

describe("a puzzle's run kept on the device", () => {
  beforeEach(() => {
    // The browser's storage, as far as this needs it.
    const kept = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => kept.get(key) ?? null, setItem: (key: string, value: string) => void kept.set(key, value) } });
  });

  it("is kept under its puzzle, opened again, and forgotten", () => {
    keepRunOnDevice({ ...puzzle, progress: "1..", elapsedMs: 5000, checksUsed: 1, hintsUsed: 0 });
    expect(runOnDevice(puzzle)).toEqual({ progress: "1..", elapsedMs: 5000, checksUsed: 1, hintsUsed: 0 });
    expect(runOnDevice({ ...puzzle, seed: 43 })).toBeNull();
    expect(runOnDevice({ ...puzzle, clock: "fox" })).toBeNull();
    forgetRunOnDevice(puzzle);
    expect(runOnDevice(puzzle)).toBeNull();
  });

  it("keeps only the most recent twenty", () => {
    for (let seed = 1; seed <= 25; seed += 1) keepRunOnDevice({ ...puzzle, seed, progress: "", elapsedMs: seed, checksUsed: 0, hintsUsed: 0 });
    expect(runOnDevice({ ...puzzle, seed: 25 })).not.toBeNull();
    expect(runOnDevice({ ...puzzle, seed: 1 })).toBeNull();
  });

  it("opens whichever of the account's and the device's was played further", () => {
    const short = { progress: "a", elapsedMs: 1000, checksUsed: 0, hintsUsed: 0 };
    const long = { progress: "b", elapsedMs: 9000, checksUsed: 0, hintsUsed: 0 };
    expect(furtherRun(short, long)).toBe(long);
    expect(furtherRun(long, short)).toBe(long);
    expect(furtherRun(null, short)).toBe(short);
    expect(furtherRun(short, null)).toBe(short);
    expect(furtherRun(null, null)).toBeNull();
  });
});
