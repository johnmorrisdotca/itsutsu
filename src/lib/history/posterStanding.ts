import { ownedRow } from "@/lib/rating/ownedRow";
import { playerKey } from "@/lib/rating/playerKey";
import type { PlayerProfile } from "@/lib/rating/players";
import { ratingShown } from "@/lib/rating/shownRecord";
import { levelShown, xpShown } from "@/lib/xp/levelShown";

import type { PosterRatingRow, PosterRef, PosterStanding } from "./posterStanding.types";

/**
 * WHO IS WAITING, AND HOW STRONG THEY ARE.
 *
 * The waiting room lists every seat somebody has posted, and a reader choosing
 * one wants the poster's strength before they sit down — the same rating and XP
 * level every other table of players on the site shows. This is the pure half:
 * which rating row is the poster's, and what it prints. `posterStandingRead.ts`
 * reads the rows for a whole board in one query each.
 *
 * **The rating is `ratingShown`'s, pool and tier together.** The ladder of
 * people first; a computer-pool rating only where nothing settled stands among
 * the people, and then marked — an unlabelled 1639 beside a name reads as a
 * place on the ladder. The tier travels with the number, so "1639, unrated"
 * cannot be printed from two pools.
 *
 * **By member first, by name after**, the order `fetchPlayer` settled for the
 * same reason: a rating row is keyed by the name it was earned under and does
 * not move on a rename, so a lookup by today's name finds nothing for somebody
 * who renamed. The rating filter reads the same answer — before, it asked by
 * name alone, so a renamed poster could be shown one rating and filtered by none.
 */

/** A key for a poster in a map, by member where there is one and by folded name where there is not. */
export function posterKeyOf(poster: PosterRef): string {
  return poster.memberId !== null ? `member:${poster.memberId}` : `name:${playerKey(poster.name)}`;
}

/**
 * The poster's own rating row among those read for a board, or null.
 *
 * A member's rows are the ones carrying their id, and `ownedRow` chooses among
 * them the way every other page does. A poster with no member behind them has
 * only the name they typed, and the row under that folded name.
 */
export function posterRow<T extends PosterRatingRow>(poster: PosterRef, rows: readonly T[]): T | null {
  if (poster.memberId !== null) {
    const owned = ownedRow(rows.filter((row) => row.memberId === poster.memberId), poster.name);
    if (owned !== null) return owned;
  }
  const key = playerKey(poster.name);
  if (key === "") return null;
  return rows.find((row) => row.key === key) ?? null;
}

/** What a poster's line shows, from their profile and their member row. */
export function standingOf({
  profile,
  member,
}: {
  profile: PlayerProfile | null;
  /** Their member row's total and country, or null for a poster with no account. */
  member: { xp: number; country: string } | null;
}): PosterStanding {
  return {
    rating: ratingShown(profile),
    level: member === null ? null : levelShown({ xp: member.xp }),
    xp: member === null ? null : xpShown({ xp: member.xp }),
    country: member === null || member.country === "" ? null : member.country,
  };
}
