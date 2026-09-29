import type { ComponentType } from "react";

import type { PartyKind } from "@/lib/party/party.types";

import { DotsCard } from "./DotsCard";
import { DotsGame } from "./DotsGame";
import { DotsOffer } from "./DotsOffer";
import { GhostCard } from "./GhostCard";
import { GhostGame } from "./GhostGame";
import { GhostOffer } from "./GhostOffer";
import { MancalaCard } from "./MancalaCard";
import { MancalaGame } from "./MancalaGame";
import { MancalaOffer } from "./MancalaOffer";
import { DOTS_COPY, GHOST_COPY, MANCALA_COPY, PARTY_COPY } from "./party.constants";
import type { PartyTable } from "./party.types";
import { TenkaCard } from "./tenka/TenkaCard";
import { TENKA_COPY } from "./tenka/tenka.constants";
import { TenkaOffer } from "./tenka/TenkaOffer";
import { TenkaTable } from "./tenka/TenkaTable";

/**
 * EACH PARTY GAME'S TABLE, one row a `PartyKind`: what its table page at
 * `/games/<slug>/pass-and-play` is called and says first, the component that
 * plays it, the big Play on its own page, and the row that waits on My games'
 * Pass and play tab while one is going. A `Record`, so a new party game does
 * not compile until it has all four — the way `PARTY_TABLES` is the same
 * table for the pass-and-play modes of the rule variants.
 */
export const PARTY_KIND_TABLES: Record<PartyKind, PartyTable & { Card: ComponentType }> = {
  dotsAndBoxes: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: DOTS_COPY.lead,
    Game: DotsGame,
    Offer: DotsOffer,
    Card: DotsCard,
  },
  superghost: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: GHOST_COPY.lead,
    Game: GhostGame,
    Offer: GhostOffer,
    Card: GhostCard,
  },
  mancala: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: MANCALA_COPY.lead,
    Game: MancalaGame,
    Offer: MancalaOffer,
    Card: MancalaCard,
  },
  tenka: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: TENKA_COPY.lead,
    Game: TenkaTable,
    Offer: TenkaOffer,
    Card: TenkaCard,
  },
};
