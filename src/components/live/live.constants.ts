/**
 * The words the screens around a shared game use.
 *
 * One module for the group rather than one per component, so that the setup
 * screen and the panel beside a board cannot come to call the same thing two
 * names — which is the fault this whole area was built to remove.
 */

/**
 * HOW OFTEN A LIVE BOARD ASKS. Numbers rather than words, but the same group:
 * `useLiveGame` spends them and `pollCadence.ts` decides between them.
 *
 * Every ask is a function call on a paid account. With the numbers these
 * replaced — every 2.5 seconds in front, every 30 behind, for an hour after the
 * last move — one board left open made 1,440 asks an hour while looked at and
 * 120 while hidden, counted by `e2e/live-poll-cadence.spec.ts`. John,
 * 2026-09-15: "we have to stop doing things like that that will eat up CPU
 * time."
 */

/**
 * How often a board somebody is looking at asks whether the other side has
 * moved.
 *
 * Fifteen seconds is the floor the site owner set, and it is enough: a move
 * arriving a few seconds late cannot be told apart from the other side
 * thinking. A hidden tab does not ask at all — see `pollInterval`.
 */
export const POLL_MS = 15_000;

/**
 * How long a board keeps asking with nothing happening — no change arriving
 * on the board, and nothing done by the reader — before it stops asking.
 *
 * SIX MINUTES, because the fastest move clock this site offers is five: in a
 * timed game a move can fairly arrive up to five minutes after the last, and
 * a board must not go quiet inside one allowed move. Past that nobody is
 * playing in real time — two people at their boards move, press, chat or
 * claim a flag well inside it — and the game has become a correspondence game,
 * whose board need only be current when somebody looks. On `POLL_MS` that is
 * at most twenty-four asks after the last sign of life, where it was an hour.
 *
 * Nothing is lost by stopping: the board says it has stopped
 * (`LIVE_PAUSED_COPY`), and a press, a key, focus or the tab being shown wakes
 * it, and it asks at once. `pollCadence.test.ts` holds it above the fastest
 * clock and under ten minutes.
 */
export const IDLE_STOP_MS = 6 * 60 * 1000;

/** The fastest the end-to-end suite's relief may make a board ask — see `pollEvery`. */
export const POLL_RELIEF_FLOOR_MS = 1_000;

/**
 * What a board that has stopped asking says, and the button that wakes it.
 *
 * Said, because a board that stopped in silence would show an old position as
 * though it were the current one — which is the one thing a live board must
 * never do. Any press or key on the page wakes it too; the button is there so
 * nobody has to know that.
 */
export const LIVE_PAUSED_COPY = {
  line: "Nothing has happened here for a while, so this board has stopped checking for moves.",
  check: "Check now",
} as const;

/**
 * SETTLING A GAME BEFORE IT EXISTS, IN WORDS.
 *
 * Every way of starting a game on this site leads here now, and each arrives
 * knowing a different amount: the opponent, or the opponent and the rules, or
 * those and a position as well. The screen has to say WHICH of those it is, or
 * a reader cannot tell a fresh game from a rematch from a fork — they would all
 * be the same form with different numbers in it.
 */
/**
 * What the set-up screen and the doorstep say about an address they could not use
 * all of, naming each part by the word the address used — see `unreadAsked`. Said,
 * because a link that asked for something and quietly got the usual setting looks
 * exactly like a link that asked for nothing.
 */
export const SET_UP_UNREAD = (names: readonly string[]) =>
  `Part of this address is not something this game offers, so ${
    names.length === 1 ? "it was" : "they were"
  } left at the usual setting: ${names.join(", ")}.`;

export const SET_UP_COPY = {
  /** The heading and lead, where nothing but the opponent is known. */
  against: (who: string) => `Against ${who}`,
  againstHint: (who: string) =>
    `${who} is who you are playing. Choose the game and the rules, and the game is in their list the moment you start it — there is nothing for them to accept.`,
  /** The heading and lead for a game being played again. */
  again: (who: string) => `Play ${who} again`,
  // `who` is said, not merely accepted: a confirmation that does not name the
  // person is a confirmation of nothing. The spec that caught it asks for the
  // name here, and the signature had promised it all along.
  againHint: (who: string, colour: string) =>
    `The same board, the same rules and the same clock as last time against ${who}, with the colours swapped — you take ${colour}. Everything below is already filled in, so this is a confirmation; change anything you would rather play differently.`,
  /** Said when a rematch has been altered, because then it is not one. */
  againChanged:
    "You have changed something, so this starts a new game against the same player rather than a repeat of the last one. The colours are drawn the ordinary way: you open.",
  /**
   * Said when a rematch's player has been changed. Then it is a new game with
   * these rules and not a rematch, and nothing a rematch is — the swap, the award —
   * comes with it. `chosen` is null for a seat for anyone or a program drawn at
   * random, neither of which has a name yet.
   */
  againElsewhere: (them: string, chosen: string | null) =>
    `You have chosen ${chosen ?? `not to play ${them} again`}, so this is a new game with these rules — not a rematch of your last game against ${them}, and the colours are not swapped.`,
  /** The heading and lead for a fork. */
  fork: (move: number) => `Play on from move ${move}`,
  forkHint: (move: number, who: string) =>
    `A second game from the position after move ${move}, against ${who}. Both games go on. The board, the game and the opening come with the position and cannot change; the clock and whether it counts are this game's own.`,
  forkAlone:
    "Nobody held the other seat in the game this comes from, so this is a board at one screen: start it and hand the other seat out from there.",
  /** The head start's colour select, first under the Handicap heading: who is given a start. */
  headStartFor: "Head start for",
  /** What a head start is for, where somebody is choosing one. */
  headStartHint:
    "The weaker player's start: turns in hand at the beginning, and the game's own traditional head start where it has one. A game with a head start does not count towards ratings. Leave it at none for an even game.",
  /** The answer that gives nobody anything. */
  headStartNone: "None",
  freeTurns: "Free turns",
  freeTurnsHint: (colour: string) =>
    `${colour} plays this many turns at the very start before the other side answers. Each one is shown on the record as the other side's pass.`,
  /** The handicap's colour select, under the Handicap heading: who takes on the harder rules. */
  handicapFor: "Harder rules for",
  /** What a handicap is for, where somebody is choosing one. */
  handicapHint:
    "One colour plays under extra restrictions and the other plays the plain game — how the elder sites let a stronger player give a weaker one a start. Leave it at none for an even game.",
  handicapOpen: (colour: string) =>
    `${colour} plays under every restriction switched on below; the other colour plays the game as it comes. Switch on only what you mean — each one makes ${colour.toLowerCase()}'s game harder.`,
  /**
   * SAID OUT LOUD WHEN A NAMED PLAYER IS NOT OFFERED AT THIS GAME.
   *
   * A specialist computer player plays one game — away from its own board it is
   * somebody else under another name and a different flag — so choosing another
   * game drops it from the list of players offered. The screen then falls back to
   * posting a seat for anyone, which is the right fallback and a terrible
   * surprise: somebody who pressed Play on one program would get a seat posted
   * to the noticeboard and no hint that they had.
   *
   * So it says which. This is the shape the lobby sentence already had a rule
   * about — fall back, and say you have.
   */
  notAtThisGame: (who: string, game: string) =>
    `${who} does not play ${game}, so this would post a seat for anyone instead. Change the game back, or pick somebody else.`,
  /** Said where the opponent came in on the address rather than being chosen. */
  opponentFixed: "Asked for from their page. Change it here if you meant somebody else.",
  /** The way back out of a pre-filled screen to a blank one. */
  startOver: "Set a game up from scratch instead",
  /**
   * What the button at the bottom now does, since it no longer makes anything.
   *
   * Said because the change is worth noticing: pressing it used to write a game
   * and land on a board, and it now leads to the page that states what is about
   * to be played. Somebody who has used this screen before needs telling once.
   */
  startLeads: "Next you will see the whole game stated. Nothing is started until you press Begin there.",
  /**
   * THE BUTTON AT THE BOTTOM, named for what it does. John: "it's not Start the
   * Game... button should be 'Continue the Game' or 'Continue' or 'Game Setup' -
   * something smart." It leads to the page that states the game and begins it
   * on a press of its own, so it continues; it starts nothing.
   */
  continue: "Continue 次へ",
  continuing: "Continuing…",
  /** The same press where somebody is already asking for exactly this game. */
  continueToSeat: (who: string) => `Continue to sit down with ${who} 次へ`,
  /** The headings over the screen's groups, in the order they are drawn. */
  sections: {
    opponent: { title: "Who you play", kanji: "対戦相手" },
    rules: { title: "The rules", kanji: "規則" },
    handicap: { title: "Handicap", kanji: "ハンデ" },
  },
  /** Where a posted seat can be found by whoever takes it. */
  postedWhere: "It waits on the Games page until somebody takes it.",
  /** The way to anybody the lists here do not hold. */
  elsewhere: "Somebody not listed here? Find them on the",
  elsewhereLink: "Players page",
  elsewhereAfter: "and press Challenge: they arrive here already chosen.",
} as const;

/**
 * THE RULES BESIDE A BOARD, IN WORDS.
 *
 * Short, because there are only two things left to say there. Everything that
 * used to be decided beside a board is decided on the doorstep now, so the panel
 * states rather than offers — see `SharedRules`.
 */
export const SHARED_RULES_COPY = {
  /**
   * Why the rows are answers.
   *
   * It said "the first stone is down" before, which was true of the moment the
   * form went away and is no longer the reason: nothing after the doorstep can
   * change these, stone or no stone. A note that gives an out-of-date reason is
   * worse than a note giving none, because a reader believes it.
   */
  settled: "Agreed before this game was written. Nothing here can change them now.",
  handicapMeans:
    "The handicapped colour plays under those extra restrictions; the other colour plays the plain game.",
  headStartMeans:
    "The colour given a head start plays its free turns before the other side answers, with any traditional head start on the board from the first move.",
} as const;

/**
 * WHAT A READER WITH NO ACCOUNT IS TOLD, ON BOTH SCREENS THAT TELL THEM.
 *
 * Said once because it is said twice — under the setup screen's Start, and under
 * the doorstep's Begin — in the same words and the same small muted paragraph.
 * It was written out twice, which is two things to keep in step for a sentence
 * whose whole job is to be the same answer in both places: reading half a way in
 * that playing needs an account, pressing on, and being told it again in
 * different words is the site failing to hold one position.
 *
 * Its own export rather than a key on either screen's copy, because it belongs to
 * neither: `DOORSTEP_COPY.signIn` was where it lived, and the setup screen
 * reading the DOORSTEP's words for its own paragraph is the sort of borrowing
 * that makes the next rewording miss one of the two.
 */
export const SIGN_IN_TO_PLAY = "Sign in to start a game against somebody.";

/**
 * WHAT A READER WHO CAME IN BY INVITE CODE IS TOLD, where the choices they are
 * not offered would otherwise be missing without a word.
 *
 * They are signed in, so `SIGN_IN_TO_PLAY` would be false to say to them — they
 * can post a seat and sit down. What they cannot do is name somebody: a
 * challenge to a member or a program is refused to a caller with no address,
 * and a code redeemed without Google behind it makes no address. Said on the
 * lobby sentence and the setup screen, in these words in both.
 *
 * No link to a sign-in, and that is deliberate rather than a dead end left in:
 * /join sends anybody already in straight back where they were going, so a
 * link there from here would be a press that lands on this same page.
 */
export const ASK_NEEDS_ACCOUNT =
  "Naming a member or a computer player sends a challenge, which needs an account — an invite code on its own does not make one. A seat for anyone, and two at one screen, work as you are.";

/**
 * THE DOORSTEP, IN WORDS: the page between choosing a game and playing one.
 *
 * The setup screen asks; this one states. So every line here is a fact rather
 * than an instruction, and the two controls are named for the two things somebody
 * standing on a doorstep can do — go in, or go back and change something.
 *
 * Called Begin on purpose, and the press that led here is Continue: the words on
 * the two buttons say which one starts anything. Reusing the first press's words
 * on the page after it would make the second look like a repeat of the first —
 * which is how a confirmation screen becomes a step people click through without
 * reading.
 */
export const DOORSTEP_COPY = {
  title: "Before the first stone",
  kanji: "確認",
  /** Above the table of rows, saying why nothing on this page can be changed here. */
  note: "This is what will be played. Nothing has been written yet.",
  begin: "Begin 開始",
  beginning: "Beginning…",
  /** Taking a seat somebody has already posted, rather than making a second game. */
  sit: (who: string) => `Sit down with ${who} 着席`,
  change: "Change something 変更",
  /** Who a game against a computer player drawn at random is against, before the draw. */
  drawnFrom: (names: readonly string[]) =>
    `a computer player drawn at random from ${names.join(", ")} when you press Begin`,
  /** Once this doorstep has made its game, the same control opens its board. */
  board: "Open the board 対局へ",
  made: "You have already begun this game. The button below opens its board rather than making a second one.",
  another: "Begin another like this one",
  refused: "That game could not be started.",
  /*
   * WHERE THE GAME CAME FROM A REMATCH, what it is now — see `describeLineage`.
   * `them` is always the player from last time: the one a rematch repeats, and the
   * one a new game against somebody else is not a rematch of.
   */
  rematchOf: (them: string) => `A rematch of your last game against ${them}, with the colours swapped.`,
  rematchChanged: (them: string) =>
    `A new game against ${them}, not a rematch: the rules differ from your last game, so the colours are not swapped.`,
  notRematch: (them: string) =>
    `A new game, not a rematch of your last game against ${them}: you chose somebody else to play, so the colours are not swapped.`,
  /**
   * The seat went between this page being drawn and Begin being pressed.
   *
   * It says what the next press will do instead, because the screen before this
   * one used to do it silently — a press naming one person quietly posting a game
   * for anyone. The destination was right; doing it without saying so was not.
   */
  seatGone: "Somebody else took that seat first. Press Begin again to start a game of your own instead.",
  /** Why a posted seat is no longer there to be taken — one line per reason. */
  gone: {
    taken: "Somebody else took that seat first, so this would be a new game of your own instead.",
    finished: "That game has finished, so there is no seat at it to take.",
    missing:
      "That seat is no longer on the noticeboard, so this would be a new game of your own instead.",
    "other-game":
      "That seat is at a different game from this one, so it is not the seat this page is about.",
    /** A seat whose game is set up differently — another opening, rated where friendly was chosen. */
    "other-rules":
      "That seat's game is set up differently from the one chosen here, so this would be a new game of your own instead.",
  },
} as const;

/**
 * WHAT THE OFFER PANEL BESIDE THE BOARD SAYS, to each of the two people.
 *
 * TWO SENTENCES AND NOT ONE WITH A NAME SWAPPED IN, because the two readers
 * want different facts. The person who was ASKED is deciding, and the thing
 * they most need to know is what refusing costs them — nothing, and it is said
 * outright rather than left to be discovered. The person who ASKED has nothing
 * to do but wait, and the thing they most need to know is that no clock is
 * running against them while they do, since a game they cannot move in with a
 * deadline on screen would read as a fault.
 *
 * Both end by saying it can happen again: a decline is not the end of anything,
 * and "ask again whenever you like" is the difference between a refusal and a
 * rebuff. John: "no penalties for refusing."
 */
export const OFFER_PANEL_COPY = {
  toMe: {
    title: "This game is an offer",
    kanji: "申込",
    lead: (who: string) =>
      `${who} has asked you for this game. The board and the rules below are what you would be ` +
      `playing — no move can be made by either of you until you accept. Declining ends it with ` +
      `no result, no rating and nothing on either record, and ${who} can always ask again.`,
  },
  fromMe: {
    title: "Your offer",
    kanji: "申込済",
    lead: (who: string) =>
      `Waiting on ${who}. No clock is running and neither of you can move until they accept. ` +
      `Withdrawing costs nobody anything — you can offer it again.`,
  },
} as const;
