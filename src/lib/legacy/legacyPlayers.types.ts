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

/**
 * One person's record at one site.
 *
 * A person is one person, so they are one row here however many sites they
 * played on: Chibi is on ItsYourTurn and on GoldToken, and John is Incognito
 * on one and John Morris on the other. Two rows cross-referencing each other
 * would be two pages a visitor could land on for the same man, which is what
 * this shape exists to stop.
 *
 * Everything that belongs to a site rather than to the person lives here —
 * when they joined it, what they were called on it, what they played there —
 * because none of it is true of them in general.
 */
export type LegacySource = {
  /** The site itself, as it names itself: "ItsYourTurn.com". */
  site: string;
  siteUrl?: string;
  /** The site's own player id, for linking back precisely — never guessed at. */
  siteId?: string;
  /** What they were called here, when it is not the name they are known by. */
  handle?: string;
  joined?: string;
  lastActive?: string;
  /** The days a week they set aside, as their own profile there stated it. */
  daysOff?: string;
  /** A line of context, sourced rather than invented. */
  note?: string;
  /** Remarks left on something they posted here, kept as found. */
  comments?: LegacyComment[];
  /** Every class of game this site tracked, each with its own totals. */
  summary: LegacyClassRecord[];
  /** Every game kept against one other legacy player, as this person's own side of it. */
  headToHead?: { opponent: string; games: { game: string; date: string; result: "won" | "lost" | "drawn" }[] }[];
};

export type LegacyPlayer = {
  slug: string;
  name: string;
  kind: LegacyKind;
  location?: string;
  /** How the roll refers to them — "his", "her" or "their". Only set from what was actually said about them; "their" otherwise. */
  possessive?: "his" | "her" | "their";
  /**
   * Where their record was kept, one entry per site, newest chapter last.
   * Never empty: a record with no source is a claim with nothing behind it.
   */
  sources: LegacySource[];
  /** For kind "elsewhere": the folded key of the live Itsutsu name this record belongs beside. */
  linkedKey?: string;
  /**
   * Folded into the live account: this record keeps no address of its own.
   *
   * One person is one page. An "elsewhere" record is the earlier chapter of
   * somebody who is here now, and while it had a slug of its own the site
   * served two pages with the same name at the top — which is the very thing
   * the one-row shape above exists to prevent, missed because it only ever
   * guarded legacy against legacy, never legacy against a live member.
   *
   * Folding removes the address, not the record. Everything here still shows
   * on the live member's page, in that site's tab, which is where somebody
   * looking for it would go first. `note` says why and when, so the next
   * person to read this row knows it was a decision rather than an oversight.
   */
  folded?: { since: string; note: string };
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
