"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PLAY_BUTTON } from "@/components/ui/ui.constants";
import { SUGOROKU_KIND_LIST, type SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";

import type { PartyTableGameProps } from "../party.types";
import { SUGOROKU_COPY } from "./sugoroku.constants";

/**
 * THE SEVEN'S TABLE, PLAY BUTTON AND MY GAMES CARD, LOADED IN THE BROWSER ONLY,
 * as the card games' are (`cardTableClient.tsx`): all three read a game kept in
 * this browser, which the server cannot see, and loading them here keeps
 * Sugoroku's rules, its computer player and its drawing out of the pages'
 * server function. A page arrives with the table's room kept, and the button
 * reading Play, until the browser fills them. One component each for all seven,
 * given the game they are for.
 */
const Table = dynamic(() => import("./SugorokuTable").then((module) => module.SugorokuTable), {
  ssr: false,
  loading: () => <section className="min-h-[36rem]" data-testid="sugoroku-game" data-ready="false" aria-busy="true" />,
});

const Offer = dynamic(() => import("./SugorokuOffer").then((module) => module.SugorokuOffer), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col" data-testid="party-kind-offer" data-ready="false">
      <span className={PLAY_BUTTON} aria-hidden="true">
        {SUGOROKU_COPY.play} →
      </span>
    </div>
  ),
});

const Card = dynamic(() => import("./SugorokuCard").then((module) => module.SugorokuCard), { ssr: false });

/** One game's three components, each made once so a table is the same component from one render to the next. */
function componentsFor(kind: SugorokuKind): { Game: ComponentType<PartyTableGameProps>; Offer: ComponentType<{ href: string }>; Card: ComponentType } {
  return {
    Game: function SugorokuGameTable(props: PartyTableGameProps) {
      return <Table kind={kind} {...props} />;
    },
    Offer: function SugorokuGameOffer(props: { href: string }) {
      return <Offer kind={kind} {...props} />;
    },
    Card: function SugorokuGameCard() {
      return <Card kind={kind} />;
    },
  };
}

/** Every one's components, by kind. */
export const SUGOROKU_COMPONENTS = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, componentsFor(kind)])) as Record<SugorokuKind, ReturnType<typeof componentsFor>>;
