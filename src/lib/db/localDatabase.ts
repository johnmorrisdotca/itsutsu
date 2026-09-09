/**
 * Whether a connection string names a database on this machine.
 *
 * The end-to-end suite tidies up after itself by deleting rows, and the
 * connection string it sees is whatever happens to be exported — from a
 * developer's shell, from a worktree, from CI. This predicate is the only
 * thing standing between a stray DATABASE_URL and a deletion against the real
 * site, so it lives here, in the tested half of the repository, rather than
 * beside the code that calls it.
 *
 * It answers false for anything it cannot parse. A guard that treats "I do
 * not understand this" as "go ahead" is not a guard.
 */
export function isLocalDatabase(url: string | undefined | null): boolean {
  if (url === undefined || url === null || url === "") return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
