"use client";

import dynamic from "next/dynamic";

/** The guide's room before it is drawn, so the page does not jump when it arrives. */
function Waiting() {
  return <div className="min-h-[60rem]" data-testid="suido-guide-waiting" aria-hidden="true" />;
}

/**
 * THE GUIDE TO SUIDO'S PIECES, LOADED IN THE BROWSER ONLY: it draws with the package and lists 699 shapes' worth of families, which no page's server
 * function should carry (`functions:size`, `pageFunction.coverage.test.ts`), as a party table is loaded with `ssr: false`.
 */
export const SuidoPieceGuideLazy = dynamic(() => import("./SuidoPieceGuide").then((module) => module.SuidoPieceGuide), { ssr: false, loading: Waiting });
