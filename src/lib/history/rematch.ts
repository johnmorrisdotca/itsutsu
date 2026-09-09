import { parseHandicap } from "./gameSettingsSchema";

/**
 * Playing the same game again.
 *
 * A rematch is the same game, not a new game against the same person. It was
 * being offered as neither: the only control on a finished game was a fork
 * labelled "Play from move 0", which is what you do to a game still being
 * played, and the one real Rematch button was addressed to an email — so it
 * could not be offered against a computer player, which never has one, and
 * that is the case it is most wanted for.
 *
 * The two turned out to be the same mechanism underneath, so this is what
 * both use: what a new game inherits from an old one, and who sits where.
 */

/** As much of a finished game as another game can be started from. */
export type PlayedGame = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  /** Stored as JSON on the row, and read back through the schema that owns it. */
  handicap: unknown;
  seed: number;
  opener: string;
  winLength: number;
  blackName: string;
  whiteName: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  moveTimeMs: number | null;
  clockMode: string;
  timeoutPenalty: string;
  allowResign: boolean;
  drawLimit: string;
  rated: boolean;
};

/**
 * What the new game takes from the old one.
 *
 * The board and the rules were already carried; the CLOCK was not, so a
 * rematch of a three-day-a-move game came back with whatever the defaults
 * happened to be. Somebody asking to play that again means that game — the
 * pace is as much a part of it as the board size, and more likely to be
 * noticed when it is wrong.
 *
 * The seed comes too, so a variant that scatters obstacles scatters them the
 * same way. A rematch on a different board would not be a rematch.
 */
export function settingsToCarry(origin: PlayedGame) {
  return {
    size: origin.size,
    variant: origin.variant,
    obstacles: origin.obstacles,
    opening: origin.opening,
    handicap: parseHandicap(origin.handicap),
    seed: origin.seed,
    opener: origin.opener,
    winLength: origin.winLength,
    moveTimeMs: origin.moveTimeMs,
    clockMode: origin.clockMode,
    timeoutPenalty: origin.timeoutPenalty,
    allowResign: origin.allowResign,
    drawLimit: origin.drawLimit,
    rated: origin.rated,
  };
}

/** The colour somebody held in a game, or null if they were not in it. */
export function seatOf(origin: PlayedGame, memberId: string | null): "black" | "white" | null {
  if (memberId === null) return null;
  if (origin.blackMemberId === memberId) return "black";
  if (origin.whiteMemberId === memberId) return "white";
  return null;
}

/** Whoever was in the game and is not this person, by id rather than by address. */
export function opponentOf(origin: PlayedGame, memberId: string | null): string | null {
  const seat = seatOf(origin, memberId);
  if (seat === null) return null;
  return seat === "black" ? origin.whiteMemberId : origin.blackMemberId;
}

export type Seating = {
  blackMemberId: string;
  whiteMemberId: string;
  blackName: string;
  whiteName: string;
};

/**
 * Who takes which chair in the game that follows.
 *
 * COLOURS SWAP, which is what the elder sites did and the reason is the game
 * rather than fairness in the abstract: black moves first, and in a
 * five-in-a-row that is an advantage large enough to be worth measuring — the
 * plain game is a first-player win. Two people playing a series where one of
 * them is always black are not really playing a series.
 *
 * So whoever asks for the rematch takes the colour they did NOT have. That is
 * a rule that can be stated on the button, which matters: a colour that
 * changes without being mentioned is the kind of surprise somebody finds out
 * about three moves in.
 *
 * A fork is not a rematch and does not swap. It continues a position, and a
 * position belongs to the colours that were in it.
 */
export function seatsForRematch(
  origin: PlayedGame,
  mine: { id: string; name: string },
  theirs: { id: string; name: string },
): Seating | null {
  const seat = seatOf(origin, mine.id);
  if (seat === null) return null;
  // They had black, so now I do; I had black, so now they do.
  return seat === "black"
    ? { blackMemberId: theirs.id, whiteMemberId: mine.id, blackName: theirs.name, whiteName: mine.name }
    : { blackMemberId: mine.id, whiteMemberId: theirs.id, blackName: mine.name, whiteName: theirs.name };
}

/** The colour the person asking will play, for saying so before they ask. */
export function colourAfterSwap(origin: PlayedGame, memberId: string | null): "black" | "white" | null {
  const seat = seatOf(origin, memberId);
  if (seat === null) return null;
  return seat === "black" ? "white" : "black";
}
