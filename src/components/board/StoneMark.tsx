import type { StoneMarkProps } from "./board.types";

/**
 * A stone filling ~86% of its container. The container decides the size, so
 * the same component draws board stones and the small status indicator.
 */
export function StoneMark({
  stone,
  stones,
  isLast = false,
  isWinning = false,
  winningColour = "#d92d20",
  ghost = false,
  moveNumber = null,
  isKing = false,
}: StoneMarkProps) {
  const ink = stone === "black" ? stones.blackInk : stones.whiteInk;

  return (
    <span
      className={[
        "relative flex h-[86%] w-[86%] items-center justify-center rounded-full",
        ghost
          ? "opacity-0 transition-opacity duration-150 group-hover:opacity-45 group-focus-visible:opacity-45"
          : "shadow-[1px_2px_3px_rgba(0,0,0,0.45)]",
      ].join(" ")}
      style={{
        background: stone === "black" ? stones.black : stones.white,
        boxShadow: [
          isWinning ? `0 0 0 0.16em ${winningColour}` : null,
          // A king is marked with a second ring, the way a real piece is stacked two deep.
          isKing ? `inset 0 0 0 0.12em ${ink}` : null,
        ]
          .filter((value) => value !== null)
          .join(", ") || undefined,
      }}
      aria-hidden="true"
    >
      {moveNumber !== null ? (
        <span
          className="font-mono leading-none tabular-nums"
          style={{ color: ink, fontSize: "0.5em" }}
        >
          {moveNumber}
        </span>
      ) : isLast ? (
        <span
          className="block h-[28%] w-[28%] rounded-full"
          style={{ background: ink }}
        />
      ) : null}
    </span>
  );
}
