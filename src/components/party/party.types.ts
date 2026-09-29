import type { ComponentType } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";
import type { PartyRaceRules, PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

/** One player's marble: its colour, the letter it carries, and the ink the letter is written in. */
export type PartyMarble = { label: string; letter: string; fill: string; ink: string };

/** What a race table's board is handed: the game, and where the mover's picked-up piece may go. */
export type PartyBoardProps<S extends PartyRaceState> = {
  game: S;
  appearance: Appearance;
  /** The piece picked up, waiting to be put down. */
  selected: Point | null;
  /** Where it may go. */
  targets: readonly Point[];
  onHole: (point: Point) => void;
  /** A preview: the table set out, nothing to press. */
  readOnly?: boolean;
};

/** The words a race table says that are its game's own. */
export type PartyGameCopy = {
  /** On the game's own page, the way in: how many may play. */
  offer: string;
  /** Under the page's title. */
  lead: string;
  /** Where a player's pieces are racing to, as the winner's line says it. */
  farCamp: string;
  /** The way back to the game's own page. */
  about: string;
};

/**
 * ONE RACE GAME'S TABLE, as the shared race screens draw it (`PartyRaceGame`,
 * `PartySetUp`, `PartyOffer`, `PartyGameCard`): its rules, the board that draws
 * them, the game this browser keeps of it (its own store, on `keptInBrowser`),
 * and what it says. Chinese Checkers and Halma each have one (`partyRaces.ts`).
 */
export type PartyRaceKind<S extends PartyRaceState, C extends number> = {
  rules: PartyRaceRules<S, C>;
  Board: ComponentType<PartyBoardProps<S>>;
  /** The kept game and the way to keep another: the game's own store. */
  useKept: () => [S | null | undefined, (game: S | null) => void];
  /** The table's test id: `party-checkers` for the star, `party-halma` for the square. */
  testId: string;
  copy: PartyGameCopy;
};

export type PartySetUpProps<S extends PartyRaceState, C extends number> = {
  kind: PartyRaceKind<S, C>;
  appearance: Appearance;
  onStart: (game: S) => void;
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

/** One square or hole of a race table's board: a button, with the marble standing in it, if any. */
export type PartyHoleProps = {
  point: Point;
  owner: number | null;
  label: string;
  target: boolean;
  picked: boolean;
  last: boolean;
  enabled: boolean;
  /** On the star's sheared lattice the marble leans back so it is round again; on a square board it stands as it is. */
  unslant: boolean;
  onHole: (point: Point) => void;
};

/** What Dots and Boxes' board is handed: the game, and what to do with a line tapped. */
export type DotsBoardProps = {
  game: DotsGame;
  appearance: Appearance;
  /** A line tapped by the player to move. */
  onLine?: (line: number) => void;
  /** A preview: the table set out, nothing to tap. */
  readOnly?: boolean;
};

export type DotsSetUpProps = {
  appearance: Appearance;
  onStart: (game: DotsGame) => void;
  /** The hydration mark (`readyMark`), on the form a test fills in. */
  ready: { "data-ready": string };
};
