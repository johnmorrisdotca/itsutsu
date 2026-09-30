/**
 * THE CUBES FAMILY'S MARK: a 3×3 cube seen from above one corner, drawn flat
 * in the family mark's own cells, so it sits in the little board as every
 * family's picture does.
 */
export type MarkCubeProps = {
  /** The corner where the three faces meet, in cells. */
  x: number;
  y: number;
  /** How long an edge looks, in cells. */
  edge: number;
  /** Each face's nine stickers, top, left and right, row by row, by the letter of the face each belongs on. */
  faces: readonly [string, string, string];
};

/** A cube sticker's colour in a mark, by the letter of the face it belongs on, as the cube itself paints them (`kyuubu`). */
const MARK_CUBE_COLOURS: Record<string, string> = { U: "#f7f7f2", R: "#c8102e", F: "#009b48", D: "#ffd500", L: "#ff5800", B: "#0046ad" };

/** The nine stickers of one face of a mark's cube, as polygons, from the corner along two edges. */
function cubeFace(x: number, y: number, step: number, one: readonly [number, number], two: readonly [number, number], letters: string) {
  const point = (i: number, j: number) => `${x + step * (i * one[0] + j * two[0])},${y + step * (i * one[1] + j * two[1])}`;
  return [...letters].map((letter, at) => {
    const i = at % 3;
    const j = Math.floor(at / 3);
    const inset = 0.1;
    const corners = [point(i + inset, j + inset), point(i + 1 - inset, j + inset), point(i + 1 - inset, j + 1 - inset), point(i + inset, j + 1 - inset)];
    return { key: `${letters}-${at}`, points: corners.join(" "), fill: MARK_CUBE_COLOURS[letter] };
  });
}

/**
 * CUBES: a 3×3 seen from above one corner, a few stickers still out of place
 * on each face — a cube part way to solved, which is the puzzle.
 */
export const CUBES_MARK: MarkCubeProps = { x: 2.5, y: 2.55, edge: 2.35, faces: ["UUUUUFUUR", "FFFFFFLFF", "RRBRRRRRR"] };

export function MarkCube({ x, y, edge, faces }: MarkCubeProps) {
  const side = Math.sqrt(3) / 2;
  const step = edge / 3;
  const outline = `${x},${y - edge} ${x + edge * side},${y - edge / 2} ${x + edge * side},${y + edge / 2} ${x},${y + edge} ${x - edge * side},${y + edge / 2} ${x - edge * side},${y - edge / 2}`;
  const stickers = [
    // The top, read from its far corner: rows run towards the viewer.
    ...cubeFace(x, y - edge, step, [side, 0.5], [-side, 0.5], faces[0]),
    ...cubeFace(x - edge * side, y - edge / 2, step, [side, 0.5], [0, 1], faces[1]),
    ...cubeFace(x, y, step, [side, -0.5], [0, 1], faces[2]),
  ];
  return (
    <g data-mark-cube="">
      <polygon points={outline} fill="#15130f" stroke="#15130f" strokeWidth={0.12} strokeLinejoin="round" />
      {stickers.map((sticker) => (
        <polygon key={sticker.key} points={sticker.points} fill={sticker.fill} />
      ))}
    </g>
  );
}
