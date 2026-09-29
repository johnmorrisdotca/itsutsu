"use client";

import { PartyGameCard } from "./PartyGameCard";
import { PartyOffer } from "./PartyOffer";
import { PartyRaceGame } from "./PartyRaceGame";
import type { PartyTableGameProps } from "./party.types";
import { CHECKERS_RACE } from "./partyRaces";

/**
 * CHINESE CHECKERS' TABLE, for two to six round the star: the shared race
 * screens bound to its own rules, star and store (`CHECKERS_RACE`). Its row in
 * `PARTY_TABLES` plays it and offers it; My games lists it with its card.
 */
export function PartyCheckersGame(props: PartyTableGameProps) {
  return <PartyRaceGame kind={CHECKERS_RACE} {...props} />;
}

/** The way in, on Chinese Checkers' page, and the way back to a game going. */
export function PartyCheckersOffer({ href }: { href: string }) {
  return <PartyOffer kind={CHECKERS_RACE} href={href} />;
}

/** The game going, on My games' Pass and play tab. */
export function PartyCheckersCard() {
  return <PartyGameCard kind={CHECKERS_RACE} />;
}
