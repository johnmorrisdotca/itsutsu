"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { diceWarSeatName } from "@/lib/party/diceWar/diceWar.constants";
import { waitsOnPerson } from "@/lib/party/diceWar/diceWarThrow";

import { useKeptDiceWarGame } from "./diceWarStore";
import { diceWarScreenWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF DICE WAR, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the other tables' games. Only while it is not finished.
 */
export function DiceWarCard() {
  const say = useSpeaker();
  const DICE_WAR_COPY = diceWarScreenWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptDiceWarGame();
  if (game === undefined || game === null || game.phase === "over") return null;
  const variant = PARTY_KINDS.diceWar;
  return (
    <PartyTableCard thumb={variant} heading={DICE_WAR_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {say.say("party.diceWar.cardRound", { round: String(game.round) })}
      {waitsOnPerson(game) ? ` · ${say.count("count.player", game.players.length)}` : ` · ${say.say("party.diceWar.toRoll", { name: diceWarSeatName(game.players, game.computers, game.rollers[0] ?? 0, say) })}`}
    </PartyTableCard>
  );
}
