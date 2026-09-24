import { AGE_BANDS } from "./ageBand.constants";

/**
 * WHAT CHANGES FOR A MEMBER UNDER 13 (PRIV-03), each rule one question asked
 * by the page and by the route that writes, never by a component alone.
 *
 * John, 2026-09-24: "When someone is under 13 you are always proposing
 * stricter rules… be more strict… by default, being more restrictive is the
 * correct but possibly inconvenient choice", and "as long as you document the
 * restrictions". So the stricter reading throughout, each written on the
 * privacy page and on the "Decisions to review: under 13" row:
 *
 *  1. Nothing that says where they are: no city, country or bio is kept for a
 *     child (cleared when the band is set, refused after), and their local
 *     time is never shown.
 *  2. Only the child's own buddies can reach them: a direct message or a game
 *     offer from anybody else is refused, and the box is not offered.
 *  3. Never listed as here now, and their last visit is not shown, whatever
 *     the switch says; the switch is not offered.
 *  4. No email is ever sent to them, and they are not offered the form that
 *     emails an invitation to somebody else.
 *  5. Otherwise the same as anybody: their games, record, rating, XP and
 *     level are not hidden, because their games are games.
 *
 * Read `ageBand` through these and nowhere else.
 */

export function isChild(band: string | null | undefined): boolean {
  return band === AGE_BANDS.under13;
}

/** Profile fields a child's account never keeps, because each says where somebody is. */
export const CHILD_WITHHELD_FIELDS = ["city", "country", "bio"] as const;

export type ChildWithheldField = (typeof CHILD_WITHHELD_FIELDS)[number];

/** The same fields, emptied: what the band's write sets on a child's row. */
export const CHILD_CLEARED: Record<ChildWithheldField, string> = { city: "", country: "", bio: "" };

/** What a child is told when a city, country or bio is sent for them. */
export const CHILD_PROFILE_REFUSAL = "A member under 13 keeps no city, country or bio here, so nothing says where they are.";

/** Whether a profile update asks to keep something a child may not have: a withheld field with anything in it. */
export function asksWithheld(update: Partial<Record<ChildWithheldField, string | undefined>>): boolean {
  return CHILD_WITHHELD_FIELDS.some((field) => (update[field] ?? "").trim() !== "");
}

/** Whether a member is listed as here now, and their last visit shown to others. */
export function showsPresence(member: { showOnline: boolean; ageBand: string | null }): boolean {
  return member.showOnline && !isChild(member.ageBand);
}

/** Whether this member's local time may be shown to others. */
export function showsLocalTime(band: string | null | undefined): boolean {
  return !isChild(band);
}

/** Whether the site may send this member an email. */
export function mayBeEmailed(band: string | null | undefined): boolean {
  return !isChild(band);
}

/** Whether this member may send an invitation by email to somebody else. */
export function mayEmailInvites(band: string | null | undefined): boolean {
  return !isChild(band);
}

/**
 * Whether somebody may reach this member with a message or a game offer: any
 * member may reach an adult or a teenager; a child only from their own
 * buddy list — somebody the child chose, not somebody who chose the child.
 */
export function mayReach(band: string | null | undefined, onTheirBuddyList: boolean): boolean {
  return !isChild(band) || onTheirBuddyList;
}
