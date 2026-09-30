"use client";

import dynamic from "next/dynamic";

/**
 * THE DICE ROLLER, LOADED IN THE BROWSER ONLY, as the card and dice tables are
 * (`yachtClient.tsx`): every roll, the history and the stats live in this
 * browser and the server has nothing to draw, so loading it here keeps
 * Korokoro's package out of the pages' server function
 * (`pageFunction.coverage.test.ts`), and the page arrives with the tray's room
 * kept until the browser fills it.
 */
export const DiceRollerClient = dynamic(() => import("./DiceRoller").then((module) => module.DiceRoller), {
  ssr: false,
  loading: () => <div className="min-h-[640px]" data-testid="dice-roller" data-ready="false" aria-busy="true" />,
});
