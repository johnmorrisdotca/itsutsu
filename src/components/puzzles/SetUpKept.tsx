"use client";

import Link from "@/components/ui/Link";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

/**
 * THE RUN THE READER ALREADY HAS, noted APART from a puzzle's set-up, and
 * naming itself.
 *
 * John, 2026-10-06, on a phone, at the Cube's set-up: "I set up the game as a
 * 2 x 2, go down and then say continue. And it starts with a 3x3 game. It's
 * confusing to offer a continue when I think I was setting up a new game." The
 * Continue was the first of three equal black presses under the choices, and it
 * said nothing about WHICH game it opened: a kept 3×3 Easy of seventy-seven
 * moves, not the 2×2 on the screen. So the run is now a note of its own above
 * the set-up, in a quiet button that says what it resumes (`keptRunDetail`),
 * and the Start presses below it always begin what is chosen.
 *
 * Above the set-up, not among its presses, so it is never the first of the
 * Start column and never the thing a reader at the foot of the options takes
 * for "go". It does not depend on what is chosen, so choosing moves nothing.
 * Several kept: it says how many, and leads to My games.
 */
export function SetUpKept({ href, detail, count }: { href: string; detail: string; count: number }) {
  const say = useSpeaker();
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-rule-strong/60 px-3 py-3" data-testid="set-up-kept" data-count={count}>
      <p className="text-sm font-semibold" data-testid="set-up-kept-title">
        {say.count("live.kept", count)}
      </p>
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} h-auto w-full justify-start py-2 text-left`} data-testid="set-up-resume">
        <span className="flex-1">{say.say("live.keptContinue", { run: detail })}</span>
        <span aria-hidden="true">→</span>
      </Link>
      <p className="text-xs text-muted">{say.say("live.keptNote")}</p>
      {count > 1 ? (
        <Link href="/play" className="text-sm underline underline-offset-4" data-testid="set-up-kept-all">
          {say.say("live.keptMyGames")} →
        </Link>
      ) : null}
    </section>
  );
}
