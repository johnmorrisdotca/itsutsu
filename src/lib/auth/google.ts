import "server-only";

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { isAdminEmail } from "./admin";

/**
 * Google sign-in, for the operator.
 *
 * This does not open the site to anyone with a Google account — that would
 * undo the invite gate entirely. It is a better-authenticated way into the
 * *operator* seat than an email and a shared token: the same ADMIN_EMAILS
 * allowlist decides who is let in, and Google decides whether they really are
 * that address.
 *
 * Players still arrive by invite code, which needs no account at all.
 *
 * The env names mirror the sibling projects, with the same fallbacks, so a
 * secret can be copied between them without being renamed.
 */
function firstEnv(names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

const clientId = firstEnv(["AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"]);
const clientSecret = firstEnv(["AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"]);
const secret = firstEnv(["AUTH_SECRET", "NEXTAUTH_SECRET"]);

/** False when no credentials are set, so the UI can hide a button that cannot work. */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(clientId && clientSecret && secret);
}

export const authOptions: NextAuthOptions = {
  providers:
    clientId && clientSecret
      ? [
          GoogleProvider({
            clientId,
            clientSecret,
            // Always ask which account, rather than silently reusing one.
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : [],
  session: { strategy: "jwt" },
  pages: { signIn: "/join", error: "/join" },
  callbacks: {
    /*
     * The allowlist is enforced here, at sign-in, rather than only when an
     * operator route is reached. Someone who is not on it never gets a
     * session at all, so there is nothing to leak and nothing to revoke.
     */
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const email = (profile as { email?: string; email_verified?: boolean }) ?? {};
      // An unverified Google address proves nothing about who holds it.
      if (email.email_verified === false) return false;
      return isAdminEmail(email.email);
    },
  },
  secret: secret ?? undefined,
};
