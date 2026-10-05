import { afterEach, describe, expect, it, vi } from "vitest";

import { deviceChoice } from "./meikyuuDeviceChoice";

/*
 * A SMALL CHOICE KEPT ON THIS DEVICE (`meikyuuDeviceChoice.ts`): which way up a tall maze is shown and whether the view slides
 * at the edge. Both must come out as their default wherever storage is missing or refuses, keep only what is not the default,
 * and refuse any word that is not one of theirs.
 */
function storage(initial: Record<string, string> = {}, refuses = false) {
  const data = new Map(Object.entries(initial));
  const guard = () => {
    if (refuses) throw new Error("storage refused");
  };
  return {
    data,
    api: {
      getItem: (key: string) => (guard(), data.get(key) ?? null),
      setItem: (key: string, value: string) => (guard(), void data.set(key, value)),
      removeItem: (key: string) => (guard(), void data.delete(key)),
    },
  };
}

const parse = (word: string | null): "on" | "off" | null => (word === "on" || word === "off" ? word : null);

describe("a choice kept on this device only", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is the default where there is no browser, and a choice made there lives for the page", () => {
    const choice = deviceChoice("k", "on", parse);
    expect(choice.choose).toBeTypeOf("function");
    // No window: nothing to read, nothing to keep, and choosing does not throw.
    expect(() => choice.choose("off")).not.toThrow();
  });

  it("reads what a device kept, keeps what is not the default, and keeps the default as nothing", () => {
    const kept = storage({ k: "off" });
    vi.stubGlobal("window", { localStorage: kept.api });
    const choice = deviceChoice("k", "on", parse);
    choice.choose("on");
    expect(kept.data.has("k"), "the default is kept as nothing").toBe(false);
    choice.choose("off");
    expect(kept.data.get("k")).toBe("off");
  });

  it("refuses a word that is not one of its own, and stays on the default", () => {
    const kept = storage({ k: "sideways" });
    vi.stubGlobal("window", { localStorage: kept.api });
    const choice = deviceChoice("k", "on", parse);
    choice.choose("on");
    // Nothing was kept for the default, and the stored word was never taken as the choice.
    expect(kept.data.get("k")).toBe("sideways");
  });

  it("carries on when storage refuses every read and write", () => {
    vi.stubGlobal("window", { localStorage: storage({}, true).api });
    const choice = deviceChoice("k", "on", parse);
    expect(() => choice.choose("off")).not.toThrow();
  });
});
