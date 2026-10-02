import type { ComponentType } from "react";

import { SUGOROKU_KIND_LIST, type SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";

import type { PartyTableGameProps } from "../party.types";
import { SugorokuCardClient, SugorokuOfferClient, SugorokuTableClient } from "./sugorokuClient";

/**
 * One game's three components, each made once so a table is the same component
 * from one render to the next. Not a client module: a client module's exports
 * are references the server cannot read into, so the closures that say which
 * game they are for are made here and hand the game to the browser-only
 * components (`sugorokuClient.tsx`) as a prop.
 */
function componentsFor(kind: SugorokuKind): { Game: ComponentType<PartyTableGameProps>; Offer: ComponentType<{ href: string }>; Card: ComponentType } {
  return {
    Game: function SugorokuGameTable(props: PartyTableGameProps) {
      return <SugorokuTableClient kind={kind} {...props} />;
    },
    Offer: function SugorokuGameOffer(props: { href: string }) {
      return <SugorokuOfferClient kind={kind} {...props} />;
    },
    Card: function SugorokuGameCard() {
      return <SugorokuCardClient kind={kind} />;
    },
  };
}

/** Every one's components, by kind. */
export const SUGOROKU_COMPONENTS = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, componentsFor(kind)])) as Record<SugorokuKind, ReturnType<typeof componentsFor>>;
