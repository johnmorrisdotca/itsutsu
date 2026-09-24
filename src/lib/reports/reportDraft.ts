import { REPORT_LIMITS } from "./reports.constants";

/**
 * The page a report came from, as Sumilabu may be told it: the path alone.
 *
 * Everything after `?` or `#` goes, always. A query can carry a seat token, a
 * private link or somebody's name, and the contract says the service never
 * sees one. Done again on the server whatever the browser sent, since the
 * browser is not the one making the promise.
 */
export function cleanReportPath(asked: string): string {
  const path = asked.split(/[?#]/)[0]?.trim() ?? "";
  if (!path.startsWith("/")) return "/";
  return path.slice(0, REPORT_LIMITS.pathMax);
}

/**
 * A fresh opaque id for a browser that has none: random, and nothing else.
 * It lets Sumilabu count a repeat reporter, and cannot be turned back into a
 * person, an address or an account.
 */
export function newReporterRef(): string {
  return `r-${crypto.randomUUID()}`;
}
