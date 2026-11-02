"use client";

import { GoingCard } from "@/components/mine/GoingCard";
import { GameName } from "@/components/games/GameName";

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
    <GoingCard
      thumb={kind}
      heading={CASUAL_COPY.card}
      href={casualPlayPath(kind, level)}
      action={going === null ? CASUAL_COPY.start(level, story) : CASUAL_COPY.continueLevel(level, story)}
      testId="casual-card"
      continueTestId="casual-card-continue"
      dataKind={kind}
    >
      <span className="text-sm font-medium">
        <GameName variant={kind} />
      </span>
      <span className="text-xs text-muted">
        {CASUAL_COPY.wonOf(won, spec.levels, story)}
        {going === null ? "" : ` · ${say.say("casual.cardGoing", { word: CASUAL_COPY.levelWord(story), level: String(going), going: CASUAL_COPY.going.toLowerCase() })}`}
      </span>
    </GoingCard>
  );
}
