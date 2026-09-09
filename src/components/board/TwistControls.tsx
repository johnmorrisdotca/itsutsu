"use client";

import { layoutOrder } from "./flip";

/**
 * The quarter-turn controls for a twist game, laid over the board once a
 * stone is down: two arrows per quadrant, at its outer corner. They exist
 * only while a rotation is owed, so a player is never offered one out of
 * turn.
 */
export function TwistControls({
  size,
  quadrantSize,
  onTwist,
  flipped = false,
}: {
  size: number;
  quadrantSize: number;
  onTwist: (quadrant: number, clockwise: boolean) => void;
  /** The board is turned round for this reader, so these turn with it. */
  flipped?: boolean;
}) {
  const across = size / quadrantSize;
  /*
   * Laid out in the board's own order, so a quadrant's arrows sit on the
   * quadrant. Left alone on a flipped board they would stay put while the
   * stones moved, and every arrow would turn a quarter of the board the
   * player was not pointing at.
   */
  const quadrants = layoutOrder(across * across, flipped);

  return (
    <div
      className="pointer-events-none absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${across}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${across}, minmax(0, 1fr))`,
      }}
      data-testid="twist-controls"
    >
      {quadrants.map((quadrant, slot) => {
        // The corner is decided by where it is drawn, the label by what it turns.
        const row = Math.floor(slot / across);
        const col = slot % across;
        // Arrows sit at the corner of each quadrant that faces the board's edge.
        const vertical = row === 0 ? "top-1" : "bottom-1";
        const horizontal = col === 0 ? "left-1" : "right-1";
        return (
          <div key={quadrant} className="relative">
            <div
              className={`pointer-events-auto absolute ${vertical} ${horizontal} flex gap-1`}
            >
              <TwistButton
                label={`Turn quadrant ${quadrant + 1} anticlockwise`}
                glyph="↺"
                onClick={() => onTwist(quadrant, false)}
                testId={`twist-${quadrant}-ccw`}
              />
              <TwistButton
                label={`Turn quadrant ${quadrant + 1} clockwise`}
                glyph="↻"
                onClick={() => onTwist(quadrant, true)}
                testId={`twist-${quadrant}-cw`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TwistButton({
  label,
  glyph,
  onClick,
  testId,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-full border border-ochre/60 bg-ochre-soft text-lg leading-none text-ink shadow-md transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-moss animate-pulse"
      data-testid={testId}
    >
      {glyph}
    </button>
  );
}
