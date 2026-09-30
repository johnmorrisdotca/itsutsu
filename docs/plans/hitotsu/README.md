# Hitotsu: the colour-card game, with its house rules

**Status: built 2026-09-30 on branch `cloud-uno-style-08jmb8`.** John,
2026-09-30: "since we have built card games now, we should build Uno and party
Uno versions. Build out some of the most popular variants of Uno to add to the
base one."

Hitotsu 一つ for two to eight round one phone or tablet, with a computer in any
seat, or on several devices, at `/games/hitotsu/pass-and-play`; its front door
and rules at `/games/hitotsu`; at home in a family of its own, Colour cards 色札
(`/games/colour-cards`), with Crazy Eights, which it grew out of, shown there
too from its home in Cards.

## The name and the deck

UNO is a trademark, so this is our own game of the same family, as Connect
Four is (`inspiredBy: "UNO"`, which `RULES_ATTRIBUTION` prints). 一つ is "one":
the call a player makes with one card left, and a sibling of 五つ, itsutsu.

The deck is ours: 108 cards, four colours, each carrying one of the five
elements in its corners (火 red, 土 yellow, 木 green, 水 blue), so a card is
never told by colour alone; wilds in ink with all four, and a back marked 一つ.
Drawn once, as shapes, in `packages/hitotsu/src/card.ts`, not with the French
deck the family card games share.

## The package: packages/hitotsu

John, 2026-09-30: "I'll make hitotsu". The game is its own open-source
package, `@johnmorrisdotca/hitotsu` (MIT, John Morris), laid out as Korokoro
is: kept here under `packages/hitotsu/` and pushed to its own repository,
github.com/johnmorrisdotca/hitotsu, whose Pages workflow publishes its demo.
The site imports it by name (`tsconfig.json` paths), or by relative path under
`src/lib/party` and `e2e`, which the browser specs import. The package holds
everything that is the game, the site everything that is Itsutsu:

- The package: the rules (`rules.ts`: `startHitotsu`, `hitotsuMoves`,
  `hitotsuJumpIns`, `playHitotsu`, `hitotsuWinners`), the deck (`deck.ts`),
  the house rules as options and the Classic and Party presets
  (`constants.ts`), the computer player (`computer.ts`), one seat's view
  (`seat.ts`), a game as text (`codec.ts`), a table on several devices
  (`table.ts`: jumping in taken off), the card design (`card.ts`, and
  `HitotsuCardDrawing` in `react.tsx`), and a plain-DOM table against
  computers (`ui/`, `HitotsuTable` in React) for its demo. Tests beside them.
- The site: its party-game row (`src/lib/party/hitotsu/hitotsuRules.ts`,
  `hitotsu.copy.ts`), the table and set-up in its own look
  (`src/components/party/hitotsu/`), the online row and board, the family,
  the picture, My games and the browser tests.

A change to the rules or the card is made in the package, released there with
a line in its `CHANGELOG.md`, and pushed to its repository as well as here.

## The kind: a PartyKind of its own

`hitotsu` is a `PartyKind`, like Mexican Train, not a `CardGameKind`: its deck
and table are its own, and joining `CardPlay` would have tied every change to
Hitotsu to a re-take of the five card games' pictures. Nothing is recorded or
rated, and no migration was needed (a table on several devices keeps its game
as text, `PartyTable.game`).

- Rules: the package (above); the party row `HITOTSU_RULES` in
  `src/lib/party/hitotsu/hitotsuRules.ts` and its copy in `hitotsu.copy.ts`.
  Tests: `packages/hitotsu/src/rules.test.ts` (the published rules, each house
  rule, play-outs, the computer beating a random player, the codec),
  `table.test.ts`, `card.test.ts`.
- The table (`src/components/party/hitotsu/`): `HitotsuTable` (set-up or
  play), `HitotsuSetUp`, `HitotsuPlay`, `HitotsuDesk` (a hand and its presses,
  shared with the online board), `HitotsuTableTop`, `HitotsuSeats`,
  `hitotsuStore.ts` (`keptInBrowser`), `HitotsuOffer`, `HitotsuCard` (My
  games), all loaded in the browser only (`hitotsuClient.tsx`).
- Several devices: `src/lib/party/online/onlineHitotsu.ts` (the package's
  `table.ts` on the site's tables) and `src/components/party/online/HitotsuOnline.tsx`;
  the package's computer player in any seat (`onlineComputerMoves.ts`).

## The game and its variants

Classic is the published game: seven cards, 500 points, one card drawn, no
stacking, a Wild Draw Four that may be challenged. The set-up's **Party** mode
is five cards, one hand, stacking any draw card on any, jump-in and sevens and
zeros on. Every house rule can be changed either way:

| Rule | Classic | Party | What it does |
| --- | --- | --- | --- |
| Stacking | off | any | `same`: +2 on +2, +4 on +4; `any` (progressive draw): any draw card on any; the next player takes the total |
| Jump-in | off | on | a card identical to the top one played out of turn |
| Sevens and zeros | off | on | a 7 swaps hands with a chosen player; a 0 passes every hand on |
| Drawing | one card | one card | or draw until a card goes |
| Wild Draw Four | may be challenged | may be challenged | or no bluffing: only with nothing of the colour, never challenged |
| Length | 500 | one hand | or 200 |

Decisions worth knowing:

- **Its own shelf.** Cards already held the eight a shelf holds when Hitotsu
  arrived (Solitaire, FreeCell, Spider and the five family games), and Party
  games was full with its guests. Hitotsu's deck is not the French one, so it
  opened a family for its deck, as Mahjong and Dominoes did for theirs:
  Colour cards 色札, off the set-up screen, counting towards no award.
- **Eight seats, not ten.** Every party table stops at eight: the seat marbles
  (`PARTY_MARBLES`) and the party gate both do. Ten would need two more seat
  colours site-wide.
- **Jump-in is a table of one person.** It is a race for the card, which one
  screen between two people cannot run fairly, and a table on several devices
  takes a move only from the seat it waits on. So the set-up offers it where
  one person sits with computers on this device and says why elsewhere; the
  online rules refuse it at the start and never read a jump as a move.
- **The call** is a toggle pressed before the second-last card goes down;
  forgetting costs two cards at once (no race to catch it). A 7 or 0 under
  sevens-and-zeros needs no call, as the hand changes.
- **A blocked hand** (stock and pile spent, everybody passing) goes to whoever
  holds the fewest points.
- **The computer** stacks rather than takes, challenges a Wild Draw Four from
  a player holding many cards, saves its wilds, never bluffs, and always calls.

## Where it is held

The party gate (`party.coverage.test.ts`): copy, rules page, family, picture
(`pnpm screenshots:party`), table, browser test (`e2e/party-hitotsu.spec.ts`),
date (`pnpm games:added`). `onlineGames.test.ts` for several devices;
`e2e/bare-board.spec.ts` for just the board. The family: its row in
`families.data.ts`, its mark in `FamilyMark.tsx` (drawn by the package's
`HitotsuCardDrawing`), its page `src/app/games/colour-cards/page.tsx`, and
Crazy Eights' listing in `familyShelves.ts`. `/api/tables` takes a size up to
1000 now, since Hitotsu's size is the points it plays to.
