/** One finished game, as a source site's own per-opponent log listed it — no moves, just who and when. */
export type LegacyGameLogEntry = {
  date: string;
  opponent: string;
  result: "won" | "lost" | "drawn";
};

/** One game type's record on the site a legacy player came from. */
export type LegacyGameRecord = {
  game: string;
  won: number;
  lost: number;
  drawn: number;
  /** The individual games behind this row, where the source site listed them one by one. Sums to won+lost+drawn when given in full. */
  log?: LegacyGameLogEntry[];
};

/** A remark left on something a legacy player posted at the source — kept as found, never paraphrased. */
export type LegacyComment = {
  text: string;
  by: string;
  at: string;
};

/** One class of games (Regular, Tournament, Ladder — whatever the source site called it), with its own by-game breakdown. */
export type LegacyClassRecord = {
  class: string;
  record: LegacyGameRecord;
  /**
   * Per-game-type detail for this class, as far as it was recorded. Not
   * claimed to be exhaustive unless detailComplete says so — a source
   * profile page can hold more than was ever copied down.
   */
  detail?: LegacyGameRecord[];
  detailComplete?: boolean;
};

/**
 * A record kept from somewhere else.
 *
 * "remembered" is someone who has died and never played on Itsutsu — their
 * record comes from another site and would otherwise simply vanish when that
 * site does.
 *
 * "honorary" is someone alive who also never played here — not a member, no
 * account, but their record is kept in its own right rather than folded into
 * a memorial it doesn't belong in. Should they ever join for real, this is
 * the kind that becomes "elsewhere".
 *
 * "elsewhere" is a live member here who also has a record from before
 * Itsutsu existed. Nothing about them is reserved — they play under their
 * own live name — this is just the earlier chapter, kept alongside it.
 *
 * "remembered" and "honorary" slugs are both permanently reserved, since
 * neither belongs to a live account here: see RESERVED_PLAYER_KEYS in
 * rating/reservedKeys.ts.
 */
export type LegacyKind = "remembered" | "honorary" | "elsewhere";

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
  /** The source site's own player id, for linking back precisely — not guessed at when a site never showed it. */
  sourceId?: string;
  joined?: string;
  lastActive?: string;
  /** The days a week they set aside from the site, as their own profile stated it — a fact about a life, not a game setting. */
  daysOff?: string;
  /** A line of context, sourced rather than invented — a fact worth keeping, not a guess at how someone felt. */
  note?: string;
  /** Remarks left on something this person posted at the source, kept as found. */
  comments?: LegacyComment[];
  /** Every class of game the source site tracked, each with its own totals and, where recorded, its own by-game table. */
  summary: LegacyClassRecord[];
  /** For kind "elsewhere": the folded key of the live Itsutsu name this record belongs beside. */
  linkedKey?: string;
  /** Slugs of this same person's other kept records, from other sites. */
  relatedSlugs?: string[];
  /** Every game kept against one specific other legacy player, results as this person's own side of it. */
  headToHead?: { opponent: string; games: { game: string; date: string; result: "won" | "lost" | "drawn" }[] }[];
};

/** A single game kept in full — moves proven legal by replay, not just a result. */
export type LegacyGame = {
  id: string;
  variant: string;
  size: number;
  /** As recorded at the source; shown verbatim, not parsed as a precise instant. */
  playedAt: string;
  source: string;
  /** Slugs into LEGACY_PLAYERS, or a live player's own key once one side is a live account. */
  black: string;
  white: string;
  winner: "black" | "white" | null;
  /** Alternating black, white, black... from the first move. */
  moves: { row: number; col: number }[];
};
