"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import type { SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { sugorokuOver } from "@/lib/party/sugoroku/sugorokuTable";
import { useHydrated } from "@/lib/ui/hydrated";

import { SUGOROKU_COPY } from "./sugoroku.constants";
import { useKeptSugoroku } from "./sugorokuStore";

/**
 * THE PLAY BUTTON on a game's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a match not yet finished,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function SugorokuOffer({ kind, href }: { kind: SugorokuKind; href: string }) {
  const hydrated = useHydrated();
  const [table, keep] = useKeptSugoroku(kind);
  // A name from a kept record that carries a match length ("Backgammon (7 Point)") arrives with it, and the set-up opens on it.
  const query = hydrated && typeof window !== "undefined" ? window.location.search : "";
  const going = table !== undefined && table !== null && !sugorokuOver(table);
  return <GameInProgressOffer href={`${href}${query}`} going={going} newGame={{ ends: () => keep(null) }} playLabel={`${SUGOROKU_COPY.play} →`} />;
}
