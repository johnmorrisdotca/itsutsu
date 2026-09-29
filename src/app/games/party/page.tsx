import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { GAME_FAMILIES, familyCountWords, gamesShownIn } from "@/lib/gomoku/families";

/** The one family this page is for: a shelf of guests, which no game's family page can be (`familyPagePath`). */
const PARTY = GAME_FAMILIES.find((family) => family.key === "party");

export const metadata: Metadata = { title: PARTY === undefined ? "Party games" : `${PARTY.title} ${PARTY.kanji}` };

/**
 * PARTY GAMES, AT /games/party.
 *
 * Every other family's page is under one of its games — /games/renju/family —
 * because "the family Renju is in" is a question about Renju. Party games has
 * no game at home in it: each game on its shelf lives in the family that says
 * what kind of game it is, and is shown here too for the one thing a group
 * wants to know, that the whole table can play it on one device. So its page
 * is an address of its own, in the catalogue's own space, which the gate
 * already opens to anybody: it names games and nobody who plays them.
 *
 * Pure, like every family page: a table in `families.ts`, the same for
 * everybody, prerendered.
 */
export default function PartyGamesPage() {
  if (PARTY === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={PARTY.title}
        kanji={PARTY.kanji}
        lead={PARTY.blurb}
        crumb={<GameTrail game={{ label: PARTY.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="party-family">
        <FamilyMark family={PARTY.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(PARTY)}, each played by passing one phone or tablet round the table, and each listed here
          from the family it lives in.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(PARTY)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
