import type { MyGameGroup } from "@/lib/history/myGames";

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
