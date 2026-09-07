/**
 * Who counts as the operator.
 *
 * The allowlist is an environment variable, as in the sibling projects, so
 * adding or removing an operator is a deployment setting rather than a code
 * change. An empty or missing list means nobody is an operator — the same
 * fail-closed rule the delete route already follows.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/** True when the deployment has an operator configured at all. */
export function hasAdmin(): boolean {
  return adminEmails().length > 0 && Boolean(process.env.ADMIN_TOKEN?.trim());
}

/**
 * Whether an email and token together identify the operator.
 *
 * The token comparison is length-safe and constant-time, so a wrong token
 * cannot be narrowed down by timing. Both halves must be right; knowing the
 * email alone gets nowhere.
 */
export function isOperatorLogin(email: string, token: string): boolean {
  if (!isAdminEmail(email)) return false;

  const expected = process.env.ADMIN_TOKEN?.trim() ?? "";
  if (expected.length === 0 || token.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ token.charCodeAt(index);
  }
  return difference === 0;
}
