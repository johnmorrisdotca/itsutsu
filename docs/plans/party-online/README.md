# Party games on several devices

**Status (2026-09-29): the layer, Dots and Boxes, Chinese Checkers, Halma
and Block Five (branch `party-online`), and Pair Go with the site's Go
programs in computer seats (branch `party-online-2`) are built and
browser-tested, and so are Kumimoji's pass and play with its own computer
player (John decided its two questions, below), Superghost and Mancala. Tenka
joins when its own agent has finished it.**

John, 2026-09-28: "all our Pass and Play games should ultimately get an agent
to make the Multi-device (invite a buddy / bot). so that they can be played on
multi-devices." Until now every party table was kept only in the browser it is
played in (`keptInBrowser.ts`): one phone, passed round. This is the one layer
that puts the same tables on several devices, each player on their own, and
the order the games join it.

## What a player sees

- **The set-up asks where.** Every party table's set-up gains one choice
  above the names: *This device* (pass and play, exactly as before) or
  *Several devices*. On several devices, seat 1 is you, and every other seat
  is one of: **a buddy** (from your own buddy list), **anyone with the link**,
  or **a computer** (only for a game that has a computer player; see below).
  Start makes the table on the server and opens it.
- **The table has an address**: `/games/<slug>/tables/<id>`. Each player opens
  it on their own device and sees the same board. Only the seat whose turn it
  is can move, and only from the device signed in as that seat's member.
- **An open seat has a link**, `/games/<slug>/tables/<id>/seat/<token>`, shown
  to everybody at the table in the seat card every seat link on the site is
  handed over in (`SeatCard`: QR code, the address, Copy, Text). Whoever opens
  it, signed in, takes that seat. A buddy invited by name is seated at once and
  told in their inbox; they can leave the seat, which opens it again.
- **Kept on the account.** A table going is on My games > In progress, under its own
  panel ("Online tables"), your move first; a finished one is on Completed with
  the table's result. The inbox says when you are invited and when a table you
  sit at ends.

## Tables

Three tables, additive, every index and unique named (`map:`) and short
(migration `20260928200000_party_tables`):

| Table | One row per | Holds |
|---|---|---|
| `PartyTable` | table | the game (`game`, a `GameKey`), its board `size`, the **current state as the game's own encoded text** (`state`), a `version` that moves on every write, `status` (`playing` / `finished` / `ended`), the seat to play (`toPlay`, null once over), `winners`, `moveCount`, `movedAt` (the last move: the seat-never-answers clock), `hostMemberId`, `endedByMemberId`, `finishedAt` |
| `PartySeat` | seat of a table | `kind` (`member` / `open` / `computer`), the `memberId` for a member's seat, the `name` shown, the open seat's link `token` (unique), `joinedAt` |
| `PartyAction` | move | the table, its `index`, the `seat` it was for, the move as JSON, `byMemberId` (the member whose browser sent it: the mover, or for a computer's move the browser that worked it out), `createdAt` |

No column points at `Member` by a foreign key, so a table outlives any one
member. Removing an account (`removeMember`) opens that member's seats with no
link and blanks the name when asked; the tables they made and the moves their
browser sent keep their place without the account.

`PartyAction` is the record — who sent what, and when — and nothing reads it to
answer a poll or a move. The state is kept whole on the table row, so
**answering a poll never replays a game**, on the server or anywhere else: it
is one indexed read of three numbers.

## The rules: one adapter per game, the same pure rules as the local table

`src/lib/party/online/onlineGames.ts` is `ONLINE_GAMES`, one row per game that
can be played online, each an `OnlineRules<S, M>` (`online.types.ts`) built
from the rules the local table already uses — `DOTS_RULES`
(`PartyRules`), `PARTY_CHECKERS_RULES` and `PARTY_HALMA_RULES`
(`PartyRaceRules`), Block Five's `layBlocks`:

- `start(size, count)`, `encode`, `decode` — the game's own text, the very
  text the browser keeps it as on one device;
- `toPlay`, `over`, `winners`;
- `readMove(unknown)` — a move as the browser sent it, checked for shape, or
  null;
- `play(state, move)` — the game after it, or null for a move the rules
  refuse;
- `named(state, names)` — the state with the seats' names written in, for the
  page to draw (the stored state carries no names: they come from the seats,
  so a seat taken by a link needs no rewrite of the game);
- `computer?(state, seat)` — a computer player's move, where the game has one.

A new game is a row: `OnlineGameKey` is the list, and the client's
`ONLINE_VIEWS` (`src/components/party/online/onlineViews.ts`) is a `Record`
over it, so a row without a board to draw does not compile.

## How a move flows

1. The player taps on their own device. The page sends
   `POST /api/tables/<id>/moves` with `{ moves, seat, move }`: how many moves
   the game it was drawn from had, the seat, and the move.
2. The route reads the table and its seats (one query), and refuses unless the
   table is playing, the seat to play is a member's seat held by the reader,
   and the game has as many moves as the page had seen (else **409 with the
   current table**, so a page that was behind is brought up to date by its own
   refusal). Moves rather than the version: somebody taking or leaving an open
   seat moves the version, and must not refuse the move of a player whose page
   had not yet seen them.
3. It decodes the stored state with the game's own rules, reads the move, and
   asks `play`. A move the rules refuse is **422**; the client is never trusted
   with the outcome, only with the choice.
4. It writes the new state, version + 1, the next seat, status and winners
   **conditionally on the version it read** (`updateMany … where version`), and
   the action row, in one transaction. Two sends for one turn: one lands, the
   other is a 409.
5. The answer is the new table. The mover's page takes it as its own copy and
   asks nothing more.
6. Every other page at the table sees it at its next poll: the poll's tag has
   moved, so the answer is the whole table instead of a 304.
7. When the move ends the game, every member at the table is told in their
   inbox how it went (won, shared, lost).

## Cadence and cost per open table

The live two-player board's cadence, reused rather than rewritten:
`pollInterval`, `pollEvery`, `POLL_MS`, `POLL_FAST_MS`, `useBoardAwake` and
`IDLE_STOP_MS` from `src/components/live/`. `useOnlineTable` hands them to SWR
exactly as `useLiveGame` does.

- **The ordinary cadence on your own turn**, as the live board keeps: nobody
  else can move, but you may from another device, and a seat taken or left
  shows. Never the fast cadence for yourself.
- **Every 15 seconds** (`POLL_MS`, the operator's "ordinary" setting) while
  the table waits on somebody else who is not on the site.
- **Every 3 seconds** (`POLL_FAST_MS`, the operator's "other player here"
  setting) while the seat it waits on belongs to a member seen on the site in
  the last two minutes (`PRESENT_WITHIN_MS`). Never for a computer's seat, an
  open seat, or a member under 13 (whose presence is never shown). The page
  says which on `data-poll-hurrying`.
- **Never from a hidden tab** (`refreshWhenHidden: false`; SWR asks on focus),
  and **not at all after six minutes with nothing happening** (`IDLE_STOP_MS`),
  until a press, a key, focus or the tab being shown wakes it.
- **A poll is one indexed read** — `GET /api/tables/<id>` reads the version,
  whether the seat to play is here and whether the turn has waited past the
  lease, in one query over three primary keys, and answers **304** when the
  tag the browser holds is still true. Beside it, at most once a minute, the
  reader is stamped as seen (`touchMemberFromPoll`), as the live board does.
  Only a changed table reads the seats and names and sends the table (a few
  hundred bytes of state).
- **One server call per page view**: the table page renders the table on the
  server, and SWR starts from it (`fallbackData`) without asking again.
- **No held connections, no timers on the server, nothing replayed per poll.**

So one open table costs at most 4 polls a minute (15 s) — 20 (3 s) only while
the member it waits on is on the site — none hidden, none after six idle minutes,
none once the table is over; almost every poll is a 304 after one indexed read. A move costs one read, one decode and one
play of the game's own rules (a few milliseconds: Dots and Boxes replays at
most 84 lines, a race its moves), and two writes.

## Computer seats

**A computer's move is worked out in a browser, never on the server.** The
browser that works it out is decided by one pure function
(`computerDriver` in `onlineSeats.ts`), so exactly one browser does in the
ordinary case:

- **the member whose move handed the turn to the computer** — their page has
  just received the new table and is certainly open — works it out at once and
  sends it as the computer's seat;
- if that browser went away before sending it, **any member seated at the
  table** whose page is open works it out once the computer's turn has waited
  `COMPUTER_TAKEOVER_MS` (thirty seconds).

The server takes a computer's move exactly as it takes a person's — the
version, the rules, the seat to play — plus that the sender is a member seated
at the table. Two browsers sending one computer turn cannot both land (the
version), so the rule's worst case is a 409 nobody sees. What the server cannot
check is that the move is the one the computer player would have chosen: a
member could send a weaker legal move for the computer they are playing
against. That is the same trust the practice board and the live board's
browser-played computer moves already give, and it is written down here as a
decision.

**The move is worked out in a worker** (`onlineComputerWorker.ts`): the page
hands it the table's game as its rules keep it, the seat and the computer's
level, and sends back what it answers, so a search on the browser's budget
never freezes the board. A game's computers are a row's `computers`
(`OnlineComputers`): the levels a seat may be given, who each sits as, and the
move. For a game the site's ladder plays, a level is a `BotTier` and the seat
is that program's own member row, so its name leads to its page — no column
was added for it.

**Which games have computer players today:** Pair Go, whose seats may be given
to the site's Go programs (`tiersFor(go)`, the same list Go's own set-up
offers), each choosing its move with the ladder's chooser on the browser's
two-second budget (`chooseTurn`). `e2e/party-online-go.spec.ts` is the first
browser spec that drives a computer seat: after a member's stone both
programs are to play, the table records that the browser which sent their
moves was that member's, and the other member's device sees all three arrive.
Dots and Boxes, Chinese Checkers, Halma and Block Five have no computer player
for a table of more than two anywhere on the site, so their set-ups offer
none and the server refuses one. Kumimoji's three (`computerTurn.ts`) join with
it.

## Who may sit where

- **Members only.** Every route is under `/api/` and every page under
  `/games/<slug>/tables/`, neither in `OPEN_PATTERNS`, so the gate
  (`src/proxy.ts`) sends a stranger to `/join` and answers an API call 401. No
  new gate exception.
- **Only the table's own members read it.** A member not seated at a table is
  told it does not exist (404), so a table's names are not a spectator's.
- **A buddy invited by name** must be a person (`listable`), not ignoring the
  host, and reachable by the host (`mayReachMember`).
- **Under 13, the stricter rule** (`childRules.ts`, John 2026-09-24):
  - a member under 13 cannot make a table with a link seat (the set-up does not
    offer it and the route refuses it) — the table equivalent of not emailing
    invitations;
  - nobody is seated at a table (by invite or by link) where they and any
    member already seated fail `mayReachMember` in either direction — so a
    child sits only with people on their own buddy list;
  - nobody is seated with somebody ignoring them, or whom they ignore;
  - a child's seat never counts as "here" for the fast cadence.
- **Twenty tables at once** (`PARTY_TABLES_MOST`), counted apart from the
  twenty games at once: checked for the host at Start, and for a member at the
  moment they are seated by invite or link.

## Leaving, and a seat that never answers

- **Leave** gives your seat back: it opens again with a fresh link, and the
  table waits on it when its turn comes. The last member to leave ends the
  table.
- **End** finishes the table with no winner, for everybody. Any member at the
  table may end it before its first move, and after that only when the seat to
  play has not moved for **seven days** (`PARTY_TURN_WAIT_DAYS`) and is not
  their own. Decided when the table is read, never by a timer. An ended table
  is on Completed as ended, and nobody's record changes: party tables are never
  rated.

## Notices

- **Inbox:** an invitation (`table-invite`) to the member invited by name, and
  the result (`table-over`: won, shared, lost or ended) to every member at a
  table that finishes. Written by the code that makes it happen, one insert.
- **"Your move" email: not yet.** The site's your-turn notice
  (`sendNotice({ kind: "your-turn" })`) is written for two-player `Game` rows,
  and every game notice is switched off site-wide (`NOTICES.sending`) until a
  digest exists. When the digest arrives, a table's turn joins it as one more
  kind; until then My games' "your move" is the notice, as it is for a
  two-player game.

## Stages

1. **Done: the layer and Dots and Boxes.** Tables, routes, the table page,
   polling, the seat link, the set-up's choice, My games, the inbox.
   Browser spec `e2e/party-online.spec.ts`: two members in two phone-sized
   browsers, a buddy seated from the set-up and told in the inbox, a move from
   each device arriving on the other by its own poll (and the fast cadence
   while the other is here), the server refusing a move for another seat, a
   line already drawn, a stale page and a member not at the table, the game
   played to its end and on both members' Completed and inboxes; then a seat
   taken by its link, and given back by leaving.
2. **Done: Chinese Checkers, Halma and Block Five.** The race tables share
   `RaceOnline`; Block Five's hand is one hook (`useBlocksHand`) for both
   kinds of table. Browser spec `e2e/party-online-races.spec.ts`: a move from
   each of two devices at each race, the server refusing a move for the other
   seat, and at Block Five a shape laid from each device with two link seats
   left open, the table then waiting on them. The races are not played to
   their end in a browser (a whole race is hundreds of taps); the end of a
   table is game-agnostic and is driven end to end at Dots and Boxes.
3. **Done: Pair Go** (branch `party-online-2`). Two teams of two over the
   engine's own Go (`onlinePairGo.ts`); a seat is a place in the order round
   the table (Black 1, White 1, Black 2, White 2), a move is a stone, a pass or
   a resignation, and a seat may be one of the site's Go programs.
4. **Done: Kumimoji pass and play, with its computer player**
   (`onlineKumimoji.ts`, `e2e/party-online-kumimoji.spec.ts`). John decided
   both questions on 2026-09-29, in his words: **"yes, all hands visible and
   browser checks to save $$$."** So:
   - **Every seat sees every hand**, as on one device. There is no redacted
     view; the table state is sent whole, as for every other game.
   - **The browser checks the words, and the server takes its word for
     them.** The dictionary is never loaded on the server. What the server
     still checks, because it is cheap: the move's shape, whose turn it is,
     the game the page drew it from, and that every tile moved was in that
     seat's hand or the pool it says it came from. A made-up word from a
     member's own browser is the one thing it cannot catch, and that is the
     trade John chose.
   - A move is a press: Draw (everybody takes a tile, and the turn goes on),
     Done or Resign, carrying the seat as the turn left it — hand, table and
     the pool's counters. Laying, lifting, turning a wild and trading stay on
     the mover's device until then. The server checks the seat tile by tile
     (`withSeat`: what it holds is what it held, plus what it took from the
     pool, less what it gave back, with no more than three taken for each
     given), then runs the game's own `drawAll`, `endTurn` or `resign` with
     the browser's word for "the table is sound" and "the hand spells a
     word". A tile's family is read without the lists (`tileFamily.ts`).
   - The table starts from the bag the set-up's browser dealt from the
     address's seed (the deal needs the word lists); the server checks it is
     a bag of the game's — every tile one of the set's, as many tiles and
     wilds as that game is dealt, enough to deal to that many.
   - Its computer (`planComputerTurn`) plays a whole turn in one move: every
     Draw it pressed, then its Done or Resign. The worker loads the word list
     first. A computer's move and the lists are in the worker's own module
     (`onlineComputerMoves.ts`), never in a route's bundle.
   - Offered from Kumimoji's pass-and-play page, above the names, where the
     number of players is already chosen. English only in practice: the kept
     game's reader (`decodeParty`) accepts only English tiles, so a Japanese
     table is refused at Start rather than stored unreadable — true of the
     game kept on one device too, and worth a look of its own.
5. **Done: Superghost and Mancala** (`onlineWordGames.ts`,
   `e2e/party-online-words.spec.ts`). Mancala is a row through
   `fromPartyRules`: its `PartyRules` and the four things they do not say.
   Superghost is not, because its party rules read the word list
   (`ghostRules.ts`): its row plays the game's own `playGhost` with a judge
   that answers what the browser said — the same shape a kept game is read
   back with — so a move is the move and the browser's word on whether a
   letter finished a word, or a word named is one. Everything else (whose
   turn, a letter of the alphabet, an answer long enough and holding the
   fragment) the rules check. The table's language comes with the set-up.
   Neither has a computer player, so neither offers a computer seat.
6. **Tenka** joins the same way once its own agent has finished it: a row in
   `ONLINE_GAMES` (through `fromPartyRules` if its party rules need no word
   list or other data the server must not load), a board in `ONLINE_VIEWS`,
   `WhereChoice` and `SeatChoiceSelect` in its set-up, and one browser case;
   a computer player, if it has one, is `computers` on its row and its move
   in `onlineComputerMoves.ts`.

## Decisions to review

- The host sits in seat 1 and moves first.
- Seats are filled at Start: a buddy by name is seated at once (told in their
  inbox, free to leave), not asked first as a two-player offer is.
- A table can start with open seats: play goes round, and waits on an open
  seat when its turn comes.
- A table is read only by its own members (no spectators).
- The page polls at the ordinary cadence on the reader's own turn (the live
  board's rule), so a second device of theirs and a seat taken show.
- Leaving opens your seat again rather than ending the table.
- Seven days before a silent turn lets the others end the table.
- Twenty tables at once, apart from the twenty games.
- The table is listed under its own "Online tables" panel on In progress, not merged
  into the two-player "Your move" and "Their move" columns.
- A computer's move is a browser's word for it: legal, checked, but not proven
  to be the move the computer would have chosen.
- A Pair Go computer seat is a program at the browser's two-second budget, the
  live board's; nothing stronger is offered at a table.
- In Pair Go both players of the winning team are told they "shared the win".
- Kumimoji: a turn's laying stays on the mover's device until Draw, Done or
  Resign, so the others see a turn when it is pressed, not tile by tile.
- Kumimoji's bag is the host browser's word for its letters (the server
  checks its size, its wilds and that every tile is one of the set's).
- Superghost at a table takes the browser's word on words, as Kumimoji does:
  a member's own browser could claim a word is one when it is not.
- Mancala at a table is drawn as it stands after a sowing, not sown seed by
  seed as on one device.
- Names at a table are the name the site prints (`shownName`: first name and
  an initial); the whole name never leaves the server.
- The pass-and-play leads now say "or choose Several devices"; Pair Go's,
  which is not online yet, still says it is kept only in this browser.
- A table page says "Your turn." above the game's own turn line, which also
  names whose turn it is — two lines where one might do.
