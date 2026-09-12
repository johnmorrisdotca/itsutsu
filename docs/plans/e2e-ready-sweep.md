# The `ready()` sweep

`AGENTS.md` has carried the remedy for the hydration race since it was written
down, under "a browser test that races hydration" and "An Absence Is Only
Meaningful After A Presence Has Been Waited For", and its own corollary said
what had become of it:

> `ready()` appears in 2 of 102 spec files. Five hydration races were found in a
> single day against that adoption. **A documented remedy nobody applies is
> worse than an undocumented problem, because it lets everybody believe the
> problem is handled.** … go and apply it, or say plainly that it is not
> applied.

This is that sweep. Every spec under `e2e/` was read — not grepped — and the
question asked of each was: does it drive a control that the page
server-rendered and has not yet attached to?

## What came out of it

| | specs |
| --- | --- |
| spec files under `e2e/` | 122 |
| waiting on a mark **before** this sweep | 16 directly, 5 more through `openSetUpPage` / `startAndBegin` — **21 of 122** |
| waiting on a mark **after** it | 37 directly, 5 more through the helpers — **42 of 122** |
| changed here: drive a hydrated control and now wait for it | **24** |
| drive a hydrated control and still do not | **1** — `admin-words`, whose rows are their own proof; see the table |
| already waited before tonight | **18** |
| drive nothing hydrated — links, a native `<details>`, a server component, or the API | **57** |
| drive the practice board, where there is no window to lose a click in | **22** |

Every number above was counted rather than estimated: `grep -lE '\bready\(|\breadyHere\(|openSetUpPage|startAndBegin' e2e/*.spec.ts`
against this tree and against `HEAD~3`.

Components carrying `{...readyMark(useHydrated())}`: **13 before, 27 after.**

So the figure to write beside `AGENTS.md`'s "`ready()` appears in 2 of 102 spec
files" is **42 of 122** — and the honest gloss on it is that 79 of the other 80
do not need it, for reasons given one line each below, rather than being still
outstanding.

## Two things worth knowing before reading the table

**The practice board cannot lose a click, and 22 specs live on it.** `/games/<slug>/play`
renders through `GameViewClient`, which is `dynamic(..., { ssr: false })`. The
board, the settings selects and the piece tray therefore do not exist in the
server's HTML at all: they appear in the same commit that gives them their
handlers. There is no window in which a control is real and deaf, so those specs
need no wait and those components need no mark. Saying this is half the value of
the inventory — it is why the sweep is 24 files and not 60, and it is not
guesswork, it is one `ssr: false` in `GameViewClient.tsx`.

**`page.goto`'s default `load` wait has been quietly protecting the rest.** A
default `goto` resolves on `load`, and `load` waits for the scripts whose
arrival is hydration. That is why so much of this suite has been green over a
real race. It protects nothing where a spec winds `page.clock`, and nothing
where the control is reached without a fresh document load — which is exactly
where the five races the project already found were living. The wait is
therefore not belt-and-braces: it is the only thing standing between those
specs and the window.

## Where the marks are

| component | test id the spec waits on | added |
| --- | --- | --- |
| `ui/ConfirmButton.tsx` | the trigger's own `testId` — `resign`, `cancel`, `new-game`, `registration-*-use` | yes |
| `mine/ProfileForm.tsx` | `profile-form` | yes |
| `mine/SitButton.tsx` | `sit` | yes |
| `mine/OfferButtons.tsx` | `offer-buttons` | yes |
| `games/GameCards.tsx` | `letter-filter` | yes |
| `layout/BareBoard.tsx` | `bare-board` | yes |
| `history/HistoryFilters.tsx` | `history-filters` | yes |
| `history/GameReplay.tsx` | `game-replay` | yes |
| `history/Applause.tsx` | `applause` | yes |
| `auth/JoinForm.tsx` | `join-form` | yes |
| `auth/AdminMembers.tsx` | `admin-members` | yes |
| `auth/AccountMenu.tsx` | `account-menu` | yes |
| `backlog/BacklogBoard.tsx` | `backlog-filters` | yes |
| `game/EmbedGame.tsx` | `embed-board` | yes |
| `auth/AdminSite.tsx`, `game/GameView.tsx`, `history/LiveRecord.tsx`, `live/Doorstep.tsx`, `live/SetUpGame.tsx`, `live/SharedGame.tsx`, `live/SitAsPanel.tsx`, `mine/GameDefaultsForm.tsx`, `mine/PhraseSetup.tsx`, `mine/StartGame.tsx`, `mine/YourTurnBadge.tsx`, `players/LadderMore.tsx`, `xp/XpToastHost.tsx` | as before | no — already marked |

`offer-buttons`, `game-replay`, `history-filters`, `join-form` and `embed-board`
are new test ids; the rest were already on the page.

Three marks go on a control rather than a panel — `ConfirmButton`, `SitButton`,
`OfferButtons` — because those come one per row, and `ready(page, "resign")` on
a queue with two games in it is a strict-mode violation rather than a wait.
`readyHere(locator)` in `e2e/support.ts` is how a spec reads one of those.

## The sweep, spec by spec

| spec | what it drives | marker | verdict |
| --- | --- | --- | --- |
| `applause` | the marks under a finished game (buttons) | `applause` | DONE |
| `backlog` | status chips, add panel, title/detail fields, move-status select | `backlog-filters` | DONE — 7 waits, one after a reload |
| `backlog-detail` | the detail fold (button) | `backlog-filters` | DONE — ×2 |
| `bare-board` | the strip-the-page switch (button) | `bare-board` | DONE — ×4 |
| `confirm-destructive` | Resign in a queue row (ConfirmButton) | `resign` via `readyHere` | DONE |
| `country-flags` | the country select on the profile | `profile-form` | DONE |
| `days-off` | the seven day buttons on the profile | `profile-form` | DONE — ×2 |
| `embed` | the embedded board | `embed-board` | DONE — ×2 |
| `embed-data` | the embedded board | `embed-board` | DONE — ×2 |
| `fork-visibility` | the replay scrubber (arrow keys) | `game-replay` | DONE — ×2; see the false pass below |
| `gate` | Show the invite code (button); and an absence above it | `join-form` | DONE — ×2 |
| `history` | the game/sort selects; the replay arrows and keyboard | `history-filters`, `game-replay` | DONE — ×2 |
| `keep-finished` | the keep-finished window select | `profile-form` | DONE — ×4 |
| `kitchen-table` | Set four words; Sit as somebody | `phrase-setup`, `sit-as-closed` | DONE — 2 added, 2 moved onto the helper |
| `learn` | the A–Z and what-wins bars; Sign out | `letter-filter`, `account-menu` | DONE — ×3 |
| `move-list` | a played move (button) on a finished game | `game-replay` | DONE |
| `mygames` | Resign in a row; Sit at an open seat | `resign`, `sit` via `readyHere` | DONE — ×2 |
| `offers` | accept, decline, withdraw — eight presses | `offer-buttons` via `readyHere` | DONE — ×8 |
| `quick-phrases` | a phrase, the message box, the live board | `shared-game` | DONE — ×4 |
| `reactions` | the live board and the emoji bar, both seats | `shared-game` | DONE — ×3 |
| `shared` | a stone on a live board | `shared-game` | DONE |
| `social` | the message box and Send; an absence beside the clock | `shared-game` | DONE — ×2 |
| `sorting-and-scrolling` | the record's sort select | `history-filters` | DONE — the control it drives, beside the scroller it already waited on |
| `turn-board` | a stone, and Turn the board, on a live match | `shared-game` | DONE — ×4 |
| `doorstep` | the whole set-up screen and the doorstep | `set-up-game`, `doorstep` | ALREADY |
| `game-defaults` | the new-game defaults form | `game-defaults` | ALREADY |
| `game-ends-under-you` | a live board, resign, the rematch | `shared-game`, `set-up-game` | ALREADY |
| `give-up-from-the-board` | resign and cancel from a live board | `shared-game` | ALREADY |
| `idle-leave` | `page.clock` and the idle modal | `game-view` | ALREADY — clock installed before the load |
| `masthead` | `page.clock` and the waiting count | `your-turn-slot` | ALREADY |
| `next-game` | resign, and being carried to the next board | `shared-game` | ALREADY |
| `rematch` | Play again, then the set-up screen | `set-up-game` | ALREADY |
| `set-up-again` | the set-up screen, forks, the doorstep | `set-up-game`, `doorstep` | ALREADY |
| `set-up-every-way-in` | every door into the set-up screen; the lobby sentence | `set-up-game`, `start-game`, `doorstep` | ALREADY |
| `set-up-game` | the set-up screen | `set-up-game` | ALREADY |
| `set-up-handicap` | the handicap drawer | `set-up-game` | ALREADY |
| `site-settings` | the door's three modes and the notice field | `admin-site` | ALREADY |
| `ignored-opponent` | the opponent chooser | via `openSetUpPage` | ALREADY — helper waits |
| `seat-not-hidden` | the set-up screen's opponent and pace | via `openSetUpPage` | ALREADY — helper waits |
| `set-up-first` | the set-up screen | via `openSetUpPage` | ALREADY — helper waits |
| `start` | the set-up screen, posting a seat | via `openSetUpPage` | ALREADY — helper waits |
| `start-board` | the board picker before a game exists | via `openSetUpPage` | ALREADY — helper waits |
| `board-skin` | board themes in the practice board's set-up | none | NOT NEEDED — client-only board |
| `checkers` | the practice board | none | NOT NEEDED — client-only board |
| `chinese-checkers` | the practice board | none | NOT NEEDED — client-only board |
| `draw-limit` | the draw-limit select | none | NOT NEEDED — client-only board |
| `game-screenshots` | rules select, themes, the board | none | NOT NEEDED — client-only board |
| `games` | rule selects, twist controls, New game | none | NOT NEEDED — client-only board |
| `go` | the practice board, passing | none | NOT NEEDED — client-only board |
| `halma` | the practice board | none | NOT NEEDED — client-only board |
| `hex` | the practice board | none | NOT NEEDED — client-only board |
| `hotseat` | New game, Undo, return-to-latest | none | NOT NEEDED — client-only board |
| `options` | board size, obstacles, first player, themes | none | NOT NEEDED — client-only board |
| `panel-width` | every select in the settings panel | none | NOT NEEDED — client-only board |
| `persistence` | size, theme, New game | none | NOT NEEDED — client-only board |
| `pieces` | piece tray, rotate, single | none | NOT NEEDED — client-only board |
| `play` | the board, Undo/Redo, awareness, hints | none | NOT NEEDED — client-only board |
| `resize` | grow/shrink proposals | none | NOT NEEDED — client-only board |
| `screenshots` | themes, stone sets, clocks | none | NOT NEEDED — client-only board |
| `timing` | time control, warnings, who is ahead | none | NOT NEEDED — client-only board |
| `topology` | the toroidal and obstacle rules | none | NOT NEEDED — client-only board |
| `variants` | rule selects, the game browser, openings | none | NOT NEEDED — client-only board |
| `variants2` | maker/breaker, notakto, reversi | none | NOT NEEDED — client-only board |
| `rules-statement` | the sharing panel's clock select | none | NOT NEEDED — client-only board; the rest is `openBoardRules`, which waits on a rendered statement |
| `about` | links in the prose | none | NOT NEEDED — links |
| `board-faces-you` | nothing | none | NOT NEEDED — read only |
| `board-size` | nothing | none | NOT NEEDED — read only |
| `bot-manners` | nothing | none | NOT NEEDED — API only |
| `both-seats` | nothing | none | NOT NEEDED — read only |
| `cancel-empty-game` | nothing | none | NOT NEEDED — API only |
| `card-target` | a game card and Enter on its name | none | NOT NEEDED — the card is a link |
| `champions` | champion rows and the players link | none | NOT NEEDED — links |
| `computer-ladder` | nothing | none | NOT NEEDED — read only |
| `computer-players` | a player's name | none | NOT NEEDED — links |
| `conversation` | a remark's move number | none | NOT NEEDED — a link in a server component |
| `directory-everyone` | the who bar | none | NOT NEEDED — the filter bar is links |
| `directory-scope` | the scope bar | none | NOT NEEDED — links |
| `empty-tables` | nothing | none | NOT NEEDED — read only |
| `first-names` | a member's name | none | NOT NEEDED — links |
| `front-door` | nothing | none | NOT NEEDED — read only |
| `game-front-door` | the ways on from a game's page | none | NOT NEEDED — links |
| `games-link` | game names, and a family's fold | none | NOT NEEDED — links and a native `<details>` |
| `identity` | nothing | none | NOT NEEDED — API only |
| `ignore-live` | nothing | none | NOT NEEDED — read only |
| `ignored-seat` | nothing | none | NOT NEEDED — read only |
| `language` | the language picker | none | NOT NEEDED — plain anchors, deliberately; see LanguagePicker.tsx's header |
| `legacy` | tabs and legacy records | none | NOT NEEDED — tabs are links |
| `lobby-order` | nothing | none | NOT NEEDED — read only |
| `member-kind` | nothing | none | NOT NEEDED — read only |
| `members-count` | nothing | none | NOT NEEDED — read only |
| `members` | nothing | none | NOT NEEDED — read only |
| `names-link` | names on a board and in a queue | none | NOT NEEDED — links |
| `names` | names in every list | none | NOT NEEDED — links |
| `open-seat-clock` | nothing | none | NOT NEEDED — API only |
| `opponent-actions` | a computer player's name and Play | none | NOT NEEDED — links |
| `page-split` | nothing | none | NOT NEEDED — read only |
| `playable` | nothing | none | NOT NEEDED — API only |
| `player-actions` | nothing | none | NOT NEEDED — read only |
| `player-address` | a member's name | none | NOT NEEDED — links |
| `player-filters` | the who/settled/active bars, sortable heads | none | NOT NEEDED — every one is a `<Link>` |
| `posted-seat-rules` | the rules drawer | none | NOT NEEDED — `openBoardRules` waits on a rendered statement |
| `posted-waiting` | nothing | none | NOT NEEDED — read only |
| `profile` | nothing | none | NOT NEEDED — read only |
| `record-text` | the plain-text fold | none | NOT NEEDED — a native `<details>` |
| `refresh-race` | nothing | none | NOT NEEDED — read only |
| `refusals` | nothing | none | NOT NEEDED — API only |
| `releases` | the version stamp | none | NOT NEEDED — links |
| `row-heights` | nothing | none | NOT NEEDED — read only |
| `rules-keep` | nothing | none | NOT NEEDED — API only |
| `rules-settle` | the rules drawer | none | NOT NEEDED — `openBoardRules` waits on a rendered statement |
| `seat-links` | nothing | none | NOT NEEDED — read only |
| `seat-refused` | nothing | none | NOT NEEDED — read only |
| `seat-token-privacy` | nothing | none | NOT NEEDED — API only |
| `self-game` | nothing | none | NOT NEEDED — read only |
| `standing-pool` | nothing | none | NOT NEEDED — read only |
| `tabs` | the tab strips on six pages | none | NOT NEEDED — tabs are `<Link>`s |
| `whole-record` | the scope bar | none | NOT NEEDED — links |
| `widths` | nothing | none | NOT NEEDED — read only |
| `xp-history` | the XP tab and Show more | none | NOT NEEDED — links |
| `xp-leaderboard` | sortable heads, Top, the two cross-links | none | NOT NEEDED — links |
| `xp-levels` | the rungs either side | none | NOT NEEDED — links |
| `admin-words` | the Words link on a member's row, and the modal | `admin-members` | LEFT — the rows come from `useSWR` with no fallback, so a VISIBLE row is already proof the browser has taken over; the spec waits for one before touching it. A mark was added to the panel anyway, for the next spec that needs it. |

## The race, reproduced twice

Both reproductions delay every script by three seconds with `page.route`, and
navigate with `waitUntil: "commit"` so that `goto` does not sit waiting for the
very scripts being held back. The scratch specs are not in the tree; they were
run and deleted.

**One — the press is lost, and lost for good.** A probe pressed the bare-board
switch 226 ms after the document committed, with `data-ready="false"` on the
panel. Hydration landed at 6.6 s. `data-bare` was still unset at 16.7 s: React
replays nothing, because with no scripts loaded there were no listeners to
capture the press in the first place. The old spec fails (8.8 s, the masthead
never hides); the new one waits for the mark and passes in 3.7 s.

**Two — a false PASS, which is the dangerous half.** `fork-visibility`'s watcher
test scrubs back one move with `ArrowLeft` and asserts the fork link is not
offered. A range input answers an arrow key NATIVELY, so with React not yet
attached the scrubber's value really does move from 5 to 4 — `toHaveValue("4")`
is true — and nothing re-renders, because nothing heard it. The old spec then
finds no fork link and goes green in 968 ms, having never once rendered the
scrubbed-back page it is about. With `ready(page, "game-replay")` in front of
it, the press is heard, the page really does move back, and the same assertion
fails with `Expected: 0, Received: 1` — the fork IS offered at move 4 to the
player who played the game. The failure is the proof: the new spec reaches the
page, and the old one never did.

## Reds that are not this sweep's

Named so the next reader does not fix them by loosening them.

- `mygames.spec.ts` — "a game posted for anyone can be sat at by somebody else,
  once". Four `open-game` rows say "Host" on this shared database; one locator,
  strict-mode violation. Litter, and the standing red `AGENTS.md` names.
- `reactions.spec.ts` — "an emoji sent from one seat reaches the other within a
  poll". Red before the sweep, measured by running the version from `HEAD`
  beside the new one.
- `quick-phrases.spec.ts` — "is kept on the record, against the move it was sent
  at" fails two runs in four. **The version on `main`, unchanged, fails two in
  four too**, checked out from `HEAD` and repeated four times beside the new one.
  So the wait neither caused it nor cured it. At the failure the board still
  reads "Your move — you are Black" with nothing in the reaction log, so the
  move and the phrase both failed to reach the server. Worth its own ticket; it
  is not a hydration race.

