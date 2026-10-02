"use client";

import { PlayButton } from "@/components/games/PlayButton";
import type { SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { sugorokuOver } from "@/lib/party/sugoroku/sugorokuTable";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SUGOROKU_COPY } from "./sugoroku.constants";
import { useKeptSugoroku } from "./sugorokuStore";

/**
 * THE PLAY BUTTON on a game's own page and its rules page, under the picture as
 * every game's is (`PlayButton`), leading to the table. It reads Continue while
 * this browser holds a match not yet finished, because the table opens on that
 * match rather than a new one.
 */
export function SugorokuOffer({ kind, href }: { kind: SugorokuKind; href: string }) {
  const hydrated = useHydrated();
  const [table] = useKeptSugoroku(kind);
  // A name from a kept record that carries a match length ("Backgammon (7 Point)") arrives with it, and the set-up opens on it.
  const query = hydrated && typeof window !== "undefined" ? window.location.search : "";
  const going = table !== undefined && table !== null && !sugorokuOver(table);
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={`${href}${query}`} label={going ? `${SUGOROKU_COPY.continue} →` : `${SUGOROKU_COPY.play} →`} />
    </div>
  );
}
