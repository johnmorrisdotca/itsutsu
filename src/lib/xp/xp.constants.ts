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
  firstOfVariant: "firstOfVariant",
  firstWinAtVariant: "firstWinAtVariant",
  firstOfFamily: "firstOfFamily",
  everyFamilyPlayed: "everyFamilyPlayed",
  everyVariantPlayed: "everyVariantPlayed",
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
    points: 25,
    label: "Joined",
    kanji: "入会",
    blurb: "For being here at all. Once, ever.",
    sentence: "Welcome to Itsutsu.",
  },
  dailyVisit: {
    points: 5,
    label: "A new day",
    kanji: "毎日",
    blurb: "For looking in, once a day.",
    sentence: "Good to see you again.",
  },
  dayStreak7: {
    points: 30,
    label: "Seven days running",
    kanji: "七日",
    blurb: "For a week of days without missing one.",
    sentence: "Seven days in a row.",
  },
  dayStreak30: {
    points: 100,
    label: "Thirty days running",
    kanji: "三十日",
    blurb: "For a month of days without missing one.",
    sentence: "Thirty days in a row.",
  },
  dayStreak100: {
    points: 300,
    label: "A hundred days running",
    kanji: "百日",
    blurb: "For a hundred days without missing one.",
    sentence: "A hundred days in a row.",
  },
  dayStreak365: {
    points: 1000,
    label: "A year running",
    kanji: "一年",
    blurb: "For a whole year without missing a day. It repeats, so it is worth repeating for.",
    sentence: "A year without missing a day.",
  },
  weekendGame: {
    points: 5,
    label: "Weekend game",
    kanji: "週末",
    blurb: "For finishing a game at the weekend. Once a weekend.",
    sentence: "A game at the weekend.",
  },
  backFromAway: {
    points: 25,
    label: "Back from away",
    kanji: "帰還",
    blurb: "For coming back after time away.",
    sentence: "Welcome back.",
  },

  /* ── Playing ────────────────────────────────────────────────────────────
     A finish pays whether you won or lost, because finishing is the courtesy
     correspondence play depends on. A win pays twice a finish: better, not four
     times better, or the site only rewards the strong. */

  firstGameEver: {
    points: 50,
    label: "Your first game",
    kanji: "初局",
    blurb: "For finishing your very first game here.",
    sentence: "Your first game on Itsutsu.",
  },
  gameFinished: {
    points: 10,
    label: "Game finished",
    kanji: "終局",
    blurb: "For seeing a game through, won or lost.",
    sentence: "A game seen through.",
    cap: 6,
  },
  gameWon: {
    points: 20,
    label: "Game won",
    kanji: "勝利",
    blurb: "For winning one, on top of what finishing it paid.",
    sentence: "A game won.",
    cap: 6,
    ridesAllowance: true,
  },
  wonVsPerson: {
    points: 10,
    label: "Won against a person",
    kanji: "対人",
    blurb: "On top of the win, for beating somebody rather than something.",
    sentence: "Beat a real person.",
    cap: 6,
    ridesAllowance: true,
  },
  wonVsBuddy: {
    points: 15,
    label: "Won against a buddy",
    kanji: "友人",
    blurb: "On top again, for beating somebody on your buddy list.",
    sentence: "Beat one of your buddies.",
    cap: 6,
    ridesAllowance: true,
  },
  revengeWin: {
    points: 30,
    label: "Turned it around",
    kanji: "復讐",
    blurb: "For beating somebody at a game they had beaten you at. Once per rivalry.",
    sentence: "You turned that one around.",
  },
  longGame: {
    points: 10,
    label: "A long game",
    kanji: "長局",
    blurb: "For a game that went the distance.",
    sentence: "That one went the distance.",
    cap: 6,
    ridesAllowance: true,
  },
  comeback: {
    points: 30,
    label: "A comeback",
    kanji: "逆転",
    blurb: "For winning a game you were losing.",
    sentence: "Won from behind.",
  },
  winStreak3: {
    points: 25,
    label: "Three in a row",
    kanji: "三連勝",
    blurb: "For three wins without a loss between them.",
    sentence: "Three wins in a row.",
  },
  winStreak5: {
    points: 60,
    label: "Five in a row",
    kanji: "五連勝",
    blurb: "For five wins without a loss between them.",
    sentence: "Five wins in a row.",
  },
  winStreak10: {
    points: 200,
    label: "Ten in a row",
    kanji: "十連勝",
    blurb: "For ten wins without a loss between them.",
    sentence: "Ten wins in a row.",
  },

  /* ── The tour ───────────────────────────────────────────────────────────
     Thirty-nine games and eleven families, most of them barely played. These
     five are 2,025 XP of the 3,740 available once-only, which is the economy
     pointed at the problem the site actually has. */

  firstOfVariant: {
    points: 25,
    label: "A game you had not played",
    kanji: "初手合",
    blurb: "For your first game of a game. There are thirty-nine of them.",
    sentence: "A game you had never played.",
  },
  firstWinAtVariant: {
    points: 20,
    label: "First win at a game",
    kanji: "初勝",
    blurb: "For your first win at one of the thirty-nine.",
    sentence: "Your first win at this one.",
  },
  firstOfFamily: {
    points: 50,
    label: "A family you had not met",
    kanji: "初族",
    blurb: "For your first game from one of the eleven families.",
    sentence: "A whole family you had not met.",
  },
  everyFamilyPlayed: {
    points: 200,
    label: "Every family played",
    kanji: "全族",
    blurb: "For playing a game from all eleven families.",
    sentence: "All eleven families played.",
  },
  everyVariantPlayed: {
    points: 500,
    label: "Every game played",
    kanji: "全種",
    blurb: "For playing all thirty-nine games on the site. The largest single award here.",
    sentence: "All thirty-nine games played.",
  },

  /* ── The computer ladder ────────────────────────────────────────────────
     Five graded grades and two specialists. Twice a win over a person, because
     a grade can only be beaten for the first time once. */

  gradeBeaten: {
    points: 40,
    label: "A grade beaten",
    kanji: "撃破",
    blurb: "For your first win against one of the five computer grades.",
    sentence: "A computer grade beaten.",
  },
  everyGradeBeaten: {
    points: 250,
    label: "Every grade beaten",
    kanji: "全段",
    blurb: "For beating all five computer grades. The hardest ordinary goal here.",
    sentence: "All five grades beaten.",
  },
  specialistBeaten: {
    points: 50,
    label: "A specialist beaten",
    kanji: "名手",
    blurb: "For beating one of the two specialists at their own game.",
    sentence: "A specialist beaten at their own game.",
  },

  /* ── People ─────────────────────────────────────────────────────────────
     Capped and small. A buddy list is not a score, and asking for a game
     should cost nothing to be worth doing. */

  firstBuddy: {
    points: 50,
    label: "Your first buddy",
    kanji: "初友",
    blurb: "For adding somebody to your buddy list for the first time.",
    sentence: "Your first buddy.",
  },
  buddyAdded: {
    points: 10,
    label: "A buddy added",
    kanji: "友達",
    blurb: "For adding somebody to your buddy list.",
    sentence: "A buddy added.",
    cap: 3,
  },
  challengeSent: {
    points: 5,
    label: "Challenge sent",
    kanji: "挑戦",
    blurb: "For asking somebody for a game.",
    sentence: "Challenge sent.",
    cap: 3,
  },
  challengeAnswered: {
    points: 10,
    label: "Challenge answered",
    kanji: "応戦",
    blurb: "For answering somebody's challenge with a move.",
    sentence: "Challenge answered.",
    cap: 6,
  },
  rematchPlayed: {
    points: 10,
    label: "A rematch",
    kanji: "再戦",
    blurb: "For taking a rematch. A game worth playing twice.",
    sentence: "A rematch.",
    cap: 6,
  },
  forkPlayed: {
    points: 15,
    label: "A fork",
    kanji: "分岐",
    blurb: "For playing a position on from the middle of a finished game.",
    sentence: "A position played on.",
    cap: 6,
  },
  timeGiven: {
    points: 10,
    label: "Time given",
    kanji: "情け",
    blurb: "For giving your opponent more time when they needed it.",
    sentence: "That was sporting.",
    cap: 3,
  },
  applauseGiven: {
    points: 5,
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
    points: 10,
    label: "A name set",
    kanji: "名前",
    blurb: "For choosing what you are called here.",
    sentence: "Your name is set.",
  },
  countrySet: {
    points: 10,
    label: "A country set",
    kanji: "国",
    blurb: "For saying where you are playing from.",
    sentence: "Your country is set.",
  },
  bioSet: {
    points: 20,
    label: "Something about you",
    kanji: "紹介",
    blurb: "For writing a line about yourself on your page.",
    sentence: "Your page says something about you.",
  },
  wordsSet: {
    points: 20,
    label: "Four words set",
    kanji: "四語",
    blurb: "For setting the four words that let you take a seat on any device.",
    sentence: "Your four words are set.",
  },
  seatClaimedElsewhere: {
    points: 25,
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
  firstOfVariant: "the RuleVariant key",
  firstWinAtVariant: "the RuleVariant key",
  firstOfFamily: "the family title, until GAME_FAMILIES has keys",
  everyFamilyPlayed: "",
  everyVariantPlayed: "",
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
 * It also stays honest at both ends of the ladder. Early levels cost 20 to 200,
 * so 30 is a real fraction of one; level 100 costs 1,840, so the nudge appears
 * only when it is genuinely one game away rather than for the last two hundred
 * points of a long climb.
 */
export const XP_ONE_MORE_GAME =
  XP_EVENT_SPECS.gameFinished.points + XP_EVENT_SPECS.gameWon.points;

/** Consecutive wins that earn a milestone, longest last. */
export const XP_WIN_STREAK_MILESTONES: readonly { wins: number; type: XpEventType }[] = [
  { wins: 3, type: XP_EVENTS.winStreak3 },
  { wins: 5, type: XP_EVENTS.winStreak5 },
  { wins: 10, type: XP_EVENTS.winStreak10 },
];

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
