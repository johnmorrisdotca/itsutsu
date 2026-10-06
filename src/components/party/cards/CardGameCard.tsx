"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { MarbleChip } from "../MarbleChip";
import { CARD_ADAPTERS, seatName } from "./cardAdapters";
import { CARD_TABLE_STORES } from "./cardTableStores";
import { cardTableWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A CARD GAME, WAITING IN MY GAMES. "Anything a person plays is kept until it
 * is finished, and waits in My games" (AGENTS.md): it is kept in this browser,
 * so it is listed from this browser, on the Pass and play tab beside the other
 * tables' games — a row like theirs. Only while it is going.
 */
export function CardGameCard({ kind }: { kind: CardGameKind }) {
  const say = useSpeaker();
  const CARD_TABLE_COPY = cardTableWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = CARD_TABLE_STORES[kind].useKept();
  if (game === undefined || game === null) return null;
  const rules = CARD_ADAPTERS[kind].rules;
  if (rules.over(game)) return null;
  const { players, computers } = rules.seats(game);
  const toPlay = rules.toPlay(game);
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={kind}>
      <GameThumb variant={kind} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{CARD_TABLE_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={kind} /> · {say.count("count.player", players.length)}
          {toPlay === null ? null : (
            <>
              {" "}
              · <MarbleChip player={toPlay} />
              {say.say("party.toPlay", { name: seatName(players, computers, toPlay, say) })}
            </>
          )}
        </span>
      </div>
      <Link href={passAndPlayPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
