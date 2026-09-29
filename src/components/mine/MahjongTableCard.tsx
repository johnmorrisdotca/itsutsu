"use client";

import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { tableAddress, useKeptMahjongTable } from "@/components/puzzles/mahjongTableKept";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { readTable, seatName } from "@/lib/puzzles/mahjong/table";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * THE MAHJONG TABLE KEPT IN THIS BROWSER, beside the pass-and-play Kumimoji
 * (`LocalPartyCard`). AGENTS.md: "Anything a person plays is kept until it is
 * finished, and waits in My games" — a table round one device has no seat on
 * the server, so it waits here, read from the browser, until it is over.
 */
export function MahjongTableCard() {
  const [table] = useKeptMahjongTable();
  const state = table === null || table === undefined ? null : readTable(table);
  if (table === null || table === undefined || state === null || state.over) return null;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="local-mahjong-table">
      <GameThumb variant="mahjong" size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          <Paired en={MY_GAMES_COPY.localParty.label} kanji={MY_GAMES_COPY.localParty.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        </span>
        <span className="text-sm font-medium">
          <GameName variant="mahjong" /> · {table.seats.length} players · {seatName(table.seats, state.turn)} to take a pair
        </span>
      </div>
      <Link href={tableAddress(table)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="local-mahjong-table-continue">
        {MY_GAMES_COPY.continueGame} →
      </Link>
    </div>
  );
}
