# WORD-01. WordDrop, and the Other family

Board key: `word-puzzle-our-own-wordle-5-letters-6-guesses-and-4-5-in-several-languages-unde`.
Kind: feature, HIGH.

## Why

John, 2026-09-25: our own Wordle, on our board design, 5 letters × 6 guesses
and a 4-letter version, in several languages "and allow some configurations",
in "a special OTHER category" on the games list, cards and families, kept off
the set-up screen for now to ship sooner. Name: John's, "WordDrop".

## What was built (English)

- **A PuzzleKind, `wordDrop`**, so it has useSolve, kept runs, My games, points,
  the front door and the rules page with nothing new underneath. Sizes are the
  word's length, 4 and 5; a word allows one more guess than it has letters.
- **Levels**: easy draws from SCOWL's commonest words (sizes 10–20), medium from
  the wider list (10–35), hard adds the published game's hard rule (every letter
  found must be used again).
- **Words** (`src/lib/puzzles/wordDrop/words.en.data.ts`), written by
  `scripts/word-lists.mjs` from SCOWL 2020.12.07 (Kevin Atkinson, permissive
  notice carried in the file). Answers leave out plurals and past tenses whose
  stem is a word, and slurs, vulgarity and anything sexual; every word may be
  guessed. No list from any clone was used: those carry the NYT's own list.
- **Givens** are the word in capitals, an answer is the guesses run together in
  lower case, so the givens can never be handed in as a solve. The server checks
  guesses against the list, that the word was found last, and the row count.
- **Running out** ends the puzzle: the word is shown, the route checks the loss
  (`checkOutOfGuesses`) and takes the kept run off My games; nothing is paid.
- **Points**: five a letter for the winning row and every row not needed, so
  one guess is 150 at five letters and six guesses 25. No Check or Hint
  (`PuzzleSpec.helps: false`): the colours are the help.
- **Name**: WordDrop ワードドロップ, John's. "Wordle" is a trademark of The New
  York Times Company, named only in the attribution.
- **Other family** (`key: "other"`, その他), with `notOnSetUp` saying why it is
  off the set-up screen, and a letter-tile icon.

## Follow-ups (rows filed)

- French, German, Japanese: one PuzzleKind each on the same engine, with its own
  list, source, licence and date beside it. See the rows for the candidates.
- A word of the day: one seed from the date, the same word for everybody.
- When Other joins the set-up screen, `PuzzleBoardPreview` needs the word's
  shape (rows of tiles), which it does not draw yet.
- A race seat that runs out of guesses sends nothing and reads as given up
  after two hours; a race could say "out of guesses" at once instead.
