# Family card games: handover

**Status, 2026-09-29.** The work stopped here on request, because the machine
was overloaded. Branch `family-cards` is based on `5daf3cd2`, with the deck
commit `f29b9a51` from `cards-solitaire` merged in. Board row:
`family-card-games-hearts-big-2-president-go-fish-and-crazy-eights`.
The worktree is `.claude/worktrees/family-cards`, with database
`itsutsu_family_cards` on :55434 (migrated) and port 6732.

John, 2026-09-29, HIGH: "top 5 family card games, like Hearts, Big 2,
President/AKA A-hole, Go Fish? Youcan suggest the most popolar other games
that I'm missing. cards should be in the Itsutsu theme, backs of the cards
are probably styliized to have the itsutsu logos in a tiled beautiful
pattern."

## Done (committed, all tests green)

Everything is in `src/lib/cardGames/`: pure rules, one folder per game, with
each move returning a new state.

| File | What it is |
|---|---|
| `cards.ts` | Rule-level card ids ("QS", "TD"), which are the deck's own `cardId`. Deals come from the deck's seeded `shuffledDeck`, salted per deal (`mixSeed`). `cardOfId` maps an id to the deck's `Card` for drawing. |
| `cardGames.types.ts` | `CardGameRules<S, M>` is `PartyRules` plus `toPlay`, `computer` and `seats`. |
| `cardGameCodec.ts` | A kept game is `{v, g, size, players, computers, seed, moves}`. It is read back by replaying the moves through the rules, so a reload re-deals exactly and can never re-deal. |
| `cardGames.constants.ts` | `CardGameKind`, `CARD_GAME_LIST`, and `CARD_GAME_SPECS` (in `PartySpec` shape, ready to spread into `PARTY_SPECS`). It is alias-free and imports no rules, because `families.ts` sits on the e2e import chain. |
| `cardGameRules.ts` | `CARD_GAME_RULES`, a mapped type over the five games. |
| `climbing/` | The trick machinery Big Two and President share. A pass holds until the trick clears, and the lead passes on when the last player to play has gone out. |
| `hearts/` | Hearts for 3 or 4 players, to 50 or 100 points. The 2♦ is removed for three players. Passing goes left, right, across, hold (for three: left, right, hold). 2♣ leads. No points may be played on the first trick. Hearts may not be led until broken. Shooting the moon gives everyone else 26. |
| `bigTwo/` | Big Two for 2 to 4 players, over 1, 3 or 5 deals. Three players get 17 each, and the 52nd card goes to the holder of 3♦. The lowest card dealt must be in the first play. Five-card hands are included; no 2 in a straight and no wrap. Penalty is 1 point a card, ×2 at 10 or more, ×3 at 13 or more. Fewest points wins. |
| `president/` | President (Daifugō 大富豪) for 3 to 8 players, over 3, 5 or 7 rounds. Plays are 1 to 4 cards of one rank, with 2 high. The Beggar gives their 2 best cards to the President, who gives back 2 of their choice; the Vice-Beggar and Vice-President swap 1 the same way (with three players, 1 card between President and Beggar). The Beggar leads. A round scores the number of players who went out after you. The first dealt seat rotates each round. |
| `goFish/` | Go Fish for 2 to 6 players, one deal. Deal 7 each for 2 or 3 players, 5 each for more. Draw the rank you asked for and you ask again. A player with an empty hand draws when their turn comes. Most books wins. `log` records everything said aloud. |
| `crazyEights/` | Crazy Eights for 2 to 7 players, to 50, 100 or 200 points. Eights are wild and name the suit. Draw one card; you may play it if it matches. The discards reshuffle from a seed. A blocked hand goes to whoever holds the least. The winner scores what the others hold (8 = 50, picture cards = 10, ace = 1). |

**Computers.** Each game has a computer that reads a view (`<game>View`)
holding only its own hand and public information. Tests check that it
cannot see other hands.
- Hearts passes the queen and the high spades above her, and voids short suits; it ducks under tricks and dumps the queen on a winning king or ace.
- Big Two and President shed low combinations, avoid breaking up pairs, and save aces and twos.
- Go Fish remembers every ask, including who lacks a rank until they next draw unseen.
- Crazy Eights saves its eights and calls its longest suit.

Measured over 200 games, one computer against random players, at the default table size:

| Game | Computer wins | Chance alone |
|---|---|---|
| Hearts | 194 | 50 |
| Big Two | 190 | 50 |
| President | 197 | 50 |
| Go Fish | 163 | 67 |
| Crazy Eights | 128 | 67 |

**Tests.**
- Rule tests sit beside each game.
- `cardGames.simulation.test.ts` covers all five games:
  - computers finish every table, and every seat wins;
  - computer moves are always among the rules' own moves;
  - a computer beats random players;
  - games are kept and re-dealt exactly;
  - computer seats are remembered.
- In total, 73 tests pass in `src/lib/cardGames`.

**One shared change.** `PartyRules.start` takes an optional fourth argument,
`deal?: PartyDeal` (`{seed, computers?}`), in `src/lib/party/party.types.ts`.
Existing party games ignore it.

## Not started

- The five games are not yet `PartyKind`s.
- No tables, set-up screens, front doors, rules pages, pictures or e2e specs.
- No `docs/plans/family-cards/README.md` yet, and no `DOCS_UPKEEP.md` row.

## Decisions so far (John may reverse any)

1. **Each game is a `PartyKind`**: a table round one device, kept in the browser, never rated. A computer can sit in any seat, with at least one person at the table.
2. **"Size" means game length**, in each game's own terms:
   - Hearts: 50 or 100 points (default 100).
   - Big Two: 1, 3 or 5 deals (default 3).
   - President: 3, 5 or 7 rounds (default 3).
   - Go Fish: one deal only.
   - Crazy Eights: 50, 100 or 200 points (default 100).
3. **Seat counts**: Hearts 3–4, Big Two 2–4, President 3–8, Go Fish 2–6, Crazy Eights 2–7. Every table needs at least one person.
4. **A pass holds until the trick clears** in Big Two and President.
5. **In Big Two, the lowest card dealt leads every deal**, not the last deal's winner.
6. **President's titles** are President, Vice-President, Citizen, Vice-Beggar and Beggar ("Beggar", not the ruder name), with 大富豪 as the kanji accent.
7. **In Crazy Eights**:
   - You may draw only when you cannot play. You draw one card, and may play it if it matches.
   - An eight turned up to start goes under the stock.
   - The first player rotates each hand.
8. **In Hearts, the queen of spades does not break hearts.** Shooting the moon is scored, but the computer never tries it.

## The Cards family (agreed through itsutsu-95)

`cards-solitaire` adds the Cards family (its key, label, kanji and icon). This
branch then rebases and appends its five keys to that family's `games`.

Solitaire may be a recorded `PuzzleKind`. If so, loosen one line of the party
gate (`party.coverage.test.ts`, "belongs to a family no award counts") to "the
party game itself is not in `RECORDED_GAME_KEYS`", with the reason written
beside it (itsutsu-95 agreed).

## Next steps, in order

1. **Make them `PartyKind`s.** In `src/lib/party/`:
   - Add the five keys to `PartyKind`, `PARTY_KINDS` and `PARTY_KIND_LIST`.
   - Spread `CARD_GAME_SPECS` into `PARTY_SPECS`.
   - Add a `PARTY_DISPLAY` copy row for each game: label, kanji, tagline, origin, board, at least 3 rules, and `alsoKnownAs` (Big Two: Deuces, Choh Dai Di; President: Daifugō, Scum; Crazy Eights: Swedish Rummy).
   - Add `PARTY_SLUGS` entries (hearts, big-two, president, go-fish, crazy-eights).
   - Fill in `PartyPlays` and `PARTY_RULES` (from `CARD_GAME_RULES`), and `OFFERED_WORDS` and `TABLE_WORDS` in `partyRulesPage.ts`.
   - Add `GAME_ADDED` entries.
   - The party gate then lists everything still missing.
2. **Build one table component for all five**, under `src/components/party/cards/`. Use the deck's `CardHand`, `CardPile`, `useCardDrag` and `CardDragGhost`. It needs:
   - a set-up of seats, each a person or a computer, plus names and the length;
   - a cover screen ("pass the device to <name>") whenever the person to play changes and there is more than one person at the table. Show the hand only after they confirm; draw `CardHand hidden` for every other hand;
   - computer turns played with a short delay, from `rules.computer`;
   - a per-game centre: Hearts' trick, the climbing pile, Go Fish's ask panel with books, and Crazy Eights' discard pile and suit chooser;
   - drag a card to the centre, or tap to choose and then tap Play;
   - a double tap to play the obvious card;
   - `PLAY_SURFACE`, and `AskIfAway`;
   - keeping through `keptInBrowser`, with `PARTY_KIND_TABLES` rows (Game, Offer, Card).
   `<Page board>` already gives Just the board.
3. **Add the rest of the New Game Gate**:
   - front doors via `PartyFrontDoor`;
   - screenshots (`e2e/party-screenshots.spec.ts` scenes, then `pnpm screenshots:party`, which stamps `partyArt.data.ts`);
   - `pnpm games:added`;
   - an e2e spec per game;
   - `docs/plans/family-cards/README.md` with the decision, plus a `DOCS_UPKEEP.md` row.
4. **Run the brief's checks**: typecheck, eslint, `loc:check`, vitest with a dead database, and the e2e list, with screenshots at 390 and 1280 in light and dark.

## For John: the next most popular family card games

- **Spades**: Hearts' partnership cousin, four players in two teams, bidding tricks. The most-played card game online in North America after Solitaire and Hearts.
- **Gin Rummy**: the classic two-player game of sets and runs, knock and gin. Quick and deep.
- **Euchre**: a fast four-player partnership trick game with a 24-card deck and bowers. Huge in the Midwest and Ontario.
- **Cribbage**: the pegging-board game for two, counting fifteens and runs. Needs a peg board drawn.
- **Old Maid**: the simplest children's game of pairs, where you avoid being left with the odd queen. Almost no decisions.
- **Oh Hell**: a trick game for 3 to 7, bidding the exact number of tricks as hand sizes rise and fall. A great party game.
- **Canasta**: a long partnership rummy with two decks and melds of seven. Loved, but slow to learn.
- **War**: pure chance, flipping higher cards. No decisions at all, so a poor fit for a site of games.

**Recommended next: Spades.** It reuses almost all of Hearts: the trick
engine, following suit, the passing seat order and the computer's
trick-taking sense. It adds only bidding and teams, and it is the most-played
of the list. After it, Gin Rummy, the best two-player game missing here.
