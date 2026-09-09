import { describe, expect, it } from "vitest";

import { wholeRecord } from "./wholeRecord";
import { findLegacyPlayer } from "./legacyPlayers.data";
import type { LegacyPlayer } from "./legacyPlayers.types";

/**
 * Everything somebody has played, added up honestly.
 *
 * The arithmetic is the whole point of the rule: games and wins add across
 * sites, and ratings do not. GoldToken's own averaged about 1689 on a scale
 * that is not this site's Elo and was never converted to it, so a combined
 * rating would be a number describing nothing. This type does not produce
 * one, and that is tested rather than left to whoever writes the page.
 */

const nothingHere = { won: 0, lost: 0, drawn: 0 };

function chibi(): LegacyPlayer {
  const found = findLegacyPlayer("chibi");
  if (found === null) throw new Error("chibi is missing from the kept records");
  return found;
}

describe("wholeRecord", () => {
  it("adds the sites together, and this one with them", () => {
    const whole = wholeRecord([chibi()], { won: 6, lost: 3, drawn: 1 });
    const kept = whole.sources.filter((source) => source.site !== "Itsutsu");

    const sum = kept.reduce((total, source) => total + source.figures.played, 0);
    expect(whole.figures.played, "the total is the sum of its parts").toBe(sum + 10);
    expect(whole.figures.won).toBe(kept.reduce((n, s) => n + s.figures.won, 0) + 6);
  });

  it("counts a draw as half a game, as the ratings do", () => {
    // Two wins, two losses and two draws is exactly half of six games.
    const whole = wholeRecord([], { won: 2, lost: 2, drawn: 2 });
    expect(whole.figures.played).toBe(6);
    expect(whole.figures.winRate).toBeCloseTo(0.5, 10);
  });

  it("produces no combined rating at all", () => {
    /*
     * The rule this module exists for. Two ratings from two scales cannot be
     * added or averaged into anything that means something, so there must be
     * nothing here to print by accident.
     */
    const whole = wholeRecord([chibi()], { won: 1, lost: 0, drawn: 0 });
    expect(whole.figures).not.toHaveProperty("rating");
    expect(JSON.stringify(whole)).not.toContain("rating");
  });

  it("says when any of it was copied down rather than counted", () => {
    // The part not to soften: a kept record is a snapshot, not a sync.
    expect(wholeRecord([chibi()], nothingHere).kept).toBe(true);
    expect(wholeRecord([], { won: 3, lost: 1, drawn: 0 }).kept).toBe(false);
  });

  it("leaves out a site somebody never played on", () => {
    // A row of zeroes would read as a chapter they do not have.
    const empty: LegacyPlayer = {
      slug: "nobody",
      name: "Nobody",
      kind: "honorary",
      sources: [
        { site: "Empty.com", summary: [{ class: "Regular", record: { game: "x", won: 0, lost: 0, drawn: 0 } }] },
      ],
    };
    expect(wholeRecord([empty], nothingHere).sources).toHaveLength(0);
    expect(wholeRecord([empty], nothingHere).figures.played).toBe(0);
  });

  it("carries a link only where one was written down", () => {
    /*
     * A link to the wrong profile is worse than no link, so an address is
     * never guessed from a site name and a handle.
     */
    const whole = wholeRecord([chibi()], nothingHere);
    for (const source of whole.sources) {
      if (source.url === null) continue;
      expect(source.url, source.site).toMatch(/^https?:\/\//);
    }
    // And at least one of Chibi's does have one, or this proves nothing.
    expect(whole.sources.some((source) => source.url !== null)).toBe(true);
  });

  it("adds nothing to nothing without inventing a rate", () => {
    const whole = wholeRecord([], nothingHere);
    expect(whole.figures.played).toBe(0);
    expect(whole.figures.winRate, "a rate over no games is not zero").toBeNull();
    expect(whole.kept).toBe(false);
  });
});
