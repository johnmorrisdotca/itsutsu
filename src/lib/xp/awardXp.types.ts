import type { XpAwarded } from "./xp.types";

/** What is read about a member before anything is paid. Four columns, one row. */
export type Recipient = { id: string; botTier: string | null; timeZone: string; xp: number; xpEverywhere: number };

/**
 * One award after the allowance has been applied, with its subject still on it.
 *
 * The subject travels with the decision rather than being looked up by type
 * afterwards, because a batch may legitimately hold two awards of one type with
 * different subjects — a first game of two variants, a buddy added twice — and a
 * lookup by type would give both the first one's. Two rows with one key is a
 * duplicate the index refuses, so the second award would vanish and nothing
 * would say which.
 */
export type Decided = XpAwarded & { subject: string };
