import type { ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { GameFamily } from "@/components/games/GameFamily";
import { GameTrail } from "@/components/games/GameTrail";
import { GAME_PICTURE_BOX, GAME_SIDE_COLUMN } from "@/components/games/games.constants";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CardArrow } from "@/components/ui/CardArrow";
import Link from "@/components/ui/Link";
import { PANEL_CLASS, SECTION_TITLE, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { familyOf, familyPagePath } from "@/lib/gomoku/families";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { backgroundPath, passAndPlayPath, rulesPath } from "@/lib/gomoku/slugs";
import { partyBoardsWords, partyPlayersWords, partyRulesPage } from "@/lib/party/partyRulesPage";
import type { PartyKind } from "@/lib/party/party.types";

import { PARTY_KIND_TABLES } from "./partyKindTables";

/**
 * A party game's front door, at /games/<slug>: what every party game's name
 * leads to.
 *
 * The game page's shape with the halves a party game has not got left out:
 * no ladder, no record, no mosaic and no fastest times, because nothing of a
 * game played round one device ever reaches the site to be counted. What is
 * here is what a reader came for — a picture, what it is, the one big Play
 * (which a stranger follows to the door: playing is for members), its family
 * and the way to the rest. Prerendered like every game page: a table, the
 * same for everybody, and nothing read from the database. Open to anybody,
 * as every game's page is — reading is open, and a party game names nobody.
 */
export async function PartyFrontDoor({ kind }: { kind: PartyKind }) {
  const say = await currentSpeaker();
  const page = partyRulesPage(kind, say);
  // A reader of Japanese is shown the game's kanji name, which is its Japanese name, in place of the English label.
  const name = say.pairName(page.title, page.kanji).text;
  const family = familyOf(kind);
  const { Offer } = PARTY_KIND_TABLES[kind];

  return (
    <Page>
      <SiteHeader />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <p className="text-xs text-muted" data-testid="game-crumb">
            <GameTrail game={{ label: name }} />
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start" data-testid="game-front-door" data-kind="party">
            <div className={`${GAME_PICTURE_BOX} flex flex-col gap-2`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
              <img src={page.image} alt={say.say("party.front.picture", { title: name })} className="w-full rounded-xl border border-rule" data-testid="game-picture" />
              {/* The one big Play, under the picture, as on every game's page: to the table, where the game is set up. */}
              <Offer href={passAndPlayPath(kind)} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <PageTitle title={page.title} kanji={page.kanji}>
                <p className="text-sm font-medium">{page.tagline}</p>
              </PageTitle>
              <p className="text-xs text-muted italic">
                {page.from !== null ? (
                  <span className="mr-1.5 not-italic" aria-hidden="true" title={say.say("rules.from", { country: page.from.country })} data-testid="origin-flag" data-country={page.from.code}>
                    {page.from.flag}
                  </span>
                ) : null}
                {page.origin}
              </p>
              {page.alsoKnownAs.length > 0 ? (
                <p className="text-xs text-muted" data-testid="also-known-as">
                  {say.say("rules.alsoKnownAs", { names: say.list(page.alsoKnownAs) })}
                </p>
              ) : null}
              <span className="text-xs text-muted" data-testid="party-offered">
                {say.say("party.front.line", { players: partyPlayersWords(kind, say), boards: partyBoardsWords(kind, say) })}
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
                {say.say("pset.front.fullRules", { title: name })} <span className="font-mincho">規則</span> →
              </Link>
            </p>
          </section>
        </div>

        <aside className={`${GAME_SIDE_COLUMN} flex w-full flex-col gap-4`}>
          <GameFamily variant={kind} />

          <nav className={`${PANEL_CLASS} flex flex-col gap-1 text-sm`} data-testid="game-facets">
            <h2 className={SECTION_TITLE}>
              <Paired en={say.say("pset.front.moreHeading")} kanji="一覧" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
            </h2>
            <div className="-mx-2 flex flex-col">
              <Facet href={rulesPath(kind)}>
                <Paired en={say.say("pset.front.rules")} kanji="規則" kanjiClassName="opacity-70" inReadersLanguage />
              </Facet>
              {/* Its family's own page: a family of party games has one address of its own (`familyPagePath`). */}
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

          {page.wikipedia !== null ? (
            <p className="text-xs text-muted">
              <a href={page.wikipedia} target="_blank" rel="noreferrer noopener" className="underline-offset-2 hover:underline" data-testid="wikipedia-link">
                {say.say("rules.wikipedia", { game: page.inspiredBy ?? name })}
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
