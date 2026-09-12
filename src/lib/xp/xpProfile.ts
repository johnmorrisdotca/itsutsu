import "server-only";

import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import type { XpAward } from "./xp.types";

/**
 * The awards for being somebody rather than an address: a name, a country, a
 * line about yourself, and the four words.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DECIDED FROM WHAT WAS WRITTEN, NOT FROM WHAT WAS ASKED FOR
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `profileAwards` takes the values as they now STAND on the row — not the patch
 * that was sent — because a patch can ask for a country and be given the empty
 * string, and "I cleared my country" must not pay for setting one. The caller
 * reads them back off the row it just wrote, which it has anyway.
 *
 * All four are once ever, keyed on nothing, so a member who fills their page in,
 * empties it and fills it again is paid once. That is the honest reading of an
 * award for having done a thing: they did it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THESE RIDE THE ROUTE AND NOT `updateProfile`
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XP_DESIGN.md` points at `updateProfile` in `src/lib/auth/members.ts`, and that
 * would be the better seam but for two facts about that file: it is four lines
 * under the 500-line gate, and the daily-visit award has already been moved out
 * of it for exactly that reason. Trimming its prose to make room is the move
 * AGENTS.md names as a gate trimmed rather than heard.
 *
 * So the caller is `PATCH /api/me`, which is the only thing that calls
 * `updateProfile`, and which holds the member row — id included — before and
 * after the write. Nothing is read that was not read already. The one thing this
 * does not cover is the OPERATOR renaming somebody from `/api/members`, and that
 * is arguably right: `nameSet` is for choosing what you are called, and a name
 * somebody else chose for you is not that.
 */

/** What a member's row says about them, as it stands after a write. */
export type ProfileAsWritten = {
  country?: string | null;
  bio?: string | null;
};

/** Whether a profile field says anything. Blank and absent are the same nothing. */
function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * What a saved profile is worth, given the row as it now reads.
 *
 * Pure, and returns an empty list when nothing was filled in — which is the
 * ordinary case, and `awardXp` answers an empty list with nothing at all rather
 * than with a query.
 */
export function profileAwards(row: ProfileAsWritten): XpAward[] {
  const awards: XpAward[] = [];
  if (filled(row.country)) awards.push({ type: XP_EVENTS.countrySet });
  if (filled(row.bio)) awards.push({ type: XP_EVENTS.bioSet });
  return awards;
}

/**
 * Pay for a profile that now says something.
 *
 * ASKED ONLY WHEN THE SAVE TOUCHED ONE OF THE TWO FIELDS. A member changing the
 * wood their board is drawn on saves their profile too — the appearance lives on
 * the same row and comes through the same route — and that must cost nothing at
 * all, not even a refused insert.
 */
export async function awardProfileXp({
  memberId,
  row,
  touched,
}: {
  memberId: string | null;
  row: ProfileAsWritten;
  /** Whether the save was about the country or the bio at all. */
  touched: boolean;
}): Promise<void> {
  if (!touched) return;
  await awardXp({ memberId, awards: profileAwards(row) });
}

/**
 * Pay for choosing a name.
 *
 * Rides the rename rather than the profile save, because the name is not part of
 * that write: it goes through `renameMember`, which has three ways to refuse and
 * carries the new name out to the rating rows. A name that was refused pays
 * nothing, which is what riding the successful return means.
 */
export async function awardNameSet(memberId: string | null): Promise<void> {
  await awardXp({ memberId, awards: [{ type: XP_EVENTS.nameSet }] });
}

/**
 * Pay for setting the four words.
 *
 * Once ever, and deliberately not once per phrase: rerolling is the same call as
 * setting — a properly hashed phrase cannot be shown again, so forgetting has to
 * be a thirty-second re-pick — and paying for each reroll would pay for
 * forgetting.
 */
export async function awardWordsSet(memberId: string | null): Promise<void> {
  await awardXp({ memberId, awards: [{ type: XP_EVENTS.wordsSet }] });
}
