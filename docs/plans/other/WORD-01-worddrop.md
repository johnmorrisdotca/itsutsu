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
  found must be used again). *Since 2026-09-25 the level is the count of
  guesses instead — hard the published count, medium one more, easy every row
  of an 8×8 or 9×9 board — and the hard rule is Strict, a choice at any level
  (`src/lib/puzzles/gomoji/layout.ts`).*
- **Words** (`src/lib/puzzles/wordDrop/words.en.data.ts`), written by
  `scripts/word-lists.mjs` from SCOWL 2020.12.07 (Kevin Atkinson, permissive
  notice carried in the file). Answers leave out plurals and past tenses whose
  stem is a word, and slurs, vulgarity and anything sexual; every word may be
  guessed. No list from any clone was used: those carry the NYT's own list.
- **Givens** are the word in capitals, an answer is the guesses run together in
  lower case, so the givens can never be handed in as a solve. The server checks
  guesses against the list, that the word was found last, and the row count.
- **Running out** ends the puzzle: the word is shown, the route checks the loss
  (`checkOutOfGuesses`), keeps it as a `PuzzleSolve` with `solved` false and its
  guesses, pays `puzzleEnded` (5 XP), and takes the kept run off My games
  (0.328.0).
- **Points** (0.328.0, `wordScore.ts`): every letter found, 10 × the rows still
  to come when it was placed or 4 × when it was only found elsewhere; the word
  250 and 25 a row left; up to 50 for speed on a word found. A lost word scores
  its letters; only a word with none found scores 0, and any word found beats
  any word lost. No Check or Hint (`PuzzleSpec.helps: false`): the colours are
  the help.
- **History** (0.329.0): every word played, found or not, with its guesses and
  score, on WordDrop's own page (`WordHistory`).
- **Name**: WordDrop ワードドロップ, John's. "Wordle" is a trademark of The New
  York Times Company, named only in the attribution.
- **Other family** (`key: "other"`, その他), with `notOnSetUp` saying why it is
  off the set-up screen, and a letter-tile icon.

## Follow-ups (rows filed)

- French, German, Japanese: one PuzzleKind each on the same engine, with its own
  list, source, licence and date beside it. See the rows for the candidates, and
  `WORD-04-kana.md` for the Japanese one, which has rules of its own.
- A word of the day: one seed from the date, the same word for everybody.
- When Other joins the set-up screen, `PuzzleBoardPreview` needs the word's
  shape (rows of tiles), which it does not draw yet.
- A race seat that runs out of guesses sends nothing and reads as given up
  after two hours; a race could say "out of guesses" at once instead.
