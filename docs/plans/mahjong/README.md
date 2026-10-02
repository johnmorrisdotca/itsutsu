# Mahjong: a family, opened with Mahjong Solitaire

**Status: built 2026-09-29 on branch `mahjong` (board row
`mahjong-tile-matching-family-style-for-several-players`).** Since
2026-10-01 the tiles, layouts, deals, rules, table and computer seats are
Jarajara (`@johnmorrisdotca/jarajara`, github.com/johnmorrisdotca/jarajara),
where the solitaire is called Awase; the files named below live there, and the
site keeps only `src/lib/puzzles/mahjong/generate.ts`, which writes a deal as
one of its puzzles. Every deal and table game made before the move is held
exactly by the package's tests.

John, 2026-09-29, HIGH: "MahJong game where you match up piles of those
CHIPS things... forget what they are called. this can be family style as
well. up to X players. you decide. japnese style chips if it makes sense.
otherwise chinese is OK."

What he describes is the tile-matching patience game played with a mahjong
set: tiles stacked into a layout, taken off two at a time in matching pairs
of free tiles. The pieces are tiles.

## The decision: one puzzle, with a table mode — not a new kind

**Mahjong Solitaire is a `PuzzleKind` (`mahjong`).** Alone, it is exactly
what the puzzle kind is for: one player, one deal made in the browser from a
seed, a clock, a kept run, a fastest table, a solve the server checks and pays
XP for. Nothing about it needs the engine, a ladder or a rating.

**Played by several, it is a setting of the same game, not a second card**,
as Kumimoji's pass and play is (AGENTS.md: a variant of how a game is played
is a choice on its set-up, with one card and one front door). The set-up's
**Players** chips offer Solitaire, Two, Three and Four; two or more open the
table at the same address with `players=N` (`MahjongTableGame`). A table is
never recorded: kept in this browser only (`keptInBrowser`), waiting on My
games > Pass and play (`MahjongTableCard`) and on the set-up screen
("Continue the table game") until it is over, and paying nothing.

A `PartyKind` was considered and not taken: it would have made two cards for
one game, and the solitaire would still have needed the puzzle kind for its
clock, runs and fastest tables.

## The rules

### Alone
- A tile is **free** when nothing lies on it (no tile on any higher layer
  overlapping it, even by half) and its left or right side is open.
- Two free tiles that **match** are taken: identical tiles; any flower with
  any flower and any season with any season (the usual rule), or, chosen on
  the set-up, **Identical** (the deal holds bonus tiles in identical pairs).
- **Every deal can be cleared.** It is laid in reverse (`deal.ts`): starting
  from the full layout, two slots free among those still to fill are given a
  matching pair, and so on; the order they came off in clears it.
- **Level** is how forgiving the deal is. Five deals are laid from the seed and
  each played out sixteen times by a player taking any free pair at random;
  easy is the one it clears most often, hard least, medium between. A ranking,
  so it costs the same at every layout (a few hundred milliseconds for the
  Turtle).
- **Undo** any number of moves. **Shuffle** is offered only when no free pair
  is left: the tiles left are laid again where they lie, in reverse like a
  deal so they can be finished whenever the places allow, and drawn from the
  tiles themselves and the count of shuffles so far (never `Math.random`), so
  the server replays a solve to exactly the same tiles. **Hint** (chosen on the
  set-up) lights a free pair, at a hint's cost in points.
- The answer and a kept run are **the moves**: a pair as two slots in base 36,
  a shuffle as `*` (`moves.ts`). `checkAwase` plays them on the deal and asks
  for an empty layout: a few thousand steps, no search.

### At a table (two to four)
- Players take turns on one layout; **each turn takes one pair**, scored to its
  taker: plain suit tiles 1, ones and nines 2, winds 3, dragons 4, a flower or
  season pair 2 **and another turn** (a bonus tile draws again in the full game).
- With no pair to take, the tiles are shuffled where they lie and the same
  player goes on. The game ends when the table is clear, or when no shuffle can
  free what is left (fewer than two free places); most points wins, a tie
  shares it.
- **Why these rules.** Taking a pair each by turns, with every pair worth the
  same, is decided by counting: two players get half the pairs whatever they
  do. Pairs worth different amounts make each turn a choice between taking the
  dragon now and not uncovering one for the next player, which is a game of
  reading the whole layout. It also plays well round one device: **everything
  is face up**, so there is no cover screen and no waiting.
- **Computer seats** (`computer.ts`) look one turn ahead: a pair's points,
  less the best pair it leaves the next player (or plus most of its own next
  pair, for a bonus pair). In the simulation it beats a random player well over
  half the time. It runs in the browser, a moment after the last move so a
  watcher sees each pair go.
- The seats are named by the four winds, east first, and one person and the
  rest computers is the default.

### Why not a race on identical deals, for the table
A race needs everybody looking at their own layout at once, which one device
cannot do. The solitaire already has the site's two-device race ("Start with
a friend", the puzzle race of NUM-05): the same deal on two devices, timed by
the server. So the race is covered where it works, and the one-device table
is the turn-taking game.

### What carries over to several devices (`docs/plans/party-online/`)
The table is a natural `OnlineRules` row: its state is the deal, the seats and
the pairs taken (`encodeTable`), open information (no redaction needed), a
move is a pair read in one line and checked by `playAtTable` in microseconds,
the automatic shuffle is deterministic (so the server and every browser agree
with no randomness sent), and `computerPair` is already a pure `computer`
function. Its board would be `MahjongBoard` read-only for the seats not to
move. Nothing here needs changing first.

## The layouts

A size is a layout, named by its **width in tiles**, which is the big number
on its board tile (`BoardSizeMark` draws a lattice at that density):

| Size | Layout | Tiles | Layers | On a phone |
|---|---|---|---|---|
| 8 | Torii 鳥居 | 64 | 3 | about 40 px tiles |
| 9 | Fuji 富士 | 100 | 5 | about 36 px |
| 10 | Castle 城 | 120 | 5 | about 33 px |
| 15 | Turtle 亀 | 144 | 5 | about 23 px; zooms (`TsunagiViewport`) |
| 4 | a square of eight | 8 | 3 | the browser tests' own, never offered |

A smaller layout uses pairs drawn at random from the full set of 144. Slots
are half-tile units, so a tile may sit half over two below it.

## The tiles

Drawn for this site as SVG (`MahjongTileFace.tsx`), in the Japanese style:
characters (numeral over a red 萬), circles and bamboo counted out (the one of
bamboo a sparrow), 東南西北, 中 red, 發 green, the white dragon a blue frame,
and the flowers (梅蘭菊竹) and seasons (春夏秋冬) under a coloured band naming
their group. Every suit tile and wind has its number or letter small in the
top corner, for readers who do not count dots at a glance or read 東 as east.
The FluffyStuff riichi set was not used: its detailed faces do not read at
23–40 px, and drawing our own settles the licence question outright.

Tiles are light objects in both themes: every colour is fixed. Layers read by
a step up and to the right, the tile's thickness below and to the left, and a
shadow that deepens with height. "Free tiles lit" (the default, remembered in
the browser) dims every blocked tile; "Classic look" draws them all alike. A
blocked tile shakes when pressed (none under reduced motion). Tap and tap,
drag one onto the other, or double-tap a tile to take it with its free match.

## Classic four-player Mahjong, later, in the same family

Sensible, and the family was named for it. What it would take:

- **Riichi** (Japanese) is the natural choice for this site's accent and has
  the clearest published rules (the EMA's Riichi Competition Rules). A simple
  Chinese or "Hong Kong old style" game is lighter to score and a reasonable
  first step.
- **A new kind** — neither a puzzle nor a two-colour variant — or a `PartyKind`
  of four with **hidden hands** (the cover screen Tenka and Kumimoji use) on one
  device, and `redact(state, seat)` for several devices (party-online stage 3
  has the same need for Kumimoji).
- **The rules engine**: the wall and dead wall, draws and discards, calls (chi,
  pon, kan) with their priority, winning-hand recognition (4 sets and a pair,
  seven pairs, thirteen orphans), and scoring (han and fu for Riichi, with
  yaku, dora and riichi sticks) — the scoring is the bulk of the work, several
  thousand lines with tests.
- **Computer players** that make sensible discards (shanten-based efficiency)
  and do not deal into obvious hands; three of them fill a table for one person.
- **Rounds**: east and south winds, dealer rotation, honba — a game is half an
  hour, so it must be kept after every discard.
- The tile art is already here (the riichi set is the 136 non-bonus tiles).

## Decisions to review

- Mahjong Solitaire is a puzzle with a Players choice, not a separate party
  game; the table is kept in the browser only and pays no XP.
- The name "Mahjong Solitaire", kanji 牌合わせ ("matching tiles"); the family
  was "Mahjong" 麻雀 until 2026-10-01, when it became Tiles 牌 with Mexican
  Train and the cube (`FAMILY_ABSORBED` keeps the key `mahjong` leading there).
- Four layouts (Torii, Fuji, Castle, Turtle) of our own design besides the
  classic Turtle; Fuji is the default because it fits a phone.
- Size = the layout's width in tiles, so the board tiles read 8, 9, 10, 15.
- Level = the most / middling / least forgiving of five deals.
- Table scoring 1/2/3/4, bonus pair 2 and another turn; automatic shuffle when
  stuck with the same player to move; up to four players, wind-named seats, one
  person and the rest computers by default; no cover screen.
- Shuffle only when stuck (not at any time), free of charge; Undo unlimited and
  free; Hint costs a hint's points, as in every puzzle. No Check.
- "Free tiles lit" on by default, remembered per browser, not per puzzle.
- Identical flowers and seasons is carried by the seed (a block of seeds of
  its own), as a Futago's word count is, so kept runs need no new column.
- Mahjong is not listed on the Party games shelf: that shelf already shows its
  eight. The listing is written out in `familyShelves.ts` for when it has room.
- Mahjong's play page offers Just the board (`<Page board>`); the other
  puzzles' play pages do not yet at this base, which is a separate row.
- The play column is wider for Mahjong (`max-w-3xl`) so the Turtle's tiles are
  a comfortable size on a laptop.
