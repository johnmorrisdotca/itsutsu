"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { WORDS, fill, moveName, movesNotation, type CubeMove, type KyuubuLanguage } from "@johnmorrisdotca/kyuubu";
import { KyuubuMoves } from "@johnmorrisdotca/kyuubu/react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/** The list of moves wears the site's own ink and paper, through the custom properties Kyuubu's list reads. */
const MOVES_LOOK = {
  "--kyuubu-moves-ink": "var(--ink)",
  "--kyuubu-moves-paper": "var(--paper)",
  "--kyuubu-moves-rule": "var(--rule-strong)",
  "--kyuubu-moves-focus": "var(--moss)",
  "--kyuubu-moves-height": "9.5rem",
} as CSSProperties;

/**
 * WHERE A REPLAY STANDS, SAID AND DRAWN: the move it stands at in large type
 * with what it turns in words (Kyuubu's `moveName`, in the reader's language),
 * a scrubber, and the moves as a list of buttons that follows it and takes it
 * anywhere (`KyuubuMoves`, with the arrow keys, Home and End). One panel for
 * every replay of a cube on the site: a finished solve's (`CubeReplay`) and a
 * step of the method's (`CubeLesson`), so they look and work alike.
 *
 * `each` is the turns of each step (`groupCubeSteps`) and `viewing` the step the
 * replay stands at, 0 being before the first. Going anywhere is `go`, which
 * the page turns the cube for. A page that has more to put beside the scrubber
 * (play, pause, the pace) gives it as `transport`, and then the arrows are its
 * own; otherwise a move back and a move on flank the scrubber.
 */
export function CubeReplayPanel({
  size,
  each,
  viewing,
  go,
  startLabel,
  listLabel,
  transport,
  testId = "cube-replay",
}: {
  size: number;
  each: readonly (readonly CubeMove[])[];
  viewing: number;
  go: (to: number) => void;
  /** What stands for the cube before the first move: "The scramble", "The step begins here". */
  startLabel: string;
  /** What the list of moves is called. */
  listLabel: string;
  transport?: ReactNode;
  testId?: string;
}) {
  const say = useSpeaker();
  const language: KyuubuLanguage = say.locale === "ja" ? "ja" : "en";
  const hydrated = useHydrated();
  const last = each.length;
  // What the replay stands at, in code and in words: the turns of the step, a turn of the whole cube first where the step has one.
  const made = viewing === 0 ? [] : each[viewing - 1];
  const turned = made.length === 0 ? "" : movesNotation(made, size);
  const turnedSays = say.list(made.flatMap((move) => moveName(movesNotation([move], size), language) ?? []));
  const where = fill(WORDS[language].playerMoveOf, { at: viewing, total: last });
  const items = useMemo(
    () =>
      each.map((step, index) => {
        const code = movesNotation(step, size);
        const name = step.map((move) => moveName(movesNotation([move], size), language) ?? "").filter((word) => word !== "");
        const said = name.join(" + ");
        return { code, name: said, label: fill(WORDS[language].playerToken, { code, name: said, where: fill(WORDS[language].playerMoveOf, { at: index + 1, total: last }) }) };
      }),
    [each, size, language, last],
  );
  const back = (
    <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => go(viewing - 1)} disabled={viewing === 0} aria-label={say.say("puzzle.replay.back")} data-testid="cube-replay-back">
      ‹
    </button>
  );
  const on = (
    <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => go(viewing + 1)} disabled={viewing === last} aria-label={say.say("puzzle.replay.on")} data-testid="cube-replay-on">
      ›
    </button>
  );
  return (
    <div className="flex flex-col gap-2" data-testid={testId} {...readyMark(hydrated)}>
      <div className="flex min-h-14 items-center gap-3" data-testid="cube-replay-readout">
        <span className="min-w-[4.5ch] rounded-lg border-2 border-ink px-2 py-1 text-center font-mono text-3xl leading-none font-bold text-ink" data-testid="cube-replay-turn" aria-hidden="true">
          {turned === "" ? "–" : turned}
        </span>
        <span className="min-w-0 text-sm font-semibold text-ink" data-testid="cube-replay-says" aria-live="polite">
          {turned === "" ? startLabel : turnedSays}
        </span>
      </div>
      {transport}
      <div className="flex items-center gap-2">
        {transport === undefined ? back : null}
        <input
          type="range"
          min={0}
          max={last}
          value={viewing}
          onChange={(event) => go(Number(event.target.value))}
          className="min-w-0 flex-1 accent-moss"
          aria-label={say.say("puzzle.replay.move")}
          data-testid="cube-replay-scrubber"
        />
        {transport === undefined ? on : null}
        <span className="w-28 text-right text-sm tabular-nums whitespace-nowrap text-muted" data-testid="cube-replay-at">
          {viewing === 0 ? startLabel : where}
        </span>
      </div>
      <KyuubuMoves className="w-full text-ink" style={MOVES_LOOK} locale={language} groups={[{ label: listLabel, main: true, items }]} current={viewing === 0 ? null : viewing - 1} onPick={(index) => go(index + 1)} />
    </div>
  );
}
