"use client";

import { useEffect, useRef } from "react";

import { Board } from "@/components/board/Board";
import type { BoardTheme, StoneSet } from "@/components/board/board.types";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { useGameSession } from "./useGameSession";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

export type EmbedOptions = {
  settings: Partial<GameSettings>;
  boardTheme: BoardTheme;
  stoneSet: StoneSet;
  showCoordinates: boolean;
};

/** Messages the host page receives. Namespaced so they cannot be mistaken. */
type EmbedMessage =
  | { kind: "ready"; height: number }
  | { kind: "resize"; height: number }
  | { kind: "move"; moveCount: number; toPlay: string }
  | { kind: "result"; result: string; moveCount: number };

/** The name the site goes by, and the one it went by before. */
const EMBED_NAME = "itsutsu";

/*
 * Every message goes out under BOTH names. The site was called Gomoku when
 * this interface was published, and a host page is somebody else's code on
 * somebody else's server: we cannot edit it, and we do not know who has one.
 * Renaming outright would break every embed silently — the iframe would go on
 * drawing a board while the page around it stopped resizing. So `itsutsu:*`
 * is what the README documents and what a new host should listen for, and
 * `gomoku:*` keeps going out beside it. Drop the old one only when something
 * actually tells us nobody is listening for it, which nothing does today.
 */
const EMBED_NAME_WAS = "gomoku";

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

  const post = ({ kind, ...body }: EmbedMessage) => {
    // The host origin is unknown by design; nothing sent here is sensitive.
    for (const name of [EMBED_NAME, EMBED_NAME_WAS]) {
      window.parent?.postMessage({ type: `${name}:${kind}`, ...body }, "*");
    }
  };

  useEffect(() => {
    const element = frame.current;
    if (element === null) return;

    post({ kind: "ready", height: element.offsetHeight });

    const observer = new ResizeObserver(([entry]) => {
      post({ kind: "resize", height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { state } = session;
  useEffect(() => {
    if (state.status === GAME_STATUS.playing) {
      if (state.moves.length > 0) {
        post({
          kind: "move",
          moveCount: state.moves.length,
          toPlay: state.toPlay,
        });
      }
      return;
    }
    post({
      kind: "result",
      result: state.winner ?? "draw",
      moveCount: state.moves.length,
    });
  }, [state]);

  return (
    <div ref={frame} className="flex flex-col gap-3 p-3" data-testid="embed-board" {...readyMark(useHydrated())}>
      <Board
        state={state}
        appearance={{
          boardTheme: options.boardTheme,
          stoneSet: options.stoneSet,
          showCoordinates: options.showCoordinates,
          showMoveNumbers: false,
          grid: "auto",
          // An embed on somebody else's page has no reader to have a preference.
          flipped: false,
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
          className="rounded-lg border border-rule px-2.5 py-1 text-sm hover:bg-shade"
        >
          New game
        </button>
      </div>
    </div>
  );
}
