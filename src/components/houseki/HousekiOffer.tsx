"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { housekiQuery } from "@/lib/houseki/housekiAddress";
import { latestRun } from "@/lib/houseki/housekiProgress";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { housekiPlayPath, setUpPath } from "@/lib/gomoku/slugs";

import { useHousekiSave } from "./housekiStore";

/**
 * THE BUTTON UNDER A HOUSEKI GAME'S PICTURE: Play (to the set-up) where nothing
 * is waiting, and where a game was put down half way Continue as the main press
 * with a New game beside it that leaves that game where it is
 * (`GameInProgressOffer`). What waits is read from this browser
 * (`housekiStore.ts`); the server cannot see it, so the first paint is the plain Play.
 */
export function HousekiOffer({ kind }: { kind: HousekiKind }) {
  const say = useSpeaker();
  const save = useHousekiSave();
  const run = save === undefined ? null : latestRun(save, kind);
  return (
    <GameInProgressOffer
      href={run === null ? setUpPath(kind) : housekiPlayPath(kind, housekiQuery(run.request))}
      going={run !== null}
      newGame={{ keeps: setUpPath(kind) }}
      continueLabel={say.say("ending.continue")}
      testId="houseki-offer"
    />
  );
}
