# Kumimoji 組み文字

Build one crossword from every tile in the bag. Lay your hand as words that
cross, and when your hand is empty and every run across and down is a word, draw
the next tile. A tile you cannot use can be traded for three. Use the last tile
in the bag and you are done. Play alone against the clock, or at a table of two
to eight sharing one bag, in English or in Japanese.

*Kumimoji* (組み文字) is "letters put together".

**[Play it](https://johnmorrisdotca.github.io/kumimoji/)**

<p>
  <img src="docs/desktop.jpg" alt="An English game: GIRL laid on the table, three tiles in hand, one of them a wild" width="560">
  <img src="docs/phone.jpg" alt="A Japanese game on a phone in dark mode" width="200">
</p>

- **Dealt from a seed.** `generateKumimoji` lays a crossword first and deals its
  tiles, so every bag can be finished, and two players racing the same seed get
  the same tiles in the same order.
- **English and Japanese.** 144 tiles in each: the English letter mix, or 45 base
  kana where が plays as か, ゃ as や and を as お. 110,316 English words and
  163,461 Japanese readings, from 2 to 15 tiles.
- **Wild tiles** that take any letter or kana, and are read as that letter in
  every word they are part of.
- **Diagonals**, if chosen: every diagonal run of three or more must be a word
  too.
- **The rules as plain functions.** A game in progress is a value
  (`TilePlay`): `deal`, `placeFromHand`, `moveOnTable`, `liftToHand`, `draw`,
  `trade` each return a new one. `judgeWithWords` says which runs are not words
  and which tiles are apart; `checkKumimoji` checks a finished grid against its
  bag, in time proportional to its size.
- **A table of two to eight** (`startParty`, `endTurn`, `drawAll`, `resign`,
  `joinParty`, `leaveParty`), kept as text (`encodeParty`, `decodeParty`), with a
  computer player that can take a seat (`planComputerTurn`).
- **A table to play on.** `mountKumimoji` plays a whole game alone in plain DOM;
  `KumimojiBoard` draws a grid in React.

It is the Kumimoji on [Itsutsu](https://itsutsu.com/games/kumimoji), which plays
alone, in races, round one device and across several with this package.

## Install

```sh
npm install @johnmorrisdotca/kumimoji
```

ES modules with types, and no dependencies. The React components need React 18
or later.

## Play a game in code

```ts
import { deal, draw, generateKumimoji, judgeWithWords, loadTileWords, mayDraw, placeFromHand, squareAt } from "@johnmorrisdotca/kumimoji";

const words = await loadTileWords("english"); // fetched once, the first time
const dealt = generateKumimoji(7, "medium", 2026); // a hand of 7, some wilds, seed 2026
let play = deal(dealt.givens, 7);

play = placeFromHand(play, 0, squareAt(0, 0)); // the first tile of the hand, on row 0, column 0
const verdict = judgeWithWords(play.tiles, words);
if (mayDraw(play, verdict)) play = draw(play);
```

- `generateKumimoji(hand, level, seed, options?)`: a hand of 3, 7 or 11; a
  level of `"easy"`, `"medium"` or `"hard"` (more wild tiles, fewer, none);
  options `language`, `gameLength` (`"short"`, `"medium"`, or `"full"`, the
  whole set), `doubleSet` (two English sets) and `diagonals`. Returns the bag as
  `givens` and one finished grid as `solution`.
- A square is a string key, `squareAt(row, col)`; the grid has no edges.
- A tile is one character: an English letter, `*` for a wild with no letter, a
  capital for a wild given that letter (`assignHandTile`), and for Japanese a
  private-use character per kana (`tileFace` says what is printed on any tile).
- `isFinished(play, verdict)`: the hand empty, the bag empty, and every run a
  word in one piece.

### Checking a finished game

```ts
import { checkKumimoji, encodeGrid } from "@johnmorrisdotca/kumimoji";

checkKumimoji(7, dealt.givens, encodeGrid(play.tiles), { level: "medium" });
// { ok: true } or { ok: false, reason: "zqx is not in the word list" }
```

It checks that the grid uses exactly the tiles of the bag, is all one piece, and
that every run is a word. Nothing is searched, so a server can run it on every
game handed in.

### The word lists

In a browser, `loadTileWords(language)` fetches the list as its own module the
first time it is needed (about 600 KB for English, 700 KB for Japanese before
compression), so nothing else carries it. On a server, in a test or in a script,
import the `words` entry once, which reads the lists from this package's files:

```ts
import "@johnmorrisdotca/kumimoji/words";
```

`tileWords(language)` then hands back the loaded list: `allowed` (every word),
`byLength`, the tile `mix`, and the functions that turn tiles into words.

### A table of players

```ts
import { endTurn, handCanSpell, judgeWithWords, placeFromHand, seatPlay, squareAt, startParty, withSeatPlay } from "@johnmorrisdotca/kumimoji";

let game = startParty(
  { size: 7, level: "medium", seed: 1, gameLength: "short", language: "english", doubleSet: false, diagonals: false, hints: false },
  dealt.givens,
  ["Ann", { name: "Computer", computer: true }],
);
// The player to move plays their own hand and table as a TilePlay:
game = withSeatPlay(game, placeFromHand(seatPlay(game), 0, squareAt(0, 0)));
game = endTurn(game, judgeWithWords(seatPlay(game).tiles, words), (hand) => handCanSpell(hand, words));
```

`afterComputerTurn(game, words)` plays a computer seat's whole turn;
`planComputerTurn` lists its steps, for a page to show them one at a time.

## Play on a page

```html
<div id="table"></div>
<script type="module">
  import { mountKumimoji } from "@johnmorrisdotca/kumimoji/ui";
  mountKumimoji(document.getElementById("table"), {
    language: "english",
    hand: 7,
    onFinish: ({ elapsedMs }) => console.log(`Finished in ${elapsedMs / 1000}s`),
  });
</script>
```

Options: `language`, `hand`, `level`, `gameLength`, `diagonals`, `seed`,
`onFinish`. The handle has `play()`, `newGame(options?)` and `destroy()`.
Colours are CSS variables on `.km-root` (`--km-felt`, `--km-tile` and the
rest), light and dark.

### In React

```tsx
import { KumimojiBoard, KumimojiTable } from "@johnmorrisdotca/kumimoji/react";

<KumimojiBoard tiles={play.tiles} verdict={verdict} glyphOf={words.glyphOf} onSquare={(square) => press(square)} />
<KumimojiTable language="japanese" hand={7} />
```

## Develop

```sh
npm install
npm test         # the rules, the lists, the table and the computer player
npm run build    # dist/
npm run site     # the demo in site/, as GitHub Pages serves it
```

## Licence

The code is MIT, © John Morris. The word lists carry their own licences, set out
in [WORDS-LICENCE.md](WORDS-LICENCE.md): the English words are from SCOWL
(permissive, with a notice that travels with them), and the Japanese readings are
derived from JMdict under CC BY-SA 4.0.
