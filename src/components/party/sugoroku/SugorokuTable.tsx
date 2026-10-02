"use client";

import { PlayingNow } from "@/components/layout/PlayingNow";
import { sugorokuOver } from "@/lib/party/sugoroku/sugorokuTable";
import type { SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { SugorokuPlay } from "./SugorokuPlay";
import { SugorokuSetUp } from "./SugorokuSetUp";
import { useKeptSugoroku } from "./sugorokuStore";

/**
 * ONE OF THE SEVEN ROUND ONE DEVICE, at /games/<slug>/pass-and-play: set up
 * first — how long, who plays, and on one device or several — then played,
 * kept in this browser after every move (`sugorokuStore.ts`) and nowhere else.
 * Or, chosen at the set-up, a table on two devices, which the server keeps
 * (`onlineSugoroku.ts`).
 */
export function SugorokuTable({ kind, appearance, gameHref, online }: PartyTableGameProps & { kind: SugorokuKind }) {
  const hydrated = useHydrated();
  const [table, keep] = useKeptSugoroku(kind);
  // Not read yet: the server has no browser to ask, so it keeps the room the table will take and says nothing.
  if (table === undefined) return <section className="min-h-[36rem]" data-testid="sugoroku-game" {...readyMark(false)} aria-busy="true" />;
  if (table === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="sugoroku-game" data-kind={kind} data-state="set-up">
        <SugorokuSetUp kind={kind} appearance={appearance} ready={readyMark(hydrated)} online={online} onStart={(fresh) => keep(fresh)} />
      </section>
    );
  }
  return (
    <>
      {/* Quiet around the table while a match is played (`PlayingNow`). */}
      <PlayingNow on={!sugorokuOver(table)} />
      <SugorokuPlay table={table} keep={keep} appearance={appearance} gameHref={gameHref} ready={readyMark(hydrated)} />
    </>
  );
}
