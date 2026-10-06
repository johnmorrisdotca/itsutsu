import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { currentLocale } from "@/lib/i18n/currentLocale";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { GAME_FAMILIES, familyCountWords, gamesShownIn } from "@/lib/gomoku/families";

/** The one family this page is for: Table cards, whose games are played round one device or on several and never recorded, so no game's family page can be it (`familyPagePath`). */
const TABLE_CARDS = GAME_FAMILIES.find((family) => family.key === "table-cards");

export const metadata: Metadata = { title: TABLE_CARDS === undefined ? "Table cards" : `${TABLE_CARDS.title} ${TABLE_CARDS.kanji}` };

/**
 * TABLE CARDS, AT /games/table-cards: the family of card games a table plays a
 * card at a time, the trick-taking ones first and Hitotsu among them. Its games
 * are party games, played round one device (or, for Hitotsu, on several) and
 * kept in that browser, so its page is an address of its own
 * in the catalogue's space, as Party games' is (`/games/party`), which the
 * gate already opens to anybody: it names games and nobody who plays them.
 */
export default async function TableCardsPage() {
  const locale = await currentLocale();
  if (TABLE_CARDS === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={TABLE_CARDS.title}
        kanji={TABLE_CARDS.kanji}
        lead={familyBlurb(TABLE_CARDS, locale)}
        crumb={<GameTrail game={{ label: TABLE_CARDS.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="table-cards-family">
        <FamilyMark family={TABLE_CARDS.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(TABLE_CARDS)}, played by passing one phone or tablet round the table, or on several devices at Hitotsu, with a computer in any seat.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(TABLE_CARDS)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
