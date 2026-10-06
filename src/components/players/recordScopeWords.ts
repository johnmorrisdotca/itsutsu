import type { Speaker } from "@/lib/i18n/i18n";

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
export function blankOf(played: number | undefined, say: Speaker): string {
  if (played === 0) return say.say("players.blankNoGames");
  return say.say("players.blankNoRun");
}

/**
 * The three answers a record's own hover sentences are built from — which
 * games, against whom, rated or not — read once from `of` so `streakCounts`
 * and `playedScopeNote` cannot describe the same row two different ways.
 */
/** The games a count covers, as one noun phrase in the reader's language: "rated games of this one game against the bots". */
function scopeWhat(of: RecordOf, say: Speaker): string {
  return say.say("players.scopeWhat", {
    rated: of.rated === "yes" ? say.say("players.rated") : of.rated === "no" ? say.say("players.friendly") : "",
    game: of.variant === undefined ? "" : say.say("players.oneGame"),
    pool: of.pool === "computer" ? say.say("players.againstBots") : of.pool === "people" ? say.say("players.againstPeople") : "",
  });
}

export function streakCounts(of: RecordOf, say: Speaker): string {
  if (of.here === false) return say.say("players.streakElsewhere");
  const what = scopeWhat(of, say);
  return of.player === undefined || of.player === "" ? say.say("players.streakCounts", { what }) : say.say("players.streakCountsBy", { what, player: of.player });
}

/** What the Played column counts, as a hover note: not every finished game, where the table is narrowed. */
export function playedScopeNote(of: RecordOf, say: Speaker): string {
  if (of.here === false) return say.say("players.playedElsewhere");
  return say.say("players.playedCounts", { what: scopeWhat(of, say) });
}
