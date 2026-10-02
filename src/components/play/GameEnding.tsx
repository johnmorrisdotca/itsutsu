"use client";

import type { ReactNode } from "react";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import type { Asking } from "@/components/ui/ui.types";
import { resignedBy } from "@/lib/party/resign";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { ENDINGS, GAME_ENDING_COPY, type Ending } from "./gameEnding.constants";

const LOOK = `${BUTTON_BASE} ${BUTTON_QUIET}`;

/**
 * THE ONE ROW FOR ENDING A GAME AND STARTING ANOTHER, under the board of every
 * kind of play: a live game between members, a pass-and-play table, a card
 * table, the practice board, patience and a puzzle.
 *
 * John, 2026-10-02, at Tenka's table: "Where is the option to start a new game,
 * rather than Continue/Resume? Where is the quit game or lose button, aka
 * Resign? … We have to be consistent for all games where there is an ongoing
 * game. Right now it's disparate/different per family and variant." Every table
 * had its own copy of a New game button with its own question, and some had
 * Resign, some Give up and most neither.
 *
 * This is the row only; what goes in it is `EndGameButton` (Resign, or Give up
 * for a game played alone), `NewGameButton` (asks first where it would throw
 * the game away) and `NewGameLink` (to the set-up screen, where the game stays
 * kept). It is furniture in just the board (`data-chrome`): leave that mode
 * and it is there.
 */
export function GameEnding({ children, testId = "game-ending" }: { children: ReactNode; testId?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-chrome data-testid={testId}>
      {children}
    </div>
  );
}

/**
 * RESIGN, or Give up for a game played alone, with the question asked in place.
 * `question` replaces the ordinary one where the game has something more
 * exact to say (Pair Go names the team).
 */
export function EndGameButton({
  ending = ENDINGS.resign,
  onEnd,
  question,
  disabled = false,
  onAsking,
  testId,
}: {
  ending?: Ending;
  onEnd: () => void;
  question?: string;
  disabled?: boolean;
  onAsking?: (asking: Asking) => void;
  testId: string;
}) {
  const resign = ending === ENDINGS.resign;
  const word = resign ? GAME_ENDING_COPY.resign : GAME_ENDING_COPY.giveUp;
  return (
    <ConfirmButton
      label={word}
      question={question ?? (resign ? GAME_ENDING_COPY.resignAsk : GAME_ENDING_COPY.giveUpAsk)}
      confirm={word}
      cancel={GAME_ENDING_COPY.keepPlaying}
      onConfirm={onEnd}
      onAsking={onAsking}
      disabled={disabled}
      className={LOOK}
      testId={testId}
    />
  );
}

/**
 * NEW GAME, for a game kept only where it is played. While one is `going` it
 * asks first, because the game in progress is gone for good; with nothing in
 * progress (the game is over, or nothing was played) it just starts.
 */
export function NewGameButton({
  going,
  onNewGame,
  question = GAME_ENDING_COPY.newGameAsk,
  disabled = false,
  onAsking,
  testId,
}: {
  going: boolean;
  onNewGame: () => void;
  question?: string;
  disabled?: boolean;
  onAsking?: (asking: Asking) => void;
  testId: string;
}) {
  const hydrated = useHydrated();
  if (going) {
    return (
      <ConfirmButton
        label={GAME_ENDING_COPY.newGame}
        question={question}
        confirm={GAME_ENDING_COPY.newGameYes}
        cancel={GAME_ENDING_COPY.keepPlaying}
        onConfirm={onNewGame}
        onAsking={onAsking}
        disabled={disabled}
        className={LOOK}
        testId={testId}
      />
    );
  }
  return (
    <button type="button" className={LOOK} onClick={() => onNewGame()} disabled={disabled} data-testid={testId} {...readyMark(hydrated)}>
      {GAME_ENDING_COPY.newGame}
    </button>
  );
}

/**
 * NEW GAME, as a way to the set-up screen, for a game that is kept where it is
 * (a puzzle's run, a game between members): nothing is lost, so nothing is
 * asked, and the title says where the one in progress will be.
 */
export function NewGameLink({ href, testId, className = LOOK }: { href: string; testId: string; className?: string }) {
  return (
    <Link href={href} className={className} title={GAME_ENDING_COPY.newGameKeeps} data-testid={testId}>
      {GAME_ENDING_COPY.newGame}
    </Link>
  );
}

/**
 * THE ROW UNDER A TABLE ROUND ONE DEVICE: Resign for the player to move while
 * the game is going, New game beside it, and, once somebody has resigned, who
 * did. The rule for what resigning does is `lib/party/resign.ts`; the words are
 * `GAME_ENDING_COPY`. `prefix` names the table's test ids (`<prefix>-resign`,
 * `<prefix>-new`).
 */
export function TableEnding({
  prefix,
  game,
  playing,
  toPlay,
  seats,
  nameOf,
  onResign,
  onNewGame,
}: {
  prefix: string;
  /** The kept game, for the seat that resigned. */
  game: object;
  playing: boolean;
  /** The seat to move, or null when nobody is. */
  toPlay: number | null;
  seats: number;
  nameOf: (seat: number) => string;
  onResign: (seat: number) => void;
  onNewGame: () => void;
}) {
  const resigned = resignedBy(game);
  return (
    <GameEnding>
      {resigned === null ? null : (
        <p className="w-full text-sm font-semibold" data-testid="game-resigned" data-seat={resigned}>
          {GAME_ENDING_COPY.resigned(nameOf(resigned))}
        </p>
      )}
      {playing && toPlay !== null ? (
        <EndGameButton onEnd={() => onResign(toPlay)} question={GAME_ENDING_COPY.resignFor(nameOf(toPlay), seats)} testId={`${prefix}-resign`} />
      ) : null}
      <NewGameButton going={playing} onNewGame={onNewGame} testId={`${prefix}-new`} />
    </GameEnding>
  );
}
