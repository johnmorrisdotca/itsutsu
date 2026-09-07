import { BLOCKED } from "@/lib/gomoku/gomoku.constants";
import { MARK_STYLE } from "./Board.constants";
import { StoneMark } from "./StoneMark";
import type { BoardMark, IntersectionProps } from "./board.types";

/** An intersection the rules sealed off: drawn as a knot, never as a stone. */
function Obstacle() {
  return (
    <span
      className="block h-[62%] w-[62%] rotate-45 rounded-[18%] bg-black/55 shadow-inner"
      aria-hidden="true"
    />
  );
}

function Mark({ mark }: { mark: BoardMark }) {
  const { colour, shape } = MARK_STYLE[mark.kind];

  if (shape === "cross") {
    return (
      <span
        className="pointer-events-none absolute inset-[18%]"
        style={{
          background: `linear-gradient(45deg, transparent 44%, ${colour} 44%, ${colour} 56%, transparent 56%),
                       linear-gradient(-45deg, transparent 44%, ${colour} 44%, ${colour} 56%, transparent 56%)`,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={[
        "pointer-events-none absolute rounded-full",
        shape === "dot" ? "inset-[30%]" : "inset-[8%]",
        "animate-pulse",
      ].join(" ")}
      style={
        shape === "dot"
          ? { background: colour, opacity: 0.85 }
          : { border: `0.14em solid ${colour}` }
      }
      aria-hidden="true"
    />
  );
}

export function Intersection({
  point,
  cell,
  label,
  isLast,
  isWinning,
  ghost,
  moveNumber,
  mark,
  stones,
  winningColour,
  readOnly,
  onPlay,
}: IntersectionProps) {
  const playable = !readOnly && cell === null && ghost !== null;

  return (
    <button
      type="button"
      onClick={() => onPlay(point)}
      disabled={!playable}
      aria-label={label}
      className="group relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-default"
    >
      {cell === BLOCKED ? (
        <Obstacle />
      ) : cell !== null ? (
        <StoneMark
          stone={cell}
          stones={stones}
          isLast={isLast}
          isWinning={isWinning}
          winningColour={winningColour}
          moveNumber={moveNumber}
        />
      ) : ghost !== null ? (
        <StoneMark stone={ghost} stones={stones} ghost />
      ) : null}
      {mark !== null ? <Mark mark={mark} /> : null}
    </button>
  );
}
