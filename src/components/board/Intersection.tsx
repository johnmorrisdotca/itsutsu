import type { IntersectionProps } from "./board.types";
import { StoneMark } from "./StoneMark";

export function Intersection({
  point,
  cell,
  label,
  isLast,
  isWinning,
  ghost,
  onPlay,
}: IntersectionProps) {
  const playable = cell === null && ghost !== null;

  return (
    <button
      type="button"
      onClick={() => onPlay(point)}
      disabled={!playable}
      aria-label={label}
      className="group relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-default"
    >
      {cell !== null ? (
        <StoneMark stone={cell} isLast={isLast} isWinning={isWinning} />
      ) : ghost !== null ? (
        <StoneMark stone={ghost} ghost />
      ) : null}
    </button>
  );
}
