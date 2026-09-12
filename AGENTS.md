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

**The one sanctioned exception is a narrow, its-own-secret credential for a
specific path, not a session** — the embed token for `/embed` and `/api/embed/`,
and, since board convergence ITS-02, the board token for `/api/backlog` and
`/api/backlog/[id]`. Both exist because the caller has no browser to hold a
session cookie in, both are checked by their own dedicated function
(`verifyEmbedToken`, `constantTimeEqual` against `BOARD_TOKEN`), both grant
nothing beyond letting the request continue to the route — which re-checks
the same secret itself, plus whatever the gate does not know about (the
embed's `data` scope, the board's `X-Board-Actor`) — and neither ever
removes a way through that already existed; a wrong or missing credential
falls through to the ordinary session check exactly as before. A THIRD one
of these needs the same shape and the same reasoning stated beside it, not
a shortcut that skips the dedicated check or grants more than "continue".

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
- **It says where its stones sit.** `grid` on its `VARIANT_SPECS` row: `lines` for a game
  drawn on the crossings, as gomoku and go are; `cells` for one drawn in the squares, as
  tic-tac-toe, Othello and checkers are. Declared, never inferred — tic-tac-toe and gomoku
  share their mechanics and are not drawn alike — and a row without it does not compile.
  The traditional view reads it, so a guess here is a wrong picture on every page.
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

### Plans In The Repository

**A multi-ticket plan lives in `docs/plans/<plan>/`, one file per ticket, and
a board row that says `Plan: docs/plans/…` is implemented from that file.**
Read the plan, its folder's `README.md` and `BOARD_RULES.md` in full before
starting. The first is `docs/plans/board-convergence/`, which brings this
board and UmaKuma's to one contract; its README says which rows exist and
in what order to take them.

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
version, because the board API checks for the OPERATOR's session specifically
— so "I could not call the API" was true, and until board convergence ITS-02
it was precisely the point: there was no other door.

**There is one now.** `pnpm task` talks to the same API the page does, with
a board token (`BOARD_TOKEN`, separate from `ADMIN_TOKEN` and never able to
open a browser session — see `.env.example`) and an actor name, so every cap
and every move rule in this section applies to it exactly as it applies to a
click. The CLI is the API: there is nothing it can do that walks past a rule
above.

```
pnpm task                              what is open and who holds it
pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]
pnpm task claim <key> --by "<who>"     open -> inProgress
pnpm task release <key> --by "<who>"   inProgress -> open
pnpm task drop <key> --by "<who>"      -> dropped
pnpm task reopen <key> --by "<who>"    dropped -> open
pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none
pnpm task edit <key> [--title "…"] [--detail "…"]   the text, through the API's own door
```

In progress is a claim with a six-hour lease (board convergence ITS-01), not
only a status: `claim` on a row somebody else holds is refused with their
name, and cannot be taken over inside the lease. A hold nobody has renewed
past six hours is free again, and `pnpm task`'s list prints it as STALE
first — before WAITING — because somebody started it, and a reader should
know that before starting again.

If a cap needs enforcing against something that is not the API, it has to be a
constraint in the database; anything in TypeScript is another door rather than
a lock. `backlog.coverage.test.ts` checks SEEDED rows and cannot see live ones,
so nothing today would catch this.


### Every Landed Commit Bumps The Version

**`pnpm release:take` takes the number, immediately before pushing, chained
with `&&` so a red gate stops the push before any file is touched:**

```sh
pnpm release:take --summary "A new game a player would notice." && \
  pnpm preflight:prod && git fetch origin && git push origin HEAD:main
```

A **minor** (the default) is something a player would notice — a game, an
opening, a page, a capability — and needs at least one `--summary`, written
for the person reading `/releases`, not for whoever picks the ticket up next.
A **patch** (`--patch`) is a fix, a rewording, a refactor or a chore, and
needs no summary at all — pass one anyway and it still gets a changelog line.
`--done <key>` marks a row done through the API with the version just taken;
see board convergence ITS-04 and the Board Gate section above. `done` has no
other door: the page and `pnpm task` cannot offer it, and a row already done
does not move again.

This replaces two things that used to go wrong by hand, both written down
here because this file is the one you open when you are already thinking
about releases. `CHANGELOG.md` had 151 releases and dated none of them —
nothing recorded when they shipped, so nothing could be dated afterwards.
And fifteen commits once landed in one night with no version bump at all,
because nothing forced one: `releases.test.ts` only refuses a changelog
naming a version NEWER than `package.json`, so shipping real work with the
changelog never mentioning it passed every gate there was.

The cost is not tidiness. **The version and the changelog are how the site's
owner knows something shipped.** A night of real fixes went out unversioned,
and from the outside that is indistinguishable from a night where nothing was
deployed — which is exactly what he concluded, and said.

**THE NUMBER IS NEVER WRITTEN ON THE BRANCH.** A session working in a
worktree does not know what will land before it, so a number written into
`package.json` while the work is still in progress is a guess about the
order of other people's commits — two branches once guessed the same one in
a single night. `pnpm release:take` fetches `origin/main` first and refuses
outright if the version it would take is already there, which is the whole
safety property: the number is only ever taken at the moment it is checked,
immediately before the push that makes it real, and a taken one is caught
rather than collided with. Leave `package.json` alone on a branch; the tool
is what claims a number, and it does that once, right before pushing.

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
   after each of the first three. And the other direction has its own face: after
   rebasing PAST a schema change, the first typecheck shows dozens of
   `Property 'offeredAt' does not exist` errors across files you did not
   touch — a stale generated client, cleared by `pnpm db:generate`, that reads
   exactly like a broken merge.
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

**A branch that changes many routes gets its full run on a PULL REQUEST, not
on the shared machine.** `ci.yml` runs on `pull_request` against a throwaway
Postgres with its own concurrency group, so a big branch can have the whole
browser suite run on a fresh database — the real green — without `auth.setup.ts`
sweeping the shared one under four other sessions. Push the merge to a branch,
open a PR, read the run, and push to `main` only once you can tell a real
regression from the noise. That is how 0.156.0 shipped: three PR runs
separated one genuine bug this branch introduced from twelve standing
environment failures and four that were already red on `main`. The e2e gate
being advisory (deploy needs only `verify`) is what lets the PR run be the
judgement rather than an automatic block — so somebody has to READ it, which
is the whole point of running it there.

**To run ONE spec without taking the database out from under every other
session**, there is a route, found by the Checkers agent and used twice since:

```sh
pnpm exec playwright test e2e/<one>.spec.ts --no-deps --output /tmp/<scratch>
```

`--no-deps` skips the `setup` project, which is where `auth.setup.ts` sweeps
the shared database; `--output` somewhere private keeps `test-results/` out of
another run's way. The spec still needs a signed-in state, so mint
`.auth/admin.json` yourself with a throwaway script that posts to
`/api/session` — never by running the setup project. Two caveats, and the
second is the one to say out loud when reporting: a spec that creates rows
still creates them, so read what it seeds before running it against a
database holding real accounts (the profile specs `PATCH /api/me`, which on
this machine is John's own row); and **a spec run this way has not been run
by the runner** — it verifies the behaviour, and it is not the same claim as a
green suite. Say which one you are making.

**And before any `--no-deps` run, confirm the listener on your `WEB_PORT` is
your own worktree's process, not merely that something answers.** Playwright's
`reuseExistingServer: true` will happily run your spec against whatever is on
the port — another agent's dev server took 6651 between two of one agent's
runs, and the next run would have been a green over code that was not running.
`lsof -i :<port>` and check the PPID is your checkout's; move ports if not.

A fourth is not a false failure but a false *pass*, which is worse, and it has
now been found five times in one day: **a browser test that races hydration.**
A server-rendered control is a real control before React attaches, so waiting
for an element the server also renders proves the HTML arrived and nothing
more. A choice made in that window is dropped, and a timer started on hydration
does not exist yet — so a spec that drives `page.clock` before then finds
nothing to fire. Both fail somewhere else entirely: "started on 9×9 when I
chose 19×19" is a bug about timing wearing a bug about boards, and "the modal
never appeared" is the same thing wearing a modal.

**`Intl` in render is a bug; `Intl` in a handler is the only correct place
for it.** The 0.146.1 fault was `Intl.DisplayNames` called while a client
component rendered: Node and Chromium spell four regions differently, so the
server drew one form and the browser drew another. The fix moved the list to
a server prop. But the "use this device's time zone" link still calls
`Intl.DateTimeFormat().resolvedOptions().timeZone` — in its click handler —
and that is right, not a leftover: the server cannot know the device, the
browser is the only honest source, and a handler runs after hydration where no
mismatch is possible. A merge gate that greps `ProfileForm.tsx` for `Intl`
will find it and stop. Read where the call sits before "fixing" it; removing
that one would break the link to fix a bug it does not have.

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

### Two More Ways A Clean Merge Is Wrong

The section above is about a file. Both of these are about everything AROUND
the file, they produce no conflict marker either, and both happened on
2026-09-11 in the space of three merges.

**A rename leaves dead links in files the rename never touched.** `/my-games`
became `/play`, and the branch that did it updated every caller it knew about.
Two were missed: one in a file nobody had listed, and one in a branch that had
merged **twenty minutes earlier** and could not have known. That second one is
the nasty shape — it was written against a tree where the old address existed,
it was correct when written, it was correct when merged, and it was dead by the
next commit.

No ordering constraint can catch that, because the file did not exist in the
queue when the queue was written. **The only thing that finds it is grepping
the OLD name across the whole tree after the rename lands**, which by
definition cannot be the list of files the rename touched.

**A generated artefact whose source another branch rewrites.** One branch cut a
96-pixel thumbnail for every game out of `public/art/games/<variant>.jpg`. The
next branch replaced eight of those pictures. The merge was perfectly clean —
**git does not know one file is made of the other** — so eight lists would have
shown the old board beside the new one, in the same release that introduced
both. Nothing failed; nothing could.

So, when a merge brings in a file that something else is DERIVED from, re-run
the derivation rather than reading the diff. Here that is `pnpm art:thumbs`,
and it takes seconds. The general question to ask of any merge: **what in this
tree was made out of a file this branch just changed?**

### A Tolerant Assertion Enumerates What It TOLERATES

A test that accepts more than one answer must list the answers it accepts,
never the ones it rejects — because the answer you forget to exclude is always
"nothing happened at all".

`e2e/seat-token-privacy.spec.ts` guards a creation that may legitimately fail:

```ts
if (made.status() !== 201) {
  expect([400, 404, 422]).toContain(made.status());
  return;
}
```

On a fresh database that call answered **401**, which is not in the list, so the
spec failed loudly and the whole investigation below started. Had it been
written the other way round — `expect(status).not.toBe(500)`, or with 401 added
to be accommodating — the security regression test for 0.133.1 would have
reported green on a runner where it had **never once created a game**.

The same rule in one line: a green test must be a statement about the code, and
"I could not get far enough to look" is not one.

### A Fixture Must Make The Row It Signs In As

The browser suite signs in as the operator, and the operator **was never a
member**. `/api/session` with `kind: "admin"` mints a session and nothing else;
a member is something Google makes, and `touchMember` returns early when there
is no row rather than inventing one. So every route asking `currentMemberId()`
answers 401 to the operator — challenging somebody, taking a seat, reading your
own record, being badged on your own row.

It was true from the day the suite was written and never showed once, because
the default `ADMIN_EMAILS` is the site owner's own address and the shared
development database has held his real Member row for months. **The suite was
leaning on a row no fixture had ever made.** The first fresh database it met
turned that into twenty-odd failures, in files testing something else entirely,
none of which named the cause.

This is the database-litter rule from the other end. That one says a spec must
not assert anything about a row it did not create. This says the same thing
about the row it *authenticates as*, which is easy to miss precisely because
nothing asserts anything about it — it is scenery, until it is absent.

**And the trap in fixing it.** The obvious remedy is the `seedMember` helper
that already exists. It upserts, and its `update` writes a name, a country and
a bio over whatever it finds — so on a developer's machine it would have
quietly rewritten the owner's own profile on every run. `ensureMember` is
create-only, with a deliberately empty `update`, for that reason. **A fixture
that repairs a missing row must not also edit a present one.**

### A Killed Job Reports As Cancelled, Not Failed

`timeout-minutes` firing shows up as `cancelled` in `gh run list`, which is
indistinguishable from a person pressing the button. The first run of the
browser suite on a runner died at 30m18s having reached [539/517] with retries
— essentially the whole suite — and read as though somebody had stopped it.

The companion, one layer up: **`concurrency: cancel-in-progress` on the deploy
workflow means a push kills the deploy under it.** That is right in the middle
of a queue, where each push supersedes the last and costs nothing. It is
dangerous at the END of one: push, something cancels it, nothing follows, and
the site stays a version behind while every job reads green-or-cancelled rather
than failed.

**So after the last push of a session, check the live version rather than the
run.** `curl -s https://itsutsu.com/games | grep -oE '0\.[0-9]+\.[0-9]+' | sort -u | head -1`
reads it out of the page and needs no credential.

The same distinction decides the two concurrency groups, which are deliberately
opposite. `vercel-deploy.yml` cancels in progress, because **a superseded
deploy is worthless**. `ci.yml` queues instead, because **a superseded test run
is evidence** — it is the only record of whether the commit it was started for
was sound, and it is the thing a bisect goes looking for.

### An Absence Is Only Meaningful After A Presence Has Been Waited For

`toHaveCount(0)` passes the instant it is asked. So does `not.toContainText`.
Neither can tell "this is not offered" from "I asked before the page had
answered", and the second one is always true for a moment on every page.

This is the hydration race again, but it needs naming separately because the
remedy people reach for does not cover it. A spec waiting on a marker before
asserting something is PRESENT is the well-known case. A spec asserting
something is ABSENT often waits on nothing at all, because there is nothing
obvious to wait for — and it goes green immediately, for ever, whatever the
page does.

**So: wait for something that IS on the page before asserting that something
else is not.** Usually a sibling — the form the control would have been in,
the list the row would have been in. Then the absence is a statement about a
rendered page rather than about the speed of the request.

Three instances found in one night, all green, all saying nothing:

- `e2e/opponent-actions.spec.ts` counted `computer-player-name` immediately
  after `page.goto` in two tests — in a file whose own header warns about
  "a skip that read as 'this player has no opponents' and meant 'I asked
  before the page had answered', which is the quietest way for a test to say
  nothing at all". The author fixed the count below and missed the two above.
- A new spec asserted the variant chooser is not offered where the address
  already names the game. It would have been green whether or not the chooser
  was there.
- Ten specs skip on database CONTENTS — "no computer players on this
  database", "no finished games on this database" — and report green when they
  skip. On a richer database they run; on a leaner one they assert nothing.
  A skip is an absence too.

**And the corollary, which is the reason this is a section rather than a
footnote:** `ready()` appeared in 2 of 102 spec files when this was written; the 0.170.2 sweep took it to 42 of 122 and the marks from 14 to 28 components, with every one of the 122 accounted for in `docs/plans/e2e-ready-sweep.md` — 57 drive nothing hydrated, 22 drive the practice board (`ssr: false`, so the board and its handlers arrive in one commit), and one is left with its reason. Five hydration races
were found in a single day against that adoption. **A documented remedy
nobody applies is worse than an undocumented problem, because it lets
everybody believe the problem is handled.** The finding is the 2%, not the
races. Do not add a remedy to this file and consider the matter closed; go
and apply it, or say plainly that it is not applied.

### One Session Owns The Browser, And Verifies Rather Than Relays

The database is the lock, not the port. Every worktree shares
`localhost:55434` and every Playwright run shares `test-results/`, so two runs
on two different `WEB_PORT`s collide exactly as badly as two on one. The
setup deletions of one race the fixtures of the other and every failure looks
real, which is the expensive part: the collision is cheap, the hours spent
believing its failures are not.

Three double-assignments happened in one night — a ticket, a fix, and the
browser — and all three had the same shape: **two people with authority
answering the same question minutes apart, neither knowing the other had.**
More care does not fix that. One owner does.

So one session owns the browser and hands it on; everybody else asks that
session, including when it is urgent, and including when somebody else has
just said it is free. A second-hand "it is free" is how the third one
happened.

**And the holder is established by looking, not by asking.** `ps aux | grep
playwright` answers in one line who is actually running, from which checkout.
A relayed release is a claim about the past; the process table is the present.

### A Spec Should Bring Its Own World

The rule already exists above — a spec must not assert anything about a name,
a count or a row it did not itself create. This is here because **three
sessions rediscovered it independently in one night, from three directions**,
which makes it a gate problem rather than a documentation problem:

- A spec asserted it landed on the second game IT had created. It landed on a
  real waiting game eight moves old, left behind by the full-suite run. **The
  feature was working correctly the whole time** — the queue is drawn from
  seat cookies AND the account, the suite plays as one member, so a spec
  signed in as that member inherits every unfinished board four hundred other
  tests left behind.
- Ten specs across six files skip on database CONTENTS — "no computer players
  on this database", "no finished games on this database" — and report green
  when they skip. On a rich database they run; on a lean one they assert
  nothing and nobody is told.
- A `toHaveCount(0)` that could not tell "not offered" from "asked too early".

**The dangerous fix in the first case was to loosen the assertion until it
passed.** That ships a feature whose test cannot tell working from broken, and
it looks like diligence while doing it. The remedy that worked instead was
cheap: the spec claims its own seats as a browser holding an invite and no
account, so its queue holds exactly the games it created and nothing else.

**What this costs us to ignore:** a full suite of 472 passing specs was run on
a clean checkout on 2026-09-11 and reported green with no retries. That number
is honest, and it is a statement about THAT DATABASE as much as about the
code. It does not travel. Neither does any green that rests on rows a previous
run happened to leave behind.

### A Scratch File In The Shared Checkout Is Somebody Else's Commit

Two sessions ran `git add -A` in `/Users/john/Projects/gomoku` while a
one-off runner was sitting untracked in `src/`, and both swept it into their
branches. It had been deleted an hour earlier and never committed by the
session that wrote it — and it came back twice, at two different merges, as a
file in `src/**` that `pnpm test:unit` then ran.

Nothing conflicts, nothing warns, and the author who deleted it has no reason
to look for it again. It is the same family as the entry above — a thing you
removed reappearing through somebody else's tree — with the difference that
here **the file was never yours to delete from their branch**, because it was
in their working directory the moment they staged everything.

So:

- **Temporary files go in the session's scratchpad**, never in the repository,
  even when it is inconvenient. The one case that makes it inconvenient is a
  runner that needs `@/` aliases and `server-only`, which only resolve under
  vitest from inside the project — put it in `src/`, run it, and **delete it
  in the same breath**, before anything else can stage it.
- **`git add -A` in a shared checkout stages other people's work in progress.**
  Prefer naming the paths you mean. If you do stage everything, read the list
  before committing: a file you have never heard of is somebody else's.
- **After merging a branch, check for files it added that you did not expect** —
  `git diff --name-status` against the merge base, the same sweep the entry
  above already asks for, reading it for additions as well as for paths that
  have moved.

### A Raw Control Byte In Source Makes The File Opaque

The XP ledger used a NUL as the separator inside a map key — `${type}\0${subject}`
— which is a sound choice, since nothing in either half can contain one. It was
typed as the RAW BYTE rather than the escape, and that made `awardXp.ts` and its
test binary to every tool that looks at source: `file(1)` said "data", grep
answered "Binary file matches" and nothing else, and `git diff --numstat`
showed `-/-`, which means every future diff of the ledger would have printed
"Binary files differ" and shown nobody the change. TypeScript compiled it and
the tests passed, so nothing failed.

**How it stays unnoticed is the reason this is written down:** the agent's own
greps on its own file returned nothing, which reads as "the pattern is not
there" rather than "the file is unreadable". Two rules, both cheap:

- **Write a control character as its escape, never as the byte** — `\0`,
  `\t`, `\u001f`. Identical at runtime; text on disk.
- **A grep that returns nothing on a file you know contains the thing is a
  fact about the file, not the pattern.** `file <path>` settles it in one
  line, and `git diff --numstat` showing `-` for a source file is the same
  signal from git.

### Three Things A Worktree Gets Wrong Before Any Code Runs

All three were found by different agents on 2026-09-12, each cost a wrong
diagnosis before the cause, and none of them is about the code.

- **A worktree installed before its `.env` is copied in gets a Prisma client
  that loads no `.env`, for its whole life.** The generated client records
  the `.env` path at `prisma generate` time (`relativeEnvPaths`), and
  `pnpm install`'s postinstall generates it. Installed at 05:56, `.env`
  copied in at 06:14: every vitest runner in that worktree then fails with
  `Environment variable not found: DATABASE_URL`, which reads as a missing
  file rather than a stale generate — and the agent "fixed" a script line
  that was never wrong. Copy `.env` in BEFORE `pnpm install`, or run
  `pnpm db:generate` after. (The main checkout's client loads `.env` itself:
  a bare `vitest run` there reaches the database with nothing passed, and an
  inline `DATABASE_URL` wins over it — checked both ways.)
- **`.auth/player.json` must be its own identity, never a copy of the admin
  state.** A copy makes every "two player" case one account: `seatsToSitAt`
  filters the stranger's seat out as the reader's own, and a spec about two
  people passes over one. Mint it by redeeming an invite, as `auth.setup.ts`
  does — the `--no-deps` route skips that setup, so it is on you.
- **The session scratchpad is shared between the agents of one session.** An
  agent's `mint-player.mjs` collided with another's file of the same name and
  RAN THEIRS — pinned to their worktree and their port. It threw on first
  read and wrote nothing; the bad version is a script that succeeds and
  writes into somebody else's worktree. Prefix every scratchpad filename with
  something of yours, and never trust a generic name you did not just write.

### The Stash Stack Is One Stack For Every Worktree

Worktrees are isolated — checked by inode, not reasoned about: the same file
in two agent worktrees is two files. **The stash is not.** `git stash` from any
worktree pushes onto the one stack the repository has, so a bare `git stash
pop` in one worktree can pop an entry some other session made in another, and
the edit it was holding is gone. That cost the PLAYED-column agent a
working-tree change it then had to rewrite.

The rule this repository already has — never a bare `pop`; name the stash and
`git stash apply <sha>` — was written for the shared checkout. It holds for the
same reason in every worktree, and this is the reason: **the stack is shared
even when the working directory is not.**

Two smaller things from the same night, since they read as broken branches
and are not:

- **A worktree with no `node_modules` fails `pnpm typecheck` with "next:
  command not found".** `pnpm install` there, once. The `npx` equivalents work
  because they resolve from the main checkout, which is how this hides.
- **"A file changed under me" in a worktree is your own rebase pulling in a
  change that landed on main**, not another session in your directory. Read
  the diff before assuming an intruder.
