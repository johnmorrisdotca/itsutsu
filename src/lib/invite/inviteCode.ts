// Explicit .ts because scripts/mint-invite.ts imports this chain and Node
// resolves it by stripping types, which needs the real filename.
import { INVITE_WORDS } from "./words.ts";

/** Three words is short enough to say aloud and long enough to resist guessing. */
export const CODE_WORDS = 3;

export const CODE_SEPARATOR = "-";

/**
 * Invite codes: three ordinary Japanese words, hyphenated.
 *
 * A phrase is a far smaller keyspace than a random id — 259 words gives about
 * 24 bits — so the safety here does not come from the code alone. It comes
 * from three things together: the redeem endpoint is rate limited hard, codes
 * are revocable and can expire, and a redeemed code is exchanged once for a
 * signed cookie so the phrase itself stops being the credential.
 */
export function generateInviteCode(random: () => number = Math.random): string {
  const words: string[] = [];
  for (let index = 0; index < CODE_WORDS; index += 1) {
    words.push(INVITE_WORDS[Math.floor(random() * INVITE_WORDS.length)]);
  }
  return words.join(CODE_SEPARATOR);
}

/**
 * The canonical form of whatever the player typed.
 *
 * People will paste it with capitals, spaces, curly quotes or a trailing full
 * stop. Anything that is not a letter becomes a separator, so "Hoshi Kuma
 * Nami." and "hoshi-kuma-nami" are the same code.
 */
export function normaliseInviteCode(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z]+/g, CODE_SEPARATOR)
    .replace(/^-+|-+$/g, "");
}

/** Whether a string could be a code at all, before any database lookup. */
export function isWellFormedCode(input: string): boolean {
  const parts = normaliseInviteCode(input).split(CODE_SEPARATOR);
  return (
    parts.length === CODE_WORDS &&
    parts.every((word) => INVITE_WORDS.includes(word))
  );
}

/**
 * Compares two codes without leaking, through timing, how much of a guess was
 * right. Both are normalised first, and the loop always runs the full length.
 */
export function codesMatch(a: string, b: string): boolean {
  const left = normaliseInviteCode(a);
  const right = normaliseInviteCode(b);
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

/** The code split for display, so a UI can show the words apart. */
export function codeWords(code: string): string[] {
  return normaliseInviteCode(code).split(CODE_SEPARATOR);
}
