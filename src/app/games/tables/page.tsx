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

/** The one family this page is for: Tables, whose games are played round one device or on two and never recorded, so no game's family page can be it (`familyPagePath`). */
const TABLES = GAME_FAMILIES.find((family) => family.key === "tables");

export const metadata: Metadata = { title: TABLES === undefined ? "Tables" : `${TABLES.title} ${TABLES.kanji}` };

/**
 * TABLES, AT /games/tables: backgammon and the games played on its board,
 * played by Sugoroku (`@johnmorrisdotca/sugoroku`). Its games are party games,
 * kept in the browser or on two devices, so its page is an address of its own
 * in the catalogue's space, as Dice's is (`/games/dice`), which the gate
 * already opens to anybody: it names games and nobody who plays them.
 */
export default function TablesPage() {
  if (TABLES === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={TABLES.title}
        kanji={TABLES.kanji}
        lead={TABLES.blurb}
        crumb={<GameTrail game={{ label: TABLES.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="tables-family">
        <FamilyMark family={TABLES.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(TABLES)}, played round one device, on two devices or against the computer at four strengths.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(TABLES)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
