/**
 * The two ways into an account, and the one rule that holds them together.
 *
 * FOUR WORDS AND AN EMAIL ARE TWO INDEPENDENT CREDENTIALS ON ONE ACCOUNT.
 * Either may be added at any time, in any order. That single sentence is what
 * collapses three situations into one design rather than three flows:
 *
 *   - somebody new, with no address, has an account with words only;
 *   - somebody with an address and no account signs up as they do today, and
 *     adds words whenever they want to play on a borrowed device;
 *   - somebody who has an address AND has already played simply GAINS words on
 *     the account they already have.
 *
 * No account is ever in a special class, nothing is a migration, and adding the
 * second credential is an upgrade rather than a conversion.
 *
 * THE INVARIANT THAT MAKES IT SAFE: you may add either, and you may not remove
 * your last one. This module is the whole of that rule, and it is pure — the
 * store calls it, the API calls it, and the profile panel calls it to decide
 * whether to offer the control at all.
 */

export const CREDENTIALS = {
  /** A Google address. Google proves it; the member row says it is welcome. */
  email: "email",
  /** Four words the member picked, hashed. See phraseHash.ts. */
  phrase: "phrase",
} as const;

export type Credential = (typeof CREDENTIALS)[keyof typeof CREDENTIALS];

/**
 * As much of a member row as this rule needs.
 *
 * The hash and not a boolean, so a caller cannot get the question wrong by
 * passing something it worked out itself — `phraseHash: ""` and
 * `phraseHash: null` both mean no phrase, and only this file should have to
 * know that.
 */
export type CredentialFacts = {
  email: string | null | undefined;
  phraseHash: string | null | undefined;
};

function has(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/** Which credentials this account actually holds, in a stable order. */
export function credentialsHeld(facts: CredentialFacts): Credential[] {
  const held: Credential[] = [];
  if (has(facts.email)) held.push(CREDENTIALS.email);
  if (has(facts.phraseHash)) held.push(CREDENTIALS.phrase);
  return held;
}

/** Whether taking this one away would leave the account with no way in. */
export function isLastCredential(which: Credential, facts: CredentialFacts): boolean {
  const held = credentialsHeld(facts);
  return held.length === 1 && held[0] === which;
}

/**
 * Whether this credential may be removed.
 *
 * False for the last one, and false for one that is not there — the second
 * matters as much as the first. "Remove something you do not have" has no
 * correct outcome, and answering true would have the store write a null over a
 * null and report success for work it did not do.
 */
export function mayRemove(which: Credential, facts: CredentialFacts): boolean {
  const held = credentialsHeld(facts);
  if (!held.includes(which)) return false;
  return held.length > 1;
}

/** Why it was refused, worded so the reader knows what would make it possible. */
export function removalRefusal(which: Credential): string {
  return which === CREDENTIALS.phrase
    ? "Your four words are the only way into this account. Add a recovery email address first, and then they can go."
    : "That address is the only way into this account. Set four words first, and then it can go.";
}
