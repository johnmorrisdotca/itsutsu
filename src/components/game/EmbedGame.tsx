"use client";

import { useEffect, useRef } from "react";

import { Board } from "@/components/board/Board";
import type { BoardTheme, StoneSet } from "@/components/board/board.types";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { useGameSession } from "./useGameSession";

export type EmbedOptions = {
  settings: Partial<GameSettings>;
  boardTheme: BoardTheme;
  stoneSet: StoneSet;
  showCoordinates: boolean;
};

/** Messages the host page receives. Namespaced so they cannot be mistaken. */
type EmbedMessage =
  | { type: "gomoku:ready"; height: number }
  | { type: "gomoku:resize"; height: number }
  | { type: "gomoku:move"; moveCount: number; toPlay: string }
  | { type: "gomoku:result"; result: string; moveCount: number };

/**
 * The board on its own, for embedding in another site through an iframe.
 *
 * It talks to its host only by `postMessage`, and only outward: the host is
 * told the height it needs and what happened in the game, and nothing the host
 * sends can change the rules. That one-way boundary is the whole reason an
 * iframe is the right tool here rather than a shared bundle.
 */
export function EmbedGame({ options }: { options: EmbedOptions }) {
  const { session, actions } = useGameSession(options.settings);
  const frame = useRef<HTMLDivElement>(null);

  const post = (message: EmbedMessage) => {
    // The host origin is unknown by design; nothing sent here is sensitive.
    window.parent?.postMessage(message, "*");
  };

  useEffect(() => {
    const element = frame.current;
    if (element === null) return;

    post({ type: "gomoku:ready", height: element.offsetHeight });

    const observer = new ResizeObserver(([entry]) => {
      post({ type: "gomoku:resize", height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { state } = session;
  useEffect(() => {
    if (state.status === GAME_STATUS.playing) {
      if (state.moves.length > 0) {
        post({
          type: "gomoku:move",
          moveCount: state.moves.length,
          toPlay: state.toPlay,
        });
      }
      return;
    }
    post({
      type: "gomoku:result",
      result: state.winner ?? "draw",
      moveCount: state.moves.length,
    });
  }, [state]);

  return (
    <div ref={frame} className="flex flex-col gap-3 p-3">
      <Board
        state={state}
        appearance={{
          boardTheme: options.boardTheme,
          stoneSet: options.stoneSet,
          showCoordinates: options.showCoordinates,
          showMoveNumbers: false,
        }}
        marks={session.marks}
        onPlay={actions.play}
        onTwist={actions.twist}
        selected={session.selected}
        footprintFor={session.hand.piece !== null ? session.hand.footprintFor : undefined}
        placing={session.placing}
      />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">
          {state.status === GAME_STATUS.playing
            ? `${STONE_DISPLAY[state.toPlay].label} to play`
            : state.status === GAME_STATUS.draw || state.winner === null
              ? "Draw"
              : `${STONE_DISPLAY[state.winner].label} wins`}
        </span>
        <button
          type="button"
          onClick={() => actions.reset()}
          className="rounded-lg border border-rule px-2.5 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          New game
        </button>
      </div>
    </div>
  );
}
