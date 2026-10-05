import { centredBaseline } from "@/lib/ui/svgText";

import { PICTURE_LOOK } from "./puzzles.constants";

/**
 * One line's clue on its band: a row's numbers to the left of it, pushed to
 * the grid; a column's above it, pushed down to the grid. Met, it is faint
 * and a stroke runs through it.
 *
 * Drawn in the board's own units (a cell is one), so the board draws it on its
 * paper (`PictureLogicGrid`) and a zoomed board draws the same clue again,
 * pinned, at the edge of its box (`PictureLogicPinned`), from one drawing.
 */
export function ClueLine({
  numbers,
  met,
  across,
  place,
  depth,
  font,
  testId = "picture-clue",
}: {
  numbers: readonly number[];
  met: boolean;
  across: boolean;
  place: number;
  depth: number;
  font: number;
  /** What the group is called to a test: the pinned copy of a clue is not counted among the board's own. */
  testId?: string;
}) {
  const shown = numbers.length === 0 ? [0] : numbers;
  const spot = (index: number) => {
    const back = shown.length - index;
    return across ? { x: depth - back + 0.5, y: depth + place + 0.5 } : { x: depth + place + 0.5, y: depth - back + 0.5 };
  };
  const first = spot(0);
  const strike = across
    ? { x1: first.x - 0.4, y1: first.y, x2: depth - 0.1, y2: first.y }
    : { x1: first.x, y1: first.y - 0.4, x2: first.x, y2: depth - 0.1 };
  return (
    <g opacity={met ? PICTURE_LOOK.metOpacity : 1} data-testid={testId} data-line={`${across ? "row" : "col"}-${place}`} data-met={met ? "true" : "false"}>
      {shown.map((value, index) => {
        const { x, y } = spot(index);
        return (
          <text key={index} x={x} y={centredBaseline(y, font)} fontSize={value > 9 ? font * 0.85 : font} fontWeight={600} textAnchor="middle" fill={PICTURE_LOOK.ink}>
            {value}
          </text>
        );
      })}
      {met ? <line {...strike} stroke={PICTURE_LOOK.ink} strokeWidth={0.06} strokeLinecap="round" data-testid={`${testId}-struck`} /> : null}
    </g>
  );
}
