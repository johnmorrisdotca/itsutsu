import { BLOCKED, HOT, WORM } from "@/lib/gomoku/gomoku.constants";
import { HEX_LATTICE, MARK_STYLE } from "./Board.constants";
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
      className="block h-[66%] w-[66%] rounded-full border-[0.2em] border-moss border-dashed"
      aria-hidden="true"
    />
  );
}

/** An empty peg-hole: Chinese Checkers has no drawn grid, so this is what marks a playable cell at all. */
function Hole() {
  return (
    <span
      className="block h-[22%] w-[22%] rounded-full bg-black/20 shadow-inner"
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

/**
 * The turn guide's mark on a piece that may move or a point that may be played:
 * a dashed, rounded square — a shape none of the advice marks use, so it reads
 * without its colour, and stays square on the board turned either way round.
 */
function GuideOutline({ colour }: { colour: string }) {
  return (
    <span
      className="pointer-events-none absolute inset-[3%] rounded-[22%] border-dashed"
      style={{ borderWidth: "0.2em", borderColor: colour }}
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
  camp = null,
  isKing = false,
  hideBlocked = false,
  hole = false,
  unslant = false,
  guide = null,
  guideColours,
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
      data-guide={guide ?? undefined}
      className="group relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-default"
    >
      {/*
        * On the lattice the cell is a rhombus centred on its crossing, which
        * is what makes the hit area right; the stone inside leans back so it
        * is a circle again. HEX_LATTICE's inverse, exactly — the board's own
        * fitting scale is uniform and never made a circle into anything else.
        *
        * A piece the turn guide holds back is dimmed here, whole: it is still
        * on the board and still the player's, only not a move this turn. "Ever
        * so slightly", in John's words — at 45% a black man all but vanished
        * into the dark squares of the ink board, which is dimming it off the
        * board rather than out of the choice.
        */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          ...(unslant ? { transform: HEX_LATTICE.unslant } : {}),
          ...(guide === "unavailable" ? { opacity: 0.6 } : {}),
        }}
      >
      {camp !== null ? (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: camp === "black" ? "rgba(20, 20, 20, 0.16)" : "rgba(255, 255, 255, 0.34)" }}
          aria-hidden="true"
        />
      ) : null}
      {cell === BLOCKED ? (
        hideBlocked ? null : <Obstacle />
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
          isKing={isKing}
        />
      ) : ghostStone !== null ? (
        <span className="flex h-full w-full items-center justify-center opacity-60">
          <StoneMark stone={ghostStone} stones={stones} />
        </span>
      ) : ghost !== null ? (
        <StoneMark stone={ghost} stones={stones} ghost />
      ) : hole ? (
        <Hole />
      ) : null}
      {mark !== null ? <Mark mark={mark} /> : null}
      {guide === "choice" && guideColours !== undefined ? <GuideOutline colour={guideColours.mark} /> : null}
      {guide === "veiled" && guideColours !== undefined ? (
        <span className="pointer-events-none absolute inset-0" style={{ background: guideColours.veil }} aria-hidden="true" />
      ) : null}
      </span>
    </button>
  );
}
