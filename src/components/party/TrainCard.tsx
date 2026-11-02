"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { TRAIN_PHASES } from "@johnmorrisdotca/domino";
import { seatedName } from "@/lib/party/partyNames";
import { PARTY_KINDS } from "@/lib/party/party.constants";

import { MarbleChip } from "./MarbleChip";
import { useKeptTrainGame } from "./trainStore";
import { partyScreenWords, trainSetShown, trainWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF MEXICAN TRAIN, WAITING IN MY GAMES. "Anything a person plays is
 * kept until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished.
 */
export function TrainCard() {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const TRAIN_COPY = trainWords(say.locale);
  const [game] = useKeptTrainGame();
  if (game === undefined || game === null || game.phase === TRAIN_PHASES.finished) return null;
  const variant = PARTY_KINDS.mexicanTrain;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {trainSetShown(game.set, say.locale)} · {TRAIN_COPY.round(game.round + 1, game.rounds)} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: seatedName(game, game.toPlay, say) })}
    </PartyTableCard>
  );
}
