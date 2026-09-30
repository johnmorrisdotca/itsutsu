"use client";

import dynamic from "next/dynamic";

/**
 * YACHT'S TABLE AND ITS MY GAMES CARD, LOADED IN THE BROWSER ONLY, as Mexican
 * Train's are (`trainClient.tsx`): both read a game kept in this browser,
 * which the server cannot see, so loading them here keeps the rules and the
 * computer player out of the server's bundle, and the page arrives with the
 * table's room kept until the browser fills it.
 */
export const YachtTableClient = dynamic(() => import("./YachtTable").then((module) => module.YachtTable), {
  ssr: false,
  loading: () => <section className="min-h-[32rem]" data-testid="yacht-table" data-ready="false" aria-busy="true" />,
});

export const YachtCardClient = dynamic(() => import("./YachtCard").then((module) => module.YachtCard), { ssr: false });
