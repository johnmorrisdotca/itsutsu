"use client";

import { BoardFrame } from "@/components/board/BoardFrame";
import { BoardLines } from "@/components/board/BoardLines";
import { boardThemeFor, gridFor } from "@/components/board/appearance";
import { playingAreaInset } from "@/components/board/margin";
import { BOARD_GRIDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { pointName } from "@/lib/gomoku/notation";
import { HALMA_PARTY_SIZE, halmaCampSquares, isHalmaPartyCount } from "@/lib/gomoku/party/partyHalma";
import type { PartyHalmaState } from "@/lib/gomoku/party/partyHalma.types";
import { PARTY_STATUS, partyPlayerName } from "@/lib/gomoku/party/partyRace";

import { PartyHole } from "./PartyHole";
import { HOME_TINT_OPACITY, PARTY_MARBLES } from "./party.constants";
import type { PartyBoardProps } from "./party.types";

const SIZE = HALMA_PARTY_SIZE;
const SQUARES = Array.from({ length: SIZE * SIZE }, (_, index) => ({ row: Math.floor(index / SIZE), col: index % SIZE }));

/**
 * HALMA'S BOARD FOR A TABLE OF PLAYERS, drawn as the two-player board is.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim, the
 * coordinates and the shadow are `BoardFrame`, and the squares are
 * `BoardLines`' own — ruled in the squares, as Halma is, unless the reader
 * chose one look for every board — at the reader's own appearance. What is
 * new is only what four players need: each corner's camp washed in its
 * owner's colour, in place of the two-player board's dark and light corners,
 * and a lettered marble in each player's colour.
 *
 * Not `Board` itself, because `Board` draws an engine `GameState`, whose
 * colours are black and white all the way down, and a game for four is not
 * one of those.
 */
export function PartySquareBoard({ game, appearance, selected, targets, onHole, readOnly = false }: PartyBoardProps<PartyHalmaState>) {
  const spec = VARIANT_SPECS.halma;
  const theme = boardThemeFor(appearance, spec);
  const cells = gridFor(appearance, spec) === BOARD_GRIDS.cells;
  const inset = playingAreaInset(SIZE, cells);
  const count = game.players.length;
  const targetKeys = new Set(targets.map((point) => point.row * SIZE + point.col));
  const last = game.moves.at(-1)?.to ?? null;

  return (
    <BoardFrame size={SIZE} theme={theme} flipped={false} inset={inset} lattice={false} shape="rhombus" coordinates={appearance.showCoordinates}>
      <BoardLines size={SIZE} theme={theme} cells={cells} />
      {/* THE CAMPS IN THEIR PLAYERS' COLOURS, each corner a player starts in; a corner nobody starts in is left plain. */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {isHalmaPartyCount(count)
          ? game.players.map((player, index) => (
              <g key={player.corner} data-corner={player.corner} data-owner={index}>
                {halmaCampSquares(count, player.corner).map((point) => (
                  <rect
                    key={`${point.row}:${point.col}`}
                    x={point.col}
                    y={point.row}
                    width={1}
                    height={1}
                    fill={PARTY_MARBLES[index].fill}
                    opacity={HOME_TINT_OPACITY}
                  />
                ))}
              </g>
            ))
          : null}
      </svg>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
        {SQUARES.map((point, index) => {
          const owner = game.board[index];
          const target = targetKeys.has(index);
          return (
            <PartyHole
              key={index}
              point={point}
              owner={owner}
              label={squareLabel(game, point, owner)}
              target={target}
              picked={selected !== null && selected.row === point.row && selected.col === point.col}
              last={last !== null && last.row === point.row && last.col === point.col}
              enabled={!readOnly && game.status === PARTY_STATUS.playing && (target || owner === game.toPlay)}
              unslant={false}
              onHole={onHole}
            />
          );
        })}
      </div>
    </BoardFrame>
  );
}

/** A square's name as the two-player board says it — "C13, empty" — and whose piece stands on it. */
function squareLabel(game: PartyHalmaState, point: { row: number; col: number }, owner: number | null): string {
  const where = pointName(SIZE, point);
  return owner === null ? `${where}, empty` : `${where}, ${partyPlayerName(game.players, owner)}'s ${PARTY_MARBLES[owner].label.toLowerCase()} piece`;
}
