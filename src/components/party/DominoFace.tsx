import { TRAIN_PIP_COLOURS } from "./party.constants";
import { pipRadius, pipSpots } from "./trainLayout";
import type { DominoFaceProps } from "./train.types";

/**
 * ONE DOMINO, drawn by the site in SVG: a tile of ivory with a rounded edge,
 * a line across its middle, and each half's pips in the colour and shape of
 * its number (`TRAIN_PIP_COLOURS`, `pipSpots`). A light object on the table
 * in both themes — its colours are the light theme's whatever the page is,
 * through `surface-light` on whatever holds it — as a letter tile is.
 *
 * Drawn at `x`, `y` in its parent's units, `size` its short side: lying
 * `across` it is twice as wide as tall, standing `down` twice as tall, with
 * `ends` left to right or top to bottom. A `face-down` tile is the back of
 * one, for the boneyard.
 */
export function DominoFace({ x, y, size, ends, lie, faceDown = false, ring = null, testId, dataTile }: DominoFaceProps) {
  const across = lie === "across";
  const width = across ? size * 2 : size;
  const height = across ? size : size * 2;
  const round = size * 0.14;
  const edge = Math.max(size * 0.045, 0.12);
  const halves: [number, number][] = across
    ? [
        [x, y],
        [x + size, y],
      ]
    : [
        [x, y],
        [x, y + size],
      ];
  return (
    <g data-testid={testId} data-tile={dataTile}>
      <rect
        x={x + edge / 2}
        y={y + edge / 2}
        width={width - edge}
        height={height - edge}
        rx={round}
        fill={faceDown ? "#3a352c" : "var(--ivory)"}
        stroke={ring ?? "var(--ink)"}
        strokeWidth={ring === null ? edge : edge * 3}
      />
      {faceDown ? null : (
        <>
          <line
            x1={across ? x + size : x + size * 0.18}
            y1={across ? y + size * 0.18 : y + size}
            x2={across ? x + size : x + size * 0.82}
            y2={across ? y + size * 0.82 : y + size}
            stroke="var(--ink)"
            strokeOpacity={0.55}
            strokeWidth={edge}
            strokeLinecap="round"
          />
          {ends.map((value, half) => {
            const [hx, hy] = halves[half];
            const inset = size * 0.06;
            const side = size - inset * 2;
            const r = pipRadius(value) * side;
            return pipSpots(value).map(([px, py], at) => (
              <circle key={`${half}-${at}`} cx={hx + inset + px * side} cy={hy + inset + py * side} r={r} fill={TRAIN_PIP_COLOURS[value]} />
            ));
          })}
        </>
      )}
    </g>
  );
}
