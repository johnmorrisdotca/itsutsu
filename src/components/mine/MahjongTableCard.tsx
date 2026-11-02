"use client";

import { GoingCard } from "./GoingCard";
import { Paired } from "@/components/i18n/Paired";

import { GameName } from "@/components/games/GameName";

import { tableAddress, useKeptMahjongTable } from "@/components/puzzles/mahjongTableKept";

import { readTable, seatName } from "@johnmorrisdotca/jarajara/table";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { weave } from "@/lib/i18n/weave";
import { myGamesCopy } from "./mine.copy";

/**
 * THE MAHJONG TABLE KEPT IN THIS BROWSER, beside the pass-and-play Kumimoji
 * (`LocalPartyCard`). AGENTS.md: "Anything a person plays is kept until it is
 * finished, and waits in My games" — a table round one device has no seat on
 * the server, so it waits here, read from the browser, until it is over.
 */
export function MahjongTableCard() {
  const say = useSpeaker();
  const MY_GAMES_COPY = myGamesCopy(say);
  const [table] = useKeptMahjongTable();
  const state = table === null || table === undefined ? null : readTable(table);
  if (table === null || table === undefined || state === null || state.over) return null;
  return (
    <GoingCard
      thumb="mahjong"
      heading={<Paired en={MY_GAMES_COPY.localParty.label} kanji={MY_GAMES_COPY.localParty.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />}
      href={tableAddress(table)}
      action={<>{MY_GAMES_COPY.continueGame} →</>}
      testId="local-mahjong-table"
      continueTestId="local-mahjong-table-continue"
    >
      <span className="text-sm font-medium">
        {weave(say.say("mine.cardMahjong", { players: say.count("count.player", table.seats.length), who: seatName(table.seats, state.turn) }), { game: <GameName variant="mahjong" /> })}
      </span>
    </GoingCard>
  );
}
