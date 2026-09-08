<div align="center">

# 五目並べ · Gomoku

**Five in a row on a go board.** Two players, one browser — or two devices, a
QR code apart.

<img src="docs/images/board-in-play.jpg" alt="A game in progress on a kaya board" width="820">

</div>

---

## Contents

- [Getting started](#getting-started)
- [What it does](#what-it-does)
- [How it is put together](#how-it-is-put-together)
- [The API](#the-api)
- [Games played from two devices](#games-played-from-two-devices)
- [Embedding the board](#embedding-the-board)
- [Scripts](#scripts)

## Getting started

```bash
pnpm install
cp .env.example .env      # points at the local database below
pnpm local:db:up          # disposable Postgres in Docker
pnpm db:deploy            # apply migrations
pnpm dev                  # http://localhost:6600
```

`WEB_PORT` overrides the port. `pnpm local:db:reset` throws the database away
and rebuilds it from the migrations.

## What it does

### Seven ways to play

Every game here is a line of stones at heart. The **Games** button opens a
browser over the board with each rule set spelled out, and picking one starts
a new game with those rules.

| Game | What changes | Inspired by |
| --- | --- | --- |
| **Gomoku** 五目並べ | Five or more wins. Choose who opens, or draw lots. Line length 4, 5 or 6. |  |
| **Tournament Gomoku** 競技五目 | Exactly five wins; an overline (長連) does not. Black opens. |  |
| **Renju** 連珠 | Black may not make a double three (三三), double four (四四) or overline. White may, and white's overline wins. Forbidden points are marked ✕ and cannot be played. |  |
| **Omok** 오목 | The double three is forbidden for both sides. Overlines win. |  |
| **Caro** Cờ ca-rô | Exactly five wins, and not if an enemy stone shuts it in at both ends. |  |
| **Ninuki-renju** 二抜き連珠 | Flank a pair of enemy stones to capture it. Five in a row wins, and so does capturing five pairs. |  |
| **Connect6** 六子棋 | Black opens with one stone, then two stones a turn. Six in a row wins. |  |
| **Sannuki-renju** 三抜き連珠 | Ninuki-renju where a flanked triple is captured as well as a pair. Fifteen stones win; so does five in a row. Our name for the pair-and-triple rule. | Keryo-Pente |
| **Misère Five** 逆五目 | Five in a row loses. A full board goes to the opener. |  |
| **Toroidal Five** 輪王五目 | Five in a row on a board with no edges: left joins right and top joins bottom, so a line may run off any side and continue from the far one. Every intersection is a centre one. |  |
| **Obstacle Five** 石場五目 | Five in a row across six dead squares nothing can use and two hotspots that count as either colour. Drawn from the game's seed, so both players see the same board. |  |

Each is a row of data in `VARIANT_SPECS` — the line rule per colour, the
shapes each colour is forbidden, whether stones capture, stones per turn, a
pinned line length, and which openings it offers. The engine reads the spec and
never switches on a variant's name, so adding a game is adding a row and its
copy.

**Renju's forbidden points need reading ahead.** A *three* only counts if the
point that would turn it into an open four is itself a legal move, which means
asking the same question one stone deeper. `src/lib/gomoku/rules/forbidden.ts`
does that recursion (bounded, erring towards forbidding), counts a straight
four as one four rather than two, and lets a five through even when the same
stone makes a forbidden shape. The analysis and the hints filter through it,
so black is never advised to play a point black may not play.

### Openings

An opening only shapes the first stones, to blunt black's first-move advantage.

| Opening | Rule |
| --- | --- |
| **Free** | Anywhere. |
| **Pro** / **Long Pro** | Black opens at tengen; black's second stone must leave the central 5×5 (7×7). |
| **Swap** | Player 1 places black, white, black; Player 2 picks a colour. |
| **Swap2** | As Swap, or Player 2 adds white and black and hands the choice back. The World Championship rule. |
| **RIF** | Renju's classic start: tengen, then inside the 3×3, then inside the 5×5, after which white may swap. |
| **Sakata** | The RIF start and swap; then the fifth stone must land inside the 7×7, and there is only one of it. |
| **Tarannikov** | The first five stones land inside the 1×1, 3×3, 5×5, 7×7 and 9×9 in turn; after each, the other seat may swap. |

Yamaguchi, Soosyrv-8 and Taraguchi-10, and the fifth-move pair in full RIF, all
rest on black offering several candidate fifth moves for white to prune. That
mechanism is not built yet; the strategy guide for renju describes each of them.

A swap opening pauses the game for a decision, and the decision is a timeline
entry like a move, so it can be taken back. Stored games keep the moves and
the decisions, not the seating, so a record replays under the free opening —
the stones are the same wherever the rules said they had to go. Shared games
between two devices start with the free opening, because a seat token is a
colour and a swap would move the colour between devices.

### Five more games, and tic-tac-toe

The same board and engine also play games that are not gomoku. Each is a row
in `VARIANT_SPECS` like the others, with its own board size pinned, and the
settings it fixes are shown greyed rather than hidden, so the rules stay
visible.

| Game | What it is | Rules it pins | Inspired by |
| --- | --- | --- | --- |
| **Drop Four** 落とし四目 | Play anywhere in a column and the stone falls to the bottom, as if the board were upright and magnetic. Four wins. | 7×7 or 9×9, four in a row | Connect Four |
| **Twist Five** 回し五目 | Place a stone, then turn one of four 3×3 quadrants a quarter. Five anywhere wins after the turn; five for both is a draw. | 6×6, five | Pentago |
| **Twist Four** 回し四目 | The small twist game on four 2×2 quadrants. | 4×4, four | Pentago |
| **Trap Three** 罠三 | Four in a row wins; making exactly three of your own loses on the spot. | 5×5, four | Squava |
| **Square Four** 四角四目 | Four pieces each: place them, then slide one a step per turn. A line or a 2×2 square wins. | 5×5, four | Teeko |
| **Tic-tac-toe** 三目並べ | Three in a row. | 3×3, three |  |
| **Wild tic-tac-toe** 自由三目 | Place either colour; a line of either wins for whoever completes it. | 3×3, three |  |
| **Notakto** 黒三目 | Every stone is black; three in a row loses. | 3×3, three |  |
| **Maker and Breaker** 作り手と壊し手 | The mover places either colour. Black, the Maker, wins on any five of one colour; white, the Breaker, wins on a full board with none. Our name for the game published as Order and Chaos. | 6×6, five | Order and Chaos |

**Two games of our own**, with the same engine and a queue of pieces that
both players share:

| Game | What it is | Inspired by |
| --- | --- | --- |
| **Domino Five** 二連五目 | Gomoku where every piece is a domino of two stones, black-black, white-white or one of each. Both players draw the same random run and see the next three. Five wins for its colour whoever laid it, so a white-white domino in black's hand is a gift to the other side. Nothing fits, and the turn passes, on the record. |  |
| **Block Five** 積み五目 | The same with the seven four-square shapes, two black and two white each, rotated and flipped as you like, and six single stones of your own colour per player to fill gaps. As in a two-player falling-block match, both sides get the same sequence. | the seven tetromino shapes |

**The drop family** grows six ways, each a row in the table with one flag
set, and each with a random element fixed by a seed stored with the game so a
replay reproduces it:

| Game | The one rule that changes | Inspired by |
| --- | --- | --- |
| **Ring Drop** 輪落とし | The left and right edges join, so a line may wrap. | Connect Four |
| **Hole Drop** 穴落とし | One random square is dead: stones fall past it and no line runs through it. | Connect Four |
| **Hot Drop** 熱点落とし | One random hotspot counts as either colour, and one hole counts as nothing. A stone that finishes the other side's four through the hotspot loses. | Connect Four |
| **Clear Drop** 消し落とし | A full bottom row disappears and everything drops a row, as in the falling-block game. | Connect Four |
| **Giveaway Drop** 譲り落とし | Making four loses. You may not play on top of the opponent's last stone while another column has room. A full board goes to the opener. | Connect Four |
| **Edge Drop** 縁寄せ | Gravity from all four edges: a stone must rest on an edge or against another stone. | Connect Four |
| **Worm Drop** 穴通し落とし | Two random squares are the mouths of a wormhole: a line that reaches one continues from the other. | Connect Four |

Twists and slides are part of the record: a twist is stored on the stone it
finishes, a slide stores where the piece came from, and a replay reproduces
both. The threat reading is switched off for the twist and sliding games,
because a line-by-line reading of a board whose stones move says nothing true.

### Rules pages and the learning shelf

Every game has a rules page at `/rules/<game>` in one template — Object,
Board, Play, House rules — generated from the same spec the engine plays by,
so the page cannot drift from the rules. Each carries a screenshot of the
game in progress when one has been taken (`pnpm screenshots:games` writes
them into `public/games/`) and links to the strategy guides that apply.

`/learn` holds the guides: threats, shapes and tempo for the five-in-a-row
family; Renju's forbidden points and openings; captures; two stones a turn;
the drop family's parity; the twist games; the small games; and the piece
games. Written to be learned from, with the Japanese terms where the
literature uses them. Both sections are linked from the header.

### Players, ratings and records

A name is a player. There are no accounts, so whoever enters a name plays
for its record, and the site says so. Every finished game between two named
players updates both records and exchanges rating points:

| Tier | When | K |
| --- | --- | --- |
| Unrated 未定 | fewer than four rated games | 40 |
| Provisional 仮 | four to nineteen | 40 |
| Established 確定 | twenty or more | 20 |

Elo, starting at 1600, with a favourite by more than 400 points gaining
nothing for a win. Anonymous seats are never rated. `/players` lists the
leaders and `/players/<name>` shows a profile: rating, tier, won-lost-drawn
overall and by game, and recent games with replays. Ladders and tournaments
are not built; they are the next thing on the list.

### Notes, messages and deadlines

**Private notes** live under the record on the local board and beside a
shared game. They stay in the browser and are never sent anywhere.

**A message with an emoji.** In a shared game a short message can ride along
with a reaction. It reaches the other side on the next poll, floats over
their board with the emoji, and stays in the log.

**Deadlines with grace.** A shared game can carry a per-move limit, from five
minutes to a week, and a penalty for missing it. The graceful penalty
forfeits the turn: the waiting player may claim it, which records a pass and
hands the move back, or simply keep waiting, which is the "pass it back". Three
forfeits in a row lose the game. The strict penalty loses the game at once.
The server owns the clock: it stamps every move and refuses a claim made
early. Both settings are chosen when the game is started and can be changed
until the first stone.

**Email** is a placeholder. `src/lib/notify/email.ts` receives every event
that would be mailed — your turn, game over, invitations, a deadline near —
and records that nothing was sent. There is no provider and no address list;
wiring one is a decision for later, and this is the seam it plugs into.

### Are you still there?

If nothing has moved for two minutes during a game with a clock, a modal dims
the page and pauses the clock until someone taps it. Listening costs nothing:
each pointer, key or touch event only writes the time into a ref, and a timer
compares it with the clock once a minute.

### Handicaps

A handicap gives one colour the rules of a harder game while the other plays
the plain one, so a stronger player can give a weaker one a fair fight. Every
toggle is a restriction some variant already imposes on a colour:

| Toggle | Borrowed from |
| --- | --- |
| No double three 三三禁 | Renju, Omok |
| No double four 四四禁 | Renju |
| No overline 長連禁 (six never wins, and may not be made) | Renju |
| Exactly five 五連限定 | Tournament Gomoku, Renju |
| Open line only 両端開放 | Caro |
| One more in a row 六連 | A traditional gomoku handicap |
| One stone a turn 一手一子 | Connect6 |
| No captures 取り無し | Ninuki-renju |
| Second stone outside the central 5×5 or 7×7 | Pro, Long Pro |

Under the hood every rule the engine consults — line rule, forbidden shapes,
captures, stones per turn, line length, opening exclusion — is read through one
function, `rulesFor(settings, colour)`, which lays the handicap over the
variant's spec for that colour. A handicap can only tighten, never loosen. It
belongs to a colour, so the openings and swaps that move colours between seats
are switched off while one is set.

### The review

When a game ends, a review (感想戦) appears beside the statistics. It replays
the game under every other rule set with the same shape of turn and line and
reports where they would have parted: a stone Renju or Omok would have
forbidden, a winning overline Tournament Gomoku would not have counted, a five Caro
would have called shut in, a pair Ninuki-renju would have captured, or a game
another rule set would already have ended. It also says whether the winner
gave the game away along the route and still won, and — for named players —
where the result sits in their run of recorded wins.

### The board

Nine, thirteen, fifteen or nineteen lines. The 9×9 mini board keeps five in a
row, so a game finishes in a few minutes rather than half an hour. In freestyle
you choose who opens — black, white, or a draw of the lots (振り駒); the formal
rule sets keep black on move one, so that control disables itself.

Star blocks (星塞ぎ) seal the hoshi points and leave tengen open, which turns
the middle of the board into a fight over one intersection.

<img src="docs/images/mini-board.jpg" alt="The 9x9 mini board with the star points sealed" width="760">

### It tells you what you are walking into

Awareness is a lens on the position, never a rule. Turning it off changes what
you are told and nothing about what is legal — the engine never reads it.

<img src="docs/images/danger-warning.jpg" alt="A warning that a threat must be answered" width="760">

There are two different warnings, and the difference matters:

| | When it fires | What it means |
| --- | --- | --- |
| **受 Answer this** | A threat is already on the board | Block it this move or lose |
| **予兆 Something is forming** | The opponent could *build* an open three next move | Nothing is forced yet |

The second is one ply earlier than the first, and it is **off by default**. It
hands the defender a move they would otherwise have had to see coming, so it is
opt-in — and when it is on, both players get it on the same terms.

**敗着 — the losing move.** When a game becomes unwinnable, the record marks the
move that threw it away. That is rarely the move that just landed: ignoring an
open three is the mistake, but nothing is unstoppable until the open four
arrives, by which point the *opponent* is moving. So the blunder is attributed
to the losing side's last stone.

The reading is shallow on purpose. It sees immediate wins, unanswerable fours,
and the combined threats that follow from them, but it does not search. So
`lost` is reserved for positions one stone genuinely cannot save. Everything
short of that says *answer this*, not *it is over*.

### Clocks, odds and how the game went

Byoyomi (秒読み), the way professional go and renju are played: a main time,
then a number of short periods. Finish a move inside a period and you get the
whole period back, so a player in byoyomi can play forever as long as every
move is quick enough.

<img src="docs/images/clock-and-odds.jpg" alt="Clocks, a chance-of-winning bar and the early warning" width="820">

| Preset | Main time | Byoyomi |
| --- | --- | --- |
| Blitz 早碁 | 3 min | 3 × 10s |
| Rapid 速碁 | 10 min | 3 × 30s |
| Classical 持ち時間 | 30 min | 5 × 60s |

The chance-of-winning bar is an estimate from threats and shape, and is
labelled as one. The engine does not search, so it is a feel for the position
rather than a fact about it.

Afterwards, what actually happened — including two narrow, countable mistake
measures: **threats ignored** (you moved while the position was already
forcing and did not answer) and **losing moves** (you made a win unstoppable).

<img src="docs/images/game-stats.jpg" alt="Per-player statistics after a game" width="820">

### Hints, gifts and asking for advice

The engine will name a best move, on an allowance you can also **give to your
opponent** — a gift of a hint being a rather better way to be generous than
taking a move back. Or ask your opponent directly: they mark the point they
would play, and you decide what to do about it.

### The board can change size, if both players agree

A game that has run out of room is not always a game that has run out of ideas,
so the board can step up to the next size — and a game that is dragging with an
unused outer ring can step down. The stones keep their positions relative to
each other; the centre stays the centre.

It is proposed and agreed to rather than done, because it changes the game both
players are in. Nobody loses a turn either way.

Two rules hold it together, and both come from the same place — a stored game
is its settings plus its moves, and it has to replay to the position it
produced:

- **resizing never passes the turn.** A resize places no stone, so nothing in
  the record marks it; changing whose turn it was would make a replay alternate
  colours differently from the game that was played.
- **shrinking asks the record, not the board.** A ring can look empty and still
  hold a captured stone's move, or the `from` of a piece that slid inwards.
  Either would replay as a stone placed outside the smaller board, so the check
  is over `state.moves` — including each move's `from` — and not over the
  stones currently standing.

Games with a board size of their own — tic-tac-toe, the twist games, Trap Three
— cannot resize out of it, and neither can a board with obstacles, since those
are derived from the size.

### It looks like a board

Five surfaces — kaya, shin-kaya, washi, sumi, matcha — and five stone sets.

<p>
<img src="docs/images/theme-kaya.jpg" alt="Kaya" width="150">
<img src="docs/images/theme-shinkaya.jpg" alt="Shin-kaya" width="150">
<img src="docs/images/theme-washi.jpg" alt="Washi" width="150">
<img src="docs/images/theme-sumi.jpg" alt="Sumi" width="150">
<img src="docs/images/theme-matcha.jpg" alt="Matcha" width="150">
</p>

Coordinates and move numbers can be turned on, so a finished game reads like a
printed record.

<img src="docs/images/won-game.jpg" alt="A won game with the winning line marked and move numbers shown" width="820">

### Nothing is lost

A game in progress lives in local storage, so a refresh, a closed tab or a
flat battery all resume where you were — including the undo history. Every
finished game is filed in the record and can be replayed stone by stone.

<img src="docs/images/record.jpg" alt="The game record with filters and sorting" width="820">

## How it is put together

The rules live in `src/lib/gomoku/engine.ts` and nowhere else. Every function
takes a `GameState` and returns a new one, so the same engine runs the board in
your browser, replays a stored game, and validates moves on the server. There
is no second implementation of "who has won".

A stored game is **a move list, never a board**. A board and a move list can
disagree; a move list replayed through the engine cannot.

| Directory | What lives there |
| --- | --- |
| `src/lib/gomoku/` | Engine, threat analysis, win estimate, notation, replay. Pure, no React. |
| `src/lib/gomoku/rules/` | The variant rules the engine consults: lines, forbidden shapes, captures, turns, openings. |
| `src/lib/clock/` | Byoyomi clocks. Pure, and driven by the wall clock rather than tick counts. |
| `src/lib/history/` | Reading and writing game history. |
| `src/components/board/` | The board and its themes. |
| `src/components/game/` | The local game, its session, settings and record. |
| `src/components/live/` | Games played from two devices. |
| `src/app/api/` | The HTTP API. |
| `e2e/` | Playwright specs, including the screenshot spec. |

## The API

Listing endpoints answer `{ pagination, items }`, with `pagination` carrying
`page`, `pageSize`, `total` and `totalPages`. `page` is clamped against the real
total rather than rejected, so narrowing a filter never strands you on an empty
page. Ordering always ends with `id`, so paging cannot hide a row.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/games` | List games. Paging, sorting, search, filters, facets. |
| `POST` | `/api/games` | Record a finished game with its moves. |
| `POST` | `/api/games/live` | Start a game for two devices. Returns a token per seat. |
| `GET` | `/api/games/:id` | One game with every move. |
| `DELETE` | `/api/games/:id` | Remove a game and its moves. Operator only: `Authorization: Bearer $ADMIN_TOKEN`. Disabled when `ADMIN_TOKEN` is unset. |
| `GET` | `/api/games/:id/moves` | That game's moves, paged. |
| `POST` | `/api/games/:id/moves` | Play a stone in a shared game. |
| `PUT` | `/api/games/:id/settings` | Change a shared game's rules before its first stone. Needs a seat token. |
| `GET` | `/api/players?q=` | Player-name autocomplete. |

`GET /api/games` accepts `page`, `pageSize`, `sortBy`
(`playedAt`/`moveCount`/`size`/`duration`), `sortDir`, `search`, `player`,
`result`, `variant`, `size`, `from` and `to`. Everything is validated with Zod
at the route boundary; an unknown sort column is a `400`, an unrecordable game
is a `422` listing what was wrong.

```bash
curl 'localhost:6600/api/games?search=aki&result=black&sortBy=moveCount&sortDir=asc&pageSize=5'
```

## Getting in

The site is closed. Every page and every API route needs a signed session
cookie, enforced in `src/proxy.ts` before a route is reached — so a new
endpoint is private by default rather than private only if someone remembers
to guard it.

There are two ways through the door at `/join`:

| | How | Lasts |
| --- | --- | --- |
| **Player** | A three-word invite code | 30 days |
| **Operator** | An address in `ADMIN_EMAILS`, plus `ADMIN_TOKEN` | 1 day |

Both exchange what was typed for an HMAC-signed cookie, so neither the phrase
nor the token is presented again or stored by the client. Set `AUTH_SECRET` to
turn the gate on; without one it cannot verify anything and stays open, which
is what makes local development bearable and what a deployment must not do.

### Invite codes

The operator mints codes from the game page. They are three ordinary Japanese
words — `natsu-yagura-fune` — chosen so a code can be read down a phone and
typed back correctly: no long vowels, no doubled consonants, no `n` before a
labial, all screened by a test. Capitals, spaces and hyphens all normalise to
the same code.

Three words from 259 is about 24 bits, far less than a random id, so the safety
is not in the phrase alone:

- the redeem endpoint allows five tries a minute per address;
- a code is revocable, and revoking beats expiry and use count alike;
- redeeming exchanges the phrase for a cookie, so the phrase stops being the
  credential the moment it is used.

Every rejection — unknown, revoked, expired, spent — answers identically, so a
guesser learns nothing from which one they hit.

### Rate limits

`src/lib/api/rateLimit.ts`, following UmaKuma. Writes are far tighter than
reads because a write costs a database row. The store is per-instance, so
limits are approximate under serverless fan-out; that is a deliberate trade
against needing Redis on the hot path.

## Who gets in

Google is the front door; an invite code is the side door. `signIn` in
`src/lib/auth/google.ts` admits any verified Google address — it proves
identity only — and `/api/session/google` then decides membership: an
`ADMIN_EMAILS` address gets the operator's cookie, a `Member` row gets a
member's cookie (name and picture included), and anyone else is sent back to
`/join`, where their Google identity waits for an invite code. Redeeming a code
while a Google identity is waiting creates the `Member` row: the first sign-in
is the registration, and from then on Google alone lets them in on any device.

A code redeemed with no account behind it still lets that browser in, as
before. Sessions are one signed cookie either way (`src/lib/auth/session.ts`);
signing out clears it and Google's own cookies, so a shared phone asks again.

A member's seats are bound to their address (`Game.blackMember` /
`whiteMember`) when they start, scan or sit at a game, so their games follow
the account; a phone with no account holds its seats by cookie.

## Games played from two devices

`POST /api/games/live` returns `blackToken` and `whiteToken`. There is no
sign-in, so **a seat token is the seat**: whoever opens
`/games/:slug/:id/seat/<token>` plays that colour. That address claims the seat
into a cookie and sends the visitor on to the match at `/games/:slug/:id`, so
the credential is used once and never sits in the address bar. The match without
a claim is a spectator view, and it is never shown the seat links.

`/games/:slug/:id/:move` is the position after that many moves, kept current in
the bar as play goes on. Once the game is over it belongs to the record, which has the same shape:
`/history/:slug` is one game's record, `/history/:slug/:id` replays a filed game
and `/history/:slug/:id/:move` is the position after that move — the address to
send someone who should see that moment.

<img src="docs/images/shared-game.jpg" alt="A shared game showing a QR code for each seat" width="820">

Each seat gets a QR code and an `sms:` link, so a seat can be handed over
without any messaging infrastructure — no gateway, no stored phone numbers.

Every move is re-validated on the server: whose turn it is, whether the point
is free, whether the game is still running. The unique index on
`(gameId, number)` is the concurrency control, so two devices racing to play the
same move number cannot both succeed.

Seat pages carry `robots: noindex`, because a seat link is a credential.

### Your games

Nobody is stopped from clicking away from a game; instead the games page
lists the seats this browser holds, in the queue the turn-based sites taught:
**your move**, **their move**, **not started**, **lately finished**. A count of
games waiting on you sits beside "Play" in the header. "Yours" is decided by
the seat cookies on the request (`GET /api/games/mine`) — there are no
accounts, so the cookies are the only thing that knows which seats are yours.

A game may be posted **open**: its white seat goes on a noticeboard on the
games page (`openSeat`), and whoever answers first sits down
(`POST /api/games/:id/sit`, a conditional update so two takers cannot both
win). Whether a seat may **resign** is the host's choice (`allowResign`);
both options can be changed until the first stone.

A game with no move for `STALE_AFTER_DAYS` is flagged stale. Any seat holder
may resign a running game at any time (`POST /api/games/:id/resign`, seat
proved by token or cookie); the other colour wins, the record says
"by resignation", and the ratings move. Timed games additionally let the
waiting side claim a missed deadline.

### Reactions

Either player can send the other an emoji during the game: a cheer for a
move, a wince, a wave. The set is fixed, so nothing a stranger types is ever
shown to another player, and each one is tied to the move it answered.
Reactions ride along with the game on the same poll that carries moves, float
over the board for a few seconds, and stay in a small log underneath.
`POST /api/games/:id/reactions` takes a seat token and one of the listed
emoji, and is limited per seat.

### Inside a site that has its own sign-in

Seat tokens exist because this app has no accounts. A host that does have them
should map its own identities to seats and stop passing tokens in the query
string — `seatForToken` in `src/lib/history/liveGame.ts` is the single place
that decides which seat a request holds.

## Embedding the board

Use an iframe against `/embed`. It isolates CSS, JavaScript and React versions
completely, needs no shared build, and nothing the host sends can change the
rules.

<img src="docs/images/embed.jpg" alt="The embeddable board" width="320" align="right">

```html
<iframe src="https://your-host/embed?size=9&theme=sumi&stones=neon"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Parameters: `size` (9/13/15/19), `variant` (`freestyle`, `standard`, `renju`,
`omok`, `caro`, `ninuki`, `connect6`), `opening` (`free`, `pro`, `longPro`,
`swap`, `swap2`, `rif`), `obstacles`, `theme`, `stones`, `coords=0`. Unknown values fall back rather than erroring — a host should not
be able to break the board by mistyping a parameter.

The board posts messages outward — `gomoku:ready`, `gomoku:resize`,
`gomoku:move`, `gomoku:result` — so a host can size the frame and react to play:

```js
window.addEventListener("message", (event) => {
  if (event.data?.type === "gomoku:resize") frame.style.height = `${event.data.height}px`;
});
```

### Embed tokens

The site is closed, so `/embed` needs a token of its own. The operator mints
one per host — from the game page, or `pnpm embed-token <label>` — and gets
back the whole iframe snippet to paste.

```html
<iframe src="https://your-host/embed?token=eyJraW5kIjoiZW1iZWQi…&size=9"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Three facts shape that design:

- a cross-site iframe **cannot rely on cookies**, since browsers block
  third-party cookies, so the token travels in the URL and is checked on every
  request rather than exchanged for a session;
- `proxy.ts` verifies it on the Edge runtime, where Prisma cannot run, so the
  token carries its own HMAC proof instead of being looked up in a table;
- the embedded board **makes no API calls at all** — it is a local game — so a
  leaked token exposes a board and nothing else.

An embed token unlocks `/embed` and nothing else: `/`, `/history` and every API
route still refuse it, which is asserted by `e2e/embed.spec.ts`. Session
cookies and embed tokens are signed with the same key and separated only by a
`kind` field, so each side checks it — there is a test for pasting one in place
of the other.

Retiring a token is by expiry, or `EMBED_TOKEN_EPOCH` to invalidate every token
issued before a moment.

### Connecting an embed to the live data

The board stays local — a game played in an iframe is played in the browser and
never leaves it — but the embed can show what is happening on the server beside
it: how many games have been played, the most recent results, and one named
player's record.

```html
<iframe src="https://your-host/embed?token=…&size=9&stats=1&player=Akira"></iframe>
```

That is a wider grant than showing a board, so it is a **separate scope** on the
token rather than something every embed gets:

| Scope | Unlocks |
| --- | --- |
| `board` (default) | `/embed`, and nothing else |
| `data` | also `GET /api/embed/summary`, read-only |

A `board` token asking for the summary gets 404 — the endpoint does not
advertise itself to an embed that was never meant to reach it — and a token
minted before scopes existed carries none, so nothing gained a privilege by
being read with newer code. Neither scope opens `/`, `/history` or any other
API route, which `e2e/embed-data.spec.ts` asserts rather than assumes.

The summary is deliberately thin: finished games only, with no ids that grant
anything and no games still in progress, since a live game's id is half of a
seat link. Mint one with the checkbox on the game page, or
`pnpm embed-token <label> <days> <site> data`.

Framing is refused unless the host origin is listed in `EMBED_ALLOWED_ORIGINS`
(space-separated) — the token says *who may load it*, the CSP says *who may
frame it*, and a host needs both. Every route other than `/embed` refuses
framing outright.

If you want deeper integration than an iframe, `src/lib/gomoku/` is a pure
TypeScript module with no React or database dependency and can be imported
directly.

<br clear="right">

## Deploying

Production runs on Vercel with a Neon Postgres, the same shape as umakuma. A
push to `main` runs `.github/workflows/vercel-deploy.yml`: quality checks, the
dependency audit, a build, then `prisma migrate deploy` against the production
database, then the deploy. Migrations run before the new code goes live and
are all additive, so the old code keeps working during the switch.

One-time setup:

1. Create a Neon project and copy both connection strings: the pooled one is
   `DATABASE_URL`, the direct one is `DIRECT_URL`.
2. Create the Vercel project (`npx vercel link` from the repo, or the
   dashboard) and set `DATABASE_URL`, `DIRECT_URL`, an `ADMIN_TOKEN` for the
   delete endpoint and, if the board is to be embedded anywhere,
   `EMBED_ALLOWED_ORIGINS` in its production environment.
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub
   Actions secrets. The two IDs are in `.vercel/project.json` after linking.
4. Push to `main`.

`pnpm preflight:prod` runs the same checks the workflow does, locally.
`pnpm db:drift:check` compares the committed schema with whatever
`DATABASE_URL` points at and prints the SQL it is missing.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6600) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| End-to-end tests | `pnpm test:e2e` |
| Screenshots into `screenshots/` | `pnpm screenshots` |
| Rebuild `favicon.ico` from `icon.svg` | `pnpm favicon` |
| All gates | `pnpm quality:check` |
| Local database | `pnpm local:db:up` / `:down` / `:reset` |
| Migrations | `pnpm db:migrate` (dev) / `pnpm db:deploy` |

`pnpm quality:check` runs lint, the 500-line file size gate, typecheck and the
unit tests. See `AGENTS.md` for the conventions those gates enforce.

### What the record does not keep

The database stores a game's variant, size, obstacles and moves. It does not
store the opening protocol or a handicap, so a stored game replays under the
free opening with no handicap. For openings that changes nothing on the board.
For a handicap it can: a game one colour had to win with six replays as a game
it won with five. Keeping those needs two columns and a migration.
