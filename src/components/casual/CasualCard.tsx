"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { CASUAL_KIND_LIST, CASUAL_SPECS } from "@/lib/casual/casual.constants";
import type { CasualKind } from "@/lib/casual/casual.types";
import { goingLevel, hasProgress, nextLevel, wonLevels } from "@/lib/casual/casualProgress";
import { casualPlayPath } from "@/lib/gomoku/slugs";

import { useCasualSave } from "./casualStore";
import { casualWords } from "@/components/casual/casualWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * EVERY CASUAL GAME WITH SOMETHING KEPT, WAITING IN MY GAMES. "Anything a
 * person plays is kept until it is finished, and waits in My games"
 * (AGENTS.md): a casual game is kept in this browser, so it is listed from this
 * browser, on the Pass and play tab beside the other games kept the same way.
 * A card for each game with a level in progress or a level won, saying which,
 * and leading to the level to play next. A game never touched has no card.
 */
export function CasualCards() {
  const save = useCasualSave();
  if (save === undefined) return null;
  return (
    <>
      {CASUAL_KIND_LIST.filter((kind) => hasProgress(save, kind)).map((kind) => (
        <CasualCard key={kind} kind={kind} going={goingLevel(save, kind)} won={wonLevels(save, kind).length} next={nextLevel(save, kind)} />
      ))}
    </>
  );
}

function CasualCard({ kind, going, won, next }: { kind: CasualKind; going: number | null; won: number; next: number }) {
  const say = useSpeaker();
  const CASUAL_COPY = casualWords(say.locale);
  const spec = CASUAL_SPECS[kind];
  const story = kind === "choiceStory";
  const level = going ?? next;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="casual-card" data-kind={kind}>
      <GameThumb variant={kind} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{CASUAL_COPY.card}</span>
        <span className="text-sm font-medium">
          <GameName variant={kind} />
        </span>
        <span className="text-xs text-muted">
          {CASUAL_COPY.wonOf(won, spec.levels, story)}
          {going === null ? "" : ` · ${CASUAL_COPY.levelWord(story)} ${going} ${CASUAL_COPY.going.toLowerCase()}`}
        </span>
      </div>
      <Link href={casualPlayPath(kind, level)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="casual-card-continue">
        {going === null ? CASUAL_COPY.start(level, story) : CASUAL_COPY.continueLevel(level, story)}
      </Link>
    </div>
  );
}
