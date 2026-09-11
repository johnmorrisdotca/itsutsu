# ITS-02. Agents write the board through the API: a board token and `pnpm task`

Board key: _README_. Kind: feature. Contract: invariant 5, and the reason the
whole contract exists. Needs ITS-01.

## Why

Every rule the board has lives in `POST` and `PATCH /api/backlog`, and both
require the operator's browser session. An agent cannot hold one. So on
2026-09-11 two sessions reached the table with a `PrismaClient` about forty
times, thirteen of them `open -> done` moves the rules forbid, and the
AGENTS.md answer since then has been "draft the text and hand it over". That
is a board agents cannot use. UmaKuma's agents file, claim, release and drop
from a terminal with `pnpm task`, and nobody has touched its table by hand
since. Its CLI talks to the database directly, which is its weakness; this
one talks to the API, so every write passes the same gate the page does.

Two things from the night of 2026-09-11 that make this more urgent than it
reads. First, one session became the fleet's only board writer, through a
Neon connection, because it was the only route that existed; the board then
went silent for forty minutes while that session was inside a Playwright
run, and nobody noticed until somebody asked where a decision had gone. A
single writer is a silent point of failure. Second, whatever replaces it has
to be usable by an agent mid-task, from a terminal, in one command; an API
only the operator's browser can reach has the same shape as a board only one
agent can write to.

The root cause of the raw writes was narrower than "no agent can reach the
API": until 2026-09-11 there was no route through the API or the store to
revise a row's text at all, so the only way to fix a title was the table.
`PATCH /api/backlog/[id]` now takes `title`, `detail`, `kind` and `askedBy`
through one checked door. Check what is true in the route before you start;
this plan was written the same day that door was landing.

## Before you start

1. Own worktree, ITS-01 merged and rebased in.
2. Read `src/lib/auth/admin.ts` (`isOperatorLogin`, the constant-time
   compare), `src/lib/auth/requireAdmin.ts`, both backlog routes,
   `src/lib/api/rateLimit.ts`, `.env.example`.
3. Read UmaKuma's `scripts/tasks.ts` for the command set and the exact
   output shape of `pnpm task` (the list). Match it; a reader who works both
   repositories should not have to learn two boards.
4. Read the text-edit path on `PATCH /api/backlog/[id]` (`title`, `detail`,
   `kind`, `askedBy`; landed or landing on 2026-09-11). It does not open the
   route to non-operators, which is this ticket's job, but the CLI gets an
   `edit <key> [--title …] [--detail …]` command over it, so an over-cap row
   can be brought under the cap without touching the table.
5. Claim this row (on the page, or with the CLI once step 3 below works
   locally).

## Exact changes

### 1. A board token, separate from the operator's

`.env.example` gains

```
# Lets an agent's terminal write to the features board through the API,
# with an actor name, and nothing else. Distinct from ADMIN_TOKEN so it can
# be rotated on its own and can never open a browser session.
# BOARD_TOKEN="replace_me"
```

John adds the real value to `.env` and to Vercel (`vercel env add BOARD_TOKEN production`
works with the `VERCEL_TOKEN` in `.env`; say in your reply whether you did
this or need him to).

### 2. `src/lib/backlog/boardActor.ts`

```ts
import "server-only";
export type BoardActor = { name: string; via: "session" | "token" };

/**
 * Who is writing to the board: the operator in a browser, or a terminal
 * holding the board token and naming itself. Null is 404, as now.
 */
export async function boardActor(request: Request): Promise<BoardActor | null>
```

Order: `currentAdmin()` first; if present, `{ name: me.name ?? me.email ?? "operator", via: "session" }`.
Otherwise read `Authorization: Bearer <token>` and `X-Board-Actor: <name>`.
Compare the token to `BOARD_TOKEN` with the same constant-time loop as
`isOperatorLogin` (extract it into `src/lib/auth/constantTimeEqual.ts` and
have both use it). Missing or empty `BOARD_TOKEN` means the token path is
shut. A name over `CLAIMED_BY_MAX` or empty is refused. Anything else:
null.

Both backlog routes replace `currentAdmin()` with `boardActor(request)`.
`POST` uses `actor.name` as the default `askedBy`; `PATCH` passes
`actor.name` to `moveItem`. Rate limits are unchanged; the token path counts
against the same buckets.

### 3. `scripts/tasks.ts`, run as `node --env-file=.env scripts/tasks.ts`

Self-contained: no imports from `src/` (Node's type stripping wants explicit
extensions and the script must not drag in `server-only`). `fetch` only.
Reads `BOARD_URL` (default `https://itsutsu.com`), `BOARD_TOKEN`, and
`BOARD_ACTOR` (overridden by `--by`). Every request sends
`Authorization: Bearer` and `X-Board-Actor`.

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

Rows are addressed by `key`, the citable name, not the cuid. `list` fetches
`GET /api/backlog`, resolves a key to an id client-side, and prints one line
per unfinished row in UmaKuma's shape:

```
<key padded 40>  FIX   HELD BY <name>        P:high E:small  <title>
<key padded 40>        WAITING                              <title>
<key padded 40>        STALE <name>                          <title>
```

Header line: `<n> waiting · <n> in progress · <n> stale · on <BOARD_URL>`.
Ordered: held now, then waiting by quick wins (priority, effort, moved), then
stale. A refused move prints the API's `error` and exits 1. No token: exits
2 with "BOARD_TOKEN is not set".

`package.json` gains `"task": "node --env-file=.env scripts/tasks.ts"`.

### 4. AGENTS.md

Replace the last paragraph of "WRITE THROUGH THE API" ("The honest answer
to not holding the key is to draft the text and hand it over") with the
command table above and one sentence: the CLI is the API, so every cap and
every move rule applies to it. Add: a claim cannot be taken over inside its
lease; `claim` on a held row is refused with the holder's name; a hold past
six hours is free, and the list prints it as STALE first.

## Tests

- `boardActor.test.ts` (vitest, mocking `currentAdmin` and `process.env`):
  session wins over token; right token with a name is `via: "token"`; right
  token without a name is null; wrong token is null; unset `BOARD_TOKEN`
  makes the right token null; a 200-character name is null.
- Route tests: `POST` with the token creates a row whose `askedBy` is the
  header name; `PATCH` to `inProgress` with the token writes `claimedBy` as
  the header name.
- Manual, against the local dev server with `BOARD_URL=http://localhost:6600`:
  `add`, `claim`, a second `claim --by other` refused with the name,
  `release`, `grade`, `drop`, `reopen`. Paste the transcript in the closing
  message.

## Acceptance

- [ ] `pnpm task` against production lists the board with the header line
      and the three hold states.
- [ ] A `PrismaClient` is not imported anywhere under `scripts/` except
      `mint-invite.ts`, `mint-embed-token.ts`, `bots-play-prod.mjs` and
      `cleanup-backlog-litter.ts`. (Grep it.)
- [ ] `curl -H 'Authorization: Bearer wrong' …/api/backlog` is 404.
- [ ] AGENTS.md names the CLI where it named the workaround.
- [ ] `pnpm quality:check` green; version bumped per AGENTS.md (a patch).

## Do not

- Do not reuse `ADMIN_TOKEN` for the board. It opens a session; this must
  not.
- Do not let the CLI accept `done`. That is ITS-04's release tool.
- Do not add a `GET /api/backlog/[id]`. The list is dozens of rows and the
  CLI reads it once.
