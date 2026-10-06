"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import type { SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { sugorokuOver, sugorokuToPlay } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuNames, sugorokuScoreWords } from "@/lib/party/sugoroku/sugorokuWords";

import { useKeptSugoroku } from "./sugorokuStore";
import { partyScreenWords, sugorokuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A MATCH OF ONE OF THE SEVEN, WAITING IN MY GAMES. "Anything a person plays is
 * kept until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished.
 */
export function SugorokuCard({ kind }: { kind: SugorokuKind }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const SUGOROKU_COPY = sugorokuScreenWords(say.locale);
  const [table] = useKeptSugoroku(kind);
  if (table === undefined || table === null || sugorokuOver(table)) return null;
  const to = sugorokuToPlay(table);
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={kind}>
      <GameThumb variant={kind} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{SUGOROKU_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={kind} /> · {sugorokuScoreWords(table, say)}
          {to === null ? "" : ` · ${say.say("party.toPlay", { name: sugorokuNames(table, say)[to] })}`}
        </span>
      </div>
      <Link href={passAndPlayPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
