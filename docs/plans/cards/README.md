# Cards: a deck for the site, and Solitaire first

John, 2026-09-29: "Let's create 3 new types of game (card, mahjong, dominos)",
and of the cards, first: "Solitair classic game with several recommended Options
of your choice, and in the same style as many games we already have. We might
not be on a board game anymore, but on a regular desk ... unless it can still
work on a board. the cards are all draggable, etc." And: "cards should be in the
Itsutsu theme, backs of the cards are probably styliized to have the itsutsu
logos in a tiled beautiful pattern."

Board row: `solitaire-classic-klondike-on-the-desk-every-card-draggable-with-recommended-opt`.

## The deck, for every card game

One deck, drawn by us in SVG, shared by Solitaire and the family card games
(Hearts, Big Two, President, Go Fish, Crazy Eights) that follow it.

- **`src/lib/cards/`** has the pure parts:
  - `Suit`, `Rank` (the ace is 1) and `Card`;
  - `freshDeck` and `shuffledDeck(seed)`, which use the puzzles' seeded shuffle, so a seed re-deals exactly;
  - `dealRound`, `dealAll`, `take` and `sortedHand`;
  - a card written as one letter (`cardCode`, a deck in 52 letters), or as the two-character id players write (`cardId`: `QS`, `TH`);
  - the names a corner and a screen reader use.
- **`src/components/cards/`** has what draws the deck:
  - `PlayingCard`, a face or a back, 5:7, as wide as its parent;
  - `CardSlot`, an empty place;
  - `CardPile`, a pile squared up, overlapped down, or spread along;
  - `CardHand`, a fan, with `hidden` for a hand nobody at the table may see;
  - `useCardDrag` and `CardDragGhost`, pointer dragging with tap and double tap for any game;
  - `pileLayout`, pure and tested.
- **Faces** are made to be read at a phone's size:
  - a big rank with its suit in the top left, so a fan shows them;
  - a bigger suit in the top right, so a column's top strip shows rank and suit;
  - a big suit in the middle, and the court cards' kanji (士 妃 王) on a pale panel;
  - the same corner, turned over, at the bottom right.
- **Colour is never the only sign.** A red card wears a fine red line inside its edge, which a black card never does. Every suit's outline is its own.
- **Backs** are the logo's five stones, dark, light, light, light, dark:
  - laid like brickwork on the brand's charcoal, inside an ivory rim;
  - with the 五つ of the avatar, copied path for path from `public/brand/`, on an ivory medallion;
  - on a field of `ink` (the default), `shu` or `moss`, so a game can tell two decks apart.
- **A light object in both themes** (`.surface-light`), with its colours fixed, as a Kumimoji tile is.

## Solitaire is a puzzle kind

Klondike is one player, a deal, a clock and a finish. That is what a
`PuzzleKind` already is (`docs/plans/numbers/README.md`): one solver, no turns,
no colours, kept runs in My games, a fastest table, XP paid for a checked
finish, the daily seed, the front door, set-up and play addresses. A new kind
would have rebuilt every one of those for nothing. A `PartyKind` is a table of
several round one device, and Solitaire has one player.

The puzzle kind was built for grids, so these are the points where Solitaire
bends it, each written in the code where it bends:

- **`size` is how many cards the stock turns (1 or 3),** shown as the "Draw 1" and "Draw 3" tiles, which the picker calls "Draw" (`PuzzleSpec.cards`).
- **`level` is how many times through the stock:** easy as many as you like, medium three, hard one (`SOLITAIRE_PASSES`). Draw 3 with one pass is not offered (`levelsAt`), because the solver wins about one deal in sixty there, and a winnable deal would take the browser seconds to find.
- **The givens are the deal,** 52 letters. The answer and a kept run are the moves (`solitaire/code.ts`):
  - `d` turns the stock;
  - `r` turns the waste back;
  - any other move is two characters, the pile it leaves and the pile it lands on.

  A column's face-up cards are always a single run, so a carry never has to name which cards it takes.
- **The check replays the moves from the deal** under the game's rules (`checkSolitaire`), in O(moves) with no search. The solved route also checks that the deal is the shuffle of the posted seed.
- **Given up is the "ended, not solved" path** that a word whose guesses ran out already takes (`outOfGuesses`, `checkSolitaireGivenUp`). The game is kept in My games' finished list, and playing it out is paid, once per deal.
- **No Check, Hint or countdown** (`helps: false`, `clock: false`). A card game answers every move as it is made, and its measure is the clock counting up and the count of moves.
- **Points on the boards are the 52 cards brought home,** five each (`cellsFilled`), so every won deal scores 260. The IP weight makes that about 100.

## Winnable deals, and the solver

`solitaire/solve.ts` is a depth-first search:

- it makes safe moves home without branching;
- it remembers every table it has seen, with the columns in any order;
- it tries the likely moves first.

It gives up after a fixed number of tables, **never after a fixed time**. So the same seed names the same deal on a phone, a desk and the server.

**Two kinds of deal, told apart by the seed:**

- **Winnable, the default:** every seed below 1,600,000,000. The deal is the first from that seed, in a fixed order of tries, that the solver wins. The address is then put right to name that deal's own seed (`PuzzlePlay`).
- **Any deal:** seeds from 1,600,000,000 up. The shuffle as it falls, as with a real deck.

**Measured 2026-09-29,** thirty seeds a setting on a busy desk, with a budget of 4,000 tables:

- A winnable deal takes about a tenth of a second on average to find.
- Draw 1 with one pass is the slow case: about half a second on average, two at worst.
- At 20,000 tables, draw 1 with one pass averaged two seconds and took eight at worst, for about one more deal in sixty found.

**Win rates over sixty deals, at 20,000 tables:**

| Draw | Passes | Deals the solver won |
|---|---|---|
| 1 | as many as you like | 41 of 60 |
| 1 | three | 40 of 60 |
| 1 | one | 8 of 60 |
| 3 | as many as you like | 35 of 60 |
| 3 | three | 29 of 60 |
| 3 | one | 2 of 60 |

The solver finds wins and never judges losses. It skips some legal moves (a run moved for no reason, a card brought down from home with no use for it), so "winnable" is only ever said of a deal it has won.

**The budget is part of what a seed means.** Changing `SOLVER_BUDGET` changes which deal a winnable seed names, and so the deal behind kept runs, races and the daily deal.

## The table

- **The table is a `BoardFrame`,** square like every board on the site, in the reader's own wood. John asked for "a regular desk… unless it can still work on a board", and a board of wood is a desk.
- **Everything is laid out in hundredths of the table's width** (`cqw`), so a phone and a desk put the same cards in the same places.
- **A long column squeezes to fit.** Face-down cards shrink to a sliver first, then face-up cards to the strip that still shows a rank.
- **Eight squares down was tried first,** and at 390 pixels it left a third of the phone's screen as bare wood.

## Play

- Any face-up card can be dragged, and the cards on it go with it. A drop lands on the pile under the pointer, or else on the pile the carried cards overlap most. Drags use pointer events, so a mouse and a finger work alike.
- Tap a card, then tap where it goes. A quick second tap on the picked card sends it home.
- Tap the stock to turn it.
- Undo takes a move back.
- Once every column card is face up, the finish is worked out once and played to the end, a card every 110 ms (all at once under reduced motion).
- The score (none, standard or Vegas points, never money) is this reader's way of counting, kept in this browser. It changes no rule and nothing the site records.

## Decisions to review

- Solitaire is a `PuzzleKind`, not a new kind.
- "Draw 1 / Draw 3" are the size tiles, under the heading "Draw". The size picture is the site's `BoardSizeMark` with the big 1 or 3.
- The levels are the passes (easy as many as you like, medium three, hard one), and Draw 3 with one pass is not offered.
- The default is Draw 1, as many passes as you like, a winnable deal, no score.
- Winnable deals are the default, and any deal is one tap away. A race is always on a winnable deal.
- Scoring (standard and Vegas) is in this browser only, not in the address or the record.
- There is no countdown and no Check or Hint. Undo is free and not counted against a game. The move count is the moves standing, so an undone move comes off it.
- A double tap is a pick and a quick second tap on the same card (350 ms), and never a place followed by a pick.
- Give up keeps the game as ended and pays for playing it out, as a word run out of guesses does.
- Kanji: 札 for the Cards family, ソリティア for Solitaire, and 士 妃 王 on the jack, queen and king.
- A red card has a fine red inner line as the second sign of its colour.
- The Ace of spades carries the five stones under its pip.
- Card backs: charcoal by default, with shu and moss for games that want two decks.
- The family's mark is a fan of three of our own cards on green: a back, the King of hearts and the Ace of spades.
- Spider and FreeCell are not built. The rules module is Klondike's own, and neither was cheap enough to go in without delaying Klondike. FreeCell would be the easier next: every deal is open, and nearly all are winnable.
