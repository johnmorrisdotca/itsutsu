"use client";

import dynamic from "next/dynamic";

import { PLAY_BUTTON } from "@/components/ui/ui.constants";

import { GUNJIN_COPY } from "./gunjin.constants";

/**
 * GUNJIN'S TABLE, PLAY BUTTON AND MY GAMES CARD, LOADED IN THE BROWSER ONLY, as
 * the card games' and Hitotsu's are: all three read a game kept in this
 * browser, which the server cannot see, and loading them here keeps the
 * package's engine and drawing out of the pages' server function. A page
 * arrives with the table's room kept, and the button reading Play, until the
 * browser fills them.
 */
export const GunjinTableClient = dynamic(() => import("./GunjinTable").then((module) => module.GunjinTable), {
  ssr: false,
  loading: () => <section className="min-h-[36rem]" data-testid="gunjin-game" data-ready="false" aria-busy="true" />,
});

export const GunjinOfferClient = dynamic(() => import("./GunjinOffer").then((module) => module.GunjinOffer), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col" data-testid="party-kind-offer" data-ready="false">
      <span className={PLAY_BUTTON} aria-hidden="true">
        {GUNJIN_COPY.play}
      </span>
    </div>
  ),
});

export const GunjinCardClient = dynamic(() => import("./GunjinCard").then((module) => module.GunjinCard), { ssr: false });
