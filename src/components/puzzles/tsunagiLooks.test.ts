import { afterEach, describe, expect, it, vi } from "vitest";

import { acceptPreferences, preferencesFrom } from "@/lib/preferences/preferences";

import { beadShades, colourOfPair, marbleShades, TSUNAGI_COLOUR_SETS } from "@johnmorrisdotca/tsunagi/draw";

import { tsunagiMarbleLook } from "./puzzles.constants";
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
  const colour = (pair: number) => colourOfPair(TSUNAGI_COLOUR_SETS.marble, pair);

  it("are the pair's own marble with Colours, so the line reads as one colour end to end", () => {
    for (const pair of [0, 3, 11]) expect(beadShades(colour(pair), "colours")).toEqual(marbleShades(colour(pair), "colours"));
  });

  it("take the line's tint with Numbers, not the plain shell the numbered ends are", () => {
    const bead = beadShades(colour(0), "numbers");
    expect(bead.body).not.toBe(marbleShades(colour(0), "numbers").body);
    // Two pairs are still told apart by their tint.
    expect(bead.body).not.toBe(beadShades(colour(1), "numbers").body);
  });

  it("are the board's own marble beside the board too, in the level picker", () => {
    const shades = marbleShades(colour(3), "colours");
    expect(tsunagiMarbleLook(3, "colours")).toEqual({ background: `radial-gradient(circle at 35% 30%, ${shades.light} 0%, ${shades.body} 45%, ${shades.rim} 100%)`, color: shades.ink });
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
