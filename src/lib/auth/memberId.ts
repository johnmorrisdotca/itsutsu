/**
 * A member's own name for the database.
 *
 * Given at sign-up and never derived from anything anybody typed. A rating,
 * a record and a game seat all hang off this rather than off a display name
 * or an address, so renaming yourself moves nothing and an address is never
 * part of a key.
 *
 * It identifies; it does not prove. Knowing somebody's id is not being them
 * — a guest's browser carries a signed token rather than the bare id, and a
 * kept history is claimed through an operator or a link sent to a person.
 * That split is what lets a curated id be memorable without being a way in.
 */

/**
 * Letters and digits that cannot be mistaken for one another: no 0, 1, i, l
 * or o. Generated ids draw from this.
 *
 * Curated ids are allowed the whole lowercase alphabet — see `isMemberId` —
 * because the restriction exists for reading an id aloud, and a member id is
 * never read aloud. It lives in a cookie and in foreign keys. A curated id
 * exists precisely so a person can recognise it, and "chibi" cannot be
 * spelled without an i.
 */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export const MEMBER_ID_MIN = 3;
export const MEMBER_ID_MAX = 32;

/**
 * The shape every member id keeps, generated or curated: lowercase letters,
 * digits and hyphens, starting and ending with one of the first two.
 *
 * One rule for both, so there is a single place that decides what a member
 * id may look like and no second opinion to drift from it.
 */
export const MEMBER_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function isMemberId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MEMBER_ID_MIN &&
    value.length <= MEMBER_ID_MAX &&
    MEMBER_ID_PATTERN.test(value) &&
    // Two hyphens together read as a typo, and a name nobody meant.
    !value.includes("--")
  );
}

/** How long a generated id is. Sixteen unambiguous characters is far past collision. */
const LENGTH = 16;

/**
 * One id, drawn at random. `random` is passed in so this stays pure and a
 * test can reproduce a draw, the same way the game ids do it.
 */
export function makeMemberId(random: () => number = Math.random): string {
  let id = "";
  for (let index = 0; index < LENGTH; index += 1) {
    id += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return id;
}

/**
 * Why a row may never be claimed by a real login, or null when it may.
 *
 * A reason rather than a flag: it carries the same fact plus the thing an
 * operator will want to know a year from now, and it reads the right way
 * round at the point of use — null is plainly "no reason it cannot be
 * claimed", where a boolean has to be remembered as true-by-default.
 */
export const UNCLAIMABLE_REASONS = {
  keptRecord: "kept-record",
  seed: "seed",
} as const;

export type UnclaimableReason = (typeof UNCLAIMABLE_REASONS)[keyof typeof UNCLAIMABLE_REASONS];

export function isUnclaimableReason(value: unknown): value is UnclaimableReason {
  return (Object.values(UNCLAIMABLE_REASONS) as string[]).includes(value as string);
}

/** Whether this row may be taken over by somebody signing in. */
export function canBeClaimed(unclaimableBecause: string | null): boolean {
  return unclaimableBecause === null;
}
