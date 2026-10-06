import Link from "@/components/ui/Link";

import { FigureTable } from "@/components/about/FigureTable";
import { StepFlow } from "@/components/about/StepFlow";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { ACTIVE_GAME_LIMIT } from "@/lib/history/activeGames";
import type { Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { MailTo, rich } from "./about.links";
import { SITE_PAGES } from "./about.pages";

/**
 * GETTING STARTED: what a game here is like from the first click to the
 * ladder, where everything lives, and what "beta" means for the reader.
 *
 * The rest of the page is history and reasons, and a newcomer had to read
 * three chapters of it to learn what they would actually do here. This chapter
 * answers that first, in pictures. The counts are read from the catalogue and
 * the open-or-not column from the gate itself (see `about.pages.ts`).
 */

const aGame = (say: Speaker) => (
  <StepFlow
    label={say.say("about.how.stepsLabel")}
    steps={[
      {
        title: say.say("about.how.choose"),
        kanji: "選ぶ",
        body: say.say("about.how.chooseBody", { games: String(RULE_VARIANT_LIST.length), families: String(GAME_FAMILIES.length) }),
      },
      { title: say.say("about.how.setUp"), kanji: "設定", body: say.say("about.how.setUpBody") },
      { title: say.say("about.how.seat"), kanji: "着席", body: say.say("about.how.seatBody", { bots: String(BOT_TIER_LIST.length) }) },
      { title: say.say("about.how.play"), kanji: "対局", body: say.say("about.how.playBody") },
      { title: say.say("about.how.file"), kanji: "棋譜", body: say.say("about.how.fileBody") },
      { title: say.say("about.how.climb"), kanji: "番付", body: say.say("about.how.climbBody") },
    ]}
    caption={say.say("about.how.stepsCaption", { limit: String(ACTIVE_GAME_LIMIT) })}
  />
);

const whereThingsAre = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.how.pageHead"), say.say("about.how.forHead"), say.say("about.how.noInviteHead")]}
    rows={SITE_PAGES.map((page) => [
      <span key={page.path} className="whitespace-nowrap">
        <Link href={page.path} className="underline decoration-rule underline-offset-2">
          {say.pairName(say.say(page.name), page.kanji).text}
        </Link>{" "}
        {say.pairsWithKanji ? <span className="font-mincho text-xs opacity-70">{page.kanji}</span> : null}
      </span>,
      <span key={`${page.path}-what`} className="text-muted">
        {say.say(page.what)}
      </span>,
      say.say(page.open ? "about.page.open" : "about.page.members"),
    ])}
    caption={say.say("about.how.where")}
  />
);

/** The site as it stands: beta, free, invitation. Every row is a fact a reader can check by trying. */
const theTerms = (say: Speaker) => (
  <FigureTable
    head={["", say.say("about.how.terms", { site: SITE_NAME })]}
    rows={[
      [say.say("about.how.stage"), say.say("about.how.stageBody")],
      [say.say("about.how.price"), say.say("about.how.priceBody")],
      [say.say("about.how.gettingIn"), say.say("about.how.gettingInBody")],
      [say.say("about.how.games"), say.say("about.how.gamesBody", { games: String(RULE_VARIANT_LIST.length) })],
      [say.say("about.how.open"), say.say("about.how.openBody", { limit: String(ACTIVE_GAME_LIMIT) })],
      [say.say("about.how.botsRow"), say.say("about.how.botsRowBody", { bots: String(BOT_TIER_LIST.length) })],
    ]}
    caption={say.say("about.how.termsCaption")}
  />
);

export const howItWorksSection = (say: Speaker): AboutSection => ({
  id: "how",
  title: say.say("about.how.title"),
  chapter: ABOUT_CHAPTERS.start,
  kanji: "一局の流れ",
  paragraphs: [rich(say, "about.how.a", { games: RULE_VARIANT_LIST.length }), rich(say, "about.how.b"), rich(say, "about.how.c")],
  figures: { 0: aGame(say), 2: whereThingsAre(say) },
});

export const betaSection = (say: Speaker): AboutSection => ({
  id: "beta",
  title: say.say("about.beta.title"),
  chapter: ABOUT_CHAPTERS.start,
  kanji: "試験公開",
  paragraphs: [
    rich(say, "about.beta.a"),
    rich(say, "about.beta.b", {}, { mail: <MailTo address={CONTACT_ADDRESS} /> }),
    rich(say, "about.beta.c"),
  ],
  figures: { 0: theTerms(say) },
});
