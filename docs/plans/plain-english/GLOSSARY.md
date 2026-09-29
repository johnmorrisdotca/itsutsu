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
| A game still being played | **In progress 対局中** | Going 対局中, going, Nothing going |
| Who opens a game, chosen by chance | **Random** | Drawn by lot |
| Neither side ahead | **Even 互角** | Level 互角 (clashed with the XP "Level") |
| Colours changing hands | **Swap colours** | Swap seats |

## Header, footer and account

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Game history | Record | 棋譜 (unchanged) | `i18n.constants.ts` `nav.record` | "Record" also means a W–L–D record; this page is every finished game |
| All games | Every game | 全種目 (unchanged) | `i18n.constants.ts` `nav.everyGame` | the usual words for the full list |
| No active games | Nothing going | — | `StripGames.tsx` | "going" is not how a game site says in progress |
| {n} active | {n} going | — | `StripGames.tsx` | same |
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
| Strength by game | Measured game by game | 実力 (unchanged) | `LadderStrength.tsx` | plain |

## Set-up

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| New game | Set up a game | 新規対局 (was 対局設定) | `SetUpHeading.tsx`, `app/games/new/page.tsx`, `RefusedOfferPage.tsx` | the button that leads here says New game |
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
| Place the piece | Lay the piece | — | `game.constants.ts` | same |
| Load moves | Walk through it | — | `game.constants.ts` (paste a game) | plain |
| Analysis | Awareness | — | `GameSettingsPanel.tsx` | the setting shows who is ahead and the threats |
| Show who is ahead · Show threats | Tell me how it stands · Show me the threats | 形勢 · 急所 (unchanged) | `game.constants.ts` | plain, and matches the "Who is ahead" panel |
| Hints per player | Hints each | — | `GameSettingsPanel.tsx` | plain |
| Flip the board | Turn the board round | — | `AppearancePanel.tsx` and callers | the usual words |
| Waiting for an opponent 募集中. | Posted, and waiting for somebody 募集中. | 募集中 (unchanged) | `TurnBanner.tsx` | plain |
| Even | Level | 互角 (unchanged) | `advantage.constants.ts` | "Level" is the XP word here |
| Moves | Move list | 棋譜 (unchanged) | `GameReplay.tsx` | one word for it |
| Hide moves | Fold the moves away | — | `FamousReplay.tsx` | plain |
| Moves as text | The whole record as text | 記録 (unchanged) | `RecordText.tsx` | plain |

## Records, players and XP

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Game history | Record | 棋譜 (unchanged) | `RecordPage.tsx`, `app/history/page.tsx`, `games/[slug]/history/page.tsx`, `PuzzleRecordPage.tsx` | John's word for it, and "Record" is also W–L–D |
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
| No games in progress. | Nothing going. | — | `MyGamesList.tsx` | same |
| Puzzles in progress | Puzzles going | 解きかけ (unchanged) | `mine.constants.ts` | same |
| Open games | Open seats | 対局募集 (unchanged) | `mine.constants.ts` | ItsYourTurn's word for games waiting for a player |
| Play as White | Sit as White | 着席 (unchanged) | `mine.constants.ts` | plain |
| Prefer not to say | Not saying | — | `ProfileForm.tsx` | the usual words |
| Show when I'm online | Show when I am here | — | `ProfileSends.tsx` | same |
| Clock for games on one device · Clock for games on two devices | Clock at this screen · Clock in a game on two devices | — | `GameDefaultsForm.tsx` | plain, and a pair |
| Reset to defaults | Back to the ordinary ones | — | `GameDefaultsForm.tsx` | the usual words |
| Your data | What Itsutsu holds about you | 保存情報 (unchanged) | `WhatWeHold.tsx` | plain |
| Create an invite link · New link | Make an invitation · Another | — | `InviteFriends.tsx` | plain |

## Puzzles

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| All solves | Every solve here | 棋譜 (unchanged) | `PuzzleFrontDoor.tsx` | plain |
| Your solves | Your own solves | — | `PuzzleFrontDoor.tsx` | same as the page it opens |
| Sort: | Order: | — | `PuzzleRecordPage.tsx` | the usual word |
| Normal · Gentle | As made · Softer | 爆 · 弱 (unchanged) | `TsunagiHelpPickers.tsx` | plain |

## Party games

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Players | At the table / At the board | 席 (unchanged) | `DotsGame.tsx`, `MancalaGame.tsx`, `PairGoGame.tsx`, `PartyBlocksStatus.tsx`, `PartyRaceGame.tsx`, `online.constants.ts` `seatsHeading` | the list of who is playing |
| Start | Set the table | — | `online.constants.ts` | Start begins a game, everywhere |
| Online table | At a table | 卓 (unchanged) | `online.constants.ts`, `tables/[id]/page.tsx` | says what the page is |
| Online tables · Finished tables | At a table · Tables finished | — | `online.constants.ts` (My games) | plain |

## Home and About

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Meet the bots | Meet the programs | — | `home.constants.ts` | the site calls them bots |
| Bots | Programs | 棋士 (unchanged) | `about.chapters.ts` | same |
| The bots | The players that are not people | 棋力 (unchanged) | `about.bots.tsx` | plain |

## Admin (the operator only)

| Now | Was | Kanji | Where | Why |
|---|---|---|---|---|
| Suspended | Shut | 停止 (unchanged) | `AdminMembers.tsx` | the usual word |
| Suspend account · Suspend | Shut the account · Shut it | — | `AdminMembers.tsx` | same |
| Reactivate | Open it again | — | `AdminMembers.tsx` | same |
| Remove name · Remove it | Take the name off · Take it off | — | `AdminMembers.tsx` | same |
| Maintenance | Being worked on | 整備 (unchanged) | `AdminSite.tsx` | same |

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

## Prose worth a second look (not changed)

- Home, "Always somebody to play", "Your pace", "Learn the shapes": feature
  titles in the site's own voice, not labels.
- About, chapter titles such as "What is on the board here", "The Japanese
  thread", "Sites worth knowing": readable, if literary.
- Set-up notices ("Everything the game will be played under, settled here
  before it exists."): long, but they are sentences, not labels.

## Addresses worth renaming (recommended, not done)

- `/games/<slug>/standings` → `/games/<slug>/leaderboard`, to match its title.
- `/history` → `/games/history` or keep: its title is now Game history, which
  the address already says.
- `/play` (My games) → `/my-games`: "Play" leads to set-up everywhere else.
