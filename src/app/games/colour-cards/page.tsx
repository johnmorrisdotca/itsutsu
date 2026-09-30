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

/** The one family this page is for: colour cards, whose games are played round a table and never recorded, so no game's family page can be it (`familyPagePath`). */
const COLOUR_CARDS = GAME_FAMILIES.find((family) => family.key === "colour-cards");

export const metadata: Metadata = { title: COLOUR_CARDS === undefined ? "Colour cards" : `${COLOUR_CARDS.title} ${COLOUR_CARDS.kanji}` };

/**
 * COLOUR CARDS, AT /games/colour-cards: the family of games played with a deck
 * of four colours, numbers and action cards, opened with Hitotsu. Its games
 * are party games, never recorded, so its page is an address of its own in
 * the catalogue's space, as Dominoes' is (`/games/dominoes`), which the gate
 * already opens to anybody: it names games and nobody who plays them.
 */
export default function ColourCardsPage() {
  if (COLOUR_CARDS === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={COLOUR_CARDS.title}
        kanji={COLOUR_CARDS.kanji}
        lead={COLOUR_CARDS.blurb}
        crumb={<GameTrail game={{ label: COLOUR_CARDS.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="colour-cards-family">
        <FamilyMark family={COLOUR_CARDS.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(COLOUR_CARDS)}, played by passing one phone or tablet round the table or on several devices, with a computer in any seat.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(COLOUR_CARDS)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
