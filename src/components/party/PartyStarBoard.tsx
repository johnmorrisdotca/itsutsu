"use client";

import { BoardFrame } from "@/components/board/BoardFrame";
import { BoardLines, hexagonPoints } from "@/components/board/BoardLines";
import { HEX_LATTICE, LINE_WIDTH, latticeFitFor } from "@/components/board/Board.constants";
import { LatticeGround } from "@/components/board/LatticeGround";
import { boardThemeFor, gridFor } from "@/components/board/appearance";
import { playingAreaInset } from "@/components/board/margin";
import { BOARD_GRIDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { Cell, Point } from "@/lib/gomoku/gomoku.types";
import { PARTY_RADIUS, PARTY_SIZE, PARTY_STATUS, partyPlayerName } from "@/lib/gomoku/party/partyCheckers";
import { STAR_TIPS, inStar, starTipCells } from "@/lib/gomoku/rules/chineseCheckers";

import { MarbleChip } from "./MarbleChip";
import { HOME_TINT_OPACITY, PARTY_MARBLES } from "./party.constants";
import type { PartyStarBoardProps } from "./party.types";

/** The star, cut from its square the way the two-player board is. */
const SHAPE = "star" as const;
const FIT = latticeFitFor(SHAPE, PARTY_SIZE);
/** What `BoardLines` is handed to draw the holes: the star's own, with nothing on them. */
const EMPTY_STAR: readonly Cell[] = new Array<Cell>(PARTY_SIZE * PARTY_SIZE).fill(null);
const HOLES = Array.from({ length: PARTY_SIZE * PARTY_SIZE }, (_, index) => ({
  row: Math.floor(index / PARTY_SIZE),
  col: index % PARTY_SIZE,
}));

/**
 * THE STAR FOR A TABLE OF PLAYERS, drawn as the two-player board is.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim and the
 * shadow are `BoardFrame`, the faint lattice across the wood is
 * `LatticeGround`, and the 121 holes are `BoardLines`' own star — the same
 * components, on the same fit, that `Board` draws Chinese Checkers with. What
 * is new is only what more players need: each home point tinted in its
 * owner's colour, in place of the two-player board's black and white, and a
 * marble in six colours, each carrying its letter.
 *
 * Not `Board` itself, because `Board` draws an engine `GameState`, whose
 * colours are black and white all the way down, and a game for six is not
 * one of those.
 */
export function PartyStarBoard({ game, appearance, selected, targets, onHole, readOnly = false }: PartyStarBoardProps) {
  const spec = VARIANT_SPECS.chineseCheckers;
  const theme = boardThemeFor(appearance, spec);
  const inset = playingAreaInset(PARTY_SIZE, gridFor(appearance, spec) === BOARD_GRIDS.cells);
  const targetKeys = new Set(targets.map((point) => point.row * PARTY_SIZE + point.col));
  const last = game.moves.at(-1)?.to ?? null;
  const seatOf = new Map(game.players.map((player, index) => [player.tip, index]));

  return (
    <BoardFrame size={PARTY_SIZE} theme={theme} flipped={false} inset={inset} lattice shape={SHAPE} coordinates={false}>
      <LatticeGround size={PARTY_SIZE} theme={theme} fit={FIT} />
      <BoardLines size={PARTY_SIZE} theme={theme} lattice={{ shape: SHAPE, board: EMPTY_STAR, transform: FIT.transform }} />
      {/*
        THE SIX POINTS IN THEIR PLAYERS' COLOURS. Each point's holes are drawn
        again over `BoardLines`' own, in the same tile and line, so the two-player
        board's black-and-white tint at the top and bottom is covered; a point
        somebody starts in is then washed in their colour, and an empty one is
        left plain.
      */}
      <svg
        viewBox={`0 0 ${PARTY_SIZE} ${PARTY_SIZE}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        overflow="visible"
        style={{ transform: FIT.transform, transformOrigin: "top left" }}
      >
        {STAR_TIPS.map((tip) => {
          const owner = seatOf.get(tip);
          return (
            <g key={tip} data-tip={tip} data-owner={owner ?? "none"}>
              {starTipCells(PARTY_RADIUS, tip).map((point) => {
                const points = hexagonPoints(point.col + 0.5, point.row + 0.5);
                return (
                  <g key={`${point.row}:${point.col}`}>
                    <polygon points={points} fill={theme.playSquare} stroke={theme.line} strokeWidth={LINE_WIDTH} strokeLinejoin="round" />
                    {owner === undefined ? null : (
                      <polygon points={points} fill={PARTY_MARBLES[owner].fill} opacity={HOME_TINT_OPACITY} stroke="none" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${PARTY_SIZE}, minmax(0, 1fr))`,
          transform: FIT.transform,
          transformOrigin: "top left",
        }}
      >
        {HOLES.map((point, index) => {
          if (!inStar(PARTY_RADIUS, point)) return <span key={index} aria-hidden="true" />;
          const owner = game.board[index];
          const target = targetKeys.has(index);
          const picked = selected !== null && selected.row === point.row && selected.col === point.col;
          const mine = owner === game.toPlay;
          return (
            <Hole
              key={index}
              point={point}
              owner={owner}
              label={holeLabel(point, owner, game.players)}
              target={target}
              picked={picked}
              last={last !== null && last.row === point.row && last.col === point.col}
              enabled={!readOnly && game.status === PARTY_STATUS.playing && (target || mine)}
              onHole={onHole}
            />
          );
        })}
      </div>
    </BoardFrame>
  );
}

function holeLabel(point: Point, owner: number | null, players: PartyStarBoardProps["game"]["players"]): string {
  const where = `row ${point.row + 1}, hole ${point.col + 1}`;
  return owner === null ? `Empty hole, ${where}` : `${partyPlayerName(players, owner)}'s ${PARTY_MARBLES[owner].label.toLowerCase()} piece, ${where}`;
}

/** One hole of the star: a button, with the marble standing in it, if any. */
function Hole({
  point,
  owner,
  label,
  target,
  picked,
  last,
  enabled,
  onHole,
}: {
  point: Point;
  owner: number | null;
  label: string;
  target: boolean;
  picked: boolean;
  last: boolean;
  enabled: boolean;
  onHole: (point: Point) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onHole(point)}
      disabled={!enabled}
      aria-label={label}
      aria-pressed={picked}
      data-testid="party-hole"
      data-row={point.row}
      data-col={point.col}
      data-owner={owner ?? ""}
      data-target={target ? "true" : undefined}
      data-picked={picked ? "true" : undefined}
      className="relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-default"
    >
      {/* On the lattice the cell is sheared; the marble inside leans back so it is round again, as `Intersection` does. */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ transform: HEX_LATTICE.unslant, containerType: "size" }}>
        {owner === null ? null : <MarbleChip player={owner} size="hole" />}
        {picked ? <span className="absolute inset-[2%] rounded-full border-[0.16em] border-ink" /> : null}
        {last && !picked ? <span className="absolute inset-[4%] rounded-full border-[0.1em] border-dashed border-shu" /> : null}
        {target ? <span className="absolute inset-[32%] rounded-full bg-moss opacity-85" data-mark="target" /> : null}
      </span>
    </button>
  );
}
