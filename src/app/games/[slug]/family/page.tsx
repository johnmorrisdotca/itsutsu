import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameName } from "@/components/games/GameName";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IpBoard } from "@/components/points/IpBoard";
import { pairedText } from "@/lib/gomoku/seatWords";
import { EVERY_GAME_KEY, isCasualKind, isPartyKind, gameNameFor } from "@/lib/catalogue/gameKeys";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { familyOf, gamesShownIn } from "@/lib/gomoku/families";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { gameKeyFor, gamePath, setUpPath, slugFor } from "@/lib/gomoku/slugs";
import { scopeOfFamily } from "@/lib/points/ipBoards";
import { GameTrail } from "@/components/games/GameTrail";
import { Paired } from "@/components/i18n/Paired";
import { weave } from "@/lib/i18n/weave";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/family">): Promise<Metadata> {
  const variant = gameKeyFor((await params).slug);
  const family = variant === null ? null : familyOf(variant);
  const say = await currentSpeaker();
  return { title: family === null ? say.say("gamepages.family") : pairedText(say, family.title, family.kanji) };
}

export function generateStaticParams() {
  // A puzzle's family page is under the puzzle, as a game's is under the game. A party game's family has its own (`familyPagePath`).
  return EVERY_GAME_KEY.filter((variant) => !isPartyKind(variant) && !isCasualKind(variant)).map((variant) => ({ slug: slugFor(variant) }));
}

/**
 * The family a game belongs to, at /games/<slug>/family.
 *
 * Reached from the game rather than from an index of families, which is why it
 * is addressed under the game: "the family Renju is in" is a question about
 * Renju. A reader arrives at it having decided this particular game is not the
 * one — John's last errand, and the one that used to have nowhere at all to go
 * — so what it owes them is the neighbours, in full, with enough of each to
 * choose by.
 *
 * Pure: `GAME_FAMILIES` is a table, the same for everybody, so the whole page
 * prerenders and nothing here reads the database.
 */
export default async function GameFamilyPage({ params }: PageProps<"/games/[slug]/family">) {
  const variant = gameKeyFor((await params).slug);
  /*
   * Not for a party game: its family, Party games, has a page of its own at
   * /games/party (`familyPagePath`), and a second copy of it here would be a
   * second door to one room. Nothing links here for one.
   */
  if (variant === null || isPartyKind(variant) || isCasualKind(variant)) notFound();
  const family = familyOf(variant);
  const say = await currentSpeaker();
  const locale = say.locale;
  // A game in no family is a gap the New Game Gate refuses, but a page must
  // not pretend to an answer it has not got.
  if (family === null) notFound();
  /*
   * The shelf: the family's own games, then any guests listed on it from their
   * own families (`ALSO_LISTED_IN`). The count above them is the family's own —
   * a guest is counted once, at home — and the guests are said apart.
   */
  const shelf = gamesShownIn(family);
  const guests = shelf.filter((shown) => shown.listed === "shelf").length;

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={family.title}
        kanji={family.kanji}
        lead={familyBlurb(family, locale)}
        crumb={<GameTrail game={{ label: gameNameFor(variant, say), href: gamePath(variant), testId: "family-up" }} steps={[{ label: say.say("gamepages.family") }]} />}
      />

      <div className="flex items-center gap-4">
        <FamilyMark family={family.title} size="regular" />
        <p className="text-sm text-muted">
          {/* The game you came from, named and still clickable — it is a game like the rest. */}
          {weave(say.say("gamepages.inThisFamily", { count: say.count("count.gameKind", family.games.length) }), { game: <GameName variant={variant} /> })}
        </p>
      </div>
      {guests > 0 ? (
        <p className="-mt-3 text-sm text-muted" data-testid="family-guest-count">
          {say.say("gamepages.fromOtherFamilies", { count: say.count("count.gameKind", guests) })}
        </p>
      ) : null}

      <FamilyShelf shelf={shelf} current={variant} />

      {/*
        THE FAMILY'S IP BOARD: who has won the most across all its games, this
        month and all time. John, 2026-09-25: "EVERY game in every family is also
        going to have a Leaderboard. So IP matters." The family's home games only,
        the way its counts and its XP are read (AGENTS.md, a family is a game's
        one HOME).
      */}
      {scopeOfFamily(family.key) === null ? null : (
        <Suspense fallback={null}>
          <IpBoard scope={scopeOfFamily(family.key)!} title={family.title} playHref={setUpPath(variant)} testId="family-ip-board" />
        </Suspense>
      )}

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          <Paired en={say.say("gamepages.everyFamily")} kanji="全種目" kanjiClassName="font-mincho" /> →
        </Link>
      </p>
  </Page>
  );
}
