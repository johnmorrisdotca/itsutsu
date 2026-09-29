import type { ComponentType } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";
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

/** What every pass-and-play table is handed by its page. */
export type PartyTableGameProps = {
  /** The reader's own board, as every board of theirs is drawn. */
  appearance: Appearance;
  /** The game's front door, for the way back. */
  gameHref: string;
};

export type PartyCheckersGameProps = PartyTableGameProps;

/**
 * One game's table at `/games/<slug>/pass-and-play`: what its page is called,
 * what it says first, and what plays it.
 */
export type PartyTable = {
  title: string;
  kanji: string;
  lead: string;
  Game: ComponentType<PartyTableGameProps>;
  /** The way in, on the game's own page: offers the kept game back first, while one is going. */
  Offer: ComponentType<{ href: string }>;
};

export type PairGoSetUpProps = {
  appearance: Appearance;
  onStart: (game: PairGoGame) => void;
  /** The hydration mark (`readyMark`), on the form a test fills in. */
  ready: { "data-ready": string };
};

/** A stone the size of a line of text, in the reader's own stones. */
export type PairStoneProps = { stone: Stone; appearance: Appearance };

export type MarbleChipProps = { player: number; size?: "line" | "hole" };
