import { MEMBER_KINDS, memberKind, type MemberKind } from "@/lib/auth/memberKind";

/**
 * WHAT IS DRAWN BESIDE A MEMBER'S NAME IN A LIST, DECIDED ONCE.
 *
 * John, 2026-09-24, on the XP board: "why do we show names differently in the
 * XP page. We really need to be using components that show names in the same
 * way everywhere in the site... right now it's no holds barred, every man for
 * himself... there's no consistency."
 *
 * He was right, and it was not one page. A member named in a list was drawn
 * seven ways: the players list gave a name, 新, a flag and the BOT badge; the
 * computer players gave a flag and the badge; the XP board, its promotions and
 * its rungs gave the name and nothing else, so a program on them looked like a
 * person; the ladders gave a bare link; the buddies gave a flag; "My people"
 * printed a name that led nowhere. Each list had read whatever columns its own
 * query happened to select, so each drew what it had.
 *
 * So the marks are one shape, read from one set of columns, and worked out
 * here. A query that lists members selects `MEMBER_MARKS_SELECT` beside the
 * name and hands the row to `memberMarks`; `MemberTag` draws the result. A
 * list cannot draw a flag the next list lacks, because neither decides.
 */

/** The columns the marks are worked out from. Spread into a query's `select`. */
export const MEMBER_MARKS_SELECT = {
  country: true,
  botTier: true,
  unclaimableBecause: true,
  createdAt: true,
} as const;

/** How long a member counts as new. */
export const NEW_FOR_DAYS = 14;

/** A member row, as much of it as the marks need. */
export type MarkFacts = {
  country: string | null;
  botTier: string | null;
  unclaimableBecause: string | null;
  createdAt: Date;
};

/**
 * What is drawn beside a name. Plain data, so it crosses from a server read to
 * a client table and through the paging routes unchanged.
 */
export type MemberMarks = {
  /** As they wrote it; "" for nowhere. `CountryMark` turns it into a flag. */
  country: string;
  /** What sort of member they are; an ordinary member draws no badge. */
  kind: MemberKind;
  /** A person who joined in the last `NEW_FOR_DAYS` days. */
  isNew: boolean;
};

/**
 * The marks for one member.
 *
 * NEW IS FOR PEOPLE. A program's row is made the first time a page asks for
 * it, so its `createdAt` is when the site first needed it, not when anybody
 * arrived — and 新 beside a program would be welcoming a machine that has
 * been playing all along. A kept record is the same: its row is new, its
 * person is not.
 */
export function memberMarks(row: MarkFacts, now: number = Date.now()): MemberMarks {
  const kind = memberKind({ email: null, botTier: row.botTier, unclaimableBecause: row.unclaimableBecause });
  return {
    country: (row.country ?? "").trim(),
    kind,
    isNew: kind === MEMBER_KINDS.member && now - row.createdAt.getTime() < NEW_FOR_DAYS * 86_400_000,
  };
}
