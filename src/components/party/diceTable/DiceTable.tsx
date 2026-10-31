"use client";

import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import type { DiceTableBase } from "@/lib/party/diceTable/diceTable.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { DiceTablePlay } from "./DiceTablePlay";
import { DiceTableSetUp } from "./DiceTableSetUp";
import { DICE_TABLE_STORES } from "./diceTableStores";

/**
 * A PLAIN DICE GAME, at /games/<slug>/pass-and-play: set up first, then played,
 * kept in this browser after every move and filed in the player's history, or,
 * chosen at the set-up, a table on several devices, which the server keeps. Nothing
 * is rated, and play on one device never waits on a server.
 */
export function DiceTable({ kind, appearance, gameHref, online }: PartyTableGameProps & { kind: DiceTableKind }) {
  const hydrated = useHydrated();
  const [game, keep] = DICE_TABLE_STORES[kind].useKept();
  if (game === undefined) return <section className="min-h-[32rem]" data-testid="dicetable-game" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="dicetable-game" data-state="set-up" data-kind={kind}>
        <DiceTableSetUp kind={kind} appearance={appearance} ready={readyMark(hydrated)} online={online} onStart={(fresh) => keep(fresh as DiceTableBase<unknown>)} />
      </section>
    );
  }
  return <DiceTablePlay kind={kind} game={game} keep={keep} appearance={appearance} gameHref={gameHref} />;
}
