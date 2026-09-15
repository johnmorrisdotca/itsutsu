/**
 * How far above the longest stall a real game reached the cap should sit.
 *
 * Twenty, because it is the margin the other race and sliding games already
 * carry over what was measured for them in `rules/noProgress.ts`: Halma 400
 * over a longest idle run of 18, Checkers 80 over 4, squareFour 4000 over 232.
 * A cap ten times too generous ends a shuffle a little later; a cap slightly
 * too tight takes a win off somebody who was about to make it.
 */
export const STALL_MARGIN = 20;

/** A suggested cap is rounded up to a multiple of this, so it reads as a chosen number rather than an artefact. */
export const STALL_ROUND_TO = 50;

/** The caps the report checks every game against, beside the one in force. */
export const STALL_CANDIDATE_CAPS: readonly number[] = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800];

/**
 * The runner's defaults, each overridable from the environment.
 *
 * CEILING: plies before a game with the rule lifted is stopped and filed as
 * unfinished. The same pairings that finish in hundreds of plies are the ones
 * this is about, and a game still going at three thousand is a random walk.
 *
 * EACH: games per ordered pairing. Colours are ordered pairs already, so every
 * grade plays each other grade from both seats.
 */
export const STALL_DEFAULT_CEILING = 3000;
export const STALL_DEFAULT_EACH = 2;
export const STALL_DEFAULT_SEED = 20260914;
