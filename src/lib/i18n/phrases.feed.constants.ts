/**
 * feed.*: the feed (/feed) and its sentences.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_FEED = {
  /*
   * The feed (/feed): what the reader and their buddies have been doing, and
   * the games finished lately among adults. Each sentence comes as a "you"
   * form and a named one, and its {slots} are filled with links by the page
   * — see `feedWords.ts`.
   */
  "feed.title": "Feed",
  "feed.homeLink": "Your feed",
  "feed.lead": "What you and your buddies have been playing lately, newest first.",
  "feed.leadEveryone":
    "Games finished here lately, the games that are new, and the site's news: firsts, new leaders and best times. Only bots and members who have said they are 18 or over are named.",
  "feed.tabMine": "You and your buddies",
  "feed.tabEveryone": "Everyone",
  "feed.tabsLabel": "Whose activity to show",
  "feed.today": "Today",
  "feed.yesterday": "Yesterday",
  "feed.won.you": "You beat {other} at {game}",
  "feed.won.named": "{who} beat {other} at {game}",
  "feed.lost.you": "You lost to {other} at {game}",
  "feed.lost.named": "{who} lost to {other} at {game}",
  "feed.drawn.you": "You drew with {other} at {game}",
  "feed.drawn.named": "{who} drew with {other} at {game}",
  "feed.started.you": "You started a game of {game} against {other}",
  "feed.started.named": "{who} started a game of {game} against {other}",
  "feed.waiting.you": "You started a game of {game}, waiting for somebody to sit down",
  "feed.waiting.named": "{who} started a game of {game}, waiting for somebody to sit down",
  "feed.xp.you": "You earned {xp}",
  "feed.xp.named": "{who} earned {xp}",
  "feed.ip.you": "You won {ip}",
  "feed.ip.named": "{who} won {ip}",
  "feed.credited.you": "You were credited {xp} for games played on other sites",
  "feed.credited.named": "{who} was credited {xp} for games played on other sites",
  "feed.level.you": "You reached level {level}, {name}",
  "feed.level.named": "{who} reached level {level}, {name}",
  "feed.puzzleOne.you": "You solved a {game} puzzle",
  "feed.puzzleOne.named": "{who} solved a {game} puzzle",
  "feed.puzzleMany.you": "You solved {count} {game} puzzles",
  "feed.puzzleMany.named": "{who} solved {count} {game} puzzles",
  "feed.news.firstGameWon": "{game} was played here for the first time: {who} beat {other}",
  "feed.news.firstGameDrawn": "{game} was played here for the first time: {who} drew with {other}",
  "feed.news.firstGame": "{game} was played here for the first time",
  "feed.news.firstPlace": "{who} took first place at {game}",
  "feed.news.botBeaten": "{who} beat {other} at {game}, the first person here to",
  "feed.news.botBeatenNobody": "{other} was beaten at {game} for the first time",
  "feed.news.firstWin": "{who}'s first win here, at {game}",
  "feed.news.firstLoss": "{who}'s first loss here, at {game}",
  "feed.news.bestTime": "A new best time at {game} {board}: {who}, {time}",
  "feed.news.bestTimeNobody": "A new best time at {game} {board}: {time}",
  "feed.added": "New here: {games}",
  "feed.seeGame": "See the game",
  "feed.seeLadder": "See the ladder",
  "feed.seeFastest": "See the fastest times",
  "feed.seeSolves": "See their solves",
  "feed.somebody": "somebody",
  "feed.emptyMine":
    "Nothing here yet. When you or a buddy start or finish a game, earn XP, reach a level or solve a puzzle, it shows here, newest first.",
  "feed.emptyEveryone":
    "Nothing here yet: no games finished lately between players this tab may show, no new games and no news.",
  "feed.beFirst": "Be the first to play →",
  "feed.findBuddies": "Find buddies →",
} as const;
