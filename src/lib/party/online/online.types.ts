import type { PieceColour } from "@/lib/pieces/pieceColours";
/**
 * The vocabulary of a party table played on several devices — see
 * docs/plans/party-online/README.md for the design, and `onlineGames.ts` for
 * the games that can be played this way.
 */

/**
 * THE GAMES THAT CAN BE PLAYED ON SEVERAL DEVICES, by their catalogue key
 * (`GameKey`): Dots and Boxes, the three tables of the rule variants that the
 * race and the tray share, Go as Pair Go, Kumimoji's pass and play,
 * Superghost and Mancala. A game joins by a row in `ONLINE_GAMES` and a
 * board in the client's `ONLINE_VIEWS`, both `Record`s over this, so a key
 * added here without either does not compile.
 */
export type OnlineGameKey = "dotsAndBoxes" | "chineseCheckers" | "halma" | "blockFive" | "go" | "kumimoji" | "superghost" | "mancala";

/** Who sits in a seat: a member, nobody yet (its link is out), or a computer. */
export type OnlineSeatKind = "member" | "open" | "computer";

/** How a table stands: being played, finished by its rules, or ended by a member with nobody winning. */
export type OnlineStatus = "playing" | "finished" | "ended";

/**
 * ONE GAME'S RULES, AS A TABLE ON SEVERAL DEVICES ASKS THEM: the same pure
 * rules the table on one device plays, wrapped so the server can start a game,
 * read a move a browser sent, check it and keep the answer, with nothing but
 * this. `S` is a game in progress and `M` one move.
 *
 * Every function is pure and leaves what it is given alone, as the rules it
 * wraps do. The server never trusts a browser with an outcome: it decodes the
 * stored game, reads the move with `readMove`, and asks `play`.
 */
export type OnlineRules<S, M> = {
  /** The board sizes the set-up offers, in the game's own measure; empty where the game has one board (size 0). */
  sizes: readonly number[];
  /** How many players a table may seat. */
  counts: readonly number[];
  /**
   * A new game at this size for this many, or null for a table the game is
   * not offered for. `extra` is what some games need beyond a size and a
   * count: `setup`, sent by the set-up and checked here (Kumimoji's settings
   * and the bag its browser dealt), and which seats are computers.
   */
  start: (size: number, count: number, extra?: { setup?: unknown; computers?: readonly number[] }) => S | null;
  /** The game as the text it is kept as — the very text a browser keeps it as on one device. */
  encode: (game: S) => string;
  /** The kept text read back, or null for anything these rules cannot play out again. */
  decode: (text: string) => S | null;
  /** The seat to play, or null once the game is over. */
  toPlay: (game: S) => number | null;
  /** On a game that is over, every seat that won: none for a game nobody could win, more than one when it is shared. */
  winners: (game: S) => readonly number[];
  /** How many moves have been made. */
  moveCount: (game: S) => number;
  /** The longest a move may be as JSON, where a game's are longer than `ONLINE_MOVE_LONGEST` (a Kumimoji turn carries its table). */
  moveLongest?: number;
  /** A move as a browser sent it, checked for its shape only, or null. Whether it may be made is `play`'s. */
  readMove: (sent: unknown) => M | null;
  /** The game after the seat to play makes this move, or null when the rules refuse it. */
  play: (game: S, move: M) => S | null;
  /**
   * The game with the seats' names written in, for a page to draw. The stored
   * game carries no names — they are the seats' — so a seat taken by a link
   * needs no rewrite of the game.
   */
  named: (game: S, names: readonly string[]) => S;
  /**
   * The game's computer players, where it has any; absent, the game offers no
   * computer seat. Their moves are worked out in a browser at the table
   * (`computerDriver`, in a worker), never on the server.
   */
  computers?: OnlineComputers<S, M>;
};

/**
 * A GAME'S COMPUTER PLAYERS, as a table seats them: which there are, who each
 * sits as, and the move one makes. A level is the game's own word for which
 * player — for a game the site's ladder plays, a `BotTier`, and the seat is
 * then that program's own member row, so its name leads to its page.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- typed by its row's game and move, as `OnlineComputerPlay` beside it is.
export type OnlineComputers<S, M> = {
  /** Every computer player a seat may be given, weakest first. */
  levels: readonly string[];
  /** Who a computer at this level sits as: the member it plays as, where it is one, and the name the table shows. */
  seat: (level: string) => { memberId: string | null; name: string };
  /** The level a computer's seat holds, read back from who sits there; null for a seat that is no computer of this game's. */
  levelOf: (seat: { memberId: string | null; name: string }) => string | null;
};

/**
 * HOW A GAME'S COMPUTER MOVES, for the worker alone (`onlineComputerMoves.ts`):
 * never imported by a route, so a computer's search and its word lists are
 * never in a server function's bundle, let alone run there.
 */
export type OnlineComputerPlay<S, M> = {
  /** What must be ready before a computer can move — a word list, loaded — run in the worker first. */
  prepare?: (game: S) => Promise<void>;
  /** The computer's move for this seat at this level, or null when it has none to make. */
  move: (game: S, seat: number, level: string) => M | null;
};

/** One seat as a page is shown it. */
export type OnlineSeatView = {
  seat: number;
  kind: OnlineSeatKind;
  /** The member in it, for their name to lead to their page; null for an open or a computer seat. */
  memberId: string | null;
  name: string;
  /** Whether this is the reader's own seat. */
  yours: boolean;
  /** An open seat's link, as a path, for the members at the table to hand out; null otherwise. */
  link: string | null;
  /** The colour this place chose for its marbles, or null for its table colour (`tableColours.ts`). */
  colour: PieceColour | null;
};

/**
 * A TABLE, AS THE PAGE AND THE POLL HAND IT TO A BROWSER: the game as its
 * rules keep it, the seats, and what this reader may do. Only ever made for a
 * member seated at the table.
 */
export type OnlineTableView = {
  id: string;
  game: OnlineGameKey;
  size: number;
  /** The game as it stands, in its own encoding: the browser decodes it with the same rules. */
  state: string;
  version: number;
  status: OnlineStatus;
  toPlay: number | null;
  winners: readonly number[];
  moveCount: number;
  seats: readonly OnlineSeatView[];
  /** The reader's seat. */
  mySeat: number;
  /** Whether the member whose turn it is has been on the site in the last two minutes (never a computer, an open seat or a child). */
  toPlayHere: boolean;
  /** Whether the reader may end the table now, for everybody (`mayEnd`). */
  canEnd: boolean;
  /** The member whose browser sent the last move, for `computerDriver`; null before any. */
  lastMoverId: string | null;
  /** When the last move was made, or the table was started. */
  movedAt: string;
  /** On an ended table, who ended it. */
  endedBy: string | null;
};

/** A seat as the set-up asks for it: the maker's own, a buddy by member id, a link, or a computer. */
export type OnlineSeatAsk = { kind: "me" } | { kind: "buddy"; memberId: string } | { kind: "link" } | { kind: "computer"; level: string };

/** A buddy the set-up can seat by name. */
export type OnlineBuddy = { id: string; name: string };

/**
 * WHAT A GAME'S SET-UP IS OFFERED FOR SEVERAL DEVICES, from the page: which
 * game, the reader's buddies to seat by name, whether they may hand out a link
 * (not a member under 13), and the game's computer players. Absent
 * where the game cannot be played on several devices, or for a reader with no
 * account.
 */
export type OnlineOffer = {
  game: OnlineGameKey;
  buddies: readonly OnlineBuddy[];
  links: boolean;
  /** The game's computer players a seat may be given, by level and the name each plays under; empty where it has none. */
  computers: readonly { level: string; name: string }[];
};
