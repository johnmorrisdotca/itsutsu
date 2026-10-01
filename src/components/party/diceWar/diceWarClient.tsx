"use client";

import dynamic from "next/dynamic";

import { PLAY_BUTTON } from "@/components/ui/ui.constants";

import { DICE_WAR_COPY } from "./diceWar.constants";

/**
 * DICE WAR'S TABLE, ITS PLAY BUTTON AND ITS MY GAMES CARD, LOADED IN THE
 * BROWSER ONLY, as the card games' are (`cardTableClient.tsx`): all three read a
 * game kept in this browser, which the server cannot see, so loading them here
 * keeps Korokoro's package out of the pages' server function, and the page
 * arrives with the table's room kept, and the button reading Play, until the
 * browser fills them.
 */
export const DiceWarTableClient = dynamic(() => import("./DiceWarTable").then((module) => module.DiceWarTable), {
  ssr: false,
  loading: () => <section className="min-h-[32rem]" data-testid="dicewar-table" data-ready="false" aria-busy="true" />,
});

export const DiceWarOfferClient = dynamic(() => import("./DiceWarOffer").then((module) => module.DiceWarOffer), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col" data-testid="party-kind-offer" data-ready="false">
      {/* The button's room and words, not yet a link: the browser has not said whether a game is going. */}
      <span className={PLAY_BUTTON} aria-hidden="true">
        {DICE_WAR_COPY.play}
      </span>
    </div>
  ),
});

export const DiceWarCardClient = dynamic(() => import("./DiceWarCard").then((module) => module.DiceWarCard), { ssr: false });
