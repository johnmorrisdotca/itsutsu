"use client";

import dynamic from "next/dynamic";

/**
 * `CasualBoard` loaded in the browser only.
 *
 * The package draws on a canvas and steps its physics with the display, none of
 * which a server render can do or should pay for; `ssr: false` is allowed in a
 * client component and not in a server one, which is why this file is the one
 * line it is. The page arrives with the board's room kept, and the browser
 * fills it. The package is also kept out of every page that does not play a
 * casual game this way (the function-size gate in AGENTS.md).
 */
export const CasualBoardClient = dynamic(() => import("./CasualBoard").then((module) => module.CasualBoard), {
  ssr: false,
  loading: () => <div className="aspect-[4/5] w-full rounded-md border border-rule bg-ivory" data-testid="casual-board" data-ready="false" aria-busy="true" />,
});
