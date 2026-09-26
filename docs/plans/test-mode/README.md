# Test Mode: 1000 simulated members, hidden everywhere but the operator's own switch

John, 2026-09-25, on the player-journeys projection (`docs/plans/points/README.md`'s
neighbour): "seed these 1000 users, so that we can actually have them play, as a new
type, regular human, bot and then some other type that can't be seen by the general
public, and doesn't cost me anything but a little bit of db space, and the rest is
just my CPU time in my local machines… This is where the Site has its first Site
Wide modes... in Test mode, all the Test Users are available in all my scoreboards,
etc. And this can also be seen in production... so we do all the calculations and
test runs locally and can push the stats to Production to be viewed in prod if I
have my internal Test Mode turned on... in Test mode site runs normally but Admin
can see the Test users."

This document is Part B of that request. Part A (`src/lib/sim/`, `/admin/player-journeys`)
is the pure, in-memory projection this reuses for the 18 roles the 1000 test members
are seeded from.

## What was built, in one paragraph

A third kind of member (`Member.isTest`), invisible everywhere by default; one
function every list, board and count reads through (`hiddenMembersWhere`); an
admin-only switch remembered on the operator's own account (`TestModeControl`) with
a banner shown on every page while it is on (`TestModeBanner`); a coverage test that
fails the build when a new query lists or counts `Member` rows without going through
the rule; a seeding runner that makes the 1000 from Part A's roles; and a play runner
that plays a season of real games between them, in process, so their ratings, XP and
IP come from the same code a real game's do. Two surfaces (`/xp` and its rungs) are
fully wired today; the rest are listed below with the reason each is not yet, so the
gap is a decision to review rather than an oversight.

## The schema: the smallest change that fits how programs are marked today

Programs are already marked on `Member` by `botTier: String?` (null for a person, a
`BotTier` value for a computer player) — see `src/lib/bots/bots.ts`'s `isBotId` and
`src/lib/auth/memberKind.ts`'s `MEMBER_KINDS.robot`. A test member is not a program:
it is a fixture, played by the SAME move-choosing code a computer player is (see
"The play runner" below) but never shown as a `robot` and never mixed into the bot
ladder or the Bots admin tab. So it is its own column, not a third value squeezed
into `botTier`:

```prisma
model Member {
  // ...
  botTier String?
  isTest  Boolean @default(false)
  // ...
  @@index([botTier])
  @@index([isTest])
}
```

`isTest` and `botTier` are orthogonal and both default to their "ordinary person"
value, so every existing row is unaffected and `memberKind()` needs no change: a
test member reads as `MEMBER_KINDS.member` today, same as an ordinary account. (A
later ticket could add a `MEMBER_KINDS.test` badge for the operator's own views —
not built here, since nothing yet asks for one and `MEMBER_KIND_DISPLAY` is a
`Record` that would need a decision about kanji and a note.)

Migration `20260926022200_test_mode_member_flag`, applied to `itsutsu_sim` only,
verified with `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel
prisma/schema.prisma` → "No difference detected."

## How Test Mode is switched

Admin only, remembered on the ADMIN'S OWN `Member` row through the existing
preferences registry (`src/lib/preferences/`) — a `testMode: { options: [true,
false], fallback: false }` row, so it survives across devices exactly the way every
other per-account choice on this site does, and needs no store of its own.

- **The control**: `src/components/admin/TestModeControl.tsx`, a self-contained,
  server-rendered row (label, one-line description, current state, an on/off
  switch) that the Admin panel's restyle can drop into its own "Modes" group —
  built to that exact brief from the coordinating session. The switch itself
  (`TestModeToggle.tsx`) is the one client component in this feature: it has to
  call a Server Function on a click. That Server Function,
  `src/lib/testMode/testMode.actions.ts`'s `setTestMode`, re-checks
  `currentAdmin()` itself rather than trusting whoever rendered the button —
  a Server Function is a public address.
- **The banner**: `src/components/layout/TestModeBanner.tsx`, in the root layout
  (`src/app/layout.tsx`), so "every page" is actually true rather than a promise
  that drifts the first time a page is added and nobody remembers this banner.
  Reads `showsTestMembers()`, which answers `false` with no database call for
  anyone who is not the signed-in admin (`isAdminRequest` checks the session
  cookie first) — so an ordinary visitor's page costs nothing extra.
- **"Can also be seen in production"**: the switch is a stored preference, not an
  environment flag, so flipping it needs no redeploy and no environment variable —
  it works identically on `itsutsu_sim`, the shared dev database and production,
  which is the whole of what "push the stats to Production to be viewed in prod"
  asks for. Nothing here pushes anything anywhere; it is the same database either
  way, read with or without the one filter.

## THE ONE RULE

Two functions, in `src/lib/testMode/testMode.ts`, deliberately not one:

```ts
export type TestModeReader = { showsTestMembers: boolean };
export const HIDES_TEST_MEMBERS: TestModeReader = { showsTestMembers: false };

// Touches the request (cookies, the signed-in member's stored preference).
// Call this ONCE, near the top of a page, a route or a Server Function.
export async function currentTestModeReader(): Promise<TestModeReader>;
export async function showsTestMembers(): Promise<boolean>; // convenience wrapper

// Pure and synchronous. AND this into whatever the caller was already
// filtering by. Safe to call from a plain src/lib helper, including in a
// unit test with no request at all.
export function hiddenMembersWhere(reader: TestModeReader): Prisma.MemberWhereInput;
```

**Why two functions and not the single one the request first imagined.** The
first attempt made `hiddenMembersWhere()` itself async and had it call
`isAdminRequest()` (which calls `next/headers`' `cookies()`) directly. That
breaks the moment it is called from a plain `src/lib` function three modules
deep — which is exactly where most of these queries live — because `cookies()`
only works inside a live request (a Server Component, a Route Handler, a Server
Function). Calling it from `src/lib/xp/xpBoard.ts`, imported and called directly
by a `.test.ts` file with no request behind it at all, throws. So the request is
read ONCE, at the top, by whichever page or Server Function has one, and the
small, plain `TestModeReader` value is threaded down as an ordinary parameter —
which is also what makes `hiddenMembersWhere({ showsTestMembers: false })`
callable from a unit test with nothing else to set up.

**A caller ANDs it in**, the same way a `botTier` or `unclaimableBecause` filter
already sits beside whatever else the query was narrowed by:

```ts
const onTheBoard: Prisma.MemberWhereInput = {
  AND: [xpOnBoardWhere(scope), xpWhoWhere(who), hiddenMembersWhere(reader)],
};
```

## The full list of every surface, and what each needs

Found by grepping for `prisma.member.(findMany|count|groupBy|aggregate)` —
deliberately NOT `findFirst`/`findUnique`, which look up one already-known member
(banning them, reading their own row) and have nothing to hide that member AMONG.
24 files matched; two are converted, the rest are named with a reason in
`testMode.coverage.test.ts`'s `EXCEPTIONS` and repeated here for the reader who
wants the whole picture in one place rather than split across a test file's
comments.

**Converted today:**

| File | What it is |
|---|---|
| `src/lib/xp/xpBoard.ts` | The XP leaderboard (`/xp`) and a reader's own rank on it |
| `src/lib/xp/levelMembers.ts` | Who is standing on one rung (`/xp/levels/[level]`) |
| `src/lib/points/ipBoards.ts` | Every IP leaderboard: a game's, a family's and the site's (`/points`). Raw SQL, so the rule is written there as `WHERE NOT "Member"."isTest"`, and `IpBoard` reads the reader once |

Both took a `reader: TestModeReader` parameter (required on the board's own fetch,
defaulted to `HIDES_TEST_MEMBERS` on the smaller helper so nothing else calling it
had to change today), read once per page in `src/app/xp/page.tsx` and
`src/app/xp/levels/[level]/page.tsx` via `currentTestModeReader()`, and threaded
into `YourXpStanding` as a prop.

The switch is a row of Admin → The site's Modes group (`TestModeControl`, drawn
by `TestModeToggle` with the panel's own `PanelRow` and `PanelSwitch`), with the
projection at `/admin/player-journeys` linked under it. A flip refreshes the
page it was pressed on and revalidates nothing else: only the operator's view
changes, so no cache anybody else reads is thrown away.

**Named, with the reason it is not converted yet — this is the real remaining
work, roughly in the order it matters:**

- `src/lib/rating/directoryPage.ts`, `directoryRows.ts`, `directorySettled.ts` —
  **the players directory (`/players`), the highest-priority surface left.**
  `fetchComputerPlayers`, `fetchDirectory` and the paged query in
  `directoryPage.ts` all need a `reader` threaded from `/players/page.tsx`, which
  already reads several other per-request filters (`directoryFilterFor`,
  `currentReader`) the same way — the pattern is proven, this is volume of call
  sites (three tabs: members, computers, and the paged list itself) more than
  difficulty.
- `src/lib/rating/players.ts` — **a game's own ladder.** Named explicitly in the
  task as a next surface; not started.
- `src/lib/social/presence.ts` — **"here now".** Named explicitly; not started.
- `src/lib/puzzles/server/puzzleSolves.ts` — **the puzzle leaderboards.** Named
  explicitly; not started. The same shape as `xpBoard.ts` — a `groupBy` per
  puzzle kind and size — so it is likely the next-cheapest conversion after the
  directory.
- `src/lib/auth/memberRoster.ts`, `members.ts`, `operatorLog.ts` — the operator's
  own Members tab and audit log. Lower priority: an admin with Test Mode on is
  exactly who should see everything there, and nobody else can reach `/admin` at
  all (`isAdminRequest` gates the whole page), so the exposure this rule exists
  to prevent does not apply here in the same way. Worth wiring anyway so the
  Members tab can be TOLD which rows are test members and filtered when Test
  Mode is off, but it is not a leak today.
- `src/lib/feed/feedRead.ts` — the activity feed.
- `src/lib/history/activeGames.ts`, `currentNames.ts`, `gameHistory.ts`,
  `posterStandingRead.ts` — the game record and its active-game bookkeeping.
- `src/lib/phrase/phraseStore.ts`, `seatPick.ts` — four-word credential rows and
  the picker's candidate names.
- `src/lib/record/rivalryRead.ts` — head-to-head between two named members.
- `src/lib/site/siteNumbers.ts` — the site's own headline counts (About, the home
  page). Worth doing early once seeding actually runs at scale: 1000 test members
  would otherwise inflate "how many people play here" on the most-read page on
  the site.
- `src/lib/social/childReach.ts` — who a child member may reach. Deliberately
  UNTOUCHED until reviewed with John rather than converted reflexively: this is a
  safety rule (`children-default-to-stricter`, per standing instruction), and
  changing what a child's reachability query returns is his call, not a
  refactor's side effect.
- `src/lib/xp/importedXpPay.ts` — the imported-XP payer. Out of scope by
  construction: it only ever touches kept records from other sites, which a
  simulated test member can never be.
- `src/lib/xp/nameTagsOf.ts`, `src/lib/history/currentNames.ts`,
  `src/lib/xp/xpOfMembers.ts` — all three read an explicit list of ids an
  upstream, ALREADY-FILTERED query chose (`nameTagsOf(roll.members.map(...))`,
  for instance). There is nothing to hide a test member AMONG here: if the
  upstream query correctly excluded them, they are never in the id list these
  three are handed. They will need no change even after every list above is
  converted, and are named here so nobody re-adds them to a future version of
  this list by habit.

**Champions and a game's own standings** (`/champions`, `/games/[slug]/standings`)
read through `src/lib/rating/players.ts` and `directoryRows.ts` above, so they are
covered by finishing those two rather than needing their own line.

## The coverage test

`src/lib/testMode/testMode.coverage.test.ts`, in the shape
`gameLinks.coverage.test.ts` and `xpColumn.coverage.test.ts` already hold this
codebase to: it greps every file under `src/lib`, `src/app` and `src/components`
for the four Prisma calls that can return or count more than one `Member` row,
and fails the build unless the file also calls `hiddenMembersWhere(`, or is named
in its `EXCEPTIONS` map with a reason. A second assertion refuses a stale
exception — one naming a file that no longer matches, or that has since been
converted — so the list stays honest as the remaining work above gets done.

**What it does NOT prove**, said plainly rather than implied: it checks that the
file calls the rule somewhere, not that every one of its `prisma.member` calls
uses it. A file that calls `hiddenMembersWhere` once and then adds a second,
unfiltered listing query would still pass. Catching that precisely needs a real
parser reading which `where` each call actually received, which is more machinery
than this codebase's other coverage tests carry for the same class of problem —
crude and maintained beats precise and abandoned. What this DOES buy, reliably: a
brand new file, or an existing one with no test-mode awareness at all, cannot add
a first unfiltered listing query without the build saying so.

## The seeding runner

`src/lib/sim/seedTestMembers.play.test.ts`, run under vitest the way
`botSeries.play.test.ts` is (a `.play.test.ts` does nothing unless asked, because
`@/` aliases need vitest's resolution and a plain script cannot see them).

- Builds 1000 `Member` rows from the same 18 roles Part A projects
  (`JOURNEY_ROLES`), reusing `buildPopulation`'s seeded PRNG so the same seed
  makes the same 1000 names and roles every run.
- **Names are clearly fake but readable**: `Test·Mika 042` — a role-flavoured
  first name plus a three-digit index, joined with a middle dot no real name on
  this site uses, so a name is unmistakably a fixture at a glance in any list
  that is not yet converted (a second line of defence while the surface list
  above is still being worked through).
- **Idempotent**: upserts by a deterministic id derived from the seed and index
  (`test-<seed>-<index>`), so running it twice does not double the population,
  the way `ensureBotMembers` is idempotent for the bot roster.
- **Writes only with an explicit env flag** (`TEST_MEMBERS_RUN=1`), and prints
  the database host and the test-member count already there before writing
  anything — the same two habits `botSeries.play.test.ts` and AGENTS.md's "Back
  It Up Before You Migrate It" ask for, because "which database did this
  actually reach" is the one question that must never be assumed.
- Sets `isTest: true` and nothing about `botTier` — a test member is never a
  robot.
- Command: `TEST_MEMBERS_RUN=1 pnpm exec vitest run src/lib/sim/seedTestMembers.play.test.ts --disable-console-intercept`

## The play runner

`src/lib/sim/testSeason.play.test.ts` — plays real games between the 1000 test
members, in process, so their ratings, XP and IP are computed by the SAME code a
real game's are, never a shortcut that writes plausible-looking numbers directly.

**Why it cannot simply call `playBotTurns`, which `botSeries.play.test.ts`
does.** `playBotTurns` only moves a seat whose member row has a `botTier`
(`botInSeat` reads it, and returns null — meaning "nothing to do" — for a seat
with none). A test member deliberately has no `botTier`: it is not a robot, so
`memberKind()` must not read it as one, and it must never appear on the Bots
admin tab or in the computer ladder. Giving it one to make `playBotTurns` move it
would be solving a plumbing problem by lying about what the row is.

So the runner drives its own loop, over the same primitives `botSeriesGame.ts`
composes for the bot series:

1. `createLiveGame(...)` — the real function, both seats' `memberId` a test
   member's, `rated: true` (an unrated game is invisible to every board this
   exists to populate — the same reasoning `SERIES.rated` documents).
2. `chooseTurn(state, tier, random, budget)` — the real move-choosing function
   every computer player's move goes through (`src/lib/gomoku/opponent.ts`),
   called directly for WHICHEVER SEAT'S TURN IT IS, regardless of `botTier` —
   this is the one place the runner reads a `BotTier`-shaped strength for a test
   member, and it is a LOCAL VARIABLE inside the runner, never written to the
   row. `razryad` (the cheapest, fastest tier) for the rehearsal batch, so 2000
   games costs seconds rather than the minutes the graded ladder's own measured
   games take at higher tiers — a real season could map a role's modelled skill
   to a tier band, which is future work once this is proven.
3. `appendMove(id, token, request, { known })` — the real function every move
   through the site's own API calls, so a finished game triggers the real
   `recordResult`, the real `awardXp`, and the real `gamePoints` write, exactly
   as `botSeriesGame.ts`'s comment says for the bot series: "created the way a
   live game is created, played by the same code that answers a real request."

**Local by default, `:prod` a separate script name, never a flag.** Matching
`bots:play` / `bots:play:prod`'s own reasoning in AGENTS.md: the name is the
warning, so forgetting something can only ever leave a run on the tester's own
database. `TEST_SEASON_RUN=1 pnpm exec vitest run
src/lib/sim/testSeason.play.test.ts` plays locally; a `:prod` variant is a
separate pnpm script, needs a Neon branch and a dump first (AGENTS.md, "Back It
Up Before You Migrate It"), and is run only by John, on his word, the same
restriction `bots:play:prod` and the imported-XP payer's production runner
already carry.

**Never through the site's own API** — the same reasoning AGENTS.md's "Bulk Play
Runs Here, Never Through the Site" gives for the bot series, word for word: a
season of games through the deployed API is thousands of paid function
invocations for an answer the same code produces locally for nothing.

## Cost: rows only

1000 members is 1000 rows on `Member` — the same table every real member is a row
of, so nothing new to estimate there. A season of games is the number that
matters:

- One finished game: one `Game` row, its moves inline on that row (this site
  stores a game's moves as part of the game record, not one row per move — see
  `liveGame.ts`), one or two `XpEvent` rows per side (a finish, sometimes a win
  and its bonuses), and a rating update on the `Member` row itself (no separate
  ratings table).
- 2000 games, both seats test members every time: roughly 2000 `Game` rows and,
  at a rough two to four `XpEvent` rows a side, 8,000 to 16,000 `XpEvent` rows.
  Comparable in shape to twenty games' worth of bot-series play scaled up a
  hundred times, and AGENTS.md's own figure for that ("Twenty games is about
  eight hundred small inserts") puts 2000 games at the same order of magnitude —
  tens of thousands of small rows, the cheapest kind of write Postgres does, and
  on `itsutsu_sim` alone, never production, without John's separate word.

## Running it, and what was actually run here

Both runners were exercised against `itsutsu_sim` — a private database on this
machine, at `localhost:55434`, that nothing else reads — in this session:

1. `TEST_MEMBERS_RUN=1 pnpm exec vitest run src/lib/sim/seedTestMembers.play.test.ts --disable-console-intercept`
   → 1000 test members written; a second run confirmed it upserts the same
   1000 rather than doubling them.
2. `TEST_SEASON_RUN=1 TEST_SEASON_GAMES=<n> pnpm exec vitest run src/lib/sim/testSeason.play.test.ts --disable-console-intercept`,
   run in two passes (a 20-game rehearsal, then 1780 more) → **2002 games
   total, 2001 finished and 1 left active** (a bounded run stopping mid-game,
   not a stuck one — nothing in 2001 other games got stuck), split roughly
   evenly across the three modelled boards (tic-tac-toe 600, Drop Four 568,
   Gomoku on 9×9 612), **15,329 `XpEvent` rows** written (within the
   8,000-16,000 estimated above), and **990 of the 1000 test members hold XP
   greater than nought** — the ten with none simply were never drawn as a
   seat across 2002 random pairings, which is expected at this sample size.
3. `/xp` was loaded as the operator with Test Mode off (no `Test·` name
   anywhere on the board, no banner), then with it switched on directly on the
   operator's own stored preference (no test names appeared until then, and
   the banner appeared the moment it was on), then switched off again and
   confirmed hidden once more — the whole mechanism, checked in both
   directions.

This is the one surface that could be checked end-to-end today: `/players`,
`/champions` and a game's own standings are not yet converted (see the
surface list above), so they were not part of this check — seeding 1000 test
members made them show on those pages regardless of Test Mode, which is
exactly the gap the warning below is about.

**Before running the seeding step anywhere but `itsutsu_sim`**: `/players`,
`/champions` and a game's own standings are NOT YET converted (see the surface
list above), so on any database those pages read from, seeding test members
makes them show up to EVERY VISITOR, not only an admin with Test Mode on. That is
safe on `itsutsu_sim` because nobody else ever reads it. It is NOT safe on the
shared development database or production until the directory and the ladder are
converted — say so plainly before anyone reaches for `TEST_MEMBERS_RUN=1`
anywhere else.
