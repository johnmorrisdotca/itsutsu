"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { gameNameFor } from "@/lib/catalogue/gameKeys";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";

import { DICE_TABLE_STORES } from "./diceTableStores";

/** THE PLAY BUTTON on a dice game's own page and its rules page: Play, or where this browser holds a game still going, Continue with a New game beside it that says what it ends. */
export function DiceTableOffer({ kind, href }: { kind: DiceTableKind; href: string }) {
  const say = useSpeaker();
  const [game, keep] = DICE_TABLE_STORES[kind].useKept();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={say.say("party.dice.playGame", { game: gameNameFor(kind, say) })} />;
}
