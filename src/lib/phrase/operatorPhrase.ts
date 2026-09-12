import "server-only";

import { prisma } from "@/lib/prisma";
import { canBeClaimed } from "@/lib/auth/memberId";

import { setPhrase } from "./phraseStore";

/**
 * The operator setting somebody else's four words.
 *
 * THE THIRD WAY TO SET A PHRASE, and the reason it exists is the kitchen
 * table: a parent sitting with a twelve-year-old, setting her account up for
 * her rather than making her do it, and writing the four words down for her on
 * the spot. The member's own Words tab (`PhraseSetup`) is the first way, and
 * sitting in at a game is the second.
 *
 * IT REVERSES A DECISION THAT WAS WRITTEN DOWN ELSEWHERE. `pickTicket.ts` and
 * `/api/me/phrase/draw` both said, in as many words, that a parent setting a
 * child's words was ruled out by name — because a credential an adult can set
 * stops proving it is her. John asked for it anyway; both comments now say so,
 * because a rule stated in one place and contradicted by what ships is worse
 * than no rule.
 *
 * What that older rule was really protecting is untouched: one MEMBER still
 * cannot drive another member's pick. The ticket is bound to the member the
 * words will belong to, and the only thing that may hand it a member other
 * than its own caller is an operator session.
 *
 * WHY THIS MODULE EXISTS AT ALL, rather than the route asking the store. Two
 * questions have to be answered before `setPhrase` is called, and neither is a
 * question about phrases:
 *
 *  - may this ROW hold a credential? A phrase is a way in, so writing one onto
 *    a kept record or a computer player would invent a login for an account
 *    that is nobody's. `canBeClaimed` is the site's one answer to that.
 *  - is the operator REPLACING one? A phrase cannot be read back, so replacing
 *    somebody's silently is a way to lock them out of their own games. The
 *    refusal is the answer here; see `reason: "needs-confirm"`.
 *
 * Both are refusals rather than repairs, and neither is the store's business:
 * the store hashes and writes, and it is the only thing that does. Nothing
 * here touches `phraseHash`.
 */

/** What can be said about a member the operator is about to set words for. */
export type PhraseTarget = {
  id: string;
  name: string;
  /** Their address, or null for a row nobody signs in to. */
  email: string | null;
  /** Whether four words could be set on this row at all — see `canBeClaimed`. */
  mayHavePhrase: boolean;
  /** Whether there are already four words on it. */
  set: boolean;
  /** When those were set. A date, never the hash. */
  setAt: Date | null;
};

/**
 * The member the operator named, or null when there is no such row.
 *
 * Null rather than a target with everything false. "There is no such member"
 * and "there is one and it may not hold words" are two different answers and
 * the route says two different things about them — a status that covered both
 * would tell the operator the row was unusable when it was simply not there.
 */
export async function phraseTarget(memberId: string): Promise<PhraseTarget | null> {
  const wanted = memberId.trim();
  if (wanted === "") return null;
  const row = await prisma.member.findUnique({
    where: { id: wanted },
    select: { id: true, name: true, email: true, unclaimableBecause: true, phraseHash: true, phraseSetAt: true },
  });
  if (row === null) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mayHavePhrase: canBeClaimed(row.unclaimableBecause),
    set: typeof row.phraseHash === "string" && row.phraseHash !== "",
    setAt: row.phraseSetAt,
  };
}

export type OperatorSetOutcome =
  | { ok: true; replaced: boolean; target: PhraseTarget }
  | { ok: false; reason: "no-member" }
  | { ok: false; reason: "not-claimable"; target: PhraseTarget }
  /**
   * There are already four words on this account and the operator has not said
   * to replace them.
   *
   * A REFUSAL AND NOT A DEFAULT EITHER WAY. Writing them would take a person's
   * way into their own account away without anybody deciding to; refusing
   * quietly would leave an operator pressing Save at a screen that does
   * nothing. So it carries the date those words were set, which is the one
   * thing that can be known about them and the whole of what makes the
   * question answerable: "set on the 3rd of March" is a fact the operator can
   * weigh, where "there is already one" is not.
   */
  | { ok: false; reason: "needs-confirm"; target: PhraseTarget }
  | { ok: false; reason: "not-a-phrase"; target: PhraseTarget };

/**
 * Sets a member's four words on the operator's say-so.
 *
 * `replacing` is the operator having been asked and having answered yes. It is
 * required rather than defaulted, so the caller has had to decide: a default
 * of true replaces credentials by omission, and a default of false makes the
 * confirm impossible to express.
 */
export async function setPhraseAsOperator(
  memberId: string,
  words: readonly string[],
  { replacing }: { replacing: boolean },
): Promise<OperatorSetOutcome> {
  const target = await phraseTarget(memberId);
  if (target === null) return { ok: false, reason: "no-member" };
  if (!target.mayHavePhrase) return { ok: false, reason: "not-claimable", target };
  if (target.set && !replacing) return { ok: false, reason: "needs-confirm", target };

  const written = await setPhrase(target.id, words);
  if (!written.ok) {
    /*
     * `no-member` cannot happen here — the row was just read — but the store
     * may still say it, and answering "those are not four words from the list"
     * to a row that has gone would be a lie about which thing was wrong.
     */
    return written.reason === "no-member"
      ? { ok: false, reason: "no-member" }
      : { ok: false, reason: "not-a-phrase", target };
  }
  return { ok: true, replaced: target.set, target };
}
