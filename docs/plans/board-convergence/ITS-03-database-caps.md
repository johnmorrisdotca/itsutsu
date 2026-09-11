# ITS-03. The caps the API enforces are in the database too

Board key: _README_. Kind: chore. Contract: invariant 6. Needs ITS-01 (so
there is one migration path, and `claimedBy` already carries its cap).

## Why

AGENTS.md says it: "If a cap needs enforcing against something that is not
the API, it has to be a constraint in the database; anything in TypeScript
is another door rather than a lock." Eleven rows were written past the cap
by direct table writes and could not be saved from the board afterwards.
They have since been fixed by hand (zero rows over 4,000 when this was
written), and nothing stops it happening again.

## Before you start

1. Own worktree, ITS-01 merged in.
2. Re-count. If this prints anything but `0`, stop and read "Overflow" below.

   ```sql
   select key, length(title), length(detail), length("askedBy")
   from "BacklogItem"
   where length(title) > 120 or length(detail) > 4000 or length("askedBy") > 60 or length(key) > 80;
   ```

3. Claim this row (`pnpm task claim <key> --by "<you>"` once ITS-02 is in).

## Exact changes

`prisma/schema.prisma`, `model BacklogItem`:

```prisma
  key     String @unique @db.VarChar(80)
  title   String @db.VarChar(120)
  detail  String @default("") @db.VarChar(4000)
  askedBy String @default("") @db.VarChar(60)
```

`pnpm db:migrate --name backlog_caps` locally. The generated SQL is four
`ALTER COLUMN … TYPE VARCHAR(n)` lines; Postgres refuses the migration if a
row exceeds the length, which is the point.

`backlog.coverage.test.ts` gains one case that reads `prisma/schema.prisma`
as text and asserts the four `@db.VarChar(n)` values equal `KEY_MAX`,
`TITLE_MAX`, `DETAIL_MAX`, `ASKED_BY_MAX`. Then the two caps cannot drift.

## Overflow

If the count query finds rows, do this before the migration, once, and say
so in the reply:

`scripts/backlog-trim-overflow.ts`, dry run by default, `--run` to write.
For each offending row it writes the full detail to
`docs/plans/board-convergence/overflow/<key>.md` and sets `detail` to the
first 3,900 characters plus
`"\n\n[Trimmed to fit the board. Full text: docs/plans/board-convergence/overflow/<key>.md]"`.
A title or name over its cap is truncated and the original printed in the
dry run for John to read. This is a direct table write, the one AGENTS.md
forbids, and it is sanctioned exactly once here because the API cannot save
those rows at all. John says `--run`; nobody else does. Commit the overflow
files with the migration.

## Production

The deploy applies the migration. Take the Neon branch first
(`before-backlog-caps-<date>`), and name it in the reply.

## Acceptance

- [ ] Migration applied locally and by the deploy; `pnpm db:drift:check`
      exit 0.
- [ ] `POST /api/backlog` with a 4,001-character detail is 422 (already);
      a direct `prisma.backlogItem.update` with one throws (new; assert it
      in `backlogStore.test.ts` against the local database).
- [ ] Coverage test ties schema caps to the constants.
- [ ] Version bumped, patch.

## Do not

- Do not raise a cap to fit a row. Trim the row and keep its text in the
  repository.
- Do not run the trim script without John's word, and never against
  production from a worktree whose `.env` you have not read the host out of.
