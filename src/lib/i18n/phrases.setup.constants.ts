/**
 * setup.*: the set-up screen's opening, rating and opponent choices.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_SETUP = {
  /*
   * The set-up screen's last three choices, which were dropdowns and are
   * tiles: the opening, whether the game counts, and who it is against. The
   * names on the tiles are the domain's own copy (`OPENING_DISPLAY`,
   * `BOT_PROFILES`); these are the words around them.
   */
  "setup.opening": "Opening",
  "setup.ratings": "Ratings",
  "setup.rated": "Rated",
  "setup.ratedMeans": "The result moves both players' ratings.",
  "setup.friendly": "Friendly",
  "setup.friendlyMeans": "Played for its own sake. No rating moves.",
  "setup.opponent": "Opponent",
  "setup.anyoneMeans": "Whoever comes along first takes the other seat.",
  "setup.askedFor": "Asked for",
  "setup.hereNow": "Online now",
  "setup.playersYouKnow": "Players you know",
  "setup.theComputer": "Bots",
  "setup.showAll": "Show all {count}",
  "setup.showFewer": "Show fewer",
  /*
   * The line on a game's chip when the family showing it is not its home —
   * "also under Flips" — so a game on two shelves reads as meant. The home
   * family's name fills {family}, in the reader's own script.
   */
  "setup.alsoUnder": "also under {family}",
} as const;
