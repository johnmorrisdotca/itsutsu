import type { ComponentProps } from "react";
import type { KeyedMutator } from "swr";

import type { Appearance } from "@/components/board/board.types";
import type { ResignButton } from "@/components/mine/ResignButton";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";

import type { ReactionBar } from "./Reactions";

/**
 * The shapes a shared board and the parts around it are handed.
 *
 * Kept apart from `SharedGame.tsx` for AGENTS.md's types-and-constants rule, and
 * because the board reached the file-size gate: its props, the notes and
 * controls beside it (`SharedGameControls.tsx`) and the footer under it
 * (`SharedGameFooter.tsx`) are three jobs, and the contract between them is a
 * fourth thing that none of them owns.
 */

/** A game played from two devices — see `SharedGame`. */
export type SharedGameProps = {
  initial: GameDetail;
  token: string | null;
  seat: Stone | null;
  /**
   * This game is an offer nobody has answered yet, and which side of it the
   * reader is on. Null for an ordinary game.
   *
   * Handed down from the page rather than worked out here, because deciding it
   * needs the reader's member id and a client component has no business
   * knowing one. What it changes here is small and important: the banner says
   * what the board is, and the board cannot be played.
   */
  offer?: { side: "to-me" | "from-me"; who: string } | null;
  /**
   * How this reader likes a board dressed, from their account. The shared
   * board used to draw the default and nothing else, so a member's own board
   * followed them into a local game and stopped at the door of a real one.
   */
  appearance?: Appearance;
  /** The match's address; the bar shows it with the move count appended, kept current as play goes on. */
  basePath?: string;
  /** Who sits across the board, and where they are, when the seat is an account with a country set. */
  opponent?: {
    name: string;
    country: string;
    awayUntil?: string | null;
  } | null;
  /**
   * Colours whose player this reader has ignored — for a watcher as much as
   * for a player, since the ignore list is about who may reach you and not
   * about which chair you are in.
   */
  ignoring?: readonly Stone[];
};

/** The captures so far and the forbidden points, for the position on the board. */
export type RuleNotesProps = { state: GameState };

/** This reader's own way up for this one board. */
export type TurnBoardProps = { gameId: string; turned: boolean };

/** Which colour the next stone is laid as, in a game where either colour may be placed. */
export type ColourChooserProps = { placing: Stone; onChoose: (stone: Stone) => void };

/** Passing, in the games where a pass is a move. */
export type GoPassProps = { disabled: boolean; onPass: () => void };

/** Everything under the board: giving up, waving, muting, and who is across it. */
export type SharedGameFooterProps = {
  detail: GameDetail;
  state: GameState;
  seat: Stone | null;
  token: string | null;
  offer: NonNullable<SharedGameProps["offer"]> | null;
  ignoring: readonly Stone[];
  /** Whether this opponent's messages are muted in this game, in this browser. */
  quiet: boolean;
  /** The game the mute is remembered against. */
  gameId: string;
  opponent: NonNullable<SharedGameProps["opponent"]> | null;
  onReact: ComponentProps<typeof ReactionBar>["onSend"];
  onAsking: NonNullable<ComponentProps<typeof ResignButton>["onAsking"]>;
  mutate: KeyedMutator<GameDetail>;
};
