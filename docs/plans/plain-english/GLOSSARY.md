# Plain English across the site: the glossary

Board row: `plain-english-across-the-site-every-button-label-and-title-reads-as-a-native-spe`.

John, 2026-09-29: "fix all the weird English we use... 'The object 目的' —
that's just Objective, 'Played here 棋譜' is probably 'Game History'. Who is
best at it 名人 == Leaderboard??? ... Re-evaluate entire site English for
buttons and labels and titles."

What went wrong: headings were written as a gloss of the Japanese beside them,
or reached for a literary turn ("Who is best at it", "Played here", "All of
it"). This file is the list of every label changed, so the next person to name
something uses the word already chosen for it.

## The rules this list follows

- **The word a player already knows**: Leaderboard, Game history, Objective,
  Rules, How to play, Moves, New game, Your turn, Online now, Filtered by.
- **Sentence case** for titles, headings, tabs and buttons ("New game", "Game
  history", "Full rules"). The site already wrote almost everything that way;
  this keeps it and makes the stragglers match. Proper names and game names
  keep their capitals.
- **One word for one thing.** Each concept below has one label on every page.
- **The kanji stays.** It changes only where the English it sits beside now
  means something else, and every such change is marked in the "Kanji" column.
- **Addresses, test ids, database values and enum names do not change.** A
  rename of an address is listed at the end as a recommendation only.
- Play leads to set-up, Start begins a game (John, 2026-09-25). Unchanged.

## One word for one thing

| Concept | The label everywhere | No longer |
|---|---|---|
| The rating ranking of one game | **Leaderboard 番付** | Who is best at it 名人, Standings 名人, standings, the whole ladder |
| Who has won the most IP | **IP leaderboard 点数番付** | (unchanged) |
| Every finished game, replayable | **Game history 棋譜** | Record 棋譜, Played here 棋譜, Every game played here, the record |
| A reader's own games of one game | **Your games 自分の棋譜** | Your own games of it |
| The list of moves in a game | **Moves 棋譜** | Record 棋譜 (the panel), Move list 棋譜 |
| What a game is won by | **Objective 目的** | The object 目的, Object 目的 |
| The rules document | **Full rules 規則** / **How to play** | The whole rules of…, How it is played |
| A game's group of related games | **Family 同族** | Its family |
| The board to try a game on | **Practice board 試し打ち** | Try the board 試し打ち |
| The screen that sets a game up | **New game 新規対局** | Set up a game 対局設定 |
| Members who were seen lately | **Online now 在室** | Here now 在室 |
| A list narrowed by a filter | **Filtered by** | Narrowed to |
| Going up a level | **Level-up 昇級** | Promotion 昇級 |
| A game still being played | **In progress 対局中** | Going 対局中, going, Nothing going, active |
| Who opens a game, chosen by chance | **Random** | Drawn by lot |
| Neither side ahead | **Even 互角** | Level 互角 (clashed with the XP "Level") |
| Colours changing hands | **Swap colours** | Swap seats |

## Meikyuu's stones (2026-10-05)

| Concept | The label everywhere | No longer |
|---|---|---|
| The marble laid beside the line in a maze, which the line cannot enter | **Stone** | marble, blocker, pebble |
| How many more may be laid | **Stones left** | stones remaining |
| The count laid, where there is no limit | **Stones laid** | stones used |
| The setting for how many may lie at once | **Stones**: **A few** or **As many as I like** | limited, unlimited |

## Meikyuu over a solid (2026-10-05)

| Concept | The label everywhere | No longer |
|---|---|---|
| The mazes over the surface of a solid, a shape of the set-up | **3D** 立体 | solid mazes, 3-D, three-dimensional |
| The four solids | **Cube**, **Sphere**, **Octahedron**, **Icosahedron** | box, ball, globe, bipyramid |
| Moving the solid round to see another side | **Turn** (the arrows: **Turn left**, **Turn right**, **Turn up**, **Turn down**) | rotate, spin, orbit |
| Bringing the end of the line round to the front | **Face me** | centre, follow, recentre |
| Every drag turns the solid, and draws nothing | **Turn only** | rotate mode, view mode |
| A solid's sizes | **Small**, **Medium**, **Large** (the step under the tiles) | tiny, huge |

## Header, footer and account

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Game history | Record | 棋譜 (unchanged) | `i18n.constants.ts` `nav.record` | "Record" also means a W–L–D record; this page is every finished game |
| All games | Every game | 全種目 (unchanged) | `i18n.constants.ts` `nav.everyGame` | the usual words for the full list |
| No games in progress | Nothing going | — | `StripGames.tsx` | "going" is not how a game site says in progress |
| {n} in progress | {n} going | — | `StripGames.tsx` | same, and the same words as the My games tab |
| Your account | You | — | `app/me/page.tsx` (`<title>`) | a tab title that says what the page is |
| What's new | What has shipped | 更新履歴 (unchanged) | `app/releases/page.tsx` | the account menu already calls it "What's new" |
| Page not found | nothing here | 何もない (unchanged) | `app/not-found.tsx` | the standard words |
| Games · Home · Game history | The games · The board · The record | — | `app/not-found.tsx` | plain link names; "The board" went to the home page |

## Game pages (a game's front door, rules, leaderboard)

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Objective | The object | 目的 (unchanged) | `app/games/[slug]/page.tsx`, `PuzzleFrontDoor.tsx`, `PartyFrontDoor.tsx` | John's example |
| Objective | Object | 目的 (unchanged) | `i18n.constants.ts` `rules.object`, `RulesModal.tsx` | same word as the front door |
| How to play | Play | 手順 (unchanged) | `i18n.constants.ts` `rules.play`, `RulesModal.tsx` | a rules section called "Play" reads as a button |
| Full rules of {game} → | The whole rules of {game} → | 規則 (unchanged) | front door ×3 | plain |
| Practice board | Try the board | 試し打ち (unchanged) | `app/games/[slug]/page.tsx`, `play/page.tsx` trail | the board's own panel already says "Practice board" |
| Game history | Played here | 棋譜 (unchanged) | `PlayedHere.tsx` | John's example |
| Looking for a game | Anyone for a game | 対局募集 (unchanged) | `PlayedHere.tsx` | plain |
| Leaderboard | Who is best at it | 番付 (was 名人) | `GameLadder.tsx` | John's example; 名人 is a title, not a ranking |
| Full leaderboard → | The whole ladder → | — | `GameLadder.tsx` | one word for it |
| More on this game | All of it | 一覧 (unchanged) | front door ×3 | "All of it" says nothing |
| Rules · Game history · Your games · Leaderboard · Family · Background | Rules · Every game played here · Your own games of it · Standings · Its family · Background | 規則 · 棋譜 · 自分の棋譜 · 番付 (was 名人) · 同族 · 背景 | `app/games/[slug]/page.tsx` | the facet list, one word each |
| Leaderboard | Standings | 番付 (was 名人) | `standings/page.tsx` title and trail, `PuzzleStandingsPage.tsx` | one word for it |
| Leaderboard → | Standings → | — | `i18n.constants.ts` `catalogue.standings` | same |
| leaderboard · history | standings · record | — | `GameList.tsx`, `standings/page.tsx`, `PuzzleRecordPage.tsx` link rows | same |
| Family | Its family | 同族 (unchanged) | `GameFamily.tsx`, the panel's heading when a game is alone in its family | one word for it |
| Total | All of it | — | `LegacySource.tsx`, a kept record's footer row | plain |
| Local time 01:12 | 01:12 where they are | — | `Whereabouts.tsx`, on a player's page | plain |
| Strength by game | Measured game by game | 実力 (unchanged) | `LadderStrength.tsx` | plain |

## Set-up

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| New game | Set up a game | 新規対局 (was 対局設定) | `SetUpHeading.tsx`, `app/games/new/page.tsx`, `RefusedOfferPage.tsx` | the button that leads here says New game |
| New game of {game} | Set up {game} | — | `app/games/[slug]/new/page.tsx` (`<title>`) | same |
| Before the game | Before the first stone | — | `Conversation.tsx` | the notes said before move one |
| How to play | How it is played | — | `SetUpHeading.tsx`, `begin/page.tsx`, `PuzzleSetUpPage.tsx` | the usual words |
| All games | Every game there is | — | `SetUpHeading.tsx` | plain |
| Opponent | Who you play | 対戦相手 (unchanged) | `live.constants.ts` | the tile row is already headed "Opponent" |
| Rules | The rules | 規則 (unchanged) | `live.constants.ts` | no article on a heading |
| Ready to start | Before the first stone | 確認 (unchanged) | `live.constants.ts` | plain |
| Change settings | Change something | 変更 (unchanged) | `live.constants.ts` | plain |
| Go to game | Open the board | 対局へ (unchanged) | `live.constants.ts` ×2 | plain |
| Random | Drawn by lot | — | `live.constants.ts` | the colour chooser elsewhere says Random |
| More rules | The rest of the rules | 残りの規則 (unchanged) | `MoreSettings.tsx` | plain |
| Play on two devices | Play apart | 通信対局 (unchanged) | `StartSharedGame.tsx` | says what it is |
| Invite links | Seat links | 招待 (unchanged) | `InvitePanel.tsx` | plain |
| Online now | Here now | 在室 (unchanged) | `i18n.constants.ts` `setup.hereNow`, `mine.constants.ts` | the usual words |

## Play (the board and its panels)

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Cancel | Never mind | 取消 (unchanged) | `game.constants.ts` ×2 | a button's usual word |
| Swap colours | Swap seats | 交代 (was 駒交換) | `game.constants.ts` | it hands over a colour; 駒交換 is a shogi piece trade |
| Allow swapping colours | Allow swapping seats | — | `GameSettingsPanel.tsx`, `GameDefaultsForm.tsx` | same |
| Moves | Record | 棋譜 (unchanged) | `game.constants.ts` `moveHistory` | same word as every other move list |
| Games | Games | 種目 (was 遊び方) | `game.constants.ts` `browser` | 遊び方 means "how to play"; the games list is 種目 everywhere else |
| Place a single | Lay a single | — | `game.constants.ts` | "place" is the usual verb |
| Place the piece · Place the piece in hand: … | Lay the piece · Lay the piece in hand: … | — | `game.constants.ts` | same |
| Load moves | Walk through it | — | `game.constants.ts` (paste a game) | plain |
| Analysis | Awareness | — | `GameSettingsPanel.tsx` | the setting shows who is ahead and the threats |
| Describe the position · Show threats | Tell me how it stands · Show me the threats | 形勢 · 急所 (unchanged) | `game.constants.ts` | plain; not "Show who is ahead", which would read as the "Who is ahead" checkbox beside it |
| Hints per player | Hints each | — | `GameSettingsPanel.tsx` | plain |
| Flip the board · Flip the board back | Turn the board round · Turn the board back | — | `AppearancePanel.tsx`, `SharedGameControls.tsx`, `GameReplay.tsx` | the usual words |
| Waiting for an opponent 募集中. | Posted, and waiting for somebody 募集中. | 募集中 (unchanged) | `TurnBanner.tsx` | plain |
| Even | Level | 互角 (unchanged) | `advantage.constants.ts` | "Level" is the XP word here |
| Moves | Move list | 棋譜 (unchanged) | `GameReplay.tsx` | one word for it |
| Hide moves | Fold the moves away | — | `FamousReplay.tsx` | plain |
| Moves as text | The whole record as text | 記録 (unchanged) | `RecordText.tsx` | plain |

## Records, players and XP

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Game history | Record | 棋譜 (unchanged) | `RecordPage.tsx` (title and trail), `app/history/page.tsx`, `games/[slug]/history/page.tsx`, `FiledMatchPage.tsx` trail | John's word for it, and "Record" is also W–L–D |
| {puzzle} · All solves | {puzzle} · Record | 棋譜 (unchanged) | `PuzzleRecordPage.tsx`, `PuzzleSolvePage.tsx` trail, `games/[slug]/history/page.tsx` | a puzzle's history is its solves, as its front door says |
| Back to game history | Back to the record | — | `FiledMatchPage.tsx` | same |
| Saved in game history. | Filed in the record. | — | `mine.constants.ts` | same |
| Filtered by | Narrowed to | — | `i18n.constants.ts` `filter.narrowedTo`, `DirectoryNarrowing.tsx`, XP pages, `PuzzleRecordPage.tsx` | the usual words |
| Remove | Take off | — | `DirectoryNarrowing.tsx` | a button's usual word |
| Show everyone | Show everybody again | — | `DirectoryNarrowing.tsx` | matches the XP pages |
| Established ratings | Settled ratings | — | `DirectoryFilters.tsx` | the rating tiers are Unrated, Provisional, Established |
| Recently active | Seen lately | — | `DirectoryFilters.tsx` | the usual words |
| Vs bots | Vs computer | — | `PlayerFigures.tsx` | the site calls them bots |
| Message | Write | 手紙 (unchanged) | `PlayerActions.tsx` | the usual button word |
| Saved games | Games we have | — | `KeptGames.tsx` | plain |
| Recent level-ups | Recent promotions | 昇級 (unchanged) | `app/xp/page.tsx`, `xp/levels/page.tsx`, `xp/promotions/page.tsx` | a game site levels up |
| Level-up · Show older level-ups | Promotion · Show older promotions | — | `PromotionsTable.tsx`, `xp/promotions/page.tsx` | same |
| XP leaderboard | Who is where | 経験値 (unchanged) | `xp/levels/page.tsx`, `xp/promotions/page.tsx` | the page it links to is titled XP leaderboard |
| All levels | The hundred levels | 段位 (unchanged) | `xp/levels/page.tsx` | plain |
| All 100 levels | All hundred levels | 百級 (unchanged) | `MyXp.tsx` | plain |
| Players at this level | Standing here | 在籍 (was 居る) | `xp/levels/[level]/page.tsx` | says what the list is; 居る is a bare verb |

## My games and account

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| In progress | Going | 対局中 (unchanged) | `mine.constants.ts` | the usual words |
| The Practice board on any game's page starts one. | Try the board on any game's page starts one. | — | `mine.constants.ts`, empty Pass and play tab | the board's name now |
| No games in progress. | Nothing going. | — | `MyGamesList.tsx` | same |
| Puzzles in progress | Puzzles going | 解きかけ (unchanged) | `mine.constants.ts` | same |
| No puzzles in progress. · No online tables. · No games in progress. | No puzzles going. · No tables going. · No games going right now. | — | `mine.constants.ts`, `online.constants.ts`, `PlayerPlays.tsx` | same |
| no games in progress · {n} in progress | no games going · {n} going | — | `BuddyList.tsx` | same |
| Open games | Open seats | 対局募集 (unchanged) | `mine.constants.ts` | ItsYourTurn's word for games waiting for a player |
| Prefer not to say | Not saying | — | `ProfileForm.tsx` | the usual words |
| Show when I'm online | Show when I am here | — | `ProfileSends.tsx` | same |
| Clock for games on one device · Clock for games on two devices | Clock at this screen · Clock in a game on two devices | — | `GameDefaultsForm.tsx` | plain, and a pair |
| Reset to defaults | Back to the ordinary ones | — | `GameDefaultsForm.tsx` | the usual words |
| Your data | What Itsutsu holds about you | 保存情報 (unchanged) | `WhatWeHold.tsx` | plain |
| Create an invite link · New link | Make an invitation · Another | — | `InviteFriends.tsx` | plain |
| (privacy page) under Your data | under What Itsutsu holds about you | — | `privacy.constants.ts` | it names the heading above, which is now Your data |

## Puzzles

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| All solves | Every solve here | 棋譜 (unchanged) | `PuzzleFrontDoor.tsx` | plain |
| Your solves | Your own solves | — | `PuzzleFrontDoor.tsx` | same as the page it opens |
| Leaderboard · All solves | Fastest · Record | — | `WordSettingsPanel.tsx` (the Gomoji language rows) | the pages they open are the Leaderboard and All solves |
| First tap | What a tap does first | — | `puzzles.constants.ts` (Picture logic's pen chooser) | plain |
| Standard | Usual | 定番 (kept) | `lib/puzzles/puzzles.constants.ts` (the middle board size on the set-up tiles of Hidden Stones, More or less, Jigsaw, Towers and others) | the ordinary size is "Standard"; John, 2026-09-29: "Standard OK" |
| Sort: | Order: | — | `PuzzleRecordPage.tsx` | the usual word |
| Normal | As made | 爆 (unchanged) | `TsunagiHelpPickers.tsx` | plain; "Softer" beside it reads fine and stays |
| Portals · Classic | — (new, 2026-10-05) | 跳 · 定番 | `TsunagiMarksPicker.tsx`, `puzzles.constants.ts` (`TSUNAGI_CHIPS`) | a pair of linked rings in Tsunagi is a **Portal**, never a warp, teleporter or wormhole; the two sets of levels are Classic and Portals |

## Party games

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Players | At the table / At the board | 席 (unchanged) | `DotsGame.tsx`, `MancalaGame.tsx`, `PairGoGame.tsx`, `PartyBlocksStatus.tsx`, `PartyRaceGame.tsx`, `online.constants.ts` `seatsHeading` | the list of who is playing, Superghost's (`party.constants.ts` `GHOST_COPY.table`, with the party pictures' stamp re-taken; no picture changed) and Tenka's (`TenkaPlayers.tsx`) included |
| Start online game · Starting… · The game could not be started. | Set the table · Setting the table… · The table could not be set. | — | `online.constants.ts` | Start begins a game, everywhere; "online" keeps it apart from the one-device Start |
| Online table | At a table | 卓 (unchanged) | `online.constants.ts`, `tables/[id]/page.tsx` | says what the page is |
| Online tables · Finished tables | At a table · Tables finished | — | `online.constants.ts` (My games) | plain |

## Ending a game and starting another

John, 2026-10-02, at Tenka's front door and table: "Where is the option to start
a new game, rather than Continue/Resume? Where is the quit game or lose
button, aka Resign?… We have to be consistent for all games where there is an
ongoing game." One set of words, from `GAME_ENDING_COPY`
(`src/components/play/gameEnding.constants.ts`), for every kind of play.

| Now | Was | Where | Why |
|---|---|---|---|
| Continue → | Resume →, Continue your game of Yacht | every game's front door (`GameInProgressOffer`), the note above a puzzle's set-up (`SetUpKept`), which names the run: Continue your 3×3 · Easy | going back to a game is Continue, as My games says; Resume is only for un-pausing a clock |
| New game | Or start a new one, Yes start again, a small button in a corner | a front door beside Continue, and the row under every board (`GameEnding`) | the same name as the screen it leads to (New game 新規対局) |
| Resign | Give up (Sugoroku) | any game against somebody or something that can win it | the other side wins |
| Give up | Give up (no question asked) | a puzzle or patience played alone | there is no other side; it ends unsolved ("Given up" on the card at the end) |
| Cancel | Resign (a live game with no move played) | a live game with nothing played (`ResignButton`) | nothing was played, so there is nothing to resign |
| Keep playing | Cancel, No, leave it | the answer that does not end the game | says what stays |
| Start a new game | Yes, start again, Yes, start a new one | the answer that does | says the act, never "OK" |

## Home and About

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Meet the bots | Meet the programs | — | `home.constants.ts` | the site calls them bots |
| Bots | Programs | コンピュータ (was 棋士, John 2026-10-06: one word for bots) | `about.chapters.ts`, `about.engine.tsx` | same |
| How strong the bots are | The players that are not people | 棋力 (unchanged) | `about.bots.tsx` | plain; "The bots" was already a heading in the engine chapter |

## Admin (the operator only)

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Suspended | Shut | 停止 (unchanged) | `AdminMembers.tsx` | the usual word |
| Suspend account · Suspend | Shut the account · Shut it | — | `AdminMembers.tsx` | same |
| Reactivate | Open it again | — | `AdminMembers.tsx` | same |
| Remove name · Remove it | Take the name off · Take it off | — | `AdminMembers.tsx` | same |
| Maintenance mode | Being worked on | 整備 (unchanged) | `AdminSite.tsx` | same. The public maintenance page (`maintenance.ts`) keeps "being worked on": it is a sentence there, and it sits beside the gate |
| Suspended the account · Reactivated the account | Shut the account · Opened the account | 停止 · 再開 (unchanged) | `operatorLog.constants.ts` | the operator log says what the buttons now say |

## Results (how one game or puzzle ended)

John, 2026-09-29: "let's show a checkmark for success/win/ an appropriate icon
for loss/fail/quit any other icon for othe rste? incomlete/abanoned/something?"
Every single result on the site carries one of three marks beside its words
(`ResultMark`, decided by `resultMarks.ts` and `puzzleOutcome.ts`); a count of
wins and losses stays a number that links to its games.

| Words | Mark | Where it is said |
|---|---|---|
| You won · Won · Solved · Found | tick | a game a reader sat in, a card patience, a grid, a word |
| Black won · White won · X wins | tick | a game at one screen, the archive, a party table: a result reached, nobody's loss here |
| You lost · Given up · Out of time · Out of guesses · Out of swaps | cross | a loss, a puzzle left unsolved and why ("Not found" is no longer said of a Solitaire) |
| Draw · Unfinished · Ended, nobody won · Tied | bar | a draw, a game nobody finished, a shared tie |

Puzzle facts are named for the puzzle: Draw (Solitaire), Free cells, Suits
(Spider), Layout (Mahjong), Length (a word), Hand (Kumimoji), Lattice (Koushi),
Size otherwise; "Countdown" for the clock a player chose, "Help used" for a
head start or hints, and "Played on Itsutsu" under a replay.

## Second pass (2026-09-30: every ending, and words built from data)

Read at the end of every puzzle (solved, given up, out of time, out of
guesses) and every finished board game (won, lost, drawn, unfinished), at 390
and 1280 wide, and in the lists that keep them. The retired words below, like
every "Was" in this file, are held by `src/lib/i18n/plainEnglish.coverage.test.ts`.

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Result · Draw / Free cells / Suits / Layout / Length / Hand / Lattice / Size · Countdown · Help used | How it ended · Puzzle · Clock · Help | — | `PuzzleSolvePage.tsx` facts | each fact named for what it is; "Puzzle: draw 1" named nothing |
| Out of guesses · Out of time · Given up | Not found (for every unsolved puzzle) | — | `puzzleOutcome.ts`, the finished puzzle's page and My games | a Solitaire given up was "Not found" |
| Played on Itsutsu | Played here | — | the finished puzzle's replay | plain |
| Sep 30, 2026 (the reader's own date) | 2026-09-30 | — | the finished puzzle's breadcrumb and facts | a date a person reads |
| Game | Match | — | one game's page: its tab title and breadcrumb (`match/[id]`) | "Match" is the series of games (`MatchPanel`), so one game is a game |
| you were White | you are White | — | a finished game's row in My games | it is over |
| Puzzles finished · No puzzles finished yet. | Puzzles solved · Nothing solved yet. | 解いた (unchanged) | `mine.constants.ts` | the list holds puzzles given up and run out too |
| Rabbit countdown | rabbit | — | `puzzleClock.ts` `clockWord`, in My games and the fastest table | a bare "rabbit" in a line of facts read as an animal |
| Fox countdown, 2:10 left | fox, 2:10 left | — | `MyPuzzleRuns.tsx` | same |
| Sudoku (9×9, hard) | Sudoku 9×9 hard, Solitaire draw 1 easy | — | the feed's best times (`FeedNewsLine.tsx`) | a size and a level run together are not English |
| draw 1, easy | draw 1 easy | — | the fastest table and your solves (`RecordSolvesTable.tsx`, `PuzzleMePage.tsx`) | same |
| All your games · Your history | Every game | 履歴 (unchanged) | the History tab's heading (`mine.constants.ts`) and a kept game's way back (`kept.constants.ts`) | "Every game" was retired for the catalogue; this list is one reader's own |
| Carry on with Sudoku · Your Sudoku, finished 3 days ago | Carry on with numberPlace · Your numberPlace of 2026-09-30 | — | screen-reader labels on My games rows | the code's name for a game was read aloud |

## Left as they are, on purpose

- **Buddies**, **Four words**, **Pass and play**, **Fork**, **Friendly** (as
  against Rated), **Offers**: site feature names that read as plain English.
- **Ladder** on the Players page: the overall rating ladder across every game,
  a common games-site word, and a tab that has to fit a phone. The per-game
  ranking is the Leaderboard.
- **Champions 名人**: 名人 is the title of the player at the top, which is what
  a champion is.
- **Skip turn 捨て石**: it spends a stone on a far corner, which is what 捨て石
  (a sacrifice stone) means; it is not a pass.
- Rules text, the About chapters' prose, the privacy and terms pages, and the
  feed's sentences. Prose is out of scope; the unnatural sentences found are
  listed below instead of rewritten.

## Meikyuu 迷宮 (2026-10-02)

A new game, so no label of it is retired: these are the words it chose, from the
ones above, for the next maze or line game to use. Its size words are the
package's own (`sizeOf`), not ours.

| Label | Where | Word used, and why |
|---|---|---|
| Small · Medium · Large · Huge | the size tiles, the line over the board, My games | the package's four words for how many cells a maze has; the big number on the tile is only the size's place |
| Start level 12 | the set-up | Start begins, as everywhere (John, 2026-09-25) |
| All levels | the end card, My games | the board of levels at that size; not "Back to the levels" |
| Undo · Restart · Fit | under the board | the usual words; Restart clears the line, Fit shows the whole maze |
| − · + | under the board | zoom out and in, named for a screen reader as "Zoom out" and "Zoom in" |
| Square 四角 · Tall 縦 | the set-up's Shape choice (2026-10-05) | the two kinds of maze box: squares and shapes in four sizes, or the tall ones, two columns to three rows, for a phone held upright; "Tall", not "Portrait" or "Vertical", which are the words of a screen |
| Tall 6×9 · Tall 20×30 | the size line over the board, My games, the tile's caption | a tall size by its columns and rows; the tile's picture carries the same figures |
| Tiny · Little · Middle · Big · Bigger · Biggest | the tall size tiles | a word for how much maze there is; not Small to Huge, which are the squares' own |
| Bigger, to 20×30 → · ← Smaller, from 6×9 | the press under the tall tiles | six tall sizes, four tiles a shelf, the other shelf a press away |
| Auto · Upright · Lying down | the way-up choice, "Tall mazes, which way up" | Auto is upright on a phone held upright and on its side where that makes the maze bigger; "Lying down", not "Landscape" or "Rotated" |
| 12 of 256 · All solved ✓ · Your progress | the progress rows on the set-up and the front door | what there is to finish, said as a count; "Completed" and "Cleared" are not our words for a solved level |
| Every small level is solved: all 256. Well done! | the caption and the last solve's line | a size finished, said once in a line and never in a window |
| Move | under the board, beside Fit | while it is on, a finger drags the view of a zoomed maze and draws nothing; "Pan" is a map word and "Drag" says the gesture, not the mode |
| Slide the view when the line reaches the edge | the Colours window | the package's edge panning, a switch; not "Auto-scroll", which a reader takes for the page |
| New game | beside Pause | the shared control (`PuzzleNewGameBeside`), as on every puzzle |
| In and out · Find the goal · Out from the middle · Keys | a level's chips | the four ways to play a maze, named by where the line starts and where it has to get to |
| Difficulty | a level's chips | one word for how hard it measured, as on Tsunagi's and Suido's levels |

## Tobiishi 飛び石 (2026-10-05)

A new game, so no label of it is retired: these are the words it chose, from the
ones above (Meikyuu's, for the next level game to use).

| Label | Where | Word used, and why |
|---|---|---|
| Short · Medium · Long | the length tiles, the line over the board, My games | how long the shortest way is; the big number on the tile is the jumps (3, 6, 9). "Length", not "Size": a peg board has no side |
| Peg · Hole · Jump | the board, the line under it, the rules | the package's words for a piece, a place for one and a move; "Tap a peg, then the empty hole it should jump to" |
| Goal | the board, the chips, the rules | the dashed hole the last peg must be in; not "target" |
| Start level 12 | the set-up | Start begins, as everywhere |
| Undo · Restart | under the board | the usual words; Restart sets the pegs out again |
| Level 12 of 27 | the line over the board | a length's own levels, as Meikyuu's are numbered in a size |
| Difficulty | a level's chips | one word for how many jumps the shortest way has, as on Tsunagi's and Suido's levels |
| New game | beside Pause | the shared control (`PuzzleNewGameBeside`), as on every puzzle |

## Suido 水道: the huge boards (2026-10-05)

No label is retired: the huge boards took the words Meikyuu and Tsunagi chose for a board too big for a thumb.

| Label | Where | Word used, and why |
|---|---|---|
| − · + · Whole board 全体 | under a huge board | zoom out, zoom in, and back to all of it; a screen reader says "Zoom out" and "Zoom in". "Fit" is Tsunagi's and Meikyuu's word for the same press, and a phone's reader knows "Whole board" better; the board's own buttons in the package say the same |
| Vast · Vaster · Longest pipe | the 20×20, 28×28 and 20×50 tiles | the tile's big number is the side, as every size's is; the words are only the line under it |
| Bigger boards, to 28×28 → · Bigger boards, to 20×50 → · ← Smaller boards, from 5×5 | the press under the size tiles | sixteen sizes, four tiles a shelf: the next shelf a press away, and the last goes back to the first |
| Level 12 of 64 | the line over the board, the set-up | a huge size has sixty-four levels in four blocks of sixteen; the others have 256 |
| 12 of 64 solved | the progress line on the set-up | what there is to finish, said as a count, as every size says it |

## Suido 水道: big pieces and block turns (2026-10-05)

A twist of a board made on request, so no label is retired: the words are the package's own (`twistBigPieces`, `twistBlockTurns`), which the set-up and the chips use as it does.

| Label | Where | Word used, and why |
|---|---|---|
| Single pieces 1マスの駒 · Big pieces 大きな駒 | Make a board, the "Pieces" choice | the ordinary board and the one with big pieces; "Single", not "Normal" or "Standard", which say the other is odd |
| Big pieces | the chip under a board that has them, the rules | a piece that fills four squares and has up to eight openings; not "Large pieces", "Tetra", "2×2 pieces" or "Mega" |
| Block turns 回転 | Make a board, the "Pieces" choice; the chip under a board that has them; the rules | four pieces ringed by a dashed line that a tap turns together a quarter, each moving round to the next place; not "Rotate block", "Group turn", "Swap" or "Spin" |
| A plate under it · a ring at its middle | the board, the rules | the plate says these four squares are one piece, and the ring where a tap turns it |

## Itsutsu Points: what a puzzle and a game pay

Said once, in the words below, on `/points` and beside the IP boards: a puzzle
has a price, a game has a most, and the page reads both from the code that pays
them (`points/ladder.ts`, `points/gamePoints.ts`).

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| What a puzzle pays · Pays, smallest to biggest | Puzzles pay their own points | 配点 (new) | `/points` | a puzzle is priced by its kind, size and level; its own points are its leaderboard's |
| Priced on one scale: 50 for the smallest and easiest, up to 150 for the biggest and hardest | weighted so a medium solve at a puzzle's usual size is worth about as much as a Gomoku win | — | `/points` | one scale for every puzzle, said as numbers |
| Rounded to the nearest 5 | — | — | `/points`, a game's result | every result and every price is a multiple of five |

## Pencil puzzles (2026-10-05)

| Label | Where | Word used, and why |
|---|---|---|
| Pencil puzzles 鉛筆 | the family's title | the plain word for the thing every one of them is solved with |
| Extra hard 超級 | a level's chip (the fourth after Easy 初級, Medium 中級 and Hard 上級), the line over the board, My games, the fastest tables | the site's first fourth level (2026-10-05): sentence case and two words, "extra hard" in a line of facts ("8×8, extra hard"). Not "Expert", "Insane" or "Hardest"; its address and Kazu's and Jirai's own spelling is `extra-hard` |
| Remove | under a Shikaku board | the usual word; a press then takes a rectangle off. Not "Erase" or "Clear" (a Gomoji's Clear is its row) |
| Cross Sums · Regions | the games' names | plain English for Kakuro and Fillomino, and since Kazu 2.0.0 Kazu's own names too; each says "known elsewhere as ..." on its rules page and nowhere else. Shikaku stays: an ordinary Japanese word (John, 2026-10-05) |
| rectangle · cell | what Check counts ("2 rectangles are wrong, 1 still to draw") | each puzzle's own noun, so a Shikaku never counts "cells" |
| draw · fill | "still to ..." | the verb of the thing: a rectangle is drawn, a cell filled |
| Akari · Loop · Hitori | the games' names | Akari and Hitori are the puzzles' own names; Loop is plain English for Slitherlink, and since Kazu 2.0.0 Kazu's own name, and says "known elsewhere as ..." on its rules page and nowhere else (`loop` is its address) |
| bulb · line · square | what Check counts on Akari, Loop and Hitori | each puzzle's own noun: "2 bulbs are wrong, 1 still to place", "3 lines ...  still to draw", "1 square ... still to shade" |
| Flag | under a Jirai board | the usual word; pressed, a tap flags. Not "Mark" (the package's word), which a Check also uses |
| mines left · mistake | the line under a Jirai board | "13 mines left · 1 mistake": the mines not yet flagged, and the mines uncovered by slip |
| Eight neighbours · Four neighbours · Hexagons · Wraparound | Jirai's set-up | what a number counts, in the words that say it; not "Square", "Orthogonal" (the package's) |
| Tap one corner of a rectangle, then the opposite corner. | the line under a Shikaku board | what to do first; it says what to do next once a corner is down |

## Prose worth a second look (not changed)

- Home, "Always somebody to play", "Your pace", "Learn the shapes": feature
  titles in the site's own voice, not labels.
- About, chapter titles such as "What is on the board here", "The Japanese
  thread", "Sites worth knowing": readable, if literary.
- Set-up notices ("Everything the game will be played under, settled here
  before it exists."): long, but they are sentences, not labels.

## Addresses worth renaming (recommended, not done)

- `/games/<slug>/standings` → `/games/<slug>/leaderboard`, to match its title.
- `/history`: keep. Its title is now Game history, which the address already says.
- `/play` (My games) → `/my-games`: "Play" leads to set-up everywhere else.

## Casual games: Karakuri (2026-10-05)

| Concept | The label everywhere | No longer |
|---|---|---|
| One of a casual game's five steps | **Level** (**Story** for Choice Story) | stage, round, board |
| A level with nothing yet won | the tile's number alone | New, Locked |
| A level won | **Won** | Done, Completed |
| The level being played, not yet won | **In progress** | Going, Active |
| Begin the same level again | **Restart** | Reset, Retry |
| After losing, begin it again | **Try again** | Retry |
| After winning, begin it again | **Play again** | Replay |
| End a level unsolved | **Give up** (a game played alone, as a puzzle's is) | Resign, Quit |
| Another level or game | **New game** (to the set-up, leaving the level where it is) | |
| How a casual game is counted | **Unrated, worth no points** | free play, practice |

## Houseki: gem and stone puzzles (2026-10-06)

| Concept | The label everywhere | No longer |
|---|---|---|
| One step of a game | **Level** (a number, and a difficulty of 1 to 5) | stage, board, round |
| A short guided game that teaches | **Lesson** (nothing is counted) | tutorial |
| The game everybody gets on a date | **Daily** (the date is in UTC) | challenge of the day |
| A game with a size and colours of your own | **Free play** | endless, sandbox |
| A game with no clock / with one | **Relaxed** / **Arcade** | casual, timed |
| A run of clears, each step after the first | **Chain** | combo |
| Take a group of stones away | **Take group** | pop, remove |
| A group of Colour Chains' campaigns | **Classic**, **Shizen**, **Arashi** (campaigns, not games) | mode, world |
| Magnetic Blocks' floor | **Calm** / **Pull**, and the **Floor Switch** | gravity |
| What a won level earns | **points** (never XP) | coins |
