import { isAdminEmail } from "../src/lib/auth/admin";

/**
 * Who the browser suite is when it signs in as the operator — and why that is
 * nobody.
 *
 * It used to be "the first address in `ADMIN_EMAILS`", which is right in CI and
 * wrong on every developer's machine: there the first address is the site
 * owner's, so the whole suite signed in as his real member row on the shared
 * database and wrote to it. Found in one night, all one cause: the profile
 * specs left a test city and bio on his profile, a test Chromium moved his time
 * zone from Tokyo to Vancouver, a spec's games against Dan landed on his ladder
 * row, and a seat another spec claimed was filled in with his name.
 *
 * So the operator is a test identity everywhere, whatever a developer's `.env`
 * lists: `operator@example.test` unless `E2E_OPERATOR_EMAIL` names another
 * `@example.test` address. The setup makes its row, stamps it as the suite's
 * own, and sweeps it with the rest of the suite's members on the next run.
 *
 * **It refuses rather than falls back.** An address outside `@example.test`
 * could be a real person's, and an address the dev server does not treat as the
 * operator would sign the suite in as nobody and fail forty specs somewhere
 * else. Either way the honest answer is a failure that names the fix, before a
 * single row is written — never a quiet guess at somebody else's account.
 *
 * Every spec that needs the operator's address reads it from here, never from
 * `ADMIN_EMAILS` and never from a literal.
 */

/** Who the suite signs in as when nothing says otherwise. CI's `.env` lists the same address. */
export const DEFAULT_OPERATOR_EMAIL = "operator@example.test";

/** The name the operator's row is made with. Specs rename it; the next run's sweep takes the row away. */
export const OPERATOR_NAME = "Operator";

/** Reserved for documentation and testing, so no real person can hold an address in it. */
const TEST_ADDRESS = /^[^@\s]+@example\.test$/;

export type SuiteOperator = { email: string; name: string };

/**
 * Why the suite must not sign in as `email`, or null when it may.
 *
 * Asked against this process's environment, which is read from the same `.env`
 * the dev server reads — so "is it an admin" is the dev server's own answer,
 * through the dev server's own function.
 */
export function operatorRefusal(email: string): string | null {
  if (!TEST_ADDRESS.test(email)) {
    return [
      `The browser suite refuses to sign in as "${email}": it is not an @example.test address.`,
      "Every spec signed in as the operator writes to that account (its name, profile, time zone,",
      "preferences, ratings and games), and the setup deletes and remakes it on every run, so it",
      "must be an identity no real person holds.",
      `Fix: remove E2E_OPERATOR_EMAIL (the suite then signs in as ${DEFAULT_OPERATOR_EMAIL}),`,
      "or set it to another @example.test address.",
    ].join("\n");
  }
  if (!isAdminEmail(email)) {
    return [
      `The browser suite refuses to sign in as "${email}": it is not in ADMIN_EMAILS, so the dev`,
      "server would not treat it as the operator.",
      `Fix: add it to the END of ADMIN_EMAILS in this checkout's .env, e.g.`,
      `ADMIN_EMAILS="you@example.com,${email}", then restart the dev server, which reads .env`,
      "when it starts. See .env.example. Never add it to a deployed environment.",
    ].join("\n");
  }
  return null;
}

let known: SuiteOperator | null = null;

/** The suite's operator, or a thrown refusal that says what to change. */
export function suiteOperator(): SuiteOperator {
  if (known !== null) return known;
  // The dev server reads .env itself; this process has to be told, as members.ts is.
  process.loadEnvFile(".env");
  const email = (process.env.E2E_OPERATOR_EMAIL ?? "").trim().toLowerCase() || DEFAULT_OPERATOR_EMAIL;
  const refusal = operatorRefusal(email);
  if (refusal !== null) throw new Error(refusal);
  known = { email, name: OPERATOR_NAME };
  return known;
}
