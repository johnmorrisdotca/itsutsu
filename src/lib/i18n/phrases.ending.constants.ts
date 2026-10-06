/**
 * ending.*: the one set of words for ending a game and starting another (`src/components/play/`): Resign, Give up, New game and Continue, on every kind of play.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_ENDING = {
  "ending.resign": "Resign",
  "ending.resignAsk": "Resign this game? The other side wins.",
  "ending.resignForTwo": "Resign this game for {name}? The other player wins.",
  "ending.resignForMany": "Resign this game for {name}? The table ends here, with nobody the winner.",
  "ending.resigned": "{name} resigned.",
  "ending.resignedNobody": "{name} resigned. The game ended where it stood, with nobody the winner.",
  "ending.resignedWinners": "{name} resigned. {winners} wins.",
  "ending.giveUp": "Give up",
  "ending.giveUpAsk": "Give up this game? It ends here, unsolved.",
  "ending.newGame": "New game",
  "ending.newGameAsk": "Start a new game? The one in progress ends here and is not kept.",
  "ending.newGameYes": "Start a new game",
  "ending.keepPlaying": "Keep playing",
  "ending.newGameKeeps": "Starts a new game. This one stays where it is, in My games.",
  "ending.continue": "Continue →",
  "ending.continueTo": "Continue {what} →",
  "ending.doorEnds": "New game ends the one in progress here.",
  "ending.doorKeeps": "New game leaves the one in progress where it is.",
  "ending.othersGoing.one": "{others}{plus} other {game} game is going in My games",
  "ending.othersGoing.other": "{others}{plus} other {game} games are going in My games",
  "ending.doorAsk": "Start a new game? The one in progress ends here and is not kept.",
  "ending.doorKeep": "Keep it",
  "ending.resignFiled": "Resign this game? The other side wins and it is filed in the record.",
  "ending.cancel": "Cancel",
  "ending.cancelAsk": "Call off this game? Nothing has been played, so nobody wins and no rating moves.",
  "ending.couldNotDo": "That could not be done just now.",
  "ending.leaveIt": "No, leave it",
  "ending.star": "Star this game",
  "ending.starWord": "Star",
  "ending.starTitle": "Star it, to list it first in your finished games",
  "ending.starred": "Starred: take the star off",
  "ending.starredWord": "Starred",
  "ending.starredTitle": "Starred, listed first in your finished games",
} as const;
