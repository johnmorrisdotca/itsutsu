/** One game type's record on the site a legacy player came from. */
export type LegacyGameRecord = {
  game: string;
  won: number;
  lost: number;
  drawn: number;
};

/**
 * A record kept from somewhere else.
 *
 * "remembered" is someone who never played on Itsutsu at all — their record
 * comes from another site and would otherwise simply vanish when that site
 * does. Their slug is permanently reserved: see RESERVED_PLAYER_KEYS in
 * rating/reservedKeys.ts, and isReservedFor below.
 *
 * "elsewhere" is a live member here who also has a record from before
 * Itsutsu existed. Nothing about them is reserved — they play under their
 * own live name — this is just the earlier chapter, kept alongside it.
 */
export type LegacyKind = "remembered" | "elsewhere";

export type LegacyPlayer = {
  slug: string;
  name: string;
  kind: LegacyKind;
  /** The handle their record was kept under, if different from the display name. */
  handle?: string;
  location?: string;
  /** How the roll refers to them — "his", "her" or "their". Only set from what was actually said about them; "their" otherwise. */
  possessive?: "his" | "her" | "their";
  source: string;
  sourceUrl?: string;
  joined?: string;
  lastActive?: string;
  /** A line of context, sourced rather than invented — a fact worth keeping, not a guess at how someone felt. */
  note?: string;
  /** Won-lost-drawn across every game class the source site tracked. */
  summary: { class: string; record: LegacyGameRecord }[];
  /**
   * Per-game-type detail, as far as it was recorded. Not claimed to be
   * exhaustive — a source profile page can hold more than was ever copied
   * down, and this says so rather than passing off a partial list as complete.
   */
  detail: LegacyGameRecord[];
  detailComplete: boolean;
  /** For kind "elsewhere": the folded key of the live Itsutsu name this record belongs beside. */
  linkedKey?: string;
};
