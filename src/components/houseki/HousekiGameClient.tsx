"use client";

import dynamic from "next/dynamic";

import type { HousekiKind } from "@/lib/houseki/houseki.types";

import type { HousekiGameProps } from "./housekiRuntime";

/**
 * A HOUSEKI GAME LOADED IN THE BROWSER ONLY, each by itself.
 *
 * The package's engines and its levels (some hundreds of kilobytes of boards and
 * winning plays) are for the player's browser: a server render has nothing to
 * play, and a page that did not play a game should not carry another's levels
 * (the function-size gate in AGENTS.md). `ssr: false` is allowed in a client
 * component and not in a server one, which is why these are lines of their own;
 * the page arrives with the board's room kept, and the browser fills it.
 */
const BOX = (
  <div className="mx-auto aspect-[3/4] w-full max-w-[22rem] rounded-md border border-rule bg-ivory" data-testid="houseki-board-loading" aria-busy="true" />
);

const GAMES: Record<HousekiKind, React.ComponentType<HousekiGameProps>> = {
  fallingTriplets: dynamic(() => import("./FallingTripletsGame"), { ssr: false, loading: () => BOX }),
  colourChains: dynamic(() => import("./ColourChainsGame"), { ssr: false, loading: () => BOX }),
  stoneCollapse: dynamic(() => import("./StoneCollapseGame"), { ssr: false, loading: () => BOX }),
  gemSwap: dynamic(() => import("./GemSwapGame"), { ssr: false, loading: () => BOX }),
  magneticBlocks: dynamic(() => import("./MagneticBlocksGame"), { ssr: false, loading: () => BOX }),
};

/** The game of this kind, drawn in the browser. */
export function HousekiGameClient({ kind, ...props }: HousekiGameProps & { kind: HousekiKind }) {
  const Game = GAMES[kind];
  return <Game {...props} />;
}
