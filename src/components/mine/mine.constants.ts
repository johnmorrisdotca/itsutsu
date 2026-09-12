import type { MyGameGroup } from "@/lib/history/myGames";
import { RATING_SPLIT } from "@/lib/history/openSeatsFilter";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";

export const MY_GAMES_COPY = {
  title: { label: "Your games", kanji: "対局中" },
  groups: {
    yourMove: { label: "Your move", kanji: "手番", hint: "Waiting on you." },
    theirMove: { label: "Their move", kanji: "相手番", hint: "Waiting on the other side. You will be told when it is yours." },
    unstarted: { label: "Not started", kanji: "未着手", hint: "Boards with no stones yet. Hand out the other seat, post it for anyone, or play first." },
    hotSeat: { label: "At this screen", kanji: "対面", hint: "Two people at one board, in this browser. Kept, never rated." },
    finished: { label: "Lately finished", kanji: "終局", hint: "Filed in the record." },
  } satisfies Record<MyGameGroup, { label: string; kanji: string; hint: string }>,
  stale: "Stale",
  staleHint: (days: number) => `No move for more than ${days} days. Resign it, or make a move.`,
  resign: { label: "Resign", kanji: "投了" },
  resignConfirm: "Resign this game? The other side wins and it is filed in the record.",
  /*
   * A board with no stones on it is called off, not resigned. Resigning means
   * giving up something under way, and nothing is under way — so the word
   * changes, and so does what it costs: nobody wins, nobody loses, and no
   * rating moves.
   */
  cancel: { label: "Cancel", kanji: "取消" },
  cancelConfirm: "Call off this game? Nothing has been played, so nobody wins and no rating moves.",
  localGame: { label: "Your game", kanji: "続き" },
  openBoard: { label: "Open seats", kanji: "対局募集", hint: "Games somebody has posted for anyone. Sit down and it is yours." },
  sit: { label: "Sit as White", kanji: "着席" },
  sitTaken: "Somebody else just took that seat.",
  continueGame: "Continue",
  yourTurn: (count: number) => (count === 1 ? "1 game waiting on you" : `${count} games waiting on you`),
} as const;

/** The paces a game may be asked for, in the words the clock uses. */
export const PACES: readonly { value: number | null; label: string }[] = [
  { value: 24 * 60 * 60_000, label: "1 day a move" },
  { value: 5 * 60_000, label: "5 minutes a move" },
  { value: 30 * 60_000, label: "30 minutes a move" },
  { value: 60 * 60_000, label: "1 hour a move" },
  { value: 6 * 60 * 60_000, label: "6 hours a move" },
  { value: 3 * 24 * 60 * 60_000, label: "3 days a move" },
  { value: 7 * 24 * 60 * 60_000, label: "7 days a move" },
  { value: null, label: "no clock" },
];

/**
 * The noticeboard's own three questions, in the words a reader asks them:
 * how fast, against whom, and what a missed deadline costs. The players page
 * settled on the shape for this kind of bar; this is its copy, for the same
 * shape asked of the open seats instead of the members.
 */
export const OPEN_SEATS_FILTER_COPY = {
  paceLabel: "Pace",
  ratingLabel: "Their rating",
  penaltyLabel: "If a deadline is missed",
  anyPace: "Any pace",
  anyRating: "Any rating",
  anyPenalty: "Any penalty",
  under: `Under ${RATING_SPLIT}`,
  over: `${RATING_SPLIT} and up`,
  unrated: "Unrated",
  unratedHint: "Fewer than four rated games, in either pool.",
  clear: "Show every open seat",
  empty: "Nobody is waiting at that pace, rating or penalty right now.",
} as const;

/**
 * Starting a game is one question — what, how fast, and with whom — so the
 * page asks it as one sentence and the button says what pressing it does.
 */
export const START_COPY = {
  title: { label: "Start a game", kanji: "対局を始める" },
  lead:
    "Say what you want to play, how fast, and with whom. If somebody already wants the same, you sit down together now; if not, your seat waits on the board below and you are told when it is taken.",
  play: "Play",
  /** Between the game and the pace, and only when the game has more than one board. */
  on: "on",
  at: "at",
  with: "with",
  anyone: "anyone",
  atThisScreen: "someone at this screen",
  hereNow: { label: "Here now", kanji: "在室" },
  buddies: { label: "Buddies", kanji: "仲間" },
  computer: { label: "The computer", kanji: "コンピュータ" },
  post: "Post the seat",
  sitWith: (who: string) => `Sit down with ${who}`,
  setUp: "Set up the board",
  challenge: (who: string) => `Challenge ${who}`,
  seatsOpen: (count: number) => (count === 1 ? "1 seat open" : `${count} seats open`),
  matchHint: (who: string) =>
    `${who} is asking for exactly this. You sit down together now; colours are drawn at random.`,
  firstHint: (game: string) =>
    `Nobody is asking for ${game} right now, so yours would be first on the board. You are told when somebody sits down, and the game appears in your list.`,
  otherPaceHint: (count: number, game: string) =>
    `${count === 1 ? "One seat is" : `${count} seats are`} open for ${game} at another pace — change the pace to sit down at once, or post yours and wait for this one.`,
  screenHint: "Two people, one board, right now. Kept in this browser, never rated, and the pace does not apply.",
  /*
   * The hint a computer opponent gets. It says the two things a person
   * actually wants to know before choosing one: how hard it is, and that the
   * game counts — but on its own ladder, not the one with people on it.
   */
  computerHint: (who: string, strength: string) =>
    `${who} plays at once, so you are never waiting and the clock never runs against it. ` +
    `${strength}. The game is rated, for both of you, against the computer rather than on the ladder of people.`,
  challengeHintHere: (who: string) => `The game is in ${who}'s list the moment you start it; there is nothing to accept. ${who} is here now.`,
  challengeHintAway: (who: string, pace: string) =>
    `The game is in ${who}'s list the moment you start it; there is nothing to accept. ${who} is not here at the moment, which is fine at ${pace.toLowerCase()}.`,
  signedOut: "Sign in to play against somebody else. Two at one screen works either way.",
  failed: "That game could not be started. Try again.",
  seatTaken: "Somebody took that seat first. Yours is posted instead.",
  noSeats:
    "Nobody is asking for a game right now. Post a seat above and yours is first on the board.",
  onlyMine: "Only yours so far. It stays until somebody sits down or you withdraw it.",
  nobodyHere: "Nobody else is here just now. A seat posted above waits for whoever comes in next.",
} as const;

/**
 * The Words tab: four words a member picks so that they can sit down at
 * somebody else's device and play as themselves. Everything a reader is shown
 * there, in one place, so the tiles and the picker cannot drift apart in what
 * they call a box or a word.
 */
export const WORDS_COPY = {
  lead: "Four words that let you play as yourself on somebody else's device, without anybody signing out.",
  unsetStatus: "No four words are set yet.",
  setStatus: "Four words are set",
  since: (date: string) => ` — since ${date}`,
  kept: "They cannot be shown again, not even to you. Forgotten them? Choose four new ones — it takes half a minute.",
  choose: "Choose your four words",
  chooseAgain: "Choose four new words",
  remove: "Remove",
  removeQuestion: "Remove your four words?",
  removeYes: "Yes, remove them",
  removeNo: "Keep them",
  cannotRemove:
    "Your four words are the only way into this account, so they cannot be removed. Add a sign-in address first, and then they can go.",
  saved: "Saved. From now on these four words are you, on any device.",
  slotsLabel: "Your four words, in the order you arranged them",
  emptyBox: (box: number) => `Box ${box} of ${PHRASE_LENGTH}, empty`,
  nextBox: (box: number) => `Box ${box} of ${PHRASE_LENGTH}, the next to be filled`,
  hiddenWord: "A word, set and hidden",
  tileTitle: "Tap to take this word back out. Drag it, or use the arrow keys, to move it to another box.",
  tileHint: "Enter takes this word back out. The arrow keys move it one box along; Home and End to the first and last box.",
  moved: (word: string, box: number) => `${word} is now in box ${box} of ${PHRASE_LENGTH}.`,
  arrange:
    "Drag a word to another box if a different order is easier to remember — the order is yours, and it never matters to the words. Tap a word to take it back out.",
  keepOne: "Tap a word to keep it.",
  toGo: (left: number) => `${["No", "One", "Two", "Three", "Four"][left] ?? String(left)} more to go.`,
  finding: "Finding four words…",
  refresh: "Show me four other words",
  writeDown: "Write these four words down somewhere now.",
  writeDownWhy:
    "Once they are set they cannot be shown again — not to you, not to anyone. If you forget them, the fix is to pick four new ones, so there is no crisis, only a re-pick.",
  acknowledge: "I have written these four words down.",
  save: "Save these four words",
  startOver: "Start over",
  cancel: "Cancel",
  drawFailed: "Could not offer any words.",
  saveFailed: "Could not set those words.",
  removeFailed: "Could not remove those words.",
} as const;
