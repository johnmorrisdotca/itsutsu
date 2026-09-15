import type { RecordOf } from "./recordTable.types";

/*
 * THE SENTENCES A RECORD SAYS ABOUT ITSELF ON HOVER: what a blank streak means,
 * which games a run is over, and what a table's Played counts.
 *
 * Split out of `PlayerRecord.tsx` when it reached the file-size gate. Pure — an
 * `of` in, a sentence out — while that file draws the cells these sentences sit
 * on. `PlayerRecord.tsx` re-exports `playedScopeNote`, so its import path is
 * unchanged.
 */

/**
 * What an em dash MEANS here, which is three different things.
 *
 * It said "No finished games to make a streak of yet" for all of them, and on
 * a row showing 511 games that is simply untrue. A cell that cannot answer has
 * to say so honestly — never claim a reason it does not know, and never claim
 * the reason that happens to read best.
 */
export function blankOf(played: number | undefined): string {
  if (played === 0) return "No finished games yet, so there is no run to show.";
  return "No run recorded for this row.";
}

/**
 * The three answers a record's own hover sentences are built from — which
 * games, against whom, rated or not — read once from `of` so `streakCounts`
 * and `playedScopeNote` cannot describe the same row two different ways.
 */
function scopeWords(of: RecordOf): { games: string; pool: string; rated: string } {
  return {
    games: of.variant === undefined ? "games" : "games of this one game",
    pool:
      of.pool === "computer"
        ? " against the computer players"
        : of.pool === "people"
          ? " against other people"
          : "",
    rated: of.rated === "yes" ? "rated " : of.rated === "no" ? "friendly " : "",
  };
}

/**
 * WHICH GAMES THIS RUN IS OVER, said out loud on every streak on the site.
 *
 * A streak is the one figure in the row that cannot be checked by looking. The
 * counts beside it link to the games they counted, so a reader can open them
 * and see; a run is a single number with no way to inspect it. So it has to
 * SAY what it is about, and it says it from the same `of` the counts are
 * filtered by — which means the sentence and the links cannot drift apart.
 *
 * It earned this the day the PLAYED column changed meaning. That column was
 * counting rated games under a heading that says played, and when it was fixed
 * to count every finished game a streak over rated games alone became a second
 * number on the same row that nobody could reconcile with the first. Whichever
 * way that goes, a run that names its own set is a run a reader can still trust.
 */
export function streakCounts(of: RecordOf): string {
  /*
   * `here: false` says the COUNTS beside this reach beyond Itsutsu — a kept
   * record copied down from another site. It does not say that about the run,
   * and cannot: a run is an order, and another site's figures are four totals
   * with no order in them. So the sentence says what the run is over rather
   * than repeating what the counts are over, which is the distinction the
   * rating column already makes on the same rows.
   */
  if (of.here === false) return "A run is only ever counted from games played here.";
  const { games, pool, rated } = scopeWords(of);
  const whose = of.player === undefined || of.player === "" ? "" : ` by ${of.player}`;
  return `Over the ${rated}${games}${pool} finished here${whose}, most recent first.`;
}

/**
 * WHAT "PLAYED" COUNTS HERE, said on hover from the same `of` the numbers
 * under it are filtered by — the same idea `streakCounts` already keeps,
 * for the same reason: a table's heading and its cells must not be able to
 * drift into describing two different sets of games.
 *
 * `RecordHeadings` draws one "Played" heading for every table on the site,
 * and it does not always mean the same thing under it: the site ladder counts
 * rated games in one pool, a member's own page counts every finished game in
 * either. For the same person that was 5 against 14, one click apart, with
 * nothing on either page saying so. `RecordTable`'s `playedScope` is optional
 * and most callers leave it unset — "every finished game" needs no footnote —
 * so this only has something to say where a table's Played is narrower than
 * that.
 */
export function playedScopeNote(of: RecordOf): string {
  if (of.here === false) return "Counted on another site — no games here to open.";
  const { games, pool, rated } = scopeWords(of);
  return `Counts the ${rated}${games}${pool}, finished here.`;
}
