import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PROVISIONAL_BELOW, RATING_START, UNRATED_BELOW } from "@/lib/rating/elo";

import { XP_EVENTS, XP_EVENT_SPECS } from "./xp.constants";
import {
  XP_HIGH_RANK,
  XP_UPSET_BANDS,
  upsetAwardFor,
  upsetBonusFor,
  type RatingAsItStood,
} from "./xpUpset";

/**
 * John's rule — beating somebody better than you pays more, and nothing ever
 * takes XP away — asserted as the table of cases it is.
 *
 * The cases that matter most are the ZEROS. A bonus that paid over a newcomer
 * would be the way to farm the ladder, and a bonus that paid off a missing
 * rating would pay an upset over every stranger; both look like generosity and
 * neither would ever be reported.
 */

const ESTABLISHED = PROVISIONAL_BELOW;
const PROVISIONAL = UNRATED_BELOW;
const UNRATED = UNRATED_BELOW - 1;

const at = (rating: number, ratedGames = ESTABLISHED): RatingAsItStood => ({ rating, ratedGames });

describe("an equal or weaker opponent", () => {
  it("adds nothing, so the win pays exactly what a win always paid", () => {
    for (let gap = -600; gap < 100; gap += 25) {
      expect(upsetBonusFor({ mine: at(1600), theirs: at(1600 + gap) }), `gap ${gap}`).toBe(0);
    }
  });
});

describe("a stronger, established opponent", () => {
  it("pays the band the gap reaches, and the gap is measured from the winner", () => {
    expect(upsetAwardFor({ mine: at(1500), theirs: at(1600) })).toBe(XP_EVENTS.upsetWin);
    expect(upsetAwardFor({ mine: at(1500), theirs: at(1699) })).toBe(XP_EVENTS.upsetWin);
    expect(upsetAwardFor({ mine: at(1500), theirs: at(1700) })).toBe(XP_EVENTS.bigUpsetWin);
    expect(upsetAwardFor({ mine: at(1500), theirs: at(1800) })).toBe(XP_EVENTS.giantKilled);
  });

  it("keeps the top band for an opponent of high rank, not merely a wide gap", () => {
    // Two people still finding their feet: a real upset, and not a giant.
    expect(upsetAwardFor({ mine: at(1100), theirs: at(1500) })).toBe(XP_EVENTS.bigUpsetWin);
    expect(upsetAwardFor({ mine: at(1400), theirs: at(XP_HIGH_RANK - 1) })).toBe(XP_EVENTS.bigUpsetWin);
    expect(upsetAwardFor({ mine: at(1400), theirs: at(XP_HIGH_RANK) })).toBe(XP_EVENTS.giantKilled);
    expect(XP_HIGH_RANK).toBeGreaterThan(RATING_START);
  });

  it("pays a provisional winner, whose rating has at least moved", () => {
    expect(upsetAwardFor({ mine: at(1500, PROVISIONAL), theirs: at(1650) })).toBe(XP_EVENTS.upsetWin);
  });
});

describe("a gap that is not a measurement", () => {
  it("pays nothing over a provisional or unrated opponent, however far above they sit", () => {
    // The farming guard. A newcomer sits at 1600 whatever their strength, so
    // "beat somebody rated above you" over one is "beat somebody new".
    expect(upsetBonusFor({ mine: at(1000), theirs: at(1900, ESTABLISHED - 1) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1000), theirs: at(1900, PROVISIONAL) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1000), theirs: at(1900, UNRATED) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1000), theirs: at(1900, 0) })).toBe(0);
  });

  it("pays nothing to an unrated winner, whose 1600 nobody earned", () => {
    expect(upsetBonusFor({ mine: at(RATING_START, UNRATED), theirs: at(2000) })).toBe(0);
    expect(upsetBonusFor({ mine: at(RATING_START, 0), theirs: at(2000) })).toBe(0);
  });

  it("pays nothing where either rating could not be read, rather than guessing 1600", () => {
    expect(upsetBonusFor(null)).toBe(0);
    expect(upsetBonusFor({ mine: null, theirs: at(2000) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1400), theirs: null })).toBe(0);
    expect(upsetBonusFor({ mine: at(Number.NaN), theirs: at(2000) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1400), theirs: at(Number.POSITIVE_INFINITY) })).toBe(0);
    expect(upsetBonusFor({ mine: at(1400, -1), theirs: at(2000) })).toBe(0);
  });
});

describe("the cap", () => {
  it("never pays more than the top band, and never less than nothing, anywhere on the board", () => {
    const top = XP_EVENT_SPECS[XP_EVENTS.giantKilled].points;
    let highest = 0;
    for (let mine = 600; mine <= 2800; mine += 50) {
      for (let theirs = 600; theirs <= 2800; theirs += 50) {
        for (const games of [0, UNRATED, PROVISIONAL, ESTABLISHED, 500]) {
          const bonus = upsetBonusFor({ mine: at(mine, games), theirs: at(theirs, games) });
          expect(bonus).toBeGreaterThanOrEqual(0);
          expect(bonus).toBeLessThanOrEqual(top);
          highest = Math.max(highest, bonus);
        }
      }
    }
    // And the ceiling is actually reachable, so it is a cap and not a fiction.
    expect(highest).toBe(top);
  });

  it("prices a bigger upset higher, rides the day's allowance, and caps each band", () => {
    const prices = XP_UPSET_BANDS.map((band) => XP_EVENT_SPECS[band.type].points);
    expect([...prices].sort((a, b) => b - a)).toEqual(prices);
    for (const band of XP_UPSET_BANDS) {
      expect(XP_EVENT_SPECS[band.type].ridesAllowance, band.type).toBe(true);
      expect(XP_EVENT_SPECS[band.type].cap, band.type).toBeGreaterThan(0);
    }
    const gaps = XP_UPSET_BANDS.map((band) => band.gap);
    expect([...gaps].sort((a, b) => b - a)).toEqual(gaps);
  });
});

describe("the ratings are the ones the players carried INTO the game", () => {
  /*
   * Read in `xpGameServer.ts`, which rides `recordPlayed`. That is true to the
   * word "as they stood" only because every ending calls `recordPlayed` BEFORE
   * `recordResult` exchanges the ratings. If an ending ever flips the two, the
   * bonus would be read off ratings that already include the upset it pays for,
   * and nothing else would notice — so the order is pinned in the source here.
   */
  it.each(["liveGame.ts", "liveGameEndings.ts"])("%s records the game before it rates it", (file) => {
    const source = readFileSync(join(process.cwd(), "src/lib/history", file), "utf8");
    const marks = [
      ...[...source.matchAll(/await recordPlayed\(/g)].map((hit) => ({ at: hit.index ?? 0, what: "played" })),
      ...[...source.matchAll(/await recordResult\(/g)].map((hit) => ({ at: hit.index ?? 0, what: "rated" })),
    ].sort((one, two) => one.at - two.at);

    expect(marks.length, "an ending that records a game").toBeGreaterThan(0);
    // Played, rated, played, rated … and never a rating first.
    marks.forEach((mark, index) => expect(mark.what, `call ${index}`).toBe(index % 2 === 0 ? "played" : "rated"));
  });
});
