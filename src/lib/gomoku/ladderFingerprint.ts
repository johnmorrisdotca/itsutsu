import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The files whose text decides how a GRADED computer player chooses a move:
 * the chooser, its knobs, the shared reading of a position and the families
 * it reads, the two searches, how a turn is enumerated, and the threat and
 * shape analysis the line search orders itself by.
 *
 * `expert/` is not here, with one exception: every grade's `expertise` is
 * empty, so a specialist's reading never decides a graded move — but the race
 * reading counts its distances with `expert/raceBoard.ts`, so that file is. The engine and the rules are not here
 * either — they decide what a move IS, not which one a player picks.
 *
 * Deliberately the whole text of each file, comments included. A comment edit
 * therefore silences the table until it is measured again, which is the safe
 * direction: a fingerprint that ignored some change to these files would let a
 * stale measurement through, and the table exists to never do that.
 */
export const LADDER_FINGERPRINT_FILES: readonly string[] = [
  "src/lib/gomoku/opponent.ts",
  "src/lib/gomoku/opponent.constants.ts",
  "src/lib/gomoku/opponentEval.ts",
  "src/lib/gomoku/opponentFamilies.ts",
  "src/lib/gomoku/opponentLook.ts",
  "src/lib/gomoku/opponentSearch.ts",
  "src/lib/gomoku/opponentTurns.ts",
  "src/lib/gomoku/analysis.ts",
  "src/lib/gomoku/analysis.constants.ts",
  "src/lib/gomoku/threats.ts",
  // The graded players' race reading counts its distances here.
  "src/lib/gomoku/expert/raceBoard.ts",
  // The opening book decides a grade's second and third stones.
  "src/lib/gomoku/opponentOpening.ts",
];

/** A short, stable hash over the files' paths and text, in the order given. */
export function fingerprintOf(sources: readonly { path: string; text: string }[]): string {
  const hash = createHash("sha256");
  for (const source of sources) {
    hash.update(`--- ${source.path}\n`);
    hash.update(source.text);
    hash.update("\n");
  }
  return hash.digest("hex").slice(0, 16);
}

/**
 * The current code's fingerprint, read from disk, or null when any of the files
 * cannot be read.
 *
 * READ AT BUILD TIME, NEVER IN A REQUEST. `next.config.ts` calls this once and
 * writes the answer into the bundle as LADDER_FINGERPRINT; a page asks
 * `builtLadderFingerprint()` for it. The alternative was naming these ten
 * files in `outputFileTracingIncludes` and hashing them on every render —
 * ten file reads and a SHA-256 per page view, repeated for an answer that
 * cannot change between two requests of the same deployment. That is the
 * shape AGENTS.md calls "no work repeated per request when nothing changed",
 * and it is billed as Active CPU.
 *
 * Null rather than a fingerprint of whatever could be read: a partial hash is a
 * value in range that matches nothing and means "unknown", and `measuredLadder`
 * already treats null as exactly that.
 *
 * NO `server-only` HERE, deliberately: `next.config.ts` imports this at build,
 * and `server-only` throws outside a React server context. Nothing in
 * `app/` or `components/` may import it — `ladderShown.coverage.test.ts`
 * fails the build if anything does, and `ladderFingerprint.built.ts` is what
 * a page asks instead.
 */
export function readLadderFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(
      LADDER_FINGERPRINT_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })),
    );
  } catch {
    return null;
  }
}
