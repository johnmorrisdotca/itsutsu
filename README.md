<div align="center">

# 五つ · Itsutsu

**Forty-five board games on one engine, and three puzzles beside them.** Gomoku and renju, Othello and Go,
checkers and draughts, Hex and Halma — two players in one browser, or two
devices a QR code apart.

[**itsutsu.com**](https://itsutsu.com) · Next.js 16 · React 19 · TypeScript ·
Postgres

<img src="docs/images/board-in-play.jpg" alt="A game in progress on a kaya board" width="820">

</div>

---

- **New to the code?** Read this page, then
  [`docs/CORE_CONCEPTS.md`](docs/CORE_CONCEPTS.md) for the ideas it rests on,
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it fits together and
  [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for the database.
- **Changing the code?** [`AGENTS.md`](AGENTS.md) is the rulebook. It is long
  because every rule in it was learned the hard way, and the gates enforce most
  of it.

The site is in beta, free, and joining is by invitation. Anybody can read the
games and their rules without one.

## Contents

- [Getting started](#getting-started)
- [What it does](#what-it-does)
- [How it is put together](#how-it-is-put-together)
- [The API](#the-api)
- [Getting in](#getting-in)
- [Who gets in](#who-gets-in)
- [Games played from two devices](#games-played-from-two-devices)
- [Embedding the board](#embedding-the-board)
- [Deploying](#deploying)
- [Scripts](#scripts)
- [Documentation](#documentation)

## Getting started

You need Node.js 24 (`.nvmrc`), pnpm 10 (never npm or yarn) and Docker for the
local database.

```bash
cp .env.example .env      # before installing: the Prisma client records it
pnpm install
pnpm local:db:up          # disposable Postgres in Docker, port 55434
pnpm db:deploy            # apply migrations
pnpm dev                  # http://localhost:6700
```

`WEB_PORT` overrides the port. `pnpm local:db:reset` throws the database away
and rebuilds it from the migrations. In a git worktree especially, copy `.env`
in before `pnpm install`: the install generates the Prisma client, and a client
generated before `.env` existed may never load it (`pnpm db:generate` fixes it
afterwards).

The variables that matter first, all described in `.env.example`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Postgres: pooled for the app, direct for migrations. The example points both at the local container |
| `AUTH_SECRET` | Signs sessions and embed tokens, at least 16 characters. Without it the gate stays open in development and refuses everything in production |
| `ADMIN_EMAILS` | The operator's addresses. Locally, end the list with `operator@example.test`, which the browser suite signs in as |
| `ADMIN_TOKEN` | Lets local tooling and the browser suite act as the operator without Google |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL` | Google sign-in |
| `RATE_LIMIT_RELIEF` | `20` for the browser suite, which drives the site from one address. Ignored in production |
| `SUMILABU_BOARD_URL` and the `*_DEV_TOKEN`s | The shared features board and settings store, on the development project |

## What it does

### Forty-five games and three puzzles, in eight families

The site began as one game and is now forty-five board games and three puzzles,
grouped into eight families on `/games` (`GAME_FAMILIES` in
`src/lib/gomoku/families.ts`):

| Family | Games |
| --- | --- |
| Five in a row | 7 |
| Drops | 8 |
| Turn and take | 8 |
| Strange boards | 6 |
| Checkers | 6 |
| Territory and races | 4 |
| Small boards | 6 |
| Numbers | 3 |

No family shows more than eight games — a gate in `variants.coverage.test.ts`
holds that — and a game may also be listed on a second family's shelf for
discovery (`ALSO_LISTED_IN`), while it belongs to one. The **Games** button
opens a browser over the board with each rule set spelled out, and picking one
starts a new game with those rules.

Every board game is a row in `VARIANT_SPECS` that the same engine plays; none
of them is a special case in the code. The tables below group them by how they
play, which is not quite how the families group them: the capture games sit
with the flips, and the toroidal, obstacle, twist and piece games sit on the
strange boards. The Numbers family is different in kind — see "Puzzles" below.

#### Puzzles

A puzzle is for one person: a grid, a few givens, and exactly one answer. It
is not a variant — the engine cannot play it, nobody is rated at it and no
`Game` row is written — but a kind of its own (`PuzzleKind`,
`src/lib/puzzles/`) catalogued beside the games through `GameKey`
(`src/lib/catalogue/gameKeys.ts`), with the same address shape
(`/games/number-place`, its `/rules`, `/family`, `/new` and `/play`) and the
same gates: `puzzles.coverage.test.ts` asks a puzzle what
`variants.coverage.test.ts` asks a game.

Everything that thinks runs in the browser. The generators, the uniqueness
checks and the difficulty ratings are ours (`numberPlace/`, `hiddenStones/`,
`moreOrLess/`, `jigsaw/`, `killer/`, `towers/`, `blackAndWhite/`; Hidden
Stones grows its regions out from a placed answer and then tightens the grid
until the solver counts one; Futoshiki adds givens until it is a puzzle and then takes away every one it does not need), seeded
so the same number makes the same grid in every browser,
and the solve page makes its puzzle after it has loaded (`ssr: false`). The
one thing the server does is `POST /api/puzzles/solved`: an O(cells) check
that a member's finished grid is a solution (`puzzleCheck.ts`), and the XP
writes a finished game makes — `puzzleSolved` (25, six a day) and the tour's
first-of-this-puzzle and first-of-the-family, so the eighth family can be
met. Nothing polls and nothing is timed on a server.

| Puzzle | Our version of | Sizes | Levels |
| --- | --- | --- | --- |
Names are the ones players search for, the kanji ours (数独 is Nikoli's mark
in Japan, so the Japanese name is ナンプレ); addresses kept their first slugs
(`/games/number-place`, `/games/more-or-less`, …) so links already sent work.

| Puzzle | Our version of | Sizes | Levels |
| --- | --- | --- | --- |
| **Sudoku** ナンプレ | Howard Garns's Number Place (1979), named Sudoku by Nikoli | 4×4, 6×6, 9×9 and the 16×16 Giant (1–9 then A–G) | easy, medium, hard, by what the solver needs: singles only, one guess, more |
| **Jigsaw Sudoku** 変形ナンプレ | Sudoku with irregular regions for boxes | 5×5, 6×6, 7×7, 9×9 | easy, medium, hard |
| **Diagonal Sudoku** 対角ナンプレ | Sudoku X: the two long diagonals count too | 6×6, 9×9 | easy, medium, hard |
| **Killer Sudoku** サムナンプレ | dashed cages with sums, next to nothing printed | 6×6, 9×9 | easy, medium, hard |
| **Futoshiki** 不等式 | a Latin square with more-than marks between cells; every given and mark is needed | 4×4 to 7×7 | easy, medium, hard, as Sudoku |
| **Skyscrapers** 摩天楼 | clues around the edge count the towers seen | 4×4 to 7×7 | graded by what a person sees at a glance |
| **Hidden Stones** 隠し石 | the one-star form of Star Battle, played daily as Queens (LinkedIn's name): one black stone in every row, column and region, no two touching | 5×5, 7×7, 9×9 and 10×10 (made at 6×6 and 8×8 too, not offered) | easy (reasoning alone finishes it), hard (a stone has to be tried) |
| **Black and White** 白黒 | Takuzu / Binairo: half of each colour in every line, never three alike, no line repeated | 6×6, 8×8, 10×10, 12×12 | graded by what a person sees at a glance |

Every finished puzzle a member solves is kept (`PuzzleSolve`), so a puzzle's
page shows the fastest solves at each size and level (`/standings`) and a
member their own (`/me`). Two members can race one grid (`PuzzleRace`, at
`/games/<slug>/match/<id>`): the host's browser makes the puzzle and posts it
whole, the guest takes the other seat by a link, each presses Start and the
site keeps both clocks from its own stamps, and the faster correct solve wins
`raceWon` (50 XP) on top of the solve. A seat started and not finished within
two hours reads as given up, decided when the race is read; nothing polls,
and the race page reads again when a browser comes back to it or presses
Refresh. See `docs/plans/numbers/NUM-05-race-a-friend.md` and
`docs/DATA_MODEL.md`.

#### Lines of stones

The eleven the site started from. Each is five in a row with one thing
changed.

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
entry like a move, so it can be taken back. A game's opening is stored with it
(`Game.opening`). Shared games between two devices may use the free, Pro or
Long Pro opening but not the swaps, because a seat token is a colour and a swap
would move the colour between devices.

#### Small boards, drops and twists

Games that are not gomoku, played by the same engine. Each pins its own board
size, and the settings it fixes are shown greyed rather than hidden, so the
rules stay visible.

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

**The drop family** grows seven ways, each a row in the table with one flag
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
| **Wormhole Drop** 穴通し落とし | Two random squares are the mouths of a wormhole: a line that reaches one continues from the other. | Connect Four |

#### Games where no line is ever read

The flipping games, the races, Hex, checkers and Go: they keep the board and
the record and nothing else. Every one of them still returns a new `GameState`
from the same engine — what changes is what the engine is asked at the end of a
move.

| Game | What it is | Board |
| --- | --- | --- |
| **Reversi** リバーシ | Bracket a run of the other colour and it turns. Most discs at the end wins. Inspired by Othello. | 8×8 |
| **Classic Reversi** 古式リバーシ | The 1880s rule: the players lay the first four discs themselves, one a turn, before any flipping starts. | 8×8 |
| **Anti-Reversi** 逆リバーシ | Everything turns as usual, and the *fewer* discs wins. You may not decline a move that is there. | 8×8 |
| **Mini Reversi** 小リバーシ | The flipping game small, and it may grow mid-game if both agree: the position moves to the centre of the next size up. | 4×4, 6×6, 8×8 |
| **Grand Reversi** 大リバーシ | More middle to fight over before anyone reaches an edge. | 10×10 |
| **Honeycomb** 蜂の巣 | Reversi on a hexagon of hexagons: six ways to bracket a run, six corners that never turn. | hexagon of hexagons |
| **Halma** ハルマ | A race: step, or jump chains over any piece, and fill the far corner first. Nothing is ever captured. | 16×16, 10×10, 8×8 |
| **Chinese Checkers** ダイヤモンドゲーム | Ten pieces, a six-pointed star, and the point opposite yours to fill. Jumps chain and turn corners. | 17×17 star |
| **Hex** ヘックス | Join your own two sides with an unbroken chain. A full board always has exactly one winner, so there are no draws — which is why the swap opening is offered. | 11, 13, 19 |
| **Checkers** チェッカー | Jump the other side's pieces off the board. Capturing is forced, a man crowned partway through a chain stops there, and a king moves both ways. | 8×8 |
| **Russian Draughts** ロシアチェッカー | Flying kings on 8×8: men take backward, any capture may be chosen, and a man crowned mid-capture takes on as a king. | 8×8 |
| **Pool Checkers** プールチェッカー | American pool: men take backward, kings fly, and you choose which capture to make. | 8×8 |
| **Brazilian Draughts** ブラジルチェッカー | The international rules on the small board: men take backward, kings fly, and the longest capture is compulsory. | 8×8 |
| **International Draughts** 国際ドラフツ | Men take backward, kings fly, and you must take the most you can. The FMJD's game. | 10×10 |
| **Canadian Checkers** カナディアンチェッカー | The international rules on 144 squares, with thirty men a side. | 12×12 |
| **Go** 囲碁 | Surround more of the board than the other colour. Groups share liberties, the ko rule forbids instantly retaking, two passes end it, and White takes 6.5 komi so it can never be a tie. | 19×19, 13×13, 9×9 |

Six of those are the checkers family, and they differ only in rules, never in
aim: whether a man may capture backward, whether a king slides any distance,
and whether you must take the longest chain or may choose. Worth knowing that
**English checkers is the only one of the six that has been solved** — weakly,
by Schaeffer's team in 2007, and it is a draw. The same board and the same
twelve men under Brazilian rules is a different game, and open.

The games where pieces MOVE rather than land have no natural end — two kings
shuffling is a game neither player can be made to stop — so those carry a
no-progress rule of their own: checkers by the draughts count of forty moves
each without a capture or a man's move, the races by whether anybody has got
nearer home over a window of play. See `rules/noProgress.ts`.

Twists and slides are part of the record: a twist is stored on the stone it
finishes, a slide stores where the piece came from, and a replay reproduces
both. The threat reading is switched off for the twist and sliding games,
because a line-by-line reading of a board whose stones move says nothing true.

### Rules pages and the learning shelf

Every game has a rules page at `/games/<game>/rules` in one template — Object,
Board, Play, House rules — generated from the same spec the engine plays by,
so the page cannot drift from the rules. Each carries a screenshot of the
game in progress when one has been taken (`pnpm screenshots:games` writes
them into `public/art/games/`) and links to the strategy guides that apply.

`/learn` holds the guides: threats, shapes and tempo for the five-in-a-row
family; Renju's forbidden points and openings; captures; two stones a turn;
the drop family's parity; the twist games; the small games; and the piece
games. Written to be learned from, with the Japanese terms where the
literature uses them. Both sections are linked from the header.

### Players, ratings and records

Ratings began as a record kept for a NAME, when a name was the only identity
the site had. They now hang off the member who claims the name
(`Player.memberId`), and an anonymous seat is never rated. Every finished rated
game between two named players updates both records and exchanges rating
points:

| Tier | When | K |
| --- | --- | --- |
| Unrated 未定 | fewer than four rated games | 40 |
| Provisional 仮 | four to nineteen | 40 |
| Established 確定 | twenty or more | 20 |

Elo, starting at 1600, with a favourite by more than 400 points gaining
nothing for a win. Each game also keeps a ladder of its own
(`PlayerVariantRating`), shown at `/games/<game>/standings`, and `/champions`
names who leads each one. `/players` has five tabs — members, buddies, the
ladder, the computer players and the remembered records — and
`/players/<name>` is one page per person, whoever they are.

**Two rating pools, kept apart on purpose.** A game against a computer player
is rated in a pool of its own, so beating a program never moves where you
stand among people. Both are shown; neither is averaged into the other.

**Records from before this site.** Some members played for years on
ItsYourTurn and GoldToken, and some people are here only as a record kept
under their name. Those are not a different kind of person — they are a
different SOURCE, and a player's page counts every source they have, with a
control to narrow it to Itsutsu alone. Games and wins add up across sites;
ratings never do, because no two sites share a scale, so there is no combined
rating and the page says why rather than leaving a blank. Figures copied from
another site are marked as the snapshots they are, in a list as well as on a
page: they were written down once and do not move.

Tournaments are not built yet.

### The computer players

Seventeen of them, and they are members rather than a setting on a game: they
hold seats, appear in the record, and carry a rating that moves when you beat
them. Five are graded — **разряд**, **級**, **段**, **名人** and **国手**,
gentlest to strongest — and will play anything on the site. Six are
specialists who play one game or family well, each named in homage to a real
champion of it: **為乃木秀正** at Reversi, **Andrus Meritalu** at five in a
row, **Howard Monkton** at Halma and Chinese Checkers, **Marion Tinsdale** at
checkers and draughts, **本堂秀策** at Go and **吳一辰** at Connect6. And six are
characters with faces and home towns, each playing at an existing grade in a
style of their own: Mina Park, Kenji Arakawa, Li Wenjing, Amara Okafor, Ingrid
Solheim and Rafa Duarte.

**They think in your browser, not on the server.** A computer's move is worked
out by a web worker on the device of whoever is waiting on it, with two seconds
to think (`BROWSER_MOVE_MILLIS`), where a paid server function would have had a
quarter of one. Measured, that is most of a grade of strength, and nobody is
billed for it. How strong each grade really is, game by game, is measured by
the grades playing each other (`ladder.match.test.ts`) and shown on the About
page and each game's page.

A computer answers a seat that has been sitting on the noticeboard longer than
a day, so a posted game gets played whether or not anybody else is about. It
waits first on purpose: a seat answered the instant it is posted is not a
noticeboard, it is a button with extra steps.

### The backlog

`/backlog` is where a request lives once the conversation that raised it is
over. Every feature asked for and every fault reported is a row: a title, the
longer telling, who asked, its kind (feature, fix or chore), a priority and an
effort once somebody has graded it, and where it stands — **open**,
**in progress** (a claim with a six-hour lease), **done**, or **dropped**
(considered and passed over, kept so the answer need not be given twice). The
operator writes to it from the page; agents write to it with `pnpm task`.

Which moves are allowed is a table, not a convention: a proposal cannot reach
done without having been built, and a dropped item comes back as a proposal
rather than as work. `src/lib/backlog/backlog.ts` holds that table and every
other decision, purely; the row's select is built from it, and the rows
themselves live on Sumilabu's board, which refuses anything the table rejects
whatever calls it. `backlog.coverage.test.ts` is the gate — see AGENTS.md,
"Board Gate".

The other half is `/releases`: **every release so far**, parsed from
`CHANGELOG.md` at request time rather than kept a second time, with the edition
being served marked. The operator's page carries a card with both
counts — what is still wanted, and the latest release — and a link into it.

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

**Email** goes through Resend, in production only. It sends two things today:
a request for an invite from `/join`, which reaches the site's owner, and a
member's invitation to a friend. Game notices (your move, game over) are
written and switched off (`NOTICES` in `src/lib/mail/mail.constants.ts`).
Every send passes one sender and caps counted in the database
(`EmailSendCount`): fifty a day and a thousand a month for the site, five a
day per member. See [`docs/email.md`](docs/email.md).

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

The rules live in `src/lib/gomoku/engine.ts` and the `rules/` modules it
delegates to, and nowhere else. Every function takes a `GameState` and returns
a new one, so the same engine runs the board in your browser, replays a stored
game, and validates moves on the server. There is no second implementation of
"who has won".

A variant is a row in `VARIANT_SPECS` plus its copy, and the engine reads the
spec rather than switching on a variant's name. That is what lets forty-five
games share one engine — and `variants.coverage.test.ts` fails the build for a
game that is missing its tests, its copy, its family or its screenshot, so a
new game cannot ship half-finished.

A stored game is **a move list, never a board**. A board and a move list can
disagree; a move list replayed through the engine cannot.

| Directory | What lives there |
| --- | --- |
| `src/lib/gomoku/` | Engine, threat analysis, win estimate, notation, replay. Pure, no React. |
| `src/lib/gomoku/rules/` | The variant rules the engine consults: lines, forbidden shapes, captures, turns, openings. |
| `src/lib/clock/` | Byoyomi clocks. Pure, and driven by the wall clock rather than tick counts. |
| `src/lib/history/` | Reading and writing game history. |
| `src/lib/backlog/` | The features board: its rules, its copy, its starter set. Pure, apart from `backlogStore.ts`. |
| `src/lib/rating/` | Elo, the two rating pools, and what a list prints beside a name. |
| `src/lib/bots/` | The computer players as members: who they are, the seats they take, the moves they play. |
| `src/lib/legacy/` | Records kept from the sites people played on before this one. |
| `src/lib/auth/` | Members, invite codes, sessions, and the operator's roster. |
| `src/lib/social/` | Buddies, ignores, who is here, countries and days off. |
| `src/lib/phrase/` | The four-word credential: picking, hashing, taking a seat with it. |
| `src/lib/xp/` | Experience points: awards, the ledger, levels, the boards. |
| `src/lib/mail/` | Email through Resend, behind caps kept in the database. |
| `src/lib/i18n/` | The phrase catalogue, in English and Japanese. |
| `src/lib/sumilabu/`, `src/lib/site/` | The shared features board and the site settings, both on Sumilabu. |
| `src/components/board/` | The board and its themes. |
| `src/components/game/` | The local game, its session, settings and record. |
| `src/components/live/` | Games played from two devices. |
| `src/app/api/` | The HTTP API. |
| `e2e/` | Playwright specs, including the screenshot spec. |

## The API

Every route validates its input with Zod at the boundary, is rate limited, and
answers typed JSON. Sorting and paging follow one convention
(`src/lib/api/paging.ts`): `sort=<column>[:asc|desc]`, `limit`, and an opaque
`cursor` from the previous page. An unknown sort column is a `400` that names
what is accepted, and an unrecordable game is a `422` listing what was wrong.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/games` | List games: filters, sorting, facets. Answers `{ pagination, next, items, facets }`. |
| `POST` | `/api/games` | Record a finished game from one screen, with its moves. |
| `POST` | `/api/games/live` | Start a shared game. Returns a token per seat. |
| `GET` | `/api/games/mine` | The games this browser and this member hold a seat in. |
| `GET` | `/api/games/:id` | One game with every move. |
| `DELETE` | `/api/games/:id` | Remove a game. Operator only: `Authorization: Bearer $ADMIN_TOKEN`. |
| `GET` `POST` `DELETE` | `/api/games/:id/moves` | Read the moves, play one, or take one back (hot-seat games only). |
| `PUT` | `/api/games/:id/settings` | Change a shared game's rules before its first stone. |
| `POST` | `/api/games/:id/sit`, `.../sit-as` | Take the open seat; take your own seat on somebody else's device with your four words. |
| `POST` | `/api/games/:id/resign`, `.../cancel`, `.../timeout`, `.../time` | End a game, call it off, claim a missed deadline, or give the other side time. |
| `POST` | `/api/games/:id/offer/accept`, `.../decline`, `.../withdraw` | Answer or take back a game offered to a person. |
| `POST` | `/api/games/:id/reactions`, `.../applause`, `.../verdict`, `.../hide` | An emoji during play; appreciation, a private verdict or hiding it afterwards. |
| `GET` | `/api/players`, `/api/members`, `/api/ladder` | Name autocomplete, the members directory, a game's ladder. |
| `PATCH` | `/api/me` | Your profile and preferences. |
| `GET` `PUT` `DELETE` | `/api/me/phrase` | Your four words: whether you have them, set them, remove them. |
| `GET` `POST` `DELETE` | `/api/buddies`, `/api/ignores` | Your buddy and ignore lists. |
| `POST` | `/api/messages` | A direct message to another member. |
| `GET` `POST` `DELETE` | `/api/session` | Sign in with an invite code or as the operator; sign out. |
| `POST` | `/api/invites/mine` | Invite a friend: one use, thirty days. |
| `GET` `POST` | `/api/invites` | The operator's invite codes. |

`GET /api/games` filters by `search`, `player`, `member`, `against`, `result`,
`outcome`, `pool`, `rated`, `verdict`, `variant` (a game's slug), `size`,
`from` and `to`.

```bash
curl 'localhost:6700/api/games?search=aki&result=black&sort=moves:asc&limit=5'
```

## Getting in

Reading is open and playing is gated. A visitor with no invite can read the
games: `/games`, every game's page, its rules, family and background, `/about`
and `/learn`. Everything else — playing, the players, the ladders, the record —
needs a signed session cookie, enforced in `src/proxy.ts` before a route is
reached, so a new endpoint is private by default rather than private only if
someone remembers to guard it. A visitor who knows nobody here can ask for an
invite from `/join`; the request is emailed to the site's owner, behind caps
of its own so a script cannot spend the site's email (`inviteRequest.ts`).

There are two ways through the door at `/join`:

| | How | Lasts |
| --- | --- | --- |
| **Player** | A three-word invite code | 30 days |
| **Operator** | An address in `ADMIN_EMAILS`, plus `ADMIN_TOKEN` | 1 day |

Both exchange what was typed for an HMAC-signed cookie, so neither the phrase
nor the token is presented again or stored by the client. An operator address
signing in with Google gets the operator's cookie with no token at all; the
token is for local tooling and the browser suite. Set `AUTH_SECRET` to turn the
gate on. Without one it cannot verify anything: in development it stays open,
which is what makes local work bearable, and in production it answers 503
rather than open the site.

Two switches sit in front of all of that. Who may sign up (invite only, open,
or closed) and a notice on the join page are site settings, kept on Sumilabu
and changed from `/admin`. `SITE_MAINTENANCE=on` shows everybody but the
operator a 503 from the gate itself.

### Invite codes

The operator mints codes from `/admin` or `pnpm invite`, and a member can
invite a friend with a one-use code of their own. They are three ordinary
Japanese words — `natsu-yagura-fune` — chosen so a code can be read down a phone and
typed back correctly: no long vowels, no doubled consonants, no `n` before a
labial, all screened by a test. Capitals, spaces and hyphens all normalise to
the same code.

Three words from 260 is about 24 bits, far less than a random id, so the safety
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

A code redeemed with no Google identity waiting still makes a member, one with
no address. That member can add **four words** later (`src/lib/phrase/`): a
second credential, hashed like a password, picked by tapping words rather than
typing. It lets somebody sign in on a borrowed device, or take their own seat
at a game on somebody else's, by tapping their name and then their words.
Either credential may be added at any time; the last one may not be removed.
Sessions are one signed cookie either way (`src/lib/auth/session.ts`); signing
out clears it and Google's own cookies, so a shared phone asks again.

A member's seats are bound to their member id (`Game.blackMemberId` /
`whiteMemberId`) when they start, scan or sit at a game, so their games follow
the account; a phone with no session holds its seats by cookie.

## Games played from two devices

`POST /api/games/live` returns `blackToken` and `whiteToken`. **A seat token is
the seat**, whether or not anybody is signed in: whoever opens
`/games/:slug/match/:id/seat/<token>` plays that colour. That address claims
the seat into a cookie and sends the visitor on to the match at
`/games/:slug/match/:id`, so the credential is used once and never sits in the
address bar. The match without a claim is a spectator view, and it is never
shown the seat links.

`/games/:slug/match/:id/:move` is the position after that many moves, kept
current in the bar as play goes on, and the same address serves the game once
it is over — the address to send someone who should see that moment.
`/games/:slug/history` is that game's record, and `/games/:slug/me` is your
own games of it.

<img src="docs/images/shared-game.jpg" alt="A shared game showing a QR code for each seat" width="820">

Each seat gets a QR code and an `sms:` link, so a seat can be handed over
without any messaging infrastructure — no gateway, no stored phone numbers.

Every move is re-validated on the server: whose turn it is, whether the point
is free, whether the game is still running. The unique index on
`(gameId, number)` is the concurrency control, so two devices racing to play the
same move number cannot both succeed.

Seat pages carry `robots: noindex`, because a seat link is a credential.

### Your games

Nobody is stopped from clicking away from a game; instead `/play` lists the
seats this browser and this member hold, in the queue the turn-based sites taught:
**your move**, **their move**, **not started**, **lately finished**. A count of
games waiting on you sits beside "Play" in the header. "Yours" is decided by
the seat cookies on the request and the signed-in member's own seats and offers
(`GET /api/games/mine`).

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

Seat tokens exist so a seat can be handed to somebody with no account. A host
that has its own should map its identities to seats and stop passing tokens in
the query string — `seatForToken` in `src/lib/history/liveGameRow.ts` is the
single place that decides which seat a request holds.

## Embedding the board

Use an iframe against `/embed`. It isolates CSS, JavaScript and React versions
completely, needs no shared build, and nothing the host sends can change the
rules.

<img src="docs/images/embed.jpg" alt="The embeddable board" width="320" align="right">

```html
<iframe src="https://your-host/embed?size=9&theme=sumi&stones=neon"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Parameters: `size` (9/13/15/19), `variant` (any game's key, such as `renju`,
`dropFour`, `go` or `chineseCheckers`), `opening` (`free`, `pro`, `longPro`,
`swap`, `swap2`, `rif`, `sakata`, `tarannikov`), `obstacles` (`none` or
`hoshi`), `theme` (`kaya`, `shinkaya`, `washi`, `sumi`, `matcha`), `stones`
(`classic`, `jade`, `sakura`, `indigo`, `neon`), `coords=0`. Unknown values fall back rather than erroring — a host should not
be able to break the board by mistyping a parameter.

The board posts messages outward — `itsutsu:ready`, `itsutsu:resize`,
`itsutsu:move`, `itsutsu:result` — so a host can size the frame and react to
play:

```js
window.addEventListener("message", (event) => {
  if (event.data?.type === "itsutsu:resize") frame.style.height = `${event.data.height}px`;
});
```

Every one of those also goes out under its old `gomoku:` name, because the site
was called Gomoku when this interface was published and a host page is somebody
else's code on somebody else's server. Listen for **one or the other, never
both**, or you will count every event twice. New hosts should use `itsutsu:`.

### Embed tokens

The site is closed, so `/embed` needs a token of its own. The operator mints
one per host — from `/admin`, or `pnpm embed-token <label>` — and gets back
the whole iframe snippet to paste.

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
seat link. Mint one with the checkbox on `/admin`, or
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
push to `main` runs `.github/workflows/vercel-deploy.yml`: the checks (lint,
types, unit tests, audit and build, as five jobs side by side) and the browser
suite (twelve shards, side by side with them) — and only when BOTH pass,
`prisma migrate deploy` against the production database, the build, a check
that no server function has grown past its limit, the deploy, and the removal
of superseded deployments. Migrations run before the new code goes live and
are all additive, so the old code keeps working during the switch. A push of
only Markdown or `docs/` runs nothing. How fast that is, and how to keep it
fast, is in AGENTS.md, "Deploys Are Fast By Design".

One-time setup:

1. Create a Neon project and copy both connection strings: the pooled one is
   `DATABASE_URL`, the direct one is `DIRECT_URL`.
2. Create the Vercel project (`npx vercel link` from the repo, or the
   dashboard) and set in its production environment: `DATABASE_URL`,
   `DIRECT_URL`, `AUTH_SECRET`, `ADMIN_EMAILS`, `ADMIN_TOKEN`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`,
   the production Sumilabu tokens (`SUMILABU_BOARD_TOKEN`,
   `SUMILABU_SETTINGS_TOKEN`) and, if the board is to be embedded anywhere,
   `EMBED_ALLOWED_ORIGINS`.
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub
   Actions secrets (the two IDs are in `.vercel/project.json` after linking),
   and `MIGRATE_DATABASE_URL` and `MIGRATE_DIRECT_URL` for the migration step.
   Take those two from Neon: Vercel's sensitive variables pull as a
   placeholder.
4. Push to `main`.

`pnpm preflight:prod` runs the same checks the workflow does, locally and side
by side, and is the gate before every push.

Every landed commit takes a version, and ONE FEATURE IS ONE VERSION:
`pnpm release:take:prod --summary "…"` takes the number, dates the changelog,
commits both and closes the board row it ships, immediately before the push.
Several features are several runs of it and then one push. See AGENTS.md,
"Every Landed Commit Bumps The Version".
`pnpm db:drift:check` compares the committed schema with whatever
`DATABASE_URL` points at and prints the SQL it is missing.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6700) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| End-to-end tests | `pnpm test:e2e` |
| Screenshots into `screenshots/` | `pnpm screenshots` |
| Rebuild `favicon.ico` from `icon.svg` | `pnpm favicon` |
| All gates | `pnpm quality:check` |
| Fix what can be fixed | `pnpm quality:fix` |
| File size gate on its own | `pnpm loc:check` |
| Local database | `pnpm local:db:up` / `:down` / `:reset` |
| Migrations | `pnpm db:migrate` (dev) / `pnpm db:deploy` |
| Prisma client / browser | `pnpm db:generate` / `pnpm db:studio` |
| Mint an invite code | `pnpm invite` |
| Dependency audit | `pnpm security:check` |
| The release gate, checks side by side | `pnpm preflight:prod` |
| Take a release (bumps the version, dates the changelog, closes a live board row) | `pnpm release:take:prod --summary "…" --done <row>` |
| Write to the features board from a terminal | `pnpm task` (dev board) / `pnpm task:prod` (live board) |

`pnpm quality:check` runs lint, the 500-line file size gate, typecheck and the
unit tests. See `AGENTS.md` for the conventions those gates enforce, and for
the four things that make an end-to-end run fail for reasons that are not in
the code — a stale dev server, two runs against one database, database litter,
and a test that races hydration.

## Documentation

| Document | For | Update it when |
| --- | --- | --- |
| This README | a first look, running it, the API, embedding, deploying | a feature, route, parameter or setup step changes |
| [`docs/CORE_CONCEPTS.md`](docs/CORE_CONCEPTS.md) | the ideas the code rests on | how games, seats, members, ratings, the computer players or XP work changes |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | how the pieces fit, and how a change ships | a service, a layer, the gate, the pipeline or a cost rule changes |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | every table and enum | any migration |
| [`docs/email.md`](docs/email.md) | what the site sends and its caps | anything about email |
| [`AGENTS.md`](AGENTS.md) | the rules and the gates | a rule is learned |
| `CHANGELOG.md` | what shipped, and when | every release, through `pnpm release:take` |

A change that makes one of these wrong updates it in the same pull request.
Each guide names the file that holds each fact, so a claim can be checked
against the code rather than trusted.
