/**
 * catalogue.*: the figures under every game and family on /games.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_CATALOGUE = {
  /*
   * The figures under every game and family on /games — John: "making these
   * pages a little more statistically interesting". A count of games says one
   * and many as two phrases, because a language that makes the difference
   * needs both and one that does not (Japanese) answers both the same.
   *
   * "last played" needs no singular: `sinceLastPlayed` says one day as
   * "yesterday" and never counts a single month or year.
   */
  "catalogue.playedOne": "{count} game played",
  "catalogue.playedMany": "{count} games played",
  "catalogue.nobodyYet": "Nobody has played this yet",
  "catalogue.beFirst": "Be the first to play →",
  "catalogue.beFirstStranger": "Reading is free — join to be the first to play it →",
  "catalogue.topPlayer": "Top player",
  "catalogue.poolPeople": "among people",
  "catalogue.poolComputer": "against bots",
  "catalogue.topMeansPeople":
    "The top of this game's ladder among people: rated games between members, best rating first. The record is won–lost–drawn on that ladder.",
  "catalogue.topMeansComputer":
    "Nobody holds a standing among people yet, so this is the top of the ladder against the bots — a separate ladder, never added to the people's. The record is won–lost–drawn on that ladder.",
  "catalogue.noStanding": "No rated games yet",
  "catalogue.joinToSeeWho": "Join to see who →",
  /** The way into a game of it, from its card on the catalogue. */
  "catalogue.play": "Play →",
  "catalogue.standings": "Leaderboard →",
  "catalogue.wonTitle": "The rated games they won on this ladder",
  "catalogue.lostTitle": "The rated games they lost on this ladder",
  "catalogue.drawnTitle": "The rated games they drew on this ladder",
  "catalogue.lastToday": "Last played today",
  "catalogue.lastYesterday": "Last played yesterday",
  "catalogue.lastDays": "Last played {count} days ago",
  "catalogue.lastMonths": "Last played {count} months ago",
  "catalogue.lastYears": "Last played {count} years ago",
  "catalogue.familyPlayedOne": "{count} game played across the family",
  "catalogue.familyPlayedMany": "{count} games played across the family",
  "catalogue.familyTried": "{played} of {total} tried here",
  "catalogue.crownsHeld": "Most crowns",
  "catalogue.crownCount": "{count} of {total}",
  "catalogue.crownMeans":
    "A crown is the top of one game's ladder, as that game shows it. This player tops more of this family's games than anybody else.",
  "catalogue.crownsShared": "Crowns shared by {count} players",
} as const;
