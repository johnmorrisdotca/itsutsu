# Changelog

What changed, in a player's words. Versions follow semver as the site reads it: a **minor** bump is something a player would notice — a new game, opening, page or capability — and a **patch** is a fix, a rewording, a refactor or a chore. The first **major** is reserved for the day the invite gate comes down. Patch-only versions are not listed.

The site calls itself **Beta** whatever the number says: real accounts and persisted ratings are past alpha.

Whoever lands a commit bumps `package.json` and adds a line here in the same commit, and announces the bump to the other session first, so two sessions never claim the same number.

## 0.143.0
- The one-line way to start a game is back on the games page, beside the setup screen rather than instead of it: say it in a sentence when you know what you want, or settle everything properly when you do not

## 0.142.0
- Work on the board is claimed rather than assigned, with a six-hour lease: a row says who has it and since when, and goes stale on its own rather than sitting on somebody's name for ever
- The people building this site can finally write to the board through its own door, so a request you make is a row you can see, rather than something written past every check the board has

## 0.141.0
- What you choose on the site is kept on your account rather than in this browser, so it follows you between devices. The first of them is the narrowing on the players page, which now remembers what you actually chose rather than whichever link the browser happened to look at

## 0.140.0
- Four words you pick are your own key on somebody else's device: tap four words from the list the site offers, and you can claim your own seat on a shared tablet without anybody signing out. Order does not matter, and there is no box to type them into

## 0.139.0
- Your games list draws quickly however much has been played on the site: a game now remembers whose turn it is rather than having every move replayed to work it out

## 0.138.0
- Each game is drawn the way that game is actually drawn: tic-tac-toe, Othello and checkers in the squares, gomoku and Go on the crossings, rather than every game sharing one board

## 0.137.0
- Every list that names a game shows its board, so you can tell Reversi from Go at a glance rather than by reading
- A game's card is the thing you click, all of it, and every row that opens something says so with an arrow
- Your games live at /play, which is the word the navigation bar has always used. A bookmark to /my-games no longer works

## 0.136.0
- After your move, the next game waiting on you opens by itself, oldest first — no going back to a list and no hunting for whose turn it is. When that was the last one, it says so rather than leaving you on a blank page

## 0.135.0
- Play leads to settling a game rather than to a board: the game, the board, the pace and who you are playing are all agreed before a stone can be put down, and there is a setup screen for when you have not picked a game yet
- The board you can just start playing on is still there, under an honest name — it is how you meet a game nobody has played, and how two people at one screen play

## 0.134.0
- The computer players can play Chinese Checkers: every grade now races for the far camp and wins one, where before every game against one wandered and was called off unfinished

## 0.133.0
- A link to a person carries their id, not their name, so a member's surname is no longer in the markup of every page that names them

## 0.132.0
- Changing your display name no longer erases your record: your games, your rating and your standings follow you, and every ladder shows the name you chose

## 0.131.0
- A seat link you cannot take says so on the game's own page, with the site around it, and tells you how many games you are holding

## 0.130.0
- Twenty games at once is the limit however you come by the twenty-first: answering a posted seat and following a seat link are counted too, and say how many you are holding

## 0.129.0
- Changing the language back works: choosing English after Japanese now takes effect on the click, rather than needing the site's data cleared
- The people who played a game are offered a game on that game's own page

## 0.128.0
- The ladder is beside a game rather than below it: the top 25 in the side column, with the whole table one click away
- A game nobody has played shows its table anyway, says so, and offers to let you be the first

## 0.127.0
- A game is one address with everything about it underneath: its rules live at the game rather than in a namespace of their own, and the games root is where you meet them

## 0.126.0
- The site speaks Japanese as well as English: ask for it once and it is remembered, and the address goes back to being just the address

## 0.125.0
- A game's own page is where the whole errand is done: its rules, who is best at it, the standings, your own record, the games already played, a game offered to anyone on the ladder, and the other games in its family

## 0.124.0
- The front page offers the games catalogue beside Play, Play goes to your own games rather than the catalogue, and the navigation reads in one language
- A long request on the board shows its opening and offers the rest, rather than printing every paragraph of it

## 0.123.0
- Play is the games you have going, oldest waiting at the top, and Games is the catalogue — two pages where one did both and grew a section every time you played

## 0.122.0
- A game's rules page shows the games people have actually played of it, with the count leading to all of them and each game to its own replay

## 0.121.0
- A member is shown by their first name and an initial — Hanako M. — on every board, list, ladder and picker. The link still leads to them, the computer players keep their whole names, and the operator's own list still shows who is who

## 0.120.0
- A game you are playing, and a game already filed, both show the moves that got them there — click one on a filed game to jump straight to that position

## 0.119.0
- A game whose win condition its own board could never reach is refused when it is created, not left to sit unwinnable

## 0.118.0
- A game with no stones played on it is called off, not resigned — no score moves, no farewell said

## 0.117.0
- An opponent shown in your record now offers what you would do about them: challenge, buddy, or ignore

## 0.116.0
- The members list can be asked how much of each record — against people, against programs, or both — it is counting

## 0.115.0
- A ladder for games against the computer players, standing apart from the ladder of people

## 0.114.0
- Every game's name, and every count of games shown anywhere on the site, now leads to exactly what it is counting

## 0.113.0
- A limit on how many games one member can have running at once, and the waiting room can be filtered down to the seat you are looking for

## 0.112.0
- A record from elsewhere is a source, not a kind of person

## 0.111.0
- Two players who know one game each: Tamenoki at Reversi, Meritalu at five in a row

## 0.110.0
- A life of playing before the games played here, and the narrowing you asked for last time

## 0.109.0
- One way to show a record, on every page that shows one

## 0.108.0
- A game nobody is getting anywhere in ends, and says which

## 0.107.0
- The board says what is worth doing and what is easy, and the set-up gets out of the way

## 0.106.0
- The board says what is open and what somebody is on

## 0.105.0
- A board is drawn from your own side of it, whichever seat you are in

## 0.104.0
- A choice made before the page is listening is no longer dropped, and a seat list is narrowed before it is cut

## 0.103.0
- A game keeps the length it was created to be won at, every game name leads to its game, and a busy game stops hiding the rest

## 0.102.0
- Four lists about players, one at a time, each asking only for what it needs

## 0.101.0
- Three questions to ask of a list of players: who, how settled, and seen lately

## 0.100.0
- Everything somebody has played, added across every site, and honest about being a snapshot

## 0.99.0
- Five computer players, not three: разряд from Russia and 国手 from China join Kyu, Dan and Meijin

## 0.98.0
- What you can do about somebody, on the page about them

## 0.97.0
- A seat posted for anyone says it is waiting, instead of announcing a move against nobody

## 0.96.0
- A record starts at the start, the computer players survive every list, and the ignore list keeps a seat off your board

## 0.95.0
- Every release on a page of its own, open to everybody, and a rules page that shows its game

## 0.94.0
- A flag beside every player's name, the three computer players included

## 0.93.0
- The computer players say hello before the first stone and thank you for the game

## 0.92.0
- A finished game offers a rematch with the colours swapped, and the computer players stay on the players page

## 0.91.0
- A game is settled on its own setup screen before it exists, ignoring somebody now holds for a watcher too, and a board you chose is yours on every page

## 0.90.0
- Go 囲碁, the board turned round to face you, and a reading that says who is ahead in terms each game can actually be put in

## 0.89.0
- Quick phrases over a slow game, the board a game is actually played on, and a game that says up front when it will not count

## 0.88.0
- Draughts, and Chinese Checkers on the six-pointed star

## 0.87.0
- A finished game keeps its conversation, and a seat link stops the moment play begins

## 0.86.0
- The computer players are listed, badged and findable, and a profile shows both rating pools

## 0.85.0
- Three computer players — Kyu, Dan and Meijin — who hold seats, play any game here, and carry ratings of their own

## 0.84.0
- Every person's name on the site leads to that person

## 0.83.0
- Starting a game comes before the games you already have, and the page can be stripped back to the board

## 0.82.0
- A seat's link is only shown while that seat is still waiting for somebody

## 0.81.0
- A member's row says what kind of member they are, and shutting an operator's account finally means something

## 0.80.0
- The features board is the operator's: out of the site's navigation, and shut to everybody else

## 0.79.1
- Every player page keeps a tab for this site, whether or not there is anything in it

## 0.79.0
- The About page says what Go is, how a move is written down, and what this site's ratings actually do

## 0.78.0
- The operator's page is three tabs, and a clock starts when the second player sits down

## 0.77.0
- A player's page is tabs, one per site they played on, and a kept record says what its figures mean

## 0.76.0
- A seat nobody is sitting in runs no clock and cannot be timed out

## 0.75.0
- A member is keyed by their opaque id, not their address, and a kept record needs no address at all

## 0.74.0
- A game's seats hold the member's opaque id rather than their address

## 0.73.0
- Ratings hang off a member's opaque id, and the kept records are members like anybody else, with ids built from the words John chose

## 0.72.0
- One person is one kept record: Chibi's two site records and John's two become one page each, with a section per site

## 0.71.0
- Nothing destructive happens on one click: resigning, claiming a missed turn, shutting an account, taking a name off and revoking an invite all ask first, in the site's own words

## 0.70.0
- Every member has an opaque id of their own, given once and never derived from a name or an address, with one validator shared by generated and curated ids

## 0.69.0
- Standing game options kept against the account: board, clocks, length, rated and the advanced switches, set once and used to start every new game

## 0.68.0
- The board a member likes — the wood, the stones, the grid — is kept on their account, so a phone and a laptop set out the same one

## 0.67.0
- A member can name the days of the week they do not play, and deadlines in games that honour vacation step over them every week without spending an away day

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
