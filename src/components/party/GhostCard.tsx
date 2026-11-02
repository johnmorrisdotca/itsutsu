"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyPlayerName } from "@/lib/party/partyNames";
import { GHOST_PHASE } from "@/lib/party/superghost/superghost";

import { MarbleChip } from "./MarbleChip";
import { useKeptGhostGame } from "./ghostStore";
import { ghostShown } from "./party.constants";
import { ghostWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF SUPERGHOST, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going.
 * Read back without the word list, so the tab fetches nothing to show it.
 */
export function GhostCard() {
  const say = useSpeaker();
  const GHOST_COPY = ghostWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptGhostGame();
  if (game === undefined || game === null || game.phase === GHOST_PHASE.finished) return null;
  const variant = PARTY_KINDS.superghost;
  const language = GHOST_COPY.languages[game.language].name;
  return (
    <PartyTableCard thumb={variant} heading={PARTY_COPY.card} href={passAndPlayPath(variant)} resume={PARTY_COPY.resume} dataVariant={variant}>
      <GameName variant={variant} /> · {language} · {say.count("count.player", game.players.length)} · {GHOST_COPY.rounds(game.rounds.length)}
      {game.fragment === "" ? null : <span data-testid="party-game-fragment">· {ghostShown(game.fragment, game.language)} ·</span>}
      <MarbleChip player={game.toPlay} />
      {say.say("party.toPlay", { name: partyPlayerName(game, game.toPlay, say) })}
    </PartyTableCard>
  );
}
