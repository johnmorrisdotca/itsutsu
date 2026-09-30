# The family card games: Hearts, Big Two, President, Go Fish, Crazy Eights

John, 2026-09-29, HIGH: "top 5 family card games, like Hearts, Big 2,
President/AKA A-hole, Go Fish? You can suggest the most popular other games
that I'm missing." The deck they are played with, and Solitaire beside them in
the Cards family, are `docs/plans/cards/README.md`.

Board row: `family-card-games-hearts-big-2-president-go-fish-and-crazy-eights`.

## Each is a party game

A family card game is a table of three to eight round one device, played
through, never rated, and kept in the browser it is played in. That is what a
`PartyKind` already is (`docs/plans/party-games/README.md`).

What a card game adds to a party game:

- **A computer in any seat.** `PartyRules.start` takes the seats a computer plays (`computers`, one a seat) after the seed. Every table needs at least one person.
- **Hands nobody else may see.** This is the table's job, not the rules'. With two or more people, the table covers every hand between turns and asks for the device by name, as Tenka and Mexican Train do. A table of one person and computers never asks.

The rules are in `src/lib/cardGames/`, one folder a game. They are pure: every move returns a new game. Each game is kept as its table, its seed and its moves (`cardGameCodec.ts`), and a game read back is replayed from them. So a reload re-deals exactly, and can never re-deal.

`CardGameRules<S, M>` is `PartyRules` plus three things:

- `toPlay`, since Hearts passes seat by seat and Go Fish asks again after a catch;
- `computer`, which reads a view of only its own seat's hand and the public table (`<game>View`); tests hold that it cannot see other hands;
- `seats`.

### Where they live, and the gate's one line

The five are at home in **Cards** 札, beside Solitaire, and not on Party games.
A card game is the kind of game it is; who is round the table is how it is played.

Cards is a family a recorded game (Solitaire) calls home. The party gate used to ask that a party game's family keep no records. It now asks the question that line protected, of the game itself: a party game is never in `RECORDED_GAME_KEYS`, so nothing unrecorded counts towards an award. A family that keeps no records still has its own page at `/games/<key>`. The family's first, and its award, are Solitaire's alone.

### Kept out of the server

The table, its Play button and its My games card are all loaded in the browser only (`cardTableClient.tsx`, `next/dynamic` with `ssr: false`), as Mexican Train's are. The server's functions never carry the five games' rules, their computers or the deck's drawing.

`PARTY_RULES` names the card rules, and only the gate imports it.

Rules code a browser spec may import (`src/lib/cardGames/`, `src/lib/cards/`) uses relative imports only.

## The table

One table plays all five (`src/components/party/cards/`). What each game plays is its adapter (`cardAdapters.ts`: `heartsAdapter`, `climbAdapters` for Big Two and President, `goFishAdapter`, `crazyEightsAdapter`). An adapter turns a person's choice into a move; the rules decide it.

- **The set-up:**
  - how many players and how long;
  - a person or a computer in each seat, with names if you like. The first seat is whoever holds the device, and the rest open as computers;
  - the live table dealt for that many beside it;
  - every seat's row always laid out, so nothing changes height.
- **The play screen:**
  - everybody else in a row along the top, each with a card back, a count, their standing and whether a computer plays them;
  - the table in the middle, a `BoardFrame` in the reader's wood, twice as wide as tall;
  - the hand of whoever holds the device along the foot (`CardHand`);
  - the presses under the hand, and the scores.
- **Moving a card:**
  - tap cards to choose them (they rise), then press Play, Pass, Give, Ask, Draw or Call a suit;
  - or drag a card onto the table, or onto a player in Go Fish;
  - or tap a chosen card again to play it at once, where it has one obvious move.
- **Computers:** a computer plays its own seat 650 ms after its turn comes (`useCardComputer`), in the browser, waiting while the tab is hidden.
- **Kept and waiting:** the game is kept in `localStorage` after every move (`cardTableStores.ts`, on `keptInBrowser`). It waits in My games under Pass and play, and the Play button reads Continue while it lasts.
- **How long a game lasts, in each game's terms (its "size"):**
  - Hearts: to 50 or 100 points;
  - Big Two: 1, 3 or 5 deals;
  - President: 3, 5 or 7 rounds;
  - Go Fish: one deal;
  - Crazy Eights: to 50, 100 or 200 points.

## The computers, measured

Two hundred games at each game's default table: one computer against random players, with the other seats random.

| Game | The computer won | By chance alone |
|---|---|---|
| Hearts | 194 | 50 |
| Big Two | 190 | 50 |
| President | 197 | 50 |
| Go Fish | 163 | 67 |
| Crazy Eights | 128 | 67 |

How each plays:

- **Hearts** passes the queen and the high spades above her and voids short suits. It ducks under tricks and dumps the queen on a winning king or ace.
- **Big Two and President** shed their low plays, keep pairs together and save aces and twos.
- **Go Fish** remembers every ask, including who lacks a rank until they next draw unseen.
- **Crazy Eights** keeps its eights and calls its longest suit.

## The gate

- `party.coverage.test.ts` plays every table each game offers sixty times with random players. Every game ends, and every seat wins at least once.
- It also checks that each game is kept and read back exactly, and asks every other question of the New Game Gate.
- `cardGames.party.test.ts` names each game beside the party rules.
- `cardGames.simulation.test.ts` and the tests beside each game hold the rules and the computers.
- `e2e/card-games.spec.ts` plays each game at the table: tap, drag, double tap, the ask, the hidden hand passed on by name, and the game waiting in My games.

## Decisions to review

1. Each game is a `PartyKind`, at home in Cards rather than on Party games, and the party gate's family line was loosened as above.
2. "Size" is the game's length in its own terms: Hearts 50 or 100 points (default 100); Big Two 1, 3 or 5 deals (3); President 3, 5 or 7 rounds (3); Go Fish one deal; Crazy Eights 50, 100 or 200 points (100).
3. Seats: Hearts 3–4, Big Two 2–4, President 3–8, Go Fish 2–6, Crazy Eights 2–7, with at least one person at every table.
4. In Big Two and President, a pass holds until the trick clears. In Big Two the lowest card dealt leads every deal, not the winner of the last.
5. President's titles are President, Vice-President, Citizen, Vice-Beggar and Beggar. The ruder name is never used. The kanji is 大富豪.
6. In Crazy Eights you draw only when you cannot play, one card, and may play it if it matches. An eight turned up to start goes under the stock. The first player moves round each hand.
7. In Hearts the queen of spades does not break hearts. Shooting the moon is scored, but the computer never tries it.
8. Kanji: ハーツ, 大老二, 大富豪, 魚釣り, クレイジーエイト.
9. With two or more people, even the first turn is covered until its player says they have the device.
10. The table is 8 across by 4 down, and on a desk it keeps to a hand's width (`max-w-2xl`).
11. A double tap plays the card only where it has one obvious move. An eight waits for its suit to be called, and a Go Fish card waits for a player unless only one can be asked.

## For John: the next most popular family card games

- **Spades**: Hearts' partnership cousin, four players in two teams bidding tricks. The most-played card game online in North America after Solitaire and Hearts.
- **Gin Rummy**: the classic two-player game of sets and runs.
- **Euchre**: a fast four-player partnership trick game with a 24-card deck, huge in Ontario and the Midwest.
- **Cribbage**: counting fifteens and runs for two, on a peg board we would draw.
- **Oh Hell**: a trick game for 3 to 7, bidding the exact number of tricks as hands grow and shrink.
- **Old Maid** and **War**: children's games with almost no decisions, so a poor fit here.

**Recommended next: Spades.** It reuses almost all of Hearts: the trick engine, following suit, the seat order and the computer's trick-taking sense. It adds bidding and teams, and it is the most played of the list. After it, Gin Rummy, the best two-player game still missing.

## Spades (2026-09-30), and the Tricks family

Spades is the first of the next five, built as the plan above recommended: Hearts' trick engine with bidding and partnerships (`src/lib/cardGames/spades/`, `spadesAdapter.tsx`).

- **Always four**, partners across the table: seats 0 and 2 against 1 and 3, any of them a computer.
- **Bids** are nil or one to thirteen, pressed under the hand. No blind nil, and no ten-for-two-hundred bonus bid.
- **Scoring**: ten a trick bid and one a bag when the contract is made, minus ten a trick bid when it is not; every ten bags cost a hundred. Nil is a hundred either way, its bidder's tricks count for nothing towards the contract and are bags.
- **Length**: to 200, 300 or 500 points (500 the usual game). A partnership that sinks to minus the total loses, which also means a game of random bids always ends. Level at the end, another deal.
- **The computer** bids what its hand is worth (aces, guarded kings, long spades, voids beside three or four spades), nil only on a hand of nothing and never beside a partner's nil. Measured over 300 deals of four computers: the table bids 11.6 tricks on average and makes its contract 92% of the time.

**The Tricks family** トリック. A shelf holds eight games (`FAMILY_MOST_GAMES`). Cards had six; FreeCell and Spider, and Gin Rummy, Euchre, Cribbage and Oh Hell after Spades, would have made thirteen. Hearts and Spades moved to a new family, Tricks, at `/games/tricks`, off the set-up screen as Dominoes is. Cards keeps Solitaire (its award untouched) and the shedding games. Euchre, Oh Hell and Cribbage are to join Tricks; Gin Rummy joins Cards. John was asked on the thread; this is the recommended option, taken while the answer is awaited.
