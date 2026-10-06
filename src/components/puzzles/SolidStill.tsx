"use client";

import { useEffect, useRef, useState } from "react";

import type { SolidMount } from "@johnmorrisdotca/meikyuu/3d/play";

import { loadSolidPackage, MEIKYUU_LOOK } from "@/lib/puzzles/meikyuu/browser";
import { encodeWay } from "@/lib/puzzles/meikyuu/way";

import { MeikyuuFrame } from "./MeikyuuFrame";

/** The side the frame is laid out for: a maze has no rows to letter, so only its rim depends on it (`MeikyuuBoard`). */
const FRAME_SIDE = 9;

/**
 * A MAZE OVER A SOLID LOOKED AT, NOT DRAWN ON: the live solid (the package's `mountSolid`), its start and goal, and, if a line is given, the line, or the way
 * through when it is `solved`, in the colour of a win. The set-up's preview of a level (`picture`: it takes no input at all, so the page scrolls over
 * it, and it stands in the one box the set-up keeps), and a level looked at once it is solved or a finished puzzle's page (turnable by a drag, and
 * nothing is drawn). In the wood every Meikyuu board is drawn on.
 */
export function SolidStill({ code, way = null, solved = false, testId = "meikyuu-still", picture = false }: { code: string; way?: string | null; solved?: boolean; testId?: string; picture?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const mount = useRef<SolidMount | null>(null);
  const [drawn, setDrawn] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const element = host.current;
    if (element === null) return;
    void loadSolidPackage().then(({ play }) => {
      if (!live) return;
      const board = play.mountSolid(element, { recipe: code, board: MEIKYUU_LOOK, controls: false, hints: false, language: "en", still: picture, draw: false, zoom: false });
      if (board === null) return;
      mount.current = board;
      const steps = way !== null && way !== "" ? way : solved ? encodeWay(code) : null;
      if (steps !== null) board.restore(steps);
      setDrawn(code);
    });
    return () => {
      live = false;
      mount.current?.destroy();
      mount.current = null;
    };
  }, [code, way, solved, picture]);
  return (
    <div className="w-full select-none" data-testid={testId} data-kind="meikyuu" data-solid="true" data-stand="square" data-drawn={drawn === code ? "true" : "false"} data-wallpaper-focus="">
      <MeikyuuFrame size={FRAME_SIDE}>
        <div ref={host} className="h-full w-full [&_.mk-banner]:hidden [&_.mk-box]:rounded-none [&_.mk-wrap]:h-full" data-testid={`${testId}-solid`} />
      </MeikyuuFrame>
    </div>
  );
}
