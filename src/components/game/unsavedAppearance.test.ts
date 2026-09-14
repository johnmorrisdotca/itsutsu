import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Appearance } from "@/components/board/board.types";

import { forgetUnsaved, rememberUnsaved, unsavedAppearance } from "./unsavedAppearance";

/**
 * A board choice the account has not yet confirmed, kept by this browser — so a
 * reload faster than the save still draws what the member chose. See
 * `unsavedAppearance.ts`.
 */

const base: Appearance = {
  boardTheme: "kaya",
  stoneSet: "classic",
  showCoordinates: true,
  showMoveNumbers: false,
  grid: "lines",
  flipped: null,
} as unknown as Appearance;
const sumi = { ...base, boardTheme: "sumi" } as Appearance;
const shinkaya = { ...base, boardTheme: "shinkaya" } as Appearance;

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: memoryStorage() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("an unconfirmed board choice", () => {
  it("is remembered the moment it is made, and read back whole", () => {
    expect(unsavedAppearance()).toBeNull();
    rememberUnsaved(sumi);
    expect(unsavedAppearance()).toEqual(sumi);
  });

  it("is forgotten once the account confirms that same choice", () => {
    rememberUnsaved(sumi);
    forgetUnsaved(sumi);
    expect(unsavedAppearance()).toBeNull();
  });

  it("survives an older choice's confirmation, so a reload draws the newer one", () => {
    rememberUnsaved(sumi);
    rememberUnsaved(shinkaya);
    // The save for sumi answers after shinkaya was chosen.
    forgetUnsaved(sumi);
    expect(unsavedAppearance()).toEqual(shinkaya);
  });

  it("says nothing, and throws nothing, where the browser keeps no storage", () => {
    vi.stubGlobal("window", undefined);
    expect(() => rememberUnsaved(sumi)).not.toThrow();
    expect(unsavedAppearance()).toBeNull();
    expect(() => forgetUnsaved(sumi)).not.toThrow();
  });

  it("says nothing where storage refuses to be read", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(unsavedAppearance()).toBeNull();
    expect(() => rememberUnsaved(sumi)).not.toThrow();
  });
});
