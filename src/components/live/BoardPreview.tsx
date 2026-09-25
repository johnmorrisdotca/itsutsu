"use client";

import { useMemo } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltUnderBoard } from "@/components/board/FeltPatches";
import type { Appearance, Felt } from "@/components/board/board.types";
import { createGame } from "@/lib/gomoku/engine";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameSettings, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { SET_UP_COPY, SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "./live.constants";

/** What the set-up form holds, narrowed to the parts that change the picture. */
export type PreviewRules = { variant: string; size: number; obstacles: string };

/**
 * The board this game would be played on, drawn before anybody agrees to play it.
 *
 * ItsYourTurn has shown a sample board on its new-game screen since 1998, and
 * John, looking at it: "they show the board before creating the game.. we do
 * not". The set-up screen already names the game and draws its small mark, and
 * neither tells you what you are about to sit down at — and on this site that
 * is a bigger gap than on most, because forty-four games share one engine and
 * look nothing like each other. A hexagram, a 12×12 chequer, nineteen lines
 * crossing, a seven-column well with gravity: the rules text says all of it and
 * the picture says it faster.
 *
 * **It is built from the real settings, so it is the real board.** `createGame`
 * is the same function the game itself starts from, which is what stops this
 * becoming a second, prettier idea of what a board looks like — the thing a
 * hand-drawn preview always drifts into. Change the size or the game above it
 * and this is what changes.
 *
 * **And it says it is a preview, in words.** A board that looks exactly like a
 * game but is not one is worth being loud about: `readOnly` means a click does
 * nothing, and a control that silently ignores you is a worse experience than
 * one that was never offered. The caption is the honest half of that.
 */
export function BoardPreview({
  rules,
  appearance = DEFAULT_APPEARANCE,
  onFelt,
}: {
  rules: PreviewRules;
  /** The reader's board, so a Reversi shows the felt they will play on. */
  appearance?: Appearance;
  /** Choosing a Reversi board's felt here, on the patches under it; none where it cannot be chosen. */
  onFelt?: (felt: Felt) => void;
}) {
  /*
   * Only the three choices that change the PICTURE, and taken loosely on
   * purpose. The set-up form holds a draft whose `variant` and `obstacles` are
   * plain strings — it is mid-edit, and a half-typed draft need not name a real
   * game yet. Narrowing here and letting `createGame` refuse is honest about
   * that: the refusal is how we learn the draft is not a game, and the preview
   * simply does not appear until it is.
   */
  const settings = useMemo(
    () => ({ variant: rules.variant, size: rules.size, obstacles: rules.obstacles }) as Partial<GameSettings>,
    [rules.variant, rules.size, rules.obstacles],
  );
  const variant = rules.variant as RuleVariant;

  /*
   * Rebuilt only when the settings that CHANGE THE PICTURE change. A fresh
   * board is cheap, but this sits under a form somebody is working through, and
   * rebuilding it on every keystroke elsewhere in that form is work nobody
   * asked for on a page that is otherwise doing nothing.
   */
  const state = useMemo(() => {
    try {
      // A fixed roll rather than a random one: an obstacle game would otherwise
      // deal itself a new board on every render, which reads as a flicker.
      return createGame(settings, 0.5);
    } catch {
      /*
       * A settings draft mid-edit need not be a game yet. Nothing here is worth
       * an error on a set-up screen, so the preview simply does not appear —
       * the rules text above it is still true and still the point of the page.
       */
      return null;
    }
  }, [settings]);

  /*
   * The games that deal themselves a board — rocks scattered, a hotspot placed,
   * a wormhole's two mouths — cannot be previewed exactly, and saying so is the
   * whole reason this line exists rather than quietly showing one arrangement
   * as though it were THE arrangement. IYT says the same on the same screen.
   *
   * ASKED OF THE ENGINE RATHER THAN OF A LIST OF FIELDS. Two boards from two
   * different rolls either come out the same or they do not, and that is the
   * whole question. A list of "these are the random games" is a second place
   * for the truth to live, and the copy on a set-up screen is exactly the sort
   * of second place nobody thinks to update when a game with a new kind of
   * scattering is added next year.
   */
  const dealt = useMemo(() => {
    try {
      const a = createGame(settings, 0.1).board.join("");
      const b = createGame(settings, 0.9).board.join("");
      return a !== b;
    } catch {
      return false;
    }
  }, [settings]);

  if (state === null || !(variant in RULE_VARIANT_DISPLAY)) return null;


  return (
    <figure className="flex flex-col items-center gap-2" data-testid="board-preview">
      {/*
        SMALLER ON A PHONE. At 22rem the preview is most of a 390-pixel screen
        on its own, and this page has a board, an opponent, the rules, a
        handicap and a press to fit above the fold. John, 2026-09-21: "ideally,
        one viewport/screen should be all the info, when collapsed." It is
        still the real board, drawn from the real settings — just at a size
        that leaves room for the rest of the screen it is on.
      */}
      <div className={SET_UP_PREVIEW_BOX} aria-hidden="true">
        <Board
          state={state}
          appearance={appearance}
          readOnly
          onPlay={() => {}}
          viewer={null}
        />
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION}>
        {SET_UP_COPY.previewIs(RULE_VARIANT_DISPLAY[variant].label)}
        {dealt ? ` ${SET_UP_COPY.previewDealt}` : ""}
        {/*
          A Reversi board's felt, in the room the caption keeps: no game that
          wears felt scatters its board, so the patches take the line the
          scattering sentence would, and choosing a game moves nothing.
        */}
        {onFelt === undefined ? null : (
          <span className="mt-1 block">
            <FeltUnderBoard appearance={appearance} variant={variant} onChoose={onFelt} />
          </span>
        )}
      </figcaption>
    </figure>
  );
}
