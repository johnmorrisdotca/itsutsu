import { describe, expect, it } from "vitest";

import { activeTab, siteKey, tabHref, TAB_PARAM } from "./tabs";

const TABS = [
  { key: "itsutsu", label: "Itsutsu" },
  { key: "itsyourturn", label: "ItsYourTurn.com" },
  { key: "goldtoken", label: "GoldToken.com" },
];

describe("which tab is open", () => {
  it("is the one the address asks for", () => {
    expect(activeTab(TABS, "goldtoken")).toBe("goldtoken");
  });

  it("is the first one when the address says nothing", () => {
    expect(activeTab(TABS, undefined)).toBe("itsutsu");
  });

  it("is the first one when the address asks for something that is not there", () => {
    // A tab that has been renamed, or an address somebody typed. Landing on
    // the person is better than landing on an empty page.
    expect(activeTab(TABS, "myspace")).toBe("itsutsu");
  });

  it("takes the first value when a key is repeated in the query", () => {
    expect(activeTab(TABS, ["goldtoken", "itsyourturn"])).toBe("goldtoken");
  });

  it("is nothing at all when there are no tabs", () => {
    expect(activeTab([], "goldtoken")).toBe("");
  });
});

describe("a tab's address", () => {
  it("leaves the first tab as the plain page", () => {
    expect(tabHref("/players/jmorris", TABS, "itsutsu")).toBe("/players/jmorris");
  });

  it("names any other tab in the query", () => {
    expect(tabHref("/players/jmorris", TABS, "goldtoken")).toBe(`/players/jmorris?${TAB_PARAM}=goldtoken`);
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
