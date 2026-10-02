"use client";

import { useEffect } from "react";

import type { LookChoice } from "@/lib/puzzles/meikyuu/look";

import { seedLook } from "./meikyuuLookStore";

/**
 * THE ACCOUNT'S COLOURS, handed to the store by a page that read them (`preferencesFor`),
 * and whether a choice made here is to be written back. Draws nothing.
 */
export function MeikyuuLookSeed({ initial, saves }: { initial: Partial<LookChoice>; saves: boolean }) {
  const { frame, paper, ink } = initial;
  useEffect(() => {
    seedLook({ ...(frame === undefined ? {} : { frame }), ...(paper === undefined ? {} : { paper }), ...(ink === undefined ? {} : { ink }) }, saves);
  }, [frame, paper, ink, saves]);
  return null;
}
