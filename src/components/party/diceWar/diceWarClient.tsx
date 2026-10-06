"use client";

import dynamic from "next/dynamic";

import { diceWarScreenWords } from "@/components/party/partyWords";
import { PlayLoading } from "@/components/party/PlayLoading";


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
  loading: () => <PlayLoading label={(locale) => diceWarScreenWords(locale).play} />,
});

export const DiceWarCardClient = dynamic(() => import("./DiceWarCard").then((module) => module.DiceWarCard), { ssr: false });
