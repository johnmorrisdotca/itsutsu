"use client";

import { distanceKm, facts } from "@johnmorrisdotca/kuni/facts";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { compassPoint, type CompassPoint, type Point } from "@/lib/puzzles/kuniate/compass";
import { KUNIATE_GUESS_COUNT } from "@/lib/puzzles/kuniate/code";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import { placeName } from "./KuniateClue";

const ARROWS: Record<CompassPoint, { mark: string; word: PhraseKey }> = {
  n: { mark: "↑", word: "pword.kuniate.way.n" },
  ne: { mark: "↗", word: "pword.kuniate.way.ne" },
  e: { mark: "→", word: "pword.kuniate.way.e" },
  se: { mark: "↘", word: "pword.kuniate.way.se" },
  s: { mark: "↓", word: "pword.kuniate.way.s" },
  sw: { mark: "↙", word: "pword.kuniate.way.sw" },
  w: { mark: "←", word: "pword.kuniate.way.w" },
  nw: { mark: "↖", word: "pword.kuniate.way.nw" },
};

/** Where a place is, for measuring: the country's own point, or its capital's where it has no other. */
function whereIs(code: string): Point | null {
  const known = facts(code);
  return known?.point ?? known?.capitalPoint ?? null;
}

/**
 * THE SIX GUESSES, every row drawn from the start and blank until it is used, so the page
 * never moves as a game goes on. A wrong guess says how far it is from the answer and which
 * way to go from it; a place with no point on the map says neither rather than a wrong figure.
 */
export function KuniateRows({ guesses, hidden }: { guesses: readonly string[]; hidden: string }) {
  const say = useSpeaker();
  const to = whereIs(hidden);
  return (
    <ol className="flex flex-col gap-1" data-testid="kuniate-rows">
      {Array.from({ length: KUNIATE_GUESS_COUNT }, (_, at) => {
        const guess = guesses[at];
        if (guess === undefined) return <li key={at} className="h-9 rounded-md border border-dashed border-rule" data-testid="kuniate-row" data-used="false" />;
        const right = guess === hidden;
        const from = whereIs(guess);
        const km = from === null || to === null ? null : Math.round(distanceKm(from, to));
        const point = right ? null : compassPoint(from, to);
        return (
          <li key={at} className={`flex h-9 items-center justify-between gap-3 rounded-md border px-3 text-sm ${right ? "border-moss bg-shade font-semibold" : "border-rule"}`} data-testid="kuniate-row" data-used="true" data-code={guess} data-right={right ? "true" : "false"} data-km={km ?? undefined} data-way={point ?? undefined}>
            <span className="min-w-0 truncate">{placeName(guess, say.locale)}</span>
            {right ? (
              <span aria-hidden="true">✓</span>
            ) : (
              <span className="flex shrink-0 items-center gap-2 tabular-nums text-muted">
                {km === null ? null : <span>{say.say("pword.kuniate.km", { km: say.number(km) })}</span>}
                {point === null ? null : (
                  <span className="text-base text-ink" role="img" aria-label={say.say(ARROWS[point].word)} title={say.say(ARROWS[point].word)}>
                    {ARROWS[point].mark}
                  </span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
