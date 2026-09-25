# Changelog

What changed, in a player's words. Versions follow semver as the site reads it: a **minor** bump is something a player would notice — a new game, opening, page or capability — and a **patch** is a fix, a rewording, a refactor or a chore. The first **major** is reserved for the day the invite gate comes down. Until 0.186.1 a patch with nothing to say was not listed; since then every release, patch or minor, has its own dated heading and at least one line.

The site calls itself **Beta** whatever the number says: real accounts and persisted ratings are past alpha.

**`pnpm release:take` takes the number.** A heading it writes reads `## <version> — <date>`, the UTC calendar day it was taken, immediately before the push that carries it out — so the date is the day the release actually shipped, not an estimate. Every heading above without one is a release that took its number by hand, before this tool existed; 151 of them, and they stay undated on purpose. A date cannot be worked out for them after the fact — nothing recorded when they went out — and a guessed one would be worse than the honest gap it would paper over. Whoever lands a commit still bumps `package.json`, but the version itself is now claimed by the tool refusing a number already taken, not by an announcement between sessions.

**One feature, one version.** John, 2026-09-21: "each feature is a version increase". A number is what a reader points at — "the one where Honeycomb arrived" — and a release carrying five things is a number that names none of them. `pnpm release:take` refuses a minor with more than one `--summary` for that reason; a **patch** may still carry several, because a pile of small fixes is one release by nature and nobody points at the version a typo went out in. Several releases still land in ONE push: the push is the deployment, the number is not, so this costs no build.

**0.221.0 through 0.225.0 all carry the same date, and that is not an error.** They went out together, in one deploy, as a single 0.221.0 with five lines under it — the release this rule was written from. They were split into a release each afterwards, dated the day they actually shipped, which is the one thing about them that was never in doubt. The rows those five closed on the board are stamped 0.221.0, the number they were shipped at; nothing rewrites a closed row, and a stamp that says where the work landed is still true.

## 0.331.2 — 2026-09-25
- A puzzle picked up again from My games keeps its steps, so the scrubber goes back past the moment it was left

## 0.331.1 — 2026-09-25
- Deploys are quicker: the checks and browser tests run in more, shorter lanes side by side

## 0.331.0 — 2026-09-25
- WordDrop Kana: find a hidden Japanese word in six guesses, with colours for the right kana and its column, and arrows for the wrong size or mark

## 0.330.0 — 2026-09-25
- Puzzles have a scrubber under the board, with its controls under it and the steps folded until you open them

## 0.329.1 — 2026-09-25
- On a puzzle the clock sits left of Pause, and Pause is there from the start, so it never moves

## 0.329.0 — 2026-09-25
- WordDrop keeps every word you have played, with your guesses and what each scored

## 0.328.0 — 2026-09-25
- WordDrop scores every word you play: each letter found, sooner for more, and a word not found still counts

## 0.327.0 — 2026-09-25
- In WordDrop a typed letter can be tapped and changed, or cleared with Space or Delete, before the guess goes in

## 0.326.0 — 2026-09-25
- WordDrop's letter keys are out on a phone and can be put away on a computer

## 0.325.0 — 2026-09-25
- WordDrop can be drawn as Othello discs, Gomoku stones or letter tiles, and remembers which

## 0.324.0 — 2026-09-25
- Every rated game now records what it did to both players' ratings, shown as +10 or −10 on My games' Completed rows and on the result card

## 0.323.0 — 2026-09-25
- Puzzles have Check, Show and Hint: Check counts mistakes, Show marks them, and Hint puts in one right cell

## 0.322.0 — 2026-09-25
- Today's word and today's puzzle: one grid a day, the same for everybody, from each puzzle's page

## 0.321.1 — 2026-09-25
- A race's seat link no longer loops for a signed-in reader with no account; the race says the seat needs one
- A puzzle you have started says Resume on its page, and opens the grid where you left it

## 0.321.0 — 2026-09-25
- Each completed game on My games shows the XP it earned you

## 0.320.0 — 2026-09-25
- My games' Puzzles tab shows the puzzles you have going and the ones you have solved, each with its points, time and help

## 0.319.0 — 2026-09-25
- Step through a famous game's moves on its card: the board at any move, a scrubber and the move list

## 0.318.0 — 2026-09-25
- A famous game's picture opens in a window of its own, with an expand icon on its corner, Close, and Esc to come back

## 0.317.0 — 2026-09-25
- The move list can be written our way, IYT style or GT style, and remembers which you chose

## 0.316.1 — 2026-09-25
- The Games page's Families, Cards and Plain list are tabs, with the Learning shelf and Famous games as two more
- The game page holds still: the banner over the board is always there, and the panel above the record keeps its height, so the board and scrubber never jump
- A game's page and its rules page share one picture size and one right-hand column
- A level's page says which level you are on, and leads there
- A game's own page shows the trail, Games / its name, as the pages under it do
- Play alone 独 and Play a friend 友

## 0.316.0 — 2026-09-25
- WordDrop, a word puzzle of our own, opens the Other family: find the hidden word in six guesses, each coloured letter by letter

## 0.315.1 — 2026-09-25
- Every name shows its flag and, for a computer player, a BOT badge, the same on every page
- Champions is a tab of Players
- On a phone every tab is in view, and My games rows keep Resign and the arrow together under the game
- My games' Completed tab shows twenty games a page with Older and Newest arrows

## 0.315.0 — 2026-09-25
- My games is in tabs: Going shows your move beside theirs with big counts, and Completed, Pass and play and Puzzles each have a tab of their own

## 0.314.0 — 2026-09-25
- In a game or a puzzle, Rules open over the board instead of taking you away from it

## 0.313.1 — 2026-09-25
- A puzzle you Continue from My games starts running straight away instead of opening paused
- While a puzzle is paused its number keys are switched off too, not just Check and Hint

## 0.313.0 — 2026-09-25
- Every game's page and rules page has one big Play button under its picture, and a puzzle's set-up is just Options beside two big buttons, Play alone and Play a friend

## 0.312.0 — 2026-09-25
- Sudoku comes in a Giant size: 16×16, with boxes four by four and the letters A to G after 9

## 0.311.0 — 2026-09-25
- The puzzles go by the names you know: Sudoku, Jigsaw Sudoku, Diagonal Sudoku, Killer Sudoku, Futoshiki and Skyscrapers

## 0.310.0 — 2026-09-25
- Every puzzle's page leads with its leaderboard, all time and this month: five points a cell you fill, less fifty a Check or Hint.

## 0.309.1 — 2026-09-25
- The Number Place picture no longer has XP notices across its grid.

## 0.309.0 — 2026-09-25
- Number puzzles can have a Hint: choose it when you set the puzzle up, and it marks which cells are wrong.

## 0.308.1 — 2026-09-25
- Each release on the releases page is its number and date on one line and its title under them, and opens when it has more to say.

## 0.308.0 — 2026-09-25
- A feed of what you and your buddies have been playing, and a page of finished games from everyone, one line each.

## 0.307.1 — 2026-09-25
- The local development server moves to port 6700, out of the range another of John's projects uses.

## 0.307.0 — 2026-09-25
- Three clear places: My games for the games you have going, New game as the button that starts one, and Games as the library of every game.

## 0.306.0 — 2026-09-25
- My games shows how many games you have going, and the line under the header says it too, instead of Nothing waiting.

## 0.305.0 — 2026-09-25
- Black and White joins Numbers: fill the grid with black and white stones, half of each in every line and never three in a row.

## 0.304.0 — 2026-09-25
- Towers joins Numbers: every number is a tower's height, and the clues around the edge say how many you can see.

## 0.303.0 — 2026-09-25
- Sum Cages joins Numbers: our Killer Sudoku, with nothing printed but the sums of dashed cages.

## 0.302.0 — 2026-09-25
- An unfinished puzzle is kept when you pause it or leave, waits in My games, and opens where you left it.

## 0.301.0 — 2026-09-25
- Number puzzles let you choose how many Checks you get: no limit, three or one. Running out takes the help away; the puzzle goes on.

## 0.300.1 — 2026-09-25
- A solved 9×9 Jigsaw or 7×7 More or Less is now kept and paid; the site had been refusing them.

## 0.300.0 — 2026-09-25
- Live games and puzzles now ask "Are you still there?" after a couple of quiet minutes, as practice games always have; a puzzle pauses while you are away.

## 0.299.0 — 2026-09-25
- Number puzzles have a Pause: the clock stops and the grid is covered until you resume.

## 0.298.0 — 2026-09-25
- In a number puzzle, tapping the chosen cell again counts it up: 1, 2, 3 … then empty, then 1 again.

## 0.297.0 — 2026-09-25
- A game's page puts its champions, family and links level with the game's name at the top, instead of below it.

## 0.296.0 — 2026-09-25
- The set-up screen no longer moves when you choose a family, a game or a board: every tile is the same size, a family's games sit in one row on a desk, and a puzzle's level has its own section below.

## 0.295.1 — 2026-09-24
- A browser-free test of the email rules now runs the way the checks do, so the last release can go out.

## 0.295.0 — 2026-09-24
- Members under 13 are kept private: no city, country or bio, never shown as online, never emailed, and only the friends on their own buddy list can write to them or offer them a game.

## 0.294.0 — 2026-09-24
- Diagonal joins the Numbers family: Number Place where the two long diagonals must hold each number once as well.

## 0.293.0 — 2026-09-24
- Jigsaw joins the Numbers family: Number Place with its boxes cut into irregular regions, at five, six, seven or nine.

## 0.292.1 — 2026-09-24
- The puzzles are drawn on the same wooden board as every game, with white paper to write on, and the set-up screen previews the chosen puzzle at the chosen size, in the same place as a game's board, so the page no longer jumps.

## 0.292.0 — 2026-09-24
- Your account has a Settings tab beside Profile: Profile is who you are, Settings is how the site behaves for you, and the account menu offers both.

## 0.291.0 — 2026-09-24
- Terms of play, beside the privacy page: one account each, your own moves, kindness at the board, and how an account is shut or ended.

## 0.290.0 — 2026-09-24
- Your own page lists what Itsutsu holds about you, and you can remove your account from it; the operator can do the same on request.

## 0.289.0 — 2026-09-24
- Race a friend at any puzzle: the same grid, two clocks kept by the site, and the faster correct solve wins. Every solve is kept, with the fastest on the puzzle's page.

## 0.288.0 — 2026-09-24
- A new member is asked their age band before anything else, and a member under 13 needs a parent's or guardian's consent to keep an account.

## 0.287.2 — 2026-09-24
- A puzzle's sizes are chosen from the same tiles as every board on the site: the big number in the board's grid, a check on the chosen one, and a word for what the size is for.

## 0.287.1 — 2026-09-24
- Choosing Numbers on the set-up screen now turns the screen to the puzzle: its name at the top, its picture where the board preview was, and its size, level and Solve in place of the opponent, the rules and Begin.
- A puzzle's set-up marks the size that is chosen.

## 0.287.0 — 2026-09-24
- A finished game's replay, and a game played on one screen, have Start, Back, Play, Forward and End beside the scrubber. Play steps through the game on its own and stops at the last move.

## 0.286.2 — 2026-09-24
- A browser test expects the Numbers family on the set-up screen, where the last release put it; that test had stopped the release going live.

## 0.286.1 — 2026-09-24
- A browser test counts all eight families on the set-up screen, Numbers included.

## 0.286.0 — 2026-09-24
- More or Less joins Numbers: fill the square so every row and column holds each number once and every more-than mark between two cells is true, at 4×4 to 7×7.

## 0.285.2 — 2026-09-24
- The set-up screen shows Numbers as its eighth family, and each puzzle there leads to its own set-up.
- Two browser tests bring their own games, so a fresh test database no longer fails them.

## 0.285.1 — 2026-09-24
- Two browser tests make a member of their own, so two runs at once no longer take each other's away.

## 0.285.0 — 2026-09-24
- Hidden Stones joins Numbers: one black stone hides in every row, column and region, no two touch, made and timed in your browser at 5×5 to 10×10.

## 0.284.0 — 2026-09-24
- Every page now opens the same way: one title at one size, its tabs under it, and its tables and lists in panels.

## 0.283.1 — 2026-09-24
- A browser test chooses its family among the games the set-up screen offers, now that the Numbers family holds a puzzle.

## 0.283.0 — 2026-09-24
- A new family, Numbers, opens with Number Place, our Sudoku: 4×4, 6×6 and 9×9 at three levels, made and timed in your browser, and paid in XP when the site checks it.

## 0.282.1 — 2026-09-24
- The line under the header sits the same distance from it on every page, and the home page no longer shows it.
- The account menu's items have room between them.
- My games no longer repeats the Games link, and offers the inbox only when something in it is unread.

## 0.282.0 — 2026-09-24
- Halma and Chinese Checkers join Go and Hex in one family, Territory and races.

## 0.281.1 — 2026-09-24
- The browser test for the XP toast in Japanese reads it the moment it appears; 0.280.2 kept the toast's place on the page but was not what made that test fail.

## 0.281.0 — 2026-09-24
- A line under the header shows your games waiting, your record, your level and your XP, each one a link.

## 0.280.3 — 2026-09-24
- A browser test finds the game's warning banner by what it is, now that every page carries the XP announcer.

## 0.280.2 — 2026-09-24
- An XP toast is no longer taken off the screen when the page it is on is drawn again.
- The site's server code is a third smaller again, carrying its own changelog and no other package's.

## 0.280.1 — 2026-09-24
- Choosing a language in the account menu no longer closes it, and the menu offers About and Profile and points at its button.

## 0.280.0 — 2026-09-24
- A Privacy page says what the site keeps about you, who can see it and how to have it removed, open to anyone.

## 0.279.0 — 2026-09-24
- A report of a problem can carry a screenshot, added or pasted, and the operator sees it beside the report.

## 0.278.2 — 2026-09-24
- The Report a problem window uses the site's own buttons and shows the page, version and date that go with the report.

## 0.278.1 — 2026-09-24
- The Report a problem link is easy to tap on a phone.

## 0.278.0 — 2026-09-24
- Anybody can report a problem from the foot of any page, and the operator reads the reports on the Admin page.

## 0.277.1 — 2026-09-24
- A computer player's page opens even before anybody has visited the list of players.

## 0.277.0 — 2026-09-24
- Every page is one width, with text running across it, and the offer of a game says Play everywhere.

## 0.276.0 — 2026-09-24
- The About page has a Playing here chapter, with pictures of the board, the move slider, a game as one picture, and playing with people.

## 0.275.0 — 2026-09-24
- The Beta badge leads to the thank-you page, which now also says how to help test and how to ask for an invite.

## 0.274.0 — 2026-09-24
- The thank-you page for the beta testers is open to everybody, and the front page links it.

## 0.273.1 — 2026-09-24
- The XP awards for playing every game now say how many games there are, instead of a number that went out of date.

## 0.273.0 — 2026-09-24
- The About page explains how to get started, charts the games, and adds a glossary, the XP ladder and how the computer players think.

## 0.272.0 — 2026-09-24
- A thank-you page credits the beta testers by name, and the front page says people are helping test.

## 0.271.0 — 2026-09-24
- The front page says what is on the site, shows every family of games, and says how to ask for an invite or help test the beta.

## 0.270.2 — 2026-09-24
- The site's server code is about a third of the size it was, and each release checks it stays small.

## 0.270.1 — 2026-09-23
- Release notes use the full width of their panel instead of stopping part of the way across.

## 0.270.0 — 2026-09-23
- Your name in the header now opens one menu with your page, your inbox, the language, the version and signing out, so the header is the same for everybody.

## 0.269.0 — 2026-09-23
- A game from ItsYourTurn or GoldToken can be pasted onto the practice board and walked through, read by that site's own lettering.

## 0.268.3 — 2026-09-23
- A game's picture of every position opens in a window from beside the move list, instead of standing under the board.
- A game played on one screen has a slider from the first move to the last, and its picture of every position.

## 0.268.2 — 2026-09-23
- The Beta mark sits beside the wordmark, on the same row.

## 0.268.1 — 2026-09-23
- A game's picture of every position is always there, drawn by itself after every move, on a game in play and a finished one.
- A live game's moves sit in the panel beside the board.
- Just the board shows the board, centred, and what it takes to play — nothing else — and stays on from game to game.

## 0.268.0 — 2026-09-23
- A small Beta mark in the home page's hero and in the header of every page, so everybody knows the site is still being built.

## 0.267.1 — 2026-09-23
- Famous games now shows only games from records whose owners allow it: the Othello championship games are taken out until permission is asked for.

## 0.267.0 — 2026-09-23
- A game in play can show every position so far as one picture, from under its move list.

## 0.266.0 — 2026-09-23
- Famous games: world Othello finals, AlphaGo against Lee Sedol and more, each replayed here and made into a picture of every move.

## 0.265.0 — 2026-09-23
- Your games of one kind, each as it ended, on one picture — won, lost or all — drawn in your browser from your own page.

## 0.264.0 — 2026-09-23
- A finished game can be made into one picture of every move, drawn in your browser and yours to download.

## 0.263.1 — 2026-09-23
- At Go the computer no longer fills in ground it has already walled in.
- A live board that is checking for a move no longer makes the server rebuild the whole game when nothing has changed.
- The computer players' code is kept apart from the rest of the site, and the strength tables are measured again.

## 0.263.0 — 2026-09-23
- Connect6 gets a specialist of its own: Ichen Wuyi, who counts the stones it would take to stop every threat.

## 0.262.0 — 2026-09-23
- Go gets a specialist of its own: Shūsaku Hondō, who counts ground rather than lines.

## 0.261.0 — 2026-09-23
- Checkers and every draughts game get a specialist of their own: Marion Tinsdale, who reads the board as a draughts player does.

## 0.260.0 — 2026-09-23
- The computer players open from a book, so no two games against them start the same way.

## 0.259.0 — 2026-09-23
- Each game's page shows the game made of its own games: the final positions of the last twelve played here, each one a way into that game.

## 0.258.0 — 2026-09-23
- Messages between members: write to another player from their page, and it reaches their inbox. Ignoring somebody stops their messages both ways.

## 0.257.0 — 2026-09-23
- An inbox: what happened in your games while you were away — a game finished, a challenge asked or answered, a seat you posted taken, a note sent to you — kept for thirty days.

## 0.256.0 — 2026-09-23
- The front page says how many players and games there are and who is here now, as an early release by invitation, counting people only.

## 0.255.0 — 2026-09-23
- A note to your opponent can go with your move: pick an emoji and write a line beside Submit, and it arrives with the move.

## 0.254.0 — 2026-09-23
- Go marks the board for a beginner: a cross where a stone may not go, and a ring on the point that captures or saves a group in atari.

## 0.253.0 — 2026-09-23
- Go helps a beginner: the board says when your opponent has passed and the game can end, names any group about to be captured, and warns before a stone fills your own eye or leaves your group in atari.

## 0.252.1 — 2026-09-23
- The computer players judge Halma and Chinese Checkers by the real number of steps each piece has left, instead of a count that was wrong on both boards.

## 0.252.0 — 2026-09-23
- Paired games: play a match of two, four or six games at once against the same player, taking each colour in turn so neither side keeps the advantage of moving first.

## 0.251.1 — 2026-09-23
- A member who is already signed in is no longer asked for an invitation at the bottom of the home page.

## 0.251.0 — 2026-09-23
- The computer players now look ahead in the piece games and the twist games, so a higher grade is a stronger opponent there too.

## 0.250.3 — 2026-09-23
- A browser check that could close its own message before reading it no longer stops a release from reaching the site.

## 0.250.2 — 2026-09-23
- Sixty-five finished requests on the board now say which release shipped them; forty-four that could not be matched with confidence are left blank rather than guessed.

## 0.250.1 — 2026-09-23
- Releases reach the site faster: each push runs its browser tests once instead of twice.

## 0.250.0 — 2026-09-23
- Against the computer, you can have a move go down as soon as you touch the board: a switch on the board turns confirming off or on, and it is remembered.

## 0.249.4 — 2026-09-23
- Releases reach the site faster again: the browser tests now run in twelve parts at once.
- The README and the email notes describe the site as it is now.

## 0.249.3 — 2026-09-23
- Releases reach the site faster: the checks run side by side and the browser tests are split eight ways instead of four.

## 0.249.2 — 2026-09-23
- A release now reaches the site only after its browser tests pass.
- What a visitor with no invite may see is written down: the games, not the people.

## 0.249.1 — 2026-09-23
- An account made with an invite code is reminded on its own page, after the welcome too, that it lives in one browser until Google is linked.

## 0.249.0 — 2026-09-23
- A visitor with no invite can ask for one from the join page, the games page or a game's ladder, and the request is emailed to the site's owner.

## 0.248.1 — 2026-09-23
- No family shows more than eight games; Chinese Checkers is no longer also listed under Strange boards.

## 0.248.0 — 2026-09-23
- On a big screen a live game's board fits the screen by default, and S, M and L let you pick another size, remembered on your account for your other desks.

## 0.247.3 — 2026-09-23
- On a desk, the set-up screen's first row is symmetrical: families on the left, the board in the middle, its sizes on the right.
- After pressing Begin, Back returns to the set-up screen again, instead of sometimes skipping it and leaving the site.

## 0.247.2 — 2026-09-23
- On a desk, the set-up screen's first row is the families in two columns, the board, and its sizes, so the board no longer moves as you browse families.
- Opening the rules, the handicap or a list of opponents keeps every answer in its column, with the choices opening underneath the row.

## 0.247.1 — 2026-09-23
- On a phone, a big board's row numbers stay beside the board instead of running on past its bottom edge.
- A browser test that still expected the family called Flips now reads the family's name from the catalogue.

## 0.247.0 — 2026-09-23
- On a tablet or desk, who you play sits in one row, and the rules and handicap in another; opening one of them shows its choices underneath the row.

## 0.246.0 — 2026-09-23
- On a tablet or desk, the set-up screen shows the games first and the board beside its sizes, so you can see the board while you choose how big it is.

## 0.245.2 — 2026-09-23
- The About page's computer-ladder figure is checked by its half line again, after three measured pairings came out exactly level.

## 0.245.1 — 2026-09-23
- The measured strength tables now cover twelve boards instead of six, so more games show how the graded players actually did against each other.

## 0.245.0 — 2026-09-23
- The games are grouped into eight families instead of eleven: Reversi and Ninuki sit together under Turn and take, the queue and twist games join the strange boards, and Go and Hex share Territory.

## 0.244.1 — 2026-09-22
- The coordinates on Hex's biggest board fit their tiles instead of running into each other.
- The letters and numbers around every board stand a pixel clear of the frame rather than touching it.
- Hex, Hexversi and Chinese Checkers are on the Strange boards shelf, and Chinese Checkers is on the Checkers shelf too.

## 0.244.0 — 2026-09-22
- Halma and Chinese Checkers have a player of their own: Howard Monkton counts the steps every piece has left, gives each one a square of the far camp to aim for, and plays for the piece you leave behind.

## 0.243.1 — 2026-09-22
- The hexagons on the star, the honeycomb, Hexversi and Hex are hexagons again, and so is the honeycomb behind them: every cell was drawn with a five-degree lean and three different edge lengths.

## 0.243.0 — 2026-09-22
- The board says when it will next check for your opponent's move.

## 0.242.0 — 2026-09-22
- Choose which seat you take when you make a game: black, white, or drawn by lot.

## 0.241.0 — 2026-09-22
- The games you have going with one person are a page of their own, and the count beside their name leads to it.

## 0.240.2 — 2026-09-22
- The browser suite runs as four shards, so a whole run takes about thirteen minutes instead of fifty.
- Five games that had shipped with no browser test have one, and the gate that asks for one now checks.
- From somebody's own page, starting a game with them is two presses, and a case says so.
- The specs that page the record and the ladder play the games they page through, rather than relying on rows other tests left behind.

## 0.240.1 — 2026-09-22
- Three browser specs brought up to date: two that still asserted the site as it was two releases ago, and one that raced itself.

## 0.240.0 — 2026-09-22
- The three hexagon boards — Chinese Checkers, Honeycomb and Hex — are drawn one way: a faint lattice across the whole board, the playable shape in tiles, Hex's edges as a ring of them, and the coordinates on the board in the ring.

## 0.239.0 — 2026-09-22
- Who is here now folds past the first few, and the fold says how many more — /games is half the phone screens it was.

## 0.238.0 — 2026-09-22
- A graph of the computer ladder on the About page: how often each grade beat the grade below it, at every game that has been measured.

## 0.237.0 — 2026-09-22
- Begin sits you down at a stranger's seat that matches exactly what you chose, instead of a page that says it all again.

## 0.236.0 — 2026-09-22
- The practice board lists its moves where you can find them, takes a pasted game in the formats these games are published in — however badly it is formatted — and says plainly that nothing on it is a match.

## 0.235.0 — 2026-09-22
- Every game's picture is a picture of the board as it is drawn now, and the build fails when it is not.

## 0.234.0 — 2026-09-22
- The About page reads a chapter at a time — the story, the games, where they came from, Japan, the numbers and the programs — instead of thirty-four phone screens in one scroll.

## 0.233.0 — 2026-09-22
- The board and the Send button fit one phone screen: while a move waits, the row that sends it stays at the bottom of the screen.

## 0.232.0 — 2026-09-22
- Every button, list and box on a phone is now big enough to hit with a thumb.

## 0.231.0 — 2026-09-22
- A stone placed on a phone says which point it landed on, and four arrows move it a point at a time before you send it.

## 0.230.0 — 2026-09-22
- Chinese Checkers fills its board: the star was drawn at half the width and under a third of the wood, with seventeen column letters pointing at nothing.

## 0.229.1 — 2026-09-21
- One feature, one version: 0.221.0 is split into the five releases it carried, and a release names one feature from here on.
- A release commit carries no co-author trailer.

## 0.229.0 — 2026-09-21
- Nothing pushes a phone sideways any more: the honeycomb board and every table of records fit a 390-pixel screen, so no page is shrunk to fit.

## 0.228.0 — 2026-09-21
- No way into a game takes more than two presses — from the front door, a game's card, the members list or a buddy — and "Be the first to play" now starts a real game.

## 0.227.0 — 2026-09-21
- A buddy list page: the people you know, whether they are about, the games running between you and how many wait on you, and Play beside each name.

## 0.226.0 — 2026-09-21
- The honeycomb fills its board at every size instead of floating in a square frame, and every list of boards is in numerical order.

## 0.225.0 — 2026-09-21
- Place a stone and look at it before you send it, with a setting to turn that off — and when a move goes, straight on to the next game waiting on you.

## 0.224.0 — 2026-09-21
- Starting a game is one screen now. It states the whole game — the board, who you play, every rule and which colour you take — and one press begins it; it fits a phone, and the button is one you can hit with a thumb.

## 0.223.0 — 2026-09-21
- The About page says what the site actually is, with a new section on the computer players: how they think, that they think in your own browser, and what happened when they were made to play each other.

## 0.222.0 — 2026-09-21
- A new game: Honeycomb 蜂の巣, Reversi on a hexagon of hexagons — six directions to bracket a run along instead of eight, six corners that can never be turned, and four boards from 37 cells to 127.

## 0.221.0 — 2026-09-21
- A board is named for the shape it really is — a hexagon says how many cells it has rather than pretending to be a square.

## 0.220.0 — 2026-09-21
- The computer players now say what they actually do at each game: a measured round robin against the rungs above and below, shown on each one's page and beside the opponent you are choosing — and where two grades are level, it says level rather than pretending one is stronger.

## 0.219.1 — 2026-09-21
- The site now has one way of sending email, with the caps on it: game notices go through the same sender as an invitation, and cannot grow a way out of their own.

## 0.219.0 — 2026-09-21
- Computer players keep to the time they are given: the check that stops a program handing you the game now shares the move's clock instead of running before it, so a move costs what it says it costs.
- A game against a computer is answered with one reading of the board rather than two.

## 0.218.0 — 2026-09-18
- Setting a game up is shorter: a choice you have already made — the opening, who you play, whether it counts — folds to one line saying what it is, with Change beside it.

## 0.217.0 — 2026-09-18
- A game against a computer player no longer stalls when you close the tab mid-move: the move is made in your own browser the moment you open your games again.
- The board no longer shows a seat link or a QR code for a seat somebody already holds — a computer player's chair, or a player you challenged by name.

## 0.216.1 — 2026-09-17
- When the strongest computer players have to refuse the move they first chose, they now fall back on the next move their own reading liked, rather than on the best-looking shape.

## 0.216.0 — 2026-09-17
- The strongest computer players find a forced win faster, reading it on the board they are already thinking on: against the grade they replace, fifteen wins to four over twenty games.

## 0.215.0 — 2026-09-17
- The strongest computer players think about nine times faster: they keep one board up to date as they read ahead instead of rebuilding it for every position, and spend the time they save looking further — the top grade now reads twelve moves deep.

## 0.214.0 — 2026-09-17
- In a sharp position the strongest computer players now read only the moves that answer the threat, so they see forcing sequences many moves deeper — they stop throwing away won games and stop walking into lost ones.

## 0.213.0 — 2026-09-17
- The strongest computer players now see wins built from open threes as well as fours — theirs to play, and yours to stop — several moves before anything is forced.

## 0.212.1 — 2026-09-17
- The practice board no longer stutters after each move: reading the position for threats is about six times faster, and it is worked out once instead of twice.

## 0.212.0 — 2026-09-17
- The strongest computer players now see a win by fours coming — theirs to play, and yours to stop — however many moves away the chain ends.

## 0.211.0 — 2026-09-17
- The computer players think faster: they remember positions they have already read and stop weighing a move the moment it is refuted, so in the same time they see further ahead — about five times faster at the top grade's full depth, choosing the same moves.

## 0.210.0 — 2026-09-17
- In a live game against a computer player, it now thinks on your own device for a couple of seconds rather than a quarter of a second on the server — a much stronger opponent, and the board stays put while it answers.
- If you close the tab while the computer is thinking, its move is made for it the next time you look at your games.

## 0.209.0 — 2026-09-17
- Computer opponents search about four times further in the same time: they read each line of the board from a table built once, and pick the moves worth trying without listing the rest.
- The grades that promise never to blunder now play tic-tac-toe, Wild tic-tac-toe and Notakto perfectly.
- Six computer players with their own names, faces, home towns and styles — attackers, defenders, and one whose mood changes mid-game.
- The practice board's computer opponent thinks in your own browser, so it can take its time over a move.
- The set-up screen shows the board you are about to play on.
- The site can send email, and the About page says how to bring your record over from another site.

## 0.208.0 — 2026-09-15
- The tickets page loads only the tickets it shows.

## 0.207.0 — 2026-09-15
- An open game page asks the server far less often, stops asking when nobody is looking, and says so with a Check now button.

## 0.206.2 — 2026-09-15
- A player row's ⋯ menu no longer closes the moment it opens when pressing it scrolled the page.

## 0.206.1 — 2026-09-15
- Each release's deploy now finishes cleanly, instead of reporting a failure after the site was already live.

## 0.206.0 — 2026-09-15
- The operator can attach a game record kept under a name nobody had an account for to the member it belongs to.

## 0.205.0 — 2026-09-15
- The Admin page keeps a log of what the operator did to an account: shutting it, opening it again, taking a name off or setting one, and setting somebody's words.

## 0.204.1 — 2026-09-15
- A stalled Chinese Checkers game is now a draw by the no-progress rule, in the same words as Halma.
- Old copies of the site are no longer kept after each release, so hosting stays inside its free allowance.

## 0.204.0 — 2026-09-15
- A stalled game now says which rule drew it, the way chess names the fifty-move rule: draughts its move count, Halma its no-progress rule, Square Four its sliding rule; and Chinese Checkers allows twice as long without progress before calling a stall.

## 0.203.2 — 2026-09-15
- Code tidying: the three longest page files are split into smaller ones; nothing a player sees changes.

## 0.203.1 — 2026-09-15
- Code tidying: five of the longest source files are split into smaller ones, with nothing changed that a player would see.

## 0.203.0 — 2026-09-15
- A player who joins with an invite code now gets a full member account: buddies, ignores, applause, saved settings and everything else a Google member can do, with a welcome that says how to keep it.

## 0.202.0 — 2026-09-15
- A weaker player can be given a head start: free turns at the start of any game, or the traditional handicap in Go, Othello and draughts; a head-start game does not count toward ratings.

## 0.201.1 — 2026-09-15
- A saved preference no longer overwrites another saved at the same moment, and the browser suite can reach the tickets board and site settings.

## 0.201.0 — 2026-09-15
- Mini Reversi and Twist Four also appear under Small boards, and every game keeps one home family.
- Tables and lists show small game pictures, half the regular size, so rows stay compact.

## 0.200.0 — 2026-09-15
- Every game, family, board and opening picture now comes in just two sizes, regular and large, with its name on one line.

## 0.199.0 — 2026-09-15
- Keep a full board of twenty games moving and earn Full House, Clean Sweep and day combos.

## 0.198.1 — 2026-09-15
- Five long code files are split by what they do; nothing changes for players.
- A report-only runner measures how long Chinese Checkers games go without progress.

## 0.198.0 — 2026-09-15
- Players who joined with an invite code are signed in everywhere: they can post a seat for anyone and see who they can play.
- A practice game you win is saved even if you close the tab right away.
- A board theme you pick is kept even if you reload or leave straight away.
- The twenty-games-at-once limit is now covered by a browser test, and test servers no longer lift it for everyone.

## 0.197.0 — 2026-09-15
- Every player's page has an XP tab showing how their XP was earned, day by day, with each day's total and the running total.
- The XP board shows how much each player gained today and over the last 7 days, and how far behind the next player they are.
- Recent promotions can be counted Everywhere or Itsutsu only, and XP credited from other sites is marked as imported rather than shown as earned today.
- Twelve XP levels have new names: ColecoVision, TurboGrafx-16, Intellivision, Uno, Solitaire, You Sunk My Battleship, Triple Word Score, Shoot the Moon, Doubling Cube, T-Spin, Mahjong and Royal Flush.
- The imported-XP payer allows enough time to pay a long record in one go.

## 0.196.2 — 2026-09-15
- The site's settings, who may sign up and the join notice, now live on Sumilabu too; if they cannot be read, signing up stays invite-only

## 0.196.1 — 2026-09-15
- The tickets board now lives on Sumilabu, the board every site shares: the board page and the ticket tools read and write it there

## 0.196.0 — 2026-09-14
- Players imported from other sites now earn XP for the record they built there, and the XP board and every badge can count Everywhere or Itsutsu only.

## 0.195.1 — 2026-09-14
- On the players list and standings, each row keeps Challenge or Play in view and puts Buddy and Ignore behind a ⋯ menu, so nothing is cut off.

## 0.195.0 — 2026-09-14
- The games page has a waiting room: one table of everyone waiting for a game, with rating, time limit and country, and Sit down shows you the game before you join.
- Players who joined with an invite code can press Begin again.

## 0.194.4 — 2026-09-14
- Open seats on the games page show each player's rating and XP level, so you can pick an even match.

## 0.194.3 — 2026-09-14
- Opening the result card no longer jumps the page, and XP pop-ups no longer block the links behind them.

## 0.194.2 — 2026-09-14
- A game played with a handicap no longer changes anyone's rating, and the set-up page says so before you start.

## 0.194.1 — 2026-09-14
- A player who runs out of time mid-move (choosing a colour, turning a quarter, or partway through a capture chain) loses that turn cleanly instead of stalling the game.

## 0.194.0 — 2026-09-14
- A new Recent promotions page under XP shows who went up a level lately, newest first.
- On a rematch, the set-up heading changes as soon as you pick someone else.

## 0.193.2 — 2026-09-14
- swap2 and other opening choices work again: a pending choice is never passed.

## 0.193.1 — 2026-09-14
- The result card shows the whole XP a game earned, with any level-up, and the XP pop-ups no longer cover it.

## 0.193.0 — 2026-09-14
- When a game ends, a card over the board says who won and why, with your XP and a Rematch button; close it to see the final board.

## 0.192.1 — 2026-09-14
- Choosing someone else on a rematch now starts a new game against them, and the pages say it isn't a rematch.

## 0.192.0 — 2026-09-14
- When you have no legal move, the site passes your turn for you and both boards say so; a game where neither side can move ends in a draw.

## 0.191.1 — 2026-09-14
- liveGame split into three files by responsibility, nothing a player sees changes.

## 0.191.0 — 2026-09-14
- The set-up page shows who you play and every rule at once, adds a random computer player, and its button says Continue.

## 0.190.1 — 2026-09-14
- The set-up page keeps what you chose through a refresh, Back, and a shared link.

## 0.190.0 — 2026-09-14
- When a capture is forced, or you have only one or two moves, the board marks them and dims the rest, and says why.

## 0.189.0 — 2026-09-14
- Russian draughts and Pool checkers join the draughts family, completing the five new checkers games.

## 0.188.0 — 2026-09-14
- Three new draughts games join Checkers: International (10×10), Brazilian (8×8) and Canadian (12×12), each on its own federation's rules.

## 0.187.4 — 2026-09-14
- The players list no longer opens empty because of a filter pressed on an earlier visit, and says plainly what it's narrowed to.

## 0.187.3 — 2026-09-14
- A test now guards that sitting down, answering an offer and claiming on time never reload the board.

## 0.187.2 — 2026-09-14
- Every release, patches included, now has its own dated line on the releases page.

## 0.187.1 — 2026-09-14
- The games page only suggests sitting at a posted game whose rules match what you'd set up.

## 0.187.0 — 2026-09-14
- Every list, card and table that names a game now shows its board picture, and family icons are one larger size everywhere.

## 0.186.4 — 2026-09-14
- Records from ItsYourTurn now link Checkers and Halma 10x10 to the games here.

## 0.186.3 — 2026-09-14
- Choosing an opening, a clock or friendly play no longer seats you at somebody's posted game played under different rules.

## 0.186.2 — 2026-09-14
- When a game ends while you watch, your board turns into the finished record in place, without reloading or getting stuck.

## 0.186.1 — 2026-09-14
- The Go pass test reads each result before the board hands itself back.

## 0.186.0 — 2026-09-14
- The last page before a game now shows a larger picture of the board you chose, with its big number.

## 0.185.0 — 2026-09-14
- Every board on the set-up screen is now a big number with its name, the same whether a game has one board or several.

## 0.184.4 — 2026-09-14
- A set-up choice with only one option, like Checkers' one board, now shows as chosen.

## 0.184.3 — 2026-09-14
- Games between computer players no longer ask to send anyone an email.

## 0.184.2 — 2026-09-14
- A turn lost to the clock now replays correctly, so a game that had a timeout can carry on.

## 0.184.1 — 2026-09-14
- Go is back in the computer players' mixed batch, with the biggest board kept to the quicker players.

## 0.184.0 — 2026-09-14
- Every game on the games page shows how much it has been played and who leads it, with a way to the standings and an invitation where nobody has played yet

## 0.183.0 — 2026-09-14
- A head-to-head scoreboard shows how two players stand against each other above their games, before a game starts and after it ends

## 0.182.1 — 2026-09-14
- A live game of Go can be passed, and two passes in a row end it by count.

## 0.182.0 — 2026-09-14
- The computer players earn XP from their games and show their level like everyone, and the XP board can show people, computers or everyone

## 0.181.0 — 2026-09-14
- The computer players can play a mixed batch of every game nobody has played yet, and Tamenoki no longer freezes at the start of Classic Reversi

## 0.180.0 — 2026-09-14
- Every board size on the set-up screen carries its number in the middle of the board picture, so the icon alone says how big it is

## 0.179.0 — 2026-09-14
- The rest of the rules on the set-up screen are pictures too: the opening, whether it counts, and who you play

## 0.178.0 — 2026-09-14
- A finished game of Go, Othello, five in a row or Hex can be downloaded as an SGF file from its replay

## 0.177.1 — 2026-09-14
- A computer player's tier and rating now agree on every page: both come from the same games

## 0.177.0 — 2026-09-14
- Every table of players now shows XP right after the rating, and a player's page opens with their level and XP beside their record

## 0.176.3 — 2026-09-14
- A done row closed before the release tool existed can now be stamped with the release that carried it, through the board's own door

## 0.176.2 — 2026-09-14
- Every release now gets its own test run on GitHub, instead of most being silently replaced before they started

## 0.176.1 — 2026-09-14
- The two gentlest computer players race home in Halma and Chinese Checkers instead of wandering, so their games end in hundreds of moves rather than a thousand

## 0.176.0 — 2026-09-14
- The points notice now speaks Japanese to a reader who chose it: the unit, the level lines, the button and its name for a screen reader

## 0.175.0 — 2026-09-14
- Hex is drawn as a triangular lattice with the stones on the crossings, the way a wooden board is ruled
- The star in Chinese Checkers stands on the same lattice, so its rows now sit evenly spaced

## 0.174.8 — 2026-09-14
- A note in the bot runner stops saying Reversi's ladder runs backwards, which stopped being true at 0.149.0

## 0.174.7 — 2026-09-14
- Three browser tests that were red on every fresh database now bring their own games and click the way a person does

## 0.174.6 — 2026-09-14
- The test for somebody's whole record now brings its own games, instead of reading the account of whoever owns the machine

## 0.174.5 — 2026-09-14
- A time zone you chose yourself is now remembered as your choice, so nothing quietly replaces it with a guess from your country

## 0.174.4 — 2026-09-14
- The browser tests now sign in as a test account of their own, instead of borrowing whoever owns the machine

## 0.174.3 — 2026-09-14
- Three admin boxes now say what they are for, instead of borrowing the words of the example inside them

## 0.174.2 — 2026-09-14
- The test that watches a game end now reads the result the live board announces, instead of racing the page that replaces it

## 0.174.1 — 2026-09-14
- release:take can retry closing a board row on its own, and a changelog line now starts with a capital

## 0.174.0 — 2026-09-14
- The experience ladder now runs to 999,999 points at Level 100, and gets harder after Level 10 and again after Level 20
- Everyone's level drops with this change: past experience keeps what it paid, and the new rungs are steeper
- Winning every game in a family now pays, and beating somebody rated above you pays more

## 0.173.8 — 2026-09-14
- a note beside a control is now its description rather than part of its name, so a screen reader says "Invite code" and then the note

## 0.173.7 — 2026-09-14
- the reactions test stays on the board it is talking about, so a green run means the bubble really arrived

## 0.173.6 — 2026-09-14
- The tool that takes a version now commits it, so work can no longer land with nothing naming it.

## 0.173.5 — 2026-09-14
- A record narrowed to somebody who does not exist is refused rather than answered with everybody's games, and two more dates read the same way on the server and in the browser.

## 0.173.4 — 2026-09-14
- The browser suite takes away the names it plays under, so a run leaves no rating rows behind.

## 0.173.3 — 2026-09-14
- Every number that counts games now leads to exactly those games: the games-at-once count opens the games it counted, a game named in a list is a link to that game, and a record narrowed to somebody says so when the link names nobody

## 0.173.2 — 2026-09-14
- Dates and clocks on the game pages no longer disagree between what the server drew and what your browser draws: the page arrives reading UTC and switches to your own zone once the browser takes over

## 0.173.1 — 2026-09-14
- Play apart uses the same rules panel as every other way into a game, so the clock, the ratings choice and the resigning rule are worded and behave identically wherever you start from

## 0.173.0 — 2026-09-14
- A board with only one size now draws its number inside the board picture itself, large and centred, instead of printing the size twice underneath

## 0.172.0 — 2026-09-14
- The members list shows everyone's experience points beside their record, sortable, with their level beside their name — and a member who has earned nothing is Level 1 rather than blank

## 0.171.0 — 2026-09-14
- Your day now ends where you live rather than at five in the afternoon: a member's time zone is their own choice, then their device, then a good guess from their country — and the profile and XP tabs say which it is
- Signing in no longer spends the day it grants: the daily visit is paid from the day as it stood before the sign-in, so a member who signs in each day can actually earn it

## 0.170.8 — 2026-09-14
- A control's hint is no longer read out as part of its name by a screen reader, and every tab of your own page is now checked for the kind of mismatch that made the profile form disagree with itself

## 0.170.7 — 2026-09-12
- A new game's address names the game it actually is, and three labels that were typed out twice are now said once

## 0.170.6 — 2026-09-12
- A posted seat's game cannot be changed underneath the link that points at it: the board, clock and rules may still be settled before the first stone, but the game itself is decided when the seat is posted

## 0.170.5 — 2026-09-12
- Two more browser tests bring their own world instead of playing as the site's owner and being carried off to whatever game was waiting for him

## 0.170.4 — 2026-09-12
- The builders' note on the test sweep now gives both counts with the rule behind each

## 0.170.3 — 2026-09-12
- A number in the builders' notes corrected to the one actually counted, with how it was counted

## 0.170.2 — 2026-09-12
- The browser tests now wait for the page to be ready before pressing things, across the suite rather than in two files — a false pass and a race were found on the way

## 0.170.1 — 2026-09-12
- A fork of a game against a computer player is a real game against that computer player again — rated in the computer pool, the program answering when the position says so — and a rematch against a program now opens with the program's move instead of waiting for yours

## 0.170.0 — 2026-09-12
- Your finished games page instead of piling up: the first twenty newest, then Older finished games, with the true count — and the page that lists them reads a fraction of what it did for anyone who keeps games for ever

## 0.169.4 — 2026-09-12
- Three small things: the ticket board refuses a change it cannot apply instead of saying OK; a fork with nobody to challenge no longer offers a rating it will not honour; and a leaderboard test that assumed its rows were on page one reads the order it actually sees

## 0.169.3 — 2026-09-12
- Your games page reads only the finished games inside the window you keep, instead of every game you ever played and trimming afterwards — the same list, a fraction of the work for anyone who has played a lot

## 0.169.2 — 2026-09-12
- Two more notes for the people who build this site: check whose server is on your port before trusting a test against it, and what a stale database client looks like after a rebase

## 0.169.1 — 2026-09-12
- A game played at one screen can no longer be stored as rated, whoever asks — a fork with nobody to challenge was the last way in — and the rules panel of such a game says it will not count instead of Rated

## 0.169.0 — 2026-09-12
- Every heading on the players page sorts — by name, games played, won, lost, drawn, when they joined — and the list pages instead of stopping at the two hundred most recently seen

## 0.168.1 — 2026-09-12
- A game's result is now written to the ladder and the per-game standing in one transaction, so the two can no longer drift apart by one game for ever — and a tool that names any pair already apart

## 0.168.0 — 2026-09-12
- Choose your language once: a signed-in member's choice is kept on their account and follows them to every device, with no extra cost per page

## 0.167.1 — 2026-09-12
- The mapping from every closed ticket to the release that shipped it, derived from the changelog and git with its evidence, ready to be stamped once the board has a door for it

## 0.167.0 — 2026-09-12
- A game you propose to a person — a challenge, a rematch or a fork — is an offer until they accept it: it waits in their list with Accept and Decline, declining costs them nothing, you can withdraw it, and nothing is bound to them until they say yes

## 0.166.0 — 2026-09-12
- Your level has its name everywhere now: in the toast when you reach one, on your own page with the rung ahead a click away, beside every name on the players page and the Computers and Bots tabs, and on a player's page with their total — and each name leads to its rung on the ladder

## 0.165.0 — 2026-09-12
- The operator has a Site tab: registration can be invite-only as today, open to anyone with a Google account, or an approval queue; a notice can be shown on the join page; and maintenance mode is documented there — everyone but the operator sees a page saying so while it is on

## 0.164.4 — 2026-09-12
- A Resign or Cancel question you have opened stays put: the board no longer moves on to your next game underneath it until you have answered or dismissed it

## 0.164.3 — 2026-09-12
- Notes for the people who build this site: three ways a fresh working copy goes wrong before any code runs, each learned the hard way today

## 0.164.2 — 2026-09-12
- The Play count in the masthead no longer shifts every page down as it arrives, and it no longer asks the server every half minute — it refreshes when you come back to the tab
- Every row on the players page is the same height, the list fits the page at desktop widths, and the Computers tab shows the streak it knows

## 0.164.1 — 2026-09-12
- The tool that can replay everyone's history through the XP rules, in order, so games played before XP existed can earn what they would have — built and rehearsed; it runs only when asked twice, and on production only on the owner's word

## 0.164.0 — 2026-09-12
- The XP ladder: all hundred levels with their names, what each costs to reach, and who is standing on each rung — with your own rung marked
- The XP leaderboard: every member ranked by experience with their level name, sortable by points, level, last earned or name, and linked to the person

## 0.163.0 — 2026-09-12
- Start the game leads to a doorstep, not a board: a page that states exactly what is about to happen — the game, the board, the rules, the clock, whether it counts, who you are playing and which colour you hold — with one button, Begin, and one way back that keeps every choice. Nothing is created until Begin
- The board means playing: the settings form beside a shared game is gone, and the rules are shown as a statement
- A link that names a board is honoured on the setup page: a single seat already waiting at that game no longer moves the board to its own size over the one the address said

## 0.162.1 — 2026-09-12
- A test that had been red on every fresh database since the setup-first work turned out to be the test, not the site: resigning from the board has always ended the game

## 0.162.0 — 2026-09-12
- Every finished game now pays experience points — for playing, for a first game of each kind and each family, for touring all of them, for winning over a person, over a buddy, after losing to them, for a streak, for beating each computer grade — and for showing up: a daily return, a run of days, a weekend game, coming back after time away
- Points show as a toast sliding from the top the moment they land, with a level-up marked when one is reached — no polling, no timers beyond the toast's own dismissal
- Points for belonging too: a first buddy, a challenge sent and answered, a rematch or a fork played, applause given, your name, country, bio and four words set, a seat claimed on somebody else's device

## 0.161.0 — 2026-09-12
- Your own page has an XP tab: your points, your level and the distance to the next, then every award you have earned, newest first, each saying what it was for and linking to the game or the person behind it

## 0.160.0 — 2026-09-12
- The record of games and the ladder can be sorted by their column headings, and the record loads the next page as you reach the end of it — no reload, no waiting
- Every list on the site now pages and sorts the same way, by one convention: sort=<column>, an opaque cursor, and a page that stays put while new games arrive above it
- Your games page opens a capped group in place — showing 5 of 14 becomes all 14 with one press

## 0.159.0 — 2026-09-12
- The operator can set a member's four words from the Members list — the same picker the member would use, words shown once at save, and an existing phrase is never replaced without being asked first
- Admin splits the computer players into their own Bots tab, with each program's grade, games, rating and last game, and the Members list counts people only

## 0.158.9 — 2026-09-12
- The hundred XP level names are written, from cool to coolest ever, ready to appear beside a level the moment levels are shown

## 0.158.8 — 2026-09-12
- The fork button no longer sits on the last move of a finished game offering to replay the end of a loss: it appears only when you have stepped back to an earlier position, and only if you were one of the players — a watcher is never offered a fork

## 0.158.7 — 2026-09-12
- Choosing a family on the setup page now moves the boards with it — click Drops and you see Drop Four's boards, not the last game's — and a game with only one board shows that board instead of nothing
- Each family on the setup page carries its one-line description, and the family row sits apart from the games under it

## 0.158.6 — 2026-09-12
- A note for the people who build this site: a control character in source code is written as its escape, never as the raw byte, or the file goes dark to every tool that reads it

## 0.158.5 — 2026-09-12
- Every member now earns experience points — for joining, for each day they visit, for every game finished and every game won — kept in a ledger nothing can double-count; nothing shows it yet, and the level names, the toast and the leaderboard follow

## 0.158.4 — 2026-09-12
- The toast that will announce XP points, built and tested but not yet shown anywhere — the ledger that feeds it comes next

## 0.158.3 — 2026-09-12
- The last of the count and filter faults: a game's own history page names its filter in the address instead of hiding it, an outcome chip never claims to filter what it did not, a kept player's page tells the truth about games it can see, the /me per-game table says its scope, and the replay scrubber's move number stays right for twist games and swap openings

## 0.158.2 — 2026-09-12
- A group header on your games page counts the whole bucket, not just the few it is showing — 14, showing 5 — and the played counts everywhere stop including abandoned games and start linking to the games behind them
- The ladder's Played column says in a word that it counts rated games against people, so it no longer silently disagrees with the members list's every-game count under the same heading

## 0.158.1 — 2026-09-12
- Your own record no longer says No games yet when you have played only friendly games: the line is shown when you have played anything, not only when you hold a rating

## 0.158.0 — 2026-09-12
- A streak now counts every game you have played, not only your rated ones, so the members list and your own record show a run where they showed a dash — the count and the streak beside it finally mean the same set of games

## 0.157.0 — 2026-09-12
- Signed out, the games page shows how many games each family has really had here, not zero on every one
- The Computers tab counts every game a computer player has played, matching the members list, instead of only its rated ones
- A computer player's own page shows the rating it earned rather than a default 1600 nobody set
- The front page counts the games from the catalogue itself, so it and the games list always agree on how many there are
- The embedded record counts a game against yourself once, matching every other page

## 0.156.1 — 2026-09-12
- A branch that changes many routes gets its full browser run on a pull request against a fresh database, so a real regression can be told from the noise before it reaches main

## 0.156.0 — 2026-09-12
- Every way into a game goes through the setup page first: Play on a player's page, Challenge anywhere, Rematch, Fork, the Computers tab, the one-line sentence, New game in the navigation — all fourteen land on the setup screen with whatever is already decided filled in, and nothing is written until you press Start
- A handicap can be set when you set up a game, and a challenge's rules are settled the moment it is sent — the other side can no longer change the board or the clock after handing it over

## 0.155.2 — 2026-09-12
- The release history counts 167 releases, which is how many there have been: one version had two headings, and now has one

## 0.155.1 — 2026-09-12
- Two working rules written where the next session reads them: Intl belongs in a handler and never in render, and how to run one browser spec without sweeping the shared database

## 0.155.0 — 2026-09-12
- The profile page is a form that was looked at: a field is as wide as what goes in it — the two away dates on one row, city beside country, the time zone sized to a time zone — and the whole thing reads as three short groups rather than eleven full-width rows

## 0.154.0 — 2026-09-12
- Your four words have a tab of their own on your page — Words 合言葉 — built like a screen showing you a code: four big boxes as the centrepiece, four large word tiles to pick from, a refresh icon for four others, and you can drag a word into any of the four spots, by touch or by keyboard. The order is yours to arrange and never changes the words themselves

## 0.153.0 — 2026-09-12
- Choosing a game to set up is two rows of pictures rather than a dropdown of thirty-nine names: every family with its mark, then that family's games with their boards — and the board size is a row of blocks drawn at their real density
- The five settings you rarely change sit behind one line that reads their current values — Free opening, No clock, Rated, Post for anyone — closed by default so the Start button is above the fold on an iPad, and one tap to open

## 0.152.0 — 2026-09-12
- The board's release history says which day each version shipped, and a row a release closes says shipped in rather than marked done in
- Closing a row is part of taking a release number now, not a step somebody remembers afterwards — the fifteen that shipped and stayed open cannot happen again

## 0.151.0
- A Checkers board reads as a checkerboard on every theme: the squares in play are shaded so the pattern is unmistakable at a glance and at thumbnail size, where before it was faint enough to miss which squares the game is played on

## 0.150.0
- Every table of records on the site is the same table — the members list, the ladders, the Computers tab (which had no headings at all), your own record, a player's by-game breakdown — with the same columns in the same order: what happened first, and the site's conclusion, the rating, last. A STREAK column says how many in a row, and its hover says exactly which games it counted

## 0.149.0
- The computer opponents are in the order the site presents them in: the grades now look ahead in the flipping games, the races, Go and Checkers, where before only the line games had a search — so Meijin beats Dan and Dan beats Kyu at every game, not only at five-in-a-row

## 0.148.0
- Sitting in at somebody else's device is taps all the way through: pick your name from the list, tap your four words, play. There is nothing to type, every button is big enough for a child's finger on an iPad, and a name that could never work is never offered

## 0.147.0
- A game names you as you are now: change your display name and every game you ever played shows the new one, on the board and in every list, while your rating stays earned under the name it was earned under
- A count of your games opens exactly those games: the record and the history now agree about who you are, so a link from "5 games" no longer lands on an empty page

## 0.146.0
- Four words can be chosen right at the seat: sit down at somebody else's device, give your name, pick four words, and if your account has none yet they become yours — nobody signs in, nobody signs out, and you have a way back in from any device

## 0.145.0
- The tables of players scroll themselves on a phone rather than dragging the whole page sideways: the members list, the ladders, the records and the kept results from elsewhere all stay inside their own width, so the navigation and the footer stop sliding with them

## 0.144.0
- The boards played in the squares — tic-tac-toe, Othello, Checkers, Connect Four — are framed by their own wood the way a Go board is, instead of running flush to the edge and reading as a crop of a board rather than a board

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
