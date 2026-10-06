/**
 * pages.*: the small pages of the site that have only a few words each (ENJA-10): the dice roller's page, the history
 * page's description, what's new, and the narrowing chip on My games. The release notes themselves stay English: they are
 * a record, written in the same commit as the work.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_PAGES = {
  // My games, narrowed to one person
  "pages.gamesWith": "Games with",
  "pages.everyGame": "every game",

  // The dice roller's page
  "pages.diceTitle": "Dice roller",
  "pages.diceDescription": "Tap to roll one to ten dice, d4 to d100, with a bonus, advantage or disadvantage: the total, the exact odds, your roll history and your stats.",
  "pages.diceIntro": "Korokoro {kanji}, the sound of dice tumbling: tap the felt to roll one to ten dice, from a d4 to a d100, and read the odds of what you threw. Your rolls stay on this device.",
  "pages.diceAbout": "Every roll comes from your device's cryptographic generator, so nobody, this site included, can predict or steer it; choose a seed under Randomness when a table wants to check a roll. Korokoro is open source under the MIT licence, on {github} and npm as {package}, for any site or game that wants dice.",

  // The game history page
  "pages.historyDescription": "Every game played, with the stones in the order they were laid.",

  // What's new
  "pages.releasesTitle": "What's new",
  "pages.releasesLead": "Newest first, in a player’s words. Read from the changelog itself, which is written in the same commit as the work, so this list cannot fall behind the site it describes. The edition you are being served is marked.",
  "pages.releasesNote": "Every game is on {link}, and how each is played is under the game itself.",
  "pages.releasesOnePage": "one page",
  "pages.releasesUnreadable": "The release history could not be read.",
  "pages.releases.one": "{count} release",
  "pages.releases.other": "{count} releases",
  "pages.releasesOlder": "Older releases ({count})",
  "pages.thisEdition": "This edition",
  "pages.running": "running {version}",
  "pages.hideTime": "Hide the time",
  "pages.showTime": "Show the time",
  "pages.released": "Released {when}",
} as const;
