# The board contract

One set of rules that both boards satisfy: UmaKuma's `Ticket` (the `pnpm task`
board, `/admin/releases`) and Itsutsu's `BacklogItem` (`/backlog`). This file
is identical in both repositories. If you change it in one, change it in the
other in the same pass.

It is the first of three steps. First both boards follow one contract. Then the
two schemas match column for column. Only then does the storage move into one
service, the way Sumilabu already takes both sites' telemetry under a project
key. Starting with the website would freeze two vocabularies into one schema.

## Vocabulary

The contract speaks in canonical names. Each repository keeps the values it
already stores, because a Postgres enum member cannot be renamed under rows
that hold it, and maps at the edge (`statusFrom` in Itsutsu, `toTicket` in
UmaKuma).

| Canonical | UmaKuma stores | Itsutsu stores | Meaning |
|---|---|---|---|
| `open` | `open` (legacy `filed` reads as open) | `open` (legacy `proposed`, `planned`) | Asked for. Nobody on it. |
| `inProgress` | `in_progress` | `inProgress` (legacy `building`) | Somebody holds it. The claim says who. |
| `done` | `shipped` | `done` | In a release. The release stamp says which. |
| `dropped` | `declined` | `dropped` | Answered no. Kept so it is not asked twice. |

| Canonical kind | UmaKuma stores | Itsutsu stores |
|---|---|---|
| `feature` | `feature` | `feature` |
| `fix` | `bug` | `fix` |
| `chore` | `chore` (new) | `chore` |

Priority is `high`, `normal`, `low`. Effort is `small`, `medium`, `large`.
Both are null until somebody grades the row. A default of `normal` would be a
judgement nobody made, written on every row.

## Columns

Every row has these. The middle columns give each repository's name for them.

| Canonical | UmaKuma | Itsutsu | Notes |
|---|---|---|---|
| `id` | `id` (cuid) | `id` (cuid) | UmaKuma cites the id. Every write addresses the id. |
| `key` | none | `key` (kebab) | Itsutsu's citable name. Optional, unique per project, never changed. See invariant 11. |
| `title` | `title` | `title` | 8 to 120 characters. |
| `detail` | `detail` | `detail` | At most 16,000 characters. |
| `kind` | `kind` | `kind` | See table above. |
| `area` | `area` | none | Per project. Itsutsu has no areas and needs none. |
| `status` | `status` | `status` | See table above. |
| `priority` | `priority` | `priority` | Null until graded. |
| `effort` | `effort` | `effort` | Null until graded. |
| `askedBy` | `requestedBy` | `askedBy` | Free text, at most 60 characters. |
| `claimedBy` | `claimedBy` | `claimedBy` | Free text, at most 80 characters. Null when nobody holds it. |
| `claimedAt` | `claimedAt` | `claimedAt` | When the hold was written. |
| `createdAt` | `createdAt` | `createdAt` | |
| `movedAt` | `movedAt` | `movedAt` | Changes only on a status move. |
| `releasedIn` | via `filedAs` (the timeline entry carries `version`) | `releasedIn` | The version that carried the work. Written by the release tool only. |
| `releasedAt` | via `filedAs` (entry's `releasedAt`) | `releasedAt` | The release instant. Written by the release tool only. |
| `editedBy` | none | none | The actor who last revised `title`, `detail`, `area`, `askedBy` or `kind`. Written by the service. See invariant 12. |
| `editedAt` | none | none | When they did. Null on a row never revised. |
| `parentId` | none | none | The ticket this one sits under, in the same project, or null. Set or cleared by `PATCH`. See invariant 17. |

## Invariants

Numbered so a ticket and a test can cite them.

1. **Moves.** The only moves are these. `canMove(from, to)` answers from this
   table and nothing else does.

   | From | May go to |
   |---|---|
   | `open` | `inProgress`, `dropped` |
   | `inProgress` | `open`, `dropped`, and `done` **by the release tool only** |
   | `done` | nowhere |
   | `dropped` | `open` |

   A `done` row does not move. Its release stamp is a fact about a release
   that went out, and reopening it would rewrite that. The one exception is
   a stamp that never went out: the release tool marks the row before the
   push, so a chain stopped in between leaves `done` under a version main
   never saw, and `reopen` allows exactly that case by asking `origin/main`
   whether the stamped entry is there. A regression is a new
   `fix` row whose detail cites the old one. The API and the CLI never offer
   `done` as a destination; the release tool writes it together with the
   version bump.

2. **In progress is a claim.** A row is `inProgress` if and only if
   `claimedBy` is set and the hold is inside the lease. A move to
   `inProgress` writes `claimedBy = actor` and `claimedAt = now`. A move to
   anywhere else clears both. No writer sets `status` without also writing
   the claim columns the same way.

3. **The lease is six hours.** `LEASE_MS = 6 * 60 * 60 * 1000`. A row is
   `heldNow` when `claimedBy` is set and `now - claimedAt <= LEASE_MS`. Every
   count of "in progress" and every "held by" label reads `heldNow`, never
   the status column alone. A lapsed hold is shown as stale, not as waiting:
   somebody started it, and a reader should know that before starting again.

4. **Every move is conditional.** A write that changes status or claim is an
   `updateMany` whose `where` carries the row id, the status the move was
   planned from, and the claim condition below. `count === 0` means the row
   was re-read to say why: missing, illegal from where it now stands, or held
   by somebody else. Never read-then-write.

   ```ts
   // The condition every moving write carries.
   where: {
     id,
     status: from,
     OR: [{ claimedBy: null }, { claimedBy: actor }, { claimedAt: { lt: staleBefore } }],
   }
   // staleBefore = new Date(now.getTime() - LEASE_MS)
   ```

5. **Every writer has an actor.** The CLI takes `--by "<who>"` on every
   command that moves or claims. The API takes the operator's session, or a
   board token with an actor header. There is no anonymous move.

6. **Caps are in two places.** `draftProblems()` refuses at the form and at
   the route, in words a person can act on; `@db.VarChar` refuses at the
   database, because a cap that lives only in TypeScript is another door.
   Note what the TypeScript cap does not do: it bites on a create and on any
   write that carries `detail`, and not on a status-only move. So a row
   written past the cap by a direct table write can be moved for ever and
   edited never. That is the state Itsutsu's overflow rows were in, and the
   reason the database cap is not optional.

   | Field | Cap |
   |---|---|
   | title | 8 to 120 |
   | detail | 16,000 (4,000 until 2026-11-08, SUMILABU-18) |
   | askedBy | 60 |
   | claimedBy | 80 |
   | key | 80 |
   | area | 80, checked in code only - the column carries no `@db.VarChar` |

   Only a ticket's detail moved. A setting's value, a report's body and a
   report's admin note stay at 4,000, and a report filed as a ticket still
   carries at most 4,000 characters of detail (`REPORT_LIMITS.ticketDetail`).

7. **Quick wins order.** Priority descending (`high`, `normal`, `low`, then
   ungraded), then effort ascending (`small`, `medium`, `large`, then
   ungraded), then `movedAt` newest first. An ungraded row sorts last on both
   axes rather than in the middle.

   ```ts
   const PRIORITY_ORDER = ["high", "normal", "low"] as const;
   const EFFORT_ORDER = ["small", "medium", "large"] as const;
   function rank<T extends string>(order: readonly T[], value: T | null): number {
     return value === null ? order.length : order.indexOf(value);
   }
   export function byQuickWin(a: Row, b: Row): number {
     return (
       rank(PRIORITY_ORDER, a.priority) - rank(PRIORITY_ORDER, b.priority) ||
       rank(EFFORT_ORDER, a.effort) - rank(EFFORT_ORDER, b.effort) ||
       b.movedAt.localeCompare(a.movedAt)
     );
   }
   ```

8. **`movedAt` moves with the status.** Grading a row, revising its title or
   detail, or renewing a claim does not touch it.

9. **The release tool writes `done`.** In one pass, refusing on any collision,
   it takes the next version, writes the repository's own release record (the
   timeline JSON in UmaKuma, `CHANGELOG.md` in Itsutsu), bumps the version
   files, and marks the rows it shipped `done` with `releasedIn = that
   version` and `releasedAt = now`. Never the version that happened to be
   running when somebody pressed a button.

10. **A board gate runs in the unit tests.** Every status can be left, except
    `done`, which the test asserts is terminal. Every status except `done` can
    be reached by a move; `done` is reached by the release tool, and the test
    asserts the API's move schema excludes it. Every status, kind, priority
    and effort has a label. The caps in code equal the numbers in this file.

11. **A key is a citable name, written once.** `key` is optional. When set it
    is a kebab slug, `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 80 characters, and
    unique within a project: a unique index on `(projectKey, key)`, under
    which any number of rows have no key and two projects may use the same
    one. It is written by `POST tickets` or `POST tickets/import` and never
    changed after, because by the time anybody wants another name the first
    one is in commit messages and notes. Existing rows have a null key.

    - A create naming a key another ticket in the project holds is 409
      `key_taken`, with that ticket's id as `ticketId`. The unique index
      decides, not a read before the write.
    - Import keeps keys. A row whose key belongs to a different ticket in the
      project, two rows in one import sharing a key, and a row that would
      change a key already stored each refuse the whole import, 422, with a
      problem naming the row in the same `problems` list as an id owned by
      another project. A row that omits its key keeps the stored one.
    - `GET tickets?key=<key>` answers as `GET tickets/{id}` does:
      `{ ok: true, ticket }`, or 404 `missing`. A malformed key is 400
      `invalid_key`; a key beside `status` or `unfinished` is 400
      `key_with_filter`, since "not unfinished" and "nobody holds it" would
      otherwise be the same 404.
    - Every write addresses the id, and a client resolves a key to an id
      first. `tickets/{id}` never takes a key in the path, because a cuid can
      look like a slug. `PATCH tickets/{id}` refuses a body naming `key`,
      400 `key_immutable`, rather than dropping it as an unknown field.

12. **A ticket's words are revised by `PATCH`, and not once it is done.**
    `PATCH tickets/{id}` takes `title`, `detail`, `area`, `askedBy` and `kind`
    under the caps in invariant 6, refused in `textProblems`' own words
    (422), alone or with `status`, `priority` and `effort`. Null or empty
    `detail`, `area` or `askedBy` clears it; `kind` is checked by the same
    enum a create's `kind` is. A revision needs an actor, writes
    `editedBy = actor` and `editedAt = now`, and touches neither the claim
    nor `movedAt` (invariant 8). Carried with a move, it rides in the move's
    conditional write, so a refused move revises nothing; a refused revision
    writes no grade. `POST tickets/bulk` takes an array of these same bodies,
    each addressed by its own `id`; see "Bulk patching" below.

    A `done` row's words are refused, 409 `done`. Invariant 1 makes `done`
    terminal because its release stamp is a fact about a release that went
    out. The title, detail, area, asker and kind are what that release is
    recorded as carrying, and rewording them afterwards changes the record
    just as reopening would. The contract already has the answer for shipped
    work that needs other words: a new row citing the old one, the way a
    regression is filed. A stamp that never went out is unshipped first, and
    its words are editable again. A `dropped` row may be revised, since it
    may be reopened.

13. **A `done` row missing its stamp is backfilled, never re-shipped.** A row
    can reach `done` with no `releasedIn` - a ticket closed by hand before
    release stamps existed - and `ship` cannot help it: invariant 9 only
    ships from `open` or `inProgress`, and shipping the same work twice would
    write a second, wrong version over the first. `POST
    tickets/{id}/stamp` writes `releasedIn`, `releasedEntry` and `releasedAt`
    onto a `done` row and nothing else: `status`, `claimedBy` and `movedAt`
    stay as they are, because this records a fact about a release that
    already went out rather than declaring a new one (unlike `shipData`,
    `stampData` carries no `status` or `movedAt`). It refuses 409 `notDone`
    off any row that is not `done`, and 409 `alreadyStamped` rather than
    overwrite a `releasedIn` that is already there - a stamp is written once,
    since a wrong version recorded twice cannot be told apart from a right
    one afterwards. It takes the same actor and `X-Board-Actor` handling as
    every other write (invariant 5), and the same `version`/`releasedAt`
    validation as `ship`, except `releasedAt` is required: a backfill without
    a real date would write today's onto a row that shipped months ago.

14. **A ticket has a short id, and keeps its cuid.** Every ticket carries
    `seq`, its number in its project, and the API returns `shortId`, the
    project's prefix and that number: `SPX-142`. The cuid stays the `id`,
    forever: it is in commit messages, docs and memory notes, and no route
    stops taking it. Both fields are additive; a client that has never heard
    of them keeps working.

    - **Prefix.** The project key in capitals (`itsutsu` is `ITSUTSU-3`),
      unless `TICKET_PREFIXES` in `rules.ts` names another: `spx-stats` is
      `SPX`. The prefix is worked out, not stored, so it is never a second
      thing to keep in step; named prefixes are unit-tested to differ from
      one another and from every other named project's default.
    - **Numbers** start at 1 per project, in creation order, and are never
      reused or changed: not for a `dropped` ticket, and not for a deleted
      newest one, because `BoardTicketCounter` holds the last number used
      rather than reading `max(seq)`. A unique index on `(projectKey, seq)`
      is the second wall. Taking a number locks the project's counter row
      inside the create's own transaction, so two creates cannot draw the
      same one, and a refused create (a taken key) gives its number back.
    - **Every route that takes a ticket id** (`tickets/{id}` and its `ship`,
      `stamp`, `unship` and `images` routes, and each `id` in `tickets/bulk`)
      takes the short id in either case (`SPX-142`, `spx-142`) or the cuid.
      A short id is read only when its prefix is the path's own project and
      its number is one to nine digits with no leading zero. A number with
      another project's prefix names nothing here: 404 `missing`, never a
      lookup in the wrong project. Anything else, including a client's own
      imported id that happens to look like one, is an id as it always was.
      `tickets/{id}` still never takes a `key` (invariant 11).
    - **Backfill.** Rows that predate the column have a null `seq`. The first
      time any board route lists, reads or creates in a project, or
      resolves a short id there, every unnumbered row is numbered in
      `createdAt` order with the id as the tie-break, ahead of anything new,
      in one transaction. It is idempotent (a numbered row is never touched,
      `updatedAt` stays), so a rerun, or two requests racing, number
      nothing twice. `import` numbers the rows it brings over the same way.
      `prisma/manual-migrations/20261019_board_ticket_short_ids.sql` holds
      the schema and the same numbering as SQL, for a person who wants to
      run it once first.
    - **Reports.** A ticket a report is filed into is numbered like any
      other.

15. **Every change to a title or detail is kept.** A `PATCH` (or a `bulk`
    row) that changes `title` or `detail` writes one `BoardTicketEdit` row for
    each of the two that differs from what was stored: the ticket, the field,
    the old text, the new text (a detail cleared to nothing is a null),
    `editedBy` and the time. The rows are written in the same transaction as
    the change, after the row is locked and read, so a revision that does not
    land leaves no row, a row that cannot be written takes the revision with
    it, and two revisions at once each record the words they replaced. A grade,
    a move without words, words equal to what is stored, and a refused write
    (`done`, a hold, a cap) write none. `GET tickets/{id}/history` answers
    `{ ok: true, edits: [{ id, field, oldValue, newValue, editedBy, editedAt }] }`,
    oldest first, 404 `missing` for a ticket not in the project, with the
    board token like every read and an `ETag` like the ticket's own. History
    goes with its ticket by the foreign key. Nothing else about a revision
    changes: caps (invariant 6), actor (invariant 5), `done` frozen
    (invariant 12) and every status, claim and release column are as before.

16. **A ticket takes notes, which are appended and never changed.**
    `POST tickets/{id}/notes` takes `{ body }` and an actor (invariant 5) and
    answers 201 `{ ok: true, note: { id, ticketId, body, by, createdAt } }`;
    `GET tickets/{id}/notes` answers `{ ok: true, notes: [...] }`, oldest
    first, with an `ETag`. A note has at least one character that is not a
    space and at most 16,000 (`TICKET_LIMITS.note`, and `@db.VarChar(16000)`
    on `BoardTicketNote.body`, for the reason in invariant 6); it is stored
    trimmed, 422 in words otherwise, 400 `invalid_payload` past four times the
    cap. `by` is the actor. There is no route to edit or delete a note.

    A note is allowed on a ticket in any status, `done` included. Invariant 12
    freezes a done row's words because they are what the release is recorded
    as carrying; a note adds beside them and rewrites nothing, and the row's
    status, stamp, `editedBy` and `movedAt` are untouched. Correcting what a
    shipped ticket said is a note, or a new row that cites it. Adding a note
    renews the board's version (see "Reading cheaply"). Notes go with their
    ticket by the foreign key.

17. **A ticket may sit under one parent in its project.** `parentId` is the
    id of another ticket of the same project, or null. `PATCH tickets/{id}`
    (and a `bulk` row) sets it with a short id or a cuid, or clears it with
    `null`; the ticket read then names its `parent`, its `children` and its
    `related` tickets as short ids, and every ticket in a list or a read
    carries `parentId`, the cuid.

    - **Same project, no loops.** A parent that is not a ticket of this
      project (another project's included, by cuid or by its short id) or
      that nobody holds is 422 `The parent must be a ticket in this project.`
      A parent that is the ticket, or any ticket below it, is 422 too, in
      words that say which. The check runs after the project's lock is taken
      and in the same transaction as the write, so two requests that would
      each close a loop with the other cannot both land: one is refused.
    - **A parent change on a `done` row is refused, 409 `done`**, set or
      cleared, whatever it names, for invariant 12's reason: `done` is a fact
      about a release. A ticket may be put under a `done` parent.
    - **It is not a revision of words.** It needs an actor (invariant 5) and
      rides in the move's or the revision's own conditional write, so a
      refused move or word revises no parent and a refused parent moves and
      revises nothing; but it writes no `editedBy`, no `editedAt`, no
      `movedAt` and no history row.
    - A deleted parent leaves its children without one (`ON DELETE SET
      NULL`); nothing in the API deletes a ticket.

18. **Two tickets may be related, and it reads both ways.** `POST
    tickets/{id}/links` takes `{ otherId }` (a short id or a cuid) and an
    actor and answers `{ ok: true, created, related }`, 201 when the link is
    new and 200 when the pair was already linked; `DELETE
    tickets/{id}/links/{otherId}` removes it and answers `{ ok: true,
    removed, related }`, 200 even when the pair was not linked, as deleting a
    setting that is not there is. `related` is the ticket's linked tickets as
    short ids, in the order of their numbers.

    - **One row for the pair**, the lower id first (`BoardTicketLink`,
      unique on `(lowId, highId)`), so a link added from either end is the
      same link and is read from both.
    - **Same project only.** A ticket that is itself, not in this project
      (another project's included) or nobody holds is 422; the ticket in the
      path missing is 404.
    - **Allowed on a `done` row**, adding and removing: a link is a pointer
      beside the release record, and rewrites none of the words invariant 12
      freezes. Links go with either ticket by the foreign key.
    - Adding or removing a link renews the board's version (see "Reading
      cheaply"), so the ticket read of either end is never answered 304 with
      the old `related`. Repeating a link that exists, or removing one that
      does not, changes nothing and renews nothing.

## Reference shapes

The lease and claim rules, as UmaKuma has them in `src/lib/ticketClaims.ts`.
Itsutsu copies these; UmaKuma keeps them.

```ts
export const LEASE_MS = 6 * 60 * 60 * 1000;

export function leaseExpired(claimedAt: Date | string | null | undefined, nowMs = Date.now()): boolean {
  if (!claimedAt) return true;
  const held = claimedAt instanceof Date ? claimedAt.getTime() : Date.parse(claimedAt);
  return !Number.isFinite(held) || nowMs - held > LEASE_MS;
}

export function heldNow(row: { claimedBy: string | null; claimedAt?: Date | string | null }, nowMs = Date.now()): boolean {
  return typeof row.claimedBy === "string" && row.claimedBy.trim().length > 0 && !leaseExpired(row.claimedAt ?? null, nowMs);
}

/** What a move writes. Never the status alone. */
export function moveData(to: CanonicalStatus, actor: string, now: Date) {
  if (to === "inProgress") return { status: to, claimedBy: actor, claimedAt: now, movedAt: now };
  return { status: to, claimedBy: null, claimedAt: null, movedAt: now };
}
```

The draft gate, as Itsutsu has it in `src/lib/backlog/backlog.ts`. UmaKuma
copies this; Itsutsu keeps it.

```ts
export function draftProblems(draft: { title: string; detail: string; askedBy: string }): string[] {
  const problems: string[] = [];
  const title = draft.title.trim();
  if (title.length < 8) problems.push("Say what is wanted in at least 8 characters.");
  if (title.length > 120) problems.push("A title is at most 120 characters; the rest belongs in the detail.");
  if (draft.detail.length > 16000) problems.push("The detail is at most 16,000 characters.");
  if (draft.askedBy.trim().length > 60) problems.push("A name is at most 60 characters.");
  return problems;
}
```

## Decisions John can veto

- `done` is terminal. Itsutsu loses its `done -> inProgress` move. The
  alternative was UmaKuma gaining a way to unship, which would let the release
  tool number the same work twice.
- Stored values stay as they are. Nobody renames a Postgres enum for spelling.
- Itsutsu's `key` column is not added to UmaKuma in this pass. The service
  carries it as an optional column, and UmaKuma's rows leave it null.
- A `done` row's title and detail are frozen with its stamp (invariant 12).
  The alternative was letting a shipped row be reworded, which Itsutsu's own
  board allowed before the move to the service.
- Parents and related links stay inside one project (invariants 17, 18).
  The alternative was links across projects (spx-stats to modules). A board
  token reaches exactly one project (see "Tokens and projects"), so a link
  to another project's ticket would have to be read, checked and shown with
  a token that is not that project's. A cross-project reference stays a
  short id written in a ticket's detail or a note.
- A `done` row takes notes (invariant 16). John agreed 2026-11-08: a note
  adds without rewriting the release record. The alternative was refusing
  notes on `done` as words are, which would leave a shipped ticket no place
  for what is learned after the release.

## Tokens and projects

Two token maps on the service, each `{ "<projectKey>": "<token>" }`:
`BOARD_TOKENS_JSON` for the ticket routes and `SETTINGS_TOKENS_JSON` for the
settings routes. Neither accepts the other's token. The board token is in
every agent's worktree; the settings token is only in a site's production
deployment, because a setting decides who may sign up and a key every
checkout holds is not the key for that.

Each site has two projects: its real one (`umakuma`, `itsutsu`) and a
`<key>-dev` one (`umakuma-dev`, `itsutsu-dev`) with its own entry in both
maps and its own rows, for local and test runs. A test never writes to the
real board or its settings.

Import (`POST tickets/import`) upserts by id and keeps dates, and refuses the
whole batch when an id already belongs to another project - ids are global,
and an upsert would otherwise move that row across.

### One project's client filing a ticket in another project

There is no token that writes to more than the one project it was issued
for, and no route that accepts one project's token on another project's
path. A client that wants to write into another project's board (UmaKuma
filing an Itsutsu ticket, say) is handed that project's own board token out
of band, the same way its own token is, and calls `tickets` on that
project's path with it. Nothing in the service changes for this; it is the
existing per-project token model, used once more.

Widening this instead - a token that could name which project it acts on, or
a caller identity trusted across every project - was considered and
rejected. `authorizeBoard` is a lookup of one presented token against one
project's expected token (`auth.ts`); the whole reason the two token maps
are kept apart from each other (see above) and from `PROJECT_TOKENS_JSON` is
that a leaked token costs exactly one project's board, never more than one.
A caller that could act as any project on request would make every worktree
holding a board token a way to write to every other project's board, which
is a strictly larger blast radius for the same leak. If cross-project
filing turns out to want more than "hand over another token" - a per-token
allowlist of which other projects it may also write to, say - that is a new
piece of the auth model and its own pass, not a default a ticket route
should carry quietly.

What a client does need, to make use of a token it is handed: a way to learn
that `itsutsu` is a real project key before it holds a token for it.
`GET /api/v1/projects`, authorized by *any* one configured board token (not
necessarily for the project it is asking about), answers with the list of
project keys - names only, never tokens, and granting no write anywhere by
itself. `boardProjectKeys` in `auth.ts` is the same token map `tokenFor`
already reads, listed instead of looked up.

### Bulk patching

`POST tickets/bulk` takes `{ updates: [...] }`, up to 100 entries, each the
same body a single `PATCH tickets/{id}` takes plus its own `id`. Every entry
runs through the same conditional write invariant 4 describes, so it is not
one transaction: a hold taken on one row between two entries of a batch
refuses only that row, and the response is a `results` array of per-id
outcomes (`{ id, ok: true, ticket }` or `{ id, ok: false, error, heldBy? }`)
rather than one status for the whole call. An actor is required exactly when
some entry in the batch moves or revises words (invariant 5); a batch that
only grades needs nobody named. A `key` on any entry is refused, 400
`key_immutable`, the same as a single PATCH (invariant 11). `patchTicket` in
`server.ts` is the one function behind both routes, so the two never drift.

### Reading cheaply

Every `200` of `GET tickets` (any filter, or `?key=`), `GET tickets/{id}`,
`GET tickets/{id}/notes` and `GET tickets/{id}/history` carries an `ETag`; a client that sends it back as `If-None-Match` gets `304`
with no body while nothing on that board has changed, and the service
answers it without a database query (SUMILABU-15). The tag is worked out
from the board's version, which every write to that board (a create, a move,
a revision, a grade, a parent, a link or an unlink, a ship, a stamp, an
unship, an import, a report filed as a ticket, a note) renews, and from the clock, so a hold whose lease runs out
(invariant 3) changes it with no write. A tag is opaque: compare it, never
parse it. It names no caller and no token, and the answers are
`Cache-Control: private, no-cache`, so no shared cache keeps one. A client
should keep its last answer and its tag per board and per query, ask with
the tag, and never poll: a `304` is cheap, not free (it is still a call).
A client that needs one ticket by its short id asks `GET tickets/{shortId}`
rather than listing the board to find it.

The version is the board's, not the read's, on purpose: any write that a
cached read could show clears it, so no read can be answered `304` after the
thing it shows changed. A new table that a read shows is covered by calling
`forgetBoard` after its writes, which is a rule for its writer, not for its
reader. A write that changed nothing (a refused note, an unchanged revision
that wrote no row) leaves the version alone.

### Ticket images

A ticket may carry up to **four** screenshots, so a request that arrived as a
picture keeps its picture. `POST tickets/{id}/images` attaches one:
`{ "image": "<base64>" }`, plain base64 with no `data:` prefix, as a report's
screenshot is sent (`REPORTS_CONTRACT.md`, "Screenshots"). It is a write and
names its actor (invariant 5), and answers 201 `{ image }` - the image's
`id`, `ticketId`, `contentType`, `byteSize`, `addedBy` and `createdAt`, never
its bytes. `GET tickets/{id}/images` lists those, oldest first;
`GET tickets/{id}/images/{imageId}` is the bytes, with the stored
`Content-Type`, `nosniff` and `Cache-Control: private, no-store`. Every one
takes the project's board token; none is public; an image is found by its
id, its ticket and its project together, so another project's token gets 404.

The bytes are stored in this service's Postgres (`BoardTicketImage`), on the
free plan every project shares, so the limits are storage decisions:

| Rule | Refusal |
|---|---|
| JPEG, PNG or WebP, read from the first bytes | 422 `An image must be a JPEG, PNG or WebP file.` |
| At most 512 KB (524,288 bytes) decoded | 422 in words; a body over twice that is 400 `invalid_payload` |
| At most four images a ticket | 422 `A ticket holds at most 4 images.` |
| At most 50 MB of ticket images a project | 422 in words |
| Not on a `done` ticket: its pictures are part of the words invariant 12 freezes | 409 `done` |

A client shrinks the image before sending it - WebP or JPEG, about 1600px
wide - so a screenshot is 100-250 KB, not the cap. **A ticket done or dropped
for 30 days loses its images**, deleted the next time anybody in the project
attaches one: work a person started, never a timer. Deleting a ticket
deletes its images by the foreign key. Images are not part of a ticket's
view or a list, so neither grows by a byte.

## Settings

A project's settings are `key -> value`, both strings: key matches
`[a-z0-9_.-]{1,80}`, value is at most 4,000 characters, structure is the
client's own JSON inside the value. `GET settings` returns every row as one
object a client caches whole, plus `entries` with `setBy` and `updatedAt`.
`PUT settings/{key}` writes one and records the actor as `setBy`.
`DELETE settings/{key}` removes the row, which is how a client goes back to
its built-in default: "no row" is the one representation of "unset", never
an empty string. Deleting what is not there is not an error.

## Out of scope for these tickets

- The shared service (step three). It gets its own plan once both boards pass
  the gate in invariant 10 and the schemas match.
- Moving either public release page to read from the service. The record that
  must land in the same commit as the code stays in each repository.
