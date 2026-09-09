import { describe, expect, it } from "vitest";

import { figuresForClass, figuresForPlayer, figuresForSource } from "./keptFigures";
import { LEGACY_PLAYERS } from "./legacyPlayers.data";

describe("the figures behind every kept record on the site", () => {
  it("has a site total that is the sum of that site's classes", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const source of player.sources) {
        const byHand = source.summary.reduce(
          (sum, row) => sum + row.record.won + row.record.lost + row.record.drawn,
          0,
        );
        expect(figuresForSource(source).played, `${player.slug} on ${source.site}`).toBe(byHand);
      }
    }
  });

  it("has a person's total that is the sum of their sites", () => {
    for (const player of LEGACY_PLAYERS) {
      const bySite = player.sources.reduce((sum, source) => sum + figuresForSource(source).played, 0);
      expect(figuresForPlayer(player.sources).played, player.slug).toBe(bySite);
    }
  });

  it("works out a rate for every one of them, and never one outside nought to one", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const source of player.sources) {
        const rate = figuresForSource(source).winRate;
        expect(rate, `${player.slug} on ${source.site}`).not.toBeNull();
        expect(rate ?? -1, `${player.slug} on ${source.site}`).toBeGreaterThanOrEqual(0);
        expect(rate ?? 2, `${player.slug} on ${source.site}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never claims a class holds more games than it recorded", () => {
    // A breakdown may be incomplete — detailComplete says so — but it can
    // never add up to more than the class total it sits under.
    for (const player of LEGACY_PLAYERS) {
      for (const source of player.sources) {
        for (const row of source.summary) {
          const detail = (row.detail ?? []).reduce((sum, g) => sum + g.won + g.lost + g.drawn, 0);
          expect(detail, `${player.slug} · ${source.site} · ${row.class}`).toBeLessThanOrEqual(
            figuresForClass(row).played,
          );
        }
      }
    }
  });
});
