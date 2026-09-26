
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { fetchCatalogueStats } from "@/lib/catalogue/catalogueStats";
import { forReader } from "@/lib/catalogue/catalogueReader";
import { GameCatalogue } from "@/components/games/GameCatalogue";
import { CATALOGUE_VIEWS, readCatalogueView } from "@/lib/gomoku/catalogueView";
import { keptFoldsFrom } from "@/lib/catalogue/familyFolds";
import { cleanPreferences } from "@/lib/preferences/preferences";
import { storedPreferencesFor } from "@/lib/preferences/memberPreferences";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { currentReader } from "@/lib/auth/currentReader";
import { SiteHeader } from "@/components/layout/SiteHeader";

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
  /*
   * Which families this member keeps open, off the member row this render has
   * already read: nothing is asked for it, and only the Families tab asks.
   * A reader with no account keeps them in the browser (`FamilyFold`).
   */
  const [stats, folds] = await Promise.all([
    fetchCatalogueStats(),
    reader.hasAccount && view === CATALOGUE_VIEWS.families
      ? storedPreferencesFor().then((stored) => keptFoldsFrom(cleanPreferences(stored)))
      : Promise.resolve({}),
  ]);

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
        <GameCatalogue view={view} families={catalogueFamilies()} stats={forReader(stats, true)} signedIn={reader.signedIn} folds={folds} keepsFolds={reader.hasAccount} />
      </section>
      {/*
        The learning shelf and the famous games were two panels down here; they
        are tabs of this page now (`GAMES_TABS`), beside Families, Cards and
        Plain list, and each draws the same strip with itself open.
      */}
  </Page>
  );
}
