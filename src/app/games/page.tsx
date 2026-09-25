import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { fetchCatalogueStats } from "@/lib/catalogue/catalogueStats";
import { forReader } from "@/lib/catalogue/catalogueReader";
import { GameCatalogue } from "@/components/games/GameCatalogue";
import { readCatalogueView } from "@/lib/gomoku/catalogueView";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { currentReader } from "@/lib/auth/currentReader";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";

import { PublicCatalogue, catalogueFamilies } from "./PublicCatalogue";

export const metadata = { title: "Games 種目" };

// Read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

/**
 * THE GAMES. /games, the library: every game, by family, and the way to each
 * one's rules, record, standings and board.
 *
 * It was three indexes — this page by family, /rules as cards, /games/all as
 * text — and they are three VIEWS now, chosen in the query, because how a list
 * is laid out is a filter and not an identity.
 *
 * AND IT IS ONLY THE LIBRARY. John, 2026-09-24: "Play, New Game and Games is
 * confusing... we have 3 different tabs to play games"; "in Games there is a
 * Post a Seat button which seems to do a lot of what New Game does… Games page
 * has a FULL page of text before you get down to the different families."
 * Those are ItsYourTurn's and GoldToken's three pages, My Games, Start a Game
 * and the game list, and this page had grown a second way to start a game (a
 * one-line form with its own list of games, which had fallen out of step with
 * the set-up screen's families) and the waiting seats above the list it is
 * for. New game is the one place a game is set up, and the seats other
 * members have posted are on My games (`OpenSeatsSection`). What is left is a
 * heading, one line, the door to New game, and the families straight away.
 */
export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const asked = await searchParams;
  // How the catalogue is laid out. A filter, so it lives in the query.
  const view = readCatalogueView(asked);
  const say = await currentSpeaker();
  const reader = await currentReader();
  if (!reader.signedIn) {
    return <PublicCatalogue view={view} say={say} />;
  }
  const stats = await fetchCatalogueStats();

  return (
    <Page>
      <SiteHeader />
      {/*
        A heading and one line, then the games. New game is the button in the
        bar; a second one here, under it, was the same door twice.
      */}
      <PageTitle
        title={say.say("nav.games")}
        kanji="種目"
        lead="Almost every game here is five in a row with one idea changed. Every name leads to that game — its rules, its record, its standings and a board."
      />
      <section className="flex flex-col gap-4">
        <GameCatalogue view={view} families={catalogueFamilies()} stats={forReader(stats, true)} signedIn={reader.signedIn} />
      </section>
      {/*
        LEARN IS OFFERED HERE, PROMINENTLY, AND THAT IS WHY IT LEFT THE
        NAVIGATION. A word in the bar was five words of chrome on every page of
        the site for a shelf most readers want exactly once — when they have
        met a game and want to get better at it. This is where they have just
        met one.

        Written before the bar was shortened, not after: `gamesRoot.coverage`
        fails the build if this section stops leading to /learn, so "it is
        reachable now" is a test rather than the opinion of whoever removed the
        link.
      */}
      <section className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`} data-testid="games-learn">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2 text-base font-semibold">
            <Paired en="Learn how to play them" kanji="学び" kanjiClassName="text-sm font-normal opacity-70" />
          </span>
          <span className="text-sm text-muted">
            The shapes that win, the moves that force, and the mistakes everyone makes once.
            Each guide names the games it applies to.
          </span>
        </span>
        <Link
          href="/learn"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`}
          data-testid="games-learn-link"
        >
          The learning shelf →
        </Link>
      </section>

      {/*
        The famous games, beside the learning shelf and shaped like it: games
        worth studying, from world championships and title matches, each one
        replayed by this site's rules and made into a picture on a press.
      */}
      <section className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`} data-testid="games-famous">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2 text-base font-semibold">
            <Paired en="Famous games" kanji="名局" kanjiClassName="text-sm font-normal opacity-70" />
          </span>
          <span className="text-sm text-muted">
            Title matches and historic games from public-domain records — each one a picture of every move.
          </span>
        </span>
        <Link href="/famous" className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`} data-testid="games-famous-link">
          The famous games →
        </Link>
      </section>

  </Page>
  );
}
