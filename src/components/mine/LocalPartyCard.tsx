"use client";

import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { partyAddress } from "@/components/puzzles/KumimojiPartyScreens";
import { useKeptParty } from "@/components/puzzles/kumimojiPartyKept";
import { nameOf } from "@/lib/puzzles/kumimoji/party";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { weave } from "@/lib/i18n/weave";
import { myGamesCopy } from "./mine.copy";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PASS-AND-PLAY KUMIMOJI KEPT IN THIS BROWSER, beside the hot-seat board
 * (`LocalGameCard`). AGENTS.md: "Anything a person plays is kept until it is
 * finished, and waits in My games" — a game round one device has no seat on
 * the server, so it waits here, read from the browser, until it is finished.
 */
export function LocalPartyCard() {
  const say = useSpeaker();
  const MY_GAMES_COPY = myGamesCopy(say);
  const game = useKeptParty();
  if (game === null || game.ending !== null) return null;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="local-party">
      <GameThumb variant="kumimoji" size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          <Paired en={MY_GAMES_COPY.localParty.label} kanji={MY_GAMES_COPY.localParty.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        </span>
        <span className="text-sm font-medium">
          {weave(say.say("mine.cardParty", { players: say.count("count.player", game.players.length), who: nameOf(game, game.turn) }), { game: <GameName variant="kumimoji" /> })}
        </span>
      </div>
      <Link href={partyAddress(game)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="local-party-continue">
        {MY_GAMES_COPY.continueGame} →
      </Link>
    </div>
  );
}
