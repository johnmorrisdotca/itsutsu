import "server-only";

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";


/**
 * Google sign-in: the front door.
 *
 * Google proves an address; it does not decide who is let in. Any verified
 * account may complete the sign-in here, and /api/session/google then asks
 * the only question that matters — is this address the operator, or a member
 * who was once invited? — before it issues the cookie the gate reads. So a
 * stranger with a Google account gets as far as the door and a request for
 * an invite code, and no further.
 *
 * An invite code alone still works, for a phone with no account on it.
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
     * Identity only. Membership is decided at /api/session/google, where the
     * site's own cookie is minted, so that admitting or removing somebody
     * takes effect on their next visit rather than when a Google session
     * happens to lapse.
     */
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const email = (profile as { email?: string; email_verified?: boolean }) ?? {};
      // An unverified Google address proves nothing about who holds it.
      if (email.email_verified === false) return false;
      return typeof email.email === "string" && email.email.length > 0;
    },
  },
  secret: secret ?? undefined,
};
