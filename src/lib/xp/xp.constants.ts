import type { StreakOutcome } from "@/lib/rating/streak";

import type { XpEventSpec, XpEventType } from "./xp.types";

/**
 * Everything that earns XP on this site, priced, named and explained.
 *
 * One table. Adding an event is one row — the type in `xp.types.ts`, the row
 * here — and `Record<XpEventType, XpEventSpec>` makes a missing one a compile
 * error rather than a blank cell somebody notices in production.
 *
 * The reasoning behind every number is in `docs/plans/xp/XP_DESIGN.md`, which is
 * where it belongs: a price is a decision about the whole economy, and a reader
 * checking whether 20 for a win is fair needs the other forty numbers in front
 * of them, not a comment on one.
 *
 * UmaKuma splits this into `XP_AWARDS` and `XP_BONUSES` for readability — a
 * reader should be able to see the routine economy without the exceptional one
 * on top of it. That split buys a merged lookup, an `isXpBonusKind` and two
 * places to remember to add a row. Here `cap` and `ridesAllowance` already say
 * which half a row is in, so a second map would be a third way of saying it.
 *
 * **How often an award may happen is not in this table.** It is in the subject
 * the caller passes, which the unique index on `XpEvent` then enforces. See
 * `XP_SUBJECTS` below.
 */

/** The type keys, for a caller that must not spell one as a literal. */
export const XP_EVENTS = {
  joined: "joined",
  dailyVisit: "dailyVisit",
  dayStreak7: "dayStreak7",
  dayStreak30: "dayStreak30",
  dayStreak100: "dayStreak100",
  dayStreak365: "dayStreak365",
  weekendGame: "weekendGame",
  backFromAway: "backFromAway",
  yearHere: "yearHere",
  yearsHere5: "yearsHere5",
  yearsHere10: "yearsHere10",
  firstGameEver: "firstGameEver",
  gameFinished: "gameFinished",
  gameWon: "gameWon",
  wonVsPerson: "wonVsPerson",
  wonVsBuddy: "wonVsBuddy",
  revengeWin: "revengeWin",
  longGame: "longGame",
  comeback: "comeback",
  winStreak3: "winStreak3",
  winStreak5: "winStreak5",
  winStreak10: "winStreak10",
  upsetWin: "upsetWin",
  bigUpsetWin: "bigUpsetWin",
  giantKilled: "giantKilled",
  firstOfVariant: "firstOfVariant",
  firstWinAtVariant: "firstWinAtVariant",
  firstOfFamily: "firstOfFamily",
  everyFamilyPlayed: "everyFamilyPlayed",
  everyVariantPlayed: "everyVariantPlayed",
  everyVariantWonInFamily: "everyVariantWonInFamily",
  wins10: "wins10",
  wins100: "wins100",
  wins250: "wins250",
  wins500: "wins500",
  wins1000: "wins1000",
  losses10: "losses10",
  losses50: "losses50",
  losses100: "losses100",
  losses250: "losses250",
  losses500: "losses500",
  losses1000: "losses1000",
  draws10: "draws10",
  gradeBeaten: "gradeBeaten",
  everyGradeBeaten: "everyGradeBeaten",
  specialistBeaten: "specialistBeaten",
  firstBuddy: "firstBuddy",
  buddyAdded: "buddyAdded",
  challengeSent: "challengeSent",
  challengeAnswered: "challengeAnswered",
  rematchPlayed: "rematchPlayed",
  forkPlayed: "forkPlayed",
  timeGiven: "timeGiven",
  applauseGiven: "applauseGiven",
  nameSet: "nameSet",
  countrySet: "countrySet",
  bioSet: "bioSet",
  wordsSet: "wordsSet",
  seatClaimedElsewhere: "seatClaimedElsewhere",
} as const satisfies Record<XpEventType, XpEventType>;

/** The whole catalogue, in the order the design argues it. */
export const XP_EVENT_SPECS: Record<XpEventType, XpEventSpec> = {
  /* ── Arriving, and coming back ──────────────────────────────────────────
     Small. Turning up is the habit worth building and not an achievement, and
     the site must never pay more for opening a tab than for playing a game. */

  joined: {
    points: 50,
    label: "Joined",
    kanji: "入会",
    blurb: "For being here at all. Once, ever.",
    sentence: "Welcome to Itsutsu.",
  },
  dailyVisit: {
    points: 10,
    label: "A new day",
    kanji: "毎日",
    blurb: "For looking in, once a day.",
    sentence: "Good to see you again.",
  },
  dayStreak7: {
    points: 150,
    label: "Seven days running",
    kanji: "七日",
    blurb: "For a week of days without missing one.",
    sentence: "Seven days in a row.",
  },
  dayStreak30: {
    points: 750,
    label: "Thirty days running",
    kanji: "三十日",
    blurb: "For a month of days without missing one.",
    sentence: "Thirty days in a row.",
  },
  dayStreak100: {
    points: 3000,
    label: "A hundred days running",
    kanji: "百日",
    blurb: "For a hundred days without missing one.",
    sentence: "A hundred days in a row.",
  },
  dayStreak365: {
    points: 15000,
    label: "A year running",
    kanji: "一年",
    blurb: "For a whole year without missing a day. It repeats, so it is worth repeating for.",
    sentence: "A year without missing a day.",
  },
  weekendGame: {
    points: 25,
    label: "Weekend game",
    kanji: "週末",
    blurb: "For finishing a game at the weekend. Once a weekend.",
    sentence: "A game at the weekend.",
  },
  backFromAway: {
    points: 100,
    label: "Back from away",
    kanji: "帰還",
    blurb: "For coming back after time away.",
    sentence: "Welcome back.",
  },
  /* A year of membership, and the milestones at five and ten. John approved
     them, 2026-09-14, as the same awards a kept record earns for its years on
     another site: "every year on a site gives you something like 1000? with a 5
     year membership bonus 10000? and a 10 year membership 25000?" — applied to
     Itsutsu itself so that a member who never played anywhere else is not worse
     off. They count only with a hundred games played here (`XP_YEAR_AWARDS`). */
  yearHere: {
    points: 1000,
    label: "A year on Itsutsu",
    kanji: "一周年",
    blurb: "For every year since you joined, with a hundred games played here.",
    sentence: "Another year on Itsutsu.",
  },
  yearsHere5: {
    points: 10000,
    label: "Five years on Itsutsu",
    kanji: "五周年",
    blurb: "For five years since you joined, with a hundred games played here. Once.",
    sentence: "Five years on Itsutsu.",
  },
  yearsHere10: {
    points: 25000,
    label: "Ten years on Itsutsu",
    kanji: "十周年",
    blurb: "For ten years since you joined, with a hundred games played here. Once.",
    sentence: "Ten years on Itsutsu.",
  },

  /* ── Playing ────────────────────────────────────────────────────────────
     A finish pays whether you won or lost, because finishing is the courtesy
     correspondence play depends on. A win pays twice a finish: better, not four
     times better, or the site only rewards the strong. */

  firstGameEver: {
    points: 250,
    label: "Your first game",
    kanji: "初局",
    blurb: "For finishing your very first game here.",
    sentence: "Your first game on Itsutsu.",
  },
  gameFinished: {
    points: 25,
    label: "Game finished",
    kanji: "終局",
    blurb: "For seeing a game through, won or lost.",
    sentence: "A game seen through.",
    cap: 6,
  },
  gameWon: {
    points: 50,
    label: "Game won",
    kanji: "勝利",
    blurb: "For winning one, on top of what finishing it paid.",
    sentence: "A game won.",
    cap: 6,
    ridesAllowance: true,
  },
  wonVsPerson: {
    points: 25,
    label: "Won against a person",
    kanji: "対人",
    blurb: "On top of the win, for beating somebody rather than something.",
    sentence: "Beat a real person.",
    cap: 6,
    ridesAllowance: true,
  },
  wonVsBuddy: {
    points: 40,
    label: "Won against a buddy",
    kanji: "友人",
    blurb: "On top again, for beating somebody on your buddy list.",
    sentence: "Beat one of your buddies.",
    cap: 6,
    ridesAllowance: true,
  },
  revengeWin: {
    points: 150,
    label: "Turned it around",
    kanji: "復讐",
    blurb: "For beating somebody at a game they had beaten you at. Once per rivalry.",
    sentence: "You turned that one around.",
  },
  longGame: {
    points: 25,
    label: "A long game",
    kanji: "長局",
    blurb: "For a game that went the distance.",
    sentence: "That one went the distance.",
    cap: 6,
    ridesAllowance: true,
  },
  comeback: {
    points: 150,
    label: "A comeback",
    kanji: "逆転",
    blurb: "For winning a game you were losing.",
    sentence: "Won from behind.",
  },
  winStreak3: {
    points: 75,
    label: "Three in a row",
    kanji: "三連勝",
    blurb: "For three wins without a loss between them.",
    sentence: "Three wins in a row.",
  },
  winStreak5: {
    points: 200,
    label: "Five in a row",
    kanji: "五連勝",
    blurb: "For five wins without a loss between them.",
    sentence: "Five wins in a row.",
  },
  winStreak10: {
    points: 600,
    label: "Ten in a row",
    kanji: "十連勝",
    blurb: "For ten wins without a loss between them.",
    sentence: "Ten wins in a row.",
  },

  /* ── Beating somebody better than you ───────────────────────────────────
     John's rule. One of the three, never two, chosen by `xpUpset.ts` from both
     ratings as they stood going into the game — the gap, and for the top band
     the opponent's own standing too. Priced as bands rather than worked out from
     the gap, so the most a win can add is the top price. Capped and riding the
     allowance because they are paid per game: two friends could otherwise
     trade them, and the cap is what bounds that. */

  upsetWin: {
    points: 100,
    label: "An upset",
    kanji: "番狂わせ",
    blurb: "On top of the win, for beating an established player rated at least a hundred above you.",
    sentence: "You beat somebody better than you.",
    cap: 3,
    ridesAllowance: true,
  },
  bigUpsetWin: {
    points: 250,
    label: "A big upset",
    kanji: "大番狂わせ",
    blurb: "On top of the win, for beating an established player rated at least two hundred above you.",
    sentence: "You beat somebody far better than you.",
    cap: 2,
    ridesAllowance: true,
  },
  giantKilled: {
    points: 750,
    label: "A giant killed",
    kanji: "大物食い",
    blurb: "On top of the win, for beating a highly ranked player rated at least three hundred above you.",
    sentence: "You beat one of the best players here.",
    cap: 1,
    ridesAllowance: true,
  },

  /* ── The tour ───────────────────────────────────────────────────────────
     Thirty-nine games and eleven families, most of them barely played. A first
     of anything is cheap and the SETS are dear: every game played is 5,000, a
     family won is 300, and a single first win is John's 10. The six come to
     13,390 XP of the 23,440 available once-only — 2.3% of the ladder, a
     ceiling rather than a treadmill. */

  firstOfVariant: {
    points: 50,
    label: "A game you had not played",
    kanji: "初手合",
    blurb: "For your first game of a game. There are thirty-nine of them.",
    sentence: "A game you had never played.",
  },
  firstWinAtVariant: {
    points: 10,
    label: "First win at a game",
    kanji: "初勝",
    blurb: "For your first win at one of the thirty-nine.",
    sentence: "Your first win at this one.",
  },
  firstOfFamily: {
    points: 150,
    label: "A family you had not met",
    kanji: "初族",
    blurb: "For your first game from one of the eleven families.",
    sentence: "A whole family you had not met.",
  },
  everyFamilyPlayed: {
    points: 2000,
    label: "Every family played",
    kanji: "全族",
    blurb: "For playing a game from all eleven families.",
    sentence: "All eleven families played.",
  },
  everyVariantPlayed: {
    points: 5000,
    label: "Every game played",
    kanji: "全種",
    blurb: "For playing all thirty-nine games on the site.",
    sentence: "All thirty-nine games played.",
  },
  /* A family won is 300 — twice `firstOfFamily` — and the balance John left to us
     ("winning a while famly? i dunno, look at balance and determine"). Winning
     every game in a family is far harder than playing one game of it, so the 20
     it first paid, John's "double" a first win, left the harder feat paying less
     than the easier one; twice a family met makes it plainly the bigger
     achievement. NOT paid for a family of one game (Hex, Checkers, Go): that is
     no completion, its one win is already paid by `firstWinAtVariant` and
     `firstOfFamily`, and 300 more would make a single win worth about 510 XP.
     `familyToWin` in `xpGame.ts` is that rule, live and in the replay alike.
     Eight families can be won, 2,400 XP between them. */
  everyVariantWonInFamily: {
    points: 300,
    label: "A family won",
    kanji: "一族制覇",
    blurb: "For winning at every game in a family of more than one game. Paid on the win that completes it.",
    sentence: "You have won at every game in this family.",
  },

  /* ── Milestones at one game ─────────────────────────────────────────────
     John, 2026-09-14: "we can also give awards for EACH variant, like 10 WINS,
     100 WINS, 250 wins, 500 wins, 1000 wins - having them also be really
     rewarding. also we should be nice to people with losses maybe. like 100
     losses bonus or something funny. not as much points but something to show
     appreciation for helping out the winners lol". Keyed on the game, once per
     game per member, uncapped because each can happen only once. A fact about
     finished games, so the programs earn them too. The amounts are the
     controller's proposal, AWAITING JOHN'S YES. */

  wins10: {
    points: 250,
    label: "Ten wins at a game",
    kanji: "十勝",
    blurb: "For your tenth win at one of the games. Once per game.",
    sentence: "Ten wins at this game.",
  },
  wins100: {
    points: 2500,
    label: "A hundred wins at a game",
    kanji: "百勝",
    blurb: "For your hundredth win at one of the games. Once per game.",
    sentence: "A hundred wins at this game.",
  },
  wins250: {
    points: 6000,
    label: "Two hundred and fifty wins",
    kanji: "二百五十勝",
    blurb: "For two hundred and fifty wins at one of the games. Once per game.",
    sentence: "Two hundred and fifty wins at this game.",
  },
  wins500: {
    points: 12500,
    label: "Five hundred wins at a game",
    kanji: "五百勝",
    blurb: "For five hundred wins at one of the games. Once per game.",
    sentence: "Five hundred wins at this game.",
  },
  wins1000: {
    points: 25000,
    label: "A thousand wins at a game",
    kanji: "千勝",
    blurb: "For a thousand wins at one of the games. Once per game.",
    sentence: "A thousand wins at this game.",
  },
  losses10: {
    points: 50,
    label: "Good Sport",
    kanji: "善戦",
    blurb: "For ten losses at one game. Somebody needed a game worth winning.",
    sentence: "Ten losses at this game. A good sport.",
  },
  losses50: {
    points: 150,
    label: "Sparring Partner",
    kanji: "稽古台",
    blurb: "For fifty losses at one game. Everybody gets better against you.",
    sentence: "Fifty losses at this game. A sparring partner.",
  },
  losses100: {
    points: 300,
    label: "Stepping Stone",
    kanji: "踏み台",
    blurb: "For a hundred losses at one game. Winners climbed on you, and thank you.",
    sentence: "A hundred losses at this game. A stepping stone.",
  },
  losses250: {
    points: 750,
    label: "Worthy Opponent",
    kanji: "好敵手",
    blurb: "For two hundred and fifty losses at one game, and still sitting down to play.",
    sentence: "Two hundred and fifty losses at this game. A worthy opponent.",
  },
  losses500: {
    points: 1500,
    label: "Never Gives Up",
    kanji: "不屈",
    blurb: "For five hundred losses at one game. Nobody could make you stop.",
    sentence: "Five hundred losses at this game. You never give up.",
  },
  losses1000: {
    points: 3000,
    label: "Legend of Grit",
    kanji: "根性",
    blurb: "For a thousand losses at one game. A legend of grit.",
    sentence: "A thousand losses at this game. A legend of grit.",
  },
  draws10: {
    points: 250,
    label: "Stalemate Artist",
    kanji: "引分名人",
    blurb: "For ten drawn games at one game. Nobody got past you, and you got past nobody.",
    sentence: "Ten draws at this game. A stalemate artist.",
  },

  /* ── The computer ladder ────────────────────────────────────────────────
     Five graded grades and two specialists. Five times a won game against a
     person, because each grade can be beaten for the first time only once and
     beating Guoshou is a real afternoon — the hard things are where the money is. */

  gradeBeaten: {
    points: 500,
    label: "A grade beaten",
    kanji: "撃破",
    blurb: "For your first win against one of the five computer grades.",
    sentence: "A computer grade beaten.",
  },
  everyGradeBeaten: {
    points: 5000,
    label: "Every grade beaten",
    kanji: "全段",
    blurb: "For beating all five computer grades. The hardest ordinary goal here.",
    sentence: "All five grades beaten.",
  },
  specialistBeaten: {
    points: 1000,
    label: "A specialist beaten",
    kanji: "名手",
    blurb: "For beating one of the two specialists at their own game.",
    sentence: "A specialist beaten at their own game.",
  },

  /* ── People ─────────────────────────────────────────────────────────────
     Capped and small. A buddy list is not a score, and asking for a game
     should cost nothing to be worth doing. */

  firstBuddy: {
    points: 100,
    label: "Your first buddy",
    kanji: "初友",
    blurb: "For adding somebody to your buddy list for the first time.",
    sentence: "Your first buddy.",
  },
  buddyAdded: {
    points: 25,
    label: "A buddy added",
    kanji: "友達",
    blurb: "For adding somebody to your buddy list.",
    sentence: "A buddy added.",
    cap: 3,
  },
  challengeSent: {
    points: 10,
    label: "Challenge sent",
    kanji: "挑戦",
    blurb: "For asking somebody for a game.",
    sentence: "Challenge sent.",
    cap: 3,
  },
  challengeAnswered: {
    points: 25,
    label: "Challenge answered",
    kanji: "応戦",
    blurb: "For answering somebody's challenge with a move.",
    sentence: "Challenge answered.",
    cap: 6,
  },
  rematchPlayed: {
    points: 25,
    label: "A rematch",
    kanji: "再戦",
    blurb: "For taking a rematch. A game worth playing twice.",
    sentence: "A rematch.",
    cap: 6,
  },
  forkPlayed: {
    points: 40,
    label: "A fork",
    kanji: "分岐",
    blurb: "For playing a position on from the middle of a finished game.",
    sentence: "A position played on.",
    cap: 6,
  },
  timeGiven: {
    points: 25,
    label: "Time given",
    kanji: "情け",
    blurb: "For giving your opponent more time when they needed it.",
    sentence: "That was sporting.",
    cap: 3,
  },
  applauseGiven: {
    points: 10,
    label: "Applause given",
    kanji: "拍手",
    blurb: "For applauding a game somebody played.",
    sentence: "Applause given.",
    cap: 3,
  },

  /* ── Who you are ────────────────────────────────────────────────────────
     Small, once-only, and the cheapest way to make a member's page worth
     reading. `seatClaimedElsewhere` is the site's cleverest feature and had
     nothing celebrating it. */

  nameSet: {
    points: 25,
    label: "A name set",
    kanji: "名前",
    blurb: "For choosing what you are called here.",
    sentence: "Your name is set.",
  },
  countrySet: {
    points: 25,
    label: "A country set",
    kanji: "国",
    blurb: "For saying where you are playing from.",
    sentence: "Your country is set.",
  },
  bioSet: {
    points: 50,
    label: "Something about you",
    kanji: "紹介",
    blurb: "For writing a line about yourself on your page.",
    sentence: "Your page says something about you.",
  },
  wordsSet: {
    points: 50,
    label: "Four words set",
    kanji: "四語",
    blurb: "For setting the four words that let you take a seat on any device.",
    sentence: "Your four words are set.",
  },
  seatClaimedElsewhere: {
    points: 50,
    label: "A seat on another device",
    kanji: "着席",
    blurb: "For taking your seat on somebody else's screen with your four words.",
    sentence: "You took your seat on another device.",
  },
};

/**
 * How the subject is built for each kind, as a note to whoever wires it.
 *
 * Not code, because the subject comes from whatever the caller is already
 * holding and a helper would mean passing it a game, a variant and a buddy so
 * it could pick one. It is a table because getting it wrong is invisible: a
 * `firstOfVariant` awarded with the game id instead of the variant pays
 * thirty-nine times over and nothing reports it.
 */
export const XP_SUBJECTS: Record<XpEventType, string> = {
  joined: "",
  dailyVisit: "the day key",
  dayStreak7: "the day key it was reached on",
  dayStreak30: "the day key it was reached on",
  dayStreak100: "the day key it was reached on",
  dayStreak365: "the day key it was reached on",
  weekendGame: "the ISO week, so it is once a weekend and not once a game",
  backFromAway: "the awayUntil date that ended",
  yearHere: "the date of the anniversary, so it is once per year of membership",
  yearsHere5: "",
  yearsHere10: "",
  firstGameEver: "",
  gameFinished: "the game id",
  gameWon: "the game id",
  wonVsPerson: "the game id",
  wonVsBuddy: "the game id",
  revengeWin: "the opponent's member id and the variant, so it is once per rivalry",
  longGame: "the game id",
  comeback: "the game id",
  winStreak3: "the game id that completed the run, so a later run earns it again",
  winStreak5: "the game id that completed the run",
  winStreak10: "the game id that completed the run",
  upsetWin: "the game id, so one game pays one band",
  bigUpsetWin: "the game id, so one game pays one band",
  giantKilled: "the game id, so one game pays one band",
  firstOfVariant: "the RuleVariant key",
  firstWinAtVariant: "the RuleVariant key",
  firstOfFamily: "the family's key in GAME_FAMILIES, which the family title is not",
  everyFamilyPlayed: "",
  everyVariantPlayed: "",
  everyVariantWonInFamily: "the family's key in GAME_FAMILIES, which the family title is not — once per family, and only a family of more than one game",
  wins10: "the RuleVariant key, so it is once per game per member",
  wins100: "the RuleVariant key, so it is once per game per member",
  wins250: "the RuleVariant key, so it is once per game per member",
  wins500: "the RuleVariant key, so it is once per game per member",
  wins1000: "the RuleVariant key, so it is once per game per member",
  losses10: "the RuleVariant key, so it is once per game per member",
  losses50: "the RuleVariant key, so it is once per game per member",
  losses100: "the RuleVariant key, so it is once per game per member",
  losses250: "the RuleVariant key, so it is once per game per member",
  losses500: "the RuleVariant key, so it is once per game per member",
  losses1000: "the RuleVariant key, so it is once per game per member",
  draws10: "the RuleVariant key, so it is once per game per member",
  gradeBeaten: "the BotTier",
  everyGradeBeaten: "",
  specialistBeaten: "the BotTier",
  firstBuddy: "",
  buddyAdded: "the buddy's member id",
  challengeSent: "the game id the challenge created",
  challengeAnswered: "the game id",
  rematchPlayed: "the game id of the new game",
  forkPlayed: "the game id of the new game",
  timeGiven: "the game id",
  applauseGiven: "the game id",
  nameSet: "",
  countrySet: "",
  bioSet: "",
  wordsSet: "",
  seatClaimedElsewhere: "the game id",
};

/**
 * Kinds that are priced and named, and that nothing pays yet.
 *
 * Named because a page listing the ways to earn XP reads this catalogue, and a
 * promise of 500 XP that nothing pays is the same broken promise as a count
 * with nothing behind it — UmaKuma shipped a page advertising 300 XP of game
 * awards for exactly that reason. A kind leaves this list when its ticket wires
 * it; `xp.constants.test.ts` fails if a name here is not a real type.
 *
 * XP-02 wires four: `joined`, `dailyVisit`, `gameFinished`, `gameWon`.
 */
export const XP_UNWIRED: readonly XpEventType[] = [
  /* `comeback` is priced and deliberately not paid, and it is the only one left:
     nothing on this site can read a position as losing for every variant — the
     flips, the twists and the races set `analysis: false` — and an approximation
     would pay everybody for every win. The whole refusal, with what it would take
     to do it honestly, is in `xpGame.ts`. */
  "comeback",
];

/** A game past this many moves went the distance. See `longGame`. */
export const XP_LONG_GAME_MOVES = 60;

/**
 * How close to the next level is close enough to mention.
 *
 * What one finished win pays, so the nudge a toast shows — *Next level: Pixel* —
 * is literally "one more game and you are there". Expressed in the currency of
 * the site rather than as a percentage of the level's span, because a percentage
 * is a number nobody can act on: 8% of the way to go means nothing, and one more
 * game means play one more game.
 *
 * It also stays honest at both ends of the ladder. The first rungs cost 50 to
 * 450, so 75 is a real fraction of one; the last cost tens of thousands, so there
 * the nudge appears only when it is genuinely one game away rather than for the
 * last stretch of a long climb.
 */
/**
 * WHAT ONLY A PERSON CAN EARN.
 *
 * John, settling how the computer players stand on the ladder: they earn from
 * their games like anyone, and "people will have to earn XP through other
 * means which the Robots don't do." So the split is stated rather than left to
 * fall out of what a program happens never to trigger: every award here is
 * for an act a program never performs — arriving, signing in, keeping a
 * streak of days, having a buddy, asking for or answering a game, giving
 * time, applauding, filling in a profile, claiming a seat elsewhere. `awardXp`
 * holds these back from a member with an engine name and says why; the
 * backfill plans none of them for one. Everything not here is a fact about a
 * finished game, and a program earns it under the same rules as a person.
 *
 * Not a place to invent new people-only awards: that is John's to ask for.
 * `xp.coverage.test.ts` holds every type to one side of this line or the
 * other, so a new award has to be sorted the day it is priced.
 */
export const XP_PEOPLE_ONLY: ReadonlySet<XpEventType> = new Set<XpEventType>([
  XP_EVENTS.joined,
  XP_EVENTS.dailyVisit,
  XP_EVENTS.dayStreak7,
  XP_EVENTS.dayStreak30,
  XP_EVENTS.dayStreak100,
  XP_EVENTS.dayStreak365,
  XP_EVENTS.backFromAway,
  /* Anniversaries ride the first visit of a day, which a program never makes. */
  XP_EVENTS.yearHere,
  XP_EVENTS.yearsHere5,
  XP_EVENTS.yearsHere10,
  XP_EVENTS.firstBuddy,
  XP_EVENTS.buddyAdded,
  XP_EVENTS.wonVsBuddy,
  XP_EVENTS.challengeSent,
  XP_EVENTS.challengeAnswered,
  XP_EVENTS.rematchPlayed,
  XP_EVENTS.forkPlayed,
  XP_EVENTS.timeGiven,
  XP_EVENTS.applauseGiven,
  XP_EVENTS.nameSet,
  XP_EVENTS.countrySet,
  XP_EVENTS.bioSet,
  XP_EVENTS.wordsSet,
  XP_EVENTS.seatClaimedElsewhere,
]);

/** Whether this award may reach a member with an engine name. */
export function earnableByProgram(type: XpEventType): boolean {
  return !XP_PEOPLE_ONLY.has(type);
}

export const XP_ONE_MORE_GAME =
  XP_EVENT_SPECS.gameFinished.points + XP_EVENT_SPECS.gameWon.points;

/** Consecutive wins that earn a milestone, longest last. */
export const XP_WIN_STREAK_MILESTONES: readonly { wins: number; type: XpEventType }[] = [
  { wins: 3, type: XP_EVENTS.winStreak3 },
  { wins: 5, type: XP_EVENTS.winStreak5 },
  { wins: 10, type: XP_EVENTS.winStreak10 },
];

/**
 * YEARS: ON ITSUTSU, AND ON ANOTHER SITE, PRICED ONCE.
 *
 * The same three awards pay a member's anniversaries here and a kept record's
 * years on another site, so the amounts are the `yearHere`, `yearsHere5` and
 * `yearsHere10` rows above and nothing restates them. `needGames` is the
 * fairness guard John approved: years somewhere count only with at least a
 * hundred games played there, so joining and leaving pays nothing.
 */
export const XP_YEAR_AWARDS = {
  year: XP_EVENTS.yearHere,
  milestones: [
    { years: 5, type: XP_EVENTS.yearsHere5 },
    { years: 10, type: XP_EVENTS.yearsHere10 },
  ],
  needGames: 100,
} as const;

/**
 * Whole years from one calendar day to another: anniversaries actually reached.
 *
 * Day keys (`YYYY-MM-DD`), because an anniversary is a day in somebody's own
 * calendar and a kept record's dates are days. NULL when it cannot be measured —
 * a missing day, a string that is not one, or an end before its start. Not
 * nought: nought years is a real answer and a record with no dates has not said
 * it. A rule that cannot measure must not fire.
 */
export function wholeYearsBetween(from: string | undefined, to: string | undefined): number | null {
  const parts = (value: string | undefined) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    if (match === null) return null;
    const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return m < 1 || m > 12 || d < 1 || d > 31 ? null : { y, m, d };
  };
  const start = parts(from);
  const end = parts(to);
  if (start === null || end === null) return null;
  const beforeAnniversary = end.m < start.m || (end.m === start.m && end.d < start.d);
  const years = end.y - start.y - (beforeAnniversary ? 1 : 0);
  return years < 0 ? null : years;
}

/**
 * Results at one game that earn a milestone: wins, losses and draws, each
 * counted per game and per member, smallest first.
 *
 * One table for the live award, the replay and the import alike, so the three
 * cannot disagree about where a milestone falls or what it is called.
 */
export const XP_RESULT_MILESTONES: readonly { outcome: StreakOutcome; count: number; type: XpEventType }[] = [
  { outcome: "win", count: 10, type: XP_EVENTS.wins10 },
  { outcome: "win", count: 100, type: XP_EVENTS.wins100 },
  { outcome: "win", count: 250, type: XP_EVENTS.wins250 },
  { outcome: "win", count: 500, type: XP_EVENTS.wins500 },
  { outcome: "win", count: 1000, type: XP_EVENTS.wins1000 },
  { outcome: "loss", count: 10, type: XP_EVENTS.losses10 },
  { outcome: "loss", count: 50, type: XP_EVENTS.losses50 },
  { outcome: "loss", count: 100, type: XP_EVENTS.losses100 },
  { outcome: "loss", count: 250, type: XP_EVENTS.losses250 },
  { outcome: "loss", count: 500, type: XP_EVENTS.losses500 },
  { outcome: "loss", count: 1000, type: XP_EVENTS.losses1000 },
  { outcome: "draw", count: 10, type: XP_EVENTS.draws10 },
];

/**
 * The milestone a result has just reached at one game, or null.
 *
 * EXACTLY, not at-least, for `winStreakMilestoneFor`'s reason: the hundred and
 * first win asks for nothing rather than asking for the hundredth's award and
 * leaning on the index to refuse it. A milestone a live game missed — a failed
 * read, a game decided before this shipped — is paid by the backfill's replay,
 * which counts every decided game in order and is idempotent.
 */
export function resultMilestoneFor(outcome: StreakOutcome, count: number): XpEventType | null {
  return XP_RESULT_MILESTONES.find((one) => one.outcome === outcome && one.count === count)?.type ?? null;
}

/** Consecutive days that earn a milestone, longest last. */
export const XP_DAY_STREAK_MILESTONES: readonly { days: number; type: XpEventType }[] = [
  { days: 7, type: XP_EVENTS.dayStreak7 },
  { days: 30, type: XP_EVENTS.dayStreak30 },
  { days: 100, type: XP_EVENTS.dayStreak100 },
  { days: 365, type: XP_EVENTS.dayStreak365 },
];

/**
 * The milestone a run of exactly this length has just reached, or null.
 *
 * Exactly, not at-least: a run of eleven wins has already been paid for ten,
 * and the unique index would refuse it anyway — but leaning on the index to
 * refuse what the rule should never have asked for is how a cap ends up being
 * the only thing keeping an economy honest.
 */
export function winStreakMilestoneFor(wins: number): XpEventType | null {
  return XP_WIN_STREAK_MILESTONES.find((milestone) => milestone.wins === wins)?.type ?? null;
}

/** The same, for a run of days. */
export function dayStreakMilestoneFor(days: number): XpEventType | null {
  return XP_DAY_STREAK_MILESTONES.find((milestone) => milestone.days === days)?.type ?? null;
}

/** What a toast and a history row say about one award. */
export function xpEventCopy(type: XpEventType): Pick<XpEventSpec, "label" | "kanji" | "sentence" | "blurb"> {
  const spec = XP_EVENT_SPECS[type];
  return { label: spec.label, kanji: spec.kanji, sentence: spec.sentence, blurb: spec.blurb };
}

/** What one award of this kind is worth. */
export function xpPointsFor(type: XpEventType): number {
  return XP_EVENT_SPECS[type].points;
}
