# NUM-05. Race a friend: the same puzzle, two clocks

Part of `numbers-a-new-family-of-puzzles-starting-with-sudoku`, released on
its own because it **needs a migration**: two tables, `PuzzleRace` and
`PuzzleSolve`. Needs NUM-02 on `main`, John's word, a Neon branch and a
dump first (AGENTS.md "Back It Up Before You Migrate It"), and its own push
with nothing else in it.

## Why

John: "if we want to make it 2 person, we could give each person the same
puzzle and time them, where they should do it in one sitting with a client
side timer, etc... should cost me nothing, no server calculations."

## The decision

- **Two rows, kept, so a solve is a fact the site can show.** Without a
  table, a puzzle's page can promise nothing — no "your best time", no
  "fastest here", and a race has nowhere to live. `PuzzleSolve` keeps every
  member's finished puzzle (solo or in a race); `PuzzleRace` is the pair.
- **Not a `Game` row.** A race has no colours, no move list and no rating,
  and every reader of `Game` — replay, the queue, the record, `settleEnded`
  — would have to learn to skip it. A table of its own is the honest shape,
  and the address stays the site's: `/games/number-place/match/<id>`.
- **Honesty that costs nothing per move.** The creator's browser generates
  the puzzle and posts givens and solution once; the server checks the pair
  in O(cells) and stores both. Each player presses Start, and the server
  writes `startedAt`; on completion the browser posts the answer once, the
  server checks it against the stored solution in O(cells) and writes
  `finishedAt`. The time is the server's difference, not the browser's
  timer, so a clock in the browser is for the player and cannot be argued
  with. One sitting: a start with no finish inside `RACE_SITTING_MS` (two
  hours) counts as given up when the race is read — evaluated on read,
  never by a timer. The solution never leaves the server to the other seat;
  the creator's browser held it, which is the same trust the site already
  places in a browser that plays a computer's move.
- **Winner.** The faster correct solve. One correct finish and one given up
  is a win; two given up is nothing. A wrong answer is refused (422) and the
  player may try again — the clock is still running, which is its own
  penalty. No rating moves; XP pays `puzzleSolved` to both finishers and
  `raceWon` (50, the price of `gameWon`) to the winner, keyed on the race.
- **No polling under fifteen seconds.** A race page reads the other seat's
  state on load and on focus, and once more when the reader finishes.

## Schema

```prisma
model PuzzleSolve {
  id         String   @id @default(cuid())
  memberId   String
  kind       String
  size       Int
  level      String
  givens     String
  /// Written when the answer was checked; the answer itself is not kept.
  finishedAt DateTime
  /// From the browser for a solo solve, from the server's two stamps in a race.
  elapsedMs  Int
  raceId     String?
  race       PuzzleRace? @relation(fields: [raceId], references: [id], onDelete: SetNull)
  @@index([memberId, finishedAt])
  @@index([kind, size, level, elapsedMs])
}

model PuzzleRace {
  id           String    @id
  createdAt    DateTime  @default(now())
  kind         String
  size         Int
  level        String
  givens       String
  solution     String
  hostMemberId String
  guestToken   String    @unique @default(cuid())
  guestMemberId String?
  offeredToMemberId String?
  hostStartedAt    DateTime?
  hostFinishedAt   DateTime?
  guestStartedAt   DateTime?
  guestFinishedAt  DateTime?
  solves       PuzzleSolve[]
  @@index([hostMemberId])
  @@index([guestMemberId])
  @@index([offeredToMemberId])
}
```

The id is made by `makeGameId` like a game's. `docs/DATA_MODEL.md` gets both
tables; `/privacy` says a solve is kept (`PRIVACY_CHANGED` moves).

## Exact changes

- Routes: `POST /api/puzzles/races` (create, from the set-up's "Race a
  friend": an opponent from the site's lists or a link), `POST
  …/races/[id]/start`, `POST …/races/[id]/finish`, `GET …/races/[id]`
  (givens, both seats' state, never the solution).
- Pages: `/games/<slug>/match/[id]` branches on `puzzleFor(slug)` to
  `PuzzleRacePage`; the seat link `/match/[id]/seat/[token]` claims the
  guest seat as a game's does. `/games/<slug>/me` lists the member's solves
  and races; `/games/<slug>/standings` is the fastest solves per size and
  level, people only, with `GameCount`-style links to the solves counted.
- `POST /api/puzzles/solved` (NUM-02) writes a `PuzzleSolve` as well.
- The queue (`/play`) shows a race waiting on you; the masthead line counts
  it. Email or push says nothing new: a race is an offer like a game's
  (`offeredToMemberId`), answered in the inbox.

## Order on the day

1. NUM-02 live. 2. Neon branch `before-puzzle-races-<date>`, dump to DS1.
3. Push this alone; `prisma migrate deploy` runs before the build. 4. Load
`/games/number-place` once.

## Release summary

"Race a friend at any puzzle: the same grid, two clocks, and the faster correct solve wins — and every solve is kept, with the fastest on the puzzle's page."
