"use client";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Piece, PieceCell } from "@/lib/gomoku/gomoku.types";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { PieceHand } from "./usePieceHand";

/** A piece drawn small, as a grid of its bounding box. */
function PieceGlyph({ cells, scale = 1 }: { cells: readonly PieceCell[]; scale?: number }) {
  const rows = Math.max(...cells.map((cell) => cell.row)) + 1;
  const cols = Math.max(...cells.map((cell) => cell.col)) + 1;
  const size = `${1.1 * scale}rem`;
  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${size})`,
        gridTemplateRows: `repeat(${rows}, ${size})`,
      }}
      aria-label={cells.map((cell) => STONE_DISPLAY[cell.stone].label).join(", ")}
      role="img"
    >
      {Array.from({ length: rows * cols }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const cell = cells.find((candidate) => candidate.row === row && candidate.col === col);
        return (
          <span
            key={index}
            className={`rounded-full ${
              cell === undefined
                ? ""
                : cell.stone === "black"
                  ? "bg-ink shadow-sm"
                  : "border border-rule-strong bg-ivory shadow-sm"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * The piece in hand, the ways to turn it, the single-stone option where the
 * game has one, the pass when nothing fits, and the pieces coming next —
 * which both players see, because both draw from the same queue.
 */
export function PieceTray({
  hand,
  disabled,
  onRotate,
  onFlip,
  onToggleSingle,
  onPass,
}: {
  hand: PieceHand;
  /** True while it is not this player's turn on this device. */
  disabled: boolean;
  onRotate: () => void;
  onFlip: () => void;
  onToggleSingle: () => void;
  onPass: () => void;
}) {
  if (hand.piece === null) return null;

  return (
    <section className="flex flex-col gap-3" data-testid="piece-tray">
      <SectionTitle kanji={GAME_COPY.piece.kanji}>{GAME_COPY.piece.label}</SectionTitle>

      <div className="flex items-center gap-4">
        <div className={hand.layingSingle ? "opacity-40" : ""} data-testid="piece-in-hand">
          <PieceGlyph cells={hand.cells} scale={1.4} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRotate} disabled={disabled || hand.layingSingle} data-testid="rotate-piece">
            {GAME_COPY.rotatePiece.label}
          </Button>
          <Button onClick={onFlip} disabled={disabled || hand.layingSingle} data-testid="flip-piece">
            {GAME_COPY.flipPiece.label}
          </Button>
          <span className="w-full text-[0.7rem] text-muted">Keys: R turns, F flips, S lays a single stone.</span>
        </div>
      </div>

      {hand.singlesLeft > 0 || hand.layingSingle ? (
        <Button
          onClick={onToggleSingle}
          disabled={disabled}
          strong={hand.layingSingle}
          title={GAME_COPY.singlesLeft(hand.singlesLeft)}
          data-testid="toggle-single"
        >
          {hand.layingSingle ? GAME_COPY.usePiece.label : GAME_COPY.useSingle.label}
          <span className="font-mono text-xs opacity-70">{hand.singlesLeft}</span>
        </Button>
      ) : null}

      {hand.mustPass ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ochre">{GAME_COPY.mustPass}</p>
          <Button onClick={onPass} disabled={disabled} strong data-testid="pass-turn">
            {GAME_COPY.passTurn.label}
          </Button>
        </div>
      ) : null}

      {hand.next.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
            {GAME_COPY.nextPieces.label} <span className="font-mincho normal-case tracking-normal">{GAME_COPY.nextPieces.kanji}</span>
          </p>
          <div className="flex flex-wrap items-start gap-3" data-testid="next-pieces">
            {hand.next.map((piece: Piece, index) => (
              <PieceGlyph key={index} cells={piece.cells} scale={0.8} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
