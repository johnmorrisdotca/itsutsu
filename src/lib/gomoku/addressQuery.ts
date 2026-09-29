// Relative imports only: the browser specs import the address builders, and Playwright resolves no alias.

/**
 * An address and more of its query: joined with "?" or "&" as the address
 * already has one or not. Every address that may carry a setting is extended
 * through this, so "/games/gomoji/play?language=french" and "?size=5" become
 * one query rather than two.
 */
export function joinQuery(path: string, query: string): string {
  const rest = query.startsWith("?") || query.startsWith("&") ? query.slice(1) : query;
  if (rest === "") return path;
  return `${path}${path.includes("?") ? "&" : "?"}${rest}`;
}
