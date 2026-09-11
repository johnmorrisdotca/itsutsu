import { describe, expect, it } from "vitest";

import {
  CATALOGUE_VIEWS,
  CATALOGUE_VIEW_DEFAULT,
  CATALOGUE_VIEW_DISPLAY,
  CATALOGUE_VIEW_LIST,
  cataloguePath,
  readCatalogueView,
} from "./catalogueView";

describe("how the catalogue is laid out is a filter, not an address", () => {
  it("an address that says nothing gets the view that teaches", () => {
    expect(readCatalogueView({})).toBe(CATALOGUE_VIEW_DEFAULT);
    expect(CATALOGUE_VIEW_DEFAULT).toBe(CATALOGUE_VIEWS.families);
  });

  it("reads each view by name", () => {
    for (const view of CATALOGUE_VIEW_LIST) {
      expect(readCatalogueView({ view })).toBe(view);
    }
  });

  it("the plain list is a view of /games, at the address the move promised", () => {
    // /games/all was a second page; it is one collection seen another way.
    expect(cataloguePath(CATALOGUE_VIEWS.list)).toBe("/games?view=list");
    expect(readCatalogueView({ view: "list" })).toBe(CATALOGUE_VIEWS.list);
  });

  it("the default view leaves the query alone, so /games stays /games", () => {
    expect(cataloguePath(CATALOGUE_VIEW_DEFAULT)).toBe("/games");
  });

  it("a word nobody recognises still shows the games", () => {
    // A mistyped query is a reader who wants the catalogue, not an error page.
    expect(readCatalogueView({ view: "gallery" })).toBe(CATALOGUE_VIEW_DEFAULT);
    expect(readCatalogueView({ view: ["list", "cards"] })).toBe(CATALOGUE_VIEW_DEFAULT);
  });

  it("every view can be named on a switch", () => {
    for (const view of CATALOGUE_VIEW_LIST) {
      const copy = CATALOGUE_VIEW_DISPLAY[view];
      expect(copy.label.length, `${view} needs a label`).toBeGreaterThan(0);
      expect(copy.kanji.length, `${view} needs a kanji name`).toBeGreaterThan(0);
      expect(copy.blurb.length, `${view} needs a line saying what it is`).toBeGreaterThan(10);
    }
  });
});
