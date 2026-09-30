"use client";

import dynamic from "next/dynamic";

import { PLAY_BUTTON } from "@/components/ui/ui.constants";

import { HITOTSU_COPY } from "./hitotsu.constants";

/**
 * HITOTSU'S TABLE, ITS PLAY BUTTON AND ITS MY GAMES CARD, LOADED IN THE
 * BROWSER ONLY, as the card games' are (`cardTableClient.tsx`): all three read
 * a game kept in this browser, which the server cannot see, and loading them
 * here keeps the rules, the computer player and the deck's drawing out of the
 * server's functions. The page arrives with the table's room kept, and the
 * button reading Play, until the browser fills them.
 */
export const HitotsuTableClient = dynamic(() => import("./HitotsuTable").then((module) => module.HitotsuTable), {
  ssr: false,
  loading: () => <section className="min-h-[36rem]" data-testid="hitotsu-game" data-ready="false" aria-busy="true" />,
});

export const HitotsuOfferClient = dynamic(() => import("./HitotsuOffer").then((module) => module.HitotsuOffer), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col" data-testid="party-kind-offer" data-ready="false">
      <span className={PLAY_BUTTON} aria-hidden="true">
        {HITOTSU_COPY.playButton}
      </span>
    </div>
  ),
});

export const HitotsuCardClient = dynamic(() => import("./HitotsuCard").then((module) => module.HitotsuCard), { ssr: false });
