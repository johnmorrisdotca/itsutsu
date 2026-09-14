# XP on Itsutsu: the design

What earns points, what a point is worth, how a level is named, how a toast
reaches the screen, and what each of the ten tickets builds. Modelled on
UmaKuma's system (the `umakuma` repository, `src/lib/xp/`), which is the
reference for the feel, and departing from it where this site is a different
shape. Every departure is argued below rather than left as a difference.

Read this before XP-03 to XP-10. If this file and the code disagree, the code
moved after the file was written; say so in the board row and follow the code.

## Rebalanced to a 999,999 top, 2026-09-13

The ladder below is the second one. The first topped out at 68,155 XP, and John
read it and said so:

> "Also the increments are way too generous. Need to get harder after 10, 20 etc"
> "Level 100 should probably be 10,000,000" / "Or maybe 9,999,999" / "Or 999,999"
> "So see which one can be easier. Maybe 999,999"
> "So a rebalancing is needed to achieve that"
> "If you beat someone better than you with a high rank you earn more XP. You can never lose XP of course."
> "If you have your first win in any sort of variant, you should earn something like five or 10 and the last variant you complete in a group should earn you even more perhaps double that."

And, answering the three questions the first draft of this ladder put to him:

> "you need 999,999 to get to the top level (which is Level 100 right?)"
> "winning a while famly? i dunno, look at balance and determine"
> "rebalance history? if necessary sure, otherwise I can drop a level I don't mind. ITS is new so ok for all to be low if that's what the case is."

What changed, each argued in its own section below:

- **The curve** reaches Level 100 — the top, and the last rung — at exactly
  **999,999** XP, and hardens in two visible steps, at 11 and at 21, with a rate
  that keeps rising after. See "The curve".
- **Every award was repriced** so the routine economy stays small and steady and
  the big money is in the hard things. See "The event catalogue", which shows
  each price and the reason for it.
- **Beating somebody better than you pays more**, in three capped bands, and
  never over a newcomer. See "Beating somebody better than you".
- **A first win at a game pays 10**, John's number, and **a family won pays 300**,
  the balance he left to us, never for a family of one game.
- **Nothing can take XP away**, and that is now a gated rule rather than a fact
  nobody checked. See "Nothing can take XP away".
- **History is not repriced.** Rows already in the ledger keep what they paid and
  everybody's level drops, which John chose. See "What a rebalance does to rows
  already paid" before anybody writes an `UPDATE`.

## What UmaKuma does, and what of it survives the trip

UmaKuma's XP is fifty-odd modules and a balance simulator. The parts worth
copying and the parts worth leaving are not obvious, so they are listed.

**Copied, because they are right anywhere.**

- **Two ladders, kept apart.** There, the curriculum level is earned by
  learning and XP by turning up, and neither buys the other. Here the same
  split already exists and is older than XP: a **rating** says how well you
  play and is pooled, per variant, and rated-only. XP must not be a second
  rating. It is earned by *turning up and trying things*, which is why an
  unrated hot-seat game pays XP and a lost game still pays for being finished.
- **A stored curve, not a formula in code.** `xpCurve.ts` holds the ninety-nine
  costs of climbing as a table so the economy can be retuned by editing numbers. Every
  cost ends in a 0 or a 5, which is John's rule there and reads as a number
  somebody chose rather than one a machine produced.
- **The names are held apart from the costs.** `xpRanks.ts` reads a data file
  and `xpCurve.ts` holds the numbers, so retuning the economy renames nobody
  and renaming a rank moves no number. We keep that seam exactly.
- **A toast is a courtesy, the ledger is the record.** Nothing about a toast is
  persisted, retried or guaranteed. A missed one is not a bug.
- **An award must never be able to fail the thing that earned it.**
  `awardXpQuietly` logs and swallows. A move that ends a game is a finished
  game whether or not its bookkeeping landed.
- **A zero must be explained.** UmaKuma shipped a day where John played four
  games, earned ten XP, and had no way to tell a rule from a bug. Where an
  allowance silences an award, the surface says so — see `GameResultXp.tsx`.
- **Itemised, not totalled.** A request that pays for three things returns
  three entries. "+65 XP" teaches less than three lines saying what each was.

**Left behind, with reasons.**

- **No `XpType` table.** Over there a row per kind exists so an admin can
  reprice without a deploy, and it costs a join on the history page plus a
  seed script plus a `pricedAt` rule so the seed does not undo the admin. No
  one has asked for that here. The constants table is the single source; the
  points actually paid are recorded on the event, so a reprice never rewrites
  history. A type is **never deleted** from the constants table — it is marked
  `retired: true` — so an old event can still explain itself.
- **No balance simulator.** UmaKuma needed one because its economy feeds back
  into itself: a rank buys more games a day, which earn more XP, which buys
  more games. Nothing here compounds like that, so a spreadsheet answer is
  honest. What we do borrow is the *discipline*: the curve section below states
  what a casual player and a committed one reach at a month, a year and three
  years, and those numbers are the reason for the curve rather than a note
  about it. A curve nobody has checked against a plausible player is a formula,
  not a decision.
- **No entitlements.** `xpEntitlements.ts` sells capacity for rank. A
  correspondence game takes days; there is no capacity to sell, and inventing
  one would mean rationing games, which is the opposite of the point.
- **No accumulating day row.** This is the big one, and it gets its own
  section.

## The ledger's one idea: the subject decides the frequency

UmaKuma's `XpEvent` is one row per `(account, kind, dayKey)`, **accumulated**.
That shape answers two questions in one read — a daily cap is the row's amount,
and a once-a-day award is a row that exists — and it pays for it three times
over: an `XP_ONCE_PER_DAY` list, an `XP_DAILY_CAPS` map, and a schema comment
admitting that per-award timing is gone for good.

Here an event is one row per **`(memberId, type, subject)`**, and the subject is
chosen so that the event happens exactly as often as it should:

| Should happen | Subject is | Example |
|---|---|---|
| once, ever | `""` | `firstBuddy`, `everyGradeBeaten` |
| once a day | the day key | `dailyVisit`, `dayStreak7` |
| once per game | the game id | `gameFinished`, `gameWon` |
| once per variant | the variant key | `firstOfVariant` |
| once per family | the family's key | `firstOfFamily`, `everyVariantWonInFamily` |
| once per grade | the bot tier | `gradeBeaten` |
| once per person | their member id | `buddyAdded` |
| once per rivalry | `<opponentId>:<variant>` | `revengeWin` |
| once a weekend | the ISO week | `weekendGame` |

A unique index on `(memberId, type, subject)` then makes **idempotency the
schema's job rather than the caller's**. A replayed request, a double-fired
handler, a bot that plays out the same ending twice: all of them write the same
row and the second write is refused. There is no once-per-day list to keep in
step with anything, because "once a day" is spelled by putting the day in the
subject.

**`subject` is `String @default("")`, not nullable, and that is load-bearing
enough to state.** Postgres does not consider two NULLs equal, so a nullable
subject would let `firstBuddy` be awarded twice — the index would be present,
tested, and silently not doing the one job it exists for. AGENTS.md's rule is
to prefer null over a value that happens to be in range; this is the other
case, where `""` is a real and distinct meaning ("this event is about the
member and nothing else") rather than a stand-in for a missing answer. Writing
null here would be choosing a value that means both "about nothing" and
"about something nobody recorded".

## The event catalogue

Points scale with rarity and effort. A login is small; meeting all five
computer grades is big. Every row's reasoning is in the last column, because a
number with no reason behind it is the thing that gets "tuned" into nonsense six
months later.

`cap` is the day's allowance in **events**, not points, and is absent where an
award cannot be farmed.

**The unit this document counts in is a won game against a person: 100 XP** —
`gameFinished` 25, `gameWon` 50, `wonVsPerson` 25. The day's allowance is six of
them. Everything below is priced against that.

**How the rebalance priced it**, three rules John's brief set and one this site
adds:

1. **The routine stays small and steady.** The finish, the win, the visit and
   the social awards went up about two and a half times together, so their
   proportions to each other are exactly what the first design argued, and the
   ramp of the first ten levels went up by the same factor so a new member's
   first fortnight feels the same as it did.
2. **The big money is in the hard things.** A grade beaten is five won games; all
   five grades is fifty; beating somebody 300 points above you is seven and a
   half. These went up ten to twenty times.
3. **The one-off firsts are ceilings, not a treadmill.** They cannot repeat, so
   they can be generous; a first win at a game is John's 10, and a family won is
   300, twice a family met.
4. **Anything that can be manufactured stays modest, however hard it sounds.** A
   win streak counts every finished game, an empty seat's included, so three in a
   row can be had against nobody. The streaks went up three times, not twenty.

### Arriving and coming back

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `joined` | 50 | 25 | `""` | — | The first line in your history should not be blank. Small, because turning up is not an achievement. |
| `dailyVisit` | 10 | 5 | day key | — | The habit, and the smallest repeatable award: the site must never pay more for opening a tab than for playing. |
| `dayStreak7` | 150 | 30 | day key | — | A week of days, one and a half won games. |
| `dayStreak30` | 750 | 100 | day key | — | |
| `dayStreak100` | 3,000 | 300 | day key | — | |
| `dayStreak365` | 15,000 | 1,000 | day key | — | A year without missing a day: the largest single award on the site, because no afternoon can buy it. **Paid when a run reaches exactly 365**, so once per unbroken run — the first design said it repeats, and the code (`dayStreakMilestoneFor`) pays at 365 and not at 730. The code wins. |
| `weekendGame` | 25 | 5 | ISO week | — | John asked for it. Once a weekend, not once a game. |
| `backFromAway` | 100 | 25 | `awayUntil` date | — | Coming back is the moment a site either keeps somebody or does not. |

### Playing

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `firstGameEver` | 250 | 50 | `""` | — | Two and a half won games. The first game is the whole conversion. |
| `gameFinished` | 25 | 10 | game id | 6/day | A lost game still counts — finishing is the courtesy correspondence play depends on. Capped because hot-seat tic-tac-toe against yourself takes ten seconds. |
| `gameWon` | 50 | 20 | game id | 6/day | Twice a finish. Better, not four times better, or the site rewards only the strong. |
| `wonVsPerson` | 25 | 10 | game id | 6/day | On top. A person is harder than a bot, and this is a site for playing people. |
| `wonVsBuddy` | 40 | 15 | game id | 6/day | On top again. Beating a friend is the point of a family site. |
| `upsetWin` | 100 | new | game id | 3/day | On top, for an established opponent rated at least 100 above you: doubles the won game. |
| `bigUpsetWin` | 250 | new | game id | 2/day | Instead, at 200 above. |
| `giantKilled` | 750 | new | game id | 1/day | Instead, at 300 above **and** an opponent rated 1,700 or more — John's "high rank". See "Beating somebody better than you". |
| `revengeWin` | 150 | 30 | `<opponentId>:<variant>` | — | John's "winning after losing to a friend". Once per rivalry per game. |
| `longGame` | 25 | 10 | game id | 6/day | Past `XP_LONG_GAME_MOVES` (60). |
| `comeback` | 150 | 30 | game id | — | Priced and **not paid** — see "What must not be guessed". |
| `winStreak3` | 75 | 25 | game id | — | Modest on purpose: see rule 4 above. |
| `winStreak5` | 200 | 60 | game id | — | |
| `winStreak10` | 600 | 200 | game id | — | |

### The tour: thirty-nine games nobody has met

There are 39 variants in `RULE_VARIANTS` and 11 families in `GAME_FAMILIES`, and
most of them have barely been played. XP is the site's tour guide.

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `firstOfVariant` | 50 | 25 | variant key | — | 39 × 50 = 1,950. Twice a finish for trying one new thing. |
| `firstWinAtVariant` | 10 | 20 | variant key | — | 39 × 10 = 390. **John's "five or 10", and 10 rather than 5**: at 5 a first win at a game you had never beaten would pay half of simply looking in for the day, and it fires at most thirty-nine times in a life, so the dearer of his two is still a small ceiling. |
| `firstOfFamily` | 150 | 50 | family key | — | 11 × 150 = 1,650. A family is a bigger step than a sibling variant. |
| `everyVariantWonInFamily` | 300 | new | family key | — | 8 × 300 = 2,400. Twice `firstOfFamily`: winning every game in a family is far harder than playing one of it, so it has to pay plainly more — the 20 first priced, John's "double" a first win, left the harder feat paying less. **Not paid for a family of one game** (Hex, Checkers, Go): that is no completion, its one win is already paid by `firstWinAtVariant` and `firstOfFamily`, and 300 more would make one win worth about 510 XP. `familyToWin` decides, live and in the replay. |
| `everyFamilyPlayed` | 2,000 | 200 | `""` | — | All eleven. |
| `everyVariantPlayed` | 5,000 | 500 | `""` | — | All thirty-nine. Level 1 to level 13 on its own. |

**A family won was left to us, and it is 300.** John: "winning a while famly? i
dunno, look at balance and determine". The first draft paid 20, his "double" a
first win, which made winning every game in a family pay less than playing one
game of it (150). At 300 it is twice a family met and plainly the bigger feat,
and the eight families that can be won come to 2,400 XP.

**A family's subject is its KEY.** `GAME_FAMILIES` gained a stable `key` in
0.162.0 for exactly this: a retitled family must not re-award. `xpHistory.ts`
reads a family subject by key, and by title for anything written before.

### The computer ladder

`BOT_TIER_LIST` is the five graded bots — `razryad`, `kyu`, `dan`, `meijin`,
`guoshou`. `BOT_SPECIALIST_LIST` is `tamenoki` and `meritalu`, who play one game
each and are deliberately **not** on the ladder.

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `gradeBeaten` | 500 | 40 | bot tier | — | 5 × 500 = 2,500. Five won games against people for each grade, and each can be beaten for the first time only once. |
| `everyGradeBeaten` | 5,000 | 250 | `""` | — | Beating Guoshou is a real afternoon; beating all five is the site's hardest ordinary goal. |
| `specialistBeaten` | 1,000 | 50 | bot tier | — | 2 × 1,000. You have to go and find their game. |

### People

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `firstBuddy` | 100 | 50 | `""` | — | A site with one person on it is a demo. |
| `buddyAdded` | 25 | 10 | buddy member id | 3/day | Small and capped: a buddy list is not a score. |
| `challengeSent` | 10 | 5 | game id | 3/day | Asking is cheap, and should be. |
| `challengeAnswered` | 25 | 10 | game id | 6/day | Answering is what actually makes a game. |
| `rematchPlayed` | 25 | 10 | game id | 6/day | A rematch is the sign a game was worth playing. |
| `forkPlayed` | 40 | 15 | game id | 6/day | Somebody studying a position. |
| `timeGiven` | 25 | 10 | game id | 3/day | Sportsmanship, and almost impossible to farm. |
| `applauseGiven` | 10 | 5 | game id | 3/day | |

### Who you are

| Type | Points | Was | Subject | Cap | Why this many |
|---|---|---|---|---|---|
| `nameSet` | 25 | 10 | `""` | — | |
| `countrySet` | 25 | 10 | `""` | — | |
| `bioSet` | 50 | 20 | `""` | — | More, because it takes writing something. |
| `wordsSet` | 50 | 20 | `""` | — | The four words. |
| `seatClaimedElsewhere` | 50 | 25 | game id | — | The site's cleverest feature. |

**One-off total: 23,440 XP** — `joined` 50, `firstGameEver` 250,
`firstOfVariant` 1,950, `firstWinAtVariant` 390, `firstOfFamily` 1,650,
`everyVariantWonInFamily` 2,400, `everyFamilyPlayed` 2,000, `everyVariantPlayed`
5,000, `gradeBeaten` 2,500, `everyGradeBeaten` 5,000, `specialistBeaten` 2,000,
`firstBuddy` 100, identity 150.

**Playing everything, winning at everything, completing every family and beating
every computer is level 30, and 2.3% of the ladder.** The first design made the
tour a fifth of its ladder; at a 999,999 top that would be 200,000 XP of
one-offs, and the rest of the economy would have nothing left to do. The tour
still carries a new member a long way up the early ladder — level 30 is most of
a committed member's first quarter — and then stops, which is what a ceiling is.

### How the day's allowance works, and what it must say

The allowance gates the *result* awards and nothing else: `gameFinished`,
`gameWon`, `wonVsPerson`, `wonVsBuddy`, `longGame`, the three upset bands, and
the social ones with a cap in the table. **It never gates a first-time or
milestone award.** Beating Guoshou for the first time on your seventh game of
the day is not the thing worth rationing, and telling somebody nothing happened
is the failure the cap exists to prevent, not to cause.

So the rule is one sentence: **the result awards for a game fire only if that
game's `gameFinished` was actually paid.** One test, one place, and a game that
falls outside the day's allowance is silent as a whole rather than paying for
being won but not for being finished.

**And where it is silent, something must say so.** A 0 with a reason beside it
is information; a 0 alone is indistinguishable from broken.

### What must not be guessed

`comeback` is in the table and is not paid. The award needs a position the
engine can call losing, and `analysis: false` is set on the twists, the flips,
the races and more — so for those variants there is no reading at all. A
comeback bonus that treated "no reading" as "was losing" would pay everybody
for every win. `xpGame.ts` has the whole refusal; `XP_UNWIRED` is what tells a
page it is not yet paid. Silence is the safe answer.

### Bots do not earn XP, and this is not an oversight

The computer players are real `Member` rows with real ratings and real streak
columns, and a naive `awardXp` would put Meijin at the top of the leaderboard.
So `awardXp` refuses a member whose `botTier` is not null, and the leaderboard
filters on it again — twice, because the awarder is where it is true and the
leaderboard is where it would be visible.

## Beating somebody better than you

John: *"If you beat someone better than you with a high rank you earn more XP.
You can never lose XP of course."* The rule is `src/lib/xp/xpUpset.ts`, pure and
tested beside its source; `xpGame.ts` adds its answer to a win over a person.

**Three bands, each a priced award.** One of them or none, never two, keyed on
the game:

| Band | The opponent stood at least | And their own rating | Elo's chance of this win | Pays | Cap |
|---|---|---|---|---|---|
| `upsetWin` | 100 above you | — | 36% | 100 | 3/day |
| `bigUpsetWin` | 200 above you | — | 24% | 250 | 2/day |
| `giantKilled` | 300 above you | 1,700 or more | 15% | 750 | 1/day |

**The cap is the top price.** No win adds more than 750, and a band is a number
somebody chose rather than a formula over a rating difference — which is a
lottery, and a clamped formula is a lottery with a ceiling somebody must remember
to keep. It also leaves the ledger's contract alone: one price per type, so
`awardXp` and the backfill's prediction did not have to learn that a type can be
worth two amounts.

**"Better than you with a high rank" is two things, and both are read.** The GAP
decides whether a win is an upset and how big. The opponent's OWN rating decides
only the top band: a 1,200 beating a 1,500 is a real upset between two people
still finding their feet and pays `bigUpsetWin`; a 1,500 beating a 1,800 is
beating somebody near the top of this site, and only that pays the most.

**A gap only means something when both numbers do, and the two seats are held to
different standards on purpose.**

- **The opponent must be established** — twenty rated games or more, `tierFor`'s
  line. This is the guard against farming and it is the load-bearing one: a
  newcomer sits at 1,600 whatever their strength, so an upset over a provisional
  opponent is a win over somebody new, which is the opposite of what was asked.
- **The winner must be rated at all** — four rated games or more. Not established:
  a winner cannot farm by being new, and twenty games would only delay the award
  for the members the early levels are for. But an unrated winner's figure is the
  1,600 nobody earned, and a gap measured off it is not a gap.
- **A missing rating is null and pays nothing** — no `Player` row, or a failed
  read. It is never read as 1,600, which would pay an upset over every stranger.

**The people pool, never a program's number.** The ratings read are
`POOL_COLUMNS.people`, and only on a win over a person. Beating a computer is
`gradeBeaten`'s job, once per grade, and a bot's rating lives in the other pool.

**"As they stood" is true because of where it is read.** XP rides `recordPlayed`,
and every ending calls `recordPlayed` *before* `recordResult` exchanges the
ratings, so the `Player` rows still hold what the two carried into the game.
`xpUpset.test.ts` pins that order in the endings' source: if it ever flipped, the
bonus would be read off ratings that already include the upset it pays for.

**What it costs.** One indexed read on `Player.memberId`, in the same
`Promise.all` as the buddy and rivalry reads, on a win over a person in a game
the ladder counts, and on nothing else — the same rows `recordResult` reads a moment later for a rated
game. Nothing per move, nothing per page.

**Only a game the ladder counts.** An upset is paid only where the game is rated
**and** `gameRatingRefusal` would not refuse it — not played at one screen, two
different names, no kept record — which is exactly the set of games the ladder
itself counts (`countsOnLadder` in `playedRun.ts`). A friendly costs its loser
nothing, so two people could otherwise agree to trade upsets across a gap no
rated game ever tested; on a rated game every throw costs the loser rating and
shrinks the gap that pays. Every ending hands `recordPlayed` the facts, and
`hotSeat` — the one no row carries — is required, so an ending that forgets does
not compile. The ratings are not even read for a game the ladder does not count.
The daily caps still bound what is left: at most 3 × 100 + 2 × 250 + 1 × 750 =
1,550 XP a day from upsets, each needing a real established opponent.

**Reproducibility: the replay does not pay it, and says why.** An Elo figure
cannot be rebuilt — each exchange depended on both ratings at that moment, and
nothing stored them. Recording them on the game from now on would help no game
already played, which is every game a replay exists for, and there is no "what a
game paid" column on `Game` to carry it. Paying history off today's ratings would
be wrong in both directions — a member who has since climbed would be denied
upsets they really made, and one who has since fallen paid for upsets that never
were — in a ledger nobody could check. So `backfillXp.ts` hands the rule no
ratings, it answers nothing, and `XP_BACKFILL_COVERAGE` marks all three bands
`replayed: false, recorded: false` with the reason, printed by every run.

## Nothing can take XP away

John's second sentence is now a rule of the system, gated in two places because
either half could be broken by an innocent edit and nothing else would notice:

- **No price in the catalogue is at or below zero.** `xp.coverage.test.ts`. A
  penalty award would be one row in the table.
- **`Member.xp` is written in one place, and only as an increment of what was
  just paid.** `awardXp.test.ts` asserts the source has exactly one write to the
  column and it is `{ increment: points }`, and drives every award in the
  catalogue at a member, repeatedly and out of order, asserting the total never
  once goes down and still equals its ledger at the end.

And the two cases the rule is about: **beating a weaker player** pays every
ordinary win award and no less — the upset rule only adds — and **losing** pays
exactly what it paid before, the finish.

**What CAN go down, and must be said: the level a member sees, when the curve is
retuned.** The level is derived from `Member.xp` through the table, so a retune
moves every member's level at once and nobody's XP. The 68,155 ladder put 1,335
XP at level 12; this one puts the same 1,335 at level 7. Nobody lost a point; the
rungs moved. A future retune should say the same thing to the people it moves.

## What a rebalance does to rows already paid

`XpEvent.points` is **what was paid at the time**, and the schema's own comment
says so: "Repricing an award must not rewrite anybody's history." So after this
rebalance every row written before it keeps its old amount, `Member.xp` still
equals the sum of its rows, and the backfill's refusal to write over a total that
disagrees with its ledger still holds. **That is correct, and nobody should "fix"
it by updating old rows' points** — an `UPDATE` to `XpEvent.points` without the
same change to `Member.xp` in the same transaction is exactly the disagreement
the backfill refuses to write on top of, and one with it is history rewritten.

**The decision taken: history is not repriced.** Production's ledger held 71
rows when this was decided, all from the backfill at the old amounts (John
1,335, Hanachan 200, Chibi 25, Kyokosan 25). They keep what they paid, nothing
is cleared, and the backfill is not re-run. Everybody's level drops on the new
curve — John's own 1,335 XP was level 12 and is now level 7 — and he chose
that, in his words: *"rebalance history? if necessary sure, otherwise I can drop
a level I don't mind. ITS is new so ok for all to be low if that's what the case
is."*

**The option nobody took**, kept written down only so that it is a known path
rather than an improvisation, should anybody ever want history paid at new
amounts. It is not planned:

1. Take a Neon branch first (`before-xp-reprice-<date>`), as for a migration.
2. Delete **only the rows the backfill wrote** — those types it replays
   (`XP_BACKFILL_REPLAYED`), identified by the run's `createdAt` — and subtract
   exactly their sum from each member's `Member.xp` in the same transaction.
   Rows earned live since (a daily visit, a buddy added) are not replayable, and
   deleting them would take XP the replay can never give back.
3. Check `Member.xp` equals `sum(XpEvent.points)` for every member, then run
   `pnpm xp:backfill:prod` to look and `XP_BACKFILL_RUN=1` to pay.

## The curve

One hundred levels. Held as a table in `src/lib/xp/xpCurve.ts`, every cost but
the last ending in a 0 or a 5, strictly increasing, with a test asserting the sequence
rather than trusting the generator that made it. `XP_LEVEL_COST[i]` is the price
of reaching level `i + 2` — ONE RUNG, not a running total — so there are
ninety-nine rows, one per level-up, and their plain sum is the total to level 100.

```
   50,   100,   150,   200,   250,   300,   350,   400,   450,   700,
  720,   740,   755,   775,   795,   815,   840,   865,   890,  1100,
 1150,  1175,  1225,  1250,  1300,  1350,  1375,  1425,  1475,  1525,
 1600,  1650,  1700,  1775,  1850,  1900,  1975,  2075,  2150,  2250,
 2325,  2425,  2525,  2650,  2750,  2875,  3000,  3150,  3300,  3450,
 3600,  3775,  3950,  4150,  4350,  4575,  4800,  5050,  5325,  5600,
 5875,  6200,  6525,  6875,  7275,  7675,  8100,  8550,  9050,  9575,
10150, 10750, 11350, 12050, 12800, 13550, 14400, 15300, 16250, 17300,
18400, 19550, 20850, 22200, 23700, 25250, 26950, 28800, 30750, 32900,
35200, 37650, 40300, 43150, 46300, 49600, 53250, 57150, 61404,
```

Total to reach Level 100 — the top, and the last rung: **999,999 XP.** There is no
Level 101.

**Exactly 999,999, and how.** John: "you need 999,999 to get to the top level".
Every other cost ends in 0 or 5 — the generator's rounding, which reads as a
number somebody chose — so the rounded table lands on 999,995, and **Level 100's
own rung takes the last four**: it costs 61,404, the one cost that does not end
in 0 or 5. The rounding is a convenience and his number is the requirement, so
where they disagree the last rung gives way. `xpCurve.test.ts` asserts
`xpForLevel(100)` is 999,999, `xpLevelFor(999_999)` is 100 and
`xpLevelFor(999_998)` is 99.

**Three parts, and each boundary is a step John named.**

- **Reaching levels 2-10 is a flat ramp** — 50, 100, up to 450. 2,250 XP in all,
  0.23% of the ladder: twenty-two won games. Quick and legible, because a ladder
  whose first rungs already compound gives a new member nothing to hold on to.
- **Level 11 costs 700**, half as much again as level 10, and from there every
  level compounds — "harder after 10".
- **Level 21 costs a quarter more than level 20** — "harder after 20" — and the
  compounding rate keeps rising, from 2.47% a level at 12 to 7.41% at 100. A
  rising rate is what makes the last stretch a climb rather than more of the same:
  the last ten levels cost 456,904 XP, 46% of the whole ladder.

**How to retune.** `python3 docs/plans/xp/curve.py` prints the table above. It
fixes the ramp, the two steps, how far the rate rises and the target, and solves
the starting rate so the *rounded* table lands on the target; costs round to 5
below 1,000, 25 below 10,000 and 50 above, and the few fives rounding leaves are
laid on the cheapest compounding rows, where 5 is the natural unit, and what is
left below five goes on Level 100's own rung. Change a
decision, run it, paste. Do not hand-edit one row — the test asserts strict
increase and will catch it, but the shape is the decision and a single edited row
is not a shape.

### What it takes, which is the reason for the numbers

A won game against a person is 100 XP and the allowance is six of them a day.
Four players, at the catalogue above:

- **Committed** — signs in every day, finishes two games a day, wins half against
  people: 135 a day, about 50,000 a year, plus the day-streak milestones and the
  one-offs in the first two years.
- **Casual** — four days a week, three finished games a week, wins half: about
  12,000 a year, plus some one-offs.
- **At the allowance** — wins six games against people every single day: about
  224,000 a year. The fastest honest climb there is.
- **Upsets** — a win over somebody 100 above you is 200 instead of 100.

**Every XP figure in this table is CUMULATIVE** — the total a member holds on
reaching that level, `xpForLevel` — and not the price of that one rung, which is
`XP_LEVEL_COST`. Level 100 is the top, at exactly 999,999; there is no Level 101.

| Level | Total XP to reach (cumulative) | (was) | Won games against people | Wins over a stronger opponent | Committed | Casual | At the allowance |
|---|---|---|---|---|---|---|---|
| 10 | 2,250 | 900 | 22 | 11 | the first fortnight | about six weeks | the first week |
| 20 | 10,145 | 3,280 | 101 | 51 | about six weeks | about six and a half months | a fortnight |
| 25 | 16,045 | 4,715 | 160 | 80 | about ten weeks | about ten months | three weeks |
| 50 | 68,420 | 15,090 | 684 | 342 | about ten months | about four years | about three months |
| 75 | 237,045 | 33,945 | 2,370 | 1,185 | about four years | about seventeen years | eleven months |
| **100 — the top** | **999,999** | 68,155 | 10,000 | 5,000 | **about nineteen years** | about seventy-seven years | **about four years** |

### The trade, which John asked to see

He asked which of 10,000,000, 9,999,999 and 999,999 is easier. **999,999 is — by
a factor of ten — and it still makes level 100 a lifetime's standing at these
prices.** That is stated rather than hidden. Four decisions fall out of the table:

1. **The first ten levels are a fortnight for a committed member and a few weeks
   for a casual one.** Unchanged in feel from the first ladder, on purpose.
2. **The middle is a real climb.** Level 50 is most of a committed year; level 75
   is four.
3. **Level 100 is not a three-year target any more.** The first ladder put it at
   three years of committed play. This one puts it at about nineteen, and at four
   for somebody who wins six games against people every day — which is what a
   figure with six nines in it asks for.
4. **10,000,000 is not reachable at all.** At the allowance's ceiling it is forty-four
   years; nobody would ever stand at level 100.

**If level 100 should be reachable by a committed member in about five years**,
there are two honest levers, and they are John's call:

- **Lower the top, keep the prices.** A ladder of about 333,000 puts level 100 at
  roughly six committed years and about sixteen months at the allowance. One number
  in `curve.py`.
- **Keep 999,999, pay the routine more.** Doubling the won game to 200 (and the
  ramp with it, so the first ten levels still take a fortnight) puts level 100 at
  about ten committed years. Every routine price in `xp.constants.ts`.

## The hundred level names

**Not written here.** `src/lib/xp/levelNames.constants.ts` is a separate piece
of work with a separate author, and this file only fixes the interface it must
meet.

```ts
export type LevelName = {
  /** 1 to 100. */
  level: number;
  /** The canonical name, the one a member is shown. */
  name: string;
  /** A Japanese name where one reads well. Absent is normal. */
  kanji?: string;
  /** Why this reference is cool, in one line, for the rank's own page. */
  note: string;
};

/** Exactly one hundred, level 1 first, no gaps. */
export const LEVEL_NAMES: readonly LevelName[] = [ /* … */ ];
```

Constraints on that file, so the two halves meet:

- **Exactly 100 rows, `level` ascending from 1 with no gaps.** The curve is 100
  levels; a 64-level list would need the curve regenerated, and there is no
  reason to stop short.
- **It is a `*.constants.ts`**, so the 500-line gate reports it and does not
  fail it. A catalogue of a hundred names is data, not a file doing too many
  jobs.
- **Nothing in it throws, and nothing reads it directly.** `xpLevelName(level)`
  in `src/lib/xp/levelNames.ts` does the lookup and answers `Level 42` for a
  missing row. A rank with no name is honest; a crash on a profile page is not.
  That fallback is a floor, not a feature.
- **Names and costs never move together.** Retuning the curve renames nobody;
  renaming a level moves no number. Two files, one join, in `xpStanding()`.

The join: `xpLevelFor(xp)` gives the level, `LEVEL_NAMES[level - 1]` gives the
name. `xpStanding(xp)` returns `{ level, name, into, span, ratio, toNext }` so a
progress bar needs no loop and a badge needs no second call.

## Toast delivery: the seam

John asked for UmaKuma's toasts — dropping in from the top, saying what was
earned, going away on their own. The visual is XP-07's. **This section is the
seam: what an awarder writes so a toast can appear, without polling.**

UmaKuma's mechanism is a DOM `CustomEvent` (`XP_TOAST_EVENT`) raised by
`showXpToast()` and listened for by `XpToastHost` in the root layout. That
works there because the paying action is always a `fetch` the client is
awaiting: a review answered, a game completed. The route returns `XpEarned` and
the client raises one toast per entry.

**Half of Itsutsu's awards have nobody waiting on a response.** A login is
awarded during a server render. A game finishes because the *opponent* moved,
or because a bot moved, or because a clock ran out — and the member who earned
the XP is not in the request at all. There is no response to put it in.

And a cookie cannot carry it: a cookie can only be set in a Server Function or
a Route Handler, never during a server render, so the login award has nowhere to
write one. `src/proxy.ts` could, and is out of bounds — the gate's decisions
are not ours to touch.

### So the flash is a column, written inside the write that is already happening

```prisma
/// XP earned that the member has not been shown yet.
///
/// A courtesy, not a record — the ledger is XpEvent. Written by awardXp in the
/// same transaction as the total, so it costs no write of its own; read off
/// the row memberRowFor already fetches on every server-rendered page, so it
/// costs no query; cleared by the host once it has been shown.
xpFlash Json?
```

Shape:

```ts
export type XpFlash = {
  /** When the newest award in it landed. Lets a clear be reasoned about. */
  at: string;
  awards: { type: string; points: number }[];
};
```

**Why this satisfies both standing rules.**

- **No polling.** Nothing asks on a timer. The flash is written by the awarder
  and read once, by the next page the member loads.
- **Zero new queries.** `memberRowFor` in `src/lib/auth/members.ts` is
  `cache()`d per request and already runs on every server-rendered page via
  `currentSession()` → `touchMember()`. Widening its `select` from
  `{ lastSeenAt, bannedAt, preferences }` to
  `{ id, xp, xpFlash, lastSeenAt, bannedAt, preferences }` reads all of it for
  free. That file's own comment already states the pattern: *"A preference is
  read by riding this query, never by adding one."* Adding `id` has a bonus —
  `currentMemberId()` costs an extra `findUnique` today and stops needing one.

### The four functions, and who calls what

| Function | File | Who calls it |
|---|---|---|
| `awardXp({ memberId, type, subject, now })` | `src/lib/xp/awardXp.ts` | the writers. Never a page. Writes the event, the total and the flash in one transaction. |
| `awardXpQuietly({ memberId, awards })` | `src/lib/xp/awardXp.ts` | the same writers, for a batch. Logs and swallows every failure. |
| `xpFlashFor(email)` | `src/lib/xp/xpFlash.ts` | `SiteHeader`. Reads the flash off the cached member row and turns `{type, points}` into the host's props using the constants table. Returns `[]` for nobody signed in. |
| `clearXpFlash()` | `src/lib/xp/xpFlash.actions.ts`, `"use server"` | the client host, once it has shown them. A Server Function, which is the Next 16 name; no route file needed. |

`xpFlashFor` hands the host exactly what `src/components/xp/XpToastHost.tsx`
takes, built on the server so the client never ships the catalogue:

```ts
export type XpToastItem = {
  /** Unique per award, stable across a re-render of the same flash. */
  id: string;
  points: number;
  label: string;
  /** May be empty. */
  kanji: string;
  sentence: string;
  /** `reached: true` is a level-up; `false` is the quiet "next level" line. */
  level?: { name: string; reached: boolean };
};
```

`label`, `kanji` and `sentence` come from `XP_EVENT_SPECS`; `level` comes from
the curve. The `id` is the flash's stamp plus the award's position in the batch —
stable so a dismiss keeps working, and **not random**, because a random id
differs between the server's markup and the browser's and is reported as a
hydration mismatch.

**Three decisions about `level`, each of which could have gone the other way.**

- **It is sent when a level was crossed, and when the award left the member
  within `XP_ONE_MORE_GAME` (30 — one finished win) of the next one. Not on
  every award.** The interface allows the latter, and it would mean every
  daily-visit toast carries a progress line, which turns a courtesy that goes
  away on its own into a status panel following a reader round the site. The
  nudge earns its place by being rare, and by being *true*: "one more game" is
  something a reader can go and do, where "8% to go" is a number nobody can act
  on.
- **It goes on the LAST award of a batch, not all of them.** A level is crossed
  once however many awards carried you over it; on all three it would say "you
  reached Pixel" three times in one stack.
- **Nothing at the top of the ladder.** Not level 100 with `reached: false`,
  which reads as a level somebody is approaching while already standing on it.

**The level's NAME is the catalogue's, since XP-10's follow-up patch.** `levelOn`
in `xpFlash.ts` was `Level 42` from XP-02 until the hundred names landed and now
calls `xpLevelName(level)`, so a LEVEL UP 昇級 toast says "Dreamcast". Nothing
else moved. `Level 42` survives as that function's FLOOR for a level the ladder
does not have — UmaKuma's own answer, where `xpRank` says `Rank 42` for an
unnamed rank and its comment calls it a floor rather than a feature.

**The kanji for a level-up is `昇級`, not `昇段`.** Two reasons, and the second is
the one that settles it. The hundred levels are video-game references, not dan
grades, so `昇段` — promotion to a *dan* rank specifically — would be describing
something the ladder does not have. And `kyu`, `dan` and `meijin` are already
taken on this site: they are three of the five computer grades in `BOT_TIER_LIST`.
Dan-and-kyu language anywhere in the XP ladder would collide with the bot ladder's
vocabulary, in a place where a reader has every reason to think the two are
related. **The names file should avoid dan/kyu wording for the same reason.**

### Where the host mounts

**In `SiteHeader`, not the root layout.** `src/app/layout.tsx` reads only the
locale — it knows nothing about who is looking — and giving it a session read
would make every public, signed-out page pay for a cookie read and a query to
find out there is no toast. `SiteHeader` is mounted by every page that has
chrome and already awaits `currentSession()`, so the flash arrives free.

Two consequences XP-07 must handle rather than discover:

- **A page with no masthead shows no toast.** The bare-board reader is the
  case. Acceptable: the ledger still has it, and the next page with chrome will
  say so.
- **`SiteHeader` is mounted per page, not once.** Confirmed — there is exactly
  one `layout.tsx` in the app and it contains no header. So there is exactly
  one host per render and no duplication, but a page that mounts `SiteHeader`
  twice would get two hosts. XP-07 should assert one.

### Double-showing, and why it is allowed to happen

A route that pays XP *may* also return what it paid, so a toast lands
immediately rather than on the next navigation. Both paths end at the same
component, and the host calls `clearXpFlash()` after showing — so whichever
arrives first wins and the other finds an empty flash.

A race can still show one toast twice. That is allowed, deliberately, and it is
UmaKuma's reasoning: a toast is a courtesy, the ledger is the record, and
nothing here is persisted, retried or worth waking anybody for. Building a
sequence number to close a one-in-a-thousand duplicate courtesy would buy a
migration and a comparison for no reader's benefit.

## The schema

Two changes. Both additive; nothing is dropped, renamed or backfilled.

```prisma
/// One thing a member earned, once.
///
/// The unique index is the whole design. A type plus a subject says how often
/// an award may happen — the day key for a daily one, the game id for a game,
/// the variant for a first play, "" for a once-ever — so idempotency is the
/// schema's job and not a rule every caller has to remember. A replayed
/// request writes the row that is already there and is refused.
///
/// `points` is what was paid AT THE TIME, not what the type is worth now.
/// Repricing an award must not rewrite anybody's history.
///
/// No relation to Member, matching every other member-keyed table here
/// (Player.memberId, Game.blackMemberId): the id is opaque and the join is
/// never wanted.
model XpEvent {
  id       String   @id @default(cuid())
  memberId String
  /// The key in XP_EVENTS. Never an enum: a Postgres enum member cannot be
  /// renamed under rows that hold it, and the catalogue will grow.
  type     String
  points   Int
  /// What this award was about. "" for an award about nobody but the member —
  /// NOT null, because Postgres does not consider two nulls equal and the
  /// index below would silently stop working for every once-ever award.
  subject  String   @default("")
  /// The day it was earned, in the member's own zone where they have set one.
  /// Carried as a column rather than derived from createdAt so the day's
  /// allowance is one indexed count and a history page needs no arithmetic.
  dayKey   String
  createdAt DateTime @default(now())

  @@unique([memberId, type, subject])
  /// The day's allowance: one count, one index.
  @@index([memberId, dayKey])
  /// A member's history, newest first.
  @@index([memberId, createdAt])
}
```

```prisma
model Member {
  // … existing fields …

  /// Every point this member has earned, denormalised from XpEvent.
  ///
  /// A column and not a sum, because every list that shows a level shows it
  /// beside a name — the members directory, a ladder, the leaderboard — and a
  /// sum per row is the fault taken off the landing page in 0.139.0. Every one
  /// of those lists already fetches the Member row.
  ///
  /// Safe to denormalise because it is a SUM and not a formula: it can be
  /// recomputed from XpEvent and checked, and awardXp writes both halves in
  /// one transaction so a replay cannot drift them.
  xp      Int   @default(0)

  /// XP earned and not yet shown. See src/lib/xp/xpFlash.ts.
  xpFlash Json?

  @@index([xp])
}
```

### The level is derived, never stored

UmaKuma stores `Account.xpLevel` beside the total and needs a
`syncAccountLevels` job to keep them honest. We store the total only.

- **Zero queries either way.** `xpLevelFor(xp)` is a lookup over a 100-element
  array in memory. A list that has the `Member` row has the level. Storage buys
  nothing here.
- **Ordering either way.** The curve is monotonic, so ordering by `xp` and
  ordering by level are the same ordering. The leaderboard needs no level
  column.
- **And a stored level is a cached formula that can go stale.** The curve is a
  table precisely so it can be retuned by editing numbers with no migration
  behind it. The moment it is retuned, every stored level is a number nobody
  can trust and nothing reports it — AGENTS.md's "a value that happens to be in
  range" exactly. Deriving it means a retune is instantly true everywhere.

`rankedUp` is still answerable without it: `awardXp` holds the total before and
after in one transaction, so it compares `xpLevelFor(before)` with
`xpLevelFor(after)` and needs nothing persisted.

### Sorting and paging the leaderboard, and the index behind each column

The leaderboard does not invent its own sorting. It consumes **`src/lib/api/paging.ts`**
— `sort=<column>[:asc|desc]`, an opaque `cursor`, a capped `limit`, and the
envelope `{ items, next, total? }`, cursor-based — and the sortable headings
**`RecordTable`** grows in the same pass. That convention is another agent's
work, landing now; the leaderboard ticket depends on it and must not write a
second one.

**Every sortable column is an indexed column on `Member`.** That is the whole
requirement, because a sort has to order *all* members and not just the page
being shown, so a sort key that is not an index is a full scan on every click of
a heading — the landing-page fault of 0.139.0 wearing a table header.

| Heading | Sorts on | Index | Note |
|---|---|---|---|
| XP | `Member.xp` | `Member_xp_idx` | The default, descending. |
| Level | `Member.xp` | `Member_xp_idx` | **Nothing extra.** The curve is monotonic, so ordering by level *is* ordering by XP. Do not add an `xpLevel` column to make the heading sortable — it is already sortable, and the column would be a cached copy of a table meant to be retuned. |
| Last earned | `Member.xpLastAt` | `Member_xpLastAt_idx` | Nullable. Null is "never earned anything", which the table shows as a dash rather than as a date. |
| Name | `Member.name` | — | Unindexed, and acceptable: it is a tie-break and a small-N convenience, never the default. If the members table ever grows past a few hundred, index it. |

`Member.xpLastAt` is in XP-02's second migration for this reason and no other.
`max(XpEvent.createdAt) group by memberId` answers the same question, and as a
*sort* it is either a query per row or a grouped subquery no index can order.
`awardXp` writes it in the same `UPDATE` that increments `xp`, so it costs
nothing, and it is only written when something was actually paid — "last earned"
has to mean earned, or a member whose seventh game of the day paid nothing would
float above one who really did earn.

**The leaderboard must exclude bots in its own query**, on `botTier: null`, even
though `awardXp` already refuses them. Two places, because the awarder is where
it is *true* and the leaderboard is where it would be *visible*.

### The day key

`dayKey` is `YYYY-MM-DD` in the member's `timeZone` where they have set one, and
UTC where they have not. UmaKuma hardcodes Vancouver; this site has members in
Japan, Estonia and Canada and already stores a zone per member, so a day that
ends at 5pm for one of them would be wrong. `xpDayKey(now, timeZone)` in
`src/lib/xp/xpDay.ts`, pure, tested against a member in Tokyo and one with no
zone set.

### The migration

Name: `prisma/migrations/<timestamp>_a_member_keeps_their_experience/`, in the
house style — a sentence, `yyyyMMddHHmmss`, a prose `--` header saying what and
why before the SQL. Timestamped after everything on `origin/main` and in
flight, verified against `_prisma_migrations` on the shared local database
rather than against a directory listing.

Applied **locally only**, with `migrate deploy` and never `migrate dev`. If it
offers a reset the answer is no. The coordinating session is told the moment it
is applied, because the local database is shared and a migration on an unmerged
branch makes every other worktree's `migrate dev` offer a reset.

Before it reaches production, a Neon branch: `before-xp-2026-09-12`.

**Two migrations, not one.** `20260912120000_a_member_keeps_their_experience` is
the ledger and the total; `20260912123000_the_ladder_sorts_by_what_it_shows` adds
`Member.xpLastAt` for the leaderboard's second sort. The second exists because
the first was already applied when the sorting convention landed, and Prisma
checksums a migration file — editing an applied one breaks `migrate status` on
every database holding it. Two files is the right cost of that.

### Nobody's XP is backfilled, and that is a decision

Production holds **116 finished games** and 4 real people (11 members, 7 of them
bots). Every one of them starts at zero.

Backfilling is tempting and half of it is easy: 116 games times a finish and a
win is an afternoon. The other half is not. `firstOfVariant`, `firstOfFamily`,
`revengeWin` and the streaks are all **ordered** facts — they depend on what had
already happened when each game ended — so a backfill has to replay history in
chronological order through `awardXp` itself, or the totals are a different
number from what the rules would have produced. And a *partial* backfill is the
worst of the three options: four people with totals that reflect some awards and
not others, which nothing can explain and nobody can check.

The idempotent subject makes the replay safe and repeatable whenever somebody
wants it — that is exactly what it is for — so this is a deferral rather than a
refusal. **It is its own ticket.** Until it runs, the ladder honestly says the
ladder started today.

A backfill, when it happens, needs one thing this design does not yet have: a
check that `Member.xp` equals `sum(XpEvent.points)` for every member. That is one
query, it belongs in the backfill script, and it is the only way to know a replay
landed.

**It has since run.** `backfillXp.play.test.ts` replayed production's history on
2026-09-13 at the amounts before the rebalance, and the check held. What that
means for those rows now is "What a rebalance does to rows already paid" above.

## Where the seams are

Every award rides a write that already happens. Nothing is called from a page.

| Award | Rides | File |
|---|---|---|
| `dailyVisit`, `dayStreak*`, `backFromAway` | the `lastSeenAt` write | `src/lib/auth/members.ts` → `touchMember` |
| `joined` | `admitMember`'s create branch | `src/lib/auth/members.ts:97` |
| `gameFinished`, `gameWon`, `wonVs*`, `upsetWin` / `bigUpsetWin` / `giantKilled`, `revengeWin`, `longGame`, `winStreak*`, `firstOf*`, `everyVariantWonInFamily`, `gradeBeaten`, `comeback` | **`recordPlayed`** | `src/lib/rating/playedRun.ts` |
| `challengeSent`, `rematchPlayed`, `forkPlayed` | `createLiveGame`'s three branches | `src/app/api/games/live/route.ts` |
| `challengeAnswered` | the challenged side's first move | `src/lib/history/liveGame.ts` → `appendMove` |
| `seatClaimedElsewhere` | `bindSeat` / `markSeatTaken` | `src/app/games/[slug]/match/[id]/seat/[token]/route.ts` |
| `firstBuddy`, `buddyAdded` | `addBuddy` | `src/lib/social/buddies.ts:56` |
| `nameSet`, `countrySet`, `bioSet` | `updateProfile` | `src/lib/auth/members.ts:356` |
| `wordsSet` | `setPhrase` | `src/lib/phrase/phraseStore.ts:108` |
| `timeGiven` | `giveTime` | `src/app/api/games/[id]/time/route.ts` |
| `applauseGiven` | `setApplause` | `src/lib/history/applause.ts:35` |

Four findings from reading those, each of which would have cost a session:

**`recordPlayed`, not `recordResult`.** The brief said `recordResult`; it is the
wrong one. `recordResult` takes **names**, bails early on `!isRateable`, and is
called only `if (row.rated)`. `recordPlayed` takes **member ids**, is called at
all four endings — a move, a claimed timeout, a settled position, a resignation
— and is deliberately not gated on `rated` or hot seat. XP is about playing, not
about rating, so it is `recordPlayed`'s set of games we want. It already
resolves each bound seat's outcome in `playedSides()`, already skips an unbound
seat and already answers a self-game once from black.

**The daily visit compares days, and costs nothing.** `touchMember` already
reads `lastSeenAt` and already writes it only when it is a minute stale. So the
award is: *if the stored `lastSeenAt` falls on an earlier day key than now, this
is a new day.* One comparison on a value already in hand, one extra write on
the first visit of a day, and nothing at all on the other four hundred page
loads. Putting `awardXp` inside the minute-throttle instead would attempt an
award up to 1,440 times a day and lean on the unique index to refuse 1,439 of
them.

**There is no challenge to accept.** No `Challenge` model exists. A challenge
is a `Game` created with both `blackMemberId` and `whiteMemberId` already bound,
so it simply appears in the other member's list. `challengeSent` rides
`createLiveGame`'s challenge branch; `challengeAnswered` has to ride the
challenged side's **first move**, which means `appendMove` needs to know it is
the first move by that seat of a game that was created as a challenge. XP-04
owns that and should say in its plan how it tells, or drop the award.

**The seat-claim route moved.** It is
`src/app/games/[slug]/match/[id]/seat/[token]/route.ts`, moved on 2026-09-11
from `src/app/games/[slug]/[id]/seat/[token]/route.ts`. A branch cut before
that move will silently re-create the old file and wire `seatClaimedElsewhere`
into an address no seat link reaches — present, tested, green, never executed.
XP-06 must rebase onto `main` first and then prove the award by driving a real
seat link, not by importing the module.

**And the operator is not a member.** `currentMemberId()` returns null for the
admin session and `touchMember` returns early. `awardXp` must tolerate a member
id with no row silently, the way `recordPlayed` does.

## The constants table

`src/lib/xp/xp.constants.ts`, in the style of `VARIANT_SPECS`,
`BACKLOG_STATUSES` and `RATING_POOL_DISPLAY`: a keys table with
`as const satisfies Record<K, K>`, and one display/behaviour table keyed by it.
Adding an event is one row.

```ts
export const XP_EVENTS = {
  joined: "joined",
  dailyVisit: "dailyVisit",
  // … one line per type …
} as const satisfies Record<XpEventType, XpEventType>;

export type XpEventSpec = {
  points: number;
  label: string;
  kanji: string;
  /** The sentence a toast says. Second person, present tense. */
  sentence: string;
  /** What the member reads on their history, where the label is too terse. */
  blurb: string;
  /** Events of this type allowed in one day. Absent means no allowance. */
  cap?: number;
  /** Gated by the day's allowance on gameFinished. Milestones never are. */
  ridesAllowance?: true;
  /** Kept for old events to explain themselves. Never delete a row. */
  retired?: true;
};

export const XP_EVENT_SPECS: Record<XpEventType, XpEventSpec> = { … };
```

One table, not UmaKuma's two. Its split between `XP_AWARDS` and `XP_BONUSES` is
readability — a reader should be able to see the routine economy without the
exceptional one on top — and it buys a merged lookup, an `isXpBonusKind`, and
two things to remember to add a row to. Here the `cap` and `ridesAllowance`
fields already say which half a row is in, so a second map would be a third way
of saying it.

## What each ticket builds

XP-01 and XP-02 gate the rest. After XP-02 lands, XP-03 to XP-07 can run in
parallel; XP-08 to XP-10 need the curve and the names.

| Ticket | Builds | Files it owns | Needs |
|---|---|---|---|
| **XP-01** | this design, the curve, the seam, the schema | `docs/plans/xp/*`, `src/lib/xp/xpCurve.ts` | — |
| **XP-02** | the ledger: migration, `awardXp`, the constants table, and `joined` / `dailyVisit` / `gameFinished` / `gameWon` wired end to end | `prisma/schema.prisma`, `prisma/migrations/*`, `src/lib/xp/xp.constants.ts`, `awardXp.ts`, `xpDay.ts`, `xpFlash.ts`, `xpFlash.actions.ts`, plus riders in `members.ts` and `playedRun.ts` | XP-01 |
| **XP-03** | the tour: `firstOfVariant`, `firstWinAtVariant`, `firstOfFamily`, `everyVariantPlayed`, `everyFamilyPlayed`. Decides whether `GAME_FAMILIES` gets a key | `src/lib/xp/xpTour.ts`, `src/lib/gomoku/families.ts` | XP-02 |
| **XP-04** | people: `firstBuddy`, `buddyAdded`, `challengeSent`, `challengeAnswered`, `rematchPlayed`, `forkPlayed`, `timeGiven`, `applauseGiven`, and the identity five | `src/lib/xp/xpSocial.ts`, riders in `buddies.ts`, `api/games/live/route.ts`, `api/me/route.ts`, `phraseStore.ts`, `applause.ts` | XP-02 |
| **XP-05** | the game's own awards: `wonVsPerson`, `wonVsBuddy`, `revengeWin`, `longGame`, `winStreak3/5/10`, `gradeBeaten`, `everyGradeBeaten`, `specialistBeaten`, `comeback` **or a written refusal**; and what a game paid, recorded so a 0 can be explained | `src/lib/xp/xpGame.ts` (pure), `xpGameServer.ts`, one column on `Game` | XP-02 |
| **XP-06** | habit: `dayStreak7/30/100/365`, `weekendGame`, `backFromAway`, `seatClaimedElsewhere` | `src/lib/xp/xpHabit.ts`, riders in `members.ts` and the seat route | XP-02 |
| **XP-07** | the toasts. `XpToast.tsx`, `XpToastHost.tsx`, mounted in `SiteHeader`, against `XpToastProps` above | `src/components/xp/*`, `src/components/layout/SiteHeader.tsx` | XP-02 |
| **XP-08** | `/xp` — the leaderboard, ranked by `Member.xp`, bots excluded, every name a link and every count a link | `src/app/xp/page.tsx`, `src/components/xp/Leaderboard*.tsx` | XP-02, names |
| **XP-09** | a member's own XP: total, level, progress, and the history, paged in the database | `src/app/players/[id]/xp/*`, `src/lib/xp/xpHistory.ts` | XP-02, names |
| **XP-10** | the ladder: all hundred levels with their names, costs and notes, a page per level, `LevelName` beside every player name | `src/app/xp/levels/*`, `src/components/xp/LevelName.tsx`, `src/lib/xp/levelNames.ts` | curve, names |
| — | the hundred names | `src/lib/xp/levelNames.constants.ts` | XP-01's interface |

### Two gates every one of them is held to

**Nothing Is A Dead End.** Every game name goes through `GameName`, every count
through `GameCount` filtered to exactly what it counted, every player name
through `PlayerName`. `gameLinks.coverage.test.ts` runs in `pnpm test:unit` and
will fail the build. An XP history that prints "Renju" flat, or "12 games" with
nothing behind it, is the fault that has already been made on four pages.

**Show The Data, Not The Way To It.** The leaderboard belongs on `/xp`, not one
click under it. A member's XP belongs on their page, not behind a link. And an
empty table is data: a member with no XP yet gets the headings, the shape, and
"be the first" as a link — `/join` for a stranger, worded as an invitation.

## What was asked for, in John's words

Kept verbatim because the catalogue above is an interpretation of it, and the
next person to read this should be able to check the interpretation rather than
inherit it.

> "Study the XP system of UmaKuma. We want the XP system for this website
> ITSUTSU too. Go over all the things people do. We give them points for
> everything like: logging in · playing a game · points for every new game type
> played · for every variant · winning over a friend · winning after losing to a
> friend · getting a winning streak · coming back after a vacation · playing on
> the weekend · think of other reasons that are fun · look at the reasons in
> UmaKuma · adding your first buddy · since this is a gaming site, it might be
> easier to come up with all the reasons · have the same nice-looking toasts
> coming from the top when the points happen · have a new page, XP leaderboard,
> to see your rankings compared to other users · XP levels can go to 100 (64 if
> you are having issues) · XP levels all have gaming names, should be from video
> game consoles to terms to video games — retro games, modern ones, best
> sellers, etc. — think of as many cool terms, from cool all the way to coolest
> ever; it's a little judgement call sure, but list out all 100 names, in order;
> sometimes you might want to go XXX 1, XXX 2, XXX 3 but they should be spaced
> out · fill out any things that I've missed · this should be built now."

And: *"You will show XP in a person's profile, XP history, etc."*

And on 2026-09-13, having read the first ladder, the rebalance — quoted in full
under "Rebalanced to a 999,999 top" at the head of this file.

**Every item in that list is in the catalogue.** The additions — "fill out any
things that I've missed" — are: the tour bonuses for every variant and every
family, the computer grades and the specialists, the courtesy awards on
`TimeGift` and `Applause`, `challengeSent`/`challengeAnswered`,
`rematchPlayed`, `forkPlayed`, `longGame`, `comeback`, and the identity five.

**100 levels, not 64.** The names file is specified at exactly one hundred rows,
and nothing about the arithmetic made 64 the easier answer. The first ladder
reached level 100 at three committed years; the rebalanced one, at John's
999,999, reaches it at about nineteen — see "The trade, which John asked to see".
