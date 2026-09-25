import Link from "next/link";
import type { ReactNode } from "react";

import { GameFamily } from "@/components/games/GameFamily";
import { PlayButton } from "@/components/games/PlayButton";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, SECTION_TITLE, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { Suspense } from "react";

import { backgroundPath, familyPath, myGamePath, rulesPath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { puzzleRulesPage } from "@/lib/puzzles/puzzleRulesPage";
import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzleFastest } from "./PuzzleFastest";
import { PuzzlePoints } from "./PuzzlePoints";
import { sizeWord } from "./puzzles.constants";

/**
 * A puzzle's front door, at /games/<slug>: what every puzzle's name leads to.
 *
 * The game page's shape with the halves a puzzle has not got left out: no
 * ladder, no record and no mosaic, because nobody stands anywhere at a
 * puzzle and no solve is kept yet (docs/plans/numbers/NUM-05). What is here
 * is what a reader came for — a picture, what it is, the way in, its family
 * and the way to the rest. Prerendered like the game page: a table, the
 * same for everybody, and nothing read from the database.
 */
export function PuzzleFrontDoor({ kind }: { kind: PuzzleKind }) {
  const page = puzzleRulesPage(kind);
  const spec = PUZZLE_SPECS[kind];

  return (
    <Page>
      <SiteHeader />

      {/*
        THE BOXES ON THE RIGHT START BESIDE THE HEADER. John, 2026-09-24, with a
        game's page open: "move the RHS info area boxes higher. it's buried down
        the page (below the header), but it's important good data so should be
        flush next to header. This will give better balance." So the header is
        the top of the left column rather than a row of its own across the page,
        and from a laptop the side column stands level with it. On a phone it is
        one column in the same order as before: header, panels, then the side.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start" data-testid="game-front-door" data-kind="puzzle">
            <div className="flex w-full flex-col gap-2 sm:w-56 sm:shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
              <img src={page.image} alt={`A ${page.title} puzzle part way through`} className="w-full rounded-xl border border-rule" data-testid="game-picture" />
              {/* The one big Play, under the picture, as on every game's page; alone or a friend is chosen on the set-up. */}
              <PlayButton href={setUpPath(kind)} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <PageTitle title={page.title} kanji={page.kanji}>
                <p className="text-sm font-medium">{page.tagline}</p>
              </PageTitle>
              <p className="text-xs text-muted italic">
                {page.from !== null ? (
                  <span className="mr-1.5 not-italic" aria-hidden="true" title={`From ${page.from.country}`} data-testid="origin-flag" data-country={page.from.code}>
                    {page.from.flag}
                  </span>
                ) : null}
                {page.origin}
              </p>
              {/* Only where it says something: "Our version of Skyscrapers" under "Skyscrapers" does not. */}
              {page.inspiredBy !== undefined && page.inspiredBy !== page.title ? (
                <p className="text-xs text-muted" data-testid="inspired-by">
                  Our version of {page.inspiredBy}.
                </p>
              ) : null}
              {page.alsoKnownAs.length > 0 ? (
                <p className="text-xs text-muted" data-testid="also-known-as">
                  Also known as {page.alsoKnownAs.join(", ")}.
                </p>
              ) : null}
              <span className="text-xs text-muted">
                {spec.offered.map(sizeWord).join(", ")} · {spec.levels.map((level) => PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()).join(", ")}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
          <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-object">
            <h2 className={SECTION_TITLE}>
              The object <span className="font-mincho normal-case tracking-normal">目的</span>
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
              {page.object.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="pt-1 text-sm">
              <Link href={rulesPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="game-rules-link">
                The whole rules of {page.title} <span className="font-mincho">規則</span> →
              </Link>
            </p>
          </section>

          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-72">
          {/* Request time, in a component of its own holding a `connection()`, like the game ladder. */}
          {/* The leaderboard first, where a reader looks first (John: "so prominent and easy to read"), and the fastest times under it. */}
          <Suspense fallback={null}>
            <PuzzlePoints kind={kind} title={page.title} />
          </Suspense>
          <Suspense fallback={null}>
            <PuzzleFastest kind={kind} title={page.title} />
          </Suspense>

          <GameFamily variant={kind} />

          <nav className={`${PANEL_CLASS} flex flex-col gap-1 text-sm`} data-testid="game-facets">
            <h2 className={SECTION_TITLE}>
              All of it <span className="font-mincho normal-case tracking-normal">一覧</span>
            </h2>
            <div className="-mx-2 flex flex-col">
              <Facet href={rulesPath(kind)}>
                Rules <span className="font-mincho opacity-70">規則</span>
              </Facet>
              <Facet href={standingsPath(kind)} testId="facet-standings">
                Fastest solves <span className="font-mincho opacity-70">最速</span>
              </Facet>
              <Facet href={myGamePath(kind)} testId="facet-me">
                Your own solves <span className="font-mincho opacity-70">自分の解</span>
              </Facet>
              <Facet href={familyPath(kind)} testId="facet-family">
                Its family <span className="font-mincho opacity-70">同族</span>
              </Facet>
              <Facet href={backgroundPath(kind)} testId="facet-background">
                Background <span className="font-mincho opacity-70">背景</span>
              </Facet>
            </div>
          </nav>

          {page.wikipedia !== null ? (
            <p className="text-xs text-muted">
              <a href={page.wikipedia} target="_blank" rel="noreferrer noopener" className="underline-offset-2 hover:underline" data-testid="wikipedia-link">
                Read about {page.inspiredBy ?? page.title} on Wikipedia ↗
              </a>
            </p>
          ) : null}
        </aside>
      </div>
    </Page>
  );
}

function Facet({ href, children, testId }: { href: string; children: ReactNode; testId?: string }) {
  return (
    <Link href={href} data-card-link="" className={`${STRETCHED_ROW} flex items-center justify-between gap-2 rounded-md px-2 py-1 underline-offset-2 hover:underline`} data-testid={testId}>
      <span>{children}</span>
      <CardArrow className="size-6" />
    </Link>
  );
}
