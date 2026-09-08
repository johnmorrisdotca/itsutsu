/** A stone in a family's mark: grid row and column, colour, and whether it is faded (a stone being taken, or a ghost). */
type MarkStone = { r: number; c: number; white?: boolean; faded?: boolean };

type Mark = {
  /** Lines per side of the little board. */
  n: number;
  /** Cells rather than lines: Othello and the drop games. */
  cells?: boolean;
  stones: MarkStone[];
  /** An extra stroke drawn over the board, in the same 0..n coordinate space. */
  path?: string;
};

/**
 * One mark per family, drawn the way the About page draws its figures: a
 * little board with the family's defining shape on it. They are keyed by the
 * family's title so a new family gets the plain mark until it is given one.
 */
const MARKS: Record<string, Mark> = {
  "Five in a row": {
    n: 5,
    stones: [0, 1, 2, 3, 4].map((i) => ({ r: 4 - i, c: i })),
  },
  Captures: {
    n: 5,
    stones: [
      { r: 2, c: 0 },
      { r: 2, c: 1, white: true, faded: true },
      { r: 2, c: 2, white: true, faded: true },
      { r: 2, c: 3 },
      { r: 0, c: 4, white: true },
    ],
  },
  Drops: {
    n: 5,
    cells: true,
    stones: [
      { r: 4, c: 2 },
      { r: 3, c: 2, white: true },
      { r: 4, c: 1, white: true },
      { r: 4, c: 3 },
      { r: 0, c: 2, faded: true },
    ],
  },
  "Pieces and twists": {
    n: 5,
    stones: [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 1, white: true },
      { r: 2, c: 2, white: true },
    ],
    path: "M 3.6 0.6 A 1.6 1.6 0 0 1 4.4 2.2 M 4.4 2.2 l -0.5 -0.4 M 4.4 2.2 l 0.5 -0.4",
  },
  Flips: {
    n: 4,
    cells: true,
    stones: [
      { r: 1, c: 1, white: true },
      { r: 1, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 2, white: true },
      { r: 1, c: 3, faded: true },
    ],
  },
  "Small boards": {
    n: 3,
    stones: [
      { r: 0, c: 0 },
      { r: 1, c: 1 },
      { r: 2, c: 2 },
      { r: 0, c: 2, white: true },
      { r: 2, c: 0, white: true },
    ],
  },
  "Strange boards": {
    n: 5,
    stones: [
      { r: 2, c: 3 },
      { r: 2, c: 4 },
      { r: 2, c: 0, faded: true },
      { r: 1, c: 1, white: true },
    ],
    path: "M 4.5 2 C 5.2 2 5.2 2 4.9 2 M -0.5 2 C 0.2 2 0.2 2 -0.1 2",
  },
};

const PLAIN: Mark = { n: 5, stones: [{ r: 2, c: 2 }] };

/** The family's mark as an inline SVG, sized by the class it is given. */
export function FamilyMark({ family, className = "size-12" }: { family: string; className?: string }) {
  const mark = MARKS[family] ?? PLAIN;
  const { n } = mark;
  const cells = mark.cells === true;
  const at = (i: number) => (cells ? i + 0.5 : i);
  const extent = cells ? n : n - 1;
  const pad = 0.6;
  const lines = Array.from({ length: cells ? n + 1 : n }, (_, i) => i);

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${extent + pad * 2} ${extent + pad * 2}`}
      className={className}
      aria-hidden="true"
    >
      <rect
        x={-pad}
        y={-pad}
        width={extent + pad * 2}
        height={extent + pad * 2}
        rx={0.5}
        fill={cells ? "var(--moss-soft)" : "var(--ivory)"}
        stroke="var(--rule-strong)"
        strokeWidth={0.08}
      />
      {lines.map((i) => (
        <g key={i} stroke="var(--rule-strong)" strokeWidth={0.06}>
          <line x1={0} x2={extent} y1={i} y2={i} />
          <line y1={0} y2={extent} x1={i} x2={i} />
        </g>
      ))}
      {mark.stones.map((stone) => (
        <circle
          key={`${stone.r}-${stone.c}`}
          cx={at(stone.c)}
          cy={at(stone.r)}
          r={0.42}
          fill={stone.white ? "var(--ivory)" : "var(--ink)"}
          stroke="var(--ink)"
          strokeWidth={0.08}
          strokeDasharray={stone.faded ? "0.2 0.15" : undefined}
          opacity={stone.faded ? 0.5 : 1}
        />
      ))}
      {mark.path !== undefined ? (
        <path d={mark.path} fill="none" stroke="var(--shu)" strokeWidth={0.14} strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
