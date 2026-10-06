"use client";

import { WORDS, fill, moveName, movementText, movesNotation, rotationKeys, undoOf, type Guide, type KyuubuLanguage } from "@johnmorrisdotca/kyuubu";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";

/**
 * THE NEXT TURN OF A STEP, SAID BESIDE THE ARROW ON THE CUBE (Show the turns):
 * its code in large type, what it turns in words (Kyuubu's `moveName`), where
 * it is in the step, and how to make it by hand: a drag along the arrow, or for a
 * turn of the whole cube, which no drag makes, a key and a button. A turn that
 * was not the one shown is said to be one, with a button to take it back and the
 * arrow showing how. The turns and the words are Kyuubu's (`Guide`), the same
 * guide the package's own demo and the solve's "Show me how" use.
 *
 * `version` is only there so that a guide that has heard a turn is read again.
 */
export function CubeNextTurn({
  guide,
  version,
  n,
  look,
  onMake,
  onTakeBack,
  onHide,
}: {
  guide: Guide;
  version: number;
  n: number;
  /** Whether the layer cannot be seen from where the cube is looked at, so the reader is to look round first. */
  look: boolean;
  onMake: () => void;
  onTakeBack: () => void;
  onHide: () => void;
}) {
  const say = useSpeaker();
  const language: KyuubuLanguage = say.locale === "ja" ? "ja" : "en";
  const words = WORDS[language];
  const next = guide.next;
  const detours = guide.detours;
  const button = `${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`;
  const last = detours.at(-1);
  // On a detour the turn shown is the one that comes back from it, as the arrow on the cube is.
  const shown = last === undefined ? (next?.moves ?? []) : [undoOf(last)];
  const code = next === null ? "" : last === undefined ? next.left : movementText(shown, n);
  const named = code === "" ? "" : (moveName(code, language) ?? "");
  let how = "";
  if (next !== null) {
    if (last !== undefined) how = words.guideOffHow;
    else if (next.rotation) how = fill(words.guideWholeHow, { key: next.moves.map(rotationKeys).join(" "), button: say.say("cubemethod.makeTurn") });
    else if (look) how = words.guideLook;
    else how = next.moves[0]?.turns === 2 ? words.guideDragHalf : words.guideDrag;
  }
  return (
    <div className="flex flex-col gap-2" data-testid="cube-next" data-state={next === null ? "done" : last === undefined ? "on" : "off"} data-turn={code} data-version={version}>
      {next === null ? (
        <p className="text-sm font-semibold text-ink" aria-live="polite" data-testid="cube-next-says">
          {words.guideDone}
        </p>
      ) : (
        <>
          <div className="flex min-h-14 items-center gap-3">
            <span className="min-w-[4.5ch] rounded-lg border-2 border-ink px-2 py-1 text-center font-mono text-3xl leading-none font-bold text-ink" data-testid="cube-next-code" aria-hidden="true">
              {code}
            </span>
            <span className="min-w-0 text-sm font-semibold text-ink" aria-live="polite" data-testid="cube-next-says">
              {named === "" ? code : named}
            </span>
            <span className="ml-auto text-sm tabular-nums whitespace-nowrap text-muted" data-testid="cube-next-at">
              {fill(words.playerMoveOf, { at: next.index + 1, total: next.total })}
            </span>
          </div>
          <p className="text-sm text-muted" data-testid="cube-next-how">
            {how}
          </p>
          {last === undefined ? null : (
            <p className="text-sm font-semibold text-ink" role="alert" data-testid="cube-next-off">
              {fill(words.guideOff, { made: movesNotation(detours, n), wanted: next.left })}
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {last !== undefined ? (
          <button type="button" className={button} onClick={onTakeBack} data-testid="cube-next-takeback">
            {words.guideTakeBack}
          </button>
        ) : null}
        {next !== null ? (
          <button type="button" className={button} onClick={onMake} data-testid="cube-next-make">
            {say.say("cubemethod.makeTurn")}
          </button>
        ) : null}
        <button type="button" className={button} onClick={onHide} data-testid="cube-next-hide">
          {say.say("cubemethod.hideTurns")}
        </button>
      </div>
    </div>
  );
}
