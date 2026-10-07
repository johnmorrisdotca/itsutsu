/**
 * WHERE THE CACHED COPY OF A PAGE LIVES, AND HOW TO SAY WHERE A READER IS.
 *
 * A reader with no session who asks for one of the open pages is answered from
 * a copy kept for an hour (`strangerRewrite.ts`), and that copy is a route of
 * its own under this prefix. The address in the reader's bar never changes —
 * the gate rewrites it on the way in — so the one thing that can tell the two
 * apart is `usePathname()`. Next documents that inside a page drawn ahead of
 * time it can say the ROUTE the copy was drawn at rather than the address the
 * browser holds ("Avoid hydration mismatch with rewrites", in its docs for the
 * hook): `/stranger/games/gomoku` on the server and `/games/gomoku` in the
 * browser, which would make a menu that marks the page it is on disagree with
 * itself at hydration. Measured on 16.3.8 with `next start` the server says the
 * address it was asked for, but that is the version's choice and not a promise,
 * and a platform's router may answer otherwise. `sitePathOf` is the one answer
 * both sides give whichever it is.
 *
 * Plain values, no imports: a client component reads it, and so does the gate.
 */
export const STRANGER_PREFIX = "/stranger";

/**
 * How a request to the suite's own server asks for the kept copy. That server
 * answers every open page live unless asked, because the suite seeds a game
 * and reads the page as a stranger in the same minute, and a copy an hour old
 * would make each of those a test about the cache (`strangerRewrite.ts`, and
 * the same rule for the catalogue's figures in `publicCatalogueStats.ts`).
 * `e2e/stranger-cache.spec.ts` sends it. It does nothing anywhere else.
 */
export const ASK_FOR_KEPT_COPY = "x-itsutsu-kept-copy";

/** The address a reader sees, whichever of the two routes drew the page. */
export function sitePathOf(pathname: string): string {
  if (pathname === STRANGER_PREFIX) return "/";
  if (pathname.startsWith(`${STRANGER_PREFIX}/`)) return pathname.slice(STRANGER_PREFIX.length);
  return pathname;
}
