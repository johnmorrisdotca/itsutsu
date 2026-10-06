import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IpBoard } from "@/components/points/IpBoard";
import Link from "@/components/ui/Link";
import { HOUSEKI_FAMILY_KEY } from "@/lib/houseki/houseki.constants";
import { GAME_FAMILIES, gamesShownIn } from "@/lib/gomoku/families";
import { familyCountWords } from "@/lib/gomoku/familyWords";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { scopeOfFamily } from "@/lib/points/ipBoards";
import { setUpPath } from "@/lib/gomoku/slugs";

/** The one family this page is for: Houseki, whose games earn points but make no rating, so no game's rating family page can be its address (`familyPagePath`). */
const HOUSEKI = GAME_FAMILIES.find((family) => family.key === HOUSEKI_FAMILY_KEY);

/** The page's title, for the game page's metadata. */
export const HOUSEKI_FAMILY_TITLE = HOUSEKI === undefined ? HOUSEKI_FAMILY_KEY : `${HOUSEKI.title} ${HOUSEKI.kanji}`;

/**
 * HOUSEKI, AT /games/houseki (AND UNDER EACH OF ITS GAMES, AT /games/<slug>/family).
 *
 * The family of five gem and stone puzzles: its games, what each is, and who has
 * won the most points across all of them (`IpBoard`, shut to a stranger). Answered
 * by the game page's own route, like Karakuri's, and not by a folder of its own: every
 * route in the app adds its manifests to the one function the server pages share,
 * and that function is against its ceiling (AGENTS.md, Function Size).
 */
export async function HousekiFamilyPage() {
  if (HOUSEKI === undefined) notFound();
  const say = await currentSpeaker();
  const scope = scopeOfFamily(HOUSEKI_FAMILY_KEY);
  const first = HOUSEKI.games[0]!;
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={HOUSEKI.title} kanji={HOUSEKI.kanji} lead={familyBlurb(HOUSEKI, say.locale)} crumb={<GameTrail game={{ label: HOUSEKI.title }} />} />

      <div className="flex items-center gap-4" data-testid="houseki-family">
        <FamilyMark family={HOUSEKI.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {familyCountWords(HOUSEKI, say)}. {say.say("houseki.family.note")}
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(HOUSEKI)} />

      {scope === null ? null : (
        <Suspense fallback={null}>
          <IpBoard scope={scope} title={HOUSEKI.title} playHref={setUpPath(first)} testId="houseki-family-ip-board" />
        </Suspense>
      )}

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          {say.say("gamepages.everyFamily")} <span className="font-mincho">全種目</span> →
        </Link>
      </p>
    </Page>
  );
}
