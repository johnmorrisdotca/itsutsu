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
import { dotsWords, ghostWords, mancalaWords, onlineWords, partyScreenWords, cardTableWords, sugorokuScreenWords, yachtWords, pachisiWords, diceWarScreenWords, gunjinWords, hitotsuScreenWords } from "./partyWords";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import type { Locale } from "@/lib/i18n/i18n.types";
import type { PartyTable } from "./party.types";
import { TenkaCard } from "./tenka/TenkaCard";
import { TenkaOffer } from "./tenka/TenkaOffer";
import { TenkaTable } from "./tenka/TenkaTable";
import { BigTwoCard, BigTwoOffer, BigTwoTable, CrazyEightsCard, CrazyEightsOffer, CrazyEightsTable, CribbageCard, CribbageOffer, CribbageTable, EuchreCard, EuchreOffer, EuchreTable, GinRummyCard, GinRummyOffer, GinRummyTable, GoFishCard, GoFishOffer, GoFishTable, HeartsCard, HeartsOffer, HeartsTable, OhHellCard, OhHellOffer, OhHellTable, PresidentCard, PresidentOffer, PresidentTable, SpadesCard, SpadesOffer, SpadesTable, WarCard, WarOffer, WarTable } from "./cards/cardTableClient";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { TrainCardClient, TrainGameClient } from "./trainClient";
import { TrainOffer } from "./TrainOffer";
import { PachisiCardClient, PachisiTableClient } from "./pachisi/pachisiClient";
import { PachisiOffer } from "./pachisi/PachisiOffer";
import { YachtCardClient, YachtTableClient } from "./yacht/yachtClient";
import { YachtOffer } from "./yacht/YachtOffer";
import { GunjinCardClient, GunjinOfferClient, GunjinTableClient } from "./gunjin/gunjinClient";
import { DiceWarCardClient, DiceWarOfferClient, DiceWarTableClient } from "./diceWar/diceWarClient";
import { HitotsuCardClient, HitotsuOfferClient, HitotsuTableClient } from "./hitotsu/hitotsuClient";
import { SUGOROKU_COMPONENTS } from "./sugoroku/sugorokuRows";
import { SUGOROKU_KIND_LIST, type SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";

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
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: dotsWords(locale).lead }),
    Game: DotsGame,
    Offer: DotsOffer,
    Card: DotsCard,
  },
  superghost: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: ghostWords(locale).lead }),
    Game: GhostGame,
    Offer: GhostOffer,
    Card: GhostCard,
  },
  mancala: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: mancalaWords(locale).lead }),
    Game: MancalaGame,
    Offer: MancalaOffer,
    Card: MancalaCard,
  },
  tenka: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: onlineWords(locale).tenkaLead }),
    Game: TenkaTable,
    Offer: TenkaOffer,
    Card: TenkaCard,
  },
  mexicanTrain: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: onlineWords(locale).trainLead }),
    // Loaded in the browser only (`trainClient.tsx`): the kept game is the browser's, and the rules stay out of the server's bundle.
    Game: TrainGameClient,
    Offer: TrainOffer,
    Card: TrainCardClient,
  },
  yacht: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: yachtWords(locale).lead }),
    // Loaded in the browser only (`yachtClient.tsx`), as Mexican Train's table is.
    Game: YachtTableClient,
    Offer: YachtOffer,
    Card: YachtCardClient,
  },
  pachisi: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: pachisiWords(locale).lead }),
    // Loaded in the browser only (`pachisiClient.tsx`), as Yacht's table is.
    Game: PachisiTableClient,
    Offer: PachisiOffer,
    Card: PachisiCardClient,
  },
  diceWar: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: diceWarScreenWords(locale).lead }),
    // Loaded in the browser only (`diceWarClient.tsx`), as the card games' tables are: Korokoro stays out of the server's function.
    Game: DiceWarTableClient,
    Offer: DiceWarOfferClient,
    Card: DiceWarCardClient,
  },
  // Hidden-rank games for two (`gunjin/`), loaded in the browser only, as the card games' are: the package's engine stays out of the server's function.
  gunjin: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: gunjinWords(locale).lead }),
    Game: GunjinTableClient,
    Offer: GunjinOfferClient,
    Card: GunjinCardClient,
  },
  // The family card games, one table for all five (`cards/CardGameTable.tsx`), loaded in the browser only.
  hearts: cardTable("hearts", HeartsTable, HeartsOffer, HeartsCard),
  bigTwo: cardTable("bigTwo", BigTwoTable, BigTwoOffer, BigTwoCard),
  president: cardTable("president", PresidentTable, PresidentOffer, PresidentCard),
  goFish: cardTable("goFish", GoFishTable, GoFishOffer, GoFishCard),
  crazyEights: cardTable("crazyEights", CrazyEightsTable, CrazyEightsOffer, CrazyEightsCard),
  // Its own deck and its own table (`hitotsu/`), loaded in the browser only, as the card games' are.
  hitotsu: {
    words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: hitotsuScreenWords(locale).lead }),
    Game: HitotsuTableClient,
    Offer: HitotsuOfferClient,
    Card: HitotsuCardClient,
  },
  // The seven backgammon games, one table for all (`sugoroku/`), loaded in the browser only, as the card games' are.
  ...(Object.fromEntries(
    SUGOROKU_KIND_LIST.map((kind) => [
      kind,
      { words: (locale: Locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: sugorokuScreenWords(locale).lead(gameCopyFor(kind, locale).label) }), ...SUGOROKU_COMPONENTS[kind] },
    ]),
  ) as Record<SugorokuKind, PartyTable & { Card: ComponentType }>),
  spades: cardTable("spades", SpadesTable, SpadesOffer, SpadesCard),
  ginRummy: cardTable("ginRummy", GinRummyTable, GinRummyOffer, GinRummyCard),
  euchre: cardTable("euchre", EuchreTable, EuchreOffer, EuchreCard),
  cribbage: cardTable("cribbage", CribbageTable, CribbageOffer, CribbageCard),
  ohHell: cardTable("ohHell", OhHellTable, OhHellOffer, OhHellCard),
  war: cardTable("war", WarTable, WarOffer, WarCard),
};

/** A card game's row: the pass-and-play title every table shares, its own lead, and its three components. */
function cardTable(kind: CardGameKind, Game: PartyTable["Game"], Offer: PartyTable["Offer"], Card: ComponentType): PartyTable & { Card: ComponentType } {
  return { words: (locale) => ({ title: partyScreenWords(locale).title, kanji: partyScreenWords(locale).kanji, lead: cardTableWords(locale).lead(gameCopyFor(kind, locale).label) }), Game, Offer, Card };
}
