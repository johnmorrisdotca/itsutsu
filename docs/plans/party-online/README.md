# Party games on several devices

**Status: designed and built 2026-09-28 on branch `party-online`. The layer
and the first games are in; the rest are the stages at the end, in order.**

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
- **Kept on the account.** A table going is on My games > Going, under its own
  panel ("At a table"), your move first; a finished one is on Completed with
  the table's result. The inbox says when you are invited and when a table you
  sit at ends.

## Tables

Three tables, additive, every index and unique named (`map:`) and short
(migration `20260928200000_party_tables`):

| Table | One row per | Holds |
|---|---|---|
| `PartyTable` | table | the game (`game`, a `GameKey`), its board `size`, the **current state as the game's own encoded text** (`state`), a `version` that moves on every write, `status` (`playing` / `finished` / `ended`), the seat to play (`toPlay`, null once over), `winners`, `moveCount`, `movedAt` (the last move: the seat-never-answers clock), `hostId`, `endedById` |
| `PartySeat` | seat of a table | `kind` (`member` / `open` / `computer`), the `memberId` for a member's seat, the `name` shown, the open seat's link `token` (unique), `joinedAt` |
| `PartyAction` | move | the table, its `index`, the `seat` it was for, the move as JSON, `byId` (the member whose browser sent it: the mover, or for a computer's move the browser that worked it out), `createdAt` |

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

**Which games have a computer player today:** none of the games online so far.
Dots and Boxes, Chinese Checkers, Halma and Block Five have no computer player
for a table of more than two anywhere on the site, so their set-ups do not
offer a computer seat (and the server refuses one: `ONLINE_GAMES[key].computer`
is absent). Kumimoji's pass and play has three (`computerPlay.ts`,
`computerTurn.ts`), and Pair Go can seat the rated Go ladder's programs; both
join in the stages below, and their computers with them. The machinery — the
seat kind, the server's acceptance, `computerDriver` and `useComputerTurn` — is
built now and held by unit tests with a stand-in game; it is not driven by a
browser spec until a game with a computer joins.

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

1. **The layer and Dots and Boxes.** Tables, routes, the table page, polling,
   the seat link, the set-up's choice, My games, the inbox. Browser spec
   `e2e/party-online.spec.ts`.
2. **Chinese Checkers and Halma** (the race tables share `PartyRaceGame`), and
   **Block Five** if its tray rides the same component cheaply.
3. **Kumimoji pass and play, with its computer players.** Its hands are
   hidden: the table state holds every hand and the bag, so the server must
   send each seat a view with the other hands and the bag blanked (a
   `redact(state, seat)` on its `OnlineRules` row), and its `readMove` is a
   whole turn (the tiles laid, traded or a Done) rather than one placement.
   Its three computer players (`computerTurn.ts`) become `computer`, and the
   spec drives a computer seat.
4. **Pair Go.** Two teams of two over the engine's own Go; a seat is a
   player of a team. A computer seat can be one of the Go ladder's programs,
   played in the browser by the chooser the live board already uses.
5. **Superghost, Mancala, Tenka** join when their tables land, each by a row in
   `ONLINE_GAMES` and `ONLINE_VIEWS` and one browser case. A party kind whose
   rules answer `PartyRules` needs only `toPlay`, `readMove` and `named` beside
   them (`fromPartyRules` in `onlineGames.ts` builds the rest).

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
- The table is listed under its own "At a table" panel on Going, not merged
  into the two-player "Your move" and "Their move" columns.
- A computer's move is a browser's word for it: legal, checked, but not proven
  to be the move the computer would have chosen.
