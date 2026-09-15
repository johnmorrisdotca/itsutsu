/**
 * Why a claim is refused. One word per reason, so the route can say each in a
 * sentence of its own and a test can name the one it expects.
 *
 * See `claimRefusal` in `claimRecord.ts`, which is the only thing that decides
 * any of these, and `CLAIM_REFUSAL_COPY` for what the operator is told.
 */
export type ClaimRefusal =
  /** No name was given: a blank name folds to nothing and names no record. */
  | "no-name"
  /** The member the record would go to is not there. */
  | "no-member"
  /** That member is a kept record, a seeded row or a computer player: a row meant to stand as it is. */
  | "member-unclaimable"
  /** That member has no name, and a claimed rating is shown under the member's name. */
  | "member-nameless"
  /** The name is a kept record's, a seed's or a program's: `unclaimableBecause` says it may never be claimed. */
  | "record-unclaimable"
  /** Another member goes by this name now, so the site already attaches its new results to them. */
  | "name-held"
  /** Some of what stands under the name already belongs to a member. */
  | "already-claimed"
  /** Nothing stands under the name: no rating, no standing, no finished game. */
  | "nothing-to-claim"
  /** The member already has a rating where the record has one, and a person stands on a ladder once. */
  | "has-standing";

/**
 * What a claim moves, counted before it moves anything — and, once it has, what
 * it moved. Numbers only, never a name: this is what the operator log's detail
 * is written from.
 */
export type ClaimPlan = {
  /**
   * Finished games with a seat under the name, the same set `/history?player=`
   * opens for that name — so the count on the operator's screen is the way into
   * exactly those games. Some may already carry this member's id.
   */
  games: number;
  /** Of those seats, how many carry nobody's id yet and are given the member's. */
  seats: number;
  /** Whether a rating row stands under the name, to be the member's. */
  rating: boolean;
  /** How many per-game standings stand under the name, to be the member's. */
  standings: number;
};

/** The member a claim is for, as the operator's screen names them. */
export type ClaimMember = { id: string; name: string };

/** A claim looked at or made: what it moves, or the one reason it will not. */
export type ClaimOutcome = { ok: true; member: ClaimMember; plan: ClaimPlan } | { ok: false; reason: ClaimRefusal };

/**
 * Everything the decision needs, read in one place and handed to a pure rule.
 *
 * Read inside the claim's own transaction when a claim is made, so what was
 * decided is what is written.
 */
export type ClaimFacts = {
  /** The asked-for name, folded as `playerKey` folds it. */
  key: string;
  /** Whether the name is kept for a remembered or honorary player. */
  reserved: boolean;
  /** The member the record would go to, or null when there is no such row. */
  member: { id: string; name: string; botTier: string | null; unclaimableBecause: string | null } | null;
  /** Every member whose name folds to the key — the rule `memberIdForName` uses to decide whose a result is. */
  namesakes: { id: string; botTier: string | null; unclaimableBecause: string | null }[];
  /** The rating row under the key, or null. */
  rating: { memberId: string | null } | null;
  /** The per-game standings under the key. */
  standings: { variant: string; memberId: string | null }[];
  /** Finished, decided games with a seat under the name, whoever holds it. */
  games: number;
  /** Seats under the name that carry a member id other than this member's. */
  seatsHeldByOthers: number;
  /** Seats under the name with no member id, black side and white side counted apart. */
  openBlack: number;
  openWhite: number;
  /** Whether the member already owns a rating row of their own. */
  memberHasRating: boolean;
  /** The games the member already holds a per-game standing at. */
  memberVariants: string[];
};
