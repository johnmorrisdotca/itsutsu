"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { PlayButton } from "@/components/games/PlayButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { GAME_ENDING_COPY } from "./gameEnding.constants";

/** What New game does to the game in progress: ends it (a game kept only in this browser) or leaves it where it is. */
export type NewGameOnTheDoor = { ends: () => void } | { keeps: string };

/**
 * THE BUTTON UNDER A GAME'S PICTURE, the same for every kind of play: Play
 * where nothing is going, and where a game is in progress Continue as the main
 * press AND a plainly labelled New game under it that says what happens to the
 * one in progress.
 *
 * John, 2026-10-02, at Tenka's front door, which showed a lone "Continue →":
 * "Where is the option to start a new game, rather than Continue/Resume?"
 * Fourteen tables each had their own offer, a puzzle had "Resume →" and "Or
 * start a new one", and a live game had neither. They are this now.
 *
 * - `ends`: the game is kept only in this browser, one to a kind of game, so
 *   starting another ends it. New game asks first (it names what is lost),
 *   then discards the game and opens the table, which sets a new one up.
 * - `keeps`: the game is kept somewhere it stays (a puzzle's run in My games),
 *   so New game is a plain link to the set-up screen and says so.
 *
 * `idle` is what a door shows where nothing is going when it is not the big
 * Play (a second way on, such as a table for the whole table).
 */
export function GameInProgressOffer({
  href,
  going,
  newGame,
  playLabel,
  continueLabel = GAME_ENDING_COPY.continue,
  idle,
  testId = "party-kind-offer",
  mainTestId = "game-set-up",
}: {
  /** Where Play and Continue lead: the table, or the set-up screen. */
  href: string;
  going: boolean;
  newGame: NewGameOnTheDoor;
  playLabel?: string;
  continueLabel?: string;
  idle?: ReactNode;
  testId?: string;
  mainTestId?: string;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2" data-testid={testId} data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      {going ? (
        <>
          <PlayButton href={href} label={continueLabel} testId={mainTestId} />
          {"ends" in newGame ? (
            <ConfirmButton
              label={GAME_ENDING_COPY.newGame}
              question={GAME_ENDING_COPY.doorAsk}
              confirm={GAME_ENDING_COPY.newGameYes}
              cancel={GAME_ENDING_COPY.doorKeep}
              onConfirm={() => {
                newGame.ends();
                router.push(href);
              }}
              className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`}
              testId="game-new"
            />
          ) : (
            <Link href={newGame.keeps} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="game-new">
              {GAME_ENDING_COPY.newGame}
            </Link>
          )}
          <p className="text-center text-xs text-muted" data-testid="game-new-note">
            {"ends" in newGame ? GAME_ENDING_COPY.doorEnds : GAME_ENDING_COPY.doorKeeps}
          </p>
        </>
      ) : (
        (idle ?? <PlayButton href={href} label={playLabel} testId={mainTestId} />)
      )}
    </div>
  );
}
