/**
 * HOW A SOLVE WAS HELPED, and what that costs it. One column on the solve
 * (`PuzzleSolve.helped`), read the same way by everything that counts, scores
 * or ranks solves. John, 2026-09-26, of a Cheat button that draws one line:
 * "Then maybe that is OK" — a helped solve is still a solve; it simply is not
 * the same achievement as one made unaided.
 *
 *  - `cheated`: Cheat drew a line. Solved, and it opens what a solve opens.
 *  - `explosionsSoft`: a level with explosions, played with them softened.
 *    Solved, and it opens what a solve opens.
 *  - `explosionsOff`: a level with explosions, played with none. Solved, but it
 *    opens no next block: the block's lesson was not played.
 *
 * All three score no points (so no IP, which is read from points), stay off
 * every fastest table and out of the feed's "a new best time", and say so
 * wherever the solve is shown. Experience is still paid: the time was spent.
 * One help is kept per solve; where two were used, the one that costs more
 * (`strongestHelp`).
 */
export const SOLVE_HELPS = { cheated: "cheated", explosionsSoft: "explosionsSoft", explosionsOff: "explosionsOff" } as const;

export type SolveHelp = (typeof SOLVE_HELPS)[keyof typeof SOLVE_HELPS];

export const SOLVE_HELP_LIST: readonly SolveHelp[] = [SOLVE_HELPS.cheated, SOLVE_HELPS.explosionsSoft, SOLVE_HELPS.explosionsOff];

/** The help in a few words, for a list of the help a solve took beside its checks and hints. */
export const SOLVE_HELP_WORDS: Record<SolveHelp, string> = {
  cheated: "Cheat drew a line",
  explosionsSoft: "explosions softened",
  explosionsOff: "explosions off",
};

/** What a helped solve says about itself, wherever it is shown. */
export const SOLVE_HELP_SAYS: Record<SolveHelp, string> = {
  cheated: `Helped: ${SOLVE_HELP_WORDS.cheated}`,
  explosionsSoft: `Helped: ${SOLVE_HELP_WORDS.explosionsSoft}`,
  explosionsOff: `Helped: ${SOLVE_HELP_WORDS.explosionsOff}`,
};

/** Whether a solve with this help (or none) opens what a solve opens: every help but explosions off. */
export function helpOpensOn(help: SolveHelp | null): boolean {
  return help !== SOLVE_HELPS.explosionsOff;
}

/** The help a solve is kept with when more than one was used: the one that costs more. */
export function strongestHelp(helps: readonly (SolveHelp | null)[]): SolveHelp | null {
  for (const help of [SOLVE_HELPS.explosionsOff, SOLVE_HELPS.cheated, SOLVE_HELPS.explosionsSoft] as const) if (helps.includes(help)) return help;
  return null;
}

/** A help read from a stored or sent value; null for none or for anything that is not one. */
export function solveHelpOf(value: unknown): SolveHelp | null {
  return (SOLVE_HELP_LIST as readonly unknown[]).includes(value) ? (value as SolveHelp) : null;
}
