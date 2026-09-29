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

/** The one family this page is for: dominoes, whose games are played round one device and never recorded, so no game's family page can be it (`familyPagePath`). */
const DOMINOES = GAME_FAMILIES.find((family) => family.key === "dominoes");

export const metadata: Metadata = { title: DOMINOES === undefined ? "Dominoes" : `${DOMINOES.title} ${DOMINOES.kanji}` };

/**
 * DOMINOES, AT /games/dominoes: the family of games played with a set of
 * dominoes, opened with Mexican Train. Its games are party games, played round
 * one device and kept in that browser, so its page is an address of its own
 * in the catalogue's space, as Party games' is (`/games/party`), which the
 * gate already opens to anybody: it names games and nobody who plays them.
 */
export default function DominoesPage() {
  if (DOMINOES === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={DOMINOES.title}
        kanji={DOMINOES.kanji}
        lead={DOMINOES.blurb}
        crumb={<GameTrail game={{ label: DOMINOES.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="dominoes-family">
        <FamilyMark family={DOMINOES.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(DOMINOES)}, played by passing one phone or tablet round the table, with a computer in any seat.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(DOMINOES)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
