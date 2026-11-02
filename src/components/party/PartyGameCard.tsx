"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { PARTY_STATUS, partyPlayerName } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { MarbleChip } from "./MarbleChip";
import type { PartyRaceKind } from "./party.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { partyScreenWords } from "@/components/party/partyWords";

/**
 * A TABLE'S GAME, WAITING IN MY GAMES. "Anything a person plays is kept until
 * it is finished, and waits in My games" (AGENTS.md): a pass-and-play game is
 * kept in this browser, so it is listed from this browser, on the Pass and
 * play tab beside the board for two that is kept the same way — one card for
 * each kind of table with a game going. Only while it is going; a finished
 * one has nothing left to come back to.
 */
export function PartyGameCard<S extends PartyRaceState, C extends number>({ kind }: { kind: PartyRaceKind<S, C> }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = kind.useKept();
  if (game === undefined || game === null || game.status !== PARTY_STATUS.playing) return null;
  const variant = kind.rules.variant;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {say.count("count.player", game.players.length)} · {say.count("count.move", game.moves.length)} ·
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: partyPlayerName(game.players, game.toPlay, say) })}
    </PartyTableCard>
  );
}
