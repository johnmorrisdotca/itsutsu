# Itsutsu's Core Ideas

A guide for a person meeting the codebase for the first time. It explains
seven ideas the rest of the site is built on: one engine for every game, a game
stored as its moves, the three ways a game is played, who a player is, how
ratings work, the computer players, and experience points.

It is written as explanation rather than as rules. The rules themselves live in
`AGENTS.md`, and the public explanation for players lives on the About page
(`src/app/about/`). Where this guide gives a number or a name, it was checked
against the code on 2026-09-24; the file that holds it is named so it can be
checked again.

## 1. One engine, every game

Itsutsu began as gomoku (five in a row) and now plays dozens of board games:
the five-in-a-row family, Connect Four's relatives, Pentago-style twists,
Reversi, checkers and draughts, Halma and Chinese Checkers, Hex and Go. None of
them is a special case in the code. Each game is a **variant**: a row in
`VARIANT_SPECS` (`src/lib/gomoku/gomoku.constants.ts`) that says what the
engine should do, plus a row of copy in `RULE_VARIANT_DISPLAY`
(`src/lib/gomoku/variants.constants.ts`) that says what a person reads.

A spec row answers questions like these:

| Question | Example answers |
| --- | --- |
| What wins? | five or more, exactly five, six, most discs, most territory, reaching the far camp, joining two sides |
| What is forbidden, and for whom? | Renju's double three, double four and overline, for black only |
| Do stones capture? | pairs (Ninuki-renju), pairs and triples (Sannuki-renju), jumps (checkers), surrounded groups (Go) |
| How many stones a turn? | one, or two after the first (Connect6) |
| Does anything happen after placing? | gravity, a quarter-turn of a quadrant, a flip |
| How are stones drawn? | on the lines (gomoku, Go) or in the cells (Othello, checkers) |

The engine (`src/lib/gomoku/engine.ts`, with the rule modules in
`src/lib/gomoku/rules/`) reads the spec and never switches on a game's name.
That is why a new game is a row of data and not a branch of code, and why the
same engine runs in three places: the board in the browser, the replay of a
stored game, and the server that checks every move of a shared game. There is
no second implementation of "who has won".

Two further properties hold the engine together:

- **It is pure.** Every engine function takes a `GameState` and returns a new
  one, leaving its input alone. No React, no database. The analysis modules
  (`threats.ts`, `analysis.ts`) sit above it and only advise.
- **Rules for a colour come from one function.** A handicap can give one colour
  a harder game than the other (black may not make a double three, say, while
  white plays freely). So anything that asks "may this colour do that" reads
  `rulesFor(settings, stone)` in `rules/handicap.ts`, which lays the handicap
  over the spec. Reading the spec directly for a colour would miss it.

Adding a game is cheap and finishing one is not, so a gate does the
remembering: `variants.coverage.test.ts` fails the build for a game with no
test of its own rule, no copy, no family, no screenshot or no end-to-end test.
`AGENTS.md`, "New Game Gate", lists everything a game needs.

## 2. A game is its moves

A stored game is **its settings plus its move list, never a board**. A board
and a move list can disagree; a move list replayed through the engine cannot.
So the `Game` row holds the size, the variant, the opening, the handicap and a
random `seed`, and the `Move` rows hold each stone in order. Anything with
chance in it (the dead squares of Obstacle Five, the piece queue of Domino
Five) is derived from the seed, so a replay reproduces it exactly.

A few consequences follow:

- **Anything that changes a game must be in the record.** A twist is stored on
  the stone that finishes it, a slide stores where the piece came from, and a
  swap decision in an opening is a timeline entry like a move. Resizing the
  board mid-game never passes the turn, because nothing in the record would
  mark it and the replay would alternate colours differently.
- **The engine's verdict is cached, not trusted blindly.** `Game.settledStatus`
  and `settledToPlay` hold what the engine made of the position the last time
  somebody settled it. Null means nobody has looked, not that the game is over,
  and a reader who finds null replays the moves.
- **Every position has an address.** `/games/<game>/match/<id>/<move>` is the
  position after that many moves, and `/history/<game>/<id>/<move>` is the same
  for a filed game: the link to send somebody who should see that moment.

## 3. Three ways a game is played

| | Where | Who holds the board | Rated? |
| --- | --- | --- | --- |
| **One screen, stored in the browser** | `/games/<game>/play` | The browser's local storage, filed with the server when it ends | Never |
| **Shared game** | `/games/<game>/match/<id>` | The server; each device polls it | Yes, when both seats are named and the game is set to count |
| **Embedded board** | `/embed`, in another site's iframe | The iframe; it makes no API calls | Never |

**The one-screen board** keeps a game in progress in local storage
(`src/components/game/gameStorage.ts`), so a refresh or a closed tab picks up
where it left off, undo history included. When it ends it is posted to
`POST /api/games` and filed in the record.

**A shared game** lives on the server. `POST /api/games/live` creates the row
with a token per seat, and **a seat token is the seat**: whoever opens
`/games/<game>/match/<id>/seat/<token>` plays that colour. That address claims
the seat into a cookie and redirects to the match, so the credential is used
once and never sits in the address bar. A seat link is shown only until
somebody takes the seat. Each seat also gets a QR code and an `sms:` link, so a
seat can be handed across a table with no messaging service in between.

The server re-checks every move against the engine (`appendMove` in
`src/lib/history/liveGame.ts`). The unique index on `(gameId, number)` on
`Move` is the concurrency control: two devices racing to play move 17 cannot
both succeed. The other device learns about a move by polling, every fifteen
seconds while somebody is looking and not at all once the tab is hidden or the
board has gone quiet (`src/components/live/pollCadence.ts`).

Shared games come in several shapes, all on the same row:

- **Hot seat.** Two people at one device: both seats carry the same token, so
  that token may play whichever colour is to move (`isHotSeat` in
  `liveGameRow.ts`). A hot-seat game is never rated.
- **An open seat.** The white seat is posted on a noticeboard (`openSeat`), and
  whoever answers first sits down through a conditional update, so two takers
  cannot both win. A computer player answers a seat left waiting for a day.
- **An offer.** A challenge, a rematch or a fork to a named person does not bind
  their seat. Their member id goes in `offeredToMemberId` until they accept,
  decline, or the sender withdraws. An accepted offer is cleared, so it becomes
  an ordinary game in every way.
- **A match.** Two, four or six games made at once between the same players,
  with colours alternating, sharing a `matchId`.

A game may carry a clock: a per-move limit or a whole-game budget, with
graceful or strict penalties for running out, and deadlines that respect a
member's away days. The server owns the clock: it stamps every move and
refuses a claim made early.

## 4. Who a player is

Three different things can stand at a seat, and the schema keeps them apart.

**A member** is somebody who has been let in: a `Member` row with an opaque id
that never changes. Seats, buddies, ignores, messages and experience points all
hang off that id. A member can prove who they are in two independent ways, and
may hold either or both (`src/lib/phrase/credentials.ts`):

- **A Google address.** Google proves the address; the member row says it is
  welcome here.
- **Four words.** A phrase the member picked by tapping words from a short
  list, stored the way a password is (scrypt, salted per row, never
  recoverable). It lets somebody with no address hold an account, and lets a
  member sign in or take their own seat on a borrowed device, a parent's iPad
  for instance, by tapping their name and then their four words. Nobody types
  anything, and the path is limited to five tries a minute.

A member may add either credential at any time and may never remove the last
one.

**A name** is what appears on a seat. Ratings were first earned by a typed
name, so the `Player` table is still keyed by the name folded to lower case,
with a `memberId` attached once somebody claims it. A name typed at one screen
and never claimed stays a name with no member behind it.

**The operator** runs the site. An address in `ADMIN_EMAILS` gets the operator's
session, which can mint invite codes and embed tokens, shut and restore
accounts, and change site settings. What the operator does to somebody else's
account is written to `OperatorAction`.

Getting in is by invitation. A code is three ordinary Japanese words
(`natsu-yagura-fune`), chosen to be read down a phone and typed back correctly.
Redeeming one exchanges it for a signed cookie, so the phrase stops being the
credential the moment it is used. Every rejection (unknown, revoked, expired,
spent) answers the same way, and tries are rate limited. Redeeming a code while
a Google identity is waiting creates the member: the first sign-in is the
registration.

Reading is open and playing is not. A visitor with no invite can read the
catalogue, every game's page, its rules and family, `/about` and `/learn`.
Everything else, including the players, the ladders and the record, needs a
session. Because some members are children and a player's page carries their
name, the people are closed even where the games are open. The gate is one
file, `src/proxy.ts`; see "Where the gate is" in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## 5. Ratings, and two pools

Every finished rated game moves both players' ratings by Elo, starting at 1600
(`src/lib/rating/elo.ts`). A favourite by more than 400 points gains nothing
for a win, which takes the point out of farming weak opponents.

| Tier | Rated games | K |
| --- | --- | --- |
| Unrated 未定 | fewer than 4 | 40 |
| Provisional 仮 | 4 to 19 | 40 |
| Established 確定 | 20 or more | 20 |

**Two pools, kept apart on purpose** (`src/lib/rating/pools.ts`). A game
against a computer player is rated in a pool of its own, on both sides, so
beating a program never moves where somebody stands among people. A single pool
would drift towards wherever the programs settled, because they are always
available and always rated. Both pools are shown; neither is averaged into the
other.

Ratings are kept twice more: once overall on `Player`, once per game on
`PlayerVariantRating`, so a Renju specialist and a Notakto specialist are not
ranked on one list. `recordResult` writes both in one pass. Runs of wins,
losses and draws are stored as columns beside them, because reading them back
from the games would cost a query per row on every list.

Separately, `Member.played`, `won`, `lost` and `drawn` count every finished
game a member has played, rated or not, so the members directory can sort by
them.

**Records from other sites.** Some members played for years on ItsYourTurn and
GoldToken. Those records are kept (`src/lib/legacy/`), counted beside a
player's games here, and marked as the snapshots they are. Games and wins add up
across sites; ratings never do, because no two sites share a scale.

## 6. The computer players

The computer players are members, not a setting on a game. They hold seats,
appear in the record, and carry ratings that move when somebody beats them.
Five are graded, gentlest to strongest, and play every game; three are
specialists who play one game each, named in homage to real champions of that
game. `Member.botTier` is what marks them as programs.

**They think in the browser, not on the server.** When a computer is to move
in a shared game, the device of the person waiting on it works the move out in
a web worker, with two seconds to think (`BROWSER_MOVE_MILLIS`), and posts it
through the same route and the same checks as any other move
(`src/components/live/useBotSeat.ts`). A server function would have had a
quarter of a second and a bill. The browser is trusted only with *which* legal
move the computer plays. If the tab closes mid-thought, the next visit to the
games page makes the move in that browser (`BotCatchUp`).

Bulk play (bot against bot, testing a grade's strength) runs locally, in
process, against the database directly, and never through the site's API. See
`AGENTS.md`, "Bulk Play Runs Here, Never Through the Site", and `pnpm
bots:play`.

## 7. Experience points

Experience points (XP) reward taking part, alongside ratings, which measure
strength. There are a hundred levels on a curve kept as a table in
`src/lib/xp/xpCurve.ts`, each with a name (`levelNames.constants.ts`).

- **The ledger is `XpEvent`,** one row per thing earned. Its unique index on
  `(memberId, type, subject)` is the whole idempotency design: the subject
  encodes how often an award may happen (the day for a daily award, the game id
  for a game, the variant for a first play, empty for once ever), so a replayed
  request writes a row that is already there and is refused.
- **Totals are denormalised onto `Member`** in the same transaction:
  `xp` (earned here), `xpImported` (credit for a kept record from another site)
  and `xpEverywhere` (the sum, which the boards sort by). The level is never
  stored; it is looked up from the total, so the curve can be retuned without a
  migration.
- **Programs earn XP from their games like anybody else.** A short list,
  `XP_PEOPLE_ONLY`, names the awards for things only a person does (joining,
  daily visits, adding a buddy), and `awardXp` holds those back from a program.

Every table of players on the site shows XP after the rating, and a test fails
the build for one that does not. See `AGENTS.md`, "Every Table Of Players Shows
XP, And The Programs Are Players".
