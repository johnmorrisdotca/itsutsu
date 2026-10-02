"use client";

import { useEffect, useState } from "react";

import { loadMeikyuuLevels, meikyuuLevelsAt, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";

import { MeikyuuStill } from "./MeikyuuStill";
import { MeikyuuBlank } from "./MeikyuuFrame";

/**
 * Meikyuu before it is chosen: the first level of the size, as the level screen draws it
 * (`MeikyuuStill`), with nothing to press. Loaded in the browser only (`PuzzleBoardPreview`):
 * the set-up page is drawn on a server, and a picture of a maze is not worth making there.
 */
export function MeikyuuPreview({ size }: { size: number }) {
  const [ready, setReady] = useState(meikyuuLevelsLoaded());
  useEffect(() => {
    let live = true;
    void loadMeikyuuLevels().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  const row = ready ? meikyuuLevelsAt(size)[0] : undefined;
  if (row === undefined) {
    return <MeikyuuBlank />;
  }
  return <MeikyuuStill key={`${size}`} code={row.code} testId="meikyuu-preview-maze" />;
}
