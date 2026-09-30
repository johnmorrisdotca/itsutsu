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
import { ONLINE_COPY } from "./online/online.constants";
import { TenkaOffer } from "./tenka/TenkaOffer";
import { TenkaTable } from "./tenka/TenkaTable";
import { CARD_TABLE_COPY } from "./cards/cardTable.constants";
import { BigTwoCard, BigTwoOffer, BigTwoTable, CrazyEightsCard, CrazyEightsOffer, CrazyEightsTable, CribbageCard, CribbageOffer, CribbageTable, EuchreCard, EuchreOffer, EuchreTable, GinRummyCard, GinRummyOffer, GinRummyTable, GoFishCard, GoFishOffer, GoFishTable, HeartsCard, HeartsOffer, HeartsTable, PresidentCard, PresidentOffer, PresidentTable, SpadesCard, SpadesOffer, SpadesTable } from "./cards/cardTableClient";
import { CARD_GAME_DISPLAY } from "@/lib/cardGames/cardGames.copy";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { TrainCardClient, TrainGameClient } from "./trainClient";
import { TrainOffer } from "./TrainOffer";
import { HITOTSU_COPY } from "./hitotsu/hitotsu.constants";
import { HitotsuCardClient, HitotsuOfferClient, HitotsuTableClient } from "./hitotsu/hitotsuClient";

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
    lead: ONLINE_COPY.tenkaLead,
    Game: TenkaTable,
    Offer: TenkaOffer,
    Card: TenkaCard,
  },
  mexicanTrain: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: ONLINE_COPY.trainLead,
    // Loaded in the browser only (`trainClient.tsx`): the kept game is the browser's, and the rules stay out of the server's bundle.
    Game: TrainGameClient,
    Offer: TrainOffer,
    Card: TrainCardClient,
  },
  // The family card games, one table for all five (`cards/CardGameTable.tsx`), loaded in the browser only.
  hearts: cardTable("hearts", HeartsTable, HeartsOffer, HeartsCard),
  bigTwo: cardTable("bigTwo", BigTwoTable, BigTwoOffer, BigTwoCard),
  president: cardTable("president", PresidentTable, PresidentOffer, PresidentCard),
  goFish: cardTable("goFish", GoFishTable, GoFishOffer, GoFishCard),
  crazyEights: cardTable("crazyEights", CrazyEightsTable, CrazyEightsOffer, CrazyEightsCard),
  // Its own deck and its own table (`hitotsu/`), loaded in the browser only, as the card games' are.
  hitotsu: {
    title: PARTY_COPY.title,
    kanji: PARTY_COPY.kanji,
    lead: HITOTSU_COPY.lead,
    Game: HitotsuTableClient,
    Offer: HitotsuOfferClient,
    Card: HitotsuCardClient,
  },
  spades: cardTable("spades", SpadesTable, SpadesOffer, SpadesCard),
  ginRummy: cardTable("ginRummy", GinRummyTable, GinRummyOffer, GinRummyCard),
  euchre: cardTable("euchre", EuchreTable, EuchreOffer, EuchreCard),
  cribbage: cardTable("cribbage", CribbageTable, CribbageOffer, CribbageCard),
};

/** A card game's row: the pass-and-play title every table shares, its own lead, and its three components. */
function cardTable(kind: CardGameKind, Game: PartyTable["Game"], Offer: PartyTable["Offer"], Card: ComponentType): PartyTable & { Card: ComponentType } {
  return { title: PARTY_COPY.title, kanji: PARTY_COPY.kanji, lead: CARD_TABLE_COPY.lead(CARD_GAME_DISPLAY[kind].label), Game, Offer, Card };
}
