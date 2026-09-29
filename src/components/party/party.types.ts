import type { Appearance } from "@/components/board/board.types";
import type { Point } from "@/lib/gomoku/gomoku.types";
import type { PartyCheckersState } from "@/lib/gomoku/party/partyCheckers.types";

/** One player's marble: its colour, the letter it carries, and the ink the letter is written in. */
export type PartyMarble = { label: string; letter: string; fill: string; ink: string };

export type PartyStarBoardProps = {
  game: PartyCheckersState;
  appearance: Appearance;
  /** The piece picked up, waiting to be put down. */
  selected: Point | null;
  /** Where it may go. */
  targets: readonly Point[];
  onHole: (point: Point) => void;
  /** A preview: the table set out, nothing to press. */
  readOnly?: boolean;
};

export type PartySetUpProps = {
  appearance: Appearance;
  onStart: (game: PartyCheckersState) => void;
  /** The hydration mark (`readyMark`), on the form a test fills in. */
  ready: { "data-ready": string };
};

export type PartyCheckersGameProps = {
  /** The reader's own board, as every board of theirs is drawn. */
  appearance: Appearance;
  /** The game's front door, for the way back. */
  gameHref: string;
};

export type MarbleChipProps = { player: number; size?: "line" | "hole" };
