"use client";

import { usePartyMarbles } from "./partyMarbles";
import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { pointName } from "@/lib/gomoku/notation";
import { DOTS_STATUS, dotsLineCount, dotsLineEnds, dotsPlayerName } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import { centredBaseline } from "@/lib/ui/svgText";

import { DOTS_BOX_FILL_OPACITY } from "./party.constants";
import type { DotsBoardProps } from "./party.types";

/** A drawn line's width, and a dot's radius, in the board's own units (one unit from dot to dot). */
const LINE_WIDTH = 0.1;
const DOT_RADIUS = 0.09;
/** A box owner's letter, as a share of the box. */
const LETTER_SIZE = 0.5;

/**
 * DOTS AND BOXES ON THE SITE'S OWN BOARD.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim, the
 * coordinates and the shadow are `BoardFrame`, in the reader's own board
 * theme, and the dots stand on its crossings the way a Go board's stones do —
 * a board of `size` boxes is `size + 1` points a side, lettered and numbered
 * like any other. What is drawn inside is only what this game has: the dots,
 * the lines drawn so far, and each closed box filled in its owner's colour
 * with their letter in it, so no box is told apart by colour alone.
 *
 * EVERY LINE IS EASY TO TAP. Each undrawn line's target is the whole diamond
 * between its two dots and the middles of the boxes on either side of it, so
 * the targets tile the board and a tap anywhere lands on the nearest line —
 * about forty-five pixels across at 6×6 on a 390-pixel phone. Each is a
 * button to a screen reader and a keyboard too, named by its two dots.
 */
export function DotsBoard({ game, appearance, onLine, readOnly = false }: DotsBoardProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const theme = BOARD_THEMES[appearance.boardTheme];
  const points = game.size + 1;
  const lines = Array.from({ length: dotsLineCount(game.size) }, (_, line) => line);
  const last = game.lines.at(-1) ?? null;
  // Nothing to tap on a preview, or once the last line is drawn.
  const draw = !readOnly && game.status === DOTS_STATUS.playing ? onLine : undefined;
  const mover = marbles[game.toPlay];
  const at = (index: number) => index + 0.5;

  return (
    <BoardFrame size={points} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={appearance.showCoordinates}>
      <svg
        viewBox={`0 0 ${points} ${points}`}
        className="absolute inset-0 h-full w-full touch-manipulation select-none"
        data-testid="dots-board"
        data-size={game.size}
        role="group"
        aria-label={`Dots and Boxes, ${game.size} by ${game.size} boxes`}
      >
        {/* THE CLOSED BOXES, each in its owner's colour with their letter, the ones the last line closed ringed. */}
        {game.owners.map((owner, box) => {
          if (owner === null) return null;
          const row = Math.floor(box / game.size);
          const col = box % game.size;
          const marble = marbles[owner];
          const fresh = game.lastClosed.includes(box);
          return (
            <g key={box} data-testid="dots-box" data-box={box} data-owner={owner} data-fresh={fresh ? "true" : undefined}>
              <rect
                x={at(col)}
                y={at(row)}
                width={1}
                height={1}
                fill={marble.fill}
                fillOpacity={DOTS_BOX_FILL_OPACITY}
                stroke={fresh ? theme.winning : "rgba(0,0,0,0.25)"}
                strokeWidth={fresh ? 0.08 : 0.02}
              />
              <text
                x={at(col) + 0.5}
                y={centredBaseline(at(row) + 0.5, LETTER_SIZE)}
                fontSize={LETTER_SIZE}
                fontWeight={700}
                textAnchor="middle"
                fill={marble.ink}
                aria-hidden="true"
              >
                {marble.letter}
              </text>
              <title>{`${dotsPlayerName(game, owner)}'s box`}</title>
            </g>
          );
        })}

        {/* THE LINES DRAWN, in ink; the last in its drawer's colour, so the table can see what just happened. */}
        {game.lines.map((line) => {
          const ends = dotsLineEnds(game.size, line)!;
          const by = game.drawnBy[line]!;
          const latest = line === last;
          return (
            <line
              key={line}
              x1={at(ends.from.col)}
              y1={at(ends.from.row)}
              x2={at(ends.to.col)}
              y2={at(ends.to.row)}
              stroke={latest ? marbles[by].fill : theme.line}
              strokeWidth={latest ? LINE_WIDTH * 1.4 : LINE_WIDTH}
              strokeLinecap="round"
              data-testid="dots-drawn"
              data-line={line}
              data-by={by}
              data-last={latest ? "true" : undefined}
            />
          );
        })}

        {/* THE DOTS, over the lines' ends. */}
        {Array.from({ length: points * points }, (_, index) => (
          <circle key={index} cx={at(index % points)} cy={at(Math.floor(index / points))} r={DOT_RADIUS} fill={theme.line} />
        ))}

        {/*
          THE LINES STILL TO DRAW, one diamond each, over everything: a tap
          anywhere near a line draws it. The line itself shows faintly in the
          mover's colour under a pointer or a keyboard's focus, before it is drawn.
        */}
        {draw !== undefined
          ? lines.map((line) => {
              if (game.drawnBy[line] !== null) return null;
              const ends = dotsLineEnds(game.size, line)!;
              const x1 = at(ends.from.col);
              const y1 = at(ends.from.row);
              const x2 = at(ends.to.col);
              const y2 = at(ends.to.row);
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              // Half a box either side of the line, across it: the middles of the two boxes it borders.
              const [dx, dy] = ends.across ? [0, 0.5] : [0.5, 0];
              const diamond = `${x1},${y1} ${midX + dx},${midY + dy} ${x2},${y2} ${midX - dx},${midY - dy}`;
              const name = `Line from ${pointName(points, ends.from)} to ${pointName(points, ends.to)}`;
              return (
                <g key={line} className="group">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={mover.fill}
                    strokeWidth={LINE_WIDTH}
                    strokeLinecap="round"
                    className="pointer-events-none opacity-0 group-hover:opacity-60 group-focus-within:opacity-60"
                  />
                  <polygon
                    points={diamond}
                    fill="transparent"
                    className="cursor-pointer outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={name}
                    data-testid="dots-line"
                    data-line={line}
                    onClick={() => draw(line)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      draw(line);
                    }}
                  />
                </g>
              );
            })
          : null}
      </svg>
    </BoardFrame>
  );
}
