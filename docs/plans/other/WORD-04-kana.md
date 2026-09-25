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
EDRDG), `JMdict_e.gz`, the kana reading (`reb`) of every entry. Every reading of
the right length may be guessed; the answers are the commonest, chosen by a rule
(John, 2026-09-25: "a programmatic way to narrow down words to best words… and
shouldn't be too much larger than english"). `scripts/word-lists-ja.mjs`
ranks each reading: textbook-common (`ichi1`) first, then its newspaper band
(`nf01` is the 500 commonest, `nf02` the next 500; `spec1` counts as band 12,
`gai1` 16, `spec2` 30), then more marks before fewer. Easy is the first 900 at
each length and medium and hard the first 2,000, English's size (882 and 2,043
at five letters; Wordle hides about 2,300). Against the 2026-09-25 release:
accepted guesses 16,442 at 3 kana, 39,045 at 4 and 35,415 at 5.

**Loaded by length**: the three lists together are 419 KB (257 KB compressed),
so each length is its own module, loaded when a puzzle of that length opens; a
3-kana game carries about 50 KB.

**Licence, read 2026-09-25 at https://www.edrdg.org/edrdg/licence.html**
(John, 2026-09-25: "JMdict, monthly refresh sounds good"; UmaKuma already uses
it, and its own refresh gap is on UmaKuma's board):
CC BY-SA 4.0, with EDRDG's own conditions:

1. Attribution on the pages that show the words, naming JMdict and EDRDG and
   linking the licence. Our kana list is a derived work and is CC BY-SA too;
   it is a data file and does not reach the code, as with French's Lexique 3.
2. **"There must be a procedure for regular updating of the data from the most
   recent versions available… at least once a month. Failure to keep the
   versions up-to-date is a violation of the licence."** This is an ongoing
   obligation, and John chose it: `.github/workflows/jmdict-refresh.yml` runs
   on the 1st of each month, writes the lists again from the newest release,
   and if they changed pushes them to a `data/jmdict-YYYY-MM` branch and fails
   on purpose as the reminder. It opens no pull request and never pushes to
   main (John, 2026-09-25: "don't make any prs without my permission"), as
   UmaKuma's EDRDG refresh does; an agent lands the branch through the ordinary
   release, so it costs no deployment of its own.
   A game already played keeps its word, because its record stores the word.
3. Commercial use is not restricted.

## The rules, as they will be built

A word is 3, 4 or 5 kana (John added 5), hiragana only (a reading in katakana
is folded to hiragana; ー stays ー). Six guesses at every length: a kana
alphabet is about seventy symbols against twenty-six, and more than half the
5-kana words hold a small kana (きょう, しゅう), so 5 is the hard size.

**A free grey word** (John, 2026-09-25: "have a REAL word that is completely
grey. that tells the user a lot."): on easy and medium the puzzle opens with a
real word already played as its first row, every place grey — none of its kana
is in the word and none shares the family of the word's kana in its place. It
is drawn from the accepted list by the puzzle's own seed, so everybody with the
same word sees the same clue, and it costs no guess. Hard has none.

Every kana is read three ways: its **base** (size and mark removed: ぱ → は,
っ → つ), its **size** (small or large) and its **mark** (none, ゛ or ゜). Its
**family** is its consonant row of the gojūon (か行: か き く け こ, and their
voiced forms, since the base decides the row); あ行 is the vowels, や行 is
や ゆ よ, わ行 is わ を, and ん is a row of its own.

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

**Yellow is about this place**: the word's kana HERE is in the guessed kana's
family, and a yellow says nothing about the rest of the word. Decided here, for
review: John wrote "same consonant family, wrong kana", and read against this
place it tells a player something orange cannot, which kana row to try next.

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

1. Done: John chose JMdict with a monthly refresh.
2. Done: `scripts/word-lists-ja.mjs`, JMdict in, the lists out, with the
   attribution and the release date at their head.
3. Done: `kanaMarks.ts`, the table above, and `romaji.ts`, both tested.
4. The lists split by length and loaded on demand; the grey word.
5. The kind, the keyboard, the drawing of arrows on the stones, the credit on
   the page, the gate's pictures and tests.
6. Done: the monthly refresh workflow, `jmdict-refresh.yml`.
