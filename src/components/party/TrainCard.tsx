"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
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
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {trainSetShown(game.set, say.locale)} · {TRAIN_COPY.round(game.round + 1, game.rounds)} ·
          <MarbleChip player={game.toPlay} />
          {say.say("party.toPlay", { name: seatedName(game, game.toPlay, say) })}
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
