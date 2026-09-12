import "server-only";

import { prisma } from "@/lib/prisma";
import { revokeInviteCode } from "@/lib/invite/inviteStore";
import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { playerKey } from "@/lib/rating/playerKey";
import { isAdminEmail } from "./admin";
import { canBeClaimed } from "./memberId";
import { alwaysListed } from "./alwaysListed";
import { foldEmail, type NamedMember } from "./members";
import { memberKind, type MemberKind } from "./memberKind";

/**
 * The operator's list of members, and the one thing he may do to a row of it.
 *
 * A different job from the rest of `members.ts`, which is about a member's own
 * record — who they are, what they have chosen, when they were last seen. This
 * is the roster: every member at once, with the columns only an operator has
 * any use for, and the shutting of an account.
 *
 * It moved here because the file it was in reached the size gate, and the gate
 * was right. Two audiences were sharing a module: everything else in
 * `members.ts` answers "what about this person", and everything here answers
 * "who is on this site". The seam was already there — only two callers reach
 * for any of it, both of them the operator's.
 */

/** One line of the operator's list of members. */
export type MemberSummary = NamedMember & {
  /** The row's own name for itself, which every member has and no two share. */
  id: string;
  createdAt: string;
  lastSeenAt: string;
  bannedAt: string | null;
  bannedNote: string;
  invitedWith: string;
  /**
   * What sort of member this is, worked out on the server.
   *
   * It has to be, because being the operator is membership of ADMIN_EMAILS
   * rather than a column, and that list is an environment variable — a
   * component that could work this out for itself would be a component that
   * could read the allowlist.
   */
  kind: MemberKind;
  /** True of exactly one row in the operator's own list: theirs. */
  isYou: boolean;
  /**
   * When four words were last set on this account, or null for never.
   *
   * A DATE AND NEVER THE HASH, the same one fact `/api/me/phrase` gives the
   * member themselves — see `Member.phraseHash`, which no endpoint returns.
   * It is here because the operator's Words modal has to be able to say "this
   * member already has four words, set on the 3rd of March" BEFORE it asks to
   * replace them, and a link that fetched a status per row to find that out
   * would be a query per row on a page that shows two hundred of them. It is
   * one more column on the select the list already makes.
   *
   * The route is still the authority: a member who set their own words since
   * this list was drawn is caught by the 409 there, not by this.
   */
  phraseSetAt: string | null;
  /**
   * Whether four words could be set on this row at all.
   *
   * `canBeClaimed` and nothing else: a phrase is a way IN, so giving one to a
   * row that may never be claimed by a login — a kept record, a seeded row, a
   * computer player — would hand out a credential for an account that is not
   * anybody's. Answered here rather than in the component for the reason
   * `kind` is: the rule lives in one place and every list reads the same one.
   */
  mayHavePhrase: boolean;
};

/**
 * Which sort of kept record somebody is, where the legacy data says.
 *
 * Chibi and Kyokosan are member rows now, and nothing on the row itself
 * distinguishes a man who has died from a woman who simply never joined. The
 * record kept of them does, and it is matched by the name they are known by.
 */
function legacyKindOf(name: string): "remembered" | "honorary" | "elsewhere" | null {
  const key = playerKey(name);
  return LEGACY_PLAYERS.find((legacy) => playerKey(legacy.name) === key)?.kind ?? null;
}

/**
 * Every member, most recently seen first. The operator's own view; nobody
 * else sees it.
 *
 * `you` is the address of whoever is reading the list, so their own row can
 * be told apart from everybody else's — the controls that make no sense
 * pointed at yourself are the reason it is needed.
 */
const MEMBER_SUMMARY_SELECT = {
  id: true,
  email: true,
  name: true,
  picture: true,
  createdAt: true,
  lastSeenAt: true,
  bannedAt: true,
  bannedNote: true,
  invitedWith: true,
  unclaimableBecause: true,
  /*
   * The DATE the words were set, never the hash — see `MemberSummary.phraseSetAt`
   * for why the operator's list carries it and why one more column here is the
   * whole cost of it.
   */
  phraseSetAt: true,
  /*
   * `memberKind` decides a member is a robot from this and from nothing else.
   * It was not selected and not passed on, so a computer player was badged as
   * an ordinary member on the one page that draws the badge — whatever the
   * size of the database, and however the row was written.
   */
  botTier: true,
} as const;

/** How many members there are, whatever a page of them is cut to. */
export async function countMembers(): Promise<number> {
  return prisma.member.count();
}

/**
 * One member, by address, in the shape the operator's list uses.
 *
 * `setBanned` used to fetch a thousand members and look through them for the
 * one it had just written, which is a table scan to answer a question it
 * already knew the answer to — and which returned nothing at all once the
 * site had more members than that, so shutting an account would have read as
 * having failed while having worked.
 */
export async function memberSummaryFor(email: string): Promise<MemberSummary | null> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({ where: { email: key }, select: MEMBER_SUMMARY_SELECT });
  return row === null ? null : toSummary([row], null)[0];
}

/**
 * The members, most recently seen first, cut at a limit — with the computer
 * players kept whatever the cut is.
 *
 * A computer player is never seen, because it never signs in, so its stamp is
 * frozen at the moment it was written and it sinks past the end of any list
 * ordered by recency. On a site with more members than the limit all three
 * would drop off this page silently — and this is the page that badges them
 * as robots, which is proof enough that they belong on it. The same thing had
 * already happened on the players directory.
 *
 * The limit itself is honest rather than wrong: the caller reports the true
 * total beside what it shows, so an operator is told what was left out.
 */
export async function listMembers(limit = 200, you: string | null = null): Promise<MemberSummary[]> {
  const [recent, computers] = await Promise.all([
    prisma.member.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: limit,
      select: MEMBER_SUMMARY_SELECT,
    }),
    prisma.member.findMany({ where: { botTier: { not: null } }, select: MEMBER_SUMMARY_SELECT }),
  ]);
  return toSummary(alwaysListed(recent, computers), you);
}

/** Exactly the columns MEMBER_SUMMARY_SELECT asks for, and nothing else. */
type SummaryRow = {
  id: string;
  email: string | null;
  name: string;
  picture: string;
  createdAt: Date;
  lastSeenAt: Date;
  bannedAt: Date | null;
  bannedNote: string;
  invitedWith: string;
  unclaimableBecause: string | null;
  phraseSetAt: Date | null;
  botTier: string | null;
};

function toSummary(rows: SummaryRow[], you: string | null): MemberSummary[] {
  const mine = you === null ? null : foldEmail(you);
  return rows.map(({ unclaimableBecause, botTier, phraseSetAt, ...row }) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    bannedAt: row.bannedAt === null ? null : row.bannedAt.toISOString(),
    phraseSetAt: phraseSetAt === null ? null : phraseSetAt.toISOString(),
    mayHavePhrase: canBeClaimed(unclaimableBecause),
    kind: memberKind({
      email: row.email,
      unclaimableBecause,
      botTier,
      isOperator: isAdminEmail(row.email),
      legacyKind: legacyKindOf(row.name),
    }),
    isYou: mine !== null && row.email !== null && foldEmail(row.email) === mine,
  }));
}

/**
 * Shuts an account, or opens it again.
 *
 * Shutting it also revokes the invite that let them in, so the same person
 * cannot walk back through the door they came by; opening it again does not
 * put that invite back, because a code is a thing the operator hands out and
 * this one has been spent on a decision.
 */
export async function setBanned(email: string, banned: boolean, note = ""): Promise<MemberSummary | null> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({ where: { email: key }, select: { invitedWith: true } });
  if (row === null) return null;
  await prisma.member.update({
    where: { email: key },
    data: banned ? { bannedAt: new Date(), bannedNote: note.trim().slice(0, 280) } : { bannedAt: null, bannedNote: "" },
  });
  if (banned && row.invitedWith !== "") await revokeInviteCode(row.invitedWith).catch(() => undefined);
  return memberSummaryFor(key);
}
