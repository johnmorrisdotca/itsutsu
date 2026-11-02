"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { YACHT_PHASES, boxesFilled } from "@/lib/party/yacht/yacht";
import { YACHT_SHEET } from "@/lib/party/yacht/yacht.constants";

import { MarbleChip } from "../MarbleChip";
import { useKeptYachtGame } from "./yachtStore";
import { partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";

/**
 * A GAME OF YACHT, WAITING IN MY GAMES. "Anything a person plays is kept until
 * it is finished, and waits in My games" (AGENTS.md): it is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the other tables' games. Only while it is not finished.
 */
export function YachtCard() {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptYachtGame();
  if (game === undefined || game === null || game.phase === YACHT_PHASES.finished) return null;
  const variant = PARTY_KINDS.yacht;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {say.say("party.yacht.turnOf", { n: String(boxesFilled(game, game.toPlay) + 1), total: String(YACHT_SHEET) })} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: seatedName(game, game.toPlay, say) })}
    </PartyTableCard>
  );
}
