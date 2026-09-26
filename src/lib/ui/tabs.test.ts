import { describe, expect, it } from "vitest";

import { openTabOf, siteKey, tabHref, TAB_FROM_PATH, withTabFromPath } from "./tabs";

const TABS = [
  { key: "itsutsu", label: "Itsutsu" },
  { key: "itsyourturn", label: "ItsYourTurn.com" },
  { key: "goldtoken", label: "GoldToken.com" },
  { key: "champions", label: "Champions", href: "/champions" },
];

describe("which tab is open", () => {
  it("is the one the path names", () => {
    expect(openTabOf(TABS, { [TAB_FROM_PATH]: "goldtoken" })).toBe("goldtoken");
  });

  it("is the first one when the path names none", () => {
    expect(openTabOf(TABS, {})).toBe("itsutsu");
  });

  it("is nobody's when the path names a tab this page does not have, which the page answers not found", () => {
    expect(openTabOf(TABS, { [TAB_FROM_PATH]: "myspace" })).toBeNull();
  });

  it("is nobody's for the first tab by name, since the bare page is its one address", () => {
    expect(openTabOf(TABS, { [TAB_FROM_PATH]: "itsutsu" })).toBeNull();
  });

  it("is nobody's for a tab that is a page elsewhere", () => {
    expect(openTabOf(TABS, { [TAB_FROM_PATH]: "champions" })).toBeNull();
  });

  it("ignores the old ?view= query entirely", () => {
    expect(openTabOf(TABS, { view: "goldtoken" })).toBe("itsutsu");
  });

  it("is nothing at all when there are no tabs", () => {
    expect(openTabOf([], { [TAB_FROM_PATH]: "goldtoken" })).toBe("");
  });

  it("is handed to the page by a path, beside whatever the query asked", async () => {
    expect(await withTabFromPath("goldtoken", Promise.resolve({ scope: "here" }))).toEqual({ scope: "here", [TAB_FROM_PATH]: "goldtoken" });
  });
});

describe("a tab's address", () => {
  it("leaves the first tab as the plain page", () => {
    expect(tabHref("/players/jmorris", TABS, "itsutsu")).toBe("/players/jmorris");
  });

  it("names any other tab as a segment of the path", () => {
    expect(tabHref("/players/jmorris", TABS, "goldtoken")).toBe("/players/jmorris/goldtoken");
  });

  it("is a tab's own page where it has one", () => {
    expect(tabHref("/players", TABS, "champions")).toBe("/champions");
  });

  it("is the plain page when there are no tabs", () => {
    expect(tabHref("/admin", [], "anything")).toBe("/admin");
  });
});

describe("a source site's key", () => {
  it("drops the domain and folds what is left", () => {
    expect(siteKey("ItsYourTurn.com")).toBe("itsyourturn");
    expect(siteKey("GoldToken.com")).toBe("goldtoken");
  });

  it("keeps a site whose name is more than one word readable", () => {
    expect(siteKey("Board Game Arena")).toBe("board-game-arena");
  });

  it("leaves no hyphen hanging off either end", () => {
    expect(siteKey("!Games!")).toBe("games");
  });
});
