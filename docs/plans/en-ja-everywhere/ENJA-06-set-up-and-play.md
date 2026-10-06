# ENJA-06. The set-up screen, the game screen and every ending in English and Japanese

Board key: `the-set-up-screen-the-game-screen-and-every-ending-in-english-and-japanese`.
Kind: feature. Priority high. Needs ENJA-05.

## Where

`src/components/live/live.constants.ts`, `src/components/game/game.constants.ts`,
`src/components/history/resultWords.ts` (`headlineOf` returns English plus
kanji), `resultCard.constants.ts`, `GamePicker.tsx` (its tablist label
"Families of games" is hard-coded), the shared game controls (Continue, New
game, Resign, Give up), the seat and invite flow, and the just-the-board modal.

## Watch

- `PICK_TILE` is one fixed box, and the set-up screen must not change height (`e2e/set-up-steady.spec.ts`). Run that spec in Japanese too.
- Every ending must be reached in both languages: win, loss, giving up, out of time and draw (AGENTS.md, "Its words are read at every end").

## Done when

These paths are off the pending list, and set-up through the finished page has been played in Japanese at 390px and at desk width.
