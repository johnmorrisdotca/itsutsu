/**
 * How a session names its member: by the id it carries, or — for a cookie
 * minted before sessions carried one — by the address.
 *
 * Two cases rather than a string that might be either, because an id and an
 * address are different questions of different columns, and a read that had
 * to guess which it was given would one day guess wrong.
 */
export type MemberKey = { by: "id"; value: string } | { by: "email"; value: string };
