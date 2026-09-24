import { ADMIN_SESSION_DAYS, PLAYER_SESSION_DAYS, type Session } from "./session";

/**
 * THE TWO QUESTIONS ASKED BEFORE A MEMBER REMOVES THEIR OWN ACCOUNT, pure so
 * the route and its tests read the same rule (PRIV-04).
 *
 * Removal cannot be taken back, so it is not one press. The member types
 * their own name, or the word below when they have none, and a Google account
 * signs in again first: a phone left signed in on a shared table is not the
 * member asking.
 */

/** Typed instead of a name, for an account that has none. */
export const REMOVE_CONFIRM_WORD = "remove";

/** How recent a Google sign-in has to be for it to count as the member asking now. */
export const FRESH_SIGN_IN_MINUTES = 10;

/** What the member must type: their name, or the word when the account has none. */
export function removalPhrase(name: string): string {
  const trimmed = name.trim();
  return trimmed === "" ? REMOVE_CONFIRM_WORD : trimmed;
}

/** Whether what was typed is that phrase — spaces round it and letter case forgiven, nothing else. */
export function removalConfirmed(typed: string, name: string): boolean {
  return typed.trim().toLowerCase() === removalPhrase(name).toLowerCase();
}

/**
 * When the cookie was minted, in seconds since the epoch.
 *
 * A session carries only its expiry, and every session is minted for exactly
 * its kind's lifetime (`expiryInDays` at sign-in, in `/api/session` and
 * `/api/session/google`), so the lifetime taken off the expiry is the moment
 * of signing in.
 */
export function sessionIssuedAt(session: Pick<Session, "kind" | "exp">): number {
  const days = session.kind === "admin" ? ADMIN_SESSION_DAYS : PLAYER_SESSION_DAYS;
  return session.exp - days * 24 * 60 * 60;
}

/**
 * Whether this session may remove its account without signing in again. An
 * account with no address has no Google to sign in with, and its one cookie is
 * the whole account, so it may; a Google account may when the sign-in was in
 * the last few minutes.
 */
export function signedInRecently(session: Pick<Session, "kind" | "exp" | "email">, nowMs = Date.now()): boolean {
  if (!session.email) return true;
  return nowMs / 1000 - sessionIssuedAt(session) <= FRESH_SIGN_IN_MINUTES * 60;
}
