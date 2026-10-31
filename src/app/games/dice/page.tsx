import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FamilyMark } from "@/components/games/FamilyMark";
import { FamilyShelf } from "@/components/games/FamilyShelf";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { Paired } from "@/components/i18n/Paired";
import { pairedText } from "@/lib/gomoku/seatWords";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { GAME_FAMILIES, gamesShownIn } from "@/lib/gomoku/families";
import { familyCountWords } from "@/lib/gomoku/familyWords";

/** The one family this page is for: a family no recorded game calls home, which no game's family page can be (`familyPagePath`). */
const DICE = GAME_FAMILIES.find((family) => family.key === "dice");

export async function generateMetadata(): Promise<Metadata> {
  const say = await currentSpeaker();
  return { title: DICE === undefined ? say.say("gamepages.games") : pairedText(say, DICE.title, DICE.kanji) };
}

/**
 * DICE, AT /games/dice: the family of games played with dice alone. Its games are
 * party games, played round one device or on several and never recorded, so no
 * game's family page can be its page (`familyPagePath`), and it has an address of
 * its own in the catalogue's space, as Party games' is, which the gate already
 * opens to anybody: it names games and nobody who plays them.
 */
export default async function DicePage() {
  const say = await currentSpeaker();
  const locale = say.locale;
  if (DICE === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={DICE.title}
        kanji={DICE.kanji}
        lead={familyBlurb(DICE, locale)}
        crumb={<GameTrail game={{ label: DICE.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="dice-family">
        <FamilyMark family={DICE.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {say.say("gamepages.diceNote", { count: familyCountWords(DICE, say) })}
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(DICE)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          <Paired en={say.say("gamepages.everyFamily")} kanji="全種目" kanjiClassName="font-mincho" /> →
        </Link>
      </p>
    </Page>
  );
}
