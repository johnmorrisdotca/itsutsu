/**
 * rivalry.*: the head-to-head scoreboard between two members.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_RIVALRY = {
  /*
   * The rivalry scoreboard: two members' record against each other, above the
   * list of their games and on a match before and after it is played.
   *
   * TWO FORMS OF EVERY LINE, `.you` and `.named`, and that is a rule rather
   * than a style. "You" is said only to a reader who is one of the two; anybody
   * else signed in reads both names, because "You lead Dan" on a page about two
   * other people is a sentence about the wrong person.
   *
   * COUNTS: this dictionary has no plural mechanism, only `{placeholders}`, so a
   * count that can be one has a key per form — `.one` and `.other` — and every
   * language answers both. The rest never meet a one: a run worth naming starts
   * at three and a gap at six months, so "{count} times" and "{count} months"
   * are always plural in English. A year is the exception, and has two keys.
   * `{score}` is the score as digits, "4–4", which no language here reorders.
   */
  "rivalry.title": "Head to head",
  "rivalry.versus": "vs",
  "rivalry.wins": "Wins",
  "rivalry.draws": "Draws",
  "rivalry.games": "Games",
  "rivalry.allGames": "All games",
  "rivalry.lastPlayed": "Last played",
  "rivalry.notYet": "Not yet",
  "rivalry.streak": "Streak",
  "rivalry.against": "against {name}",
  "rivalry.unnamed": "A player",
  "rivalry.streakWon.one": "{name} won the last game",
  "rivalry.streakWon.other": "{name} won the last {count}",
  "rivalry.streakDrawn.one": "The last game was a draw",
  "rivalry.streakDrawn.other": "The last {count} were draws",
  "rivalry.never.you": "You and {name} have never played each other",
  "rivalry.never.named": "{one} and {other} have never played each other",
  "rivalry.neverGame.you": "You and {name} have never played {game} before",
  "rivalry.neverGame.named": "{one} and {other} have never played {game} before",
  "rivalry.gapMonths.you": "You haven't played {name} in {count} months",
  "rivalry.gapMonths.named": "{one} and {other} haven't played each other in {count} months",
  "rivalry.gapYear.you": "You haven't played {name} in a year",
  "rivalry.gapYear.named": "{one} and {other} haven't played each other in a year",
  "rivalry.gapYears.you": "You haven't played {name} in {count} years",
  "rivalry.gapYears.named": "{one} and {other} haven't played each other in {count} years",
  "rivalry.firstWin.you": "Your first win against {name}",
  "rivalry.firstLoss.you": "{name}'s first win against you",
  "rivalry.firstWin.named": "{winner}'s first win against {loser}",
  "rivalry.beaten.you": "You've beaten {name} {count} times in a row",
  "rivalry.lostTo.you": "You've lost to {name} {count} times in a row",
  "rivalry.beaten.named": "{winner} has beaten {loser} {count} times in a row",
  "rivalry.drawnRun.you": "Your last {count} games against {name} were draws",
  "rivalry.drawnRun.named": "The last {count} games between {one} and {other} were draws",
  "rivalry.allDrawn.you": "Every game between you and {name} has been a draw",
  "rivalry.allDrawn.named": "Every game between {one} and {other} has been a draw",
  "rivalry.tied.you": "You and {name} are tied {score}",
  "rivalry.tied.named": "{one} and {other} are tied {score}",
  "rivalry.lead.you": "You lead {name} {score}",
  "rivalry.behind.you": "{name} leads you {score}",
  "rivalry.lead.named": "{leader} leads {trailer} {score}",
} as const;
