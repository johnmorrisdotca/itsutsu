/**
 * home.*: the front page, and the beta invitation it shares with the thank-you page (ENJA-10).
 * A sentence that holds a link or a figure is one phrase with `{names}` where those stand (`weave`), because the reader's
 * language decides where they fall. The home page may not type a count of games (`homePitch.coverage.test.ts`): the
 * figure is read from the catalogue and handed in as `{count}`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_HOME = {
  "home.hero": "Board games, puzzles and cards, played at your own pace.",
  "home.catalogue": "{count} from five in a row to Reversi, go, Solitaire and Mahjong, puzzles for one, and party games round one phone. Play across the table or across the world, learn the shapes that win, and keep every game you finish.",
  "home.numbers": "{site} is in early release, by invitation only — so far {players}, {games} between people, and {here}.",
  "home.hereNow": "{count} here now",
  "home.numbersAsk": "Ask for an invite, or help test it",
  "home.askInvite": "Ask for an invite",
  "home.learnGames": "Learn the games",

  // Eight things the site offers, each a heading and a paragraph
  "home.fiveTitle": "Five in a row",
  "home.fiveBody": "Gomoku, renju, connect6 and the family of games that grew from a line of stones, beside Reversi, checkers and go: {count} board games, each with its rules a click away.",
  "home.phonesTitle": "Two phones, one board",
  "home.phonesBody": "Start a game, hand the other seat over as a QR code, and take turns from wherever you are. No account, no app.",
  "home.keptTitle": "Every game kept",
  "home.keptBody": "A finished game is filed with its stones in order, and kept for good: no move history here goes missing after a few years. Replay it, send a friend the exact move you mean, and see how a player's rating moves.",
  "home.forkTitle": "Fork any position",
  "home.forkBody": "A close game deserves a second try. From any move of any game, start another game at exactly that position, against the same opponent, and play both.",
  "home.opponentsTitle": "Always somebody to play",
  "home.opponentsBody": "Five graded bots, gentlest first, play every game here, and two specialists play only Reversi or only five in a row. Games against them are rated, and their records are kept like anybody's.",
  "home.ladderTitle": "A ladder for every game",
  "home.ladderBody": "Each game has its own rating and its own ladder, and games against the programs are scored apart, so beating a computer never moves where you stand among people.",
  "home.paceTitle": "Your pace",
  "home.paceBody": "Play with no clock and move when you can, a move a day if that suits you, or put a blitz, rapid or classical clock on it. Keep a dozen games going at once, the way the old turn-based sites did; the ones waiting on you come first.",
  "home.learnTitle": "Learn the shapes",
  "home.learn.one": "A strategy guide on the threats, openings and endings that decide these games, each naming the games it applies to.",
  "home.learn.other": "{count} strategy guides on the threats, openings and endings that decide these games, each naming the games it applies to.",

  // The families of games, drawn on the front page
  "home.families.title": "{count} families of games",
  "home.families.lead": "Five in a row is where it started; the other families are the games that grew up beside it, from Reversi and checkers to go and hex. Open one to see its games, their rules, and a picture of each board.",

  // Where it comes from
  "home.storyTitle": "Where this comes from",
  "home.story.one": "For years the founder of this site and his parents played across two households on the great turn-based sites of the early web, ItsYourTurn and GoldToken — Othello with his father, and five-in-a-row, Pente and Othello with his mother — sometimes hours a day, dozens of games open at once, and memberships bought to lift the daily cap on moves, because twenty was never going to last until lunch. Those sites understood that a game between people who love each other does not need to be fast; it needs to be kept. {site} is a continuation of that, and a tribute to it.",
  "home.story.two": "The family is half Japanese, and the games came with the heritage. Five in a row has been played on go boards in Japan since the Heian period, a thousand years ago, and the name of this site is just the Japanese for the number — {kanji}, five stones.",
  "home.story.read": "Read the whole story →",
  "home.door": "{site} {kanji} is by invitation. If you have a code, {enter}. If you do not, {ask}.",
  "home.doorEnter": "come in",
  "home.doorAsk": "ask for one",

  // The beta panel, and the ask a tester is given
  "home.beta.title": "In beta, free, and looking for testers",
  "home.beta.lead": "{site} is a beta: the games are real and every finished one is kept, but pages still change from week to week and some things will break. It is free, with nothing to pay and nothing to buy, and it is by invitation while it is small.",
  "home.beta.nobody": "Everybody who helps test is thanked by name, under the name they play by, on {link}. We are grateful to every one of them.",
  "home.beta.some.one": "One person is helping test {site} already, and each is thanked by name, under the name they play by, on {link}. We are grateful to every one of them.",
  "home.beta.some.other": "{count} people are helping test {site} already, and each is thanked by name, under the name they play by, on {link}. We are grateful to every one of them.",
  "home.beta.thanksLink": "our thank-you page",
  "home.ask.lead": "We need beta testers, and a tester needs no skill at any of these games. What helps most:",
  "home.ask.play": "Play a few games, against a person or one of the bots, on a phone as well as a computer.",
  "home.ask.report": "Tell us where a rule looked wrong, a page was confusing, or a move did not go where you put it.",
  "home.ask.say": "Say which games you would like to see here next, and which ones you played on the older sites.",
  "home.ask.member": "You are already in, which makes you a tester. Write to {mail} with anything you find, and hand the other seat of a game to a friend: two people on one board is the best test there is.",
  "home.ask.stranger": "To join, ask for an invite and say a line about yourself. If you would like to test, say so in the same note. Players from {sites} are especially welcome. You can also write to {mail}.",

  // Where to start
  "home.start.newTitle": "New to these games",
  "home.start.returningTitle": "Played them before",
  "home.start.browse": "Browse the games",
  "home.start.browseLine": "{label} — every game with its rules, a picture of its board, and where it came from.",
  "home.start.guide": "Read a guide",
  "home.start.guideLine": "{label} — the shapes that win and the mistakes everybody makes once.",
  "home.start.story": "Read the story",
  "home.start.storyLine": "{label} — why the site exists, and how it counts.",
  "home.start.begin": "Start a game",
  "home.start.beginLine": "{label} — pick the game, the board and the opponent: a person or a program.",
  "home.start.roots": "Where the games came from",
  "home.start.rootsLine": "{label} — a thousand years of five in a row, Othello, and the famous openings.",
  "home.start.bots": "Meet the bots",
  "home.start.botsLine": "{label} — five graded bots and two specialists, and how they were measured.",
  "home.start.beginLineInvite": "{label} — pick the game, the board and the opponent: a person or a program, once you have an invite.",
  "home.start.older": "Played for years on {first} or {second}? Write to {mail} with the site and the name you played under, and your record can be copied over, game by game, beside what you play here.",
} as const;
