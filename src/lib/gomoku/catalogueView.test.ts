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
    expect(readCatalogueView(undefined)).toBe(CATALOGUE_VIEW_DEFAULT);
    expect(CATALOGUE_VIEW_DEFAULT).toBe(CATALOGUE_VIEWS.families);
  });

  it("reads each view by name", () => {
    for (const view of CATALOGUE_VIEW_LIST) {
      if (view !== CATALOGUE_VIEW_DEFAULT) expect(readCatalogueView(view)).toBe(view);
    }
  });

  it("the plain list is a view of /games, at the address the move promised", () => {
    // /games/all was a second page; it is one collection seen another way.
    expect(cataloguePath(CATALOGUE_VIEWS.list)).toBe("/games/list");
    expect(readCatalogueView("list")).toBe(CATALOGUE_VIEWS.list);
  });

  it("the default view leaves the query alone, so /games stays /games", () => {
    expect(cataloguePath(CATALOGUE_VIEW_DEFAULT)).toBe("/games");
  });

  it("a view this page does not have is not found, and the old ?view= query is ignored", () => {
    // Tabs are paths now (John, 2026-09-26: "No backwards compatibility needed").
    expect(readCatalogueView("gallery")).toBeNull();
    expect(readCatalogueView(CATALOGUE_VIEW_DEFAULT)).toBeNull();
    expect(readCatalogueView(undefined)).toBe(CATALOGUE_VIEW_DEFAULT);
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
