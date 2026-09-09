import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BARE_ATTRIBUTE, BARE_HEAD_SCRIPT, readBare, subscribeBare, writeBare } from "./bare";

/**
 * Reading a page as the board alone.
 *
 * The store is three lines of localStorage, so what is worth testing is not
 * that it round-trips but that it survives storage it cannot use: a private
 * window, or a browser told to refuse it. A reading preference is not worth
 * an error, and a page that throws on load because it could not remember
 * whether to hide the footer would be a much worse bug than the one this
 * setting fixes.
 */

/** A window with storage that works, or storage that throws on every call. */
function withStorage(kind: "working" | "refusing") {
  const store = new Map<string, string>();
  const listeners = new Map<string, Set<() => void>>();
  const refuse = () => {
    throw new Error("The operation is insecure.");
  };
  const storage =
    kind === "working"
      ? {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => void store.set(key, value),
          removeItem: (key: string) => void store.delete(key),
        }
      : { getItem: refuse, setItem: refuse, removeItem: refuse };

  vi.stubGlobal("window", {
    localStorage: storage,
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) listener();
      return true;
    },
    addEventListener: (type: string, listener: () => void) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reading the board alone", () => {
  beforeEach(() => withStorage("working"));

  it("is off until somebody asks for it", () => {
    expect(readBare()).toBe(false);
  });

  it("remembers being asked for, and being turned off again", () => {
    writeBare(true);
    expect(readBare()).toBe(true);
    writeBare(false);
    expect(readBare()).toBe(false);
  });

  it("forgets rather than storing a no, so nothing is left behind", () => {
    const store = withStorage("working");
    writeBare(true);
    expect(store.size).toBe(1);
    writeBare(false);
    expect(store.size).toBe(0);
  });

  it("tells this tab at once, and stops when nobody is listening", () => {
    let told = 0;
    const stop = subscribeBare(() => (told += 1));
    writeBare(true);
    expect(told).toBe(1);
    stop();
    writeBare(false);
    expect(told).toBe(1);
  });
});

describe("a browser that will not store anything", () => {
  beforeEach(() => withStorage("refusing"));

  it("reads as off rather than throwing", () => {
    expect(() => readBare()).not.toThrow();
    expect(readBare()).toBe(false);
  });

  it("takes the switch without complaining, and simply does not remember", () => {
    expect(() => writeBare(true)).not.toThrow();
    expect(readBare()).toBe(false);
  });

  it("still tells this tab, so the page changes even when it cannot be kept", () => {
    let told = 0;
    subscribeBare(() => (told += 1));
    writeBare(true);
    expect(told).toBe(1);
  });
});

describe("the script that runs before the page is painted", () => {
  it("names the same key and attribute the store does, so the two cannot drift", () => {
    // Written as one expression into the document; if these stopped matching,
    // the page would paint with its furniture on and then take it away.
    expect(BARE_HEAD_SCRIPT).toContain(JSON.stringify("itsutsu.bare"));
    expect(BARE_HEAD_SCRIPT).toContain(JSON.stringify(BARE_ATTRIBUTE));
  });

  it("swallows its own errors, because storage may refuse it too", () => {
    expect(BARE_HEAD_SCRIPT).toContain("catch");
  });

  it("carries no line breaks or closing tag that could end the script early", () => {
    expect(BARE_HEAD_SCRIPT).not.toContain("</");
    expect(BARE_HEAD_SCRIPT).not.toContain("\n");
  });
});
