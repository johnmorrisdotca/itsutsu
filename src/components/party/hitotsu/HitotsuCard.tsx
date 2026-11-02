"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";

import { seatName } from "../cards/cardAdapters";
import { MarbleChip } from "../MarbleChip";
import { useKeptHitotsu } from "./hitotsuStore";
import { hitotsuScreenWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF HITOTSU, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished.
 */
export function HitotsuCard() {
  const say = useSpeaker();
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptHitotsu();
  if (game === undefined || game === null || game.phase === "over" || game.toPlay === null) return null;
  const variant = PARTY_KINDS.hitotsu;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {HITOTSU_COPY.cards(game.hands[game.toPlay]?.length ?? 0)} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: seatName(game.players, game.computers, game.toPlay, say) })}
    </PartyTableCard>
  );
}
