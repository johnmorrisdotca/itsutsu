"use client";

import Link from "next/link";
import { useId, useRef } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { ResultCardData } from "@/lib/history/gameResult.types";

import { RESULT_CARD_COPY, RESULT_CARD_TONE } from "./resultCard.constants";
import { headlineOf, reasonOf, scoreWords } from "./resultWords";
import { lineWords } from "./rivalryWords";
import { useResultCard } from "./useResultCard";

/**
 * THE RESULT, OVER THE BOARD IT WAS PLAYED ON.
 *
 * John, with a finished Mini Reversi board in front of him and nothing on it
 * saying who had won: "the board sometimes it's not that obvious... like if there
 * were no more moves and you won... actually an overlay or banner or modal over
 * the game might be nice... where they just click OK or some game play options
 * like rematch right there... rather than having to hunt for it in the page. …
 * and they can just close it to enjoy the win screen to screenshot it without the
 * indicator."
 *
 * So: a card anchored over the lower part of the board, on a light wash that
 * leaves the final position readable behind it. It says who won and why, the
 * score where the game keeps one, the XP it paid and where the two players now
 * stand; and it offers what to do next — play again, a new game, the next game
 * waiting on you, the moves — or Close, which leaves the clean board. Once closed
 * it does not come back for that game (`useResultCard`).
 *
 * A dialog that does not trap: the page behind it stays usable, so it is labelled
 * and takes focus rather than claiming `aria-modal`. Escape closes it.
 */
export function ResultCard({ gameId, facts, names, xp, rivalry, rematch, newGame, waiting }: ResultCardData) {
  const dialog = useRef<HTMLDivElement | null>(null);
  const { open, close, seen } = useResultCard(gameId, dialog);
  const say = useSpeaker();
  const heading = useId();
  const described = useId();
  if (!open) return null;

  const headline = headlineOf(facts);
  const score = scoreWords(facts.score);
  const tone = RESULT_CARD_TONE[facts.outcome];
  const quiet = `${BUTTON_BASE} ${BUTTON_QUIET}`;

  return (
    <div
      className="absolute inset-0 z-10 flex items-end justify-center rounded-lg bg-paper/40 p-2 sm:p-4"
      data-testid="result-card-layer"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-labelledby={heading}
        aria-describedby={described}
        tabIndex={-1}
        className={`flex max-h-full w-full max-w-sm flex-col gap-2 overflow-y-auto rounded-2xl border-2 bg-ivory p-4 text-ink shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-moss ${tone.border}`}
        data-testid="result-card"
        data-outcome={facts.outcome}
        data-reason={facts.reason}
      >
        <h2 id={heading} className={`text-xl font-semibold ${tone.text}`} data-testid="result-card-headline">
          <Paired en={headline.label} kanji={headline.kanji} kanjiClassName="font-mincho text-base font-normal opacity-80" />
        </h2>
        <div id={described} className="flex flex-col gap-1 text-sm">
          <p data-testid="result-card-reason">{reasonOf(facts, names)}</p>
          {score !== null ? (
            <p className="font-mono text-xs tabular-nums text-ink-soft" data-testid="result-card-score">
              {score}
            </p>
          ) : null}
          {xp !== null ? (
            <p className="text-xs font-semibold text-moss" data-testid="result-card-xp">
              {RESULT_CARD_COPY.xp(xp)}
            </p>
          ) : null}
          {rivalry !== null ? (
            <p className="text-xs text-ink-soft" data-testid="result-card-rivalry">
              {lineWords(say, rivalry, rivalry.line)}
            </p>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          {rematch !== null ? (
            <Link
              href={rematch.href}
              onClick={seen}
              className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
              data-testid="result-card-rematch"
            >
              {rematch.again ? RESULT_CARD_COPY.again : RESULT_CARD_COPY.rematch}
            </Link>
          ) : null}
          <Link href={newGame} onClick={seen} className={quiet} data-testid="result-card-new">
            {RESULT_CARD_COPY.newGame}
          </Link>
          {waiting !== null ? (
            <Link href={waiting.href} onClick={seen} className={quiet} data-testid="result-card-waiting">
              {RESULT_CARD_COPY.waiting(waiting.count)}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => close(document.querySelector<HTMLElement>('[data-testid="replay-scrubber"]'))}
            className={quiet}
            data-testid="result-card-review"
          >
            {RESULT_CARD_COPY.review}
          </button>
          <button type="button" onClick={() => close()} className={quiet} data-testid="result-card-close">
            {RESULT_CARD_COPY.close}
          </button>
        </div>
      </div>
    </div>
  );
}
