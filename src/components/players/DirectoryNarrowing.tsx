import Link from "@/components/ui/Link";

import {
  AWAY_AFTER_DAYS,
  DIRECTORY_WHO,
  NO_FILTER,
  filterBarHref,
  type DirectoryFilter,
  type DirectoryWho,
} from "@/lib/rating/directoryFilter";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { SHOW_EVERYBODY_HREF } from "@/lib/rating/rememberedFilter";

import { NARROWING_WORDS } from "./players.constants";
import { FILTER_CHIP, FILTER_CHIP_OFF, WHO_DISPLAY } from "./WhoFilter";

/**
 * SAYING WHAT THE MEMBERS LIST IS NARROWED TO, AND TAKING EACH OFF.
 *
 * The bar above already shows each switch pressed, and the count says "3 of 11
 * listed". John read a page with both switches pressed and "0 of 11 listed"
 * and still saw "no player standings" — a pressed chip reads as decoration, and
 * a count as a count. So a narrowed list says it in words, names each
 * narrowing, and puts the way to take THAT ONE off beside it, the way /history
 * does in chips above its filters. The empty list says the same things where a
 * reader's eye already is: in the table, under its headings.
 *
 * Every link keeps the rest of the address — the sort, the other narrowings —
 * through `filterBarHref`, the bar's own builder, so taking one off never quietly
 * undoes another.
 */

type Narrowing = "who" | "settled" | "active";

/** The narrowings in force, in the order the bar draws them. */
function narrowingsIn(filter: DirectoryFilter): Narrowing[] {
  const on: Narrowing[] = [];
  if (filter.who !== NO_FILTER.who) on.push("who");
  if (filter.settled) on.push("settled");
  if (filter.active) on.push("active");
  return on;
}

function without(filter: DirectoryFilter, one: Narrowing): DirectoryFilter {
  if (one === "who") return { ...filter, who: NO_FILTER.who };
  return one === "settled" ? { ...filter, settled: false } : { ...filter, active: false };
}

function chipName(filter: DirectoryFilter, one: Narrowing, say: Speaker): string {
  return one === "who" ? WHO_DISPLAY[filter.who].label : say.say(NARROWING_WORDS[one].chip);
}

/** The sentence an empty list prints: who nobody here is. */
/** What a list with nobody on it says, by who it was narrowed to: bare, and with the narrowings that emptied it. */
const NOBODY = {
  [DIRECTORY_WHO.people]: { bare: "players.nobodyPerson", where: "players.nobodyPersonWhere" },
  [DIRECTORY_WHO.computers]: { bare: "players.nobodyComputer", where: "players.nobodyComputerWhere" },
  [DIRECTORY_WHO.everyone]: { bare: "players.nobodyAny", where: "players.nobodyAnyWhere" },
} as const satisfies Record<DirectoryWho, { bare: PhraseKey; where: PhraseKey }>;

function nobodyWho(filter: DirectoryFilter, say: Speaker): string {
  const clauses = [
    ...(filter.settled ? [say.say(NARROWING_WORDS.settled.clause)] : []),
    ...(filter.active ? [say.say(NARROWING_WORDS.active.clause, { days: say.number(AWAY_AFTER_DAYS) })] : []),
  ];
  const words = NOBODY[filter.who];
  return clauses.length === 0 ? say.say(words.bare) : say.say(words.where, { clauses: say.list(clauses) });
}

type NarrowingProps = {
  say: Speaker;
  filter: DirectoryFilter;
  /** The address as it stands, so taking one narrowing off keeps the rest. */
  query: string;
  /** The kind of player the page opened with from memory, or null. */
  rememberedWho: DirectoryWho | null;
};

/** The line above the table: "Filtered by" and a chip per narrowing, each with its ×. */
export function DirectoryNarrowed({ say, filter, query, rememberedWho }: NarrowingProps) {
  const on = narrowingsIn(filter);
  if (on.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted" data-testid="directory-narrowed">
      <span>{say.say("players.filteredBy")}</span>
      {on.map((one) => (
        <span key={one} className={`${FILTER_CHIP} ${FILTER_CHIP_OFF} inline-flex items-center gap-1.5`}>
          <span className="text-ink">{chipName(filter, one, say)}</span>
          {one === "who" && rememberedWho !== null ? (
            <span data-testid="narrowed-remembered">({say.say(NARROWING_WORDS.remembered)})</span>
          ) : null}
          <Link
            href={filterBarHref(without(filter, one), query)}
            aria-label={say.say("players.removeChip", { name: chipName(filter, one, say) })}
            className="px-0.5 text-ink hover:text-ink-soft"
            data-testid={`narrowed-off-${one}`}
          >
            ×
          </Link>
        </span>
      ))}
    </p>
  );
}

/**
 * What an empty members list says, inside the table so its headings stay
 * drawn: who nobody here is, a way to take off each narrowing, and a way to
 * take off all of them.
 */
export function DirectoryEmpty({ say, filter, query }: Omit<NarrowingProps, "rememberedWho">) {
  const on = narrowingsIn(filter);
  return (
    <span className="flex flex-col gap-2">
      <span>{nobodyWho(filter, say)}</span>
      {on.length === 0 ? null : (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {on.map((one) => (
            <Link
              key={one}
              href={filterBarHref(without(filter, one), query)}
              className="underline underline-offset-4"
              data-testid={`narrowed-off-${one}`}
            >
              {say.say("players.removeChip", { name: chipName(filter, one, say) })}
            </Link>
          ))}
          {/*
            Says "everyone" out loud rather than pointing at the bare page. A
            bare /players opens with the kind of player last chosen, so a way
            back that went there could re-apply the very narrowing it offers
            to remove, and appear to do nothing at all.
          */}
          <Link href={SHOW_EVERYBODY_HREF} className="underline underline-offset-4" data-testid="directory-clear">
            {say.say("players.showEveryone")}
          </Link>
        </span>
      )}
    </span>
  );
}
