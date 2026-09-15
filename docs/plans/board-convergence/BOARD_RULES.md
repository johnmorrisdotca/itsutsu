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
| `detail` | `detail` | `detail` | At most 4,000 characters. |
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
| `editedBy` | none | none | The actor who last revised `title` or `detail`. Written by the service. See invariant 12. |
| `editedAt` | none | none | When they did. Null on a row never revised. |

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
   | detail | 4,000 |
   | askedBy | 60 |
   | claimedBy | 80 |
   | key | 80 |

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
    `PATCH tickets/{id}` takes `title` and `detail` under the caps in
    invariant 6, refused in `draftProblems`' own words (422), alone or with
    `status`, `priority` and `effort`. Null or empty `detail` clears it. A
    revision needs an actor, writes `editedBy = actor` and `editedAt = now`,
    and touches neither the claim nor `movedAt` (invariant 8). Carried with a
    move, it rides in the move's conditional write, so a refused move
    revises nothing; a refused revision writes no grade.

    A `done` row's words are refused, 409 `done`. Invariant 1 makes `done`
    terminal because its release stamp is a fact about a release that went
    out. The title and detail are what that release is recorded as carrying,
    and rewording them afterwards changes the record just as reopening would.
    The contract already has the answer for shipped work that needs other
    words: a new row citing the old one, the way a regression is filed. A
    stamp that never went out is unshipped first, and its words are editable
    again. A `dropped` row may be revised, since it may be reopened.

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
  if (draft.detail.length > 4000) problems.push("The detail is at most 4,000 characters.");
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
