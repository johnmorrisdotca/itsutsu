# Changelog

What changed, in a player's words. Versions follow semver as the site reads it: a **minor** bump is something a player would notice — a new game, opening, page or capability — and a **patch** is a fix, a rewording, a refactor or a chore. The first **major** is reserved for the day the invite gate comes down. Patch-only versions are not listed.

The site calls itself **Beta** whatever the number says: real accounts and persisted ratings are past alpha.

Whoever lands a commit bumps `package.json` and adds a line here in the same commit, and announces the bump to the other session first, so two sessions never claim the same number.

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
