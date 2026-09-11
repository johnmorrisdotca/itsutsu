<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

### Bulk Play Runs Here, Never Through the Site

Bot testing, bot-against-bot series and any bulk generation of games connect to
the database **directly, in process, on the machine doing the work**. They must
never drive the deployed site's API.

The reasoning is money and it is not hypothetical: a client hitting real
endpoints in a loop is what produced this project's cost spike. A single
bot-against-bot game is sixty-odd moves, and every move through the API is a
serverless invocation running a search on a real budget. A few dozen games is
thousands of invocations, all of them paid for, all of them to reach an answer
the same code produces locally for nothing.

So the rule, and what it costs either way:

- **Locally**: the search runs on your CPU, which is free. What reaches
  production is the database — one row per game, one per move — which is the
  cheapest work Neon does. Twenty games is about eight hundred small inserts.
- **Through the site**: identical rows, plus thousands of function invocations
  and their compute time. Nothing is gained.

`src/lib/bots/botSeries.play.test.ts` is the runner: it imports `createLiveGame`
and `playBotTurns` and calls them in process, with Prisma pointed at whichever
database is intended. **`pnpm bots:play`** invokes it, and it writes nothing
unless asked twice.

```sh
pnpm bots:play                                     # report only, writes nothing
BOT_GAMES_RUN=1 BOT_GAMES_ALL=1 BOT_GAMES_EACH=2 pnpm bots:play        # your database
BOT_GAMES_RUN=1 BOT_GAMES_ALL=1 BOT_GAMES_EACH=2 pnpm bots:play:prod   # the live site
```

**Two commands rather than one and a flag, because the name is the warning.**
`bots:play` writes to whatever your `.env` points at; `bots:play:prod` writes
to the live site. Nothing about the two can be confused at a glance, and no
argument decides which. The safety property is that forgetting something can
only ever leave you on your own database — production is reached by asking for
it by name, never by omission.

`bots:play:prod` needs nothing set up. It asks **Neon** for the connection
string every run and hands it to one process, so it is never pasted into a
shell, written to disk, or left in a scrollback — and there is no file to go
stale pointing somewhere it should not. It prints the host it is about to use
before writing anything.

**Do not reach for `vercel env pull` for this.** `DATABASE_URL` is marked
Sensitive in Vercel, so a pull writes the literal string `[SENSITIVE]` into the
file however it is invoked. The failure is quiet and reads as a wrong flag, a
permission problem, or a redaction by your own tooling — this cost an evening
between two people, and one of them concluded from that placeholder that the
environment was withholding production access. It was Vercel doing what
sensitive variables do. Neon is where the database is, so Neon is what to ask.

`BOT_GAMES_ALL=1` is every ladder grade against every other across three
unalike boards; without it, only the specialists at their own game.
`BOT_GAMES_EACH=N` is games per pairing, and colours alternate, so an even
number is the fair one. Two per pairing is 80 games and about eighty minutes on
one machine — the grades that search are most of the cost.

It is a `.test.ts` because `@/` aliases do not resolve in a plain node script,
and it runs under vitest for the same reason. `--disable-console-intercept` is
in the pnpm script deliberately: without it vitest swallows every line of the
report, and a runner that prints nothing for eighty minutes is one nobody can
tell apart from a hung one.

**The games it writes are rated.** An unrated game is invisible to the ladder
this exists to fill — `liveGame.ts` only calls `recordResult` when the row says
rated — so an unrated batch plays out perfectly and leaves the ladder exactly as
empty as it found it. That is safe because the pool is decided by the seats:
two programs make a computer-pool game, which can never touch where a person
stands among people.

Before writing anything it prints how many games the database it reached already
holds. Read that line. Production and a development database are not close in
size, so it settles in one number what no amount of re-reading the command line
can.

Two things worth knowing before running one:

- **Check which database you actually reached, do not assume.** `.env` has
  silently overridden an inline `DATABASE_URL` here before. Count the rows
  first: production and a development database are not close in size, so one
  query settles it.
- **Rehearse locally first.** The first attempt at this failed against a real
  row because it passed the engine's `GameSettings` to a function wanting
  `LiveGameSettings` — two types describing different things, neither a superset
  of the other. Better to find that on a database nobody is looking at.

### The Gate Is `src/proxy.ts`

Next 16 renamed the middleware convention, so the file that decides who gets
into this site is `src/proxy.ts` and there is no `middleware.ts`. The docs in
`node_modules/next/dist/docs/` say so; training data says otherwise, and code
written from memory here half-works in a way nothing reports.

That rename set a trap, and one session walked into it: knowing the convention
as `middleware.ts`, it went to create `proxy.ts` as a NEW file for some cookie
logic — and `proxy.ts` already existed, holding the invite gate. Writing it
would have replaced the gate with a cookie helper. Nothing said so; it was
caught because `proxy.test.ts` stopped typechecking.

So, whatever you are about to create: **look before you write.** A file you
believe is new, in a framework whose conventions have moved, is the one case
where the belief and the filesystem most easily disagree — and the file most
likely to be sitting there is the one the framework told you to name.

If you do have business in that file, the rule is that the gate's decisions are
not yours to touch. Additions belong on paths that already let the request
through: wrap the `NextResponse.next()` a decision has already arrived at,
never the deciding. A change that only ever runs after "yes" cannot turn a no
into one.

## Workspace Gates

### File Size Gate

- Code files under `src/` must stay at or below 500 lines.
- Gate command: `pnpm loc:check`, run as part of `pnpm quality:check`.
- If a file approaches the limit, split by responsibility (`components/`, `lib/`, domain modules) rather than adding flags or nesting.
- `*.constants.ts` and `*.test.ts` are reported when long but do not fail the
  gate. A data table split in half becomes two files that must be kept in
  step, and a suite of forty focused cases is not complexity — the limit is
  there to catch a file doing too many jobs, which is a property of logic.

### Types And Constants Pattern

- Shared `type` and `Props` declarations live in adjacent `*.types.ts` files (for example `board.types.ts`), not inline in components.
- One constants module per component group (`Board.constants.ts`), not one per component.
- Domain values (`Stone`, `RuleVariant`, `GameStatus`) are compared through the constants in `src/lib/gomoku/gomoku.constants.ts`, never inline string literals. Display text for domain values comes from `STONE_DISPLAY` / `RULE_VARIANT_DISPLAY`.

### Engine Is Pure

- Game rules live only in `src/lib/gomoku/engine.ts` and the `src/lib/gomoku/rules/` modules it delegates to (winning lines, forbidden shapes, captures, turn length, openings), each unit tested beside its source. Components and hooks never inspect the board to decide outcomes; they call the engine.
- Every engine function returns a new `GameState` and leaves its input untouched.
- A rule variant is a row in `VARIANT_SPECS` (`gomoku.constants.ts`) plus its copy in `variants.constants.ts`. The engine reads the spec and never switches on a variant's name. Analysis (`threats.ts`, `analysis.ts`) is advisory and sits above the engine: it filters through the rules, never the other way round.
- Anything that asks "may this colour…" reads `rulesFor(settings, stone)` in `rules/handicap.ts`, which lays the handicap over the variant's spec. Never read `VARIANT_SPECS[...].lineRule`, `.forbidden`, `.captures` or `.stonesPerTurn` directly for a colour.

### New Game Gate

A rule variant is cheap to add and expensive to finish. The engine will play anything
you put in `VARIANT_SPECS`, so the work that gets skipped is everything that makes it a
game a person can find, understand and trust. None of that is optional.

**A game is not done until all of these are true.** They are enforced by
`src/lib/gomoku/variants.coverage.test.ts`, which runs in `pnpm test:unit`, so a game
that is missing any of them fails the build rather than shipping quietly.

- **It is tested.** At least one unit test under `src/lib/gomoku/` names the variant and
  exercises what makes it different. A variant that only rides the shared simulation
  loop is untested: the loop proves the engine does not crash, not that the rule is
  right. Test the rule that is new — the capture size, the wrap, the losing condition.
- **It survives the simulator.** `simulation.test.ts` plays every variant automatically,
  and `simulation.checks.ts` / `simulation.scan.ts` restate the rules by hand as an
  independent check. A new mechanism means extending the checker too. If the simulator
  cannot decide who won, neither can a player.
- **It is a solid game, not a rule.** Before it ships, play it out: it has to end, it
  has to be possible for either side to win, and it must not be decided in the opening
  by a move anyone would find. A variant that is a forced win, or that random play
  cannot finish, is a puzzle — say so on its rules page or leave it out.
- **It has a screenshot.** `public/art/games/<variant>.jpg`, from `pnpm screenshots:games`.
  The rules page, the games index and the family cards all show it. Regenerate after any
  change to board or branding.
- **It has full copy.** `RULE_VARIANT_DISPLAY` needs a label, a kanji name, a tagline, an
  origin, board advice, and at least three rule bullets; `rulesPageFor` must fill every
  section. If the game is our version of a published game, set `inspiredBy` — see
  `RULES_ATTRIBUTION`.
- **It belongs to a family.** Add it to `GAME_FAMILIES` in `families.ts`. A game in no
  family appears on no index page, so nobody will ever meet it.
- **It has an end-to-end test.** One Playwright case that opens the game and plays the
  move that shows its rule working.

TypeScript already forces the `VARIANT_SPECS` and `RULE_VARIANT_DISPLAY` rows, because
both are `Record<RuleVariant, …>`. The gate covers what types cannot see.

### Nothing Is A Dead End

Two rules, in John's words, and one principle underneath them.

- **"If you see a name of a game, it's clickable."**
- **"If you see a W/L/T record, each number you see should be clickable —
  when it's for this site."**

The principle: **any number that refers to games links to a page showing
exactly that set of games.** A count is a filter, not a display. "7 games of
Reversi" is a promise that those seven can be seen; printing the 7 and stopping
breaks it. This has been got wrong on four separate pages, which is why it is a
gate and not a habit.

**Before a page that lists games or players is done**, walk this list by eye —
it is short, and every line on it has been missed at least once:

- **Every game's name leads to that game**, through `GameName`. It goes to the
  rules page, which is the game's own front door and carries the way on to the
  record and the ladder. A name in a list is a reference to the game, not an
  instruction to start one.
- **Every count of games leads to those games**, through `GameCount`, filtered
  to exactly what was counted — that player, that game, how it went, and which
  ladder was counting.
- **Every player's name leads to their page**, through `PlayerName`.
- **Every opponent you are shown offers what you would want to do about them:**
  invite, challenge, buddy, ignore.
- **Every page a link lands on says what it was narrowed to**, and lets it be
  taken off. A link that filters silently gives a reader eleven games and calls
  it the record. `/history` says so in chips above the filter bar.

**A count must link to the set it counted, not a set that contains it.** This is
the part that is easy to get half right. A ladder's record is RATED games in ONE
POOL; a player's own page counts every finished game either way. Linking a
ladder's "7W" to every game with that name in it shows a longer list than the
number came from — which is the same fault as no link at all, wearing a link.
The filters exist so the promise can be kept exactly: `player`, `outcome`,
`pool`, `rated`, and the game in the path.

**The one exception, and it is not a loophole.** A figure from another site has
no game here to open — an ItsYourTurn record is a number somebody copied down,
not a row with moves in it. Those do not link, and must not: a link that cannot
keep its promise is worse than a plain number, and the page already says these
came from elsewhere. Say it with `of={{ here: false }}` rather than by leaving
the link off, so the exception is a decision in the source and not an oversight
that looks identical to one.

**Enforced by `src/components/games/gameLinks.coverage.test.ts`**, which runs in
`pnpm test:unit` and fails the build when a page prints a game's name with
nothing behind it, prints a record as a string, or shows a table of records
without saying whose games it is counting. It checks the RULE rather than the
import: a name already inside a link passes, because the family line under a
game linking its siblings to their own ladders is the rule kept, not broken.

A select's `<option>` and a game named inside a sentence — a hover note, a page
title, a line of advice — are not links and cannot be. Both are exceptions in
the test with their reason written beside them, rather than a pattern loose
enough to let a real one through.

It earned its place the hour it was written: it found six more dead ends nobody
had noticed, including the rules page itself — the destination every game name
on this site now points at — which reached the board and Wikipedia and had no
way to the record or the ladder.

### Show The Data, Not The Way To It

The companion rule to the one above, and it pulls the other way: a count must
lead to the games behind it, AND a page about a thing must show the thing
rather than a link to where the thing is kept.

A nav panel listing seven facets of a game is not the same as a page that
answers what a reader came for. The ladder belongs on the game's page, not one
click under it; the last few games belong there too. A link is the way to MORE
of something already on the page — never the page's answer to the question it
exists to answer.

**And an empty table is data.** This is John's, and it is the half that gets
got wrong:

> "empty tables are fine! show the table. Show nothing has been played yet…
> and that's a change to have a link saying - be the first to play!"

So an empty panel **shows its headings and its shape**, says plainly that
nobody has played this game here yet, and offers the way in as a link — BE THE
FIRST TO PLAY. It does not hide itself, and it does not replace itself with a
sentence apologising for the absence.

Three reasons it is the better answer, because they decide how to build it:

- It shows a reader the SHAPE of what this site keeps, before there is any data
  to fill it. A hidden panel teaches nothing; an empty one teaches the form.
- Thirty-nine of the games here have barely been played. Hiding every empty
  table turns those into a wall of apologies; showing them turns the same
  thirty-nine into invitations.
- It is the same instinct as this rule rather than an exception to it. "Nobody
  has played this yet" is a true fact about the game, and suppressing it is the
  same failure as printing a count with nothing behind it.

**One thing to get right for a signed-out reader.** Reading is open here and
playing is gated, so "be the first to play" takes a stranger to `/join`. That
is the intended path, not a bug — but it must read as an invitation and not a
bait-and-switch. Word it so that somebody who follows it feels they were told
what the site wants from them. Do not reuse the signed-in label.

### Back It Up Before You Migrate It

**Checked, not assumed** — the numbers below were read from the project on
2026-09-10 with `neonctl`, and are worth re-reading rather than trusting if
they matter to a decision.

The production database is Neon project `calm-boat-93104880` ("itsutsu"),
Postgres 18 in `aws-us-east-2`, and it has exactly one branch: `main`, which is
**not protected**. Its history retention is `86400` seconds — **twenty-four
hours**. That is the whole of what exists today:

- **Point-in-time recovery: yes, but only for a day.** Neon can restore or
  branch from any moment in the last 24 hours. A mistake noticed on Wednesday
  about Tuesday's migration is past the window, and there is nothing else.
- **Snapshots: none.** No branch has ever been taken before a migration.
- **`main` is unprotected**, so nothing at the Neon end refuses a destructive
  operation on it.

**So, before any migration against production:**

1. **Take a branch first.** It is one command, it is copy-on-write so it costs
   almost nothing, and it is the only thing that survives past 24 hours:
   `neonctl branches create --project-id calm-boat-93104880 --org-id org-old-wave-97887412 --name before-<what>-<yyyy-mm-dd>`
2. **Say what you are about to run, and to which database, before running it.**
   Verify which one you are actually connected to by counting rows — an
   inline `DATABASE_URL` is silently overridden by `.env`, which has caught
   this project before.
3. **Never pass the real database as `--shadow-database-url`.** Prisma drops
   and recreates a shadow database.
4. **If `prisma migrate dev` offers to reset, the answer is no.** "Applied to
   the database but missing from the local migrations directory" means a
   migration file is on a branch that has not merged yet. The fix is to merge
   that branch. It is never to reset a database other people are using.

The near-miss this is written from: a migration was applied to the shared
database while its migration file lived only on an unmerged branch, and every
other worktree would have been offered the reset.

### Board Gate

The features board at `/backlog` is where a request lives once the conversation that
raised it is over: what was asked for, what is planned, what is being built, what is in.
A board is only worth taking work from if every line on it says something, so the same
checks are made in three places and stated once.

- **The rules are pure and in one module.** `src/lib/backlog/backlog.ts` decides what a
  usable request is (`draftProblems`), what may follow what (`canMove`, `movesFrom`), and
  how a board is filtered and ordered. It returns new items and never writes to the one
  it was given, the way the engine does. `backlogStore.ts` only reads and writes.
- **A status move is checked, not trusted.** The row's select is built from `movesFrom`,
  and `PATCH /api/backlog/:id` refuses anything `canMove` rejects with a 422 — so a
  proposal cannot reach `done` without having been built, whatever calls the API.
- **The gate runs in `pnpm test:unit`.** `src/lib/backlog/backlog.coverage.test.ts` fails
  the build when a status cannot be left or reached, when a status or kind is missing its
  label, kanji or blurb, or when a seeded row is not a request somebody could act on — a
  title too short to mean anything, no detail, nobody named as having asked.
- **Seeding is idempotent and once-only.** `BACKLOG_SEED` carries its own keys and is
  written only into an empty board, so an item somebody dropped never comes back on the
  next render.
- **The release history is parsed, never copied.** The same page lists every release,
  read from `CHANGELOG.md` at request time by `releasesFile.ts` — a second list kept by
  hand would drift within a day. `releases.test.ts` parses the real file, so a changelog
  that stops being readable fails the build, and it refuses a changelog naming a version
  newer than `package.json`. Pages that read the file name it in
  `outputFileTracingIncludes` (next.config.ts), or it is missing in production. The
  operator reaches both halves from the Admin page.

Whether work is *taken* from the board is the site owner's rule to make, not this file's.
The gate only guarantees the board is worth making that rule out of.

**WRITE THROUGH THE API, NEVER STRAIGHT TO THE TABLE.** Every check above lives
in `POST`/`PATCH /api/backlog` — `draftProblems` caps a detail at 4,000
characters, a title at 120 and a name at 60, and `canMove` answers 422 to a
status move the board does not allow. A `PrismaClient` script reaching the row
directly walks past all of it, and two sessions did exactly that about forty
times on 2026-09-11 — one of them writing thirteen `open → done` moves, which
`canMove` refuses outright since the only road to done runs through
`inProgress`.

The damage is not untidiness. **A row whose detail is over the cap can no
longer be saved from the board at all**: open it, change anything, and the API
refuses the write. Eleven of 154 live rows are in that state, the worst at
15,111 characters, and most of them got there by `detail = detail || '…'`
appends. We created rows the board's own owner cannot edit.

This is the failure Nothing Answers What It Cannot Answer is about, one layer
out: a gate routed around rather than heard. It is also worse than the usual
version, because the board API checks for the OPERATOR's session specifically —
so "I could not call the API" is true and is precisely the point. The honest
answer to not holding the key is to draft the text and hand it over, not to
climb in through the table.

If a cap needs enforcing against something that is not the API, it has to be a
constraint in the database; anything in TypeScript is another door rather than
a lock. `backlog.coverage.test.ts` checks SEEDED rows and cannot see live ones,
so nothing today would catch this.


### Every Landed Commit Bumps The Version

**Whoever lands a commit bumps `package.json` and adds a line to `CHANGELOG.md`
in the same commit**, and says so to the other sessions first, so two of them
never claim the same number. A **minor** is something a player would notice — a
game, an opening, a page, a capability. A **patch** is a fix, a rewording, a
refactor or a chore.

This is written here because it was already written in the changelog's own
preamble, and that is a file you only open if you are already thinking about
releases. Fifteen commits landed in one night without a bump for exactly that
reason: nothing in the instructions being followed said to, and nothing failed.
`releases.test.ts` only refuses a changelog naming a version NEWER than
`package.json` — shipping work that the changelog never mentions passes every
gate there is.

The cost is not tidiness. **The version and the changelog are how the site's
owner knows something shipped.** A night of real fixes went out with the
version unchanged, and from the outside that is indistinguishable from a night
where nothing was deployed — which is exactly what he concluded, and said.

**THE NUMBER IS CLAIMED AT MERGE, NOT ON THE BRANCH.** A session working in a
worktree does not know what will land before it, so a number written into
`package.json` on a branch is a guess about the order of other people's
commits. Two branches guessed the same one in a single night, and the collision
is only visible when the second merge produces a changelog with two entries
under one version — which no gate catches, because `releases.test.ts` only
objects to a version NEWER than `package.json`.

So: **do the work on the branch and leave the version alone; take the number in
the merge commit, when the order is a fact rather than a forecast.** The merging
session is the one that can see what it is merging on top of. This contradicts
nothing above — whoever LANDS a commit still bumps it, and a merge is a landing
— it only says when the number becomes knowable.

### Nothing Answers What It Cannot Answer

A gate, a name and a return value are all reports. When one of them will not
fit, the difficulty is information: something is holding two things that do not
belong together, or is being asked a question it cannot answer. The failure
mode is to satisfy the report instead of hearing it — and it happens in every
layer, so it is worth recognising by shape rather than by symptom.

Four instances, all found on the same day, all shipped or nearly shipped:

- **A gate trimmed rather than heard.** `engine.ts` reached the 500-line limit,
  and the answer was to shave its comments until it went green. Twice. The
  limit is there to catch a file doing too many jobs; removing prose removes
  no job, only the explanation of one.
- **A gate routed around.** The same limit stopped a one-line change, which
  went in through another module instead. Milder, same move.
- **A name compromised rather than split.** `settleDrawLimit` grew a second
  rule and no name covered both. The first instinct was a vaguer name; the
  right answer was that "the players agreed to at most N moves" and "nobody is
  getting anywhere" are two functions.
- **A guard returning a plausible value for "I do not know."** A distance
  measure could not read one variant's camps and returned 0 — a perfectly
  valid distance that also means *every piece is already home*. It would have
  drawn every game of that variant for a reason that was never true.

The last is the dangerous one, because it does not fail. **A rule that cannot
measure must not fire: silence is the safe answer, zero is the dangerous one.**
Where a value can mean both "this" and "nothing said", it will eventually be
read as the wrong one — a stored `flipped: false` meant both "I chose the
ordinary way round" and "I have never touched this", so the seat-aware default
could not arrive for anybody until a third state existed. The board's grades
are nullable for the same reason: a default of "normal" would be a judgement
nobody made, written onto every row and indistinguishable from a real one.

So: prefer null, undefined or a refusal over a value that happens to be in
range. Prefer two functions over a name that covers both. And when a gate
objects, read what it is objecting to before making it stop.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind v4.
- Node 24.x, **pnpm** (never npm/yarn).
- Vitest for unit tests.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6600, override with `WEB_PORT`) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| All gates | `pnpm quality:check` |
| End-to-end | `pnpm test:e2e` |

### Running the end-to-end suite

`RATE_LIMIT_RELIEF=20` must be in your `.env`. Without it the suite fails a
dozen tests with 429s: it drives the whole site from one address and creates a
game in most of its three hundred tests, which trips a limit meant for one
household. The relief multiplies only the limits that exist to bound a cost —
never the guessing paths, and never in production, both of which are tested in
`src/lib/api/rateLimit.test.ts`.

It is written here because `.env` is gitignored, so a fresh clone or a
worktree does not get one, and the failure gives no hint of its own cause.
Three sessions lost time to it, twice after it had already been fixed. See
`.env.example`, which carries it with the reasoning.

Three other things produce failures that look exactly like code bugs, and are
worth ruling out in this order before believing any of them:

1. **A stale dev server.** Running `pnpm build` in the same directory corrupts
   the Turbopack cache — the symptom was every seat link on the site answering
   404, including specs that had passed an hour earlier. Clear `.next` and
   restart before believing anything.

   The same cause has a second, less recognisable face. `prisma generate`
   rewrites the client on disk while a running `next dev` keeps the old one in
   memory, so every query fails against the **new** schema and names the new
   value as though it were the invalid one — `Value 'open' not found in enum
   'BacklogStatus'` — which reads like a bad write rather than a stale
   process. Any page touching that model 500s, and a suite against it times
   out rather than failing, so it costs minutes per run. A schema change means
   restarting the server, and telling the other sessions: the server is shared,
   so one session's `prisma generate` breaks everybody's specs until it is.

   **It lies in both directions, and waiting is not the remedy.** An ordinary
   source edit is enough to cause it: restore a file, re-run at once, and watch
   a test fail on code that is no longer there. That reads as "my fix was
   wrong" and gets investigated, which is the harmless case.

   The dangerous one is the reverse. Deliberately put a bug back to check that
   a test catches it, and watch the test PASS — over code that is not running.
   That reads as "my test is weak", and a good test is then a minute away from
   being rewritten to catch a bug that was never there. **A false pass is most
   convincing at exactly the moment it is least questioned**, which is while
   you are proving a test works. Put another way: a false failure gets
   investigated, a false pass gets committed.

   Sleeping does not settle it — one restore went on being served stale
   through sixty seconds of polling while the file plainly had the change.
   `kill` the server, `rm -rf .next`, start it again and wait for the port to
   answer: about fifteen seconds, and nothing left to argue with.

   Two rules fall out, and both were broken here on the day this was written.
   Never conclude anything from a run in the seconds after editing source. And
   never edit source while a suite is running — the rebuild lands mid-run, and
   every failure after it is about a tree that no longer exists.
2. **Two runs against one database.** Foreground specs while a full suite runs
   in the background: the setup deletions of one race the fixtures of the
   other, and every failure looks real. Two Playwright runs also share
   `test-results/`, so the second one deletes the first one's traces and both
   report ENOENT on artefacts rather than on anything you wrote. Say in the
   shared channel before starting a full suite, and stop your own runs by task
   id — never `pkill -f playwright`, which is machine-wide and will kill
   another session's suite mid-run. Its exit code is a signal rather than a
   failure, and it reads as a mystery at whatever test was in flight.

   A migration is the same hazard one layer down. Applying one to the shared
   local database puts it **ahead** of every worktree whose schema predates it:
   rows come back carrying enum values that worktree has never heard of. No
   restart fixes that, because nothing there is stale — the only fix is the
   migration reaching `main` and the worktree rebasing, then `prisma generate`,
   then restarting its server. Four steps, and the symptom looks identical
   after each of the first three.
3. **Database litter.** `e2e/tidy.ts` clears abandoned seats, seeded members,
   the games a run left unfinished and the ones with nobody on either seat.
   Each spec removes what it made. A local database that has grown past the
   two-hundred-row list cuts pushes real rows off the end of them and fails
   lobby specs on each other's leavings.

   It has three faces, and all three were met in one night. Too MANY rows: the
   suite had left **8,566 active games**, one member holding 1,925, which was
   harmless until a twenty-games-at-once limit landed and then failed a dozen
   specs with a message about a cap in files testing something else. Too FEW:
   the pool leak on the ladder of people could not be seen locally at all,
   because a development database has no computer-pool rows to leak. And rows
   that simply OUTLIVE what made them — a `Player` row keyed to a name a game
   was played under stays after the game is swept, so the name is taken for
   ever and `PATCH /api/me` answers 409 to anybody asking for it. That last
   one is the API being right; the test asking for a common name was the thing
   that was wrong.

   The rule that falls out of it: **a spec must not assert anything about a
   name, a count or a row it did not itself create.** Generate the name, seed
   the standing, clear the variant first. Anything else is a test about this
   machine's history wearing a test about the code.

A fourth is not a false failure but a false *pass*, which is worse, and it has
now been found five times in one day: **a browser test that races hydration.**
A server-rendered control is a real control before React attaches, so waiting
for an element the server also renders proves the HTML arrived and nothing
more. A choice made in that window is dropped, and a timer started on hydration
does not exist yet — so a spec that drives `page.clock` before then finds
nothing to fire. Both fail somewhere else entirely: "started on 9×9 when I
chose 19×19" is a bug about timing wearing a bug about boards, and "the modal
never appeared" is the same thing wearing a modal.

Wait on the marker, never on an element: `{...readyMark(useHydrated())}` from
`src/lib/ui/hydrated.ts` on the component, and `ready(page, testId)` from
`e2e/support.ts` in the spec. The fifth instance was written by somebody who
had diagnosed the fourth, which is the argument for reaching for this first
rather than remembering it afterwards.

The corollary matters as much as the list: do not write a failure off as
litter without looking. On the day this was written, the failure that looked
most like local noise was the computer players falling off the players page,
which was real and would have reached production.

### A Test That Does What A User Would Not Do

The hydration race above is one instance of a wider shape, and the shape is
worth naming because it produces PASSING tests over broken sites.

**A test that reaches its subject by a route no reader takes proves nothing
about the route they do take.** The language picker is the clearest case this
project has had. Choosing a language was verified thoroughly: `?lang=es` sets
the cookie, `Accept-Language: ja` renders Japanese, an unknown tag falls back,
a POST is never redirected. Every one of those was true. Every one of them
reached the feature by typing an address or sending a header — and a reader
reaches it by CLICKING, which nobody had done in a browser.

Clicking was the whole bug. `next/link` made the switch a client-side
navigation, the proxy set the cookie and redirected to the clean address, and
the App Router answered that address out of its own cache — rendered before
the language changed. The cookie was right, the server would have rendered the
new language, and the reader was shown the old one. Reading the code said it
worked, because the code did work; what did not was the path through it.

Three rules fall out, and they cost nothing to follow:

- **Drive the control, not the mechanism.** If a reader clicks it, a test
  clicks it. A test that sets the cookie the click would have set has tested
  the cookie.
- **Never reload to make an assertion pass.** A reload throws away exactly the
  client state these bugs live in, so it converts a broken feature into a
  green test. `e2e/language.spec.ts` reloads nowhere on purpose, and says so.
- **Test the way back, not just the way there.** The review went TO a language
  every time and came BACK from one never. A one-directional test finds
  one-directional bugs, and "I can't get out of it" is a whole class of fault
  that only the return trip sees. The same applies to any remembered answer:
  setting it, changing it, and clearing it are three different tests.

Worth knowing why the sibling feature was fine, because the difference is the
diagnosis: the players filter was remembered by the same file at the time and
had no such bug, because it set its cookie on `next()` WITHOUT a redirect. The
query stayed part of the address, so there was no clean address for a cache to
answer stale. (It has since moved off the cookie onto the account — the page
remembers it through the preferences registry, see `memberFilter.ts` — and
still redirects nowhere.) **A redirect to a cleaned-up address is what makes a
client-side cache able to be wrong** — if you add one, drive it with a click.

### A Merge Cannot Conflict With A File That No Longer Exists

It re-creates it. Silently, with no conflict marker, because from git's point
of view nothing is contested: one side deleted a file, the other side changed
it, and "changed" wins by default on a branch that never saw the delete.

**So a branch that predates a move re-creates every file that move deleted.**
This is not theoretical. On 2026-09-11 the address restructure moved the
seat-claim route from `src/app/games/[slug]/[id]/seat/[token]/route.ts` to
`.../match/[id]/seat/[token]/route.ts`. A branch cut before it added the
active-game cap to the OLD path. Merged as it stood, the site would have had
two seat-claim routes: a live one under `/match/` with no cap on it, and a
resurrected one at a dead address carrying the cap somebody had just written.
The check would have been present in the tree, tested, green, and never once
executed by a real request.

That is worse than either forgetting it or breaking the build, and it is the
same family as the entry above: **a test that reaches its subject by a route no
reader takes**. A route handler's unit tests import the module directly, so
they pass on a resurrected file exactly as they would on a live one. Nothing in
the suite can tell you which of the two a seat link actually reaches.

What to do, and it is cheap:

- **Rebase a branch onto main before finishing it, not after** — especially any
  branch touching `src/app/`, where this codebase moves addresses.
- **After merging a branch older than a move, list the files it added or
  changed and check each path still exists on main.** `git diff --name-status`
  against the merge base says it in one line.
- **Then prove the code is REACHED, not merely present.** Drive the real
  address — the one a link, a seat token or a redirect actually produces —
  rather than importing the module. "It is in the tree" and "it runs" are two
  claims, and a resurrected file satisfies the first only.
