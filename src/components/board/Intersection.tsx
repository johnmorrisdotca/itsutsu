import { BLOCKED, HOT, WORM } from "@/lib/gomoku/gomoku.constants";
import { MARK_STYLE } from "./Board.constants";
import { StoneMark } from "./StoneMark";
import type { BoardMark, IntersectionProps } from "./board.types";

/** A hotspot: half black, half white, because it is both at once. */
function Hotspot() {
  return (
    <span
      className="block h-[70%] w-[70%] rounded-full shadow-inner"
      style={{ background: "linear-gradient(135deg, #111 0%, #111 50%, #f5f5f5 50%, #f5f5f5 100%)" }}
      aria-hidden="true"
    />
  );
}

/** A wormhole mouth: a ring with nothing inside, because a line falls through it. */
function Wormhole() {
  return (
    <span
      className="block h-[66%] w-[66%] rounded-full border-[0.2em] border-indigo-700/80 border-dashed"
      aria-hidden="true"
    />
  );
}

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
        className="pointer-events-none absolute inset-[22%] opacity-80"
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
  clickable = false,
  ghostStone = null,
  onHover,
  moveNumber,
  mark,
  stones,
  winningColour,
  readOnly,
  onPlay,
}: IntersectionProps) {
  const playable = !readOnly && ((cell === null && ghost !== null) || clickable);

  return (
    <button
      type="button"
      onClick={() => onPlay(point)}
      onPointerEnter={onHover === undefined ? undefined : () => onHover(point)}
      onPointerLeave={onHover === undefined ? undefined : () => onHover(null)}
      disabled={!playable}
      aria-label={label}
      className="group relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-default"
    >
      {cell === BLOCKED ? (
        <Obstacle />
      ) : cell === HOT ? (
        <Hotspot />
      ) : cell === WORM ? (
        <Wormhole />
      ) : cell !== null ? (
        <StoneMark
          stone={cell}
          stones={stones}
          isLast={isLast}
          isWinning={isWinning}
          winningColour={winningColour}
          moveNumber={moveNumber}
        />
      ) : ghostStone !== null ? (
        <span className="flex h-full w-full items-center justify-center opacity-60">
          <StoneMark stone={ghostStone} stones={stones} />
        </span>
      ) : ghost !== null ? (
        <StoneMark stone={ghost} stones={stones} ghost />
      ) : null}
      {mark !== null ? <Mark mark={mark} /> : null}
    </button>
  );
}
