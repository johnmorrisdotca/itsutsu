import { afterEach, describe, expect, it, vi } from "vitest";

import { acceptPreferences, preferencesFrom } from "@/lib/preferences/preferences";

import { tsunagiBeadLook, tsunagiMarbleLook } from "./puzzles.constants";
import { keepFillHere, keptFill } from "./tsunagiKept";

afterEach(() => {
  vi.unstubAllGlobals();
});

function storage(): Map<string, string> {
  const held = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => held.get(key) ?? null,
      setItem: (key: string, value: string) => void held.set(key, value),
    },
  });
  return held;
}

describe("Tsunagi's marbles along a line", () => {
  it("are the pair's own marble with Colours, so the line reads as one colour end to end", () => {
    for (const pair of [0, 3, 11]) expect(tsunagiBeadLook(pair, "colours").background).toBe(tsunagiMarbleLook(pair, "colours").background);
  });

  it("take the line's tint with Numbers, not the plain shell the numbered ends are", () => {
    const bead = tsunagiBeadLook(0, "numbers").background;
    expect(bead).not.toBe(tsunagiMarbleLook(0, "numbers").background);
    expect(bead).toMatch(/^radial-gradient\(/);
    // Two pairs are still told apart by their tint.
    expect(bead).not.toBe(tsunagiBeadLook(1, "numbers").background);
  });

  it("are on until somebody turns them off, and the account keeps only the two answers", () => {
    expect(preferencesFrom({}).tsunagiFill).toBe("marbles");
    expect(preferencesFrom({ tsunagiFill: "lines" }).tsunagiFill).toBe("lines");
    expect(acceptPreferences({ tsunagiFill: "lines" })).toEqual({ ok: true, patch: { tsunagiFill: "lines" } });
    expect(acceptPreferences({ tsunagiFill: "beads" }).ok).toBe(false);
  });

  it("are remembered in this browser for somebody with no account", () => {
    const held = storage();
    expect(keptFill()).toBeNull();
    keepFillHere("lines");
    expect(keptFill()).toBe("lines");
    held.set("itsutsu.tsunagi.fill", "sideways");
    expect(keptFill()).toBeNull();
  });

  it("still draw when the browser keeps nothing", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(() => keepFillHere("lines")).not.toThrow();
    expect(keptFill()).toBeNull();
  });
});
