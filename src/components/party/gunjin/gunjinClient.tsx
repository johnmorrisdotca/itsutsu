"use client";

import dynamic from "next/dynamic";

import { gunjinWords } from "@/components/party/partyWords";
import { PlayLoading } from "@/components/party/PlayLoading";


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
  loading: () => <PlayLoading label={(locale) => gunjinWords(locale).play} />,
});

export const GunjinCardClient = dynamic(() => import("./GunjinCard").then((module) => module.GunjinCard), { ssr: false });
