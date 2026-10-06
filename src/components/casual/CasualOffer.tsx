"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import type { CasualKind } from "@/lib/casual/casual.types";
import { goingLevel } from "@/lib/casual/casualProgress";
import { casualPlayPath, setUpPath } from "@/lib/gomoku/slugs";

import { CASUAL_COPY } from "./casual.constants";
import { useCasualSave } from "./casualStore";

/**
 * THE BUTTON UNDER A CASUAL GAME'S PICTURE: Play (to the levels) where nothing
 * is going, and where a level is in progress Continue as the main press with a
 * New game beside it that leaves that level where it is (`GameInProgressOffer`).
 * What is going is read from this browser (`casualStore.ts`); the server cannot
 * see it, so the first paint is the plain Play.
 */
export function CasualOffer({ kind }: { kind: CasualKind }) {
  const save = useCasualSave();
  const level = save === undefined ? null : goingLevel(save, kind);
  const story = kind === "choiceStory";
  return (
    <GameInProgressOffer
      href={level === null ? setUpPath(kind) : casualPlayPath(kind, level)}
      going={level !== null}
      newGame={{ keeps: setUpPath(kind) }}
      continueLabel={level === null ? CASUAL_COPY.resume : CASUAL_COPY.continueLevel(level, story)}
      testId="casual-offer"
    />
  );
}
