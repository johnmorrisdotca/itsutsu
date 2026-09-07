"use client";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GameSession } from "./game.types";

/**
 * A rough chance of winning for each colour.
 *
 * Shown as one bar rather than two numbers, because the point is the balance
 * between the sides, not the precision of either figure — and it is labelled
 * an estimate, because that is what it is.
 */
export function WinChanceBar({ session }: { session: GameSession }) {
  const { black, white } = session.winChance;

  return (
    <section className="flex flex-col gap-2" data-testid="win-chance">
      <SectionTitle kanji={GAME_COPY.winChance.kanji}>
        {GAME_COPY.winChance.label}
      </SectionTitle>

      <div
        className="flex h-6 w-full overflow-hidden rounded-full border border-rule"
        role="img"
        aria-label={`Black ${black} percent, White ${white} percent`}
      >
        <div
          className="flex items-center justify-start bg-zinc-900 pl-2 text-[0.7rem] font-semibold text-white transition-[width] duration-500 dark:bg-zinc-100 dark:text-zinc-900"
          style={{ width: `${black}%` }}
        >
          {black >= 18 ? `${black}%` : null}
        </div>
        <div
          className="flex items-center justify-end bg-zinc-200 pr-2 text-[0.7rem] font-semibold text-zinc-800 transition-[width] duration-500 dark:bg-zinc-600 dark:text-zinc-50"
          style={{ width: `${white}%` }}
        >
          {white >= 18 ? `${white}%` : null}
        </div>
      </div>

      <p className="flex justify-between text-[0.7rem] text-muted">
        <span>
          {STONE_DISPLAY.black.label}{" "}
          <span className="font-mincho">{STONE_DISPLAY.black.kanji}</span>
        </span>
        <span>
          {STONE_DISPLAY.white.label}{" "}
          <span className="font-mincho">{STONE_DISPLAY.white.kanji}</span>
        </span>
      </p>
      <p className="text-[0.7rem] leading-snug text-muted">
        {GAME_COPY.winChanceNote}
      </p>
    </section>
  );
}
