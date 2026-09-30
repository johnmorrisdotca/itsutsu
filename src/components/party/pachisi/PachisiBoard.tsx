"use client";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import type { Appearance } from "@/components/board/board.types";
import { PACHISI_HOME_PATH } from "@/lib/party/pachisi/pachisi.constants";
import { isSafe, pachisiPlayerName, squareOf } from "@/lib/party/pachisi/pachisi";
import type { PachisiGame } from "@/lib/party/pachisi/pachisi.types";
import { centredBaseline } from "@/lib/ui/svgText";

import { usePartyMarbles } from "../partyMarbles";
import { NEST_CORNER, PACHISI_CELLS, TRACK_CELLS, homePathCell, pawnPoint } from "./pachisiLayout";

/** The four middle triangles, each pointing into its arm's home path. */
const MIDDLE: readonly string[] = ["8,11 11,11 9.5,9.5", "8,8 8,11 9.5,9.5", "8,8 11,8 9.5,9.5", "11,8 11,11 9.5,9.5"];

/**
 * THE CROSS AND CIRCLE: nineteen cells square on the reader's own wood, in the
 * frame every board has (`BoardFrame`). The shared track in pale squares, the
 * twelve safe ones marked with a ring; each seated player's nest, home path
 * and corner of the middle in their colour; the pawns as their marbles, with
 * their letter. A pawn the player to move may move is ringed and is a button:
 * `onPawn` moves it by the value chosen beside the board.
 */
export function PachisiBoard({ game, appearance, movable = [], onPawn }: { game: PachisiGame; appearance: Appearance; movable?: readonly number[]; onPawn?: (pawn: number) => void }) {
  const theme = BOARD_THEMES[appearance.boardTheme];
  const marbles = usePartyMarbles();
  const seatOfArm = [0, 1, 2, 3].map((arm) => game.arms.indexOf(arm));
  const square = "rgba(255,253,246,0.92)";
  const line = "rgba(0,0,0,0.35)";
  /* An arm's colour, its seat's marble, faint for a nest or a path; an arm nobody sits at is shaded grey. */
  const tint = (arm: number, strong = false) => {
    const seat = seatOfArm[arm];
    return seat < 0 ? { fill: "#000000", fillOpacity: 0.08 } : { fill: marbles[seat].fill, fillOpacity: strong ? 0.85 : 0.4 };
  };
  /* How many pawns share each drawn place, so two on one square sit side by side. */
  const counts = new Map<string, number>();
  const placeKey = (seat: number, progress: number) => {
    const onTrack = squareOf(game.arms[seat], progress);
    return onTrack === null ? `${seat}:${progress}` : `t${onTrack}`;
  };
  game.pawns.forEach((pawns, seat) => pawns.forEach((progress) => counts.set(placeKey(seat, progress), (counts.get(placeKey(seat, progress)) ?? 0) + 1)));
  const stacked = new Map<string, number>();

  return (
    <BoardFrame size={PACHISI_CELLS} theme={theme} flipped={false} inset={0.02} lattice={false} shape="rhombus" coordinates={false}>
      <svg viewBox={`0 0 ${PACHISI_CELLS} ${PACHISI_CELLS}`} className="absolute inset-0 h-full w-full touch-manipulation select-none" data-testid="pachisi-board" role="group" aria-label="Pachisi board">
        {NEST_CORNER.map((corner, arm) => (
          <rect key={`nest-${arm}`} x={corner.col + 0.4} y={corner.row + 0.4} width={7.2} height={7.2} rx={1.2} {...tint(arm)} stroke={line} strokeWidth={0.05} />
        ))}
        {TRACK_CELLS.map((cell, at) => (
          <g key={`track-${at}`}>
            <rect x={cell.col + 0.04} y={cell.row + 0.04} width={0.92} height={0.92} rx={0.1} {...(at % 17 === 4 && seatOfArm[Math.floor(at / 17)] >= 0 ? tint(Math.floor(at / 17)) : { fill: square })} stroke={line} strokeWidth={0.04} />
            {isSafe(at) ? <circle cx={cell.col + 0.5} cy={cell.row + 0.5} r={0.3} fill="none" stroke="var(--shu)" strokeWidth={0.06} /> : null}
          </g>
        ))}
        {[0, 1, 2, 3].flatMap((arm) =>
          Array.from({ length: PACHISI_HOME_PATH }, (_, step) => {
            const cell = homePathCell(arm, step + 1);
            return <rect key={`path-${arm}-${step}`} x={cell.col + 0.04} y={cell.row + 0.04} width={0.92} height={0.92} rx={0.1} {...tint(arm)} stroke={line} strokeWidth={0.04} />;
          }),
        )}
        {MIDDLE.map((points, arm) => (
          <polygon key={`home-${arm}`} points={points} {...tint(arm, true)} stroke={line} strokeWidth={0.05} />
        ))}
        {game.pawns.flatMap((pawns, seat) =>
          pawns.map((progress, pawn) => {
            const key = placeKey(seat, progress);
            const shared = (counts.get(key) ?? 1) > 1 && squareOf(game.arms[seat], progress) !== null;
            const stack = shared ? (stacked.get(key) ?? 0) + 1 : 0;
            if (shared) stacked.set(key, stack);
            const point = pawnPoint(game.arms[seat], progress, pawn, stack);
            const marble = marbles[seat];
            const canMove = seat === game.toPlay && movable.includes(pawn) && onPawn !== undefined;
            const radius = progress === -1 ? 0.95 : shared ? 0.3 : 0.38;
            return (
              <g
                key={`pawn-${seat}-${pawn}`}
                data-testid="pachisi-pawn"
                data-seat={seat}
                data-pawn={pawn}
                data-progress={progress}
                data-movable={canMove ? "true" : undefined}
                role={canMove ? "button" : undefined}
                tabIndex={canMove ? 0 : undefined}
                aria-label={canMove ? `Move ${pachisiPlayerName(game, seat)}'s pawn ${pawn + 1}` : undefined}
                onClick={canMove ? () => onPawn?.(pawn) : undefined}
                onKeyDown={canMove ? (event) => (event.key === "Enter" || event.key === " ") && onPawn?.(pawn) : undefined}
                className={canMove ? "cursor-pointer" : undefined}
              >
                {canMove ? <circle cx={point.x} cy={point.y} r={radius + 0.16} fill="none" stroke="var(--shu)" strokeWidth={0.1} /> : null}
                <circle cx={point.x} cy={point.y} r={radius} fill={marble.fill} stroke="rgba(0,0,0,0.55)" strokeWidth={0.05} />
                <text x={point.x} y={centredBaseline(point.y, radius * 1.1)} textAnchor="middle" fontSize={radius * 1.1} fontWeight={700} fill={marble.ink}>
                  {marble.letter}
                </text>
                {/* A finger's target on a pawn too small to aim at: the whole cell, invisible. */}
                {canMove ? <circle cx={point.x} cy={point.y} r={Math.max(radius, 0.6)} fill="transparent" /> : null}
              </g>
            );
          }),
        )}
      </svg>
    </BoardFrame>
  );
}

