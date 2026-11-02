/** The `Cache-Control` values the API sends: a table of a protocol's directives (RFC 9111, RFC 5861), not the site's sentences. */

/**
 * Kept by the browser, never used without asking first, and never by anything
 * between: for an answer that carries an `ETag`, so the next ask can be
 * answered 304 rather than sent again. `private` keeps it out of Vercel's
 * cache, where one reader's copy could be served to another.
 */
export const REVALIDATE = { "Cache-Control": "private, no-cache" } as const;

/** A board in someone else's page can afford to be a few seconds stale. */
export const EMBED_SUMMARY_CACHE = { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } as const;

/** Keystroke traffic; a few seconds of reuse costs nothing and helps a lot. */
export const SUGGESTIONS_CACHE = { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" } as const;
