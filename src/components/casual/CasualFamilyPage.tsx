import { notFound } from "next/navigation";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { CASUAL_FAMILY_KEY } from "@/lib/casual/casual.constants";
import { GAME_FAMILIES, familyCountWords, gamesShownIn } from "@/lib/gomoku/families";

/** The one family this page is for: Karakuri, whose games are casual and recorded nowhere, so no game's family page can be its address (`familyPagePath`). */
const KARAKURI = GAME_FAMILIES.find((family) => family.key === CASUAL_FAMILY_KEY);

/** The page's title, for the game page's metadata. */
export const CASUAL_FAMILY_TITLE = KARAKURI === undefined ? "Karakuri" : `${KARAKURI.title} ${KARAKURI.kanji}`;

/**
 * KARAKURI, AT /games/karakuri.
 *
 * Like Party games, a family no recorded game calls home, so it has an
 * address of its own, in the catalogue's own space, which the gate already
 * opens to anybody: it names games and nobody who plays them. Pure, like
 * every family page: a table in `families.data.ts`, the same for everybody,
 * prerendered.
 *
 * ANSWERED BY THE GAME PAGE'S OWN ROUTE (`/games/[slug]`), not a folder of its
 * own, unlike Party games' page: every route in the app adds its manifests to
 * the one function the server pages share (about 35 KB for a page with a
 * header), and that function is against its ceiling (AGENTS.md, Function Size).
 * `families.coverage.test.ts` allows exactly this, by name.
 */
export function CasualFamilyPage() {
  if (KARAKURI === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={KARAKURI.title} kanji={KARAKURI.kanji} lead={KARAKURI.blurb} crumb={<GameTrail game={{ label: KARAKURI.title }} />} />

      <div className="flex items-center gap-4" data-testid="karakuri-family">
        <FamilyMark family={KARAKURI.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(KARAKURI)}, each played alone for a minute or two a level. Nothing here is rated or scored; the levels you win are kept in this browser.
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(KARAKURI)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
