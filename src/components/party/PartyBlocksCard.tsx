"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

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
    <PartyTableCard thumb={BLOCKS_PARTY_VARIANT} heading={PARTY_BLOCKS_COPY.card} href={passAndPlayPath(BLOCKS_PARTY_VARIANT)} resume={PARTY_BLOCKS_COPY.resume} testId="blocks-game" continueTestId="blocks-game-continue">
      <GameName variant={BLOCKS_PARTY_VARIANT} /> {say.say("party.blocks.forFour")} · {say.count("party.blocks.cardLaid", laid)} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: partyPlayerName(game.players, game.toPlay, say) })}
    </PartyTableCard>
  );
}
