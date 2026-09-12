/**
 * The words the screens around a shared game use.
 *
 * One module for the group rather than one per component, so that the setup
 * screen and the panel beside a board cannot come to call the same thing two
 * names — which is the fault this whole area was built to remove.
 */

/**
 * SETTLING A GAME BEFORE IT EXISTS, IN WORDS.
 *
 * Every way of starting a game on this site leads here now, and each arrives
 * knowing a different amount: the opponent, or the opponent and the rules, or
 * those and a position as well. The screen has to say WHICH of those it is, or
 * a reader cannot tell a fresh game from a rematch from a fork — they would all
 * be the same form with different numbers in it.
 */
export const SET_UP_COPY = {
  /** The heading and lead, where nothing but the opponent is known. */
  against: (who: string) => `Against ${who}`,
  againstHint: (who: string) =>
    `${who} is who you are playing. Choose the game and the rules, and the game is in their list the moment you start it — there is nothing for them to accept.`,
  /** The heading and lead for a game being played again. */
  again: (who: string) => `Play ${who} again`,
  // `who` is said, not merely accepted: a confirmation that does not name the
  // person is a confirmation of nothing. The spec that caught it asks for the
  // name here, and the signature had promised it all along.
  againHint: (who: string, colour: string) =>
    `The same board, the same rules and the same clock as last time against ${who}, with the colours swapped — you take ${colour}. Everything below is already filled in, so this is a confirmation; change anything you would rather play differently.`,
  /** Said when a rematch has been altered, because then it is not one. */
  againChanged:
    "You have changed something, so this starts a new game against the same player rather than a repeat of the last one. The colours are drawn the ordinary way: you open.",
  /** The heading and lead for a fork. */
  fork: (move: number) => `Play on from move ${move}`,
  forkHint: (move: number, who: string) =>
    `A second game from the position after move ${move}, against ${who}. Both games go on. The board, the game and the opening come with the position and cannot change; the clock and whether it counts are this game's own.`,
  forkAlone:
    "Nobody held the other seat in the game this comes from, so this is a board at one screen: start it and hand the other seat out from there.",
  /** What a handicap is for, where somebody is choosing one. */
  handicapHint:
    "One colour plays under extra restrictions and the other plays the plain game — how the elder sites let a stronger player give a weaker one a start. Leave it at none for an even game.",
  handicapOpen: (colour: string) =>
    `${colour} plays under every restriction switched on below; the other colour plays the game as it comes. Switch on only what you mean — each one makes ${colour.toLowerCase()}'s game harder.`,
  /**
   * SAID OUT LOUD WHEN A NAMED PLAYER IS NOT OFFERED AT THIS GAME.
   *
   * A specialist computer player plays one game — away from its own board it is
   * somebody else under another name and a different flag — so choosing another
   * game drops it from the list of players offered. The screen then falls back to
   * posting a seat for anyone, which is the right fallback and a terrible
   * surprise: somebody who pressed Play on one program would get a seat posted
   * to the noticeboard and no hint that they had.
   *
   * So it says which. This is the shape the lobby sentence already had a rule
   * about — fall back, and say you have.
   */
  notAtThisGame: (who: string, game: string) =>
    `${who} does not play ${game}, so this would post a seat for anyone instead. Change the game back, or pick somebody else.`,
  /** Said where the opponent came in on the address rather than being chosen. */
  opponentFixed: "Asked for from their page. Change it here if you meant somebody else.",
  /** The way back out of a pre-filled screen to a blank one. */
  startOver: "Set a game up from scratch instead",
} as const;
