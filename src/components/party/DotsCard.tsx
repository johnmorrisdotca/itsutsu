"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { DOTS_STATUS, dotsLineCount, dotsPlayerName } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";

import { MarbleChip } from "./MarbleChip";
import { useKeptDotsGame } from "./dotsStore";
import { dotsWords, partyScreenWords } from "./partyWords";

/**
 * A GAME OF DOTS AND BOXES, WAITING IN MY GAMES. "Anything a person plays is
 * kept until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going;
 * a finished one has nothing left to come back to.
 */
export function DotsCard() {
  const say = useSpeaker();
  const DOTS_COPY = dotsWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptDotsGame();
  if (game === undefined || game === null || game.status !== DOTS_STATUS.playing) return null;
  const variant = PARTY_KINDS.dotsAndBoxes;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {say.count("count.player", game.players.length)} · {DOTS_COPY.drawn(game.lines.length, dotsLineCount(game.size))} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: dotsPlayerName(game, game.toPlay, say) })}
    </PartyTableCard>
  );
}
