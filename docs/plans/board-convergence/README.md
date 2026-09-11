# Board convergence: Itsutsu's half

Four tickets that bring the features board up to the contract in
`BOARD_RULES.md`, which UmaKuma (the `umakuma` repository) is being brought
up to at the same time. The two boards should behave the same, and one day
live in one service the way both sites' telemetry already lives in Sumilabu.

Each plan is written so an agent can implement it without asking: what to
read first, every file that changes, the migration and production steps in
order, the tests, the acceptance list, and what not to do. Read the whole
plan and the contract before starting. If a plan and the code disagree, the
code moved after the plan was written; say so in the row and follow the
contract.

## Order

| Ticket | Plan | Needs |
|---|---|---|
| ITS-01 In progress becomes a claim with a lease, written conditionally | `ITS-01-claims-and-lease.md` | nothing |
| ITS-02 Agents write the board through the API: a board token and `pnpm task` | `ITS-02-board-token-and-cli.md` | ITS-01 |
| ITS-03 The caps the API enforces are in the database too | `ITS-03-database-caps.md` | ITS-01 |
| ITS-04 `pnpm release:take` takes the number, dates the changelog, and closes the rows | `ITS-04-release-take.md` | ITS-01, ITS-02 |

ITS-02 and ITS-03 can run in parallel in two worktrees once ITS-01 is on
`main` and its migration has deployed.

## The board rows

These four are not on `/backlog` yet, and the reason is ITS-02: the board
API takes only the operator's browser session, so no agent can file them.
John files them from `/backlog` ("Ask for something") with the text below,
or an agent does once ITS-02 has shipped. Until then the plan files are the
tickets. When a row exists, write its key into the table above.

**ITS-01** · feature · asked by John
Title: `Board convergence ITS-01: in progress becomes a claim with a lease, written conditionally`
Detail: Plan: docs/plans/board-convergence/ITS-01-claims-and-lease.md (read it in full first; the contract both boards follow is docs/plans/board-convergence/BOARD_RULES.md). Replaces assignedTo with claimedBy and claimedAt, adds releasedAt, a six-hour lease, and a conditional updateMany on every move so a held row refuses a second session with 409 and the holder's name. The migration moves the three in-progress holders before dropping the column. Neon branch before the push. Do this before ITS-02, ITS-03, ITS-04.

**ITS-02** · feature · asked by John
Title: `Board convergence ITS-02: agents write the board through the API with a board token and pnpm task`
Detail: Plan: docs/plans/board-convergence/ITS-02-board-token-and-cli.md. A BOARD_TOKEN separate from ADMIN_TOKEN, a boardActor() the two backlog routes ask instead of currentAdmin(), and scripts/tasks.ts (list, add, claim, release, drop, reopen, grade) that talks only to the API with Authorization: Bearer and X-Board-Actor. Ends the direct table writes AGENTS.md documents. Output shape matches UmaKuma's pnpm task. Needs ITS-01.

**ITS-03** · chore · asked by John
Title: `Board convergence ITS-03: the caps the API enforces are in the database too`
Detail: Plan: docs/plans/board-convergence/ITS-03-database-caps.md. @db.VarChar on key (80), title (120), detail (4000), askedBy (60), plus a coverage test that reads the schema and ties the four numbers to the constants. Re-count overflow rows first (zero when written); if any exist the trim script in the plan runs once, with John's word. Needs ITS-01.

**ITS-04** · feature · asked by John
Title: `Board convergence ITS-04: pnpm release:take takes the number, dates the changelog, and closes the rows`
Detail: Plan: docs/plans/board-convergence/ITS-04-release-take.md. One script that fetches origin/main, takes the next version, refuses a taken one, writes a dated CHANGELOG heading, bumps package.json, and marks --done rows done with releasedIn = that version and releasedAt = now through the API. done becomes the release tool's alone: the page and CLI never offer it, and a done row does not move. Dates parse on /releases. Replaces version:bump and the claim-it-at-merge rule. Needs ITS-01 and ITS-02.

## How to work one

Own worktree off `origin/main`. Move the row to In progress with your name
(or, after ITS-02, `pnpm task claim <key> --by "<you>"`). Build and test on
the local database. Bump the version in the landing commit per AGENTS.md
(after ITS-04, with `pnpm release:take`). Take the Neon branch before any
migration reaches production, and name it in your reply.

## UmaKuma's half

`/Users/john/Projects/umakuma/docs/plans/board-convergence/` (read it from a
worktree at `origin/main`; the shared checkout is often behind) holds the
same contract and four tickets UK-01 to UK-04, already on that board. The
two halves do not depend on each other. Step three, the shared service, gets
its own plan once both halves pass the gate in invariant 10.
