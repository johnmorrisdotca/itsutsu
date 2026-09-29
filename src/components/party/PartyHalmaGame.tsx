"use client";

import { PartyGameCard } from "./PartyGameCard";
import { PartyOffer } from "./PartyOffer";
import { PartyRaceGame } from "./PartyRaceGame";
import type { PartyTableGameProps } from "./party.types";
import { HALMA_RACE } from "./partyRaces";

/**
 * HALMA'S TABLE, for four (or two) racing corner to corner: the shared race
 * screens bound to its own rules, square board and store (`HALMA_RACE`). Its
 * row in `PARTY_TABLES` plays it and offers it; My games lists it with its card.
 */
export function PartyHalmaGame(props: PartyTableGameProps) {
  return <PartyRaceGame kind={HALMA_RACE} {...props} />;
}

/** The way in, on Halma's page, and the way back to a game going. */
export function PartyHalmaOffer({ href }: { href: string }) {
  return <PartyOffer kind={HALMA_RACE} href={href} />;
}

/** The game going, on My games' Pass and play tab. */
export function PartyHalmaCard() {
  return <PartyGameCard kind={HALMA_RACE} />;
}
