/**
 * rating.*: ratings: what a tier, a pool and a streak mean, and why a game does not count (`src/lib/rating/`). A name is the English label beside its `kanji`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_RATING = {
  // A tier's note, beside its name
  "rating.tierUnratedNote": "Fewer than four rated games.",
  "rating.tierProvisionalNote": "Still finding its level; moves quickly.",
  "rating.tierEstablishedNote": "Twenty rated games or more.",
  // A run of results, for a hover note
  "rating.streakWon": "{count} won in a row.",
  "rating.streakLost": "{count} lost in a row.",
  "rating.streakDrawn": "{count} drawn in a row.",
  // A game that cannot be rated: the verdict, then the reason
  "rating.refusedWord": "Will not count",
  "rating.willNotCount": "This game will not count",
  "rating.didNotCount": "This game did not count",
  "rating.refusalUnnamed": "A seat here has no name on it, so there is nobody for the result to belong to. A name on both seats is what makes a game count.",
  "rating.refusalUnnamedShort": "Will not count — a seat has no name",
  "rating.refusalOnePlayer": "Both seats are the same player. A rating says how two people compare, and there is only one person here — so the game is filed and replayed like any other, but no rating moves.",
  "rating.refusalOnePlayerShort": "Will not count — one player",
  "rating.refusalKeptRecord": "One of these names belongs to a record kept from before this site, which nobody plays under here. The game is filed, but the ladder is left alone.",
  "rating.refusalKeptRecordShort": "Will not count — a kept record",
  "rating.refusalHotSeat": "Both seats were played from one screen, so there is no way to tell the two of you apart from a login. A rating is an exchange between two separate players, and hot-seat play cannot give the site one — however the two names read.",
  "rating.refusalHotSeatShort": "Will not count — one screen",
  "rating.refusalHandicap": "One side took a handicap, so the two of you are not playing by the same rules. A rating is an exchange between two players on equal terms, and a handicap game cannot give the site one — so it is filed and replayed like any other, but no rating moves.",
  "rating.refusalHandicapShort": "Will not count — a handicap",
  "rating.refusalHeadStart": "One side has a head start, so the two of you are not playing on equal terms. A rating is an exchange between two players on equal terms, and a head-start game cannot give the site one — so it is filed and replayed like any other, but no rating moves.",
  "rating.refusalHeadStartShort": "Will not count — a head start",
} as const;
