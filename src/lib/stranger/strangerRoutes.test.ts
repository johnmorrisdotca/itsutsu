import { describe, expect, it } from "vitest";

import { wouldBeOpen } from "@/proxy";

import { STRANGER_PREFIX, sitePathOf } from "./strangerPath";
import { strangerRouteFor } from "./strangerRoutes";

describe("which open pages a stranger is answered from a kept copy", () => {
  it("keeps the pages the ticket names, each at its own address under the prefix", () => {
    expect(strangerRouteFor("/")).toEqual({ path: STRANGER_PREFIX, readsQuery: false });
    expect(strangerRouteFor("/join")).toEqual({ path: "/stranger/join", readsQuery: true });
    expect(strangerRouteFor("/games")).toEqual({ path: "/stranger/games", readsQuery: true });
    for (const path of ["/about", "/learn", "/privacy", "/terms", "/thanks", "/dice", "/games/gomoku", "/games/gomoku/rules", "/games/gomoku/background", "/games/gomoku/family"]) {
      expect(strangerRouteFor(path), path).toEqual({ path: `${STRANGER_PREFIX}${path}`, readsQuery: false });
    }
  });

  it("keeps a tab of a page, and a guide, when the page has one by that name", () => {
    expect(strangerRouteFor("/about/play")?.path).toBe("/stranger/about/play");
    expect(strangerRouteFor("/learn/cube")?.path).toBe("/stranger/learn/cube");
    expect(strangerRouteFor("/games/cards")?.readsQuery).toBe(true);
    expect(strangerRouteFor("/games/list")?.readsQuery).toBe(true);
  });

  it("keeps nothing that is not a page, so a crawler walking made-up addresses cannot grow the store", () => {
    for (const path of ["/games/not-a-game", "/games/not-a-game/rules", "/about/not-a-chapter", "/about/story", "/learn/not-a-guide", "/games/gomoku/not-a-facet", "/games/gomoku/rules/extra", "/nowhere"]) {
      expect(strangerRouteFor(path), path).toBeNull();
    }
  });

  it("leaves every page a stranger may not read, and the parts of an open game that are playing, to the live route", () => {
    for (const path of ["/players", "/history", "/me", "/admin", "/games/gomoku/play", "/games/gomoku/new", "/games/gomoku/daily", "/games/gomoku/standings", "/games/new", "/join/x", "/api/games", "/stranger"]) {
      expect(strangerRouteFor(path), path).toBeNull();
    }
  });

  /*
   * THE RULE THIS WHOLE FEATURE LIVES UNDER: a kept copy is only ever made of a
   * page the gate has already opened. The rewrite runs after the gate's yes
   * and decides nothing, so a path answered here that the gate would shut would
   * be a hole made by naming a page in two places.
   */
  it("answers only addresses the gate lets a stranger through to", () => {
    const addresses = [
      "/", "/join", "/about", "/about/play", "/learn", "/learn/cube", "/games", "/games/cards", "/games/list", "/privacy", "/terms", "/thanks", "/dice",
      "/games/gomoku", "/games/gomoku/rules", "/games/gomoku/family", "/games/gomoku/background", "/games/karakuri", "/games/houseki",
    ];
    for (const path of addresses) {
      expect(strangerRouteFor(path), `${path} is meant to be kept`).not.toBeNull();
      expect(wouldBeOpen(path), `${path} is kept for strangers but the gate does not open it`).toBe(true);
    }
  });
});

describe("the address a reader sees, from the route that drew the page", () => {
  it("takes the prefix off, so the server's pathname and the browser's agree", () => {
    expect(sitePathOf("/stranger")).toBe("/");
    expect(sitePathOf("/stranger/games/gomoku")).toBe("/games/gomoku");
    expect(sitePathOf("/games/gomoku")).toBe("/games/gomoku");
    expect(sitePathOf("/")).toBe("/");
    // A page whose own name merely starts the same way is not under the prefix.
    expect(sitePathOf("/strangers")).toBe("/strangers");
  });
});
