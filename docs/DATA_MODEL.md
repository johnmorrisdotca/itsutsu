# Data Model Reference

Every table in `prisma/schema.prisma`, grouped by what it is for, with what
each one holds and the rules that go with it. It is a map, not a copy: the
schema file itself carries long comments beside most columns explaining why
they exist, often with the measurement that justified them, and those comments
are the place to read before changing a column.

Checked against the schema on 2026-09-24 (twenty models, six enums, 62
migrations).

## Contents

- [Before you change the schema](#before-you-change-the-schema)
- [Conventions that run through the schema](#conventions-that-run-through-the-schema)
- [Games](#games): Game, Move, Reaction, Applause, TimeGift
- [People](#people): Member, Player, PlayerVariantRating
- [Experience points](#experience-points): XpEvent
- [Social](#social): Buddy, Ignore, DirectMessage, InboxItem
- [Getting in](#getting-in): InviteCode
- [Operations](#operations): OperatorAction, EmailSendCount
- [Tables nothing reads any more](#tables-nothing-reads-any-more)
- [Enums](#enums)
- [Known oddities in the schema file](#known-oddities-in-the-schema-file)

```
                 ┌──────────────┐
                 │    Member    │◄──── Buddy, Ignore, DirectMessage,
                 │  (opaque id) │      InboxItem, Applause   (foreign keys)
                 └──────┬───────┘
                        │ memberId (no foreign key)
          ┌─────────────┼──────────────────┬───────────────────┐
          ▼             ▼                  ▼                   ▼
   Game.blackMemberId  Player          PlayerVariantRating   XpEvent
   Game.whiteMemberId  (folded name)   (folded name + game)  (the ledger)
          │
          ▼
        Game ──► Move, Reaction, Applause, TimeGift   (cascade on delete)
```

## Before you change the schema

This repository uses Prisma migrations. They live in `prisma/migrations/`, one
folder per change, and the deploy applies them to production with `prisma
migrate deploy` before the new code goes live.

- **Make a migration with `pnpm db:migrate`** against your local database
  (`pnpm local:db:up` starts one). Commit the migration folder with the schema
  change. Never edit a migration that has already shipped.
- **Write migrations that the old code survives.** The migration runs before
  the new build is live, so for a few minutes the old code reads the new
  schema. Add columns with defaults, keep old enum values readable, and remove
  things in a later release once nothing reads them. `BacklogStatus` carries
  three retired values for exactly this reason.
- **Back up production first.** Take a Neon branch and a dump to the
  DiskStation before any migration or data write. `AGENTS.md`, "Back It Up
  Before You Migrate It", has the commands.
- **If `prisma migrate dev` offers to reset a shared database, say no.** It
  usually means a migration is on a branch that has not merged yet.
- **`pnpm db:drift:check`** compares the schema with whatever `DATABASE_URL`
  points at and prints the SQL it is missing. The deploy runs it after
  migrating.
- **After a schema change, restart the dev server.** `prisma generate`
  rewrites the client on disk and a running `next dev` keeps the old one, which
  fails in ways that look like bad data.

## Conventions that run through the schema

**A game is its settings and its moves, never a board.** The engine replays
the moves to get the position. Nothing stores the stones.

**Members are referred to by an opaque id, often without a foreign key.**
`Game.blackMemberId`, `Player.memberId`, `PlayerVariantRating.memberId`,
`XpEvent.memberId` and `OperatorAction.subjectId` are plain strings. The join
is rarely wanted, production has decided games with null seat ids that a
foreign key would refuse, and a log must not cascade away with the row it
describes. The social tables (`Buddy`, `Ignore`, `DirectMessage`,
`InboxItem`, `Applause`) do use foreign keys and are deleted with the member.

**An address is never a key.** A member who joined with an invite code has no
address, so everything that used to be keyed by email moved to the member id.

**Strings rather than Postgres enums for catalogues that grow.** A variant, an
XP award type, a move kind and an inbox kind are strings checked by TypeScript
types, because a Postgres enum value cannot be renamed under the rows holding
it. The enums that do exist are small and settled.

**Null means "nobody said", not a value in range.** `Game.settledStatus` null
means nobody has settled the position, not that the game is over. A streak
kind null means no finished game, not a run of nought. A board row's priority
null means nobody has graded it. Where a real zero exists (games played), the
column is not nullable.

**Denormalised sums, never formulas.** Totals that lists sort or show beside a
name (played counts, streaks, XP) are columns written in the same transaction
as the events they sum, so they can always be recomputed and checked. Derived
values that depend on a tunable table (an XP level) are not stored.

**Two rating pools.** Every rating column comes in two: the bare name is the
pool of games against people, and the `computer` prefix is the pool of games
against the computer players. They are never added together.

## Games

### Game

One game, from the moment it is created to long after it is finished. The id is
eight characters in two blocks (`k3m9-p2qx`), chosen by `makeGameId` and
checked free, because it appears in every address the game has.

| Group | Columns | Notes |
| --- | --- | --- |
| Lifecycle | `status` (`active`/`finished`), `result`, `winner`, `moveCount`, `playedAt`, `updatedAt`, `lastMoveAt`, `durationMs` | A game is born `active` with result `abandoned`; the result means nothing until `status` is `finished` |
| Settled position | `settledStatus`, `settledToPlay` | The engine's last verdict (`playing`, `won`, `draw`) and who is to move. Null means nobody has looked; replay the moves |
| Settings | `size`, `winLength`, `variant`, `obstacles`, `opener`, `opening`, `handicap` (JSON), `seed`, `drawLimit` | Everything the engine needs to replay the moves |
| Seats | `blackToken`, `whiteToken`, `blackClaimedAt`, `whiteClaimedAt`, `blackName`, `whiteName`, `blackMemberId`, `whiteMemberId` | A token is the seat. Equal tokens mean a hot-seat game. A link is shown only while its seat is unclaimed |
| Clock | `moveTimeMs`, `clockMode` (`move`/`game`), `blackTimeMs`, `whiteTimeMs`, `deadlineAt`, `extraMs`, `timeoutPenalty` (`turn`/`game`), `blackForfeits`, `whiteForfeits` | The server sets the deadline on every move. Three forfeited turns in a row lose |
| Options | `rated`, `allowResign` | Chosen when the game is set up; changeable until the first stone |
| Open seat | `openSeat`, `openedAt` | `white` while the seat waits on the noticeboard, null once taken |
| Offer | `offeredToMemberId`, `offeredAt`, `declinedAt`, `withdrawnAt` | A game proposed to a person. Cleared on acceptance, so an accepted game is an ordinary game. A declined or withdrawn offer is filed `finished`/`abandoned` |
| Match | `matchId`, `matchIndex`, `matchSize` | Several games made at once between the same players. `matchId` is the first game's id |
| After the game | `blackVerdict`, `whiteVerdict`, `hiddenByBlack`, `hiddenByWhite` | Each seat's private read on its own play, and hiding a finished game from one's own list |

Indexes cover the listings: by date, by result, by size, by status, the open
seats, each member's seats and offers, the finished queue (`lastMoveAt`), and a
match's games.

### Move

One stone or step, numbered from 1 as on the board. `@@unique([gameId,
number])` is the concurrency control for shared games: two devices cannot both
write move 17.

| Column | Meaning |
| --- | --- |
| `row`, `col`, `stone` | Where, and which colour |
| `kind` | `place` for an ordinary stone, `skip` for a deliberately wasted turn, `move` for a piece that stepped |
| `fromRow`, `fromCol` | Where a moving piece came from |
| `twistQuadrant`, `twistClockwise` | The quarter turn that ended this move, in a twist game |
| `cells` | The cells a multi-cell piece covered, in Domino Five and Block Five |
| `createdAt` | When it landed. Rows older than the column carry the moment it was added |

### Reaction

An emoji one seat sent the other during a shared game, from a fixed list so
nothing a stranger types is shown, optionally with a short message (`text`)
and the move it answered.

### Applause

A public mark of appreciation on a finished game, left by any member who can
see it, at most one per member per game (`@@unique([gameId, memberId])`), so
the tally counts people. There is deliberately no opposite.

### TimeGift

Courtesy time one seat gave the other, kept so sportsmanship can be read
later.

### PuzzleSolve

A puzzle finished by a member (Sudoku and the rest of Numbers; see
`src/lib/puzzles/`). Kept so a puzzle's page can show the fastest solves at
each size and level and a member their own, and so a race has a row per seat.
No relation to `Member`, like a game's seats: `memberId` is a plain id. The
answer is never kept.

| Column | Meaning |
| --- | --- |
| `kind`, `size`, `level` | Which puzzle, as it was asked for |
| `givens` | The puzzle's code (`puzzleCode.ts`), so two solves of one grid are told apart from two grids |
| `elapsedMs` | The browser's clock for a solve on one's own; the server's two stamps in a race |
| `finishedAt` | When the site checked it |
| `raceId` | The `PuzzleRace` this was one seat of, or null |

Indexed by member and date (a member's own), and by kind, size, level and
time (the fastest board).

### PuzzleRace

Two members, one puzzle, two clocks. The host's browser made the puzzle and
posted it whole; the guest comes in by the seat link, as for a game, and
must be a member (a solve is kept and paid by member id). Each seat's start
and finish are the server's own stamps; a seat started and not finished
inside a sitting (`RACE_SITTING_MS`, two hours) reads as given up, decided
whenever the race is read and never by a timer.

| Group | Columns | Notes |
| --- | --- | --- |
| The puzzle | `kind`, `size`, `level`, `seed`, `givens`, `solution` | The seed lets the guest's browser make the same grid; `solution` is kept to check a finish in O(cells) and never sent out |
| Seats | `hostMemberId`, `hostName`, `guestToken`, `guestMemberId`, `guestName` | The token is the guest's seat, shown to the host only while the seat is empty |
| Clocks | `hostStartedAt`, `hostFinishedAt`, `guestStartedAt`, `guestFinishedAt` | Written once each, by the server |

The id is a game's shape (`makeGameId`), so a race sits at
`/games/<slug>/match/<id>` like a match.

## People

### Member

Somebody who has been let in, or a computer player. The id is opaque, given
once, and never derived from anything anybody typed; the rating, the record
and the seats hang off it, so a rename moves nothing.

| Group | Columns | Notes |
| --- | --- | --- |
| Credentials | `email`, `phraseHash`, `phraseSetAt` | Two independent credentials; either may be added, and the last may not be removed. The phrase is hashed with scrypt and never returned |
| Identity | `name`, `picture`, `invitedWith`, `createdAt`, `lastSeenAt`, `unclaimableBecause` | `name` is not unique, on purpose. `unclaimableBecause` marks kept records and seed rows that a real sign-in must never pick up |
| Profile | `city`, `country`, `timeZone`, `bio`, `showOnline`, `emailNotify` | All optional |
| Away | `awayFrom`, `awayUntil`, `daysOff`, `awayDaysUsed`, `awayYear` | Deadlines in games that honour vacation wait. All seven days off is refused |
| Preferences | `appearance`, `gameDefaults`, `preferences` (JSON), `keepFinishedDays` | Read back through `cleanAppearance`, `cleanGameDefaults` and `cleanPreferences`, never trusted, so a removed option falls back rather than breaking a page |
| Moderation | `bannedAt`, `bannedNote` | A shut account's games and ratings stay as they are. The note is never shown to the member |
| Age | `ageBand` | `under_13`, `13_17` or `18_plus` (`AGE_BANDS`, UmaKuma's vocabulary), or null for a member never asked. Null is not a band. Under 13 is written only together with a `ParentalConsent` row |
| Computer player | `botTier` | The grade a program plays at, or null for a person |
| Record | `played`, `won`, `lost`, `drawn`, `playedStreakKind`, `playedStreakCount` | Every finished game, rated or not, matched by member id. Written by `recordPlayed` from all four endings |
| XP | `xp`, `xpImported`, `xpEverywhere`, `xpLastAt`, `xpFlash` | `xp` is earned here, `xpImported` is credit for a kept record, `xpEverywhere` is their sum. `xpFlash` holds awards not yet shown to the member |

Indexed for each sort the members directory and the XP boards offer.

### ParentalConsent

Who consented to a member under 13 having an account, and when. One row per
member (`memberId` unique), written in the same transaction as the band that
needs it (`ageBandStore.ts`), deleted with the member.

| Columns | Meaning |
| --- | --- |
| `name` | The parent's or guardian's name as they typed it, at most 120 characters |
| `relationship` | `parent` or `guardian` (`PARENT_RELATIONSHIPS`) |
| `createdAt` | When they consented |

### Player

A rating record, keyed by the player's name folded to lower case (`key`). This
is where the site's ratings began, when a name was the only identity;
`memberId` attaches it to an account once somebody claims it.

| Columns | Meaning |
| --- | --- |
| `rating`, `ratedGames`, `wins`, `losses`, `draws` | The people pool. Every page that shows "a rating" shows this |
| `computerRating`, `computerRatedGames`, `computerWins`, `computerLosses`, `computerDraws` | The computer pool |
| `peopleStreakKind`/`Count`, `computerStreakKind`/`Count`, `ratedStreakKind`/`Count` | The current run in each pool, and across both |

### PlayerVariantRating

The same as `Player`, per game (`@@id([key, variant])`), so each game has its
own ladder. `recordResult` writes the overall row and the per-game row
together. It has people and computer streaks but no across-both streak,
because no page could honestly print one.

## Experience points

### XpEvent

One thing a member earned, once. The unique index `(memberId, type, subject)`
is the design: the subject says how often the award may happen (a day key, a
game id, a variant, or `""` for once ever), so a replayed request cannot pay
twice. `subject` is not nullable because Postgres treats two nulls as
different, which would let a once-ever award pay twice.

| Column | Meaning |
| --- | --- |
| `type` | A key in `XP_EVENTS`, or one of `IMPORTED_XP_TYPES` for credit from another site |
| `points` | What was paid at the time. Repricing never rewrites history |
| `dayKey` | The day in the member's own time zone, so the daily allowance is one indexed count |

`awardXp` writes the event and the totals on `Member` in one transaction; the
importer (`importedXpPay.ts`) is the only writer of imported types.

## Social

### Buddy

A member's buddy list, one row per owner and buddy, by member id.

### Ignore

A member who may not challenge or message the owner. By member id on both
sides.

### DirectMessage

A message from one member to another, off the board. The ignore list applies
in full, decided in `src/lib/messages/messages.ts`, the only place these rows
are written or read.

### InboxItem

What happened while a member was away: a game finished, a challenge arrived or
was answered, somebody took a posted seat. Written as each happens, read only
when the member opens `/inbox`, never polled, and cleared after thirty days.
`fromName` and `variant` are copied at writing time so an item still reads
after the game or the name has gone.

## Getting in

### InviteCode

A three-word invitation (`hoshi-kuma-nami`), normalised to lower case with
hyphens. `maxUses` of zero is unlimited; `revoked` beats expiry and use count.
Redeeming exchanges the phrase for a signed cookie, so it stops being the
credential once used. `createdBy` and `note` answer "who let them in".

## Operations

### OperatorAction

Something the operator did to somebody else's account: shutting it, restoring
it, setting a member's four words, or opening the word picker for them
(`OPERATOR_ACTIONS` in `src/lib/auth/operatorLog.constants.ts`). One row per
act, written with the change where the change is one write, and listed on the
Admin page. No foreign key, so the log
outlives the account. Never holds a credential.

### EmailSendCount

How many emails were sent in a period, one row per counter
(`site:day:2026-09-15`, `site:month:2026-09`, `member:<id>:day:…`). A send is
allowed by a guarded increment on every counter in one transaction, never by
reading first, so two sends at the cap cannot both pass. Holds no address or
subject.

## Tables nothing reads any more

Kept in the schema until a later migration drops them, with a Neon branch
taken first.

| Model | Why it is idle |
| --- | --- |
| `BacklogItem` | The features board moved to Sumilabu. The rows live there now, reached through `src/lib/sumilabu/boardClient.ts` |
| `SiteSetting` | Site settings moved to Sumilabu's settings store (`src/lib/site/siteStore.ts`). Absence of a setting still means its default |
| `AutoMatchRequest` | Unused since 0.54.0, when a request with nobody to pair became a posted seat |
| `SocialRowWithoutMember` | Buddies, ignores and marks whose address had no member when the social tables moved to member ids. Set aside rather than dropped; nothing reads it |

## Enums

| Enum | Values | Used by |
| --- | --- | --- |
| `GameResult` | `black`, `white`, `draw`, `abandoned` | `Game.result` |
| `GameLifecycle` | `active`, `finished` | `Game.status` |
| `BacklogStatus` | `open`, `inProgress`, `done`, `dropped`, plus retired `proposed`, `planned`, `building` | `BacklogItem` |
| `BacklogKind` | `feature`, `fix`, `chore` | `BacklogItem` |
| `BacklogPriority` | `high`, `normal`, `low` | `BacklogItem` |
| `BacklogEffort` | `small`, `medium`, `large` | `BacklogItem` |

## Known oddities in the schema file

Worth knowing so they do not mislead:

- **Comments from before accounts.** Several comments still say "there are no
  accounts" or "there is no sign-in" (on `Game.blackToken`, `InviteCode` and
  `Player`). They describe the site as it was; members, Google sign-in and
  four-word phrases have existed for some time. Seat tokens are still the
  credential for a seat, which is the part that remains true.
- **Doc comments attached to the wrong model.** Prisma attaches a `///`
  comment to whatever follows it. The comment describing `Reaction` sits above
  `Applause`, the one describing `Ignore` sits above `DirectMessage`, the note
  on `BacklogStatus` sits above `BacklogPriority`, and the note on
  `Game.openSeat` sits above `blackVerdict`. Read the comment by its content,
  not by its position.
- **`Game.result` has a placeholder value.** A game in play says `abandoned`
  until it finishes. Only `status` tells "not yet decided" from "ended with no
  result".
- **`Player.key` is a folded name, not a member.** Some rows are still keyed
  by a name the member no longer uses; `memberId` is what connects them.
- **`BacklogItem.addedBy` is an email**, from before the move to member ids,
  and the table is idle anyway.
