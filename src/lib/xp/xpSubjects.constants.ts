import type { XpEventType } from "./xp.types";

/*
 * Developer notes, not words for a member: this file is allowed past the
 * English gate (`ALLOWED_FILES` in `scripts/check-i18n-strings.mjs`) because
 * nothing in it is ever drawn on a page. It sat in `xp.constants.ts` beside the
 * awards' words until those moved to `xpAwardCopy.constants.ts`.
 */

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
  firstOfVariant: "the RuleVariant key, or a PuzzleKind for a puzzle solved",
  firstWinAtVariant: "the RuleVariant key",
  firstOfFamily: "the family's key in GAME_FAMILIES, which the family title is not",
  everyFamilyPlayed: "",
  everyVariantPlayed: "",
  everyVariantWonInFamily: "the family's key in GAME_FAMILIES, which the family title is not — once per family, and only a family of more than one game",
  puzzleSolved: "the puzzle's kind, side and the hash of its givens, so one grid pays once",
  puzzleEnded: "the puzzle's kind, side and the hash of its givens, as puzzleSolved, so one word pays once",
  raceWon: "the race's id, so a race pays its winner once",
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
  fullHouse: "",
  cleanSweepFirst: "",
  cleanSweep: "the day key of the day that was kept, in the member's own zone",
  fullHouseCombo7: "the day key the run reached it on, so a later run earns it again",
  fullHouseCombo15: "the day key the run reached it on",
  fullHouseCombo30: "the day key the run reached it on",
  fullHouseCombo60: "the day key the run reached it on",
  fullHouseCombo120: "the day key the run reached it on",
  fullHouseCombo250: "the day key the run reached it on",
  fullHouseCombo500: "the day key the run reached it on",
  fullHouseCombo1000: "the day key the run reached it on",
  gradeBeaten: "the BotTier",
  everyGradeBeaten: "",
  specialistBeaten: "the BotTier",
  firstBuddy: "",
  buddyAdded: "the buddy's member id",
  challengeSent: "the game id the offer created",
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
