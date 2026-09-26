"use client";

import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { gamePath } from "@/lib/gomoku/slugs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GameStatsStrip } from "@/components/games/GameStats";
import { PuzzleLine } from "@/components/puzzles/PuzzleLine";
import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { GameThumb } from "@/components/games/GameThumb";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, STRETCHED_CARD, STRETCHED_LINK } from "@/components/ui/ui.constants";
import type { CatalogueStats } from "@/lib/catalogue/catalogue.types";
import { CARD_LETTERS, GAME_CARD_KINDS } from "./games.constants";
import type { GameCard } from "./games.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { ViewTabs } from "@/components/ui/ViewTabs";

/** The letter a name files under: its first letter, accents folded, so Misère sits at M. */
function initial(label: string): string {
  return label.normalize("NFD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
}

/**
 * Every game, one card each, with two bars to narrow them: A–Z by first
 * letter, and by what wins — three, four, five or six in a row, or flips.
 * Both live in the query — /games?view=cards&letter=T&kind=4 — so a narrowed
 * list can be linked; a choice nothing matches is shown but cannot be
 * pressed, which tells the reader the shape of the list before they touch it.
 *
 * This was the /rules index, and it is the same component doing the same job
 * one address along. The only thing that changed is where a card leads: to the
 * GAME, which is what a card with a game's name on it is a reference to, and
 * which now carries the rules as well as everything else about it.
 */
export function GameCards({
  cards,
  stats,
  signedIn,
}: {
  cards: GameCard[];
  /**
   * What has been played of each, shaped for this reader already — the same
   * whole `CatalogueStats` the other two views are handed, so the three views
   * of one catalogue take one shape.
   */
  stats: CatalogueStats;
  signedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const chosen = (params.get("letter") ?? "").toUpperCase();
  const kind = params.get("kind") ?? "";
  // Each row narrows within the other's choice, so a letter no game of this kind starts with is out.
  const byKind = kind === "" ? cards : cards.filter((card) => card.kind === kind);
  const byLetter = chosen === "" ? cards : cards.filter((card) => initial(card.label) === chosen);
  const available = new Set(byKind.map((card) => initial(card.label)));
  const kindsAvailable = new Set(byLetter.map((card) => card.kind));
  const shown = byKind.filter((card) => chosen === "" || initial(card.label) === chosen);

  const set = (key: string, value: string, current: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "" || value === current) next.delete(key);
    else next.set(key, value);
    const search = next.toString();
    router.replace(search === "" ? pathname : `${pathname}?${search}`);
  };
  const choose = (letter: string) => set("letter", letter, chosen);
  const chooseKind = (next: string) => set("kind", next, kind);

  return (
    <div className="flex flex-col gap-4">
      {/* Both are choices of what the page lists, so both are tabs (`ViewTabs`); the hydration mark stays on the letters' box, which the specs wait on. */}
      <div data-testid="letter-filter" {...readyMark(useHydrated())}>
        <ViewTabs
          label="Games by first letter"
          items={[
            { key: "all", onClick: () => choose(""), current: chosen === "", testId: "letter-All", label: "All" },
            ...CARD_LETTERS.map((letter) => ({
              key: letter,
              onClick: () => choose(letter),
              current: chosen === letter,
              disabled: !available.has(letter),
              testId: `letter-${letter}`,
              label: <span className="font-mono">{letter}</span>,
            })),
          ]}
        />
      </div>

      <ViewTabs
        label="Games by what wins"
        testId="kind-filter"
        items={[
          { key: "any", onClick: () => chooseKind(""), current: kind === "", testId: "letter-Any", label: "Any" },
          ...GAME_CARD_KINDS.map((option) => ({
            key: option.kind,
            onClick: () => chooseKind(option.kind),
            current: kind === option.kind,
            disabled: !kindsAvailable.has(option.kind),
            testId: `kind-${option.kind}`,
            label: <Paired en={option.label} kanji={option.kanji} kanjiClassName="opacity-70" />,
          })),
        ]}
      />

      {shown.length === 0 ? (
        <p className="text-sm text-muted">No game matches.</p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="game-cards">
        {shown.map((copy) => (
          /*
            THE NAME IS THE CARD'S LINK, STRETCHED OVER IT — no longer the card
            wrapped in one. The card now carries figures that lead elsewhere
            (games played to the record, a top player's record to those games,
            their name to them), and a link cannot hold a link. So this is the
            family cards' construction: the name spread over the face, the
            arrow answering to it, and every other link raised above.
          */
          <li
            key={copy.variant}
            className={`${PANEL_CLASS} ${STRETCHED_CARD} flex h-full items-center justify-between gap-3`}
            data-testid="game-card"
            data-variant={copy.variant}
          >
            {/* The game's board beside its card, as every list that names a game draws it. */}
            <GameThumb variant={copy.variant} size="regular" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={gamePath(copy.variant)}
                data-card-link=""
                className={`${STRETCHED_LINK} flex items-baseline gap-2 font-semibold`}
              >
                <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
              </Link>
              <span className="text-xs text-muted">{copy.tagline}</span>
              {copy.inspiredBy !== undefined ? (
                <span className="text-[0.7rem] text-muted italic">Inspired by {copy.inspiredBy}</span>
              ) : null}
              {isPuzzleKind(copy.variant) ? (
                <PuzzleLine kind={copy.variant} signedIn={signedIn} />
              ) : (
                <GameStatsStrip stats={stats.games[copy.variant]} signedIn={signedIn} compact />
              )}
            </span>
            <CardArrow />
          </li>
        ))}
      </ul>
    </div>
  );
}
