# ITS-04. `pnpm release:take` takes the number, writes the changelog, dates it, and closes the rows

Board key: _README_. Kind: feature. Contract: invariants 1 (done is the
release tool's), 9. Needs ITS-01 (`releasedAt`) and ITS-02 (the token).

## Why

Three separate things go wrong today, each written down in AGENTS.md:

- The number is taken by hand, and two branches took the same one in a
  night. The rule became "claim it in the merge commit", which only the
  merging session can do and which nothing checks.
- `CHANGELOG.md` has 151 releases and dates none of them. The schema comment
  on `releasedIn` says outright that nothing can be dated after the fact.
- `releasedIn` is stamped with the version *running* when a row is marked
  done, "usually the release before the one that carried the work". The
  board says "marked done in", a small imprecision said out loud.

UmaKuma's `release:take` does all three in one pass, refuses on collision,
and has shipped 611 releases that way. This is the same tool over a
changelog instead of a JSON timeline.

## Before you start

1. Own worktree, ITS-01 and ITS-02 in.
2. Read `scripts/bump-version.mjs`, `src/lib/backlog/releases.ts`,
   `releasesFile.ts`, `releases.test.ts`, `src/components/backlog/Releases.tsx`,
   the top of `CHANGELOG.md`, AGENTS.md "Every Landed Commit Bumps The
   Version", and `e2e/releases.spec.ts`.
3. Read UmaKuma's `scripts/release-take.ts` and `src/lib/releaseTake.ts`
   (`publishedVersion`, `guardVersionFree`, `PlannedEdit`, the
   compute-everything-then-write-once shape). Port the shape, not the
   codename machinery; Itsutsu has no codenames.
4. Claim this row.

## Exact changes

### 1. `scripts/release-take.ts`, run as `pnpm release:take`

```
pnpm release:take --summary "<one line a player reads>" [--summary "…"] [--patch] [--done <key>]...
```

Self-contained like `scripts/tasks.ts`: `node:child_process`, `node:fs`,
`fetch`. Steps, computed first and written only when all of them can be:

1. `git fetch origin --quiet`. Read `origin/main:package.json` version and
   the local one; published is the higher.
2. Next version: minor+1 (patch reset) by default, patch+1 with `--patch`.
3. Refuse if `CHANGELOG.md` (local or `origin/main:CHANGELOG.md`) already
   holds `## <next>`: "<next> is already taken; fetch and try again."
4. Refuse a minor with no `--summary`: a player-noticeable release says what
   it is. A patch with none writes no changelog entry, as `version:bump`
   does now.
5. Compose the entry: `## <next> — <YYYY-MM-DD>` (UTC calendar day; the site
   has no home timezone), one `- ` line per `--summary`. Insert above the
   first existing `## `.
6. `package.json`: replace `"version": "<published>"` once; refuse if the
   string is absent ("has somebody else shipped since you started?").
7. Write both files.
8. For each `--done <key>`: `PATCH /api/backlog/<id>` with
   `{ status: "done", releasedIn: "<next>", releasedAt: "<now ISO>" }`
   through the board token. A refusal prints the API's error and exits 1
   after the files are written; the files are correct either way, and the
   row can be closed by re-running with only `--done`.
9. Print: `<next> written to CHANGELOG.md and package.json. Now: pnpm preflight:prod && git fetch origin && git push origin HEAD:main`.

Delete `scripts/bump-version.mjs` and the `version:bump` script. No shim.

### 2. `done` is the release tool's

- `STATUS_MOVES.inProgress` becomes `[open, dropped]`; `STATUS_MOVES.done`
  becomes `[]`. `done` is written by one new store function:

  ```ts
  export async function finishItem(id: string, release: { version: string; at: Date }, actor: string, now = new Date()): Promise<MoveOutcome>
  ```

  Conditional like `moveItem`, from `inProgress` only, writing
  `status: done, releasedIn, releasedAt, claimedBy: null, claimedAt: null, movedAt: now`.
- `PATCH` schema: `status: "done"` is accepted only when `releasedIn`
  (semver string) and `releasedAt` (ISO) are present, and only from a
  `via: "token"` actor. The page never offers Done: the select is built from
  `movesFrom`, so removing it from the table removes it from the page.
- Delete `releaseStampFor` and every reference. Delete the
  "a row that leaves done stops claiming a release" e2e case; done does not
  leave.
- `backlog.coverage.test.ts`: `done` can be left by nothing (assert
  `STATUS_MOVES.done` is empty) and reached by nothing in the table (assert
  no entry lists it); this replaces the "every status can be reached"
  case for `done` with the contract's wording.

### 3. Dates in the changelog

`releases.ts`: `HEADING` becomes
`/^##\s+(\d+\.\d+\.\d+)(?:\s+[—-]\s+(\d{4}-\d{2}-\d{2}))?\s*$/`. `Release`
gains `date: string | null`. `Releases.tsx` prints the date after the
version when present, in the same muted mono as `running`. The changelog's
preamble is rewritten to describe the script and the dated heading; drop
the sentence about announcing the bump to the other session, since the
script's fetch-then-refuse replaces it.

`BacklogRow.tsx` `MoveStamp`: "marked done <day> in <version>" becomes
"shipped in <version>" when `releasedAt` is set, and stays as it is for old
rows with `releasedIn` but no `releasedAt`, because those were stamped the
old way and saying "shipped in" would be the lie the old wording avoided.

### 4. AGENTS.md

Rewrite "Every Landed Commit Bumps The Version" around the script: take
the number immediately before pushing, chained with `&&` so a red gate stops
the push; never on the branch when the work starts; the script refuses a
taken number, so the merge-commit rule goes. Keep the paragraph about why
(a night of fixes read as no deploy). Add the `--done` flag as the way a
row reaches done.

## Tests

- `releases.test.ts`: a dated heading parses with its date; an undated one
  parses with `null`; a heading with a stray word after the version is not
  a release.
- `backlog.test.ts`: `canMove("inProgress", "done")` is false;
  `canMove("done", x)` is false for every x.
- `backlogStore.test.ts` (local database): `finishItem` from `open` is
  illegal; from `inProgress` held by another actor is `held`; from
  `inProgress` held by the actor writes the two release columns and clears
  the claim.
- The script: `release-take.test.ts` over a pure `planRelease({ published, changelog, step, summaries })`
  returning the two file contents or a refusal. Cases: minor, patch with
  and without summary, taken version, missing version string.

## Acceptance

- [ ] Running the script in a worktree with a fake `origin/main` ahead
      refuses; against the real one writes both files and, with `--done`,
      closes a row you claimed for the test, then `git checkout` both files
      and reopen the row (you did not push).
- [ ] `/releases` shows dates on new entries and none on old ones.
- [ ] The board's move select never lists Done.
- [ ] `pnpm quality:check` green, e2e `backlog` and `releases` green.
- [ ] This ticket's own release is taken with the script:
      `pnpm release:take --summary "…" --done <this key>`.

## Do not

- Do not backfill dates onto the 151 undated releases. They are not
  knowable; the schema comment explains why, and a guessed date is worse
  than none.
- Do not keep `version:bump` "for patches". One tool.
- Do not let the page or the CLI send `done`. Only the release tool has the
  version to stamp.
