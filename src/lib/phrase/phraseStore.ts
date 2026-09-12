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
 * Who is claiming: the member somebody TAPPED, or a name somebody said.
 *
 * A union rather than one string, because the two are not the same question and
 * only one of them has an answer. An id names exactly one row. A name names
 * however many rows happen to be called that — display names here are not
 * unique and the column has no index at all — so a name is a question this
 * module can be asked and cannot always answer.
 *
 * The seat picks by id. The list a person taps carries it (`seatPick.ts`), which
 * is what stops a claim ever having to guess which "John Morris" was meant.
 */
export type PhraseClaimant = { memberId: string } | { name: string };

/**
 * The one row a claimant means, or null.
 *
 * THE AMBIGUOUS NAME IS REFUSED, NOT GUESSED, and that refusal is load-bearing
 * rather than a stopgap. It went in while making display names unique was still
 * the plan; that plan is off — a name is advice about how you appear to others
 * and not an identifier — so two members may share one for ever, and this is the
 * only thing standing between that and an authentication path picking whichever
 * row came back first. A constraint would not have made a `findFirst` on a
 * non-unique column correct, and there is no constraint now either.
 *
 * **DO NOT REMOVE IT BECAUSE THE SEAT NO LONGER REACHES IT.** The seat picks by
 * id, so from that path this branch is unreachable and the refusal can never
 * fire — which is exactly what it looks like just before somebody deletes it as
 * dead. `verifyPhraseFor` still resolves a member by name, and a guard dropped
 * because ONE caller stopped needing it is how this class of bug comes back. It
 * survives on its own merits: as long as anything here turns a string into an
 * account, the string has to be allowed to mean "I cannot tell".
 */
async function claimantRow(who: PhraseClaimant) {
  if ("memberId" in who) {
    const wanted = who.memberId.trim();
    // Unique by definition: an id is the row's own name for itself.
    return wanted === "" ? null : prisma.member.findUnique({ where: { id: wanted }, select: FACTS });
  }

  const wanted = who.name.trim();
  if (wanted === "") return null;
  /*
   * Two is all it takes to know the answer is "I cannot tell", so two is all
   * that is fetched.
   */
  const rows = await prisma.member.findMany({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: FACTS,
    take: 2,
  });
  return rows.length === 1 ? (rows[0] ?? null) : null;
}

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

  // Null when the name means two people — see `claimantRow`.
  const row = await claimantRow({ name: wanted });

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
  | {
      ok: true;
      memberId: string;
      /**
       * The name on the row, which is what the seat is stamped with.
       *
       * It comes from the account rather than from the request, and that is the
       * point of returning it: the rating is filed against the seat's NAME, so a
       * seat must carry what the member is actually called and not a spelling
       * somebody handed in. Nothing types it any more in any case.
       */
      name: string;
      bound: boolean;
    }
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
 * with nobody to be it. `seatPick.ts` leaves all three off the list a person
 * taps, so the two are one rule read from both ends.
 *
 * WHO IS TAPPED, NOT TYPED. This takes a `PhraseClaimant`, and the seat hands it
 * the id of a member picked off a list. Nothing about the claim is weaker for it:
 * an id is exactly as public as a name was — `/players` prints every member and
 * links each one by id — and the words are still the whole of the proof, still
 * checked under the guessing limit, and the account can still only ever be bound
 * once. What changes is that "which account is this" stopped being a guess.
 *
 * Rate limiting lives on the route, as it does for `verifyPhraseFor` — a
 * library function has no address to count. Nothing may call this without one.
 */
export async function claimOrVerifyPhraseFor(
  who: PhraseClaimant,
  words: readonly string[],
): Promise<SeatPhraseOutcome> {
  const canonical = canonicalPhrase([...words]);
  if (canonical === null) return { ok: false };

  const row = await claimantRow(who);

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
    return { ok: true, memberId: row.id, name: row.name, bound: true };
  }

  if (!matched) return { ok: false };
  return { ok: true, memberId: row.id, name: row.name, bound: false };
}
