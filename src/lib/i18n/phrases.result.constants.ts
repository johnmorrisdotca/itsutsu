/**
 * result.*: the result card at the end of a game and the sentences that say why it ended (`src/components/history/resultCard.constants.ts`). A headline is its English beside its kanji; a Japanese reader is shown the kanji.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_RESULT = {
  // The headline over a game that was decided between two colours
  "result.decided": "{colour} wins",
  // Why a game ended: the one who did it, and the same said to that one
  "result.line": "{who} completed a winning line.",
  "result.lineYou": "You completed a winning line.",
  "result.captures": "{who} captured enough to win.",
  "result.capturesYou": "You captured enough to win.",
  "result.time": "{who} ran out of time.",
  "result.timeYou": "You ran out of time.",
  "result.resign": "{who} resigned.",
  "result.resignYou": "You resigned.",
  "result.trap": "{who} had no way out.",
  "result.trapYou": "You had no way out.",
  "result.square": "{who} made the winning square.",
  "result.squareYou": "You made the winning square.",
  "result.full": "{who} led when the board filled.",
  "result.fullYou": "You led when the board filled.",
  "result.count": "{who} had more discs at the end.",
  "result.countYou": "You had more discs at the end.",
  "result.camp": "{who} filled the far camp first.",
  "result.campYou": "You filled the far camp first.",
  "result.connection": "{who} joined both sides of the board.",
  "result.connectionYou": "You joined both sides of the board.",
  "result.blocked": "{who} had no move left.",
  "result.blockedYou": "You had no move left.",
  "result.territory": "{who} held more of the board.",
  "result.territoryYou": "You held more of the board.",
  // Why a game was drawn
  "result.noProgressRacing": "Nobody got a piece any nearer home for longer than its rules allow.",
  "result.noProgressTaking": "Nothing was taken and no man moved for longer than its rules allow.",
  "result.noProgressPlacing": "Every piece was down, and the sliding went on longer than its rules allow.",
  "result.noMoves": "Neither side had a move left.",
  "result.repetition": "The same position came round again, with the same side to move.",
  "result.endgameCount": "The ending was not won within the moves its rules allow.",
  "result.length": "The game ran to the length it was given.",
  "result.bothLines": "Both made a line at once.",
  "result.boardFull": "The board filled with nobody winning.",
  "result.draw": "Neither side won.",
  // The score under a result
  "result.scorePairs": "Pairs captured",
  "result.scoreDiscs": "Discs",
  "result.scoreArea": "Area",
  "result.scoreLine": "{label}: {black} {blackScore} · {white} {whiteScore}",
  // The card's buttons and lines
  "result.rematch": "Rematch",
  "result.again": "Play again",
  "result.newGame": "New game",
  "result.review": "Review the moves",
  "result.close": "Close",
  "result.xp": "+{points} XP from this game",
  "result.rating": "Rating {mine} · opponent {theirs}",
  "result.levelUp": "Level up: {name}",
  "result.nextLevel": "Next level: {name}",
  "result.waiting.one": "Your move in 1 game",
  "result.waiting.other": "Your move in {count} games",
} as const;
