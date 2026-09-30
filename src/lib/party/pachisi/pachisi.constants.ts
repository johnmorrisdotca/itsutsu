// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.

/** Squares round the shared track: seventeen along each arm of the cross. The party game's one "board size". */
export const PACHISI_TRACK = 68;

/** Squares along one arm of the cross, out and back. */
export const PACHISI_ARM = 17;

/** Where each arm's entry square is along it: the fifth square out from the arm's end. */
export const PACHISI_ENTRY_AT = 4;

/** A pawn waiting in its nest. */
export const PACHISI_NEST = -1;

/** The last square of the shared track a pawn reaches before its own home path: sixty-three on from its entry, its own arm's end. */
export const PACHISI_LAST_TRACK = 63;

/** Squares of a player's own home path, up its arm's middle. */
export const PACHISI_HOME_PATH = 7;

/** Home: the middle of the cross. */
export const PACHISI_HOME = PACHISI_LAST_TRACK + PACHISI_HOME_PATH + 1;

/** Pawns a player races home. */
export const PACHISI_PAWNS = 4;

/** The die that enters a pawn, alone or as two dice together. */
export const PACHISI_ENTER = 5;

/** What a capture earns, and a pawn brought home: moves for any one pawn. */
export const PACHISI_CAPTURE_BONUS = 20;
export const PACHISI_HOME_BONUS = 10;

/** Doubles in a turn: after each the player throws again, and the third sends their leading pawn back. */
export const PACHISI_DOUBLES_LIMIT = 3;

/** Where along each arm a pawn is safe from capture: its entry square, the one seven on, and the arm's end. */
export const PACHISI_SAFE_ALONG: readonly number[] = [PACHISI_ENTRY_AT, 11, 16];

/** Which arm of the cross each seat starts from, by the number at the table: opposite arms for two. */
export const PACHISI_ARMS: Record<number, readonly number[]> = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };

export const PACHISI_FEWEST = 2;
export const PACHISI_MOST = 4;
