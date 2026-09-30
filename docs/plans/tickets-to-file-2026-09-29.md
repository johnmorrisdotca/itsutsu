# Tickets to file: John's asks of 2026-09-28 and 2026-09-29

Written 2026-09-30 by a cloud session, which cannot reach the live board.
itsutsu-19: read this once you are back, file the one row under "To file",
and check the rows under "To check" against the board.

## How this was checked

John's own messages were read from the Mac's sessions: "ITS: Agent"
(itsutsu-95's orchestrator, 2026-09-29 06:26Z to its end at 17:08Z, and the
list of his earlier messages in its 07:07Z summary) and "Heartbeat agents
board reading" (all of it, 03:52Z to 05:43Z). The board rows are the ones
those sessions' own `pnpm task:prod add` calls reported as added. What
shipped is read from `CHANGELOG.md` on `main`.

## Every ask has a row

Every feature or bug John asked for on those two days either has a row on
the live board or shipped the same day. Nothing he asked for was dropped.

| Ask (UTC, 09-29) | Board row | Where it stands |
| --- | --- | --- |
| 06:52 phone header, account menu top right | phone-header-the-account-menu-at-the-top-right-beside-the-logo | Shipped 0.426.4 |
| 07:23 Solitaire, Mahjong, family card games, Mexican Train | solitaire-classic-klondike-…, mahjong-tile-matching-family-style-…, family-card-games-hearts-big-2-…, mexican-train-dominoes-a-family-game | Shipped 0.435.0 to 0.439.0 |
| 07:45 plain English across the site | plain-english-across-the-site-… | Shipped 0.434.0 |
| 08:00 marble colour at set-up or first move | choose-your-marble-colour-at-set-up-or-on-your-first-move-… | Shipped 0.438.0 |
| 12:35 "Usual" becomes "Standard" | puzzle-size-name-usual-becomes-standard | Shipped 0.439.1 |
| 12:49 and 13:04 win cover, flash on the winning move | winning-shows-a-cover-over-the-board-like-pause-does | Shipped 0.441.0 |
| 12:52 Just the board shows scrollbars on a desk | just-the-board-is-taller-than-the-window-…, just-the-board-still-scrolls-on-a-desk-for-seven-games | Shipped 0.441.1 |
| 12:52 desktop and phone image of a game | game-wallpaper-desktop-and-phone-image-for-every-game-… | Shipped 0.442.0 |
| 13:00 wide mode for Tenka | wide-mode-on-a-desktop-a-wide-game-like-tenka-… | Shipped 0.440.0 |
| 13:50 and 14:02 Play and star float on hover, tap on a phone | players-table-play-and-star-buttons-float-over-the-row-on-hover-… | Shipped 0.440.1 |
| 08:44 and 16:22 home page buttons repeat the header, tidy the hero | home-page-take-away-the-hero-s-buttons-that-repeat-the-header-and-tidy-the-hero | Committed on the Mac, not pushed |
| 16:15 result marks: tick, cross, bar | results-say-plainly-how-a-game-ended-with-a-mark-… | Built on the Mac, uncommitted (worktree `result-marks`) |
| 16:16 "Move 123 of 131" wraps | a-replay-s-move-count-wraps-once-the-numbers-are-long-… | Built on the Mac, uncommitted (worktree `result-marks`) |
| 16:17 second English review | plain-english-second-pass-every-screen-after-a-game-ends-… | On the Mac, waiting on its own checks |
| 16:23 finished card games missing from Completed | my-games-completed-finished-card-games-and-other-tables-played-on-this-device-… | Built on the Mac, uncommitted (worktree `completed-tables`); the cloud thread "Card games missing from history" works the same ground |
| 16:25 to 16:28 Tenka map: N. America, Asia, Alaska–Russia, Greenland | tenka-map-n-america-button-does-nothing-… | Two commits on the Mac's `tenka-links`, not pushed |
| 16:34 to 16:38 dice games, Yacht scorecard | dice-games-a-dice-family-… | Cloud thread "A dice game"; the Mac's `dice` branch has two commits |
| 16:45 Rubik's cube section | cubes-a-3d-turning-cube-puzzle-2-2-to-3-3-with-a-solver-… | Cloud thread "Rubik's cube section" |

The 2026-09-28 asks (Kumimoji's tap-to-return, Sort, Help, Turn, hidden
arrows, zoom, wallpaper, two to eight players, a last turn for everyone,
joining and leaving, computer seats, the Double set, Diagonals, Party games,
Chinese Checkers round one device, Tenka, the dark-mode tiles, no selecting
buttons, Tsunagi's numbers, desktop board sizes, one Gomoji, Just the board)
all shipped by 0.432.0.

The costs session's asks shipped too: the sign-up door and anonymous
visitors no longer wake the database (0.418.1, 0.420.1), Sumilabu caches its
settings reads, and UmaKuma's robots file refuses what it does not name
(1.661.1, 1.661.2). There were no heartbeat agents reading the board; the
"heartbeat" was the clock devices reporting to Sumilabu. Moving the tests
off the live Sumilabu was advised against, and John did not answer that.

## To file

One ask has no row anywhere: it belongs on **Sumilabu's** board, not
Itsutsu's. The costs session passed it to the Sumilabu session (sumilabu-5f)
at 04:18Z, which had not confirmed it when the session ended.

- **Title:** Dashboard auto refresh defaults to 30 minutes, not 5
- **Kind:** chore
- **Priority:** normal
- **Effort:** small
- **Detail:** John, 2026-09-29: "change the default to 30m." The dashboard's
  auto refresh is 5 minutes, which is exactly how long Neon waits before the
  database sleeps, so a dashboard left open keeps it awake all day. The 30m
  option already exists in the dropdown; only the default changes. A browser
  that remembers 5m keeps it until changed by hand. Skip this row if
  Sumilabu's dashboard already defaults to 30m.

## To check

- **Rows that shipped but may still be open.** The Mac's session closed
  rows through `release:take:prod --done` up to 0.439.1 and some of 0.440 to
  0.441. The wallpaper row (0.442.0) was not seen closed. Close any row in
  the table above marked Shipped that the board still shows open, at the
  version given.
- **The five stopped agents' work** is on the Mac, not on GitHub: worktrees
  `result-marks`, `completed-tables`, `tenka-links`, `dice` and the second
  English pass, plus the home page commit. Each one's state is in its
  hand-back in the "ITS: Agent" session (2026-09-29 16:55Z to 17:08Z). Where a
  cloud thread now owns the same work (dice, cubes, card games in history),
  compare before landing either, so nothing is built twice.

## Why the work stopped on 2026-09-29

John did not ask for it to stop; his last message was at 16:45Z. Between
16:55Z and 17:08Z, five of the six background agents in "ITS: Agent" each had
a permission prompt come back as declined ("The user doesn't want to take
this action right now. STOP what you are doing and wait…"), four of them on
opening a screenshot and one on writing `DicePlay.tsx`. The "Heartbeat"
session on the same Mac exited at 16:55:30Z. The orchestrator then held all
five and asked John whether to carry on or pause; nobody answered, and its
last event, at 17:08:54Z, is "holding all five stopped agents until you say".
The transcript does not show whether the prompts were declined by hand or
dismissed when the Mac's client went away.
