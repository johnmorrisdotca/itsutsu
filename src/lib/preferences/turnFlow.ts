/**
 * HOW A TURN FEELS: whether a move is confirmed before it is sent, and where
 * submitting leaves you.
 *
 * Their own module rather than loose strings in the registry, because both are
 * read on the board and in the member's settings, and a value spelled two ways
 * is a preference that reads as unset on one of the two screens.
 */

/** Whether a board click sends the move or places it for confirming. */
export const MOVE_CONFIRM = { preview: "preview", straightAway: "straightAway" } as const;
export const MOVE_CONFIRM_LIST = [MOVE_CONFIRM.preview, MOVE_CONFIRM.straightAway] as const;
export type MoveConfirm = (typeof MOVE_CONFIRM_LIST)[number];

/**
 * Where a player lands after a move that ended their turn.
 *
 * `nextWaiting` is the default and has been the behaviour since the advance
 * shipped: John, playing a dozen games at once, "players should NEVER have to
 * hunt for the game that is waiting for a move... unless they choose an option
 * in the settings." This is that option, and the other three are the
 * destinations the elder sites put beside Save — GoldToken's board offers
 * "Save and go to next similar game" and "Save and return to my Gamesheet",
 * which are these two by their names there.
 *
 * `sameGame` means the next game waiting on you AT THE SAME GAME — Pente to
 * Pente, not Pente to Halma. That is what makes a session of twelve boards
 * bearable: one set of rules in your head at a time.
 */
export const AFTER_MOVE = {
  nextWaiting: "nextWaiting",
  sameGame: "sameGame",
  myGames: "myGames",
  stay: "stay",
} as const;
export const AFTER_MOVE_LIST = [
  AFTER_MOVE.nextWaiting,
  AFTER_MOVE.sameGame,
  AFTER_MOVE.myGames,
  AFTER_MOVE.stay,
] as const;
export type AfterMove = (typeof AFTER_MOVE_LIST)[number];
