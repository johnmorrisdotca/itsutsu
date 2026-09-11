# ITS-01. In progress becomes a claim with a lease, written conditionally

Board key: _filled in by the README_. Kind: feature. Contract:
`BOARD_RULES.md` invariants 2, 3, 4, 5. Do this one first; ITS-02, ITS-03
and ITS-04 build on its columns.

## Why

`assignedTo` is free text with no time on it, `moveItem` reads the row and
then writes it, and nothing refuses a second session moving a row the first
one is working. UmaKuma's board had the same shape and lost work to it twice:
two agents built the same feature for twenty minutes, and a session that died
holding a ticket kept it for four days. UmaKuma's answer is a holder, a
`claimedAt`, a six-hour lease, and a write whose `where` clause carries the
condition so the database decides who wins. This ticket brings that here.

## Before you start

1. Work in your own worktree off `origin/main` (AGENTS.md "One agent, one
   worktree"). Never in `/Users/john/Projects/gomoku` itself.
2. Read AGENTS.md "Board Gate", "WRITE THROUGH THE API", and "Back It Up
   Before You Migrate It". Read `src/lib/backlog/backlog.ts`,
   `backlogStore.ts`, `backlog.constants.ts`, `backlog.types.ts`,
   `src/app/api/backlog/[id]/route.ts`, `src/components/backlog/BacklogRow.tsx`,
   `e2e/backlog.spec.ts`.
3. Read UmaKuma's `src/lib/ticketClaims.ts` and `src/lib/tickets.ts`
   (`ticketMoveWhere`, `ticketMoveData`) in
   `/Users/john/Projects/umakuma-worktrees/offlist`. You are porting them.
4. `pnpm local:db:up && pnpm db:deploy`, then `pnpm test:unit` green before
   you change anything.
5. Move this row to In progress on `/backlog` with your name, or ask John to.
   (ITS-02 gives agents a CLI for this; until then the board is the
   operator's.)

## Exact changes

### 1. Schema and migration

In `prisma/schema.prisma`, `model BacklogItem`: remove `assignedTo`, add

```prisma
  /// Who holds this and since when. In progress is not a status here, it is
  /// this pair: a hold nobody has renewed inside the lease (six hours, see
  /// backlog.ts) is free again, or one crashed session takes a row out of
  /// circulation for good.
  claimedBy  String?   @db.VarChar(80)
  claimedAt  DateTime?
  /// The instant of the release that carried this, written by the release
  /// tool beside releasedIn. Null for every row finished before it existed.
  releasedAt DateTime?
```

`pnpm db:migrate --name backlog_claims_and_lease` against the **local**
database, then edit the generated SQL so the data moves before the column
goes:

```sql
ALTER TABLE "BacklogItem" ADD COLUMN "claimedBy" VARCHAR(80), ADD COLUMN "claimedAt" TIMESTAMP(3), ADD COLUMN "releasedAt" TIMESTAMP(3);
UPDATE "BacklogItem" SET "claimedBy" = "assignedTo", "claimedAt" = "movedAt"
  WHERE status = 'inProgress' AND "assignedTo" <> '';
ALTER TABLE "BacklogItem" DROP COLUMN "assignedTo";
```

Three rows are `inProgress` today. Their holds will read as stale
immediately unless `movedAt` is recent, which is correct: nobody has been
renewing them.

Production: the deploy workflow runs `prisma migrate deploy` after the
commit lands on `main` (`.github/workflows/vercel-deploy.yml`). Before you
push, take the Neon branch AGENTS.md names
(`neonctl branches create … --name before-backlog-claims-<date>`) and say so
in your reply. Never run `migrate dev` against production and never accept a
reset.

### 2. Rules, `src/lib/backlog/backlog.ts`

Add, verbatim from the contract's "Reference shapes": `LEASE_MS`,
`leaseExpired`, `heldNow`. Add

```ts
export type MoveActor = string; // trimmed, at most CLAIMED_BY_MAX
export function moveData(to: BacklogStatus, actor: string, now: Date): { status; claimedBy; claimedAt; movedAt }
export function moveWhere(id: string, from: BacklogStatus, actor: string, staleBefore: Date)
```

`moveTo` (the pure preview) returns the same claim fields as `moveData`.
`releaseStampFor` stays for now; ITS-04 replaces it.

`tally` counts `inProgress` as rows where `heldNow` is true, and adds a
`stale` count for rows with a holder past the lease. `STATUS_ORDER` and
`OPEN_STATUSES` are unchanged. `isOpen` is unchanged.

`backlog.constants.ts`: `ASSIGNED_TO_MAX` becomes `CLAIMED_BY_MAX = 80`.

### 3. Store, `src/lib/backlog/backlogStore.ts`

`moveItem(id, to, actor, now = new Date())`:

1. Read `status` only. Missing: `{ ok: false, reason: "missing" }`.
2. `from = statusFrom(row.status)`. `!canMove(from, to)`:
   `{ ok: false, reason: "illegal" }`.
3. `updateMany({ where: moveWhere(id, from, actor, staleBefore), data: moveData(to, actor, now) })`.
4. `count === 0`: re-read `claimedBy`, return
   `{ ok: false, reason: "held", heldBy }`.
5. Re-read the row with `SELECT`, return it.

`MoveOutcome` gains `{ ok: false; reason: "held"; heldBy: string }`.
Delete `assignItem`. `editItem` and `BacklogEdit` lose `assignedTo`. `SELECT`
and `Row` and `toItem` carry `claimedBy`, `claimedAt` (ISO string or null),
`releasedAt`.

### 4. API, `src/app/api/backlog/[id]/route.ts`

- `patchSchema` drops `assignedTo`.
- The actor is the operator: `me.name ?? me.email ?? "operator"`, trimmed to
  `CLAIMED_BY_MAX`. Passed to `moveItem`.
- A `held` outcome answers 409. Add `conflict(message)` to
  `src/lib/api/apiResponse.ts` beside `unprocessable`, with the message
  `Held by <name>. Ask them to release it.`

### 5. Row, `src/components/backlog/BacklogRow.tsx`

Delete the "Take it" / "Hand it on" / "Nobody" naming UI and its state. The
move select is the only control: choosing In progress is taking it. After
the pills, print the hold:

- inside the lease: `held by <claimedBy>` (`data-testid="backlog-held"`)
- past it: `stale · <claimedBy> since <day>` (`data-testid="backlog-stale"`)

Both computed with `heldNow`/`leaseExpired` and `Date.now()` at render; no
timer. A 409 from the API shows in the existing error line.

`BacklogBoard.tsx`: the In progress chip count is `tally.inProgress`
(held now). Add a `Stale · n` chip only if `stale > 0`; picking it filters to
rows with a lapsed holder.

### 6. Tests

- `backlog.test.ts`: `moveData` writes the claim on `inProgress` and clears
  it elsewhere; `moveWhere` carries the three-way `OR`; `heldNow` is false
  at six hours plus one millisecond; `tally` counts a stale row as neither
  in progress nor waiting.
- `backlog.coverage.test.ts`: `CLAIMED_BY_MAX === 80` and `LEASE_MS === 21_600_000`.
- `e2e/backlog.spec.ts`: rewrite "an item says who has it" to move a row to
  In progress and expect `backlog-held` with the operator's name; add a case
  where the API is asked to move a row held by somebody else (seed it with
  a direct PATCH as the operator, then PATCH again with a different actor
  is impossible from one session, so assert the 409 through a unit test of
  `moveItem` against the local database instead, in `backlogStore.test.ts`).
- `scripts/cleanup-backlog-litter.ts`: delete the stolen-assignee half; the
  column is gone.

## Acceptance

- [ ] `pnpm quality:check` green; `pnpm test:e2e e2e/backlog.spec.ts` green
      against the local database.
- [ ] On the local board: move a row to In progress, see `held by <you>`;
      set its `claimedAt` seven hours back through Prisma Studio, reload,
      see `stale`, and the In progress count drop by one.
- [ ] `moveItem` unit test: a row held by "A" refuses actor "B" with
      `reason: "held", heldBy: "A"`, accepts "A", accepts "B" once
      `claimedAt` is past the lease.
- [ ] Neon branch taken before the push; its name is in your reply.
- [ ] Version bumped in the landing commit per AGENTS.md (minor: a player
      does not notice this, so a patch; if ITS-04 has landed first, use its
      script instead).

## Do not

- Do not keep `assignedTo` as a fallback. No back-compat; the migration
  moves the data and the column goes.
- Do not write the claim from the page. The page sends a status; the store
  writes the claim from the actor the route knows.
- Do not add a fifth status for stale. It is a hold past its lease, derived.
