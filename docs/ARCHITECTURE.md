# Itsutsu architecture

How the site is put together, for somebody opening the code for the first time.
It describes shape rather than every rule: when a detail here and `AGENTS.md`
disagree, `AGENTS.md` is right, and this file should be fixed. For the ideas
behind the shape, read [`CORE_CONCEPTS.md`](CORE_CONCEPTS.md) first; for the
tables, [`DATA_MODEL.md`](DATA_MODEL.md).

## The big picture

Itsutsu is one Next.js 16 App Router application. Pages and API routes live
side by side under `src/app/`, the game engine and the domain logic live in
`src/lib/`, and everything persistent is in one Neon Postgres database reached
through Prisma. Vercel runs it; GitHub Actions checks, builds and deploys it.

```
 Browser ─────────────► src/proxy.ts  (the gate: session, embed token, language)
   │                         │
   │                         ▼
   │                   Next.js server functions on Vercel
   │                     ├─ pages       src/app/**/page.tsx
   │                     └─ API routes  src/app/api/**/route.ts
   │                            │
   │          ┌─────────────────┼────────────────────┬──────────────────┐
   │          ▼                 ▼                    ▼                  ▼
   │    Neon Postgres     Sumilabu              Resend             Google
   │    (Prisma)          (task board,          (email: invites,   (sign-in,
   │                       site settings)        your-turn notes)   via next-auth)
   │
   └─ in the browser: the engine, the one-screen board, and the computer
      players' thinking (a web worker)
```

Most of what makes Itsutsu unusual is on the left edge of that picture. The
engine is plain TypeScript with no React or database dependency, so it runs in
the browser as readily as on the server. That lets the site push work to the
device of the person playing: a game at one screen never touches the server
until it is filed, and a computer player's move is worked out on the waiting
player's machine. Every piece of work a browser does is work Vercel does not
bill for, and cost is a first-class constraint here (see
[Cost as a design constraint](#cost-as-a-design-constraint)).

Three services beyond the database:

- **Sumilabu** is a companion service (`api.sumilabu.com`) shared with the
  owner's other sites, UmaKuma among them. It holds the features board behind
  `/backlog` and `pnpm task`, and the site settings (who may sign up, whether
  the site is in maintenance). The clients are `src/lib/sumilabu/boardClient.ts`
  and `src/lib/site/siteStore.ts`. Everything reaches the development project
  (`itsutsu-dev`) unless it is told otherwise by name.
- **Resend** sends email, in production only and only with `RESEND_API_KEY`
  set: a request for an invite from `/join`, and a member's invitation to a
  friend. Game notices ("your move") are written but switched off
  (`NOTICES` in `src/lib/mail/mail.constants.ts`). Every send passes through
  one sender (`src/lib/mail/sendMail.ts`) and caps kept in the database
  (`EmailSendCount`): fifty a day and a thousand a month for the site, five a
  day per member. `docs/email.md` has the detail.
- **Google** proves a member's address at sign-in, through next-auth
  (`src/lib/auth/google.ts`). It proves identity only; membership is decided
  here.

## Code layout

| Path | What lives there |
| --- | --- |
| `src/proxy.ts` | The gate every request passes. Next 16's name for middleware |
| `src/app/` | Pages, layouts and route handlers |
| `src/app/api/` | The HTTP API, one `route.ts` per endpoint |
| `src/app/games/[slug]/` | A game's own pages: its front door, rules, family, standings, a board, a match |
| `src/components/` | UI by area: `board/`, `game/` (one screen), `live/` (shared games), `players/`, `xp/` and more |
| `src/lib/gomoku/` | The engine, analysis, notation, replay, the computer players' search. Pure |
| `src/lib/gomoku/rules/` | The rule modules the engine consults: lines, forbidden shapes, captures, flips, jumps, Go, Hex, openings, handicaps |
| `src/lib/history/` | Games on the server: creating, moving, ending, listing, the record |
| `src/lib/rating/` | Elo, the two pools, per-game standings, streaks, the members directory |
| `src/lib/bots/` | The computer players as members: who they are, the seats they take |
| `src/lib/xp/` | Experience points: awards, the ledger, the curve, the boards |
| `src/lib/auth/` | Sessions, members, Google, invite codes, the operator |
| `src/lib/phrase/` | The four-word credential: picking, hashing, checking |
| `src/lib/social/` | Buddies, ignores, who is here, countries, days off |
| `src/lib/legacy/` | Records kept from sites people played on before this one |
| `src/lib/i18n/` | The phrase catalogue and the Japanese dictionaries |
| `src/lib/mail/`, `src/lib/notify/` | Email: the one sender, its caps, and the events that send |
| `src/lib/sumilabu/`, `src/lib/site/`, `src/lib/backlog/` | The board and settings on Sumilabu, and the board's rules |
| `src/lib/api/` | Shared route plumbing: JSON replies, paging, rate limits |
| `prisma/` | The schema and its migrations |
| `scripts/` | Gates, release and board tooling, image builds, production runners |
| `e2e/` | Playwright specs, including the screenshot specs |
| `public/art/games/` | A screenshot and thumbnail per game, built by `pnpm screenshots:games` |

The layout is held in shape by gates rather than good intentions: no file under
`src/` over 500 lines (`pnpm loc:check`), shared types in `*.types.ts` files,
one constants module per component group, and domain values compared through
shared constants rather than string literals.

## The engine

`src/lib/gomoku/engine.ts` is the only place a rule is decided. It exports
functions like `placePiece`, `movePiece`, `twistBoard`, `passTurn`,
`isLegalMove` and `playMove`, each taking a `GameState` and returning a new
one. The rule modules under `rules/` do the specialised work and are unit
tested beside their source.

A variant is data: a row in `VARIANT_SPECS` and its copy. The engine reads the
row. Anything that asks what a particular colour may do goes through
`rulesFor(settings, stone)` in `rules/handicap.ts`, so a handicap is never
missed.

Three layers sit above the engine and only advise:

- **Analysis** (`threats.ts`, `analysis.ts`, `advantage.ts`): the warnings on
  the board, the chance-of-winning bar, the losing-move marker. It filters
  through the rules, so it never recommends a forbidden point.
- **The review** (`review.ts`): replays a finished game under the other rule
  sets and reports where they would have parted.
- **The computer players' search** (`opponent*.ts`, `searchCandidates.ts`,
  `forcedWin.ts`): chooses a legal move. It runs in a web worker in the browser
  (`botWorker.ts`) and in tests.

The engine is checked from several sides. Each rule module has its own tests.
`simulation.test.ts` plays every variant automatically, and
`simulation.checks.ts` and `simulation.scan.ts` restate the rules by hand as an
independent check, so the engine and a second reading of the rules must agree.
`variants.coverage.test.ts` fails the build for a game missing any of its
parts.

## Games on the server

`src/lib/history/` owns every game row. The pieces a newcomer meets first:

| File | Job |
| --- | --- |
| `liveGameCreate.ts` | Making a game: seats, tokens, seed, clock, open seat, offer, match |
| `liveGame.ts` | Playing a move: replay the row, check the move with the engine, write it, settle the result |
| `liveGameEndings.ts` | The other endings: resignation, a claimed timeout, calling a game off |
| `liveGameSettings.ts` | Changing a game's rules before its first stone |
| `liveGameRow.ts` | The row shape the others read, and the seat lookups (`seatForToken`) |
| `seats.ts`, `seatCookie.ts` | Which seat a request holds: a token, a claimed-seat cookie, or a member id |
| `gameHistory.ts` and friends | Listing and filtering the record, for `/history` and the API |

A move reaches the server as `POST /api/games/<id>/moves` with a seat token or
cookie. The route checks the rate limit, finds the seat, and hands off to
`appendMove`, which replays the game from its moves, asks the engine whether
the move is legal, and writes it. The unique index on `(gameId, number)` makes
a second write of the same move number fail, which is the concurrency control.
When the move ends the game, the same request settles the result, moves
the ratings (`recordResult`), updates the played tallies (`recordPlayed`) and
pays XP (`awardXp`). The other ending paths call the same three.

The other device finds out by polling. `useLiveGame` asks every fifteen seconds
while the board is visible, stops when the tab is hidden, and stops after six
quiet minutes until somebody presses, types or brings the tab back (`src/components/live/pollCadence.ts`).
There are no websockets and no push: a poll is one small read, and a board
nobody is looking at asks nothing.

## Where the gate is

`src/proxy.ts` sees every request before a route does. It is Next 16's
replacement for `middleware.ts`, and it is the one place that decides who gets
in, so a new page or endpoint is private by default rather than private only
if somebody remembers to guard it.

It lets a request through when:

- the path is one of the open ones: sign-in (`/join`, `/api/session`,
  `/api/auth`), icons, `/about`, `/learn` and their images, and the games
  catalogue and each game's rules, family and background pages;
- the request carries a valid signed session cookie; or
- the path is `/embed` or `/api/embed/*` and the request carries a valid embed
  token with the right scope.

Otherwise a page redirects to `/join` and an API route answers 401. The gate
also handles the language (a `?lang=` choice becomes a cookie), and during
maintenance it answers 503. Maintenance is an environment variable rather than
a database row, so the gate costs no query per request.

Sessions are one HMAC-signed cookie, `src/lib/auth/session.ts`, signed with
`AUTH_SECRET` (at least sixteen characters). There are two kinds: `admin` for
the operator, lasting a day, and `player` for everybody else, lasting thirty.
Without `AUTH_SECRET` nothing can be verified: in development and tests the
gate then stays open, which makes local work bearable, and in production it
answers 503 rather than open the site.

Pages ask who is reading through `currentReader()` (`src/lib/auth/reader.ts`),
which answers four facts: signed in, the address if any, the member id if any,
and whether there is an account. Routes use `currentMemberId()` and
`requireAdmin()`.

## API routes

Each route follows the same shape:

1. Rate limit (`overLimit(request, key)` from `src/lib/api/rateLimit.ts`).
   Writes are much tighter than reads, and the guessing paths (an invite code,
   the operator's sign-in, a four-word phrase) allow five tries a minute.
   The store is per instance, so limits are approximate across serverless
   instances; that is a deliberate trade against needing Redis.
2. Parse the body or query with Zod. A bad input is a 400; an unrecordable
   game is a 422 listing what was wrong.
3. Find who is asking: a seat, a member, or the operator.
4. Do the work in `src/lib/`, which returns a result or a named refusal.
5. Map the refusal to a status code and a message, and answer typed JSON.

Sorting and paging follow one convention, decided in `src/lib/api/paging.ts`:
`sort=<column>[:asc|desc]`, `limit`, and an opaque `cursor` from the previous
page. An unknown sort column is refused by name with a 400 listing what is
accepted, and ordering always ends with the id, so paging cannot hide or
repeat a row. `GET /api/games` answers `{ pagination, next, items, facets }`.

The main endpoints:

| Area | Routes |
| --- | --- |
| Games | `GET`/`POST /api/games`, `POST /api/games/live`, `GET /api/games/mine`, `GET`/`DELETE /api/games/[id]` |
| A shared game | `.../moves`, `.../settings`, `.../sit`, `.../sit-as`, `.../resign`, `.../cancel`, `.../timeout`, `.../time`, `.../reactions`, `.../applause`, `.../verdict`, `.../hide`, `.../offer/{accept,decline,withdraw}` under `/api/games/[id]` |
| Players | `/api/players`, `/api/members`, `/api/members/[id]/endings`, `/api/ladder` |
| Me | `/api/me`, `/api/me/phrase`, `/api/me/phrase/draw`, `/api/buddies`, `/api/ignores`, `/api/messages` |
| Getting in | `/api/session`, `/api/session/google`, `/api/auth/[...nextauth]`, `/api/invites` (operator), `/api/invites/mine` (a member inviting a friend), `/api/invites/[code]` |
| Operator | `/api/admin/members/[id]/{claim,phrase,phrase/draw}`, `PATCH /api/members`, `/api/site`, `/api/embed-tokens` |
| Embeds | `/api/embed/summary` |

Some writes from the operator's pages use Server Functions rather than routes
(the board, in `src/lib/backlog/backlog.actions.ts`, and asking for an invite,
in `src/app/join/askForInvite.actions.ts`).

## Embedding the board

`/embed` is a board for other people's sites, loaded in an iframe. It is a
local game: it makes no API calls, so a leaked embed token exposes a board and
nothing else. A token is HMAC-signed (it is checked on the edge, where Prisma
cannot run), carries a scope (`board`, or `data` to also read
`GET /api/embed/summary`), and opens nothing but those paths. Framing is
refused unless the host is listed in `EMBED_ALLOWED_ORIGINS`. The iframe posts
`itsutsu:ready`, `itsutsu:resize`, `itsutsu:move` and `itsutsu:result`
messages to its host. The README has the parameters and a snippet.

## Languages

The site speaks English and Japanese. Every member-facing string is a phrase
key in one catalogue (`src/lib/i18n/`), read on the server through
`currentLocale()` and on the client through the locale provider. Japanese is
kept in two dictionaries by provenance: `ja.site.constants.ts` for words the
owner has already published, and `ja.drafted.constants.ts` for machine drafts
no Japanese reader has checked. `japanese.coverage.test.ts` refuses a key in
both or neither, and `docs/japanese-review.md` is generated from the two for
review. Other locales (`es`, `zh`, `de`) are named but have no dictionary, so
they are not offered.

## Cost as a design constraint

Vercel bills for function time and Neon for database work, and the site is
free to play, so several choices exist to keep both low. They are worth
knowing before adding anything that runs often.

- **The browser does the thinking.** Computer moves and one-screen games run
  on the player's device.
- **Polling is sparse and stops.** Fifteen seconds while visible, nothing while
  hidden or idle.
- **Lists read columns, not histories.** Streaks, played counts and XP totals
  are denormalised onto rows so a page of fifty players is one query, not
  fifty. A comment beside each such column in `schema.prisma` gives the
  measurement that justified it.
- **Bulk play is local.** Bot-against-bot series run in process on a
  developer's machine against the database directly (`pnpm bots:play`), never
  through the deployed API.
- **Server functions stay small.** The deploy measures every function after
  the build and fails one over 60 MB, or more than 20% over its recorded size
  (`pnpm functions:size`, `scripts/function-sizes.baseline.json`). A disk read
  must name its folder in a literal, or the tracer packs everything it might
  reach.
- **Actions minutes count.** A push to `main` runs about eighteen runner jobs,
  so pushes are batched, and a push of only Markdown or `docs/` runs nothing.

## Testing

| Kind | Where | Run |
| --- | --- | --- |
| Unit tests | beside their source, `*.test.ts` | `pnpm test:unit` |
| Coverage gates | `*.coverage.test.ts`: read the source and fail the build when a rule is broken (every game has its parts, every count links to its games, every player table shows XP) | part of `pnpm test:unit` |
| Long runs | `*.play.test.ts`: bot series, backfills, audits. Skipped unless asked for with an environment variable | `pnpm bots:play`, `pnpm xp:backfill` and others |
| Browser | `e2e/*.spec.ts`, Playwright against a dev server and a Postgres | `pnpm test:e2e` |

The browser suite has pitfalls that produce failures looking exactly like code
bugs: a stale dev server, two runs against one database, database litter, and
a test that races hydration. `AGENTS.md` describes each one and its cure, and
it is worth reading before believing a red spec.

## How a change ships

1. **Work on a branch or worktree.** Several sessions work on this repository
   at once. Never `git stash` in a worktree (the stash is shared), and name the
   paths you stage rather than `git add -A`.
2. **Take a ticket from the board.** `pnpm task` lists what is open on the
   development board; `pnpm task:prod` is the live one. Claim a row before
   building it.
3. **Check locally.** `pnpm quality:check` runs lint, the file size gate, the
   typecheck and the unit tests. A schema change is a new migration from
   `pnpm db:migrate`.
4. **Take a version and push.** One feature is one version. `pnpm
   release:take:prod --summary "…" --done <row>` takes the next number, dates
   `CHANGELOG.md`, commits both and closes the board row. Then `pnpm
   preflight:prod` runs the release checks side by side, and the push follows,
   chained with `&&` so a red gate stops it. Several finished features are
   several releases and one push.
5. **The deploy runs itself.** A push to `main` starts
   `.github/workflows/vercel-deploy.yml`:

```
 push to main
   ├─ verify ×5 in parallel: lint · types · unit · audit · build
   ├─ e2e ×14 shards in parallel, balanced by time (the browser suite, e2e.yml)
   └─ deploy — starts once all of the above pass
        ├─ vercel pull
        ├─ prisma migrate deploy against production, then a drift check
        ├─ vercel build, then measure the server functions
        ├─ vercel deploy --prod
        └─ remove superseded deployments
```

Migrations run before the new code goes live and are written to be additive,
so the old code keeps working while the switch happens. A push cancels a
deploy still in progress, since a superseded deploy is worth nothing, which
means the last push of a session should be followed by one check of the live
version. `ci.yml` runs the same checks on pull requests only.

Before any migration or data write against production, take a Neon branch and
a dump to the DiskStation first. `AGENTS.md`, "Back It Up Before You Migrate
It", has the commands.

## Security at a glance

- Everything is closed unless `src/proxy.ts` opens it.
- Sessions are HMAC-signed cookies; a seat token is used once and moved into a
  cookie; seat pages are `noindex`.
- Invite codes, the operator's sign-in and four-word phrases are rate limited
  to five tries a minute, and every rejection answers the same way.
- Four-word phrases are hashed with scrypt, salted per row, and never returned
  by any API or written to any log.
- Every move is re-checked by the engine on the server; the browser is trusted
  only to choose a computer's move among legal ones.
- Embed tokens are narrow, scoped and separated from session cookies by a
  `kind` field, and framing is allowed only for listed hosts.
- Email is capped per day and per month in the database, so the caps survive
  cold starts.
- What the operator does to an account is recorded in `OperatorAction`, never
  including a credential.
