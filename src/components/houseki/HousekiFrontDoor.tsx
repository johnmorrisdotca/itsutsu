import type { ReactNode } from "react";
import { Suspense } from "react";

import { GameFamily } from "@/components/games/GameFamily";
import { GameTrail } from "@/components/games/GameTrail";
import { GAME_PICTURE_BOX, GAME_SIDE_COLUMN } from "@/components/games/games.constants";
import { Paired } from "@/components/i18n/Paired";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IpBoard } from "@/components/points/IpBoard";
import { CardArrow } from "@/components/ui/CardArrow";
import Link from "@/components/ui/Link";
import { PANEL_CLASS, SECTION_TITLE, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { HOUSEKI_SPECS, levelsOf } from "@/lib/houseki/houseki.constants";
import { housekiRulesPage } from "@/lib/houseki/housekiRulesPage";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { backgroundPath, rulesPath, setUpPath } from "@/lib/gomoku/slugs";
import { familyOf, familyPagePath } from "@/lib/gomoku/families";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { scopeOfGame } from "@/lib/points/ipScope";
import { PlayButton } from "@/components/games/PlayButton";

import { HousekiOffer } from "./HousekiOffer";

/**
 * A Houseki game's front door, at /games/<slug>: what every Houseki game's name
 * leads to.
 *
 * The game page's shape with the halves a game played alone has not got: no
 * ladder of ratings, no games to list, no fastest times. What is here is what a
 * reader came for: a picture, what it is, the one big Play (which a stranger
 * follows to the door: playing is for members), the leaderboard of points where
 * the game has one (shut to a stranger, with the way in, as every board of
 * people is), its family and the way to the rest. The page is the same for
 * everybody and read from nothing but the code; the leaderboard is a component of
 * its own, read at request time in its own `connection()`.
 */
export async function HousekiFrontDoor({ kind }: { kind: HousekiKind }) {
  const say = await currentSpeaker();
  const page = housekiRulesPage(kind, say);
  const spec = HOUSEKI_SPECS[kind];
  const family = familyOf(kind);
  // A reader of Japanese is shown the game's kanji name, which is its Japanese name, where a sentence or a trail names it.
  const name = say.pairName(page.title, page.kanji).text;
  return (
    <Page>
      <SiteHeader />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <p className="text-xs text-muted" data-testid="game-crumb">
            <GameTrail game={{ label: name }} />
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start" data-testid="game-front-door" data-kind="houseki">
            <div className={`${GAME_PICTURE_BOX} flex flex-col gap-2`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
              <img src={page.image} alt={say.say("houseki.door.picture", { title: name })} className="w-full rounded-xl border border-rule" data-testid="game-picture" />
              {/* The one big Play, under the picture, as on every game's page: to the set-up, where a level, a lesson, the Daily or a free game is chosen. */}
              <Suspense fallback={<PlayButton href={setUpPath(kind)} />}>
                <HousekiOffer kind={kind} />
              </Suspense>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <PageTitle title={page.title} kanji={page.kanji}>
                <p className="text-sm font-medium">{page.tagline}</p>
              </PageTitle>
              <p className="text-xs text-muted italic">{page.origin}</p>
              <span className="text-xs text-muted" data-testid="houseki-offered">
                {say.say(spec.daily ? "houseki.door.offeredDaily" : "houseki.door.offered", { levels: say.number(levelsOf(kind)), lessons: say.number(spec.lessons) })}
              </span>
            </div>
          </div>
          <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-object">
            <h2 className={SECTION_TITLE}>
              <Paired en={say.say("rules.object")} kanji="目的" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
              {page.object.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="pt-1 text-sm">
              <Link href={rulesPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="game-rules-link">
                <Paired en={say.say("pset.front.fullRules", { title: name })} kanji="規則" kanjiClassName="" inReadersLanguage /> →
              </Link>
            </p>
          </section>
        </div>

        <aside className={`${GAME_SIDE_COLUMN} flex w-full flex-col gap-4`}>
          {/* The leaderboard first, where a reader looks first: who has won the most points at this game. Request time, in a component of its own. */}
          <Suspense fallback={null}>
            <IpBoard scope={scopeOfGame(kind)} title={name} playHref={setUpPath(kind)} stacked testId="houseki-ip-board" />
          </Suspense>

          <GameFamily variant={kind} />

          <nav className={`${PANEL_CLASS} flex flex-col gap-1 text-sm`} data-testid="game-facets">
            <h2 className={SECTION_TITLE}>
              <Paired en={say.say("pset.front.moreHeading")} kanji="一覧" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
            </h2>
            <div className="-mx-2 flex flex-col">
              <Facet href={rulesPath(kind)}>
                <Paired en={say.say("pset.front.rules")} kanji="規則" kanjiClassName="opacity-70" inReadersLanguage />
              </Facet>
              {family !== null ? (
                <Facet href={familyPagePath(family)} testId="facet-family">
                  <Paired en={say.say("puzzle.way.family")} kanji="同族" kanjiClassName="opacity-70" inReadersLanguage />
                </Facet>
              ) : null}
              <Facet href={backgroundPath(kind)} testId="facet-background">
                <Paired en={say.say("pset.front.background")} kanji="背景" kanjiClassName="opacity-70" inReadersLanguage />
              </Facet>
            </div>
          </nav>
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
