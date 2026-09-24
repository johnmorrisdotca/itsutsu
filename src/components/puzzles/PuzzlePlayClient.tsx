"use client";

import dynamic from "next/dynamic";

/**
 * `PuzzlePlay` loaded in the browser only.
 *
 * The solve makes its puzzle in render, and a server render of it would be
 * the server making the puzzle — the one cost this family exists not to
 * have. `ssr: false` is allowed in a client component and not in a server
 * one, which is why this file is the one line it is. The page arrives with
 * "making your puzzle" in the grid's place and the browser fills it.
 */
export const PuzzlePlayClient = dynamic(() => import("./PuzzlePlay").then((module) => module.PuzzlePlay), {
  ssr: false,
  loading: () => (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-ready="false">
      <div className="flex aspect-square w-full items-center justify-center rounded-md border border-rule text-sm text-muted" data-testid="puzzle-making">
        Making your puzzle…
      </div>
    </section>
  ),
});
