"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";

import { Field, Select } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { completedHref } from "@/lib/history/completedFilter";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MY_GAMES_COPY } from "./mine.constants";

/** What the choices are, read once on the server (`completedChoices`). */
type Choices = { families: { key: string; title: string }[]; games: { slug: string; label: string }[] };

/**
 * THE COMPLETED TAB'S FILTERS: a family and a game, John's "Allow filters. For
 * the game type / family" (2026-09-30). Each writes the address rather than
 * local state (`completedFilter.ts`), so a narrowed list can be linked and
 * reloaded, and each choice in force is said in a chip that takes it off.
 */
export function CompletedFilters({ choices, family, game }: { choices: Choices; family: { key: string; title: string } | null; game: { slug: string; label: string } | null }) {
  const router = useRouter();
  const copy = MY_GAMES_COPY.completedFilters;
  const go = (next: { family: string | null; game: string | null }) => router.push(completedHref(next));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="completed-filters" {...readyMark(useHydrated())}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label={copy.family}>
          <Select value={family?.key ?? ""} onChange={(event) => go({ family: event.target.value || null, game: null })} data-testid="completed-filter-family">
            <option value="">{copy.every}</option>
            {choices.families.map((one) => (
              <option key={one.key} value={one.key}>
                {one.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={copy.game}>
          <Select value={game?.slug ?? ""} onChange={(event) => go({ family: family?.key ?? null, game: event.target.value || null })} data-testid="completed-filter-game">
            <option value="">{copy.every}</option>
            {choices.games.map((one) => (
              <option key={one.slug} value={one.slug}>
                {one.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {family !== null || game !== null ? (
        // Said, with the way off each: a list narrowed silently is a count that lies.
        <p className="flex flex-wrap items-center gap-2 text-xs" data-testid="completed-narrowed">
          <span className="text-muted">{copy.showing}</span>
          {family !== null ? (
            <Link href={completedHref({ game: game?.slug ?? null })} className="rounded-full border border-rule px-2.5 py-1 font-medium" data-testid="completed-narrowed-family" aria-label={copy.takeOff(family.title)}>
              {family.title} ×
            </Link>
          ) : null}
          {game !== null ? (
            <Link href={completedHref({ family: family?.key ?? null })} className="rounded-full border border-rule px-2.5 py-1 font-medium" data-testid="completed-narrowed-game" aria-label={copy.takeOff(game.label)}>
              {game.label} ×
            </Link>
          ) : null}
          <Link href={completedHref({})} className="text-muted underline underline-offset-4" data-testid="completed-narrowed-off">
            {copy.everything}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
