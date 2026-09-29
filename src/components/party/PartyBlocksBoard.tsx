"use client";

import { usePartyMarbles } from "./partyMarbles";
import { BoardFrame } from "@/components/board/BoardFrame";
import type { PartyMarble } from "./party.types";
import { BoardLines } from "@/components/board/BoardLines";
import { boardThemeFor, gridFor } from "@/components/board/appearance";
import { playingAreaInset } from "@/components/board/margin";
import { BOARD_GRIDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { pointName } from "@/lib/gomoku/notation";
import { BLOCKS_PARTY_SIZE } from "@/lib/gomoku/party/partyBlocks.constants";
import { BLOCKS_STATUS, cornerSquare } from "@/lib/gomoku/party/partyBlocks";
import type { PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";
import { partyPlayerName } from "@/lib/gomoku/party/partyRace";

import { PartyHole } from "./PartyHole";
import { HOME_TINT_OPACITY } from "./party.constants";
import type { PartyBlocksBoardProps } from "./party.types";

const SIZE = BLOCKS_PARTY_SIZE;
const SQUARES = Array.from({ length: SIZE * SIZE }, (_, index) => ({ row: Math.floor(index / SIZE), col: index % SIZE }));
const keyOf = (point: { row: number; col: number }) => point.row * SIZE + point.col;

/**
 * BLOCK FIVE'S BOARD FOR FOUR, drawn as Block Five's own board is.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim, the
 * coordinates and the shadow are `BoardFrame`, and the lines are `BoardLines`'
 * own, on the crossings where Block Five lays its stones — unless the reader
 * chose one look for every board — at the reader's own appearance. Each
 * player's piece is the lettered marble every table draws (`PartyHole`), so
 * the colours never have to be told apart by colour alone. What is new is
 * only what four players need: each starting corner washed in its player's
 * colour, the held piece shown where it would lie before it is laid, and the
 * squares a new piece may start from dotted for the player to move.
 *
 * Not `Board` itself, because `Board` draws an engine `GameState`, whose
 * colours are black and white all the way down.
 */
export function PartyBlocksBoard({ game, appearance, preview, starts, onSquare, onAim, readOnly = false }: PartyBlocksBoardProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const spec = VARIANT_SPECS.blockFive;
  const theme = boardThemeFor(appearance, spec);
  const cells = gridFor(appearance, spec) === BOARD_GRIDS.cells;
  const inset = playingAreaInset(SIZE, cells);
  const playing = !readOnly && game.status === BLOCKS_STATUS.playing;
  const ghosts = new Map((playing && preview !== null ? preview.cells : []).map((point) => [keyOf(point), preview?.refusal === null]));
  const startKeys = new Set(playing ? starts.map(keyOf) : []);
  const lastLaid = new Set((game.moves.at(-1)?.cells ?? []).map(keyOf));

  return (
    // A mouse leaving takes the held piece off the board; a finger lifting is not leaving, or a tap would never stay.
    <div onPointerLeave={onAim === undefined ? undefined : (event) => event.pointerType === "mouse" && onAim(null)}>
      <BoardFrame size={SIZE} theme={theme} flipped={false} inset={inset} lattice={false} shape="rhombus" coordinates={appearance.showCoordinates}>
        <BoardLines size={SIZE} theme={theme} cells={cells} />
        {/* THE FOUR CORNERS IN THEIR PLAYERS' COLOURS: the square each first piece must cover. */}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {game.players.map((player, index) => {
            const corner = cornerSquare(player.corner);
            return (
              <rect
                key={player.corner}
                data-corner={player.corner}
                x={corner.col}
                y={corner.row}
                width={1}
                height={1}
                fill={marbles[index].fill}
                opacity={HOME_TINT_OPACITY}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {SQUARES.map((point, index) => {
            const owner = game.board[index];
            const ghost = ghosts.get(index);
            return (
              <PartyHole
                key={index}
                point={point}
                owner={owner}
                label={squareLabel(game, point, owner, marbles)}
                target={startKeys.has(index) && ghost === undefined}
                picked={false}
                last={lastLaid.has(index)}
                enabled={playing && owner === null}
                unslant={false}
                onHole={onSquare}
                ghost={ghost === undefined ? null : { player: game.toPlay, allowed: ghost }}
                onAim={onAim}
              />
            );
          })}
        </div>
      </BoardFrame>
    </div>
  );
}

/** A square's name as the two-player board says it — "C13, empty" — and whose piece covers it. */
function squareLabel(game: PartyBlocksState, point: { row: number; col: number }, owner: number | null, marbles: readonly PartyMarble[]): string {
  const where = pointName(SIZE, point);
  return owner === null ? `${where}, empty` : `${where}, ${partyPlayerName(game.players, owner)}'s ${marbles[owner].label.toLowerCase()} piece`;
}
