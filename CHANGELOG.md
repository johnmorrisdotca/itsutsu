# Changelog

What changed, in a player's words. Versions follow semver as the site reads it: a **minor** bump is something a player would notice — a new game, opening, page or capability — and a **patch** is a fix, a rewording, a refactor or a chore. The first **major** is reserved for the day the invite gate comes down. Patch-only versions are not listed.

The site calls itself **Beta** whatever the number says: real accounts and persisted ratings are past alpha.

Whoever lands a commit bumps `package.json` and adds a line here in the same commit, and announces the bump to the other session first, so two sessions never claim the same number.

## 0.66.0
- A member can say how long a finished game stays in their own list: a week, a fortnight, a month, three months, or for ever. The record keeps every game whatever it says

## 0.65.0
- A game can be given a length: on a board of 9x9 or larger, half or three quarters of the board's points played with nobody winning is a draw

## 0.64.0
- The whole record can be copied out as plain text: every game these filters select, in aligned columns, from the foot of the record page

## 0.63.0
- Rules pages carry the flag of the country a game came from and a link to its Wikipedia article, so the page can be checked against something outside the site

## 0.62.0
- Rules pages say what else a game is called: the names it is published under, and the names the play-by-mail sites gave it, in one line under the title

## 0.61.0
- Hex ヘックス: a rhombus of hexagons, six neighbours to a cell, and the game is won by joining your own two sides. A draw is impossible, which is a fact about the board rather than a rule.

## 0.60.1
- The Admin page is in three parts — the door, the members, the work — and a player's page is a page again, with the kept records that made up two thirds of it in a component of their own

## 0.60.0
- The operator can shut an account: it stops on the member's next request, the invite it came in by is revoked with it, the record and the rating stay as they are, and it can be opened again. With a list of the members, and a way to take an abusive name off one without touching the account.

## 0.59.0
- Applause 拍手 on a finished game: anybody who has seen it may leave one kind mark, and there is no way to boo

## 0.58.0
- A game's address is short enough to read out: /games/notakto/k3m9-p2qx/4, in place of a generated database id

## 0.57.0
- The backlog says who has each item, groups itself under headings by status, and is on the Admin page rather than a card pointing at it
- The games below the lobby are for looking around: there is one way to start a game on the page now, and it always asks first
- The record has left the header; it is reached from a game, a player or the foot of the page, where it belongs
- Best move no longer charges a hint on the ten games that read no lines, and no longer shows one from a position two moves ago

## 0.56.0
- A player's page is at /players/john-morris now, in kebab like every other address here, instead of a percent-encoded name
- A game cannot be played or filed under a remembered player's name either, which was the other way into it

## 0.55.1
- The last move of a finished game says when it ended, not when it was made

## 0.55.0
- A rename can no longer reach a remembered player's name, or a name with a record behind it: a rating belongs to whoever earned it
- New game asks first when a board is under way, instead of throwing it away on a stray click
- A hint you are already looking at is free to look at again; only a new answer costs a use
- An invite code can be made good for one person only, which the store always understood and the form never offered

## 0.54.0
- Starting a game is one sentence now — play this game, at this pace, with anyone, a member, or someone at this screen — over one board of open seats and whoever is here. Auto-match and posting a seat were the same wish said twice: asking for a game sits you down at a matching seat if there is one and posts yours if there is not.

## 0.53.0
- A backlog 積み残し: every feature asked for and every fault reported on one page, with what has become of each. Anyone who is in can add to it, and move an item from proposed to planned, building, done or dropped. Beneath it, every release so far, read from the changelog itself; the operator reaches both from the Admin page.

## 0.52.0
- Every member has a page from the day they join, so every name the site prints leads to the person; a test now walks the lists and fails if any name is printed without a link
- On a replay the move list hangs from the bottom of the column, level with the board

## 0.51.0
- The plain game is called Gomoku 五目並べ now, not Freestyle, and the exact-five tournament form is Tournament Gomoku 競技五目: the plain name on the plain game, a qualifier on the tightened one, as GoldToken names them
- Every game on one plain page at /games/all, family by family, with the names the other sites gave each one

## 0.50.4
- Stale test assumptions fixed after the Gomoku rename

## 0.50.3
- A name in the record leads to that player's page; the replay says when the game started at move 0, so nothing jumps; a match shows when it began and, once over, when it ended, and the board learns of a resignation or a strict timeout without a reload; the arrow keys walk the record on a replay and on the board; the move list folds away; the record lists finished games only

## 0.50.2
- A name in the here-now list links to its page, as the directory already did

## 0.50.1
- Six more Four In a Row aliases, matched against GoldToken's own family

## 0.50.0
- Halma ハルマ: the race game, on 16×16, 10×10 or 8×8, with jump chains and shaded camps; the first game here that is not about lines

## 0.49.2
- The door's orphaned Enter button is fixed, and days off are recorded

## 0.49.1
- "Post a seat" now lands on the sharing panel with the other seat already open, instead of a bare board

## 0.49.0
- A record between two kept players — his against his father, 0 wins, 5 draws, 9 losses

## 0.48.0
- Grand Reversi 大リバーシ: the flipping game on a 10×10 board, as ItsYourTurn had it

## 0.47.0
- Champions 名人: the best-rated player at every game on one page, and each game's own ladder beneath it

## 0.46.0
- The invite code stays out of the way until you say you need one

## 0.45.0
- Away days: mark a range on your profile, three days a year, and deadlines in your games wait for it. A game can be set up to ignore vacation days.

## 0.44.0
- Two clocks: time per move, or one budget each for the whole game. Give the other side more time, kept on the record and read on the players' pages. A game can be set to not affect ratings.

## 0.43.0
- After a game, say privately how you think you played: thumbs up or down, and a tally of your own reads on your profile.

## 0.43.0
- John's GoldToken record too, and a member can now carry more than one kept record

## 0.42.0
- Auto-match: name a game and a pace and be paired with the next member who wants the same. The Play page lays out the four ways to start a game.

## 0.41.0
- The replay shows the whole game as a move list, each move a link to its position, with a copy button.

## 0.40.0
- Ignore a member: they cannot challenge you and their messages are hidden from you; undo it from your profile. In any shared game, mute just that opponent's messages with one switch.

## 0.39.0
- The replay says when each move was made. A finished game can be hidden from your own public list; it still counts.

## 0.38.1
- A filed game says when it started and when it finished.

## 0.38.0
- Kyokosan's record, and the first kept game — a board you can step through, verified legal move by move

## 0.37.0
- A live member's record from before Itsutsu, kept alongside what they've earned here

## 0.36.1
- The lobby and players pages read the database at request time only.

## 0.36.0
- A remembered record: a player who never played here, kept from ItsYourTurn

## 0.35.0
- Who is here on the players page, with the five, fifteen and thirty minute marks; a fuller profile — city, country, time zone, a line about you, and whether you are listed or mailed; a buddy list, starred from the players page.

## 0.34.0
- A profile page: choose the name other players see, on first sign-in and any time after; your record by game and your invite link. New members are marked on the players page. The record list sits on the standard column.

## 0.33.5
- The door names the sign-in error it was given; the operator's door is reached by address only.

## 0.33.4
- The door: no operator link, a plain message when Google sign-in did not complete, and the edition stamp at the foot.

## 0.33.3
- Continue with Google actually continues: the button starts NextAuth's sign-in properly instead of linking to it.

## 0.33.2
- Reversi and Mini Reversi have their pictures; the About page says the Pente tournament rule is the Pro opening here.

## 0.33.1
- Sign-in works from www.itsutsu.com: every www. visit is sent to itsutsu.com first.

## 0.33.0
- A colophon on every page: the stage, and the edition in three numeral systems.

## 0.32.0
- The About page tells the numbers: Elo with its formula and curve, the twenty-six renju openings, Connect Four solved, and the elder sites compared.

## 0.31.0
- A rating per game, alongside the ladder overall.

## 0.30.1
- Every game must be finished, not merely playable: a gate checks copy, rules, screenshot and family for each.

## 0.30.0
- Fork a game from any position: a second game starting exactly there, against the same opponent.

## 0.29.0
- The Play page shows each family with a mark, how many games have been played, and the latest game.

## 0.28.0
- Invite a friend with a one-use link and QR code.

## 0.27.0
- A members directory with won-lost-drawn, a Challenge button, and Rematch on filed games.

## 0.26.0
- A game at one screen is a match from its first stone, with its own address; undo and the record follow.

## 0.25.0
- Othello and the drop games are drawn in the squares; the centre discs are a setting; rules lock once a game begins.

## 0.24.0
- Reversi and three of its forms; every address in kebab case; a second filter on the rules page.

## 0.23.0
- Google sign-in is the front door, and a member's games follow the account.

## 0.22.0
- Post a seat for anyone to take; choose whether resigning is allowed; the set-up folds away once play starts.

## 0.21.0
- Your games, as a queue: waiting on you, waiting on them, unstarted, finished. Resign.

## 0.20.0
- A front page, and the story of the site on an About page.

## 0.19.0
- Filed games have their own pages, down to the move.

## 0.18.0
- A social card, icons and a web manifest.

## 0.17.0
- Every game has its own address.

## 0.16.0
- Toroidal Five and Obstacle Five.

## 0.15.0
- The Itsutsu brand, applied.

## 0.14.0
- Sakata and Tarannikov openings, inspired-by credits, and a second wave of games.

## 0.13.0
- Google sign-in; the rules and learning shelf open to everyone.

## 0.12.0
- The drop family, Domino Five and Block Five, ratings, and the learning shelf.

## 0.11.0
- The board can change size mid-game.

## 0.10.0
- A live embedded board.

## 0.9.0
- Drop Four, Twist Five, Twist Four, Trap Three, Square Four and tic-tac-toe.

## 0.8.0
- A growable board.

## 0.7.0
- An embeddable board.

## 0.6.0
- Emoji in a game.

## 0.5.0
- Invite-gated access and rate limiting.

## 0.4.0
- Rule variants, openings, handicaps; the first deploy.

## 0.3.0
- Clocks, statistics and a win estimate.

## 0.2.0
- Game options, position analysis and shared games.

## 0.1.0
- The engine, the board and the game panel.
