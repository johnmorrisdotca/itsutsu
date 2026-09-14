import type { RatingTier } from "@/lib/rating/elo";
import type { RatingPool } from "@/lib/rating/pools";

/** Somebody waiting at an open seat, as the seat names them. */
export type PosterRef = {
  name: string;
  /** Their member id, or null for a name typed at one screen with nobody behind it. */
  memberId: string | null;
};

/**
 * What the waiting room shows beside a poster, so a reader can pick an opponent
 * of their own strength: the rating with the pool that earned it and its tier,
 * the XP level and total, and where they are.
 */
export type PosterStanding = {
  /** Null where nothing honest can be printed: no settled rating in either pool. */
  rating: { rating: number; pool: RatingPool; tier: RatingTier } | null;
  /** Null for a poster with no member row, who has no total to stand on. */
  level: number | null;
  /** Their XP total as `xpShown` answers it; null for a poster with no member row. */
  xp: number | null;
  /** Their country, for the flag and its name; null where none is known. */
  country: string | null;
};

/** The columns of a rating row the choice between a member's rows reads. */
export type PosterRatingRow = {
  key: string;
  memberId: string | null;
  updatedAt: Date;
};
