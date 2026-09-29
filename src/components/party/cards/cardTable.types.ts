import type { ComponentType } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import type { CardGameRules, CardId } from "@/lib/cardGames/cardGames.types";

/** A press the player to move may make: its words, the move it makes (null while it cannot be made), and why not. */
export type CardAction<M> = {
  label: string;
  move: M | null;
  testId: string;
  /** The press the moment is for, drawn strong; the others quiet. */
  strong?: boolean;
  /** Said under the presses while `move` is null: what is missing. */
  why?: string;
};

/** What the table in the middle is handed: the game, whose eyes it is drawn for, and the names round the table. */
export type CardCentreProps<S> = { game: S; viewer: number | null; players: readonly string[] };

/**
 * ONE FAMILY CARD GAME AT THE TABLE: everything `CardPlay` needs to know of a
 * game that is not in its rules — which cards are whose, what a press means
 * with the cards chosen, and what is drawn in the middle. The rules still
 * decide every move (`rules.play`); this only turns a person's choice into one.
 */
export type CardAdapter<S, M> = {
  kind: CardGameKind;
  rules: CardGameRules<S, M>;
  /** A seat's hand, as the rules hold it (already sorted as a player holds one). */
  hand: (game: S, seat: number) => readonly CardId[];
  /** How many cards a seat may choose at once for a move now: one, or as many as a play or a pass takes. */
  chooses: (game: S) => number;
  /** The presses open to the player to move, with these cards chosen and this seat pointed at. */
  actions: (game: S, chosen: readonly CardId[], target: number | null, name: (seat: number) => string) => CardAction<M>[];
  /** What a double tap on a card, or a card let go on the table, plays: the one obvious move with it, or null. */
  quick: (game: S, card: CardId, chosen: readonly CardId[], target: number | null) => M | null;
  /** The seats a move may be aimed at (Go Fish's asks); none for a game without. */
  targets?: (game: S) => readonly number[];
  /** Cards to mark in a hand as just arrived (Hearts' passed cards). */
  arrived?: (game: S, seat: number) => readonly CardId[];
  /** What is happening now, in a line: whose turn, and what they are to do. */
  status: (game: S, name: (seat: number) => string) => string;
  /** Each seat's standing: its score, and a word beside it (a title, books). */
  standing: (game: S, seat: number) => { score: string; note?: string };
  /** What the scores count, for the heading over them: "Points (fewest wins)". */
  scoreWords: string;
  Centre: ComponentType<CardCentreProps<S>>;
};

/** The set-up: how many, how long, and who sits where — a person, named if they like, or a computer. */
export type CardSetUpProps = {
  kind: CardGameKind;
  appearance: Appearance;
  onStart: (seed: number, size: number, players: readonly string[], computers: readonly boolean[]) => void;
  ready: { "data-ready": string };
};
