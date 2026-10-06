import { describe, expect, it } from "vitest";

import { HOUSEKI_CAMPAIGN_LIST } from "../houseki/houseki.constants";
import { HOUSEKI_DAILY_PRICE, HOUSEKI_PRICE_LEAST, HOUSEKI_PRICE_MOST, housekiPrice, housekiPriceRows } from "./housekiLadder";
import { PUZZLE_PRICE_LEAST, PUZZLE_PRICE_MOST } from "./ladder.constants";

describe("the Houseki ladder", () => {
  it("is on the puzzle ladder's own scale: nothing under its least or over an ordinary game's most, to the nearest five", () => {
    expect(HOUSEKI_PRICE_LEAST).toBe(PUZZLE_PRICE_LEAST);
    expect(HOUSEKI_PRICE_MOST).toBe(PUZZLE_PRICE_MOST);
    for (const row of housekiPriceRows()) {
      expect(row.price, `${row.campaign} ${row.marks}`).toBeGreaterThanOrEqual(PUZZLE_PRICE_LEAST);
      expect(row.price, `${row.campaign} ${row.marks}`).toBeLessThanOrEqual(PUZZLE_PRICE_MOST);
      expect(row.price % 5, `${row.campaign} ${row.marks}`).toBe(0);
    }
  });

  it("rises with a level's marks and with its campaign, and ends at the most", () => {
    for (const campaign of HOUSEKI_CAMPAIGN_LIST) {
      const prices = [1, 2, 3, 4, 5].map((marks) => housekiPrice(campaign, marks));
      expect([...prices].sort((a, b) => a - b), campaign).toEqual(prices);
      expect(new Set(prices).size, campaign).toBe(5);
    }
    expect(housekiPrice("shizen", 3)).toBeGreaterThan(housekiPrice("classic", 3));
    expect(housekiPrice("arashi", 3)).toBeGreaterThan(housekiPrice("shizen", 3));
    expect(housekiPrice("arashi", 5)).toBe(HOUSEKI_PRICE_MOST);
    expect(housekiPrice("classic", 1)).toBe(HOUSEKI_PRICE_LEAST);
  });

  it("prices a Daily flat, and has a row for every price the SQL joins to", () => {
    expect(housekiPrice("daily", 0)).toBe(HOUSEKI_DAILY_PRICE);
    expect(housekiPriceRows()).toHaveLength(1 + HOUSEKI_CAMPAIGN_LIST.length * 5);
    expect(housekiPriceRows().find((row) => row.campaign === "daily")?.marks).toBe(0);
  });
});
