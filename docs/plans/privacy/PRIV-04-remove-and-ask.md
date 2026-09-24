# PRIV-04. Ask what we hold, and have an account removed

Board key: `ask-what-we-hold-and-have-an-account-removed`. Kind: feature.
Priority high. Needs PRIV-01.

## Why

The privacy page (PRIV-01) promises removal on request and says it is done by
hand, because nothing in the code removes a member: there is no
`prisma.member.delete` anywhere, and `OPERATOR_ACTIONS` is shut, restore,
rename. A promise kept by hand is a promise kept by whoever is awake. This
ticket makes it a door, for the operator and for the member.

## Before you start

Read `src/lib/auth/operatorLog.constants.ts`, `AdminMembers.tsx` and the
ban (`bannedAt`) path for the shape of an operator action; the `Member`
model's relations in `prisma/schema.prisma` (what cascades: buddies, ignores,
inbox, messages, applause; what does not: `Game` seats by `blackMemberId` /
`whiteMemberId`, `Player` rows by `memberId`, `XpEvent`, `OperatorAction`
by `actorMemberId`); and `src/lib/legacy/legacyPlayers.data.ts` for the kept
records, which are NOT member rows and are removed by a commit.

## Exact changes

1. **`removeMember(id, { blankSeats })`** in `src/lib/auth/removeMember.ts`,
   one transaction: delete the `Member` row (cascades take the social rows
   and messages), delete their `XpEvent` rows, set `Player.memberId` null on
   their rows, set `blackMemberId` / `whiteMemberId` null on every seat they
   held, and, when `blankSeats`, set that seat's name to `""` as well. Games
   stay: a finished game belongs to both people who played it (the privacy
   page says so). A game still in play with them on a seat is resigned by
   them first, through the same function the resign route uses.
2. **Operator**: `OPERATOR_ACTIONS.remove`, a control on the member's Admin
   row with a typed confirmation of the member's name, the `blankSeats`
   choice, and a reason, logged with the count of games touched.
3. **Member**: under `/me?view=profile`, `Remove this account`: a typed
   confirmation, the same choice about the name on old games, then
   `removeMember` and sign-out. A words-only account is removed at once; a
   Google account is removed after re-signing in (fresh `signIn` with a
   `callbackUrl` back to the confirmation).
4. **What we hold**: `/me?view=profile` gains a `What Itsutsu holds about you`
   panel, listing in plain words every column the privacy page names and
   the counts (games, messages, XP events) behind them, read in one query
   each. Not a download: a list a person can read.
5. **The privacy page**'s Keeping and removing section is rewritten to point
   at the control, and the date moves.

## Tests

- `removeMember.test.ts` against the local database: games stay, seats are
  detached, names blanked only when asked, no row of theirs remains in any
  other table (assert each relation by name, so a new relation fails it).
- Unit test that `OPERATOR_ACTIONS` gained `remove` and the log line
  renders.
- `e2e/remove-account.spec.ts`: a fresh member removes themselves; their old
  game still opens for the opponent with the name as chosen.
- `privacy.coverage.test.ts`: when `removeMember.ts` exists, the page no
  longer says "by hand".

## What not to do

- Never delete a `Game` or a `Move`. Never touch the other seat.
- Do not remove a kept record here; that is a commit to `legacyPlayers.data.ts`.
