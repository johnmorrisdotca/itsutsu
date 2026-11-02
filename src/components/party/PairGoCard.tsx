"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { boardWords } from "@/lib/gomoku/boardWords";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { PAIR_GO_VARIANT, pairPlayerToMove } from "@/lib/gomoku/party/pairGo";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { useKeptPairGo } from "./pairGoStore";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { pairGoWords } from "@/components/party/partyWords";

/**
 * PAIR GO, WAITING IN MY GAMES. "Anything a person plays is kept until it is
 * finished, and waits in My games" (AGENTS.md): the game is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the board for two and the Chinese Checkers table. Only while it is going.
 */
export function PairGoCard() {
  const say = useSpeaker();
  const PAIR_GO_COPY = pairGoWords(say.locale);
  const [game] = useKeptPairGo();
  if (game === undefined || game === null || game.state.status !== GAME_STATUS.playing) return null;
  const toMove = pairPlayerToMove(game, say);
  const { moves, settings } = game.state;
  return (
    <PartyTableCard thumb={PAIR_GO_VARIANT} heading={PAIR_GO_COPY.card} href={passAndPlayPath(PAIR_GO_VARIANT)} resume={PAIR_GO_COPY.resume} testId="pairgo-game" continueTestId="pairgo-game-continue" flow={false}>
      <GameName variant={PAIR_GO_VARIANT} />{say.say("party.pairgo.cardTeams")} · {boardWords(settings.variant, settings.size, say)} · {say.count("count.move", moves.length)}
      {toMove !== null ? say.say("party.pairgo.cardToPlay", { name: toMove.name, colour: stoneName(say, toMove.stone) }) : ""}
    </PartyTableCard>
  );
}
