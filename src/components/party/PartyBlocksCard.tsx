"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { BLOCKS_PARTY_VARIANT, BLOCKS_STATUS } from "@/lib/gomoku/party/partyBlocks";
import { partyPlayerName } from "@/lib/gomoku/party/partyRace";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { MarbleChip } from "./MarbleChip";
import { useKeptBlocksParty } from "./partyBlocksStore";
import { blocksWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * BLOCK FIVE FOR FOUR, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): the game is kept
 * in this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables. Only while it is going.
 */
export function PartyBlocksCard() {
  const say = useSpeaker();
  const PARTY_BLOCKS_COPY = blocksWords(say.locale);
  const [game] = useKeptBlocksParty();
  if (game === undefined || game === null || game.status !== BLOCKS_STATUS.playing) return null;
  const laid = game.moves.length;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="blocks-game">
      <GameThumb variant={BLOCKS_PARTY_VARIANT} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_BLOCKS_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={BLOCKS_PARTY_VARIANT} /> {say.say("party.blocks.forFour")} · {say.count("party.blocks.cardLaid", laid)} ·
          <MarbleChip player={game.toPlay} />
          {say.say("party.toPlay", { name: partyPlayerName(game.players, game.toPlay, say) })}
        </span>
      </div>
      <Link href={passAndPlayPath(BLOCKS_PARTY_VARIANT)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="blocks-game-continue">
        {PARTY_BLOCKS_COPY.resume} →
      </Link>
    </div>
  );
}
