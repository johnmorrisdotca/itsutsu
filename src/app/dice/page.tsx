import { DiceRollerClient } from "@/components/dice/diceClient";
import { OpenSourceCredit } from "@/components/games/OpenSourceCredit";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { GAMES_TABS } from "@/lib/catalogue/gamesTabs";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";

export async function generateMetadata() {
  const say = await currentSpeaker();
  return { title: say.say("pages.diceTitle"), description: say.say("pages.diceDescription") };
}

/**
 * THE DICE ROLLER, a tab of Games like Learning and Famous.
 *
 * John, 2026-09-30: "a really cool random number generator for dice… choose
 * one through five dice… tap the screen to roll and give you information and
 * stats and roll history… used by people that play dungeons and dragons and
 * other games of chance… an open source project… then we will just use that
 * project within this program." So the roller is Korokoro, its own package
 * (`@johnmorrisdotca/korokoro` on npm), and this page only frames it.
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
      <Tabs tabs={GAMES_TABS} active="dice" base="/games" label={say.say("gamepages.catalogueTabs")} />
      <p className="text-sm text-muted">{weave(say.say("pages.diceIntro"), { kanji: <span className="font-mincho">コロコロ</span> })}</p>
      <DiceRollerClient locale={say.tag} />
      <p className="text-xs text-muted" data-testid="dice-about">
        {weave(say.say("pages.diceAbout"), {
          github: (
            <a href="https://github.com/johnmorrisdotca/korokoro" className="underline underline-offset-2 hover:text-ink">
              GitHub
            </a>
          ),
          package: <code>@johnmorrisdotca/korokoro</code>,
        })}
      </p>
      <OpenSourceCredit pkg="korokoro" />
    </Page>
  );
}
