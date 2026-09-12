# XP on Itsutsu: the design

What earns points, what a point is worth, how a level is named, how a toast
reaches the screen, and what each of the ten tickets builds. Modelled on
UmaKuma's system (the `umakuma` repository, `src/lib/xp/`), which is the
reference for the feel, and departing from it where this site is a different
shape. Every departure is argued below rather than left as a difference.

Read this before XP-03 to XP-10. If this file and the code disagree, the code
moved after the file was written; say so in the board row and follow the code.

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
- **A stored curve, not a formula in code.** `xpCurve.ts` holds one hundred
  costs as a table so the economy can be retuned by editing numbers. Every
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
| once per family | the family title | `firstOfFamily` |
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

### Arriving and coming back

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `joined` | 25 | `""` | — | The first line in your history should not be blank. Small, because turning up is not an achievement. |
| `dailyVisit` | 5 | day key | — | The habit. Deliberately the smallest repeatable award: the site must not reward opening a tab over playing. |
| `dayStreak7` | 30 | day key | — | A week of days. The first one that takes holding. |
| `dayStreak30` | 100 | day key | — | |
| `dayStreak100` | 300 | day key | — | |
| `dayStreak365` | 1000 | day key | — | Repeats, so it is worth repeating for. |
| `weekendGame` | 5 | ISO week | — | John asked for it. Once a weekend, not once a game, or it is just a second `gameFinished` with a calendar. |
| `backFromAway` | 25 | `awayUntil` date | — | The away dates are already on the profile (`Member.awayFrom`/`awayUntil`). Coming back is the moment a site either keeps somebody or does not. |

### Playing

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `firstGameEver` | 50 | `""` | — | Twice the biggest single-game award. The first game is the whole conversion. |
| `gameFinished` | 10 | game id | 6/day | A lost game still counts — finishing is the courtesy correspondence play depends on. Capped because hot-seat tic-tac-toe against yourself takes ten seconds. |
| `gameWon` | 20 | game id | 6/day | Twice a finish. Winning is better; it is not four times better, or the site rewards only the strong. |
| `wonVsPerson` | 10 | game id | 6/day | On top. A person is harder than a bot and this is a site for playing people. |
| `wonVsBuddy` | 15 | game id | 6/day | On top again. John's list names it; beating a friend is the point of a family site. |
| `revengeWin` | 30 | `<opponentId>:<variant>` | — | John's "winning after losing to a friend". Once per rivalry per game, so it is the turn-around that pays and not every subsequent win. |
| `longGame` | 10 | game id | 6/day | Past `XP_LONG_GAME_MOVES` (60). A game that went the distance. |
| `comeback` | 30 | game id | — | Won from a position the engine had you losing. **Conditional on XP-05** finding an honest measure — see "What must not be guessed". |

### The tour: thirty-nine games nobody has met

This is the part that is not a copy of UmaKuma, and it is the reason to build
XP here at all. There are 39 variants in `RULE_VARIANTS` and 11 families in
`GAME_FAMILIES`, and most of them have barely been played. XP is the site's
tour guide.

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `firstOfVariant` | 25 | variant key | — | 39 × 25 = 975. Two and a half games' worth for trying one new thing. |
| `firstWinAtVariant` | 20 | variant key | — | 39 × 20 = 780. Trying is rewarded; understanding is rewarded again. |
| `firstOfFamily` | 50 | family title | — | 11 × 50 = 550. A family is a bigger step than a sibling variant. |
| `everyFamilyPlayed` | 200 | `""` | — | All eleven. Reachable in a fortnight by somebody curious. |
| `everyVariantPlayed` | 500 | `""` | — | All thirty-nine. The largest single award on the site, and it should be. |

**Families have no key.** `GAME_FAMILIES` in `families.ts` is an array of
anonymous objects identified by `title`, so the subject for `firstOfFamily` is
the title string. XP-03 may add a `key` to each family; until it does, a
retitled family re-awards, and that is the honest trade of using a display
string as an identity. Flagged rather than hidden.

### The computer ladder

`BOT_TIER_LIST` is the five graded bots — `razryad`, `kyu`, `dan`, `meijin`,
`guoshou`. `BOT_SPECIALIST_LIST` is `tamenoki` and `meritalu`, who play one game
each and are deliberately **not** on the ladder.

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `gradeBeaten` | 40 | bot tier | — | 5 × 40 = 200. Twice a win over a person, because a grade can only be beaten once. |
| `everyGradeBeaten` | 250 | `""` | — | John named it. Beating Guoshou is a real afternoon; beating all five is the site's hardest ordinary goal. |
| `specialistBeaten` | 50 | bot tier | — | 2 × 50 = 100. More than a grade because there is no ladder to climb to them — you have to go and find their game. |

### People

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `firstBuddy` | 50 | `""` | — | John's list names it. A site with one person on it is a demo. |
| `buddyAdded` | 10 | buddy member id | 3/day | Small and capped: a buddy list is not a score. |
| `challengeSent` | 5 | game id | 3/day | Asking is cheap, and should be — but it is the thing that starts everything. |
| `challengeAnswered` | 10 | game id | 6/day | Answering is what actually makes a game. **There is no accept route** — see "Where the seams are". |
| `rematchPlayed` | 10 | game id | 6/day | A rematch is the sign a game was worth playing. |
| `forkPlayed` | 15 | game id | 6/day | More than a rematch: a fork is somebody studying a position. |
| `timeGiven` | 10 | game id | 3/day | `TimeGift` already records courtesy time. Sportsmanship is worth paying for and almost impossible to farm. |
| `applauseGiven` | 5 | game id | 3/day | `Applause` is one row per member per game. |

### Who you are

| Type | Points | Subject | Cap | Why this many |
|---|---|---|---|---|
| `nameSet` | 10 | `""` | — | |
| `countrySet` | 10 | `""` | — | John's list names it. |
| `bioSet` | 20 | `""` | — | More, because it takes writing something. |
| `wordsSet` | 20 | `""` | — | The four words. |
| `seatClaimedElsewhere` | 25 | game id | — | John's list names it: a seat claimed on somebody else's device with the words. The site's cleverest feature, and nothing currently celebrates it. |

**One-off total: 3,740 XP** — `joined` 25, `firstGameEver` 50,
`firstOfVariant` 975, `firstWinAtVariant` 780, `firstOfFamily` 550,
`everyFamilyPlayed` 200, `everyVariantPlayed` 500, `gradeBeaten` 200,
`everyGradeBeaten` 250, `specialistBeaten` 100, `firstBuddy` 50, identity 60.

That is a deliberate figure: **playing one game of everything, meeting every
family and beating every computer is worth level 21 on its own.** The tour is a
fifth of the ladder. Thirty-nine games nobody has played is the problem this
site actually has, and the economy should be pointed at it.

### How the day's allowance works, and what it must say

The allowance gates the *result* awards and nothing else: `gameFinished`,
`gameWon`, `wonVsPerson`, `wonVsBuddy`, `longGame`, and the social ones with a
cap in the table. **It never gates a first-time or milestone award.** This is
UmaKuma's reasoning and it holds here: beating Guoshou for the first time on
your seventh game of the day is not the thing worth rationing, and telling
somebody nothing happened is the failure the cap exists to prevent, not to
cause.

So the rule is one sentence: **the result awards for a game fire only if that
game's `gameFinished` was actually paid.** One test, one place, and a game that
falls outside the day's allowance is silent as a whole rather than paying for
being won but not for being finished.

**And where it is silent, something must say so.** UmaKuma shipped that exact
hole. XP-05 records what a game paid and why it paid nothing, and XP-09 prints
it. A 0 with a reason beside it is information; a 0 alone is indistinguishable
from broken.

### What must not be guessed

`comeback` is in the table with a condition on it, and the condition is the
whole of AGENTS.md's "Nothing Answers What It Cannot Answer". The award needs a
position the engine can call losing. If `analysis.ts` / `winChance.ts` cannot
answer for a variant — and it cannot for several: `analysis: false` is set on
the twists, the flips and more — then **the award does not fire for that
variant**. It does not fire at a default. A distance measure that returned 0 for
"I cannot read this board" would have drawn every game of a variant for a
reason that was never true; a comeback bonus that treats "no reading" as "was
losing" pays everybody for every win.

Silence is the safe answer. XP-05 must state which variants can earn `comeback`
and the rules page must say so, or the award must be dropped.

### Bots do not earn XP, and this is not an oversight

The computer players are real `Member` rows with real ratings and real streak
columns. `recordPlayed` — the write XP rides for a finished game — carries
their `playedStreak` forward today and filters only on the seat being bound.

**A naive `awardXp` would put Meijin on the XP leaderboard.** Worse, it would
put Meijin at the top of it, because bots play constantly.

So `awardXp` refuses a member whose `botTier` is not null, at the top, before
reading anything. Stated in the constants file, tested in XP-02, and the
leaderboard filters on it again in XP-08 — twice, because the leaderboard is
where it would be visible and the awarder is where it would be true.

## The curve

One hundred levels. Held as a table in `src/lib/xp/xpCurve.ts`, every cost
ending in a 0 or a 5, strictly increasing, with a test asserting the sequence
rather than trusting the generator that made it.

**Two parts.** Levels 1–10 are a flat ramp — 20, 40, 60 … 200 — so early
progress is quick and legible. Level 11 continues the ramp at 220 so there is
no step down at the handoff, and from there the cost compounds at **2.415% a
level, doubling every 29**. The rate is solved, not chosen: it is whatever
carries the remaining ninety levels from 220 to the target total.

```
 20,   40,   60,   80,  100,  120,  140,  160,  180,  200,
220,  225,  230,  235,  240,  250,  255,  260,  265,  275,
280,  285,  295,  300,  305,  315,  320,  330,  340,  345,
355,  365,  370,  380,  390,  400,  410,  420,  430,  440,
450,  460,  470,  485,  495,  505,  520,  530,  545,  560,
570,  585,  600,  615,  630,  645,  660,  675,  690,  710,
725,  745,  760,  780,  800,  815,  835,  855,  880,  900,
920,  945,  965,  990, 1015, 1035, 1060, 1090, 1115, 1140,
1170, 1195, 1225, 1255, 1285, 1315, 1350, 1380, 1415, 1450,
1485, 1520, 1555, 1595, 1630, 1670, 1710, 1755, 1795, 1840,
```

Total to level 100: **68,155 XP**.

### What a player actually reaches, which is the reason for the numbers

A day's repeatable earning, from the catalogue above:

- **Committed** — signs in daily, a few games running, finishes about two a day
  and wins half: `dailyVisit` 5 + two `gameFinished` 20 + one `gameWon` 20 +
  `wonVsPerson` 10 = **55 a day**, about 60 with the weekend and the day-streak
  milestones amortised in. **~21,900 a year.**
- **Casual** — four days a week, finishes three games a week, wins half: **~100
  a week, ~5,200 a year.**

| | XP | Level |
|---|---|---|
| Casual, first month (with the first few tour awards) | ~1,275 | **11** |
| Casual, first year | ~7,700 | **33** |
| Casual, three years | ~20,000 | **58** |
| Committed, first month | ~3,300 | **20** |
| Committed, first year | ~25,000 | **64** |
| Committed, two years | ~47,000 | **86** |
| Committed, three years | ~69,000 | **100** |
| The tour alone, no repeatable play | 3,740 | **21** |

Four decisions fall out of that table, and they are the design:

1. **Level 11 in the first month for a casual player.** Ten levels in four
   weeks is what makes somebody keep going. UmaKuma learned this the hard way:
   a ladder whose first rungs already compound gives a new member nothing to
   hold on to.
2. **Level 100 at three years of committed play**, the same target UmaKuma
   calibrated to. John's parents played on ItsYourTurn for years; three years is
   the right order for a family correspondence site.
3. **A casual player never maxes, and that is correct.** Level 58 after three
   years of a few games a week is a real standing, and the top of the ladder
   should mean something.
4. **The back half is where it bites.** Level 64 arrives in a committed year;
   the last 36 levels cost 43,000 XP, 63% of the whole ladder. Generous early,
   demanding late.

**How to retune.** The table is generated by solving for a target total;
`docs/plans/xp/curve.py` holds the twenty lines that do it. Change the target,
regenerate, paste. Do not hand-edit one row — the test asserts strict increase
and will catch it, but the shape is the decision and a single edited row is not
a shape.

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

## Where the seams are

Every award rides a write that already happens. Nothing is called from a page.

| Award | Rides | File |
|---|---|---|
| `dailyVisit`, `dayStreak*`, `backFromAway` | the `lastSeenAt` write | `src/lib/auth/members.ts` → `touchMember` |
| `joined` | `admitMember`'s create branch | `src/lib/auth/members.ts:97` |
| `gameFinished`, `gameWon`, `wonVs*`, `revengeWin`, `longGame`, `winStreak*`, `firstOf*`, `gradeBeaten`, `comeback` | **`recordPlayed`** | `src/lib/rating/playedRun.ts:132` |
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

**Every item in that list is in the catalogue.** The additions — "fill out any
things that I've missed" — are: the tour bonuses for every variant and every
family, the computer grades and the specialists, the courtesy awards on
`TimeGift` and `Applause`, `challengeSent`/`challengeAnswered`,
`rematchPlayed`, `forkPlayed`, `longGame`, `comeback`, and the identity five.

**100 levels, not 64.** The curve reaches it with a committed player at three
years and the names file is specified at exactly one hundred rows. Nothing about
the arithmetic made 64 the easier answer.
