"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { MANCALA_RULE_NAMES } from "@/lib/party/mancala/mancala.constants";
import { MANCALA_STATUS } from "@/lib/party/mancala/mancala";
import { partyPlayerName } from "@/lib/party/partyNames";
import { PARTY_KINDS } from "@/lib/party/party.constants";

import { MarbleChip } from "./MarbleChip";
import { useKeptMancalaGame } from "./mancalaStore";
import { mancalaWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF MANCALA, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going;
 * a finished one has nothing left to come back to.
 */
export function MancalaCard() {
  const say = useSpeaker();
  const MANCALA_COPY = mancalaWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptMancalaGame();
  if (game === undefined || game === null || game.status !== MANCALA_STATUS.playing) return null;
  const variant = PARTY_KINDS.mancala;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {MANCALA_RULE_NAMES[game.ruleSet]} · {MANCALA_COPY.sowings(game.moves.length)} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: partyPlayerName(game, game.toPlay, say) })}
    </PartyTableCard>
  );
}
