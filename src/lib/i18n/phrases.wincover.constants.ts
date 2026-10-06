/**
 * wincover.*: what the cover over a finished game says (`src/components/game/winCover.constants.ts`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_WINCOVER = {
  // What the win cover says
  "wincover.seeBoard": "See the board",
  "wincover.solved": "Solved",
  "wincover.won": "Won",
  "wincover.youWin": "You win",
  "wincover.wins": "{who} wins",
  "wincover.shareWin": "{who} share the win",
  "wincover.draw": "Draw",
  "wincover.you": "You",
  "wincover.afterTime": " in {time}",
  "wincover.afterTimeMoves": " in {time}, in {moves}",
  "wincover.againSamePlayers": "Play again, same players",
  "wincover.playAgain": "Play again",
  "wincover.computer": "The computer",
} as const;
