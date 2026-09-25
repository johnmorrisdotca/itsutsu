# WORD-04. WordDrop in kana

Board key: `worddrop-in-japanese-kana`. Kind: feature.
Follows WORD-01 (`WORD-01-worddrop.md`), whose engine, points, history and
styles it reuses.

## Why

John, 2026-09-25, setting the rules himself (on the row):

> green = exact; orange = right kana, wrong place; yellow = same consonant
> family (same gojūon column/row group), wrong kana; grey = not in the word.
> Small vs large kana (っ/つ, ゃ/や…): counts as the kana, marked with a DOWN
> arrow meaning "right kana, wrong size". Dakuten/handakuten (は/ば/ぱ): treated
> as the same kana (diacritics ignored) but a perfect match needs the right
> mark; an UP arrow means "right kana, wrong mark". Long vowel bar ー: undecided;
> it counts as a character. Lengths: 3 and 4 kana (5 may be too hard). Word list
> licence first.

## The word list: JMdict, and the question for John

**Source**: JMdict (the Electronic Dictionary Research and Development Group,
EDRDG), `JMdict_e.gz`, the kana reading (`reb`) of every entry. Its priority
tags (`news1`, `ichi1`, `spec1`, `gai1`) mark the common words, which is what
the answers need; every reading of the right length may be guessed.

**Licence, read 2026-09-25 at https://www.edrdg.org/edrdg/licence.html**:
CC BY-SA 4.0, with EDRDG's own conditions:

1. Attribution on the pages that show the words, naming JMdict and EDRDG and
   linking the licence. Our kana list is a derived work and is CC BY-SA too;
   it is a data file and does not reach the code, as with French's Lexique 3.
2. **"There must be a procedure for regular updating of the data from the most
   recent versions available… at least once a month. Failure to keep the
   versions up-to-date is a violation of the licence."** This is an ongoing
   obligation, so it is John's decision (asked 2026-09-25). Recommended: a
   monthly scheduled workflow regenerates the list and opens a pull request,
   landed with the next ordinary push, so it costs no deployment of its own.
   A game already played keeps its word, because its record stores the word.
3. Commercial use is not restricted.

Nothing from JMdict enters the repository until John answers. If he declines,
the fallback is a Wiktionary-derived list (CC BY-SA, no update clause) with no
commonness marks, which makes easy answers much harder to choose.

## The rules, as they will be built

A word is 3 or 4 kana, hiragana only (a reading in katakana is folded to
hiragana; ー stays ー). Guesses: six at both lengths, one more than English's
rule, because a kana alphabet is about seventy symbols against twenty-six.

Every kana is read three ways: its **base** (size and mark removed: ぱ → は,
っ → つ), its **size** (small or large) and its **mark** (none, ゛ or ゜). Its
**family** is its consonant row of the gojūon (か行: か き く け こ, and their
voiced forms, since the base decides the row); あ行 is the vowels, and や, ゆ, よ,
わ, を and ん are each their own row with their own kana.

For each place in a guess, first match across the whole guess (so a kana is
counted as many times as the word holds it, as the English marking does):

| Mark | When | Arrow |
|---|---|---|
| green | same kana, same size, same mark, in this place | none |
| green + arrow | same base in this place, but the size or the mark differs | ↓ wrong size, ↑ wrong mark |
| orange | same base elsewhere in the word, not already matched | ↓ or ↑ likewise when size or mark differs |
| yellow | the word's kana in this place is not this one, but is in the same family | none |
| grey | none of the above | none |

A word is found only when every place is plain green. Green with an arrow is
not found.

**ー (decided here, for review)**: a character with no base, size, mark or
family. Green in its place, orange elsewhere, grey otherwise; never yellow, and
never an arrow.

**Yellow is about this place**: the word's kana HERE shares the guess's
family. It is not a claim about the rest of the word, so it adds nothing to
what orange says. Decided here, for review: John wrote "same consonant family,
wrong kana", and a place-bound reading is the one that tells a player something
orange does not.

## Typing it

- **On screen**: a gojūon keyboard, the rows as a phone lays them out (あ か さ
  た な は ま や ら わ, five kana down each), with a 小 key (small/large), a ゛゜
  key (cycles the mark) and ー. The Keyboard button (0.326.0) shows and hides it
  as for English.
- **On the desk's keyboard**: romaji converted as it is typed (ka → か, kya →
  きゃ, double consonant → っ, nn → ん, - → ー), by a small table of our own; no
  input-method library and no dependency.
- Tapping a place to change it (0.327.0) works the same.

## Where it sits

A PuzzleKind of its own, `wordDropKana`, in the Other family beside WordDrop,
with WordDrop's styles, history, points (a place is a letter) and XP. Name:
"WordDrop かな" until John names it. It needs everything the puzzle gate asks
(`puzzles.coverage.test.ts`): copy, a family, a picture, a browser test, and a
generator that draws every size and level in a browser's time.

## Order of work

1. John's answer on the licence (above).
2. `scripts/word-lists-ja.mjs`: JMdict in, `words.ja.data.ts` out, with the
   attribution and the date read at its head, as `words.en.data.ts` carries
   SCOWL's.
3. `kanaMarks.ts`: the table above, pure and tested by itself (every row, the
   doubled kana, the arrows, ー).
4. The kind, the keyboard, romaji, the drawing of arrows on the stones, the
   gate's pictures and tests.
5. The monthly refresh workflow, if John chooses JMdict.
