import "server-only";

/**
 * Where a member's phrase is kept, and the only module that writes it.
 *
 * GAINING A CREDENTIAL IS PURELY ADDITIVE. Every write here is
 * `prisma.member.update` on `{ id }`, setting `phraseHash` and `phraseSetAt`
 * and nothing else. Not a create, not an upsert, not a second row, and never a
 * lookup by name or address to decide WHICH row to write.
 *
 * That is stated so plainly because this project has now been bitten twice by
 * the other thing. The record bug fixed in 0.132.0 orphaned five games and a
 * rating — John's daughter's — because a person's record was found by their
 * NAME and she renamed herself. A member who sets a phrase keeps the same id,
 * the same games and the same ladder standing, because there is nothing in here
 * that could move any of them. If a future change finds itself creating a
 * member or re-keying one to give somebody a credential, that is the same
 * half-migration happening a third time and it should stop there.
 *
 * `phraseStore.test.ts` asserts the shape of the write rather than only the
 * outcome, so "it worked" over a `create` cannot pass.
 */
import { prisma } from "@/lib/prisma";

import { CREDENTIALS, mayRemove } from "./credentials";
import { canonicalPhrase } from "./phrase";
import { hashPhrase, phraseMatches } from "./phraseHash";

/** The columns any of this needs. Narrow, because it is read on a hot path. */
const FACTS = {
  id: true,
  email: true,
  name: true,
  phraseHash: true,
  phraseSetAt: true,
  bannedAt: true,
  unclaimableBecause: true,
  botTier: true,
} as const;

export type SetPhraseOutcome =
  | { ok: true }
  | { ok: false; reason: "not-a-phrase" | "no-member" };

/**
 * Sets — or rerolls — a member's phrase.
 *
 * Rerolling is the same call, and deliberately so. A properly hashed phrase
 * cannot be shown again, which is correct and is harsh for a child, so
 * forgetting has to be a thirty-second re-pick rather than a crisis. There is
 * nothing special about the second time.
 */
export async function setPhrase(
  memberId: string,
  words: readonly string[],
): Promise<SetPhraseOutcome> {
  const canonical = canonicalPhrase([...words]);
  // Refused before anything is written, and before anything is read: words that
  // are not a phrase are not a database question.
  if (canonical === null) return { ok: false, reason: "not-a-phrase" };

  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (row === null) return { ok: false, reason: "no-member" };

  await prisma.member.update({
    where: { id: memberId },
    data: { phraseHash: await hashPhrase(canonical), phraseSetAt: new Date() },
  });
  return { ok: true };
}

export type ClearPhraseOutcome =
  | { ok: true }
  | { ok: false; reason: "last-credential" | "no-member" };

/**
 * Takes a member's phrase away, unless it is the only way into the account.
 *
 * The invariant is `credentials.ts`'s and is asked here rather than trusted to
 * the caller: you may add either credential, and you may not remove your last.
 */
export async function clearPhrase(memberId: string): Promise<ClearPhraseOutcome> {
  const row = await prisma.member.findUnique({
    where: { id: memberId },
    select: { email: true, phraseHash: true },
  });
  if (row === null) return { ok: false, reason: "no-member" };
  if (!mayRemove(CREDENTIALS.phrase, row)) return { ok: false, reason: "last-credential" };

  await prisma.member.update({
    where: { id: memberId },
    data: { phraseHash: null, phraseSetAt: null },
  });
  return { ok: true };
}

/**
 * What a member may be told about their own phrase: that there is one, when it
 * was set, and whether it could be removed.
 *
 * That is the whole of it, because that is the whole of what can be known. The
 * hash never leaves this module and no endpoint returns it. Null for a member
 * who is not there — a refusal rather than a status saying "no phrase", which
 * would read identically to a real answer about a real account.
 */
export type PhraseStatus = {
  set: boolean;
  setAt: Date | null;
  hasEmail: boolean;
  mayRemovePhrase: boolean;
};

export async function phraseStatus(memberId: string): Promise<PhraseStatus | null> {
  const row = await prisma.member.findUnique({
    where: { id: memberId },
    select: { email: true, phraseHash: true, phraseSetAt: true },
  });
  if (row === null) return null;
  return {
    set: typeof row.phraseHash === "string" && row.phraseHash !== "",
    setAt: row.phraseSetAt,
    hasEmail: typeof row.email === "string" && row.email.trim() !== "",
    mayRemovePhrase: mayRemove(CREDENTIALS.phrase, row),
  };
}

/**
 * The member these four words belong to, or null.
 *
 * A NAME AND THEN THE WORDS, which is a username and a password and is the only
 * shape that can work. The words cannot find a member on their own: each row's
 * hash is salted, so there is nothing to look up — and a phrase is not unique
 * across members in any case. A name is not a secret, so saying it costs
 * nothing; the words are what prove it.
 *
 * Null for every failure and the same null for all of them. A caller cannot
 * tell "no such name" from "wrong words", which is what stops this being a way
 * to find out who holds an account here.
 *
 * The rate limit that makes this safe is on the routes, not here — a library
 * function has no address to count. Nothing must call this without one.
 */
export async function verifyPhraseFor(
  name: string,
  words: readonly string[],
): Promise<string | null> {
  const wanted = name.trim();
  if (wanted === "") return null;

  const canonical = canonicalPhrase([...words]);
  if (canonical === null) return null;

  const row = await prisma.member.findFirst({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: FACTS,
  });

  /*
   * The hash is checked even when there is no row and no phrase, and the result
   * thrown away. `phraseMatches` does the same work for a null as for a real
   * hash on purpose: answering instantly for an account with no phrase would
   * say which names are worth attacking.
   */
  const matched = await phraseMatches(canonical, row?.phraseHash ?? null);
  if (row === null || !matched) return null;

  /*
   * Three rows that must never be reached this way, each for its own reason.
   * A banned member is gone from the moment the operator says so. A row marked
   * unclaimable is a kept record or a seed — a history meant to stand as it is,
   * which nobody may put themselves inside. And a computer player is a program:
   * it holds seats and has a rating, and there is nobody to be it.
   *
   * None of them can have a phrase set through this module, so in practice the
   * hash check has already failed. Checked anyway, because "it cannot happen"
   * is a statement about today's code and this is an authentication path.
   */
  if (row.bannedAt !== null) return null;
  if (row.unclaimableBecause !== null) return null;
  if (row.botTier !== null) return null;

  return row.id;
}
