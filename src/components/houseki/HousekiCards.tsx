"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { HOUSEKI_KIND_LIST, levelsOf } from "@/lib/houseki/houseki.constants";
import { housekiQuery } from "@/lib/houseki/housekiAddress";
import { hasProgress, latestRun, wonCount } from "@/lib/houseki/housekiProgress";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { housekiPlayPath, setUpPath } from "@/lib/gomoku/slugs";

import { requestWords } from "./housekiWords";
import { useHousekiSave } from "./housekiStore";

/**
 * EVERY HOUSEKI GAME WITH SOMETHING KEPT, WAITING IN MY GAMES. "Anything a
 * person plays is kept until it is finished, and waits in My games"
 * (AGENTS.md): a Houseki game is kept in this browser, so it is listed from this
 * browser, on the Pass and play tab beside the other games kept the same way. A
 * card for each game with a game half way or a level won, saying which, and
 * leading to the game put down most recently, or to the set-up where there is none.
 */
export function HousekiCards() {
  const save = useHousekiSave();
  if (save === undefined) return null;
  return (
    <>
      {HOUSEKI_KIND_LIST.filter((kind) => hasProgress(save, kind)).map((kind) => (
        <HousekiCard key={kind} kind={kind} />
      ))}
    </>
  );
}

function HousekiCard({ kind }: { kind: HousekiKind }) {
  const say = useSpeaker();
  const save = useHousekiSave();
  if (save === undefined) return null;
  const run = latestRun(save, kind);
  const waiting = save[kind]?.runs.length ?? 0;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="houseki-card" data-kind={kind}>
      <GameThumb variant={kind} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{say.say("houseki.card.label")}</span>
        <span className="text-sm font-medium">
          <GameName variant={kind} />
        </span>
        <span className="text-xs text-muted">
          {say.say("houseki.card.wonOf", { won: say.number(wonCount(save, kind)), levels: say.number(levelsOf(kind)) })}
          {run === null ? "" : ` · ${say.say("houseki.card.waiting", { what: requestWords(say, run.request) })}`}
          {waiting > 1 ? ` · ${say.count("houseki.card.more", waiting - 1)}` : ""}
        </span>
      </div>
      <Link href={run === null ? setUpPath(kind) : housekiPlayPath(kind, housekiQuery(run.request))} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="houseki-card-continue">
        {run === null ? say.say("catalogue.play") : say.say("ending.continue")}
      </Link>
    </div>
  );
}
