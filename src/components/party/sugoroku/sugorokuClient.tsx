"use client";

import dynamic from "next/dynamic";

import { sugorokuScreenWords } from "@/components/party/partyWords";
import { PlayLoading } from "@/components/party/PlayLoading";


/**
 * THE SEVEN'S TABLE, PLAY BUTTON AND MY GAMES CARD, LOADED IN THE BROWSER ONLY,
 * as the card games' are (`cardTableClient.tsx`): all three read a game kept in
 * this browser, which the server cannot see, and loading them here keeps
 * Sugoroku's rules, its computer player and its drawing out of the pages'
 * server function. A page arrives with the table's room kept, and the button
 * reading Play, until the browser fills them. One component each for all seven,
 * given the game they are for.
 */
export const SugorokuTableClient = dynamic(() => import("./SugorokuTable").then((module) => module.SugorokuTable), {
  ssr: false,
  loading: () => <section className="min-h-[36rem]" data-testid="sugoroku-game" data-ready="false" aria-busy="true" />,
});

export const SugorokuOfferClient = dynamic(() => import("./SugorokuOffer").then((module) => module.SugorokuOffer), {
  ssr: false,
  loading: () => <PlayLoading label={(locale) => `${sugorokuScreenWords(locale).play} →`} />,
});

export const SugorokuCardClient = dynamic(() => import("./SugorokuCard").then((module) => module.SugorokuCard), { ssr: false });
