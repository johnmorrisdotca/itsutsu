import { HOUSEKI_KIND_LIST } from "../houseki/houseki.constants";
import type { HousekiCampaign } from "../houseki/houseki.types";

/**
 * THE HOUSEKI LADDER: what one won level, or one Daily, is worth in IP.
 *
 * Priced on the puzzle ladder's own scale (PTS-05: 50 for the easiest, 150 the
 * most for an ordinary game), and by the one thing a level says of itself, its
 * marks, 1 to 5, which the package measured and ordered its levels by. The
 * marks name a rung: 50, 70, 90, 110 and 130; the Shizen campaign adds 10 and
 * the Arashi one 20, because each asks more of a player who knows the game, so
 * the dearest level, a five-mark Arashi, is exactly the 150 an ordinary game's
 * ceiling allows. A Daily is a flat 60: it is the same game for everybody for a
 * day, with no marks, and counts once a day.
 *
 * Nothing is stored. A won level's row says its campaign and marks
 * (`HousekiWin`), and what it is worth is read here when a board is drawn
 * (`housekiLadderSql.ts`), so a change to a price reprices every win ever kept,
 * as PTS-05 does for the puzzles. A lesson and a free game pay nothing, and
 * have no row. A level counts once however often it is won.
 */
export const HOUSEKI_RUNGS: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = { 1: 50, 2: 70, 3: 90, 4: 110, 5: 130 };

/** What a campaign adds to the rung. */
export const HOUSEKI_CAMPAIGN_ADD: Readonly<Record<HousekiCampaign, number>> = { classic: 0, shizen: 10, arashi: 20 };

/** What a finished Daily is worth. */
export const HOUSEKI_DAILY_PRICE = 60;

/** The most a Houseki win may be worth: an ordinary game's ceiling (`PUZZLE_PRICE_MOST`), never a level family's. */
export const HOUSEKI_PRICE_MOST = 150;

/** The least. */
export const HOUSEKI_PRICE_LEAST = 50;

/** The campaigns a row can name: the three, and the Daily. */
export type HousekiPriced = HousekiCampaign | "daily";

/** What a win of this campaign's level of these marks, or of a Daily, is worth. */
export function housekiPrice(campaign: HousekiPriced, marks: number): number {
  if (campaign === "daily") return HOUSEKI_DAILY_PRICE;
  const rung = HOUSEKI_RUNGS[Math.min(5, Math.max(1, Math.round(marks))) as 1 | 2 | 3 | 4 | 5];
  return Math.min(HOUSEKI_PRICE_MOST, rung + HOUSEKI_CAMPAIGN_ADD[campaign]);
}

/** Every price the ladder has, as (campaign, marks, price) rows: what the SQL joins a win to. */
export function housekiPriceRows(): { campaign: HousekiPriced; marks: number; price: number }[] {
  const rows: { campaign: HousekiPriced; marks: number; price: number }[] = [{ campaign: "daily", marks: 0, price: HOUSEKI_DAILY_PRICE }];
  for (const campaign of ["classic", "shizen", "arashi"] as const) for (const marks of [1, 2, 3, 4, 5]) rows.push({ campaign, marks, price: housekiPrice(campaign, marks) });
  return rows;
}

/** Every Houseki game, for the boards that count them all. */
export { HOUSEKI_KIND_LIST };
