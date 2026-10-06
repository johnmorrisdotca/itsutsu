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
const PARTY = GAME_FAMILIES.find((family) => family.key === "party");

export async function generateMetadata(): Promise<Metadata> {
  const say = await currentSpeaker();
  return { title: PARTY === undefined ? say.say("gamepages.games") : pairedText(say, PARTY.title, PARTY.kanji) };
}

/**
 * PARTY GAMES, AT /games/party.
 *
 * Every other family's page is under one of its games — /games/renju/family —
 * because "the family Renju is in" is a question about Renju. Party games is
 * a shelf first: most games on it live in the family that says what kind of
 * game it is, and are shown here too for the one thing a group wants to know,
 * that the whole table can play it on one device. The games at home here are
 * the party games (`PartyKind`: Dots and Boxes, Mancala), played round one device and
 * never recorded, whose own `/family` is not answered. So its page is an
 * address of its own, in the catalogue's own space, which the gate already
 * opens to anybody: it names games and nobody who plays them.
 *
 * Pure, like every family page: a table in `families.ts`, the same for
 * everybody, prerendered.
 */
export default async function PartyGamesPage() {
  const say = await currentSpeaker();
  const locale = say.locale;
  if (PARTY === undefined) notFound();
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={PARTY.title}
        kanji={PARTY.kanji}
        lead={familyBlurb(PARTY, locale)}
        crumb={<GameTrail game={{ label: PARTY.title }} />}
      />

      <div className="flex items-center gap-4" data-testid="party-family">
        <FamilyMark family={PARTY.title} size="regular" />
        <p className="text-sm text-muted" data-testid="family-guest-count">
          {say.say("gamepages.partyNote", { count: familyCountWords(PARTY, say) })}
        </p>
      </div>

      <FamilyShelf shelf={gamesShownIn(PARTY)} />

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          <Paired en={say.say("gamepages.everyFamily")} kanji="全種目" kanjiClassName="font-mincho" /> →
        </Link>
      </p>
    </Page>
  );
}
