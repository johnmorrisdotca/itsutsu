import type { Appearance } from "@/components/board/board.types";
import type { GameDefaults } from "@/components/game/gameDefaults";

import type { Member } from "./members";

/**
 * The shapes of a member's stored profile.
 *
 * Here rather than in `members.ts` under the Types And Constants Pattern: the
 * two of them are fifty lines of columns and their prose, and the module they
 * came out of is a module of QUERIES. `members.ts` re-exports both, so every
 * caller goes on importing them from where it always did.
 */

/** The profile a member keeps: what others may see, and how they want to be reached. */
export type MemberProfile = Omit<Member, "email"> & {
  /** Null for a kept record: somebody who never signed in and never had one. */
  email: string | null;
  city: string;
  country: string;
  timeZone: string;
  bio: string;
  showOnline: boolean;
  emailNotify: boolean;
  awayFrom: Date | null;
  awayUntil: Date | null;
  awayDaysUsed: number;
  awayYear: number;
  /** Days a finished game stays in their own list; 0 keeps them all. */
  keepFinishedDays: number;
  /** Days of the week they do not play, 0 for Sunday. */
  daysOff: number[];
  /** How they like a board dressed. Stored JSON; read it through cleanAppearance. */
  appearance: unknown;
  /** Where a new game starts for them. Stored JSON; read it through cleanGameDefaults. */
  gameDefaults: unknown;
  /** Their standing choices, by the registry in lib/preferences. Stored JSON; read it through cleanPreferences. */
  preferences: unknown;
  createdAt: Date;
  lastSeenAt: Date;
};

export type ProfileUpdate = Partial<
  Pick<
    MemberProfile,
    | "city"
    | "country"
    | "timeZone"
    | "bio"
    | "showOnline"
    | "emailNotify"
    | "keepFinishedDays"
    | "daysOff"
  >
> & {
  /*
   * Read back as unknown JSON but only ever written as a cleaned Appearance.
   * The asymmetry is the point: what comes out of the column is whatever was
   * in it, and what goes in has already been checked against the themes and
   * stone sets that exist.
   */
  appearance?: Partial<Appearance>;
  gameDefaults?: Partial<GameDefaults>;
};
