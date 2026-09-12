# XP on Itsutsu

Ten tickets that give this site an experience ladder: points for everything a
person does here, a hundred named levels, toasts when something is earned, a
leaderboard, and a member's own XP on their own page.

Modelled on UmaKuma's system (the `umakuma` repository, `src/lib/xp/`), which
John asked for by name. `XP_DESIGN.md` is the contract — the event catalogue
with its points and the reasoning for each, the curve, the schema, the toast
seam, and the interface the hundred names must meet. **Read it in full before
starting any ticket.** If it and the code disagree, the code moved after the
plan was written; say so in the board row and follow the code.

Each ticket is written so an agent can implement it without asking: what to read
first, the files it owns, the tests, and what not to touch.

## Order

| Ticket | Builds | Needs |
|---|---|---|
| XP-01 | the design: catalogue, curve, seam, schema, this folder | nothing |
| XP-02 | the ledger: `XpEvent`, `Member.xp`, `awardXp`, the constants table, the first three events wired | XP-01 |
| XP-03 | the tour: first game of each variant, each family, and all of both | XP-02 |
| XP-04 | people: buddies, challenges, rematches, forks, courtesy, and the identity awards | XP-02 |
| XP-05 | the game's own awards: won against a person, a buddy, a revenge, a streak, a grade | XP-02 |
| XP-06 | habit: day streaks, the weekend, coming back from away, a seat claimed elsewhere | XP-02 |
| XP-07 | the toasts | XP-02 |
| XP-08 | `/xp` — the leaderboard | XP-02, the names |
| XP-09 | a member's own XP and their history | XP-02, the names |
| XP-10 | the ladder: all hundred levels, a page per level, a name beside every player | the curve, the names |
| — | the hundred level names, `src/lib/xp/levelNames.constants.ts` | XP-01's interface |

XP-03 to XP-07 can run in parallel in five worktrees once XP-02 is on `main`
and its migration has deployed. XP-08, XP-09 and XP-10 also need the names
file.

## Two things that decide whether this is any good

**The site's problem is that thirty-nine games have barely been played.** The
catalogue is pointed at that: a first game of each variant, each family, and a
bonus for all of them, come to 2,025 XP of the 3,740 available once-only — level
21 of 100 for touring the site. XP is the tour guide, not a second rating.

**Nothing may cost a query per row.** A level beside a name, a leaderboard
ranked by XP, a member's total on their own page: all of them read
`Member.xp`, which every one of those lists already fetches. This is the fault
taken off the landing page in 0.139.0, and the reason the total is denormalised
in the first migration rather than when the leaderboard is built. `XP_DESIGN.md`
says why the *level* is derived from it rather than stored beside it.

## The board rows

These are not on `/backlog` yet. File them with `pnpm task add` (see the Board
Gate in `AGENTS.md`), one per ticket, with `Plan: docs/plans/xp/…` as the first
words of every detail so the plan is found from the row. Write each row's key
into the table above once it exists.

Asked by John, 2026-09-12, verbatim in `XP_DESIGN.md`'s opening section.
