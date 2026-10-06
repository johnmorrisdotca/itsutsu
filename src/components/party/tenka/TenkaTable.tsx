"use client";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { TenkaPlay } from "./TenkaPlay";
import { TenkaSetUp } from "./TenkaSetUp";
import { useKeptTenkaGame, useOldTenkaSave } from "./tenkaStore";
import { tenkaWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * TENKA PASSED ROUND THE TABLE, at /games/tenka/pass-and-play.
 *
 * Set up first — how many, how long, names — then the game, kept in this
 * browser after every move (`tenkaStore.ts`, on `keptInBrowser`) and nowhere
 * else: no account is asked, nothing is rated, no server is told. Leave half
 * way and it is here when you come back, dice and all, and waiting on My
 * games meanwhile. The rules are all in `lib/party/tenka/`.
 */
export function TenkaTable({ appearance, gameHref, online }: PartyTableGameProps) {
  const say = useSpeaker();
  const TENKA_COPY = tenkaWords(say.locale);
  const hydrated = useHydrated();
  const [game, keep] = useKeptTenkaGame();
  const oldSave = useOldTenkaSave();

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[36rem]" data-testid="tenka-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="tenka-game" data-state="set-up">
        {oldSave ? (
          <p className="rounded-lg border border-rule-strong bg-ivory px-3 py-2 text-sm" role="status" data-testid="tenka-old-save">
            {TENKA_COPY.oldSave}
          </p>
        ) : null}
        <TenkaSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }
  return <TenkaPlay game={game} keep={keep} appearance={appearance} gameHref={gameHref} ready={readyMark(hydrated)} />;
}
