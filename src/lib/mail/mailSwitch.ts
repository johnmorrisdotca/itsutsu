import type { MailEnv, MailRefusal } from "./mail.types";

/**
 * Whether this deployment may send email at all, before anything is counted.
 *
 * FAILS CLOSED. Mail goes out only from the production deployment, and only
 * with a key. Development, the test runner and a Vercel preview all answer
 * `not-production` — a preview carries production's code and must not carry
 * its sending — and a production deployment nobody has given a key answers
 * `no-key`. Null is the only answer that lets a send go on.
 *
 * Also what the invitation panel asks before it offers to email anything, so
 * a form is never drawn that could only ever fail.
 */
export function mailRefusalFor(env: MailEnv): Extract<MailRefusal, "not-production" | "no-key"> | null {
  if (env.NODE_ENV !== "production") return "not-production";
  if (env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== "production") return "not-production";
  if ((env.RESEND_API_KEY ?? "").trim() === "") return "no-key";
  return null;
}
