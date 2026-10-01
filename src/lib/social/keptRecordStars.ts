import "server-only";

import type { Reader } from "@/lib/auth/reader.types";
import { findMembersByNames } from "@/lib/auth/members";
import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { playerKey } from "@/lib/rating/playerKey";

import { buddyMemberIds } from "./buddies";

/** A kept record's member row, and whether the reader already keeps it as a buddy. */
export type KeptRecordStar = { memberId: string; isBuddy: boolean };

/**
 * THE STAR BESIDE EACH NAME ON THE HONORS ROLL, keyed by the record's slug.
 *
 * John, 2026-10-01, on that roll: "have no way to add some members... ALL
 * members should be addable." Chibi and Kyokosan are member rows marked as kept
 * records, and the buddy list took only people, so neither could be kept. A
 * reader with no account is offered nothing, as everywhere a star is offered.
 * Two reads for the whole roll: the rows by name, and the reader's list.
 */
export async function keptRecordStars(reader: Pick<Reader, "hasAccount" | "memberId">): Promise<Map<string, KeptRecordStar>> {
  const stars = new Map<string, KeptRecordStar>();
  if (!reader.hasAccount || reader.memberId === null) return stars;
  const kept = LEGACY_PLAYERS.filter((legacy) => legacy.kind !== "elsewhere");
  const [rows, buddies] = await Promise.all([
    findMembersByNames(kept.map((legacy) => legacy.name)),
    buddyMemberIds(reader.memberId),
  ]);
  for (const legacy of kept) {
    const id = rows.get(playerKey(legacy.name))?.id;
    if (id !== undefined) stars.set(legacy.slug, { memberId: id, isBuddy: buddies.has(id) });
  }
  return stars;
}
