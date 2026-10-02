import { describe, expect, it } from "vitest";

import { HOME_FAMILIES } from "@/lib/gomoku/families";
import { slugFor } from "@/lib/gomoku/slugs";

import { completedFilter, completedHref } from "./completedFilter";

describe("narrowing the Completed tab", () => {
  it("is no filter without one, or for a name it does not know", () => {
    expect(completedFilter(null, null).only).toBeNull();
    expect(completedFilter("no-such-family", "no-such-game")).toEqual({ family: null, game: null, only: null });
  });

  it("narrows a family to every game its shelf shows", () => {
    const family = HOME_FAMILIES[0];
    const narrowed = completedFilter(family.key, null);
    expect(narrowed.family?.key).toBe(family.key);
    for (const game of family.games) expect(narrowed.only).toContain(game);
  });

  it("narrows a game to itself, and a game wins over its family", () => {
    const family = HOME_FAMILIES[0];
    const game = family.games[0];
    const narrowed = completedFilter(family.key, slugFor(game));
    expect(narrowed.only).toContain(game);
    expect(narrowed.only?.every((key) => key === game || !family.games.includes(key))).toBe(true);
  });

  it("keeps the narrowing in the address, with a page's start", () => {
    expect(completedHref({})).toBe("/play/completed");
    expect(completedHref({ family: "table-cards", game: null }, "2026-09-30T00:00:00.000Z")).toBe("/play/completed?family=table-cards&cursor=2026-09-30T00%3A00%3A00.000Z");
  });
});
