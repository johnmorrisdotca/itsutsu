import { UNCLAIMABLE_REASONS } from "./memberId";

/**
 * What kind of member somebody is.
 *
 * The kinds accumulated one at a time — an operator, then kept records, then
 * seeded rows, and computer players to come — and until now nothing named
 * them together. Four different lists show people, and a kind worked out
 * separately in each is a kind that disagrees with itself in four ways, so it
 * is worked out here and nowhere else.
 *
 * A kind is what somebody *is*. Whether their account is shut is a state they
 * are in, and the two are shown side by side rather than folded together: a
 * shut operator is both things at once.
 */
export const MEMBER_KINDS = {
  /** Authorised by ADMIN_EMAILS, which is a deployment setting rather than a column. */
  operator: "operator",
  /** A program that plays: the rungs of the computer ladder, and nobody else. */
  robot: "robot",
  /** Someone who has died, whose record from elsewhere is kept here. */
  remembered: "remembered",
  /** Alive, never played here, kept in their own right. */
  honorary: "honorary",
  /** A record kept from elsewhere whose person is neither of the above. */
  keptRecord: "kept-record",
  /** Written by the seed, not by anybody signing up. */
  seed: "seed",
  /** Everybody else, which is nearly everybody. */
  member: "member",
} as const;

export type MemberKind = (typeof MEMBER_KINDS)[keyof typeof MEMBER_KINDS];

export const MEMBER_KIND_DISPLAY: Record<MemberKind, { label: string; kanji: string; note: string }> = {
  operator: { label: "Operator", kanji: "管理", note: "Runs the site. Named in the deployment, not in the members table." },
  robot: { label: "Robot", kanji: "機械", note: "A program that plays, rated like anybody else." },
  remembered: { label: "Remembered", kanji: "偲ぶ", note: "Their record is kept here; they are not." },
  honorary: { label: "Honorary", kanji: "名誉", note: "Never played here, kept in their own right." },
  "kept-record": { label: "Kept record", kanji: "記録", note: "A record from before this site, with no account behind it." },
  seed: { label: "Seeded", kanji: "種", note: "Written when the site was set up, not by anybody joining." },
  member: { label: "Member", kanji: "会員", note: "An ordinary account." },
};

/**
 * A member row, as much of it as deciding this needs.
 *
 * `isOperator` is passed in rather than worked out, because the allowlist is
 * an environment variable and only the server can read it — and a component
 * that could read it would be a component that could leak it.
 */
export type KindFacts = {
  email: string | null;
  unclaimableBecause: string | null;
  /** The engine that plays this member's seats, when a program does. */
  botTier?: string | null;
  isOperator?: boolean;
  /** Which sort of kept record, where the legacy data says. */
  legacyKind?: "remembered" | "honorary" | "elsewhere" | null;
};

/**
 * The one answer. Order matters: the most specific thing true of somebody is
 * what they are called, and a kept record that is also the operator is a
 * contradiction rather than a case to rank.
 */
export function memberKind(facts: KindFacts): MemberKind {
  if (facts.botTier) return MEMBER_KINDS.robot;
  if (facts.isOperator === true) return MEMBER_KINDS.operator;
  if (facts.unclaimableBecause === UNCLAIMABLE_REASONS.keptRecord) {
    if (facts.legacyKind === "remembered") return MEMBER_KINDS.remembered;
    if (facts.legacyKind === "honorary") return MEMBER_KINDS.honorary;
    return MEMBER_KINDS.keptRecord;
  }
  if (facts.unclaimableBecause === UNCLAIMABLE_REASONS.seed) return MEMBER_KINDS.seed;
  return MEMBER_KINDS.member;
}

/**
 * Whether a kind is worth drawing on a row.
 *
 * An ordinary member is not: a badge on every row is a badge on none, and the
 * whole point is that the unusual rows stand out.
 */
export function worthShowing(kind: MemberKind): boolean {
  return kind !== MEMBER_KINDS.member;
}
