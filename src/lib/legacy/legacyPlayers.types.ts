/** One game type's record on the site a legacy player came from. */
export type LegacyGameRecord = {
  game: string;
  won: number;
  lost: number;
  drawn: number;
};

/**
 * A player who is remembered here but never played on Itsutsu — their record
 * comes from another site, kept because it would otherwise simply vanish
 * when that site does. Reserved so the name can never be taken by a live
 * account; see RESERVED_PLAYER_KEYS in rating/reservedKeys.ts.
 */
export type LegacyPlayer = {
  slug: string;
  name: string;
  /** The handle their record was kept under, if different from the display name. */
  handle?: string;
  location?: string;
  /** How the roll refers to them — "his", "her" or "their". Only set from what was actually said about them; "their" otherwise. */
  possessive?: "his" | "her" | "their";
  source: string;
  sourceUrl?: string;
  joined?: string;
  lastActive?: string;
  /** A line in someone's own words, shown above the record. Never invented on their behalf. */
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
};
