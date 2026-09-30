"use client";

import { DiceRoller as Korokoro } from "@johnmorrisdotca/korokoro/react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { DICE_THEME } from "./dice.constants";

/**
 * Korokoro's tray, with the site's colours and its own place to keep history.
 *
 * The roller is its own open-source package (`packages/korokoro`, published as
 * `@johnmorrisdotca/korokoro`), so this file only says how Itsutsu wears it. Nothing
 * about a roll reaches the server: the dice, the history and the stats all
 * live in this browser, which is what lets the same package run on a free
 * static page too.
 */
export function DiceRoller({ locale }: { locale: string }) {
  const hydrated = useHydrated();
  return (
    <Korokoro
      locale={locale}
      wide
      storageKey="itsutsu.dice.history"
      theme={DICE_THEME}
      data-testid="dice-roller"
      {...readyMark(hydrated)}
      className="min-h-[640px]"
    />
  );
}
