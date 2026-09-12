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
import { isAdminEmail } from "@/lib/auth/admin";
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
 *
 * AND A DISPLAY NAME IS NOT UNIQUE, which is the whole reason the lookup below
 * is shaped the way it is. `Member.name` carries no unique constraint — only
 * `email` does — so "the member called X" is a question the database may not be
 * able to answer. A `findFirst` here answered it anyway, with whichever row came
 * back first, and that row is arbitrary: two members who both go by "John
 * Morris" and the words of either one would have signed somebody in as the
 * other. There are no duplicate names on production today, so nothing was
 * broken; the development database has a pair, so nothing was preventing it
 * either.
 *
 * So an ambiguous name REFUSES. Silence is the safe answer to "which of these
 * two did you mean" and an arbitrary row is the dangerous one, and on a sign-in
 * the dangerous one is somebody signing in as somebody else. `take: 2` is
 * enough to know there is more than one without reading the table.
 *
 * This is a guard and not the remedy. Sign-in still needs a handle that is
 * unique BY CONSTRUCTION — a unique display name, a separate short handle, or
 * something already unique — and that is a decision about what members are
 * asked for rather than one this module can make. Until it is made, a name two
 * people share is a name neither of them can sign in with.
 */
export async function verifyPhraseFor(
  name: string,
  words: readonly string[],
): Promise<string | null> {
  const wanted = name.trim();
  if (wanted === "") return null;

  const canonical = canonicalPhrase([...words]);
  if (canonical === null) return null;

  const found = await prisma.member.findMany({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: FACTS,
    take: 2,
  });
  /*
   * One row or nothing. Two rows is not "pick one" — it is the same null as a
   * name nobody here goes by, so an ambiguous name does not even tell a caller
   * that it is ambiguous. The hash below still runs against the null, so
   * refusing costs exactly as long as failing, and the two cannot be told apart
   * by a clock any more than by a message.
   */
  const row = found.length === 1 ? found[0] : null;

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

export type SeatPhraseOutcome =
  | { ok: true; memberId: string; bound: boolean }
  | { ok: false };

/**
 * Four words given at a seat: checked against the account if it has words, and
 * BOUND to it if it has none.
 *
 * THIS IS THE POINT OF THE FEATURE AND IT WAS THE HALF THAT WAS MISSING. John:
 * "We don't sign in. She is signed in. We are providing the words to be
 * associated with my account. That's the point." What shipped could only ever
 * verify words that already existed, which meant they had to be set from a
 * device already signed in as you — the one thing the feature exists to avoid.
 * Arriving at somebody else's tablet with no words and no other device left you
 * stuck, which is exactly the case it was built for.
 *
 * So an account with no words yet takes the four it is given. **First words
 * win**, and the risk of that is one John has weighed and accepted in terms
 * worth keeping: "the risk is low. all games are logged. you can claim a Lost
 * user as we can know when a user is lost... or the opponent can vouch for
 * them." The exposure is bounded by design — it can only ever happen ONCE per
 * account, and only to an account that has never set words.
 *
 * THE OPERATOR IS CARVED OUT, and that is not a hedge. "Low risk" stops being
 * true for the one account that can read every address on the site and move
 * every row on the board, so no words are ever bound to it this way. It may
 * still set them the ordinary way, signed in, like anybody else.
 *
 * The same refusals as verification, for the same reasons: a banned member, a
 * kept record nobody may climb inside, and a computer player which is a program
 * with nobody to be it.
 *
 * Rate limiting lives on the route, as it does for `verifyPhraseFor` — a
 * library function has no address to count. Nothing may call this without one.
 *
 * AN AMBIGUOUS NAME REFUSES, and it matters more here than it does for plain
 * verification. `Member.name` carries no unique constraint, so "the member called
 * X" may name two rows — and this function does not only READ the one it picks,
 * it WRITES a credential onto it and says first words win, only once. Getting
 * that wrong is not a failed sign-in that can be retried:
 *
 * - the four words land on whichever row came back first, which may be the other
 *   person's account, and they are that account's password from then on;
 * - the person they were meant for still has none, and can never bind any by this
 *   route again, because their name now resolves to a row that HAS a phrase and
 *   their next attempt is checked against somebody else's hash;
 * - nothing anywhere reports that it happened.
 *
 * So two rows is the same refusal as no rows. `verifyPhraseFor` says the rest.
 */
export async function claimOrVerifyPhraseFor(
  name: string,
  words: readonly string[],
): Promise<SeatPhraseOutcome> {
  const wanted = name.trim();
  if (wanted === "") return { ok: false };

  const canonical = canonicalPhrase([...words]);
  if (canonical === null) return { ok: false };

  const found = await prisma.member.findMany({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: FACTS,
    take: 2,
  });
  // One row or nothing. The hash below still runs against the null, so a refusal
  // for two rows costs what a refusal for none does.
  const row = found.length === 1 ? found[0] : null;

  /*
   * The hash is compared even when there is no row, and the answer thrown
   * away, exactly as `verifyPhraseFor` does — an instant refusal for a name
   * nobody here goes by would say which names are worth trying.
   */
  const matched = await phraseMatches(canonical, row?.phraseHash ?? null);
  if (row === null) return { ok: false };
  if (row.bannedAt !== null || row.unclaimableBecause !== null || row.botTier !== null) {
    return { ok: false };
  }

  if (row.phraseHash === null) {
    if (isAdminEmail(row.email)) return { ok: false };
    const set = await setPhrase(row.id, words);
    if (!set.ok) return { ok: false };
    return { ok: true, memberId: row.id, bound: true };
  }

  if (!matched) return { ok: false };
  return { ok: true, memberId: row.id, bound: false };
}
