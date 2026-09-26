import type { MemberKind } from "@/lib/auth/memberKind";

/**
 * What a name is drawn with beside it (`PlayerName`): the flag, the kind
 * badge and the level. John, 2026-09-26: "Inconsistent Player Names: Buddies
 * has totally different name formatting… Ladder also is weird since it doesn't
 * have Flag." One set of marks, read for a whole page at once (`nameTagsOf`).
 *
 * `level` is null where the table already has a Level column or draws the
 * level itself (`RecordTable`), so it is never said twice on one row — see
 * `withoutLevel`.
 */
export type NameTag = { country: string | null; kind: MemberKind; level: number | null };

/** The same marks less the level, for a row whose table says the level in a place of its own. */
export function withoutLevel(tag: NameTag | undefined): NameTag | undefined {
  return tag === undefined ? undefined : { ...tag, level: null };
}
