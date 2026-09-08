/**
 * Where the door is allowed to send someone afterwards.
 *
 * `next` comes from a query string, so it is attacker-controlled, and a check
 * of `startsWith("/")` is not enough to keep it on this site. A browser reads
 * `//evil.test` as protocol-relative and `/\evil.test` the same way, so both
 * pass that test and both resolve off-site — which turns the sign-in page into
 * an open redirect, the classic way a phishing link borrows a real domain's
 * credibility.
 *
 * So a destination must begin with exactly one slash, and the character after
 * it must be neither a slash nor a backslash. Anything else becomes "/".
 */
/** Newcomers land in the lobby — the calm entrance — rather than mid-board. */
export const DEFAULT_DESTINATION = "/games";

export function safeDestination(next: string | null | undefined): string {
  if (!next) return DEFAULT_DESTINATION;
  if (!next.startsWith("/")) return DEFAULT_DESTINATION;
  // Rejects "//host" and "/\host", both of which browsers send off-site.
  if (next.length > 1 && (next[1] === "/" || next[1] === "\\")) {
    return DEFAULT_DESTINATION;
  }
  return next;
}
