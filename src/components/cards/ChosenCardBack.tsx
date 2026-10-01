"use client";

import { cardBackUrl } from "@johnmorrisdotca/toranpu/card-backs";

import { CardBack } from "./CardBack";
import { CARD_BOX } from "./Cards.constants";
import { useCardBackChoice } from "./cardBackChoice";
import type { CardBackChoice } from "./cards.types";

const drawn = new Map<string, string>();

/** One of Toranpu's backs as a picture, drawn once a page and kept. */
function toranpuBack(name: Exclude<CardBackChoice, "itsutsu">): string {
  const kept = drawn.get(name);
  if (kept !== undefined) return kept;
  const url = cardBackUrl(name);
  drawn.set(name, url);
  return url;
}

/** A back, by its choice, inside a card's 100 by 140 drawing: the Itsutsu back (`CardBack`), or one of Toranpu's. */
export function CardBackOf({ back }: { back: CardBackChoice }) {
  if (back === "itsutsu") return <CardBack />;
  return <image href={toranpuBack(back)} x={0} y={0} width={CARD_BOX.width} height={CARD_BOX.height} data-card-back={back} />;
}

/** The back this reader chose (`useCardBackChoice`), on a card that names none of its own. */
export function ChosenCardBack() {
  const { back } = useCardBackChoice();
  return <CardBackOf back={back} />;
}
