import type { Appearance } from "@/components/board/board.types";
import type { Domino, TrainGame } from "@/lib/party/mexicanTrain/mexicanTrain.types";
import type { OnlineOffer } from "@/lib/party/online/online.types";

/** One domino as drawn: where, how big, which way it lies and what its two ends say. */
export type DominoFaceProps = {
  x: number;
  y: number;
  /** The tile's short side, in its parent's units. */
  size: number;
  /** Its two numbers, left to right lying across, top to bottom standing down. */
  ends: readonly [number, number];
  lie: "across" | "down";
  /** The back of a tile, for the boneyard. */
  faceDown?: boolean;
  /** An outline in this colour: a tile chosen, or a double waiting to be covered. */
  ring?: string | null;
  testId?: string;
  dataTile?: number;
};

/** What the table is handed: the game, the reader's wood, and — on a turn — the tile chosen and what to do when a train is chosen. */
export type TrainTableProps = {
  game: TrainGame;
  appearance: Appearance;
  /** The tile being laid (chosen or dragged): the trains it may go on are lit. */
  holding?: Domino | null;
  /** A train tapped with a tile chosen. */
  onTrain?: (train: number) => void;
  /** A preview: the table set out, nothing to tap. */
  readOnly?: boolean;
};

/** The hand of the player to move, face up: what they may lay, and the presses that lay it. */
export type TrainHandProps = {
  game: TrainGame;
  /** Whose hand it is: the player to move, or the one person at a table of computers. */
  seat: number;
  /** Whether it is this hand's turn, so its tiles may be laid. */
  active: boolean;
  chosen: Domino | null;
  onChoose: (tile: Domino | null) => void;
  /** Lay a tile on a train. */
  onLay: (tile: Domino, train: number) => void;
  /** A tile being dragged, or none: the table lights where it may go while it moves. */
  onDragging: (tile: Domino | null) => void;
};

export type TrainSetUpProps = {
  appearance: Appearance;
  onStart: (game: TrainGame) => void;
  /** The hydration mark (`readyMark`), on the form a test fills in. */
  ready: { "data-ready": string };
  /** Playing on several devices (`OnlineOffer`). */
  online?: OnlineOffer;
};
