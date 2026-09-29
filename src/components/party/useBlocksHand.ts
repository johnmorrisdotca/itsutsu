"use client";

import { useEffect, useMemo, useState } from "react";

import type { Point } from "@/lib/gomoku/gomoku.types";
import { BLOCKS_STATUS, blocksPiecesLeft, blocksPreviewAt, blocksStartSquares } from "@/lib/gomoku/party/partyBlocks";
import type { BlocksHold, BlocksPieceKey, BlocksPreview, PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";

/**
 * What the player to move is doing with their pieces this turn: which one
 * they hold (null: the first they have), how they have turned it, and the
 * square they last tapped or pointed at. Stored against the turn it belongs
 * to, so the next player picks the tray up fresh without an effect to reset it.
 */
type Held = { turn: string; piece: BlocksPieceKey | null; turns: number; flipped: boolean; at: Point | null };

const fresh = (turn: string): Held => ({ turn, piece: null, turns: 0, flipped: false, at: null });

/** The held piece a quarter turn further round, or mirrored — for this turn, fresh if what was held belongs to an earlier one. */
function turned(was: Held, turn: string, turns: number, flip: boolean): Held {
  const now = was.turn === turn ? was : fresh(turn);
  return { ...now, turns: (now.turns + turns) % 4, flipped: flip ? !now.flipped : now.flipped };
}

/**
 * THE PIECE IN THE MOVER'S HAND AT BLOCK FIVE, for any table that draws the
 * game — on one device (`PartyBlocksGame`) or several (`BlocksOnline`): the
 * piece held and how it is turned, where it would lie over the square aimed
 * at, the squares a new piece may grow from, R and F on the keyboard, and what
 * a tap on the board does. A second tap on a piece shown where the rules allow
 * it hands it to `lay`; every rule is asked of `partyBlocks.ts`.
 *
 * `active` is whether the reader may play the piece now: always on one device
 * while the game is on, only on the reader's own turn on several.
 */
export function useBlocksHand(game: PartyBlocksState | null, active: boolean, lay: (piece: BlocksPieceKey, cells: readonly Point[]) => void) {
  const [held, setHeld] = useState<Held>(() => fresh(""));
  const playing = game !== null && game.status === BLOCKS_STATUS.playing && active;
  const turn = game === null ? "" : `${game.moves.length}:${game.toPlay}`;
  const current = held.turn === turn ? held : fresh(turn);

  // R turns the piece in hand and F flips it, as on Block Five's own board. Typing in a field is left alone.
  useEffect(() => {
    if (!playing) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "r" || key === "arrowright") setHeld((was) => turned(was, turn, 1, false));
      else if (key === "f" || key === "arrowup") setHeld((was) => turned(was, turn, 0, true));
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, turn]);

  const starts = useMemo(() => (game === null || !playing ? [] : blocksStartSquares(game, game.toPlay)), [game, playing]);
  const left = game === null ? [] : blocksPiecesLeft(game, game.toPlay);
  const piece = current.piece !== null && left.includes(current.piece) ? current.piece : (left[0] ?? null);
  const hold: BlocksHold | null = piece === null ? null : { piece, turns: current.turns, flipped: current.flipped };
  const preview: BlocksPreview | null = game !== null && playing && hold !== null && current.at !== null ? blocksPreviewAt(game, hold, current.at) : null;

  return {
    playing,
    hold,
    preview,
    starts,
    onSquare: (point: Point) => {
      if (!playing) return;
      const onIt = preview !== null && preview.cells.some((cell) => cell.row === point.row && cell.col === point.col);
      if (hold !== null && preview !== null && preview.refusal === null && onIt) {
        lay(hold.piece, preview.cells);
        return;
      }
      setHeld({ ...current, at: point });
    },
    onAim: (point: Point | null) => setHeld({ ...current, at: point }),
    onHold: (chosen: BlocksPieceKey) => setHeld({ ...current, piece: chosen, turns: 0, flipped: false }),
    onRotate: () => setHeld(turned(current, turn, 1, false)),
    onFlip: () => setHeld(turned(current, turn, 0, true)),
  };
}
