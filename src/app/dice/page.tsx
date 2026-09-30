import { DiceRoller } from "@/components/dice/DiceRoller";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { GAMES_TABS } from "@/lib/catalogue/gamesTabs";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

export const metadata = {
  title: "Dice roller",
  description:
    "Tap to roll one to five dice, d4 to d100, with a bonus, advantage or disadvantage: the total, the exact odds, your roll history and your stats.",
};

/**
 * THE DICE ROLLER, a tab of Games like Learning and Famous.
 *
 * John, 2026-09-30: "a really cool random number generator for dice… choose
 * one through five dice… tap the screen to roll and give you information and
 * stats and roll history… used by people that play dungeons and dragons and
 * other games of chance… an open source project… then we will just use that
 * project within this program." So the roller is Korokoro, the package in
 * `packages/korokoro`, and this page only frames it.
 *
 * Open to strangers (`OPEN_PATHS` in proxy.ts): it names nobody and keeps
 * nothing on the server, and a table reaching for dice should not need an
 * invite first.
 */
export default async function DicePage() {
  const say = await currentSpeaker();
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={say.say("nav.games")} kanji="種目" />
      <Tabs tabs={GAMES_TABS} active="dice" base="/games" label="How to show the games" />
      <p className="text-sm text-muted">
        Korokoro コロコロ, the sound of dice tumbling: tap the felt to roll one to five dice, from a d4 to a d100, and read
        the odds of what you threw. Your rolls stay on this device.
      </p>
      <DiceRoller locale={say.tag} />
      <p className="text-xs text-muted" data-testid="dice-about">
        Every roll comes from your device&apos;s cryptographic generator, so nobody, this site included, can predict or
        steer it; choose a seed under Randomness when a table wants to check a roll. Korokoro is open source under the MIT
        licence, on{" "}
        <a href="https://github.com/johnmorrisdotca/korokoro" className="underline underline-offset-2 hover:text-ink">
          GitHub
        </a>{" "}
        and npm as <code>@johnmorrisdotca/korokoro</code>, for any site or game that wants dice.
      </p>
    </Page>
  );
}
