"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import { seatedName } from "@/lib/party/partyNames";

import { MarbleChip } from "../MarbleChip";
import { partyScreenWords } from "../partyWords";
import { DICE_TABLE_STORES } from "./diceTableStores";

/**
 * A DICE GAME, WAITING IN MY GAMES. "Anything a person plays is kept until it is
 * finished, and waits in My games" (AGENTS.md): it is kept in this browser, so it
 * is listed from this browser, on the Pass and play tab beside the other tables'.
 */
export function DiceTableCard({ kind }: { kind: DiceTableKind }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = DICE_TABLE_STORES[kind].useKept();
  if (game === undefined || game === null || game.phase === "over") return null;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={kind}>
      <GameThumb variant={kind} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={kind} /> · {say.count("count.player", game.players.length)} · <MarbleChip player={game.toPlay} />
          {say.say("party.toPlay", { name: seatedName(game, game.toPlay, say) })}
        </span>
      </div>
      <Link href={passAndPlayPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
