import type { PointerEvent } from "react";

import { clueDepth, type MetLines } from "@/lib/puzzles/pictureLogic/paint";
import type { PictureClues } from "@/lib/puzzles/pictureLogic/pictureLogic.types";

import { ClueLine } from "./PictureClue";
import { PICTURE_LOOK } from "./puzzles.constants";
import type { PinFrame, Pinned } from "./TsunagiViewport";

/**
 * THE CLUES OF A ZOOMED PICTURE, KEPT AT THE BOX'S EDGE. A 50×50 zoomed to
 * cells a thumb can press shows a few rows and columns of it, and the numbers
 * those lines are read from are a screen away. So while the view is zoomed, a
 * band along the top carries the columns' clues and one down the left the
 * rows', each following the board's own movement along its line and standing
 * still across it, with the corner where they meet blank. They are drawn from
 * the same `ClueLine` as the board's own, so a clue met is struck here too.
 *
 * Each band sits where the board's own would be until the view moves past it
 * (`max(edge, 0)`), so it never jumps. A press on one does nothing; it is not
 * a press on the square it covers.
 */
export function pinnedClues(clues: PictureClues, met: MetLines): Pinned {
  const { size } = clues;
  const depth = clueDepth(clues);
  const side = size + depth;
  const font = PICTURE_LOOK.clueFont;

  const render = (frame: PinFrame) => {
    const unit = frame.side / side;
    const band = depth * unit;
    const x0 = Math.max(frame.left, 0);
    const y0 = Math.max(frame.top, 0);
    const movedAcross = frame.top < 0;
    const movedDown = frame.left < 0;
    const stop = (event: PointerEvent<HTMLDivElement>) => event.stopPropagation();
    const shared = { position: "absolute", overflow: "hidden", background: PICTURE_LOOK.band, pointerEvents: "auto" } as const;
    const line = { stroke: PICTURE_LOOK.ruleStrong, strokeWidth: 0.05 } as const;
    return (
      <>
        {movedAcross ? (
          <div style={{ ...shared, left: x0 + band, top: 0, width: Math.max(0, frame.width - x0 - band), height: band }} onPointerDown={stop} data-testid="picture-pinned-columns">
            <svg
              viewBox={`0 0 ${side} ${depth}`}
              style={{ position: "absolute", left: frame.left - x0 - band, top: 0, width: frame.side, height: band, maxWidth: "none" }}
              aria-hidden="true"
            >
              {clues.cols.map((clue, col) => (
                <ClueLine key={col} numbers={clue} met={met.cols[col]!} across={false} place={col} depth={depth} font={font} testId="picture-clue-pinned" />
              ))}
              <g {...line}>
                <line x1={depth} y1={0} x2={depth} y2={depth} />
                <line x1={side} y1={0} x2={side} y2={depth} />
                <line x1={depth} y1={depth} x2={side} y2={depth} />
              </g>
            </svg>
          </div>
        ) : null}
        {movedDown ? (
          <div style={{ ...shared, left: 0, top: y0 + band, width: band, height: Math.max(0, frame.height - y0 - band) }} onPointerDown={stop} data-testid="picture-pinned-rows">
            <svg
              viewBox={`0 0 ${depth} ${side}`}
              style={{ position: "absolute", left: 0, top: frame.top - y0 - band, width: band, height: frame.side, maxWidth: "none" }}
              aria-hidden="true"
            >
              {clues.rows.map((clue, row) => (
                <ClueLine key={row} numbers={clue} met={met.rows[row]!} across place={row} depth={depth} font={font} testId="picture-clue-pinned" />
              ))}
              <g {...line}>
                <line x1={0} y1={depth} x2={depth} y2={depth} />
                <line x1={0} y1={side} x2={depth} y2={side} />
                <line x1={depth} y1={depth} x2={depth} y2={side} />
              </g>
            </svg>
          </div>
        ) : null}
        {movedAcross || movedDown ? <div style={{ ...shared, left: x0, top: y0, width: band, height: band }} onPointerDown={stop} data-testid="picture-pinned-corner" /> : null}
      </>
    );
  };
  return { inset: depth / side, render };
}
