"use client";

import { useEffect, useState } from "react";

import { loadMeikyuuPackage, MEIKYUU_LOOK } from "@/lib/puzzles/meikyuu/browser";
import { decodeWay } from "@/lib/puzzles/meikyuu/steps";

import { MeikyuuFrame, MeikyuuHeld, type MeikyuuStand } from "./MeikyuuFrame";
import { MeikyuuSlot, useStand } from "./MeikyuuStand";

/** The side the frame is laid out for: a maze has no rows to letter, so only its rim depends on it (`MeikyuuBoard`). */
const FRAME_SIDE = 9;

/**
 * A MAZE DRAWN AND NOT PLAYED: its walls, its start and goal and keys, and, if a line is given, the line
 * (`way`, as the site keeps it: `steps.ts`), or the way through it when it is solved, in the colour of a win. The set-up's
 * preview of a level, a level looked at once it is solved, and a finished puzzle's page all draw it, in the wood
 * every board has (`PuzzleBoard`).
 *
 * The drawing is the package's (`drawMaze`, SVG text), made in the browser once the package has arrived
 * (`loadMeikyuuPackage`); until then the frame stands empty and square, so nothing moves. A shape that is not
 * square (a heart, a pyramid) is fitted inside the square paper and never cropped. A TALL level (two columns to
 * three rows) is drawn in a wood of that shape, stood up or lying on its side as the reader's room and choice say
 * (`useStand`), or in the one `stand` a caller fixes: the set-up's preview, which has a box of one size and so keeps
 * the maze upright in it.
 */
export function MeikyuuStill({
  code,
  way = null,
  solved = false,
  label,
  testId = "meikyuu-still",
  tall = false,
  stand: fixed,
}: {
  /** The maze, as a level's recipe. */
  code: string;
  /** A line drawn through it, as the site keeps one; with `solved` and none given, the way through is drawn. */
  way?: string | null;
  /** The maze is solved: its line, the way through, is drawn in the colour of a win. */
  solved?: boolean;
  label?: string;
  testId?: string;
  /** A tall level: its wood is two columns to three rows. */
  tall?: boolean;
  /** Held in this stand whatever the room: for a box that cannot change shape. */
  stand?: MeikyuuStand;
}) {
  const { column, stand: measured } = useStand(tall && fixed === undefined);
  const stand: MeikyuuStand = !tall ? "square" : (fixed ?? measured);
  const [drawn, setDrawn] = useState<{ code: string; svg: string } | null>(null);
  useEffect(() => {
    let live = true;
    void loadMeikyuuPackage().then(({ rules, draw }) => {
      if (!live) return;
      const recipe = rules.parseRecipe(code);
      if (recipe === null) return;
      const maze = rules.buildMaze(recipe);
      const path = way !== null && way !== "" ? (decodeWay(maze, way) ?? undefined) : solved ? rules.solutionOf(maze) : undefined;
      const turn = stand === "square" ? {} : { orientation: stand === "lying" ? ("landscape" as const) : ("portrait" as const) };
      setDrawn({ code, svg: draw.drawMaze(maze, { board: MEIKYUU_LOOK, path, won: solved && path !== undefined, standalone: true, label, ...turn }) });
    });
    return () => {
      live = false;
    };
  }, [code, way, solved, label, stand]);
  return (
    <div ref={column} className="w-full select-none" data-testid={testId} data-kind="meikyuu" data-stand={stand} data-drawn={drawn?.code === code ? "true" : "false"} data-wallpaper-focus={fixed === undefined && stand !== "square" ? undefined : ""}>
      <MeikyuuSlot stand={fixed === undefined ? stand : "square"}>
        {/* A held stand is in a box that is square and does not change: the wood is as tall as the box, so as wide as its shape makes it. */}
        <MeikyuuHeld stand={fixed === undefined ? "square" : stand}>
          <MeikyuuFrame size={FRAME_SIDE} stand={stand}>
            {/* The paper fills the frame's square whatever the maze's own shape is; the drawing sits in it, fitted. */}
            <div className="h-full w-full bg-[var(--mkl-paper,#fbf8f1)] [&_svg]:!h-full [&_svg]:!w-full" dangerouslySetInnerHTML={{ __html: drawn?.code === code ? drawn.svg : "" }} />
          </MeikyuuFrame>
        </MeikyuuHeld>
      </MeikyuuSlot>
    </div>
  );
}
