/**
 * THE FINGERPRINT THIS DEPLOYMENT WAS BUILT FROM, and the only way a page
 * should ask for it.
 *
 * `next.config.ts` hashes `LADDER_FINGERPRINT_FILES` once, at build, and writes
 * the answer into the bundle under this name — the same trick the suite's poll
 * relief already uses. A page therefore costs nothing to answer "is the
 * measured table about the code that is running": no file reads, no hashing,
 * no work repeated per request for an answer that cannot change between two
 * requests of one deployment.
 *
 * Empty or unset is NULL, not "". A deployment built by something that did not
 * set it has not told us the fingerprint, and `measuredLadder` reads null as
 * "cannot be answered" and shows nothing — which is the safe direction. An
 * empty string would be a value that matches no row and looks deliberate.
 */
export function builtLadderFingerprint(): string | null {
  const built = process.env.LADDER_FINGERPRINT?.trim();
  return built ? built : null;
}
