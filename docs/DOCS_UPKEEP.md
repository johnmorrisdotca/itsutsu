# Keeping the docs true

How Itsutsu's documentation stays correct as the site changes: which doc
describes which code, when a change must touch a doc, what is checked by
machine, and what a person or an agent reviews on a schedule. The same plan,
with its own map, is in UmaKuma at `docs/DOCS_UPKEEP.md`.

**Status: adopted, 2026-09-24.** John's decisions are recorded at the end.
The checks listed below are still to be built.

## Why this exists

Itsutsu already holds most of its public pages to the code, and it shows.
The About page may not type a count of games (`about.coverage.test.ts`), and
neither may the home page (`homePitch.coverage.test.ts`). Every game needs full
rules copy, a family, a screenshot and an end-to-end test before it can ship
(`variants.coverage.test.ts`). A board picture drawn from an old board fails
the build (`boardArt.coverage.test.ts`). `/releases` is parsed from
`CHANGELOG.md` rather than kept a second time.

Nothing reads the hand-written docs, though. They drift, even in a repository
this careful:

| Doc | What it says | What is true |
|---|---|---|
| `README.md`, "The backlog" | five statuses: proposed 提案, planned 予定, building 作業中, done 完了, dropped 見送り | four since the board moved to Sumilabu: open, inProgress, done, dropped (`src/lib/backlog/backlog.constants.ts`, which records why `proposed` and `planned` were merged) |
| `README.md`, headline and "Forty-five games and three puzzles, in eight families" | 45 board games and 3 puzzles in 8 families | true today (checked 2026-09-24, after the races joined Territory and Numbers opened), but typed by hand. It goes stale with the next game, and the tests that stop the About and home pages doing this do not read the README |

So the plan does two things. It moves as much as it can into the tested group.
For what cannot be tested, it names who changes the doc and when, and it adds a
review on a schedule to catch what slipped.

## Three kinds of doc, held three ways

| Kind | Examples | Ships with a deploy | Held by |
|---|---|---|---|
| **A. Pages on the site** | `/about`, the home page, rules pages, `/learn`, a game's background and history, `/games` | yes, they are code | coverage tests that read the code |
| **B. Generated docs** | `CHANGELOG.md` (written by `pnpm release:take`, read by `/releases`), `docs/japanese-review.md`, the game pictures and thumbnails | yes (`CHANGELOG.md` is the one Markdown file that deploys) | the generator plus a test that fails on drift; never edited by hand |
| **C. Hand-written docs** | `README.md`, `AGENTS.md`, `docs/email.md`, `docs/brand/*`, `docs/plans/*` | no (the `paths` filters skip `*.md` and `docs/**`) | the map below, the release checklist, and the scheduled review |

## Standing conventions

- **No attributions, anywhere.** John, 2026-09-24: no mention of Claude, AI or
  any assistant in commits, pull request titles or bodies, code, docs or site
  copy. That means no `Co-Authored-By` trailers, no "Generated with" footers
  and no session links. The scheduled review checks its own pull request for
  them before opening it.
- A number about the site is read from the site, never typed into a sentence.
- Outside data carries the date it was last checked (see "Outside data" below).

## The map: which doc describes which code

When a commit changes a path in the right-hand column, re-read the doc on the
left. If a sentence in it is now false, fix it in the same commit. If every
sentence is still true, leave the doc alone. An edit made only to show the doc
was looked at is the "satisfy the report" failure `AGENTS.md` warns about in
"Nothing Answers What It Cannot Answer".

### Hand-written (kind C)

The README is Itsutsu's main technical doc, so it is mapped by section.

| Doc | Written for | Re-read it when these change |
|---|---|---|
| `README.md`, headline, "What it does", "Forty-five games…" | visitors, engineers | `src/lib/gomoku/gomoku.constants.ts` (`RULE_VARIANT_LIST`), `src/lib/gomoku/families.ts`, `src/lib/gomoku/variants.constants.ts` |
| `README.md`, "Puzzles" | visitors, engineers | `src/lib/puzzles/**`, `src/components/puzzles/**`, `src/app/api/puzzles/**`, `src/lib/catalogue/gameKeys.ts` |
| `README.md`, "Openings", "Handicaps", "The board…" | engineers, players | `src/lib/gomoku/rules/**`, `src/lib/gomoku/engine.ts` |
| `README.md`, "Players, ratings and records" | engineers, players | `src/lib/rating/**`, `src/lib/record/**`, `src/lib/xp/**`, `src/lib/legacy/**` |
| `README.md`, "The computer players" | engineers, players | `src/lib/bots/**` |
| `README.md`, "The backlog" | engineers | `src/lib/backlog/**`, `src/lib/sumilabu/**` |
| `README.md`, "Getting in", "Who gets in", "Invite codes", "Rate limits" | engineers | `src/proxy.ts`, `src/lib/invite/**`, `src/lib/auth/**`, `src/lib/api/rateLimit.ts` |
| `README.md`, "Games played from two devices" | engineers | `src/app/games/[slug]/match/**`, seat-token code |
| `README.md`, "Embedding the board", "Embed tokens" | integrators | `src/app/embed/**`, `src/app/api/embed/**`, `src/lib/embed/**` |
| `README.md`, "The API" | integrators | `src/app/api/**` (new or removed routes) |
| `README.md`, "Deploying", "Scripts", "Getting started" | engineers | `.github/workflows/**`, `package.json` scripts, `.env.example`, `next.config.ts` |
| `docs/ARCHITECTURE.md` | engineers | `src/app/api/**`, `src/proxy.ts`, `src/lib/gomoku/engine.ts`, `src/lib/i18n/**`, `.github/workflows/**`, `next.config.ts` |
| `docs/CORE_CONCEPTS.md` | anyone new to the code | `src/lib/gomoku/**`, `src/lib/puzzles/**`, `src/lib/catalogue/gameKeys.ts`, `src/lib/rating/**`, `src/lib/bots/**`, `src/lib/xp/**`, `src/lib/auth/**` |
| `docs/DATA_MODEL.md` | engineers | `prisma/schema.prisma` and `prisma/migrations/**`, every time |
| `docs/email.md` | the operator | `src/lib/mail/**` |
| `docs/brand/*` | anyone writing copy or art | a brand decision by John; nothing in the code |
| `docs/plans/*` | agents | the tickets the plan covers; a plan is finished when its tickets are done, then it is kept as history |
| `AGENTS.md` | agents | a rule changes; the agent that changes the rule changes the file |

### On the site (kinds A and B)

| Page | Source | Re-read it when | Already tested by |
|---|---|---|---|
| `/about` | `src/app/about/**` | a feature a visitor would notice ships, a family is added, the bots change | `about.coverage.test.ts` |
| home page | `src/app/page.tsx` | the same, plus any change to invites or beta testing | `homePitch.coverage.test.ts` |
| `/thanks` | `src/app/thanks/page.tsx`, `src/lib/thanks/testers.ts` | a tester asks to be listed or taken off, or the gate's open list changes | `testers.test.ts`, `proxy.test.ts` |
| `/privacy` | `src/app/privacy/privacy.constants.ts` | `prisma/schema.prisma` gains or loses a column about a member, a cookie is added, `src/lib/mail/**` sends something new, the gate's open list or `OPERATOR_ACTIONS` change, a service is added; move `PRIVACY_CHANGED` with the sentence | `privacy.coverage.test.ts`, `proxy.test.ts`, `e2e/privacy.spec.ts` |
| `/terms` | `src/app/terms/terms.constants.ts` | the ban, the ignore list, what ignoring stops, Report a problem, account removal or a game's clock rules change, or the gate's open list does; move `TERMS_CHANGED` with the sentence | `terms.coverage.test.ts`, `proxy.test.ts`, `e2e/terms.spec.ts` |
| rules pages, a game's background and history | `src/lib/gomoku/variants.constants.ts`, `src/app/games/[slug]/**` | a game is added or its rules change | `variants.coverage.test.ts`, `gameLinks.coverage.test.ts`, `gamePictures.coverage.test.ts` |
| `/learn` | `src/lib/learn/**` | the strategy advice depends on a rule that changed | nothing yet |
| `/games` | `src/app/games/PublicCatalogue.tsx` | a game or family is added | `publicCatalogue.coverage.test.ts` |
| game pictures | `public/art/games/*`, from `pnpm screenshots:games` | the board drawing changes | `boardArt.coverage.test.ts` |
| puzzle pictures | `public/art/games/<puzzle>.jpg`, from `pnpm screenshots:puzzles` | the puzzle grid's drawing changes | `puzzleArt.coverage.test.ts` |
| About screenshots | `public/art/about/*`, listed in `src/app/about/about.shots.ts` | a page one of them shows changes shape: the board, the replay panel, the picture window, the set-up screen, a player's page | `about.coverage.test.ts` (each file exists, at the size the page reserves) |
| `/releases` | `CHANGELOG.md` | written by `pnpm release:take`; never by hand | `releases.test.ts` |
| `docs/japanese-review.md` | `src/lib/i18n/dictionaries/**` | regenerate; never edit | `japanese.coverage.test.ts` |

When a new doc lands, it gets a row here in the same commit. A doc without a
row has no trigger, so nothing will ever make anybody re-read it.

## When a change must touch the docs

One step before `pnpm release:take`, for every release:

1. List what the release changed: `git diff --name-only origin/main...HEAD`.
2. For each path, find its rows in the map. Re-read those docs.
3. Fix what is now false in the feature's own commit, before `release:take`.
   The tool commits only `package.json` and `CHANGELOG.md`, and refuses when
   either has changes of its own, so a doc fix cannot ride in the release
   commit.
4. If the release adds something a visitor would notice, ask whether `/about`
   or the home page should say so. That is a judgement, not a rule. The
   About page's Playing here chapter is where a feature used during a game
   belongs; the move slider and the picture of every position shipped on
   2026-09-23 and were on no page until John asked where they were.
5. If the release renames or removes something a doc might name (a route, a
   status, a script, a family), grep `README.md` and `docs/` for the old name.

A change to the docs alone costs nothing here: `vercel-deploy.yml` and `ci.yml`
both skip a push or pull request that changes only `*.md` and `docs/**`. It can
go up on its own, as "Fewer Pushes" in `AGENTS.md` allows.

## Checks worth adding, in order of value

None of these is built yet. Each is one test file or one script.

1. **The README counts from the catalogue.** Extend the About page's
   no-counts-in-prose rule to `README.md`. The README is Markdown and cannot
   interpolate, so the test takes a different shape: it reads the number the
   README states ("Forty-five games and three puzzles, in eight families") and fails when it is
   not `RULE_VARIANT_LIST.length` and `GAME_FAMILIES.length`. When game 46
   lands, the build says which sentence to change.
2. **Retired words.** One test that reads `README.md` and `docs/**/*.md` (not
   `docs/plans/`, which are history) and fails on any word from a list of names
   the code no longer uses: the backlog's `proposed` and `planned` statuses,
   `middleware.ts`, `/api/backlog`. Each entry carries the date and what
   replaced it. This file and `AGENTS.md` are exempt, since both name retired
   words on purpose. When a rename lands, its old name goes on the list in the same
   commit. It would have caught the backlog drift above.
3. **The map cannot rot.** A test that parses the map tables in this file and
   fails when a path in the right-hand column matches no file, so a moved folder
   breaks the map loudly instead of silently removing a doc's trigger.
4. **`release:take` prints the docs to re-read.** Before it writes anything, it
   prints the docs whose map paths the release touched. Advisory, never a
   failure: most code changes leave every sentence of a doc true.
5. **Commands in docs exist.** A test that finds every `pnpm <script>` in the
   README and `docs/` and fails when `package.json` has no such script (a
   command documented for UmaKuma's checkout, like `db:backup:archive`, is
   listed as an exception). It finds nothing wrong today (checked 2026-09-24),
   which is the reason to add it now, while it is green.

## The scheduled review

A test can say a doc names something that is gone. It cannot say a doc is
missing what is new. That needs reading, on a schedule.

**Weekly, Monday morning Vancouver time.** A scheduled routine, one per repository:

- reads the releases since the last review (`CHANGELOG.md` headings newer than
  the version recorded under "Last review" below);
- for each release, reads its diff against the map and checks the mapped docs
  for sentences that are now false or areas that are now missing;
- opens **one** draft pull request with the fixes, or posts "nothing drifted"
  in the UmaKuma Documentation project if there are none;
- updates "Last review" in that same pull request.

It reads code and writes prose only, never pushes to `main`, and its pull
request runs no Actions minutes, because prose-only pull requests skip CI here.

**Monthly, first Monday.** The same routine goes further:

- reads `/about`, the home page and `/learn` on the live site against the
  month's releases, for what a visitor would now expect to see;
- lists `docs/plans/*` whose tickets are all done, so they can be marked as
  history;
- lists docs with no row in the map, and docs whose rows have had no trigger in
  ninety days, as candidates to retire.

## Outside data

Some of what the site shows was copied from somewhere else, and that somewhere
can change or vanish. John, 2026-09-24: outside data is re-checked on a
schedule, and each source shows the date it was last checked, so anybody can
see how fresh or stale it is.

| Source | Where it lives | What re-checking means |
|---|---|---|
| Famous games (Andries Brouwer's Go database, and any source added to `FAMOUS_SOURCES`) | `src/lib/famous/famous.constants.ts`, `famousGames.data.ts` | the source is still up, still says the games are free to republish, and still records the same moves and results |
| Records copied from other sites (ItsYourTurn and the rest) | `src/lib/legacy/legacyPlayers.data.ts`, `legacyGames.data.ts` | the site is still up and each kept figure still matches what it shows; a site that has gone is noted, and its record stays |

**How it is shown.** Each entry in `FAMOUS_SOURCES` and each `LegacySource`
gets a `checkedOn` date (`YYYY-MM-DD`). Wherever the site credits a source
(the famous games' "Record:" line, a player's record from another site), it
prints "checked <date>" beside it. A test fails when a source has no date.
It does not fail when a date is old, because a build must not go red just
because time passed. Staleness is the scheduled review's job.

**How often.** The monthly review lists every source whose `checkedOn` is more
than ninety days old, re-checks them, and moves the date forward in its pull
request. A source that no longer matches is reported in the project and never
quietly rewritten.

## Who owns what

| Doc | Owner |
|---|---|
| Kind A and B pages | whoever ships the code; the tests enforce it |
| Kind C docs mapped to code | whoever ships the code that triggers the row |
| The scheduled review and this file | the UmaKuma Documentation project |
| `docs/brand/*` | John |

The release session ("ITS: Agent") ships every release, so in practice it
follows the checklist. Documentation threads in the project open draft pull
requests and hand them to that session. They never push to `main`.

## Last review

- Plan written at 0.270.2 (2026-09-24). No scheduled review has run yet.

## Decisions

John, 2026-09-24:

1. The re-read step is a rule in `AGENTS.md`: adopted.
2. Checks 1, 2, 3 and 5 are to be built as failing tests, and check 4 as an
   advisory line printed by `release:take`.
3. The scheduled review runs weekly while the docs are being rewritten, then
   monthly once they settle.
4. The README's backlog section was fixed in 4aa56f2e.
5. Outside data is re-checked on a schedule and shows its last-checked date
   (see "Outside data").
